"""
Stripe payment views with production-ready webhook handling.

Key security measures:
  - Webhook signature verification via stripe.Webhook.construct_event()
  - Idempotency: duplicate event IDs are safely skipped
  - Entitlements created ONLY via webhook (never client-initiated)
  - Refund/dispute webhooks revoke entitlements immediately
  - CSRF exemption on webhook endpoint (Stripe cannot send CSRF tokens)
"""

import logging
import stripe
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from marketplace.models import TuneListing, PurchaseEntitlement
from core.models import AuditLog
from core.throttles import PaymentRateThrottle
from .models import PaymentTransaction

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '') or None


class CreatePaymentIntentView(views.APIView):
    """
    Creates a Stripe PaymentIntent for purchasing a tune listing.
    
    The client uses the returned clientSecret to complete payment
    via Stripe's PaymentSheet or Elements SDK.
    
    Entitlements are NOT created here — only via the webhook.
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [PaymentRateThrottle]

    def post(self, request):
        if not stripe.api_key:
            return Response(
                {"error": "Payment processing is not configured on this server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        listing_id = request.data.get('listing_id')
        if not listing_id:
            return Response(
                {"error": "listing_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        listing = get_object_or_404(TuneListing, id=listing_id, is_active=True)

        # Check if user already owns this listing
        existing = PurchaseEntitlement.objects.filter(
            user=request.user,
            listing=listing,
            is_revoked=False,
        ).exists()
        if existing:
            return Response(
                {"error": "You already own this tune."},
                status=status.HTTP_409_CONFLICT
            )

        # Amount in cents
        amount_cents = int(listing.price * 100)
        if amount_cents < 50:  # Stripe minimum is $0.50
            return Response(
                {"error": "Listing price is below minimum charge amount."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='usd',
                metadata={
                    'listing_id': str(listing.id),
                    'user_id': str(request.user.id),
                    'user_email': request.user.email,
                },
                automatic_payment_methods={'enabled': True},
            )

            # Record the transaction as PENDING
            PaymentTransaction.objects.create(
                user=request.user,
                listing=listing,
                stripe_payment_intent_id=intent['id'],
                amount=listing.price,
                currency='usd',
                status=PaymentTransaction.Status.PENDING,
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
            )

            logger.info(
                f"PaymentIntent created: {intent['id']} for user={request.user.id} listing={listing.id}"
            )

            return Response({
                'clientSecret': intent['client_secret'],
                'paymentIntentId': intent['id'],
                'amount': str(listing.price),
                'currency': 'usd',
            })

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating PaymentIntent: {e}")
            return Response(
                {"error": "Payment processing failed. Please try again."},
                status=status.HTTP_400_BAD_REQUEST
            )

    @staticmethod
    def _get_client_ip(request):
        """Extract client IP, respecting X-Forwarded-For behind proxies."""
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        if xff:
            return xff.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


@method_decorator(csrf_exempt, name='dispatch')
class WebhookView(views.APIView):
    """
    Stripe webhook handler with signature verification.
    
    Handles:
      - payment_intent.succeeded → create PurchaseEntitlement
      - charge.refunded → revoke PurchaseEntitlement
      - charge.dispute.created → revoke + flag for review
    
    Security:
      - AllowAny (Stripe has no auth token — we verify via signature)
      - CSRF exempt (POST from Stripe servers)
      - Event ID checked for idempotency
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # Stripe webhook has no Bearer token

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
        webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')

        # ─── Step 1: Verify Stripe Signature ───
        if webhook_secret:
            try:
                event = stripe.Webhook.construct_event(
                    payload, sig_header, webhook_secret
                )
            except ValueError as e:
                logger.warning(f"Webhook: Invalid payload: {e}")
                return Response(
                    {"error": "Invalid payload"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except stripe.error.SignatureVerificationError as e:
                logger.warning(f"Webhook: Invalid signature: {e}")
                return Response(
                    {"error": "Invalid signature"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Dev fallback: parse payload directly (NOT for production)
            import json
            logger.warning("STRIPE_WEBHOOK_SECRET not set — skipping signature verification (DEV ONLY)")
            try:
                event = json.loads(payload) if isinstance(payload, bytes) else payload
            except (json.JSONDecodeError, TypeError):
                return Response(
                    {"error": "Invalid JSON payload"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        event_type = event.get('type', '') if isinstance(event, dict) else event['type']
        event_id = event.get('id', '') if isinstance(event, dict) else event['id']

        logger.info(f"Webhook received: type={event_type} id={event_id}")

        # ─── Step 2: Idempotency Check ───
        if event_id and PaymentTransaction.objects.filter(webhook_event_id=event_id).exists():
            logger.info(f"Webhook event {event_id} already processed — skipping")
            return Response(status=status.HTTP_200_OK)

        # ─── Step 3: Route to Handler ───
        try:
            if event_type == 'payment_intent.succeeded':
                self._handle_payment_success(event, event_id)
            elif event_type == 'charge.refunded':
                self._handle_refund(event, event_id)
            elif event_type == 'charge.dispute.created':
                self._handle_dispute(event, event_id)
            else:
                logger.info(f"Webhook: unhandled event type: {event_type}")
        except Exception as e:
            logger.exception(f"Webhook handler error for {event_type}: {e}")
            # Return 200 even on error to prevent Stripe retries causing data issues
            # The error is logged for investigation

        return Response(status=status.HTTP_200_OK)

    def _handle_payment_success(self, event, event_id: str):
        """
        payment_intent.succeeded → Mark transaction succeeded, create entitlement.
        """
        data = event['data']['object'] if isinstance(event, dict) else event.data.object
        intent_id = data.get('id', '') if isinstance(data, dict) else data['id']
        charge_id = ''
        
        # Extract charge ID from latest_charge
        if isinstance(data, dict):
            charge_id = data.get('latest_charge', '') or ''
        
        metadata = data.get('metadata', {}) if isinstance(data, dict) else getattr(data, 'metadata', {})

        try:
            transaction = PaymentTransaction.objects.get(
                stripe_payment_intent_id=intent_id
            )
        except PaymentTransaction.DoesNotExist:
            logger.error(f"Webhook: No transaction found for PaymentIntent {intent_id}")
            return

        # Update transaction
        transaction.status = PaymentTransaction.Status.SUCCEEDED
        transaction.stripe_charge_id = charge_id
        transaction.webhook_event_id = event_id
        transaction.save(update_fields=['status', 'stripe_charge_id', 'webhook_event_id', 'updated_at'])

        # Create entitlement (idempotent — get_or_create)
        entitlement, created = PurchaseEntitlement.objects.get_or_create(
            user=transaction.user,
            listing=transaction.listing,
            defaults={
                'transaction_id': intent_id,
                'is_revoked': False,
            }
        )

        if created:
            logger.info(
                f"Entitlement created: user={transaction.user.id} listing={transaction.listing.id}"
            )
            # Audit log
            AuditLog.objects.create(
                user=transaction.user,
                action='PURCHASE_TUNE',
                data={
                    'listing_id': str(transaction.listing.id),
                    'listing_title': transaction.listing.title,
                    'amount': str(transaction.amount),
                    'payment_intent_id': intent_id,
                    'entitlement_id': str(entitlement.id) if hasattr(entitlement, 'id') else '',
                },
            )
        else:
            # Re-activate if previously revoked (e.g., refund reversed)
            if entitlement.is_revoked:
                entitlement.is_revoked = False
                entitlement.transaction_id = intent_id
                entitlement.save(update_fields=['is_revoked', 'transaction_id', 'updated_at'])
                logger.info(f"Entitlement re-activated for user={transaction.user.id}")

    def _handle_refund(self, event, event_id: str):
        """
        charge.refunded → Revoke entitlement, update transaction.
        """
        data = event['data']['object'] if isinstance(event, dict) else event.data.object
        charge_id = data.get('id', '') if isinstance(data, dict) else data['id']
        payment_intent_id = data.get('payment_intent', '') if isinstance(data, dict) else getattr(data, 'payment_intent', '')
        
        # Get refund details
        refunds = data.get('refunds', {}) if isinstance(data, dict) else getattr(data, 'refunds', {})
        refund_data_list = refunds.get('data', []) if isinstance(refunds, dict) else []
        
        try:
            transaction = PaymentTransaction.objects.get(
                stripe_payment_intent_id=payment_intent_id
            )
        except PaymentTransaction.DoesNotExist:
            logger.error(f"Webhook: No transaction for charge refund, PI={payment_intent_id}")
            return

        # Update transaction
        transaction.status = PaymentTransaction.Status.REFUNDED
        transaction.webhook_event_id = event_id
        transaction.refunded_at = timezone.now()
        
        if refund_data_list:
            latest_refund = refund_data_list[0]
            transaction.refund_id = latest_refund.get('id', '')
            transaction.refund_amount = latest_refund.get('amount', 0) / 100  # cents → dollars
            transaction.refund_reason = latest_refund.get('reason', 'requested_by_customer')
        
        transaction.save()

        # Revoke entitlement
        revoked_count = PurchaseEntitlement.objects.filter(
            user=transaction.user,
            listing=transaction.listing,
            is_revoked=False,
        ).update(is_revoked=True)

        logger.info(
            f"Refund processed: user={transaction.user.id} listing={transaction.listing.id} "
            f"revoked={revoked_count} entitlements"
        )

        # Audit log
        AuditLog.objects.create(
            user=transaction.user,
            action='REFUND_TUNE',
            data={
                'listing_id': str(transaction.listing.id),
                'refund_amount': str(transaction.refund_amount),
                'reason': transaction.refund_reason,
            },
        )

    def _handle_dispute(self, event, event_id: str):
        """
        charge.dispute.created → Revoke entitlement + flag for admin review.
        
        Disputes are serious — they indicate potential fraud or chargebacks.
        We revoke access immediately and log for investigation.
        """
        data = event['data']['object'] if isinstance(event, dict) else event.data.object
        charge_id = data.get('charge', '') if isinstance(data, dict) else getattr(data, 'charge', '')
        dispute_id = data.get('id', '') if isinstance(data, dict) else data['id']
        reason = data.get('reason', 'unknown') if isinstance(data, dict) else getattr(data, 'reason', 'unknown')
        payment_intent_id = data.get('payment_intent', '') if isinstance(data, dict) else getattr(data, 'payment_intent', '')

        try:
            transaction = PaymentTransaction.objects.get(
                stripe_payment_intent_id=payment_intent_id
            )
        except PaymentTransaction.DoesNotExist:
            logger.error(f"Webhook: No transaction for dispute, PI={payment_intent_id}")
            return

        # Update transaction
        transaction.status = PaymentTransaction.Status.DISPUTED
        transaction.dispute_id = dispute_id
        transaction.dispute_reason = reason
        transaction.disputed_at = timezone.now()
        transaction.webhook_event_id = event_id
        transaction.save()

        # Revoke entitlement
        PurchaseEntitlement.objects.filter(
            user=transaction.user,
            listing=transaction.listing,
        ).update(is_revoked=True)

        logger.warning(
            f"DISPUTE: user={transaction.user.id} listing={transaction.listing.id} "
            f"reason={reason} dispute_id={dispute_id}"
        )

        # Audit log
        AuditLog.objects.create(
            user=transaction.user,
            action='DISPUTE_TUNE',
            data={
                'listing_id': str(transaction.listing.id),
                'dispute_id': dispute_id,
                'reason': reason,
            },
        )

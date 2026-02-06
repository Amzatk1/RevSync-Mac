from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from marketplace.models import TuneListing
from .models import PaymentTransaction
import stripe
import uuid

# Configure Stripe
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', None)

class CreatePaymentIntentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not stripe.api_key:
             return Response({"error": "Stripe is not configured on the server"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        listing_id = request.data.get('listing_id')
        listing = get_object_or_404(TuneListing, id=listing_id)

        # Calculate amount (in cents)
        amount = int(listing.price * 100)

        try:
            # Create Stripe PaymentIntent
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency='usd',
                metadata={'listing_id': str(listing.id), 'user_id': str(request.user.id)},
                automatic_payment_methods={'enabled': True},
            )

            # Create Transaction Record
            PaymentTransaction.objects.create(
                user=request.user,
                listing=listing,
                stripe_payment_intent_id=intent['id'],
                amount=listing.price,
                status='pending'
            )

            return Response({
                'clientSecret': intent['client_secret'],
                'paymentIntentId': intent['id']
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class WebhookView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Mock webhook handler
        # In reality, verify signature and handle event
        payload = request.data
        event_type = payload.get('type')

        if event_type == 'payment_intent.succeeded':
            intent_id = payload['data']['object']['id']
            try:
                transaction = PaymentTransaction.objects.get(stripe_payment_intent_id=intent_id)
                transaction.status = 'succeeded'
                transaction.save()
                
                # Unlock content (Create Purchase Entitlement)
                from marketplace.models import PurchaseEntitlement
                PurchaseEntitlement.objects.get_or_create(user=transaction.user, listing=transaction.listing)
                
            except PaymentTransaction.DoesNotExist:
                pass

        return Response(status=status.HTTP_200_OK)

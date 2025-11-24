from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from marketplace.models import Tune
from .models import PaymentTransaction
import uuid

# Mock Stripe for now
class StripeMock:
    @staticmethod
    def PaymentIntent_create(amount, currency, metadata):
        return {
            'id': f"pi_mock_{uuid.uuid4()}",
            'client_secret': f"pi_mock_secret_{uuid.uuid4()}"
        }

class CreatePaymentIntentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        tune_id = request.data.get('tune_id')
        tune = get_object_or_404(Tune, id=tune_id)

        # Calculate amount (in cents)
        amount = int(tune.price * 100)

        # Create Stripe PaymentIntent (Mocked)
        intent = StripeMock.PaymentIntent_create(
            amount=amount,
            currency='usd',
            metadata={'tune_id': str(tune.id), 'user_id': str(request.user.id)}
        )

        # Create Transaction Record
        PaymentTransaction.objects.create(
            user=request.user,
            tune=tune,
            stripe_payment_intent_id=intent['id'],
            amount=tune.price,
            status='pending'
        )

        return Response({
            'clientSecret': intent['client_secret'],
            'paymentIntentId': intent['id']
        })

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
                
                # Unlock content (Create Purchase record)
                from marketplace.models import Purchase
                Purchase.objects.get_or_create(buyer=transaction.user, tune=transaction.tune)
                
            except PaymentTransaction.DoesNotExist:
                pass

        return Response(status=status.HTTP_200_OK)

from django.urls import path
from .views import CreatePaymentIntentView, WebhookView

urlpatterns = [
    path('create-intent/', CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    path('webhook/', WebhookView.as_view(), name='stripe-webhook'),
]

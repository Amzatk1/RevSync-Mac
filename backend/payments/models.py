"""
Payment models with production-ready fields for Stripe integration.

Supports:
  - Payment intent tracking with idempotency
  - Webhook event deduplication
  - Refund and dispute tracking
  - Full audit trail
"""

from django.db import models
from django.conf import settings
from core.models import TimeStampedModel


class PaymentTransaction(TimeStampedModel):
    """
    Tracks a single Stripe PaymentIntent lifecycle.
    
    Created when user initiates checkout, updated via webhooks.
    Entitlements are ONLY created when status becomes 'succeeded'.
    """

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SUCCEEDED = 'succeeded', 'Succeeded'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'
        DISPUTED = 'disputed', 'Disputed'

    # Core
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    listing = models.ForeignKey(
        'marketplace.TuneListing',
        on_delete=models.CASCADE,
        related_name='transactions'
    )

    # Stripe references
    stripe_payment_intent_id = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="Stripe PaymentIntent ID (pi_...)"
    )
    stripe_charge_id = models.CharField(
        max_length=255,
        blank=True,
        db_index=True,
        help_text="Stripe Charge ID (ch_...) — set on success"
    )

    # Financial
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='usd')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    # Webhook idempotency — prevents double-processing of the same event
    webhook_event_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        unique=True,
        help_text="Stripe Event ID that last updated this record (evt_...)"
    )

    # Refund & Dispute tracking
    refund_id = models.CharField(
        max_length=255,
        blank=True,
        help_text="Stripe Refund ID (re_...) if refunded"
    )
    refund_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Amount refunded (cents → dollars)"
    )
    refund_reason = models.CharField(max_length=255, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)

    dispute_id = models.CharField(
        max_length=255,
        blank=True,
        help_text="Stripe Dispute ID (dp_...) if disputed"
    )
    dispute_reason = models.CharField(max_length=255, blank=True)
    disputed_at = models.DateTimeField(null=True, blank=True)

    # Metadata
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['stripe_payment_intent_id']),
        ]

    def __str__(self):
        return f"{self.user.email} → {self.listing.title} [{self.status}] ${self.amount}"

from django.db import models
from django.contrib.auth import get_user_model
from core.models import TimeStampedModel
from django.utils.translation import gettext_lazy as _

User = get_user_model()

class TunerProfile(TimeStampedModel):
    """
    Profile for users with TUNER role.
    """
    class VerificationLevel(models.TextChoices):
        COMMUNITY = 'COMMUNITY', _('Community Tuner')
        VERIFIED = 'VERIFIED', _('Verified Tuner')
        PRO = 'PRO', _('Pro Tuner')
        MASTER = 'MASTER', _('Master Tuner')

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tuner_profile')
    business_name = models.CharField(max_length=255)
    logo_url = models.URLField(blank=True, null=True)
    specializations = models.JSONField(default=list, help_text="List of specialized brands/ECUs")
    years_experience = models.PositiveIntegerField(default=0)
    
    # Verification & Stats
    verification_level = models.CharField(
        max_length=20,
        choices=VerificationLevel.choices,
        default=VerificationLevel.COMMUNITY
    )
    is_verified_business = models.BooleanField(default=False)
    
    # Aggregated Stats (Updated via signals/tasks)
    total_downloads = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    tunes_published_count = models.PositiveIntegerField(default=0)
    quality_score = models.PositiveIntegerField(default=100, help_text="AI Safety Score (0-100)")

    def __str__(self):
        return self.business_name

class TunerCertification(TimeStampedModel):
    """
    Documents uploaded for verification.
    """
    tuner = models.ForeignKey(TunerProfile, on_delete=models.CASCADE, related_name='certifications')
    document_type = models.CharField(max_length=100) # e.g., "Business License", "Dyno Cert"
    document_url = models.URLField()
    is_approved = models.BooleanField(default=False)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.document_type} - {self.tuner.business_name}"

class TunerReview(TimeStampedModel):
    """
    Reviews left by users for a tuner.
    """
    tuner = models.ForeignKey(TunerProfile, on_delete=models.CASCADE, related_name='reviews')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_reviews')
    rating = models.PositiveSmallIntegerField() # 1-5
    comment = models.TextField(blank=True)

    def __str__(self):
        return f"{self.rating}★ for {self.tuner.business_name}"

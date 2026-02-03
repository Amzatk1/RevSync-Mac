from django.db import models
from django.contrib.auth import get_user_model
from core.models import TimeStampedModel
from django.utils.translation import gettext_lazy as _

User = get_user_model()

class TunerProfile(TimeStampedModel):
    """
    Profile for users with TUNER role. 
    Only created after approval of a TunerApplication.
    """
    class VerificationLevel(models.TextChoices):
        COMMUNITY = 'COMMUNITY', _('Community Tuner')
        VERIFIED = 'VERIFIED', _('Verified Tuner')
        PRO = 'PRO', _('Pro Tuner')
        MASTER = 'MASTER', _('Master Tuner')

    class Tier(models.TextChoices):
        NEW = 'NEW', _('New (Manual Review Required)')
        TRUSTED = 'TRUSTED', _('Trusted (Auto-Approve Enabled)')

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tuner_profile')
    business_name = models.CharField(max_length=255)
    logo_url = models.URLField(blank=True, null=True)
    slug = models.SlugField(unique=True)
    
    # Levels & Permissions
    verification_level = models.CharField(max_length=20, choices=VerificationLevel.choices, default=VerificationLevel.COMMUNITY)
    tier = models.CharField(max_length=20, choices=Tier.choices, default=Tier.NEW)
    is_suspended = models.BooleanField(default=False)
    
    # Stats
    total_downloads = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)

    def __str__(self):
        return self.business_name

class TunerApplication(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Review'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tuner_applications')
    business_name = models.CharField(max_length=255)
    experience_summary = models.TextField()
    website_url = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    reviewer_notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.business_name} ({self.status})"

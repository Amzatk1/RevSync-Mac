from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import TimeStampedModel

class User(AbstractUser):
    """
    Custom User model with Role-Based Access Control.
    """
    class Role(models.TextChoices):
        RIDER = 'RIDER', _('Rider')
        TUNER = 'TUNER', _('Tuner')
        CREATOR = 'CREATOR', _('Creator')
        ADMIN = 'ADMIN', _('Admin')

    # Legacy role retained for backward compatibility; new access is flag-based.
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.RIDER,
        help_text=_("Legacy role; flag-based access is authoritative.")
    )
    email = models.EmailField(_('email address'), unique=True)
    is_verified = models.BooleanField(default=False, help_text=_("Email verification status."))

    # New flag-based permissions
    is_tuner = models.BooleanField(default=False, help_text=_("Approved tuner/publisher"))
    class TunerTier(models.TextChoices):
        NEW = 'NEW', _('New')
        TRUSTED = 'TRUSTED', _('Trusted')
    tuner_tier = models.CharField(max_length=10, choices=TunerTier.choices, default=TunerTier.NEW)
    is_moderator = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return self.email

class UserProfile(TimeStampedModel):
    """
    Extended profile for all users.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    supabase_user_id = models.CharField(max_length=64, unique=True, blank=True, null=True)
    bio = models.TextField(blank=True, max_length=500)
    country = models.CharField(max_length=100, blank=True)
    photo_url = models.URLField(blank=True, null=True)
    
    # Riding Stats
    experience_level = models.CharField(max_length=50, blank=True) # e.g., Beginner, Intermediate, Pro
    riding_style = models.CharField(max_length=50, blank=True) # e.g., Street, Track, Off-road
    risk_tolerance = models.CharField(max_length=50, blank=True) # e.g., Conservative, Balanced, Aggressive
    
    is_garage_public = models.BooleanField(default=True, help_text="Allow others to see your garage.")
    
    last_active = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

class AppSession(TimeStampedModel):
    """
    Track user sessions and devices for security and sync.
    Replaces UserDevice to align with new architecture.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    device_id = models.CharField(max_length=255, help_text="Unique hardware ID or client-generated UUID")
    platform = models.CharField(max_length=50) # e.g., iOS, Android, Web, macOS
    device_name = models.CharField(max_length=100, blank=True) # e.g., "John's iPhone"
    
    refresh_token_hash = models.CharField(max_length=255, blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.CharField(max_length=500, blank=True)
    
    is_revoked = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'device_id')

    def __str__(self):
        return f"{self.device_name} ({self.platform}) - {self.user.username}"

class Follow(TimeStampedModel):
    """
    User following relationship.
    """
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')
    
    class Meta:
        unique_together = ('follower', 'following')
        
    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"

class UserLegalAcceptance(models.Model):
    """
    Audit log of legal document acceptances (Terms, Privacy, Safety).
    Critical for compliance and liability.
    """
    class DocumentType(models.TextChoices):
        TERMS = 'TERMS', _('Terms & Conditions')
        PRIVACY = 'PRIVACY', _('Privacy Policy')
        SAFETY = 'SAFETY', _('Safety Disclaimer')
        REFUND = 'REFUND', _('Refund Policy')
        MARKETING = 'MARKETING', _('Marketing Consent')
        ANALYTICS = 'ANALYTICS', _('Analytics Consent')

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='legal_acceptances')
    document_type = models.CharField(max_length=50, choices=DocumentType.choices)
    version = models.CharField(max_length=20, help_text="e.g., '1.0' or '2026-01'")
    accepted_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    # Snapshot of what they accepted (optional, but good for robust audit)
    # content_hash = models.CharField(max_length=64, blank=True) 

    class Meta:
        ordering = ['-accepted_at']
        indexes = [
            models.Index(fields=['user', 'document_type']),
        ]

    def __str__(self):
        return f"{self.user.username} accepted {self.document_type} v{self.version}"

class UserPreference(TimeStampedModel):
    """
    Store user settings and revocable consents.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='preferences')
    key = models.CharField(max_length=100, db_index=True) # e.g., "analytics_enabled", "safety_mode"
    value = models.JSONField(default=dict) # Flexible storage (bool, string, or complex config)
    
    class Meta:
        unique_together = ('user', 'key')

    def __str__(self):
        return f"{self.user.username}: {self.key}={self.value}"

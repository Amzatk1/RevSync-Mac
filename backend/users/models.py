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

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.RIDER,
        help_text=_("User role determines permissions.")
    )
    email = models.EmailField(_('email address'), unique=True)
    is_verified = models.BooleanField(default=False, help_text=_("Email verification status."))

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return self.email

class UserProfile(TimeStampedModel):
    """
    Extended profile for all users.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
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

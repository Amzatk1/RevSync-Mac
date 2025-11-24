from django.db import models
from django.contrib.auth import get_user_model
from core.models import TimeStampedModel
from tuners.models import TunerProfile

User = get_user_model()

class Tune(TimeStampedModel):
    """
    A tuning file available for purchase/download.
    """
    creator = models.ForeignKey(TunerProfile, on_delete=models.CASCADE, related_name='tunes')
    name = models.CharField(max_length=255)
    description = models.TextField()
    
    # Technical Specs
    vehicle_make = models.CharField(max_length=100)
    vehicle_model = models.CharField(max_length=100)
    vehicle_year_start = models.PositiveIntegerField()
    vehicle_year_end = models.PositiveIntegerField()
    ecu_compatibility = models.JSONField(default=list)
    stage = models.PositiveSmallIntegerField(default=1)
    
    # Performance Stats
    horsepower_gain = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    torque_gain = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    dyno_chart_url = models.URLField(blank=True, null=True)
    
    # File
    file_url = models.URLField(help_text="Secure URL to the tune file")
    file_size_kb = models.PositiveIntegerField()
    
    # Commercial
    price = models.DecimalField(max_digits=8, decimal_places=2)
    
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PUBLISHED = 'PUBLISHED', 'Published'
        ARCHIVED = 'ARCHIVED', 'Archived'
        
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    is_active = models.BooleanField(default=True) # Deprecated in favor of status, but kept for backward compat
    published_at = models.DateTimeField(blank=True, null=True)
    
    # Safety & Meta
    safety_rating = models.PositiveSmallIntegerField(default=10) # 1-10
    compatibility_index = models.PositiveSmallIntegerField(default=100, help_text="0-100 score")
    manifest_json = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    versions = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.name} by {self.creator.business_name}"

class Purchase(TimeStampedModel):
    """
    Record of a user purchasing a tune.
    """
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='purchases')
    tune = models.ForeignKey(Tune, on_delete=models.PROTECT, related_name='purchases')
    price_paid = models.DecimalField(max_digits=8, decimal_places=2)
    transaction_id = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return f"Purchase of {self.tune.name} by {self.buyer.username}"

class TuneComment(TimeStampedModel):
    tune = models.ForeignKey(Tune, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tune_comments')
    content = models.TextField()
    
    def __str__(self):
        return f"Comment by {self.user.username} on {self.tune.name}"

class TuneLike(TimeStampedModel):
    tune = models.ForeignKey(Tune, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='liked_tunes')
    
    class Meta:
        unique_together = ('tune', 'user')
        
    def __str__(self):
        return f"{self.user.username} likes {self.tune.name}"

class Download(TimeStampedModel):
    """
    Audit log of file downloads.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='downloads')
    tune = models.ForeignKey(Tune, on_delete=models.CASCADE, related_name='downloads')
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.user.username} downloaded {self.tune.name}"

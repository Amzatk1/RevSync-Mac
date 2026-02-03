from django.db import models
from django.contrib.auth import get_user_model
from core.models import TimeStampedModel
from tuners.models import TunerProfile
import uuid

User = get_user_model()

class TuneListing(TimeStampedModel):
    """
    The 'Metadata' container for a tune. 
    A listing has many Versions.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tuner = models.ForeignKey(TunerProfile, on_delete=models.CASCADE, related_name='listings')
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    
    # Search / Fitment Filtering
    vehicle_make = models.CharField(max_length=100, db_index=True)
    vehicle_model = models.CharField(max_length=100, db_index=True)
    vehicle_year_start = models.PositiveSmallIntegerField()
    vehicle_year_end = models.PositiveSmallIntegerField()
    
    # Commercial
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.title} ({self.tuner.business_name})"

class TuneVersion(TimeStampedModel):
    """
    An immutable version of a tune (e.g., v1.0.0, v1.0.1).
    This tracks the lifecycle from Upload -> Validation -> Publish.
    """
    class State(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        UPLOADED = 'UPLOADED', 'Uploaded'
        VALIDATING = 'VALIDATING', 'Validating'
        FAILED = 'FAILED', 'Validation Failed'
        READY_FOR_REVIEW = 'READY_FOR_REVIEW', 'Ready for Review'
        APPROVED = 'APPROVED', 'Approved'
        PUBLISHED = 'PUBLISHED', 'Published'
        SUSPENDED = 'SUSPENDED', 'Suspended'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(TuneListing, on_delete=models.CASCADE, related_name='versions')
    version_number = models.CharField(max_length=50) # SemVer recommended
    changelog = models.TextField(blank=True)
    
    # State Machine
    status = models.CharField(max_length=50, choices=State.choices, default=State.DRAFT)
    
    # File References (Supabase Paths)
    quarantine_path = models.CharField(max_length=500, blank=True)
    validated_path = models.CharField(max_length=500, blank=True)
    
    # Security & Integrity
    file_hash_sha256 = models.CharField(max_length=64, blank=True, help_text="SHA256 of the tune.bin")
    manifest_hash_sha256 = models.CharField(max_length=64, blank=True)
    signature_base64 = models.TextField(blank=True, help_text="Ed25519 Signature by RevSync")
    signed_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata extracted from Manifest
    manifest_data = models.JSONField(default=dict, blank=True)
    file_size_bytes = models.BigIntegerField(default=0)
    
    class Meta:
        unique_together = ('listing', 'version_number')

    def __str__(self):
        return f"{self.listing.title} {self.version_number} [{self.status}]"

class ValidationReport(TimeStampedModel):
    """
    Detailed results of the validation pipeline.
    """
    version = models.OneToOneField(TuneVersion, on_delete=models.CASCADE, related_name='validation_report')
    is_passed = models.BooleanField(default=False)
    results = models.JSONField(default=dict) # { "malware": "PASS", "schema": "PASS", "ecu": "FAIL" }
    blockers = models.JSONField(default=list)
    warnings = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

class PurchaseEntitlement(TimeStampedModel):
    """
    Proof that a user owns access to a Listing.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='entitlements')
    listing = models.ForeignKey(TuneListing, on_delete=models.CASCADE, related_name='entitlements')
    transaction_id = models.CharField(max_length=100)
    is_revoked = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('user', 'listing')

    def __str__(self):
        return f"{self.user.username} -> {self.listing.title}"

from django.db import models

class TimeStampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    'created_at' and 'updated_at' fields.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class SoftDeleteModel(TimeStampedModel):
    """
    Abstract model for soft-deletion support (Tombstones).
    """
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        abstract = True

from django.contrib.auth import get_user_model

class AuditLog(models.Model):
    """
    Generic audit log for critical actions.
    """
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=100) # e.g., "PURCHASE_TUNE", "FLASH_ECU"
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.CharField(max_length=500, blank=True)
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} by {self.user} at {self.created_at}"

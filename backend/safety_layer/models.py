from django.db import models
from core.models import TimeStampedModel
from django.contrib.auth import get_user_model

User = get_user_model()

class SafetyReport(TimeStampedModel):
    """
    Stores the result of a safety analysis run.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='safety_reports', null=True, blank=True)
    vehicle = models.ForeignKey('garage.Vehicle', on_delete=models.SET_NULL, null=True, blank=True)
    listing = models.ForeignKey('marketplace.TuneListing', on_delete=models.SET_NULL, null=True, blank=True)
    version = models.ForeignKey('marketplace.TuneVersion', on_delete=models.SET_NULL, null=True, blank=True)
    
    risk_score = models.PositiveSmallIntegerField(help_text="0-100, higher is riskier")
    status = models.CharField(max_length=20, default='SAFE') # SAFE, WARNING, DANGEROUS
    
    input_data = models.JSONField(default=dict)
    analysis_result = models.JSONField(default=dict)
    recommendations = models.JSONField(default=list)

    def __str__(self):
        return f"Safety Report {self.id} - {self.status} ({self.risk_score})"

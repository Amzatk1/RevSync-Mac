from rest_framework import serializers
from .models import SafetyReport

class SafetyReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = SafetyReport
        fields = '__all__'
        read_only_fields = ['user', 'risk_score', 'status', 'analysis_result', 'recommendations']

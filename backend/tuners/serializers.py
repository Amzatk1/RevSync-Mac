from rest_framework import serializers
from .models import TunerApplication

class TunerApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TunerApplication
        fields = ['id', 'business_name', 'experience_summary', 'website_url', 'status', 'created_at', 'reviewer_notes']
        read_only_fields = ['id', 'status', 'reviewer_notes', 'created_at']

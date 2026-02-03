from rest_framework import serializers
from .models import TuneListing, TuneVersion, ValidationReport, PurchaseEntitlement
from tuners.models import TunerProfile

class TunerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TunerProfile
        fields = ['id', 'business_name', 'logo_url', 'verification_level', 'average_rating']

class TuneListingSerializer(serializers.ModelSerializer):
    tuner = TunerProfileSerializer(read_only=True)
    
    class Meta:
        model = TuneListing
        fields = [
            'id', 'tuner', 'title', 'slug', 'description', 
            'vehicle_make', 'vehicle_model', 'vehicle_year_start', 'vehicle_year_end',
            'price', 'created_at'
        ]
        read_only_fields = ['id', 'tuner', 'slug', 'created_at']

class TuneVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TuneVersion
        fields = [
            'id', 'listing', 'version_number', 'changelog', 'status',
            'file_size_bytes', 'signed_at', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'signed_at']

class ValidationReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValidationReport
        fields = ['is_passed', 'results', 'blockers', 'warnings', 'created_at']

class TuneVersionDetailSerializer(TuneVersionSerializer):
    validation_report = ValidationReportSerializer(read_only=True)
    
    class Meta(TuneVersionSerializer.Meta):
        fields = TuneVersionSerializer.Meta.fields + ['validation_report', 'manifest_data']

class PurchaseEntitlementSerializer(serializers.ModelSerializer):
    listing = TuneListingSerializer(read_only=True)
    
    class Meta:
        model = PurchaseEntitlement
        fields = ['id', 'listing', 'transaction_id', 'created_at']

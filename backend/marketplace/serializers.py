from rest_framework import serializers
from .models import TuneListing, TuneVersion, ValidationReport, PurchaseEntitlement
from tuners.models import TunerProfile

class TunerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TunerProfile
        fields = ['id', 'business_name', 'logo_url', 'verification_level', 'average_rating']

class TuneListingSerializer(serializers.ModelSerializer):
    tuner = TunerProfileSerializer(read_only=True)
    latest_version_id = serializers.SerializerMethodField()
    latest_version_number = serializers.SerializerMethodField()
    latest_version_status = serializers.SerializerMethodField()
    
    class Meta:
        model = TuneListing
        fields = [
            'id', 'tuner', 'title', 'slug', 'description', 
            'vehicle_make', 'vehicle_model', 'vehicle_year_start', 'vehicle_year_end',
            'price', 'created_at',
            'latest_version_id', 'latest_version_number', 'latest_version_status',
        ]
        read_only_fields = ['id', 'tuner', 'slug', 'created_at']

    def _latest_published_version(self, obj: TuneListing):
        cached = getattr(obj, '_latest_published_version_cache', None)
        if cached is not None:
            return cached
        version = (
            obj.versions
            .filter(status='PUBLISHED')
            .order_by('-signed_at', '-created_at')
            .first()
        )
        setattr(obj, '_latest_published_version_cache', version)
        return version

    def get_latest_version_id(self, obj: TuneListing):
        version = self._latest_published_version(obj)
        return str(version.id) if version else None

    def get_latest_version_number(self, obj: TuneListing):
        version = self._latest_published_version(obj)
        return version.version_number if version else None

    def get_latest_version_status(self, obj: TuneListing):
        version = self._latest_published_version(obj)
        return version.status if version else None

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

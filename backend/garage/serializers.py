from rest_framework import serializers
from .models import Vehicle, EcuBackup, FlashJob, VehicleDefinition
from marketplace.serializers import TuneListingSerializer, TuneVersionSerializer

class VehicleDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleDefinition
        fields = '__all__'

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'
        read_only_fields = ['user']

class EcuBackupSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcuBackup
        fields = '__all__'
        read_only_fields = ['user', 'file_size_kb', 'checksum']

class FlashJobSerializer(serializers.ModelSerializer):
    tune_detail = TuneListingSerializer(source='tune', read_only=True)
    version_detail = TuneVersionSerializer(source='version', read_only=True)

    class Meta:
        model = FlashJob
        fields = '__all__'
        read_only_fields = [
            'user', 'status', 'progress', 'logs', 'error_message', 'error_code',
            'flash_started_at', 'flash_completed_at', 'total_chunks', 'chunks_sent',
            'ecu_read_data',
        ]


class FlashJobCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new FlashJob (from mobile)."""

    class Meta:
        model = FlashJob
        fields = ['vehicle', 'tune', 'version', 'backup', 'connection_type', 'device_id']


class FlashJobUpdateSerializer(serializers.Serializer):
    """
    Serializer for mobile to update flash job progress.
    Only allows updating status, progress, and logs.
    """
    status = serializers.ChoiceField(choices=FlashJob.Status.choices, required=False)
    progress = serializers.IntegerField(min_value=0, max_value=100, required=False)
    log_message = serializers.CharField(max_length=500, required=False)
    error_message = serializers.CharField(max_length=2000, required=False)
    error_code = serializers.CharField(max_length=50, required=False)
    ecu_read_data = serializers.JSONField(required=False)
    chunks_sent = serializers.IntegerField(min_value=0, required=False)
    total_chunks = serializers.IntegerField(min_value=0, required=False)

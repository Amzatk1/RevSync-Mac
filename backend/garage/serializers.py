from rest_framework import serializers
from .models import Vehicle, EcuBackup, FlashJob
from marketplace.serializers import TuneSerializer
from .models import Vehicle, EcuBackup, FlashJob, VehicleDefinition

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
    tune_detail = TuneSerializer(source='tune', read_only=True)

    class Meta:
        model = FlashJob
        fields = '__all__'
        read_only_fields = ['user', 'status', 'progress', 'logs', 'error_message']

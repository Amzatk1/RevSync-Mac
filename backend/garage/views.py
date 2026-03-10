from rest_framework import generics, permissions
from .models import Vehicle
from .serializers import VehicleSerializer

from core.mixins import LastModifiedSinceMixin

class VehicleListCreateView(LastModifiedSinceMixin, generics.ListCreateAPIView):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user).order_by('-updated_at', '-id')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class VehicleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VehicleSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Vehicle.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        # Soft delete
        from django.utils import timezone
        instance.deleted_at = timezone.now()
        instance.save()

from .models import EcuBackup, FlashJob
from .serializers import (
    EcuBackupSerializer,
    FlashJobSerializer,
    FlashJobCreateSerializer,
    FlashJobUpdateSerializer,
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
import uuid

class EcuBackupListCreateView(LastModifiedSinceMixin, generics.ListCreateAPIView):
    queryset = EcuBackup.objects.all()
    serializer_class = EcuBackupSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user).order_by('-updated_at', '-id')

    def perform_create(self, serializer):
        vehicle = serializer.validated_data.get('vehicle')
        if vehicle.user != self.request.user:
            raise serializers.ValidationError("You can only create backups for your own vehicles.")

        checksum = str(serializer.validated_data.get('checksum', '')).strip().lower()
        file_size_kb = serializer.validated_data.get('file_size_kb')
        storage_key = str(serializer.validated_data.get('storage_key', '')).strip()

        if not storage_key:
            raise serializers.ValidationError("storage_key is required.")

        if not file_size_kb or file_size_kb <= 0:
            raise serializers.ValidationError("file_size_kb must be greater than zero.")

        if len(checksum) != 64 or any(ch not in '0123456789abcdef' for ch in checksum):
            raise serializers.ValidationError("checksum must be a 64-character SHA-256 hex string.")

        serializer.save(
            user=self.request.user,
            checksum=checksum,
            file_size_kb=file_size_kb,
        )

class FlashJobListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return FlashJob.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FlashJobCreateSerializer
        return FlashJobSerializer

    def perform_create(self, serializer):
        tune = serializer.validated_data.get('tune')
        vehicle = serializer.validated_data.get('vehicle')
        version = serializer.validated_data.get('version')
        backup = serializer.validated_data.get('backup')
        
        if not tune or not vehicle:
            raise serializers.ValidationError("Tune and Vehicle are required.")

        # 1. Verify vehicle ownership
        if vehicle.user != self.request.user:
            raise serializers.ValidationError("You can only flash your own vehicles.")

        # 2. Verify backup provenance and readiness when provided
        if backup:
            if backup.user != self.request.user:
                raise serializers.ValidationError("You can only use your own backups.")
            if backup.vehicle_id != vehicle.id:
                raise serializers.ValidationError("Backup does not belong to the selected vehicle.")
            if backup.checksum in {"PENDING_VERIFICATION", "UNVERIFIED"} or backup.file_size_kb <= 0:
                raise serializers.ValidationError("Backup is not verified yet. Create and verify a valid backup first.")

        # 3. Verify version state + fitment when provided
        if version:
            if version.listing_id != tune.id:
                raise serializers.ValidationError("Selected version does not belong to the selected tune.")
            if version.status != version.State.PUBLISHED:
                raise serializers.ValidationError("Only published tune versions can be flashed.")

            manifest_data = version.manifest_data or {}
            fitment = manifest_data.get('bike_fitment') or {}
            supported_ecu = manifest_data.get('supported_ecu') or {}

            fitment_make = str(fitment.get('make', '')).strip().lower()
            fitment_model = str(fitment.get('model', '')).strip().lower()
            year_from = fitment.get('year_from')
            year_to = fitment.get('year_to')

            if fitment_make and fitment_make != vehicle.make.strip().lower():
                raise serializers.ValidationError("Tune version fitment make does not match the selected vehicle.")
            if fitment_model and fitment_model != vehicle.model.strip().lower():
                raise serializers.ValidationError("Tune version fitment model does not match the selected vehicle.")
            if year_from is not None and vehicle.year < int(year_from):
                raise serializers.ValidationError("Selected vehicle is older than the tune version fitment range.")
            if year_to is not None and vehicle.year > int(year_to):
                raise serializers.ValidationError("Selected vehicle is newer than the tune version fitment range.")

            hw_ids = supported_ecu.get('hw_ids') or []
            if vehicle.ecu_id and hw_ids and vehicle.ecu_id not in hw_ids:
                raise serializers.ValidationError("Vehicle ECU ID is not compatible with this tune version.")

        # 4. Verify Entitlement
        if tune.price > 0:
            from marketplace.models import PurchaseEntitlement
            has_entitlement = PurchaseEntitlement.objects.filter(user=self.request.user, listing=tune, is_revoked=False).exists()
            if not has_entitlement:
                raise serializers.ValidationError("You must purchase this tune before flashing.")

        serializer.save(
            user=self.request.user,
            status=FlashJob.Status.CREATED,
            progress=0,
        )

class FlashJobDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return FlashJob.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ('PATCH', 'PUT'):
            return FlashJobUpdateSerializer
        return FlashJobSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', request.method == 'PATCH')
        instance = self.get_object()
        serializer = self.get_serializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        update_fields = ['updated_at']

        for field in ['status', 'progress', 'error_message', 'error_code', 'ecu_read_data', 'chunks_sent', 'total_chunks']:
            if field in data:
                setattr(instance, field, data[field])
                update_fields.append(field)

        if 'log_message' in data:
            instance.add_log(data['log_message'])

        if 'status' in data and data['status'] == FlashJob.Status.FLASHING and not instance.flash_started_at:
            from django.utils import timezone
            instance.flash_started_at = timezone.now()
            update_fields.append('flash_started_at')

        if 'status' in data and data['status'] in (FlashJob.Status.COMPLETED, FlashJob.Status.FAILED) and not instance.flash_completed_at:
            from django.utils import timezone
            instance.flash_completed_at = timezone.now()
            update_fields.append('flash_completed_at')

        # add_log persists immediately, so avoid duplicate save of logs here
        update_fields = [field for field in dict.fromkeys(update_fields) if field != 'logs']
        instance.save(update_fields=update_fields)

        return Response(FlashJobSerializer(instance).data, status=status.HTTP_200_OK)

from .models import VehicleDefinition
from .serializers import VehicleDefinitionSerializer

class VehicleDefinitionListView(generics.ListAPIView):
    """
    Public endpoint to get the vehicle database.
    """
    queryset = VehicleDefinition.objects.all()
    serializer_class = VehicleDefinitionSerializer
    permission_classes = (permissions.AllowAny,) # Public data
    
    def get_queryset(self):
        # Optional filtering
        queryset = super().get_queryset()
        vehicle_type = self.request.query_params.get('type')
        make = self.request.query_params.get('make')
        if vehicle_type:
            queryset = queryset.filter(vehicle_type=vehicle_type)
        if make:
            queryset = queryset.filter(make__iexact=make)
        return queryset

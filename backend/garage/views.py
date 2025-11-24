from rest_framework import generics, permissions
from .models import Vehicle
from .serializers import VehicleSerializer

from core.mixins import LastModifiedSinceMixin

class VehicleListCreateView(LastModifiedSinceMixin, generics.ListCreateAPIView):
    serializer_class = VehicleSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

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
from .serializers import EcuBackupSerializer, FlashJobSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
import uuid

class EcuBackupListCreateView(LastModifiedSinceMixin, generics.ListCreateAPIView):
    serializer_class = EcuBackupSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    def perform_create(self, serializer):
        # In real app, validate file upload/checksum here
        serializer.save(
            user=self.request.user,
            file_size_kb=1024, # Mock size
            checksum=str(uuid.uuid4()) # Mock checksum
        )

class FlashJobListCreateView(generics.ListCreateAPIView):
    serializer_class = FlashJobSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return FlashJob.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        tune = serializer.validated_data.get('tune')
        vehicle = serializer.validated_data.get('vehicle')
        
        if not tune or not vehicle:
            raise serializers.ValidationError("Tune and Vehicle are required.")

        # 1. Verify vehicle ownership
        if vehicle.user != self.request.user:
            raise serializers.ValidationError("You can only flash your own vehicles.")

        # 2. Verify compatibility (Mock logic)
        # In reality, check tune.ecu_compatibility vs vehicle.ecu_type
        # if vehicle.ecu_type not in tune.ecu_compatibility:
        #     raise serializers.ValidationError("Tune is not compatible with this ECU.")

        # 3. Verify purchase (if paid)
        if tune.price > 0:
            from marketplace.models import Purchase
            has_purchased = Purchase.objects.filter(user=self.request.user, tune=tune).exists()
            if not has_purchased:
                raise serializers.ValidationError("You must purchase this tune before flashing.")

        serializer.save(user=self.request.user)

class FlashJobDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = FlashJobSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return FlashJob.objects.filter(user=self.request.user)

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

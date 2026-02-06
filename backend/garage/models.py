from django.db import models
from django.contrib.auth import get_user_model
from core.models import TimeStampedModel, SoftDeleteModel

User = get_user_model()

class Vehicle(SoftDeleteModel):
    """
    A vehicle in a user's garage.
    """
    class VehicleType(models.TextChoices):
        BIKE = 'BIKE', 'Motorcycle'
        CAR = 'CAR', 'Car'


    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vehicles')
    name = models.CharField(max_length=100, help_text="Nickname for the vehicle")
    vehicle_type = models.CharField(max_length=10, choices=VehicleType.choices, default=VehicleType.BIKE)
    
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveIntegerField()
    vin = models.CharField(max_length=17, blank=True, null=True)
    
    # ECU Info
    ecu_type = models.CharField(max_length=50, blank=True, help_text="e.g. Bosch, Keihin")
    ecu_id = models.CharField(max_length=100, blank=True, help_text="ECU Hardware ID")
    ecu_software_version = models.CharField(max_length=100, blank=True)
    
    # Mods
    modifications = models.JSONField(default=list, blank=True, help_text="List of installed mods")
    
    photo_url = models.URLField(blank=True, null=True)
    public_visibility = models.BooleanField(default=False, help_text="Visible to other users?")

    def __str__(self):
        return f"{self.year} {self.make} {self.model} ({self.user.username})"

class EcuBackup(SoftDeleteModel):
    """
    Backup of a vehicle's ECU stock file.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='backups')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='backups')
    storage_key = models.CharField(max_length=255, help_text="Path in storage bucket")
    checksum = models.CharField(max_length=64, help_text="SHA-256 checksum")
    file_size_kb = models.PositiveIntegerField()
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Backup for {self.vehicle} ({self.created_at.date()})"

class FlashJob(TimeStampedModel):
    """
    Track the status of an ECU flash operation.
    """
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        FLASHING = 'FLASHING', 'Flashing'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flash_jobs')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='flash_jobs')
    tune = models.ForeignKey('marketplace.TuneListing', on_delete=models.SET_NULL, null=True, blank=True, related_name='flash_jobs')
    version = models.ForeignKey('marketplace.TuneVersion', on_delete=models.SET_NULL, null=True, blank=True, related_name='flash_jobs')
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    progress = models.PositiveSmallIntegerField(default=0, help_text="0-100")
    logs = models.JSONField(default=list, blank=True)
    error_message = models.TextField(blank=True)

    def __str__(self):
        return f"Flash {self.status} - {self.vehicle}"

class VehicleDefinition(TimeStampedModel):
    """
    Reference database of supported vehicles.
    """
    class VehicleType(models.TextChoices):
        BIKE = 'BIKE', 'Motorcycle'
        CAR = 'CAR', 'Car'

    vehicle_type = models.CharField(max_length=10, choices=VehicleType.choices, default=VehicleType.BIKE)
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveIntegerField()
    
    # Specs
    stock_hp = models.FloatField(default=0)
    stock_torque = models.FloatField(default=0)
    
    class Meta:
        ordering = ['make', 'model', '-year']
        unique_together = ['make', 'model', 'year']

    def __str__(self):
        return f"{self.year} {self.make} {self.model}"

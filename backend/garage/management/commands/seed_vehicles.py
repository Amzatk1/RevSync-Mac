from django.core.management.base import BaseCommand
from garage.models import VehicleDefinition

class Command(BaseCommand):
    help = 'Seeds the vehicle definition database'

    def handle(self, *args, **options):
        self.stdout.write('Seeding vehicle definitions...')
        
        # Clear existing? No, let's use update_or_create to be safe and idempotent
        # VehicleDefinition.objects.all().delete()
        
        definitions = [
            # Yamaha
            {"make": "Yamaha", "model": "R1", "year": 2024, "type": "BIKE", "hp": 198, "torque": 112},
            {"make": "Yamaha", "model": "R1", "year": 2023, "type": "BIKE", "hp": 198, "torque": 112},
            {"make": "Yamaha", "model": "R1", "year": 2022, "type": "BIKE", "hp": 198, "torque": 112},
            {"make": "Yamaha", "model": "R6", "year": 2020, "type": "BIKE", "hp": 117, "torque": 61},
            {"make": "Yamaha", "model": "MT-09", "year": 2024, "type": "BIKE", "hp": 117, "torque": 93},
            
            # Honda
            {"make": "Honda", "model": "CBR1000RR-R", "year": 2024, "type": "BIKE", "hp": 214, "torque": 113},
            {"make": "Honda", "model": "CBR600RR", "year": 2024, "type": "BIKE", "hp": 119, "torque": 64},
            
            # Kawasaki
            {"make": "Kawasaki", "model": "ZX-10R", "year": 2024, "type": "BIKE", "hp": 200, "torque": 114},
            {"make": "Kawasaki", "model": "ZX-6R", "year": 2024, "type": "BIKE", "hp": 122, "torque": 69},
            
            # BMW
            {"make": "BMW", "model": "S1000RR", "year": 2024, "type": "BIKE", "hp": 205, "torque": 113},
            
            # Ducati
            {"make": "Ducati", "model": "Panigale V4", "year": 2024, "type": "BIKE", "hp": 210, "torque": 122},
        ]
        
        created_count = 0
        updated_count = 0
        
        for d in definitions:
            obj, created = VehicleDefinition.objects.update_or_create(
                make=d["make"],
                model=d["model"],
                year=d["year"],
                defaults={
                    "vehicle_type": d["type"],
                    "stock_hp": d["hp"],
                    "stock_torque": d["torque"]
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1
            
        self.stdout.write(self.style.SUCCESS(f'Seeding complete: {created_count} created, {updated_count} updated.'))

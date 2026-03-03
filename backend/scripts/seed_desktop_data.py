"""
Comprehensive seed script for RevSync Desktop App.

Run:
    cd backend && python manage.py shell < scripts/seed_desktop_data.py

Creates:
  - Superuser: admin@revsync.com / revsync2024
  - TunerProfile for that user
  - 3 Vehicles with ECU info
  - 6 TuneListings with PUBLISHED TuneVersions
  - Entitlements for all tunes
  - 5 FlashJobs with varied statuses
  - ECU Backups for each vehicle
"""
import os, sys, django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revsync_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from tuners.models import TunerProfile
from marketplace.models import TuneListing, TuneVersion, PurchaseEntitlement
from garage.models import Vehicle, FlashJob, EcuBackup
from users.models import UserProfile
from django.utils import timezone
from datetime import timedelta
import uuid

User = get_user_model()

# ──────────── 1. Superuser ────────────
user, created = User.objects.get_or_create(
    email='admin@revsync.com',
    defaults={
        'username': 'admin',
        'first_name': 'RevSync',
        'last_name': 'Admin',
        'role': 'ADMIN',
        'is_staff': True,
        'is_superuser': True,
        'is_verified': True,
        'is_tuner': True,
        'tuner_tier': 'TRUSTED',
    }
)
if created:
    user.set_password('revsync2024')
    user.save()
    UserProfile.objects.get_or_create(user=user)
    print('[+] Created superuser admin@revsync.com / revsync2024')
else:
    print('[=] Superuser already exists')

# ──────────── 2. TunerProfile ────────────
tuner, _ = TunerProfile.objects.get_or_create(
    user=user,
    defaults={
        'business_name': 'RevSync Motorsport',
        'slug': 'revsync-motorsport',
        'verification_level': 'PRO',
        'tier': 'TRUSTED',
        'total_downloads': 1247,
        'average_rating': 4.85,
    }
)
print(f'[=] TunerProfile: {tuner.business_name}')

# ──────────── 3. Vehicles with ECU data ────────────
vehicles_data = [
    {
        'name': 'ZX-6R Race Build',
        'make': 'Kawasaki', 'model': 'Ninja ZX-6R', 'year': 2022,
        'vin': 'JKAZX6R22FA12345',
        'ecu_type': 'Keihin', 'ecu_id': '21175-1652',
        'ecu_software_version': 'K-ECU-636-v3.1.2',
        'modifications': ['Akrapovic Full System', 'Power Commander V', 'BMC Race Filter'],
    },
    {
        'name': 'R1M Track Monster',
        'make': 'Yamaha', 'model': 'YZF-R1M', 'year': 2024,
        'vin': 'JYARN70E9X210042',
        'ecu_type': 'Denso', 'ecu_id': '2CR-8591A-01',
        'ecu_software_version': 'D-R1M-CP4-v2.0.8',
        'modifications': ['Graves Motorsports Ti', 'Öhlins FG/TTX', 'Spider Rearsets'],
    },
    {
        'name': 'CBR Fireblade',
        'make': 'Honda', 'model': 'CBR1000RR-R SP', 'year': 2023,
        'vin': 'JH2SC828B44000123',
        'ecu_type': 'Keihin', 'ecu_id': '38770-MKR-D11',
        'ecu_software_version': 'H-CBR-SP-v4.0.3',
        'modifications': ['SC-Project S1 Full', 'Brembo GP4-MS', 'Ohlins Smart EC 2.0'],
    },
]
vehicles = []
for vd in vehicles_data:
    v, created = Vehicle.objects.get_or_create(
        user=user, make=vd['make'], model=vd['model'], year=vd['year'],
        defaults={**vd, 'vehicle_type': 'BIKE'}
    )
    vehicles.append(v)
    print(f'  {"[+]" if created else "[=]"} Vehicle: {v.year} {v.make} {v.model}')

# ──────────── 4. ECU Backups ────────────
for v in vehicles:
    backup, created = EcuBackup.objects.get_or_create(
        user=user, vehicle=v,
        defaults={
            'storage_key': f'backups/{user.id}/{v.id}/stock_{v.ecu_id}.bin',
            'checksum': 'a1b2c3d4e5f6' * 5 + 'a1b2',
            'file_size_kb': 512,
            'notes': f'Stock backup for {v.year} {v.make} {v.model}',
        }
    )
    if created:
        print(f'  [+] Backup: {v.make} {v.model}')

# ──────────── 5. TuneListings + Published Versions ────────────
listings_data = [
    {
        'title': 'ZX-6R Stage 2 Race Map',
        'slug': 'zx6r-stage2-race',
        'description': 'Full race tune: exhaust servo delete, top-speed limiter removed, optimised fuel/ignition maps for Akrapovic full system. Dyno-tested +8.2 HP peak gain.',
        'vehicle_make': 'Kawasaki', 'vehicle_model': 'Ninja ZX-6R',
        'vehicle_year_start': 2019, 'vehicle_year_end': 2023, 'price': 149.99,
        'version': '4.2.0', 'file_size': 4300000,
        'changelog': 'v4.2.0 — Refined mid-range fuelling, fixed decel pop, improved cold-start enrichment.',
    },
    {
        'title': 'ZX-6R Track Day Quick Map',
        'slug': 'zx6r-trackday-quick',
        'description': 'Quick-switch track day map with aggressive ignition, disabled O2 sensors, and raised rev ceiling. Requires full exhaust.',
        'vehicle_make': 'Kawasaki', 'vehicle_model': 'Ninja ZX-6R',
        'vehicle_year_start': 2019, 'vehicle_year_end': 2023, 'price': 99.99,
        'version': '1.3.0', 'file_size': 3200000,
        'changelog': 'v1.3.0 — Initial public release, tested on 3 bikes.',
    },
    {
        'title': 'R1M Street Stage 1',
        'slug': 'r1m-street-stage1',
        'description': 'Refined street tune for smooth power delivery and improved throttle response. Keeps cats, AIS, and all emissions gear. +5 HP, much smoother.',
        'vehicle_make': 'Yamaha', 'vehicle_model': 'YZF-R1M',
        'vehicle_year_start': 2022, 'vehicle_year_end': 2025, 'price': 199.99,
        'version': '2.1.0', 'file_size': 3800000,
        'changelog': 'v2.1.0 — Added quickshifter calibration, improved cruise stability.',
    },
    {
        'title': 'R1M Full Race Kit',
        'slug': 'r1m-full-race',
        'description': 'Race-only ECU flash: launch control, pit limiter, aggressive maps, disabled immobiliser. NOT street legal.',
        'vehicle_make': 'Yamaha', 'vehicle_model': 'YZF-R1M',
        'vehicle_year_start': 2022, 'vehicle_year_end': 2025, 'price': 349.99,
        'version': '1.0.0', 'file_size': 4100000,
        'changelog': 'v1.0.0 — Initial release. Full race specification.',
    },
    {
        'title': 'CBR Track Pack',
        'slug': 'cbr-track-pack',
        'description': 'Full track-spec with launch control, pit limiter, aggressive ignition timing, and anti-wheelie calibration.',
        'vehicle_make': 'Honda', 'vehicle_model': 'CBR1000RR-R SP',
        'vehicle_year_start': 2020, 'vehicle_year_end': 2024, 'price': 249.99,
        'version': '3.0.0', 'file_size': 5100000,
        'changelog': 'v3.0.0 — Major rewrite with new fuel model, smoother transitions.',
    },
    {
        'title': 'CBR Street Performance',
        'slug': 'cbr-street-perf',
        'description': 'Emissions-compliant street performance tune. Improved throttle mapping, smoother fuelling through all modes.',
        'vehicle_make': 'Honda', 'vehicle_model': 'CBR1000RR-R SP',
        'vehicle_year_start': 2020, 'vehicle_year_end': 2024, 'price': 179.99,
        'version': '2.0.1', 'file_size': 3600000,
        'changelog': 'v2.0.1 — Fixed Mode 3 over-fuelling at 7k RPM.',
    },
]

listings = []
for ld in listings_data:
    listing, created = TuneListing.objects.get_or_create(
        slug=ld['slug'],
        defaults={
            'tuner': tuner,
            'title': ld['title'],
            'description': ld['description'],
            'vehicle_make': ld['vehicle_make'],
            'vehicle_model': ld['vehicle_model'],
            'vehicle_year_start': ld['vehicle_year_start'],
            'vehicle_year_end': ld['vehicle_year_end'],
            'price': ld['price'],
        }
    )
    listings.append(listing)
    print(f'  {"[+]" if created else "[=]"} Listing: {listing.title}')

    ver, v_created = TuneVersion.objects.get_or_create(
        listing=listing, version_number=ld['version'],
        defaults={
            'status': 'PUBLISHED',
            'changelog': ld['changelog'],
            'file_hash_sha256': uuid.uuid4().hex + uuid.uuid4().hex,
            'file_size_bytes': ld['file_size'],
            'signed_at': timezone.now() - timedelta(days=3),
        }
    )
    if v_created:
        print(f'    [+] Version {ld["version"]} (PUBLISHED)')

# ──────────── 6. Entitlements ────────────
for listing in listings:
    ent, created = PurchaseEntitlement.objects.get_or_create(
        user=user, listing=listing,
        defaults={'transaction_id': f'txn_seed_{listing.slug}_{uuid.uuid4().hex[:8]}'}
    )
    if created:
        print(f'  [+] Entitlement → {listing.title}')

# ──────────── 7. FlashJobs ────────────
now = timezone.now()
flash_data = [
    {
        'vehicle': vehicles[0], 'tune': listings[0], 'status': 'COMPLETED', 'progress': 100,
        'flash_started_at': now - timedelta(hours=4), 'flash_completed_at': now - timedelta(hours=3, minutes=55),
        'logs': [
            {'timestamp': (now - timedelta(hours=4)).isoformat(), 'message': 'Flash job initiated'},
            {'timestamp': (now - timedelta(hours=3, minutes=59)).isoformat(), 'message': 'Pre-flight check passed'},
            {'timestamp': (now - timedelta(hours=3, minutes=58)).isoformat(), 'message': 'Backup created: stock_21175-1652.bin'},
            {'timestamp': (now - timedelta(hours=3, minutes=57)).isoformat(), 'message': 'Writing block 1/16...'},
            {'timestamp': (now - timedelta(hours=3, minutes=55)).isoformat(), 'message': 'Flash verified. ECU rebooted. ✓'},
        ],
    },
    {
        'vehicle': vehicles[1], 'tune': listings[2], 'status': 'COMPLETED', 'progress': 100,
        'flash_started_at': now - timedelta(days=1), 'flash_completed_at': now - timedelta(days=1) + timedelta(minutes=6),
        'logs': [
            {'timestamp': (now - timedelta(days=1)).isoformat(), 'message': 'Flash job initiated'},
            {'timestamp': (now - timedelta(days=1) + timedelta(minutes=6)).isoformat(), 'message': 'Flash completed successfully'},
        ],
    },
    {
        'vehicle': vehicles[1], 'tune': listings[3], 'status': 'FLASHING', 'progress': 67,
        'flash_started_at': now - timedelta(minutes=5),
        'logs': [
            {'timestamp': (now - timedelta(minutes=5)).isoformat(), 'message': 'Flash initiated — R1M Full Race Kit'},
            {'timestamp': (now - timedelta(minutes=3)).isoformat(), 'message': 'Block 11/16 written...'},
        ],
    },
    {
        'vehicle': vehicles[2], 'tune': listings[4], 'status': 'FAILED', 'progress': 44,
        'error_message': 'CRC mismatch at block 0x41000. ECU safe mode engaged.',
        'error_code': 'ERR_CRC_MISMATCH',
        'flash_started_at': now - timedelta(hours=2),
        'logs': [
            {'timestamp': (now - timedelta(hours=2)).isoformat(), 'message': 'Flash job initiated'},
            {'timestamp': (now - timedelta(hours=1, minutes=58)).isoformat(), 'message': 'ERROR: CRC mismatch at block 0x41000'},
            {'timestamp': (now - timedelta(hours=1, minutes=58)).isoformat(), 'message': 'ECU safe mode engaged — recovery recommended'},
        ],
    },
    {
        'vehicle': vehicles[0], 'tune': listings[1], 'status': 'CREATED', 'progress': 0,
        'logs': [
            {'timestamp': now.isoformat(), 'message': 'Job queued — awaiting start'},
        ],
    },
]
for fd in flash_data:
    fj, created = FlashJob.objects.get_or_create(
        user=user, vehicle=fd['vehicle'], tune=fd['tune'], status=fd['status'],
        defaults={
            'progress': fd['progress'],
            'error_message': fd.get('error_message', ''),
            'error_code': fd.get('error_code', ''),
            'connection_type': 'USB',
            'flash_started_at': fd.get('flash_started_at'),
            'flash_completed_at': fd.get('flash_completed_at'),
            'logs': fd.get('logs', []),
            'total_chunks': 16,
            'chunks_sent': int(16 * fd['progress'] / 100),
        }
    )
    if created:
        print(f'  [+] FlashJob: {fd["vehicle"].make} {fd["vehicle"].model} → {fd["status"]}')

print(f'\n✅ Seed complete! {len(listings)} tunes, {len(vehicles)} vehicles, {len(flash_data)} flash jobs')
print(f'   Login: admin@revsync.com / revsync2024')

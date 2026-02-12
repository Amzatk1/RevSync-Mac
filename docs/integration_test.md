# RevSync End-to-End Integration Test

## Overview

This document describes the full integration test procedure from tune upload through BLE flash, covering all backend and mobile components.

---

## Prerequisites

- Django backend running (`python manage.py runserver`)
- Supabase project configured with quarantine + validated storage buckets
- Stripe test keys configured in `settings.py`
- Mobile app running in Expo Go with `MockDeviceService`
- Ed25519 signing key configured (`REVSYNC_SIGNING_KEY_B64`)

---

## Step 1: Upload a Tune Package

```bash
# Create a test .revsyncpkg
python -c "
import zipfile, json, os, io
manifest = {
    'uploader_supabase_user_id': 'test-user-id',
    'listing_id': 'test-listing-id',
    'version': '1.0.0',
    'created_at': '2026-02-01T00:00:00Z',
    'supported_ecu': {'ecu_family': 'Bosch_ME17', 'hw_ids': ['HW001']},
    'bike_fitment': {'make': 'Yamaha', 'model': 'MT-09', 'year_from': 2021, 'year_to': 2025},
    'requirements': {'fuel_octane_min': 91},
    'safety': {'risk_level': 'LOW'},
    'file': {'tune_filename': 'tune.bin', 'tune_size_bytes': 1024}
}
with zipfile.ZipFile('test.revsyncpkg', 'w') as zf:
    zf.writestr('manifest.json', json.dumps(manifest))
    zf.writestr('tune.bin', os.urandom(1024))
"

# Upload via API
curl -X POST http://localhost:8000/api/marketplace/versions/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.revsyncpkg"
```

**Expected**: Version status transitions `UPLOADED → VALIDATING → READY_FOR_REVIEW`

## Step 2: Admin Approve & Publish

```bash
# Approve
curl -X POST http://localhost:8000/api/marketplace/versions/{id}/approve/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Publish
curl -X POST http://localhost:8000/api/marketplace/versions/{id}/publish/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected**: Version status → `PUBLISHED`, signature and hashes exist in validated bucket.

## Step 3: Purchase via Stripe

```bash
# Create payment intent
curl -X POST http://localhost:8000/api/payments/create-intent/ \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"listing_id": "...", "version_id": "..."}'

# Use Stripe test card 4242424242424242 in mobile PaymentSheet
# Stripe webhook fires → entitlement created
```

**Expected**: `PaymentTransaction` status = `succeeded`, `PurchaseEntitlement` created with `is_revoked=False`.

## Step 4: Download & Verify

```bash
# Request download URL
curl -X POST http://localhost:8000/api/marketplace/download/{version_id}/ \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Response includes `download_url` (signed, 5-min expiry), `signature_b64`, and `hashes`.

In mobile:
1. `DownloadService.downloadAndVerify()` downloads the package
2. Extracts `tune.bin`, computes SHA-256
3. Verifies Ed25519 signature via `CryptoService`
4. Stores verified package to `tunes/verified/{versionId}.revsyncpkg`

## Step 5: Flash via MockDeviceService

1. Navigate to Flash tab → DeviceConnect
2. Select "RevSync ECU" mock device → connects
3. ECUIdentify → reads mock ECU data (REVSYNC-ECU-MOCK, HW 1.0, FW 2.4.1)
4. Backup → reads 256KB mock memory → saves backup file
5. FlashWizard → pre-checks pass → confirmation → chunk loop → verification → success
6. VerificationScreen → all 5 checks pass

## Step 6: Recovery Test

1. From FlashWizard failed state → navigate to Recovery
2. RecoveryScreen → restores backup via chunk protocol
3. Verify chunks sent, recovery completes

---

## Backend Test Suite

```bash
cd backend
python manage.py test marketplace payments garage --verbosity=2
```

Expected: 34+ tests passing.

## Mobile TypeScript Check

```bash
cd mobile
npx tsc --noEmit
```

Expected: 0 errors.

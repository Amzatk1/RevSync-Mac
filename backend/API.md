# RevSync Backend API Documentation

## Authentication
All endpoints require `Authorization: Bearer <token>` unless stated otherwise.

## 1. Tuner Application

### Apply to become a Tuner
`POST /api/tuners/apply/`
```json
{
  "business_name": "Turbo Shop",
  "experience_summary": "10 years tuning Yamahas",
  "website_url": "https://turboshop.com"
}
```

### Check Status
`GET /api/tuners/apply/status/`

---

## 2. Tune Management (Tuners Only)

### Create Listing
`POST /api/v1/tuner/listings/`
Create the metadata container.

### Create Version (Draft)
`POST /api/v1/tuner/versions/`
```json
{
    "listing": "uuid",
    "version_number": "1.0.0",
    "changelog": "Initial release"
}
```

### Upload File
1. `POST /api/v1/tuner/versions/{id}/upload-init/` -> Returns `upload_url`
2. Client uploads file to `upload_url`
3. `POST /api/v1/tuner/versions/{id}/upload-complete/` -> Triggers Validation

### Check Validation
`GET /api/v1/tuner/versions/{id}/validation/`

### Submit for Review
`POST /api/v1/tuner/versions/{id}/submit-review/`

---

## 3. Marketplace (Public)

### Browse
`GET /api/marketplace/browse/?vehicle_make=Honda&vehicle_model=CBR`

### Purchase
`POST /api/marketplace/purchase/{listing_id}/`

### Download
`POST /api/marketplace/download/{version_id}/`
Returns `{ "download_url": "...", "expires_in": 300 }`
**IMPORTANT**: Client must verify signature of downloaded file!

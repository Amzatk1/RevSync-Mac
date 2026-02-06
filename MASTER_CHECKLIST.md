# RevSync Master Build & Launch Checklist

> **Generated:** 2026-02-04  
> **Project:** RevSync – ECU Tuning Platform  
> **Architecture:** React Native (Expo) + Django REST + Supabase + Celery + Ed25519

---

## 📋 Baseline Assumptions (Already True)

- ✅ Zero-Trust tune distribution: Quarantine → Validate → Sign → Validated → Signed URL → Mobile verifies → Flash
- ✅ Mobile tab layout: Tunes / Garage / Flash / Profile
- ✅ Backend 8 apps: users, garage, marketplace, tuners, chat, payments, safety_layer, core
- ✅ Legal acceptance tracking: `UserLegalAcceptance`
- ✅ Tune version state machine: DRAFT → UPLOADED → VALIDATING → FAILED/READY_FOR_REVIEW → APPROVED → PUBLISHED → SUSPENDED
- ✅ Stripe payment transaction model
- ✅ Supabase Storage buckets: quarantine/validated/public-assets
- ✅ Flash session persistence: `FlashJob`, `EcuBackup`

---

## 1️⃣ Mobile App Architecture (React Native/Expo)

### 1.1 Project Architecture Integrity

**Enforce Layer Boundaries**
- [ ] `presentation/` never directly calls Axios; uses domain usecases/services only
- [ ] `domain/` does not import from `presentation/`
- [ ] `data/` implements repositories/services and owns HTTP + storage mechanics
- [ ] Decide on `services/` folder (legacy) - standardize or deprecate
- [ ] Remove or freeze `mobile/src/screens/` (legacy) to avoid duplication with `presentation/screens/`
- [ ] One source of truth for models: `types/models.ts` + domain entities mapping

**Deliverables**
- [ ] Create "Architecture Guardrails" doc in `mobile/README.md`
- [ ] Add ESLint boundaries rules (optional but recommended)
- [ ] Document import rules: what can import what

---

## 2️⃣ Navigation & Screen Registry (32 Screens)

### Per-Screen Checklist Template

For each screen, ensure it has:
- [ ] **Inputs** documented
- [ ] **Outputs** documented
- [ ] **API dependencies** listed
- [ ] **Offline behavior** defined
- [ ] **Error states** handled
- [ ] **Telemetry events** implemented
- [ ] **Security requirements** met

---

## 3️⃣ Auth Stack (4 Screens)

### 3.1 WelcomeScreen
- [ ] Entry copy clear: "Buy, validate, flash safely"
- [ ] Handles offline: cached info visible, login disabled
- [ ] Buttons: Sign In, Sign Up
- [ ] Telemetry: `auth_welcome_viewed`

### 3.2 SignInScreen
- [ ] Calls Supabase Auth `signIn`
- [ ] Stores session securely via Expo Secure Store
- [ ] Axios interceptor attaches JWT automatically
- [ ] Handles wrong password error
- [ ] Handles unverified email (if enabled)
- [ ] Handles rate limiting response
- [ ] Telemetry: `auth_signin_success`, `auth_signin_fail`

### 3.3 SignUpScreen
- [ ] Creates user in Supabase
- [ ] Creates user record in Django (`/api/users/register/`)
- [ ] Handles duplicate email/username
- [ ] Enforces password policy
- [ ] Telemetry: `auth_signup_success`, `auth_signup_fail`

### 3.4 OnboardingScreen
- [ ] Region/country selection (for UK/EU/global legal addenda)
- [ ] Privacy toggles (analytics/crash reporting)
- [ ] Legal acceptance flow (terms/privacy/safety)
- [ ] Stores acceptance with version in backend: `UserLegalAcceptance`
- [ ] Cannot proceed without required acceptances
- [ ] Telemetry: `onboarding_completed`

---

## 4️⃣ Tunes Tab (Marketplace + Purchase + Downloads)

### 4.1 TuneMarketplaceScreen
- [ ] Uses `/api/marketplace/browse/` with filters:
  - [ ] make/model/year (from active bike)
  - [ ] stage
  - [ ] price range
  - [ ] safety rating minimum
  - [ ] "compatible only" toggle
- [ ] Supports offline: last cached results visible with "offline" label
- [ ] Paging + pull-to-refresh
- [ ] UI badges: PUBLISHED, purchased, downloaded
- [ ] Telemetry: `marketplace_browse_viewed`, `marketplace_filter_applied`, `tune_card_opened`

### 4.2 TuneDetailsScreen
- [ ] Shows description, fitment rules, tuner profile
- [ ] Shows safety rating
- [ ] Shows version list & changelog
- [ ] Compatibility panel:
  - [ ] If active bike exists: green/red + reason
  - [ ] If no active bike: prompt to select/add
- [ ] CTAs: Purchase, Validate, Download Manager shortcut (if owned)
- [ ] Telemetry: `tune_details_viewed`, `tune_purchase_initiated`

### 4.3 TuneValidationScreen
- [ ] Displays safety analysis results
- [ ] Shows risk score (0-100)
- [ ] Shows recommendations from `SafetyReport`
- [ ] Allows user to proceed or cancel
- [ ] Telemetry: `tune_validation_viewed`, `tune_validation_accepted`

### 4.4 CheckoutScreen (Payments)
- [ ] Implements Stripe PaymentSheet (mobile)
- [ ] Creates PaymentIntent via `POST /api/payments/create-intent/`
- [ ] Confirms payment on device
- [ ] Server verifies and creates `PaymentTransaction`
- [ ] Creates `PurchaseEntitlement` on success
- [ ] Handles cancelled payment
- [ ] Handles failed payment
- [ ] Handles succeeded but entitlement missing (repair path)
- [ ] Telemetry: `checkout_initiated`, `checkout_success`, `checkout_failed`

### 4.5 DownloadManagerScreen

**Download Flow (Critical Security)**
1. [ ] App calls `/api/marketplace/download/<version_id>/`
2. [ ] Backend checks entitlement + published + signature exists
3. [ ] Backend returns 5-min signed URL
4. [ ] App downloads package
5. [ ] App verifies Ed25519 signature with embedded public key
6. [ ] App stores package encrypted locally (MMKV + file encryption)

**Storage Requirements**
- [ ] Store `downloaded_at`
- [ ] Store `verified_at`
- [ ] Store `manifest_hash`
- [ ] Store `file_hash`
- [ ] Store `signature_fingerprint`

**Error Handling**
- [ ] Block flash if verification fails
- [ ] Handle download resume
- [ ] Handle corrupted download
- [ ] Handle signature mismatch
- [ ] Check if version suspended after download (block flashing)
- [ ] Telemetry: `download_started`, `download_completed`, `download_verified`, `download_failed`

---

## 5️⃣ Garage Tab (Vehicles + ECU + Backups)

### 5.1 GarageScreen
- [ ] List vehicles via `/api/garage/`
- [ ] "Active vehicle" selection updates app global state
- [ ] Shows public visibility indicator (social feature)
- [ ] Shows ECU status: `ecu_id` present? `ecu_software_version` present?
- [ ] Telemetry: `garage_viewed`, `vehicle_selected`

### 5.2 AddBikeScreen
- [ ] Creates vehicle via `POST /api/garage/`
- [ ] Uses `VehicleDefinition` search endpoint `/api/garage/definitions/`
- [ ] Validation: year range, make/model required
- [ ] Stores modifications list
- [ ] Telemetry: `vehicle_add_initiated`, `vehicle_add_completed`

### 5.3 BikeDetailsScreen
- [ ] Displays make/model/year, VIN, modifications
- [ ] Displays ECU identity fields
- [ ] "Identify ECU" button routes to Flash → ECUIdentifyScreen
- [ ] "View backups" shortcut
- [ ] "View flash history" shortcut
- [ ] Telemetry: `vehicle_details_viewed`, `vehicle_edited`

---

## 6️⃣ Flash Tab (BLE + Backup + Flash + Verification + Recovery)

### 6.1 DeviceConnectScreen
- [ ] Uses `react-native-ble-plx`
- [ ] Android: scan permissions + location (where needed)
- [ ] iOS: bluetooth permission handling
- [ ] Shows RSSI and connection quality
- [ ] Blocks flashing if RSSI below threshold (configurable)
- [ ] Saves last connected device metadata
- [ ] Logs to `FlashJob` or local logs
- [ ] Telemetry: `ble_scan_started`, `ble_device_connected`, `ble_connection_failed`

### 6.2 ECUIdentifyScreen
- [ ] Reads ECU identifiers via BLE protocol
- [ ] Writes to vehicle: `ecu_type`, `ecu_id`, `ecu_software_version`
- [ ] Must happen before validating tune compatibility
- [ ] If ECU read fails: show diagnostic tips, allow retry, log error
- [ ] Telemetry: `ecu_identify_started`, `ecu_identify_success`, `ecu_identify_failed`

### 6.3 BackupScreen (Mandatory)
- [ ] Creates backup record in backend `EcuBackup`
- [ ] Uploads backup file to Supabase (dedicated backups bucket/path)
- [ ] Stores: `checksum` (SHA-256), `file_size_kb`, `storage_key`
- [ ] Verifies backup integrity immediately after upload (read back hash match)
- [ ] UI warning: "Do not interrupt"
- [ ] Blocks flash if backup missing
- [ ] Telemetry: `backup_started`, `backup_completed`, `backup_verified`, `backup_failed`

### 6.4 FlashWizardScreen

**Pre-Flash Gating (Must Block)**
- [ ] Tune signature verified locally
- [ ] Tune is still PUBLISHED (server check on start)
- [ ] ECU identity matches tune manifest supported ECU IDs
- [ ] Backup exists and verified
- [ ] Phone battery >= threshold
- [ ] Connection stable (RSSI >= threshold)
- [ ] User confirms charger recommended / stable bike power

**Flash Session Tracking (FlashJob)**
- [ ] On flash start: create `FlashJob` status=PENDING
- [ ] During flash: status=FLASHING, progress 0–100
- [ ] Append logs (JSONField array)
- [ ] On completion: status=COMPLETED
- [ ] On failure: status=FAILED with error reason + recovery recommended

**Flash Transport Reliability**
- [ ] Chunking protocol (ACK/NAK)
- [ ] Retries + timeouts
- [ ] Resume logic (if possible)
- [ ] "Do not background" UI mode
- [ ] Telemetry: `flash_started`, `flash_progress_<25|50|75>`, `flash_completed`, `flash_failed`

### 6.5 VerificationScreen
- [ ] Post-write verification: checksum verify
- [ ] Readback verify (if supported)
- [ ] Option: clear DTCs
- [ ] Update `FlashJob` COMPLETED only after verification passes
- [ ] Telemetry: `verification_started`, `verification_passed`, `verification_failed`

### 6.6 RecoveryScreen
- [ ] Reconnect flow
- [ ] Restore backup flow (primary recovery method)
- [ ] Export logs flow
- [ ] "Contact support" with attached logs
- [ ] Update `FlashJob` FAILED with details
- [ ] Telemetry: `recovery_initiated`, `backup_restored`, `recovery_failed`

---

## 7️⃣ Profile Tab + Settings (10 Screens)

### 7.1 ProfileScreen
- [ ] Displays user info, stats, garage summary
- [ ] Shows followers/following counts
- [ ] "Edit Profile" button
- [ ] "Settings" button
- [ ] Telemetry: `profile_viewed`

### 7.2 ProfileEditScreen
- [ ] Edit bio, country, photo
- [ ] Edit riding stats: experience_level, riding_style, risk_tolerance
- [ ] Updates via `PATCH /api/users/profile/`
- [ ] Telemetry: `profile_edited`

### 7.3 SettingsScreen (Root)
- [ ] Categories: Account, Flashing Safety, Privacy & Data, Legal, Logs & Support, About
- [ ] Navigation to sub-screens
- [ ] Telemetry: `settings_viewed`

### 7.4 PrivacyScreen
- [ ] Toggles tied to backend `UserPreference`:
  - [ ] Analytics consent
  - [ ] Crash reporting consent
  - [ ] Marketing consent
  - [ ] Personalized recommendations
- [ ] Writes consent events to `UserLegalAcceptance` for MARKETING, ANALYTICS
- [ ] Telemetry: `privacy_settings_changed`

### 7.5 LogsExportScreen
- [ ] Exports: BLE logs, flash logs, download verification logs, errors
- [ ] Redacts secrets and tokens
- [ ] File packaged (zip)
- [ ] Share sheet enabled
- [ ] Optional: "Upload to Support"
- [ ] Telemetry: `logs_exported`

### 7.6 LegalMenuScreen
- [ ] Shows legal documents: TERMS, PRIVACY, SAFETY, REFUND, ACCEPTABLE_USE, WARRANTY, OPEN_SOURCE, EXPORT_CONTROLS
- [ ] Each doc shows: version number, last updated, accept button (if required)
- [ ] Telemetry: `legal_menu_viewed`

### 7.7 LegalDocumentScreen
- [ ] Displays document text
- [ ] Accept button calls `/api/users/legal/accept/`
- [ ] Telemetry: `legal_document_viewed`, `legal_document_accepted`

### 7.8 FlashingSafetySettingsScreen
- [ ] Saved preferences: min battery threshold, min RSSI threshold, strict mode, keep screen awake
- [ ] Boundaries: user cannot set unsafe values
- [ ] Server can enforce minimums (policy updates)
- [ ] Telemetry: `safety_settings_changed`

### 7.9 SupportScreen
- [ ] Help articles, FAQs
- [ ] Contact support form
- [ ] Attach logs option
- [ ] Telemetry: `support_viewed`, `support_contacted`

### 7.10 AboutScreen
- [ ] App version, build number
- [ ] Credits, licenses
- [ ] Links to website, social
- [ ] Telemetry: `about_viewed`

---

## 8️⃣ Backend - users App

### 8.1 Models Completeness
- [ ] `User`: Supabase user id mapped (`supabase_user_id`)
- [ ] `User`: Flag-based permissions work (`is_tuner`, `is_admin`, `is_moderator`)
- [ ] `UserProfile`: All fields populated correctly
- [ ] `AppSession`: Revocation works
- [ ] `Follow`: Social graph functional
- [ ] `UserLegalAcceptance`: Source of truth for acceptances
- [ ] `UserPreference`: Used for settings (key-value JSON)

### 8.2 API Endpoints
- [ ] `POST /api/users/register/` - Creates user + profile
- [ ] `POST /api/token/` - JWT login (custom serializer with session tracking)
- [ ] `GET /api/users/me/` - Returns current user with flags, region, privacy settings
- [ ] `GET /api/users/profile/` - Get/update profile
- [ ] `PATCH /api/users/profile/` - Update profile
- [ ] `GET /api/users/<username>/` - Public user view
- [ ] `POST /api/users/<username>/follow/` - Follow/unfollow
- [ ] `POST /api/users/legal/accept/` - Accept legal doc (requires version, logs IP + device_id)
- [ ] `GET /api/users/legal/history/` - Legal acceptance history
- [ ] `GET /api/users/preferences/` - List preferences
- [ ] `POST /api/users/preferences/` - Set preference (validates allowed keys)

### 8.3 Security & Compliance
- [ ] JWT auth works reliably across devices
- [ ] Session revocation functional
- [ ] IP address logging for legal acceptance
- [ ] Device ID tracking for sessions

---

## 9️⃣ Backend - garage App

### 9.1 Models Completeness
- [ ] `Vehicle`: Supports BIKE and CAR
- [ ] `VehicleDefinition`: Provides fitment lookup
- [ ] `EcuBackup`: `storage_key` points to Supabase path
- [ ] `EcuBackup`: Integrity checked and tied to vehicle
- [ ] `FlashJob`: Tracks progress and logs
- [ ] Soft delete respects user privacy

### 9.2 API Endpoints
- [ ] `GET /api/garage/` - List user vehicles
- [ ] `POST /api/garage/` - Add vehicle
- [ ] `GET /api/garage/<id>/` - Vehicle details
- [ ] `PATCH /api/garage/<id>/` - Update vehicle
- [ ] `DELETE /api/garage/<id>/` - Soft delete vehicle
- [ ] `GET /api/garage/definitions/` - Search vehicle database
- [ ] `GET /api/garage/<vehicle_id>/backups/` - List backups for vehicle
- [ ] `GET /api/garage/<vehicle_id>/flash-history/` - List flash history for vehicle

---

## 🔟 Backend - marketplace App

### 10.1 Listing Side
- [ ] `TuneListing`: Metadata complete and searchable
- [ ] SEO slug unique
- [ ] Status rules: only PUBLISHED visible to customers
- [ ] Filtering works: make, model, year, price, safety rating

### 10.2 Version Side (State Machine)
- [ ] State transitions work: DRAFT → UPLOADED → VALIDATING → FAILED/READY_FOR_REVIEW → APPROVED → PUBLISHED → SUSPENDED
- [ ] `TuneVersion` stores: `quarantine_path`, `validated_path`
- [ ] `TuneVersion` stores: `file_hash_sha256`, `manifest_hash_sha256`, `signature_base64`, `signed_at`
- [ ] `TuneVersion` stores: `manifest_data` (JSONField), `file_size_bytes`
- [ ] `ValidationReport`: 1-to-1 with version, stores results/blockers/warnings

### 10.3 Entitlements
- [ ] `PurchaseEntitlement`: Ties user + listing
- [ ] Revocation support exists (refund/fraud)
- [ ] Unique constraint: (user, listing)

### 10.4 API Endpoints
- [ ] `GET /api/marketplace/browse/` - Browse tunes (filter by make/model/year)
- [ ] `GET /api/marketplace/listing/<id>/` - Tune details
- [ ] `POST /api/marketplace/purchase/<id>/` - Purchase tune (creates payment intent)
- [ ] `POST /api/marketplace/download/<version_id>/` - Get signed download URL
  - [ ] Checks entitlement
  - [ ] Checks version is PUBLISHED and not suspended
  - [ ] Checks signature exists
  - [ ] Returns 5-minute signed Supabase URL
  - [ ] Logs download event

### 10.5 Tuner-Only Endpoints
- [ ] `POST /api/v1/tuner/listings/` - Create listing
- [ ] `POST /api/v1/tuner/versions/` - Create version
- [ ] `POST /api/v1/tuner/versions/<id>/upload-init/` - Get upload URL
- [ ] `POST /api/v1/tuner/versions/<id>/upload-complete/` - Trigger validation
- [ ] `GET /api/v1/tuner/versions/<id>/validation/` - Check validation status
- [ ] `POST /api/v1/tuner/versions/<id>/submit-review/` - Submit for review

---

## 1️⃣1️⃣ Backend - tuners App

### 11.1 Models
- [ ] `TunerProfile`: Business info, verification levels, tiers, stats
- [ ] `TunerApplication`: Workflow (PENDING, APPROVED, REJECTED)
- [ ] Verification levels: COMMUNITY, VERIFIED, PRO, MASTER
- [ ] Tier rules: NEW (manual review), TRUSTED (auto-approve)

### 11.2 API Endpoints
- [ ] `POST /api/tuners/apply/` - Apply to become tuner
- [ ] `GET /api/tuners/apply/status/` - Check application status

### 11.3 Admin Controls
- [ ] Admin review UI/endpoints locked down
- [ ] Suspension kill switch prevents uploads/publishing

---

## 1️⃣2️⃣ Backend - payments App

### 12.1 Models
- [ ] `PaymentTransaction`: Stripe integration, status tracking

### 12.2 API Endpoints
- [ ] `POST /api/payments/create-intent/` - Create Stripe payment intent
- [ ] `GET /api/payments/verify/<intent_id>/` - Verify payment status

### 12.3 Stripe Webhooks (Production Critical)
- [ ] `payment_intent.succeeded` - Create `PurchaseEntitlement`
- [ ] `charge.refunded` - Mark entitlement revoked (policy-based)
- [ ] `dispute` events - Handle disputes
- [ ] Webhook signature verification
- [ ] Idempotency handling

### 12.4 Receipts & Audit
- [ ] Receipts stored for audit
- [ ] "Restore purchases" endpoint in Profile

---

## 1️⃣3️⃣ Backend - safety_layer App

### 13.1 Models
- [ ] `SafetyReport`: risk_score, status, analysis results

### 13.2 Functionality
- [ ] Define clear difference: SafetyEngine gating (hard blocks) vs SafetyReport insights (recommendations)
- [ ] Ensure `SafetyReport` cannot override hard flash gates
- [ ] Add endpoint for mobile to display safety insights during validation

### 13.3 API Endpoints
- [ ] `POST /api/safety/analyze/` - Run safety analysis
- [ ] `GET /api/safety/reports/` - List user reports

---

## 1️⃣4️⃣ Backend - chat App

### 14.1 Models
- [ ] `Conversation`: Participants, timestamps
- [ ] `Message`: Content, read status, ordering

### 14.2 API Endpoints
- [ ] `GET /api/chat/conversations/` - List conversations
- [ ] `POST /api/chat/conversations/` - Create conversation
- [ ] `GET /api/chat/conversations/<id>/messages/` - Get messages
- [ ] `POST /api/chat/conversations/<id>/messages/` - Send message

### 14.3 Abuse Handling
- [ ] Block/report functionality (optional)
- [ ] Moderator access for escalations (optional)

---

## 1️⃣5️⃣ Backend - core App

### 15.1 Base Models
- [ ] `TimeStampedModel`: Used consistently across all apps
- [ ] `SoftDeleteModel`: Correctly applied where needed
- [ ] Managers exclude deleted records by default

---

## 1️⃣6️⃣ Supabase Storage

### 16.1 Quarantine Bucket (`revsync-quarantine`)
- [ ] Write: Tuners only
- [ ] Read: Validation worker only (server/service key)
- [ ] Public read: BLOCKED
- [ ] Object path format: `/tuner/{userId}/{listingId}/{versionId}/upload.revsyncpkg`

### 16.2 Validated Bucket (`revsync-validated`)
- [ ] Write: Only validation pipeline (server)
- [ ] Read: Only server generates signed URLs
- [ ] Public read: BLOCKED
- [ ] Stored artifacts: package, signature, hashes.json, validation report snapshot

### 16.3 Public Assets Bucket (`revsync-public-assets`)
- [ ] Only images/avatars/logos
- [ ] No tune packages ever

### 16.4 Signed URL Policy
- [ ] Download URLs expire in 5 minutes
- [ ] Log IP + user agent hash for abuse detection
- [ ] Throttle download-link endpoint

---

## 1️⃣7️⃣ Ed25519 Signing & Verification

### 17.1 Server Signing
- [ ] Private key in env: `REVSYNC_SIGNING_PRIVATE_KEY` (base64)
- [ ] Signing input strictly defined:
  - [ ] SHA-256(tune.bin)
  - [ ] SHA-256(manifest canonical form)
  - [ ] version_id + listing_id included (prevents swapping)
- [ ] Signature stored in version: `signature_base64`, `signed_at`
- [ ] Public key fingerprint stored (optional)

### 17.2 Mobile Verification
- [ ] Public key embedded in app binary
- [ ] On download complete: verify signature, verify hashes match, store `verified_at`
- [ ] FlashWizard refuses any unverified package
- [ ] Recovery screen suggests re-download if verification fails

### 17.3 Key Rotation Plan
- [ ] Support multiple public keys: current + previous
- [ ] Version stores key fingerprint used
- [ ] Runbook includes rotation procedure

---

## 1️⃣8️⃣ Celery Validation Pipeline

### 18.1 ingest_upload_task
- [ ] Verifies file exists at `quarantine_path`
- [ ] Checks size limits
- [ ] Sets `TuneVersion` state: UPLOADED → VALIDATING
- [ ] Audit log event created

### 18.2 scan_malware_task
- [ ] Integrates ClamAV or scanner provider
- [ ] Failure auto-suspends version + flags tuner for review
- [ ] Results stored in `ValidationReport`

### 18.3 validate_package_task
- [ ] Safe unzip (prevents zip slip)
- [ ] `manifest.json` required
- [ ] jsonschema strict validation
- [ ] Compute SHA-256 (tune + manifest + package)
- [ ] Store `file_hash_sha256` and `manifest_hash_sha256`
- [ ] Store `manifest_data` JSONField
- [ ] Produce blockers/warnings

### 18.4 compatibility_check_task
- [ ] Check ECU family supported
- [ ] Check IDs plausible and not empty
- [ ] Compare with `VehicleDefinition` / ECU registry
- [ ] Update blockers if mismatch

### 18.5 sign_and_move_task
- [ ] Only runs if blockers empty
- [ ] Signs with Ed25519
- [ ] Writes `signature_base64` + `signed_at`
- [ ] Copies package to validated bucket
- [ ] Sets state: READY_FOR_REVIEW
- [ ] Audit logs generated

---

## 1️⃣9️⃣ Purchase → Download → Flash Data Flow

### 19.1 Purchase Flow
- [ ] Customer calls purchase endpoint
- [ ] Stripe intent created
- [ ] On success: `PaymentTransaction` created + `PurchaseEntitlement` created

### 19.2 Download Flow
- [ ] Customer requests download link
- [ ] Server validates: entitlement + published + signature
- [ ] Returns signed URL for validated bucket

### 19.3 Flash Eligibility (Hard Truth)
- [ ] Mobile verifies signature
- [ ] Reads ECU
- [ ] Checks manifest compatibility
- [ ] Ensures backup exists
- [ ] Logs `FlashJob`

---

## 2️⃣0️⃣ Social Features

### 20.1 Follow System
- [ ] Privacy gates for garage public visibility
- [ ] User can toggle garage visibility in settings
- [ ] Abuse prevention: block/report (optional)

### 20.2 Chat System
- [ ] Message read receipts (optional)
- [ ] Rate limiting on message send
- [ ] Content moderation hooks (optional)

---

## 2️⃣1️⃣ Legal + Agreements + Consent Tracking

### 21.1 Legal Documents Source
- [ ] Legal documents stored centrally (backend or mobile constant)
- [ ] Each doc has: version string (e.g., 2026-01), last updated date
- [ ] Locale coverage: UK/EU/global addenda (optional)

### 21.2 Acceptance Rules
- [ ] App blocks usage until: TERMS, PRIVACY, SAFETY accepted
- [ ] MARKETING and ANALYTICS are opt-in consent
- [ ] Cannot flash without SAFETY acceptance

### 21.3 Display
- [ ] `LegalMenuScreen` lists docs
- [ ] `LegalDocumentScreen` shows text + Accept button
- [ ] Legal service writes acceptance to backend

---

## 2️⃣2️⃣ Testing

### 22.1 Backend Tests (Must-Have)
- [ ] Upload-init forbidden for non-tuner
- [ ] Upload-complete triggers Celery chain
- [ ] Schema failure → version FAILED
- [ ] Malware fail → version FAILED + tuner flagged
- [ ] Publish blocked without signature
- [ ] Download denied without entitlement
- [ ] Suspended version denies download
- [ ] Signed URL expires and cannot be reused
- [ ] Legal acceptance history returns correct ordering
- [ ] Follow/unfollow works correctly
- [ ] Soft delete excludes deleted records

### 22.2 Mobile Tests (Must-Have)
- [ ] Cannot flash without verified package
- [ ] Cannot flash without backup
- [ ] BLE disconnect triggers recovery
- [ ] Signature mismatch blocks flash
- [ ] Download resume works
- [ ] Flash job progress UI correct
- [ ] Offline mode shows cached data
- [ ] Legal acceptance blocks app usage correctly

---

## 2️⃣3️⃣ Ops + Deployment

### 23.1 Environments
- [ ] Dev environment configured
- [ ] Staging environment configured
- [ ] Prod environment configured
- [ ] Separate Supabase projects or buckets/keys per environment

### 23.2 Secrets Management
- [ ] Supabase service role key only on backend
- [ ] Signing private key only on backend
- [ ] Stripe keys separated (test/live)
- [ ] Key rotation process documented

### 23.3 Monitoring & Alerts
- [ ] Celery failure alerts
- [ ] Spike in validation failures alerts
- [ ] Spike in flash failures alerts
- [ ] Suspicious download link requests alerts
- [ ] Payment webhook failures alerts

### 23.4 Admin Tools
- [ ] Approve tuner applications
- [ ] Approve/reject versions
- [ ] Suspend versions (kill switch)
- [ ] View validation reports
- [ ] View audit logs
- [ ] User management (ban/suspend)

---

## 2️⃣4️⃣ High-Priority Next Steps

### 24.1 Payments Hardening (Highest Priority)
- [ ] Add Stripe webhooks (production requirement)
- [ ] Ensure entitlement creation uses webhook truth (not only client verify)
- [ ] Refund/chargeback handling and entitlement revoke
- [ ] Invoice/receipt generation (recommended)

### 24.2 Mobile Verification Hardening (Safety Priority)
- [ ] Ensure signature verification is impossible to bypass in UI
- [ ] Ensure "still published" check happens right before flash
- [ ] Ensure local file encryption for downloaded packages/backups

### 24.3 Store Policy Compliance (Business Priority)
- [ ] Confirm Apple purchase path compliance for iOS
- [ ] Decide: Web checkout + restore, IAP for digital goods, or hybrid
- [ ] Implement "Restore Purchases" functionality

### 24.4 Documentation
- [ ] API documentation complete (OpenAPI spec)
- [ ] Mobile architecture documentation
- [ ] Deployment runbook
- [ ] Incident response playbook
- [ ] Key rotation procedure

### 24.5 Performance & Scalability
- [ ] Database indexing optimized
- [ ] API response caching strategy
- [ ] CDN for public assets
- [ ] Celery worker scaling plan
- [ ] Load testing completed

---

## 2️⃣5️⃣ Launch Readiness Checklist

### 25.1 Legal & Compliance
- [ ] Terms of Service finalized
- [ ] Privacy Policy finalized
- [ ] Safety Disclaimer finalized
- [ ] Refund Policy finalized
- [ ] GDPR compliance verified (if EU users)
- [ ] Export controls reviewed (if global)

### 25.2 Security Audit
- [ ] Penetration testing completed
- [ ] Dependency vulnerability scan
- [ ] Secrets not in code/repos
- [ ] Rate limiting on all public endpoints
- [ ] CORS configured correctly

### 25.3 User Experience
- [ ] Onboarding flow tested with real users
- [ ] Error messages are clear and actionable
- [ ] Loading states implemented everywhere
- [ ] Offline mode gracefully handled
- [ ] Accessibility reviewed (optional but recommended)

### 25.4 Business Operations
- [ ] Customer support process defined
- [ ] Refund process defined
- [ ] Incident escalation process defined
- [ ] Marketing materials ready
- [ ] App store listings ready (iOS/Android)

---

## ✅ Completion Criteria

**Mobile App Ready When:**
- All 32 screens functional with error handling
- Signature verification cannot be bypassed
- Offline mode works gracefully
- All telemetry events firing

**Backend Ready When:**
- All 40+ endpoints tested
- Celery pipeline reliable
- Stripe webhooks implemented
- Admin tools functional

**Launch Ready When:**
- All legal docs accepted
- Security audit passed
- Load testing passed
- Support process operational
- App store approved

---

**Total Checklist Items:** 300+  
**Estimated Completion Time:** 4-8 weeks (depending on team size)

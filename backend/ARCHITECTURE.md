# RevSync Backend Architecture

## 1. System Overview

RevSync acts as the central authority for ECU tuning safety. The architecture is designed to prevent "bad tunes" from ever reaching a vehicle by enforcing a strict firewall between **User Uploads** and **Customer Downloads**.

### High-Level Data Flow
1.  **Tuner Upload**: User uploads a package (`.revsyncpkg` + `manifest.json`) to a **Quarantine Bucket**.
2.  **Validation Pipeline**: Celery workers pick up the upload, run antivirus, schema validation, hash verification, and compatibility checks.
3.  **Approval**: If checks pass, the package moves to `READY_FOR_REVIEW`. Admin or Trusted Tuner approves it.
4.  **Signing**: The server cryptographically signs the Validated Package using a private key (Ed25519). Public key is hardcoded in the Mobile App.
5.  **Publish**: Signed package + signature are moved to a **Validated Bucket**.
6.  **Download**: Authenticated customers with `PurchasedEntitlement` request a download. Server generates a short-lived **Signed URL** to the *Validated* bucket.

---

## 2. Security Model (The "Safety Switch")

### Storage Segregation
*   **Bucket A: `revsync-quarantine`** (Private)
    *   Write: Authenticated Tuners (Upload only)
    *   Read: Validation Worker ONLY.
    *   Public Access: BLOCKED.
*   **Bucket B: `revsync-validated`** (Private)
    *   Write: Validation Worker (Signed artifacts only).
    *   Read: Server (to generate signed URLs).
    *   Public Access: BLOCKED.
*   **Bucket C: `revsync-public-assets`** (Public)
    *   Images, Thumbnails, Avatars.

### Signing Strategy
*   **Algorithm**: Ed25519 (Edwards-curve Digital Signature Algorithm).
*   **Key Management**:
    *   Private Key: Stored in secure environment variable `REVSYNC_SIGNING_KEY`.
    *   Public Key: Embedded in Mobile App binary.
*   **What is Signed**: SHA-256 Hash of the `tune.bin` + Manifest Data (Version, ECU Family).
*   **Verification**: Mobile App *must* verify signature matches the downloaded file before enabling the "Flash" button.

### Roles & Permissions
*   **User**: Standard access (Browse, Purchase, Flash).
*   **Tuner (Applicant)**: Can submit `TunerApplication`.
*   **Tuner (Approved)**: Can access `/tuner/` API, create Listings.
*   **Tuner (Trusted)**: Can auto-publish updates (bypass Manual Review after Auto-Validation).
*   **Admin/Moderator**: Can Review, Approve, Reject, and Suspend listings.

---

## 3. State Machines

### Tune Version Lifecycle
1.  **`DRAFT`**: Created in DB. No file uploaded yet.
2.  **`UPLOADED`**: URL generated, client confirms upload complete.
3.  **`VALIDATING`**: Async pipeline running (AV, Schema, Hashes).
4.  **`FAILED`**: Pipeline rejected (Malware, Invalid Schema, Unsupported ECU).
5.  **`READY_FOR_REVIEW`**: Pipeline Passed. Waiting for Approval.
6.  **`APPROVED`**: Moderator/Trusted Rule passed. Package Signed & Moved.
7.  **`PUBLISHED`**: Available for purchase/download.
8.  **`SUSPENDED`**: "Kill Switch" activated. Downloads blocked immediately.

### Entitlement Lifecycle
1.  **`PENDING`**: Payment initiated.
2.  **`ACTIVE`**: Payment confirmed. Download allowed.
3.  **`REVOKED`**: Refunded or Fraud usage.

---

## 4. Validation Pipeline (Celery)

The pipeline is a sequence of idempotent tasks:

1.  **`ingest_upload_task`**:
    *   Input: `version_id`, `quarantine_path`
    *   Action: Verify file exists in quarantine.
2.  **`scan_malware_task`**:
    *   Action: Run ClamAV or Mock Scanner.
    *   Fail: Delete file, set `FAILED`, Alert Admin.
3.  **`validate_package_task`**:
    *   Action: Unzip, read `manifest.json`.
    *   Check: Schema validation (fields, types).
    *   Check: ECU ID format.
    *   Action: Compute SHA-256 of `tune.bin`.
4.  **`compatibility_check_task`**:
    *   Action: Compare `manifest.supported_ecu` against `EcuDatabase`.
5.  **`sign_and_move_task`**:
    *   Condition: All previous passed.
    *   Action: Sign the Hash.
    *   Action: Move file `quarantine` -> `validated`.
    *   Action: Save `signature_base64` to DB.
    *   State: `READY_FOR_REVIEW` (or `APPROVED` if Trusted).

---

## 5. Mobile App Verification (Client-Side)

The Mobile App acts as the final gatekeeper.
1.  **Download**: Fetch `.zip` + `.sig` from Signed URL.
2.  **Verify**:
    *   Compute local SHA-256 of downloaded `tune.bin`.
    *   Verify `Ed25519(LocalHash, Signature, PublicKey) == True`.
3.  **Check**: If Signature Invalid -> Delete immediately. Show Red Screen.
4.  **Flash**: Only enable button if Verify == True.

---

## 6. Threat Model & Mitigations

| Threat | Mitigation |
| :--- | :--- |
| **Malicious File Upload** | Quarantine bucket, Malware Scan, Non-executable validation. |
| **Fake "Safe" Tune** | Server-side compatibility check; Admin Review. |
| **Man-in-the-Middle** | TLS 1.3; Ed25519 Package Signing (integrity + authenticity). |
| **Stolen Download Link** | Short-lived (5m) Signed URLs; IP Logging. |
| **Tuner Account Hijack** | MFA (Future); "Suspended" state revocation kill switch. |
| **Database Leak** | Tune files not in DB; Private Keys env-injected (not in code). |

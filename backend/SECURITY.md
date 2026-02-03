# RevSync Security & Threat Model

## 1. Trust Architecture

The system is designed on the principle of **Zero Trust** for user uploads.
- **Quarantine**: All uploads go to a restricted bucket that NO user can read from.
- **Server-Side Validation**: The client is not trusted to validate checks.
- **Cryptographic Signing**: The server signs validated packages with a private Ed25519 key.

## 2. Key Management

### Signing Keys
*   **Algorithm**: Ed25519
*   **Storage**: `REVSYNC_SIGNING_PRIVATE_KEY` (Base64) in Environment Variables (AWS Secrets Manager / Vault in Prod).
*   **Rotation**:
    1.  Generate new Keypair.
    2.  Deploy new Keypair to Server ENV.
    3.  Release App Update with New Public Key (Or support key rotation endpoint).
    4.  Old sigs remain valid if we support multiple active keys (Architecture allows listing multiple public keys).

## 3. Pipeline Security

### Malware Scanning
*   **State**: `VALIDATING`
*   **Tool**: ClamAV (or Cloud Native Scan)
*   **Action**: If infected -> Immediate Delete, Ban User potential.

### Compatibility Checks
*   **Enforcement**: Server checks `supported_ecu` against database.
*   **Bypass**: Impossible unless Admin overrides.

## 4. Threat Mitigations

| Threat | Mitigation |
| :--- | :--- |
| **Spoofed Upload** | Checksum verification + Signature verification on device. |
| **Replay Attack** | Signatures include Version UUIDs. |
| **Unauthorized Download** | Signed URLs with 5-minute expiry. Checks Entitlement in DB. |
| **Data Leak** | Private buckets. Public bucket only for images. |

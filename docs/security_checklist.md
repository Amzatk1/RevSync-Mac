# RevSync Security Hardening Checklist

Verification of all 14 security mitigations from the implementation plan against actual code.

---

## Server-Side Mitigations

| # | Threat | Status | Implementation |
|---|--------|--------|----------------|
| 1 | **URL reuse** | ✅ | `DownloadLinkView` generates 300-second signed URLs via Supabase. Rate limited to 10/hr. |
| 2 | **Entitlement bypass** | ✅ | Entitlements created ONLY via Stripe webhook. `DownloadLinkView` checks `is_revoked=False` AND version is `PUBLISHED`. |
| 3 | **Version swapping** | ✅ | Download URL is per-`version_id`. `hashes.json` includes `version_id`. Mobile verifies match before flash. |
| 4 | **Zip slip** | ✅ | `is_safe_zip_path()` in `tasks.py` rejects paths containing `..` or absolute paths. Tested in `test_pipeline.py`. |
| 5 | **Rate limiting** | ✅ | `DownloadRateThrottle` (10/hr), `UploadRateThrottle` (5/hr) in `core/throttles.py`. Payment throttle (3/10min). |
| 6 | **Key rotation** | ✅ | Procedure documented in `docs/key_rotation.md`. `signing_key_version` stored on each `TuneVersion`. |
| 7 | **Stripe webhook spoofing** | ✅ | `stripe.Webhook.construct_event()` verifies `Stripe-Signature` header. Invalid → 400. |
| 8 | **Webhook replay** | ✅ | `PaymentTransaction.webhook_event_id` deduplication. Same event ID → skip. |
| 9 | **Quarantine access** | ⚠️ | Requires manual Supabase dashboard verification: `revsync-quarantine` bucket has NO public SELECT policy. |
| 10 | **Kill switch** | ✅ | `AdminSuspendVersionView` sets `SUSPENDED`. Mobile calls `/version-status` before flash. |

## Mobile-Side Mitigations

| # | Threat | Status | Implementation |
|---|--------|--------|----------------|
| 11 | **MITM on download** | ✅ | TLS enforced by default. Ed25519 signature provides additional integrity verification. |
| 12 | **Tampered local file** | ✅ | `TuneValidationScreen` re-verifies signature before enabling flash. `FlashWizardScreen` checks `hasVerifiedPackage()`. |
| 13 | **BLE disconnect mid-flash** | ✅ | `StandardECUService.startConnectionMonitor()` detects disconnect via `monitorCharacteristic`. `assertConnected()` throws `BLE_DISCONNECT` error. Recovery screen available. |
| 14 | **Missing backup** | ✅ | `FlashWizardScreen` pre-check requires `backupPath` to be set. Flash button disabled without verified backup. |

---

## Summary

- **13/14 mitigations verified in code** ✅
- **1/14 requires manual Supabase dashboard check** ⚠️ (#9 quarantine bucket RLS)

# RevSync Ed25519 Key Rotation Procedure

## Overview

RevSync uses Ed25519 digital signatures to guarantee tune file integrity and authenticity. The private key lives on the backend; the public key is embedded in the mobile app.

---

## Key Pair Structure

| Component | Key | Location |
|-----------|-----|----------|
| Backend | **Private key** (64 bytes, base64) | `REVSYNC_SIGNING_KEY_B64` env variable |
| Mobile | **Public key** (32 bytes, base64) | `CryptoService.ts` → `REVSYNC_PUBLIC_KEY_B64` |

---

## Rotation Steps

### 1. Generate New Key Pair

```python
from nacl.signing import SigningKey
import base64

new_key = SigningKey.generate()
private_b64 = base64.b64encode(bytes(new_key)).decode()
public_b64 = base64.b64encode(bytes(new_key.verify_key)).decode()

print(f"PRIVATE (backend): {private_b64}")
print(f"PUBLIC  (mobile):  {public_b64}")
```

### 2. Deploy New Private Key to Backend

1. Set `REVSYNC_SIGNING_KEY_B64` to the new private key in your deployment environment
2. Also set `REVSYNC_SIGNING_KEY_VERSION` to the next version integer (e.g., `2`)
3. Restart the backend service

All **new** tune versions will be signed with the new key. Existing signatures remain valid with the old key.

### 3. Ship New Public Key to Mobile

**Option A — OTA Config Push (Preferred)**:
- Push the new public key via a remote config endpoint or Expo Updates
- Mobile app fetches the config on launch and updates its key store

**Option B — App Update**:
- Update `REVSYNC_PUBLIC_KEY_B64` in `CryptoService.ts`
- Ship a new app version

### 4. Transition Window

During transition, the mobile app must accept signatures from **both** the current and previous public key:

```typescript
const REVSYNC_PUBLIC_KEYS = [
    'NEW_KEY_BASE64',    // Current key (version 2)
    'OLD_KEY_BASE64',    // Previous key (version 1) — remove after transition
];

function verifyTuneSignature(hash: Uint8Array, signatureB64: string): boolean {
    const signature = Buffer.from(signatureB64, 'base64');
    return REVSYNC_PUBLIC_KEYS.some(keyB64 => {
        const pk = Buffer.from(keyB64, 'base64');
        return nacl.sign.detached.verify(hash, signature, pk);
    });
}
```

### 5. Complete Rotation

After 30 days (or when all active tune versions have been re-signed):
1. Remove the old public key from `REVSYNC_PUBLIC_KEYS`
2. Ship an app update removing the old key
3. Rotation complete

---

## Emergency Key Compromise

If the private key is compromised:

1. **Immediately** generate and deploy a new key pair (steps 1–3)
2. **Suspend** all published tune versions (`AdminSuspendVersionView`)
3. Re-sign and re-publish each version with the new key
4. Force-update mobile app to accept only the new key (no transition window)
5. Notify all users and tuners of the re-verification requirement

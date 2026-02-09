"""
Ed25519 signing and verification for tune packages.

The private key is stored as a Base64-encoded PEM in the environment variable
REVSYNC_SIGNING_KEY_B64. In development, an ephemeral key is auto-generated
(WARNING: this means signatures won't verify across server restarts).

The public key is extracted from the private key and provided via
get_public_key_pem() — this value is embedded in the mobile app at build time.

Key rotation:
  - Deploy new REVSYNC_SIGNING_KEY_B64
  - Mobile app accepts current + previous key during transition window
  - DB stores signing_key_id on each TuneVersion
  - get_public_key_pem() returns the current key, served via /api/v1/signing-key/
"""

import os
import base64
import hashlib
import json
import logging
from typing import Optional

from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from django.conf import settings

logger = logging.getLogger(__name__)

# Singleton key instance (loaded once per process)
_private_key: Optional[ed25519.Ed25519PrivateKey] = None
_key_id: str = ''

KEY_ENV_VAR = "REVSYNC_SIGNING_KEY_B64"


def get_signing_key() -> ed25519.Ed25519PrivateKey:
    """
    Retrieves and loads the private Ed25519 key.
    
    Priority:
      1. REVSYNC_SIGNING_KEY_B64 env var (base64-encoded PEM)
      2. REVSYNC_SIGNING_PRIVATE_KEY setting (raw PEM string)
      3. DEV FALLBACK: ephemeral auto-generated key
    """
    global _private_key, _key_id

    if _private_key is not None:
        return _private_key

    # Try env var first (base64-encoded PEM)
    key_b64 = os.environ.get(KEY_ENV_VAR, '')
    if key_b64:
        try:
            key_bytes = base64.b64decode(key_b64)
            _private_key = serialization.load_pem_private_key(key_bytes, password=None)
            _key_id = getattr(settings, 'REVSYNC_SIGNING_KEY_ID', 'rev-1')
            logger.info(f"Signing key loaded from env (key_id: {_key_id})")
            return _private_key
        except Exception as e:
            raise ValueError(f"Failed to load signing key from {KEY_ENV_VAR}: {e}")

    # Try Django settings (raw PEM)
    raw_pem = getattr(settings, 'REVSYNC_SIGNING_PRIVATE_KEY', '')
    if raw_pem:
        try:
            _private_key = serialization.load_pem_private_key(
                raw_pem.encode('utf-8') if isinstance(raw_pem, str) else raw_pem,
                password=None
            )
            _key_id = getattr(settings, 'REVSYNC_SIGNING_KEY_ID', 'rev-1')
            logger.info(f"Signing key loaded from settings (key_id: {_key_id})")
            return _private_key
        except Exception as e:
            raise ValueError(f"Failed to load signing key from settings: {e}")

    # DEV FALLBACK: Generate ephemeral key
    logger.warning(
        "⚠️  WARNING: Using ephemeral signing key. "
        "Set REVSYNC_SIGNING_KEY_B64 in env for production. "
        "Signatures will NOT survive server restart."
    )
    _private_key = ed25519.Ed25519PrivateKey.generate()
    _key_id = 'ephemeral-dev'
    return _private_key


def sign_data(data: bytes | str) -> str:
    """
    Signs the input data using Ed25519.
    
    Args:
        data: Raw bytes or a string (will be encoded to UTF-8).
    
    Returns:
        Base64-encoded signature string.
    """
    if isinstance(data, str):
        data = data.encode('utf-8')
    
    private_key = get_signing_key()
    signature = private_key.sign(data)
    return base64.b64encode(signature).decode('utf-8')


def verify_data(data: bytes | str, signature_b64: str) -> bool:
    """
    Verifies an Ed25519 signature against data.
    
    Args:
        data: Original data that was signed.
        signature_b64: Base64-encoded signature.
    
    Returns:
        True if signature is valid.
    """
    if isinstance(data, str):
        data = data.encode('utf-8')
    
    try:
        private_key = get_signing_key()
        public_key = private_key.public_key()
        signature = base64.b64decode(signature_b64)
        public_key.verify(signature, data)
        return True
    except Exception:
        return False


def get_public_key_pem() -> str:
    """
    Returns the public key in PEM format.
    
    This value is:
      - Embedded in the mobile app at build time
      - Served via GET /api/v1/signing-key/ for OTA key rotation
    """
    private_key = get_signing_key()
    public_key = private_key.public_key()
    pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return pem.decode('utf-8')


def get_public_key_raw_b64() -> str:
    """
    Returns the raw 32-byte Ed25519 public key as Base64.
    
    This is the format consumed by tweetnacl on the mobile client,
    which expects raw key bytes (not PEM-wrapped).
    """
    private_key = get_signing_key()
    public_key = private_key.public_key()
    raw_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    return base64.b64encode(raw_bytes).decode('utf-8')


def get_key_id() -> str:
    """Returns the current signing key ID (e.g., 'rev-1')."""
    get_signing_key()  # Ensure key is loaded
    return _key_id


def generate_hashes_json(
    version_id: str,
    listing_id: str,
    version_number: str,
    tune_hash: str,
    manifest_hash: str,
    package_hash: str,
    tune_filename: str,
    tune_size_bytes: int,
) -> bytes:
    """
    Generates the hashes.json artifact for a validated tune package.
    
    This file is uploaded alongside the package and signature to the
    validated bucket. The mobile app downloads and verifies it.
    """
    from django.utils import timezone
    
    data = {
        'version_id': version_id,
        'listing_id': listing_id,
        'version_number': version_number,
        'tune_bin_sha256': tune_hash,
        'manifest_sha256': manifest_hash,
        'package_sha256': package_hash,
        'tune_filename': tune_filename,
        'tune_size_bytes': tune_size_bytes,
        'signed_at': timezone.now().isoformat(),
        'signing_key_id': get_key_id(),
    }
    
    return json.dumps(data, indent=2).encode('utf-8')

import os
import base64
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

# In production, this comes from ENV or HashiCorp Vault
# GENERATE NEW KEY:
# private_key = ed25519.Ed25519PrivateKey.generate()
# pem = private_key.private_bytes(encoding=serialization.Encoding.PEM, format=serialization.PrivateFormat.PKCS8, encryption_algorithm=serialization.NoEncryption())
# print(base64.b64encode(pem))

KEY_ENV_VAR = "REVSYNC_SIGNING_KEY_B64"

def get_signing_key():
    """Retrieves and loads the private Ed25519 key."""
    key_b64 = os.environ.get(KEY_ENV_VAR)
    if not key_b64:
        # FALLBACK FOR DEV: Generate ephemeral key if none exists
        # WARN: In production this should crash
        print("WARNING: Using ephemeral signing key. Set REVSYNC_SIGNING_KEY_B64 in env.")
        return ed25519.Ed25519PrivateKey.generate()
        
    try:
        key_bytes = base64.b64decode(key_b64)
        private_key = serialization.load_pem_private_key(
            key_bytes,
            password=None
        )
        return private_key
    except Exception as e:
        raise ValueError(f"Failed to load signing key: {e}")

def sign_data(data_bytes: bytes) -> str:
    """
    Signs the input bytes using Ed25519.
    Returns Base64 encoded signature.
    """
    private_key = get_signing_key()
    signature = private_key.sign(data_bytes)
    return base64.b64encode(signature).decode('utf-8')

def get_public_key_pem() -> str:
    """Returns the Public Key in PEM format (to be embedded in Mobile App)."""
    private_key = get_signing_key()
    public_key = private_key.public_key()
    pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    return pem.decode('utf-8')

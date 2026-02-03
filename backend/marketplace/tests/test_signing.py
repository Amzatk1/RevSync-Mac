from django.test import TestCase
from marketplace.signing import sign_data, get_public_key_pem
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
import base64
from unittest.mock import patch

class SigningTest(TestCase):
    def setUp(self):
        # Generate a stable key for testing
        self.private_key = ed25519.Ed25519PrivateKey.generate()
        
    def test_sign_verification(self):
        with patch('marketplace.signing.get_signing_key', return_value=self.private_key):
            # 1. Sign data
            payload = b"test_hash_123"
            signature_b64 = sign_data(payload)
            
            # 2. Verify with Public Key
            pem = get_public_key_pem()
            public_key = serialization.load_pem_public_key(pem.encode('utf-8'))
            
            signature = base64.b64decode(signature_b64)
            
            # Should not raise exception
            public_key.verify(signature, payload)
        
    def test_tamper_fails(self):
        with patch('marketplace.signing.get_signing_key', return_value=self.private_key):
            payload = b"test_hash_123"
            signature_b64 = sign_data(payload)
            
            pem = get_public_key_pem()
            public_key = serialization.load_pem_public_key(pem.encode('utf-8'))
            
            signature = base64.b64decode(signature_b64)
            
            # Try verifying diff data
            with self.assertRaises(Exception):
                public_key.verify(signature, b"tampered_data")

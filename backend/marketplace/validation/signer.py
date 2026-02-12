"""
Ed25519 signing utilities for the validation pipeline.

Wraps the existing marketplace.signing module and adds a
sign_binding_payload() function that signs the canonical
{version_id, tune_hash, manifest_hash, package_hash} binding.
"""

import json
from marketplace.signing import sign_data, verify_data, get_key_id  # noqa: F401


def sign_binding_payload(
    version_id: str,
    tune_hash: str,
    manifest_hash: str,
    package_hash: str,
) -> str:
    """
    Sign a canonical binding payload that ties a version to its hashes.

    The payload is deterministic (sorted keys, compact separators) so that
    the mobile app can reconstruct and verify it independently.

    Args:
        version_id: UUID of the TuneVersion.
        tune_hash: SHA-256 of tune.bin.
        manifest_hash: SHA-256 of canonical manifest.
        package_hash: SHA-256 of the .revsyncpkg archive.

    Returns:
        Base64-encoded Ed25519 signature.
    """
    payload = json.dumps({
        'manifest_hash': manifest_hash,
        'package_hash': package_hash,
        'tune_hash': tune_hash,
        'version_id': version_id,
    }, sort_keys=True, separators=(',', ':')).encode('utf-8')

    return sign_data(payload)

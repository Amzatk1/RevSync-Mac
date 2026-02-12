"""
Supabase storage path helpers for the validation pipeline.

Provides standardised path generation and artifact removal for
quarantine and validated buckets.
"""

import logging
from typing import Tuple

logger = logging.getLogger(__name__)


def quarantine_path(user_id: str, listing_id: str, version_id: str) -> str:
    """
    Generate the standard quarantine bucket path for an upload.

    Format: tuner/{userId}/{listingId}/{versionId}/upload.revsyncpkg
    """
    return f"tuner/{user_id}/{listing_id}/{version_id}/upload.revsyncpkg"


def validated_paths(listing_id: str, version_id: str) -> Tuple[str, str, str]:
    """
    Generate the standard validated bucket paths for a signed package.

    Returns:
        Tuple of (package_path, signature_path, hashes_path).
    """
    base = f"listing/{listing_id}/{version_id}"
    return (
        f"{base}/package.revsyncpkg",
        f"{base}/signature.sig",
        f"{base}/hashes.json",
    )


def remove_validated_artifacts(listing_id: str, version_id: str) -> None:
    """
    Delete all validated artifacts for a version from Supabase storage.

    Called during enforcement removal (SUSPENDED → ARCHIVED).
    Failures are logged but do not raise — the caller handles state.
    """
    from core.supabase_client import delete_file

    pkg_path, sig_path, hashes_path = validated_paths(listing_id, version_id)

    for path in [pkg_path, sig_path, hashes_path]:
        try:
            delete_file('validated', path)
            logger.info(f"Deleted validated artifact: {path}")
        except Exception as e:
            logger.error(f"Failed to delete {path}: {e}")

"""
Schema validation and manifest canonicalization.

Re-exports validate_manifest from the existing manifest_schema module
and adds canonicalize_manifest() for deterministic hash computation.
"""

import json
from typing import Tuple, List

from marketplace.manifest_schema import validate_manifest, MANIFEST_SCHEMA  # noqa: F401


def canonicalize_manifest(manifest_data: dict) -> bytes:
    """
    Produce a deterministic canonical representation of a manifest.

    Used for computing manifest_hash_sha256. The canonical form is:
    - Keys sorted alphabetically (recursively)
    - No trailing whitespace
    - UTF-8 encoded
    - No indent (compact)
    - Separators: (', ', ': ') for Python json.dumps default

    This ensures the same manifest always produces the same hash,
    regardless of key ordering in the original JSON file.
    """
    return json.dumps(
        manifest_data,
        sort_keys=True,
        ensure_ascii=False,
        separators=(',', ':'),
    ).encode('utf-8')

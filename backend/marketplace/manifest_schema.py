"""
JSON Schema definition for .revsyncpkg manifest.json validation.

This schema enforces the structure described in the RevSync architecture doc.
All fields marked 'required' MUST be present for a package to pass validation.
"""

import jsonschema
from typing import Tuple, List

# ─────────────────────────────────────────────────────────────────────
# manifest.json JSON Schema (Draft 2020-12 compatible)
# ─────────────────────────────────────────────────────────────────────

MANIFEST_SCHEMA = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "required": [
        "uploader_supabase_user_id",
        "listing_id",
        "version",
        "created_at",
        "supported_ecu",
        "bike_fitment",
        "requirements",
        "safety",
        "file",
    ],
    "properties": {
        "uploader_supabase_user_id": {
            "type": "string",
            "minLength": 1,
            "description": "Supabase user ID of the uploader (UUID format)"
        },
        "listing_id": {
            "type": "string",
            "minLength": 1,
            "description": "UUID of the TuneListing this version belongs to"
        },
        "version": {
            "type": "string",
            "pattern": r"^\d+\.\d+\.\d+$",
            "description": "Semantic version string (e.g., 1.2.0)"
        },
        "created_at": {
            "type": "string",
            "format": "date-time",
            "description": "ISO 8601 creation timestamp"
        },
        "supported_ecu": {
            "type": "object",
            "required": ["ecu_family", "hw_ids"],
            "properties": {
                "ecu_family": {
                    "type": "string",
                    "minLength": 1,
                    "description": "ECU family identifier (e.g., Bosch_ME17)"
                },
                "hw_ids": {
                    "type": "array",
                    "items": {"type": "string", "minLength": 1},
                    "minItems": 1,
                    "description": "Supported hardware revision IDs"
                },
                "sw_ids": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Supported software revision IDs"
                },
                "cal_ids": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Supported calibration IDs"
                },
            },
        },
        "bike_fitment": {
            "type": "object",
            "required": ["make", "model", "year_from", "year_to"],
            "properties": {
                "make": {"type": "string", "minLength": 1},
                "model": {"type": "string", "minLength": 1},
                "year_from": {"type": "integer", "minimum": 1990, "maximum": 2100},
                "year_to": {"type": "integer", "minimum": 1990, "maximum": 2100},
            },
        },
        "requirements": {
            "type": "object",
            "required": ["fuel_octane_min"],
            "properties": {
                "fuel_octane_min": {
                    "type": "integer",
                    "minimum": 87,
                    "maximum": 110,
                    "description": "Minimum recommended fuel octane rating"
                },
                "required_mods": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Hardware modifications required for this tune"
                },
                "warnings": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Important warnings for the user"
                },
            },
        },
        "safety": {
            "type": "object",
            "required": ["risk_level"],
            "properties": {
                "risk_level": {
                    "type": "string",
                    "enum": ["LOW", "MED", "HIGH"],
                    "description": "Overall risk classification"
                },
                "known_limitations": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Known limitations or side effects"
                },
            },
        },
        "file": {
            "type": "object",
            "required": ["tune_filename", "tune_size_bytes"],
            "properties": {
                "tune_filename": {
                    "type": "string",
                    "pattern": r"^[a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+$",
                    "description": "Filename of the tune binary within the package"
                },
                "tune_size_bytes": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 52428800,  # 50 MB max
                    "description": "Expected size of tune binary in bytes"
                },
            },
        },
    },
    "additionalProperties": False,
}


def validate_manifest(manifest_data: dict) -> Tuple[bool, List[str]]:
    """
    Validates a manifest.json dictionary against the RevSync schema.
    
    Args:
        manifest_data: Parsed manifest.json content.
        
    Returns:
        Tuple of (is_valid, list_of_error_messages).
        If is_valid is True, error list is empty.
    """
    errors = []

    try:
        jsonschema.validate(instance=manifest_data, schema=MANIFEST_SCHEMA)
    except jsonschema.ValidationError as e:
        # Collect all errors (not just the first one)
        validator = jsonschema.Draft202012Validator(MANIFEST_SCHEMA)
        for error in validator.iter_errors(manifest_data):
            path = " → ".join(str(p) for p in error.absolute_path) if error.absolute_path else "root"
            errors.append(f"[{path}] {error.message}")

    # Cross-field validation
    if not errors:
        fitment = manifest_data.get("bike_fitment", {})
        year_from = fitment.get("year_from", 0)
        year_to = fitment.get("year_to", 0)
        if year_to < year_from:
            errors.append(
                f"[bike_fitment] year_to ({year_to}) must be >= year_from ({year_from})"
            )

    return (len(errors) == 0, errors)

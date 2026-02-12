"""
RevSync Validation Package — layered verification for .revsyncpkg uploads.

Modules:
    safe_zip      — Secure extraction with zip bomb / symlink / slip protection
    malware_scan  — ClamAV + YARA multi-layer scanning
    tune_checks   — Binary analysis (magic bytes, entropy, size bounds)
    schema        — JSON Schema validation + manifest canonicalization
    signer        — Ed25519 binding payload signing
    storage       — Supabase storage path helpers
"""

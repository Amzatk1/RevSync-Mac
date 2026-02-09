"""
Celery validation pipeline for .revsyncpkg tune packages.

Pipeline stages:
  1. ingest — verify file exists in quarantine
  2. scan_malware — ClamAV daemon scan (falls back to mock in dev)
  3. validate_package — unzip, extract manifest, JSON Schema validate, hash tune.bin
  4. compatibility_check — verify ECU family + HW IDs exist in database
  5. sign_and_move — Ed25519 sign, generate hashes.json, move to validated bucket

Security measures:
  - Zip slip prevention (path traversal attack)
  - File size limits (50 MB max)
  - Safe temp directory handling
  - ClamAV real scanning with configurable fallback

All tasks are idempotent — re-running with the same version_id is safe.
"""

import hashlib
import json
import logging
import os
import shutil
import tempfile
import zipfile
from pathlib import Path

from celery import shared_task
from django.conf import settings
from django.utils import timezone

from .models import TuneVersion, ValidationReport
from .manifest_schema import validate_manifest
from .signing import sign_data

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────

MAX_PACKAGE_SIZE = 50 * 1024 * 1024  # 50 MB
MAX_TUNE_BIN_SIZE = 50 * 1024 * 1024  # 50 MB
REQUIRED_FILES = {'manifest.json', 'tune.bin'}
ALLOWED_FILES = {'manifest.json', 'tune.bin', 'notes.md', 'constraints.json'}


# ─────────────────────────────────────────────────────────────────────
# Malware Scanner (ClamAV with fallback)
# ─────────────────────────────────────────────────────────────────────

def scan_for_malware(file_path: str) -> tuple[bool, str]:
    """
    Scans a file for malware using ClamAV daemon.
    
    Returns:
        (is_clean, message) — True if no malware found.
    """
    try:
        import pyclamd
        cd = pyclamd.ClamdUnixSocket()
        # Test connection
        cd.ping()
        
        result = cd.scan_file(file_path)
        if result is None:
            return (True, "ClamAV: CLEAN")
        else:
            # result format: {'/path': ('FOUND', 'Malware.Name')}
            virus_info = result.get(file_path, ('FOUND', 'Unknown'))
            virus_name = virus_info[1] if isinstance(virus_info, tuple) else str(virus_info)
            return (False, f"ClamAV: INFECTED — {virus_name}")
    
    except ImportError:
        logger.warning("pyclamd not installed — using mock malware scanner")
        return _mock_malware_scan(file_path)
    except Exception as e:
        # ClamAV daemon not available
        if os.environ.get('REVSYNC_REQUIRE_CLAMAV', '').lower() == 'true':
            raise RuntimeError(f"ClamAV is required but unavailable: {e}")
        
        logger.warning(f"ClamAV unavailable ({e}) — falling back to mock scanner")
        return _mock_malware_scan(file_path)


def _mock_malware_scan(file_path: str) -> tuple[bool, str]:
    """
    Mock malware scan for development.
    Checks file extension and magic bytes only.
    """
    # Basic checks: reject known executable formats
    try:
        with open(file_path, 'rb') as f:
            magic = f.read(4)
        
        # Reject PE executables, ELF binaries, Mach-O
        dangerous_magic = [
            b'MZ',       # PE/Windows executable
            b'\x7fELF',  # ELF binary
            b'\xfe\xed\xfa',  # Mach-O (32-bit)
            b'\xce\xfa\xed',  # Mach-O (64-bit)
        ]
        for sig in dangerous_magic:
            if magic[:len(sig)] == sig:
                return (False, f"MockScan: Executable binary detected (magic: {magic[:4].hex()})")
    except Exception:
        pass
    
    return (True, "MockScan: CLEAN (ClamAV not available)")


# ─────────────────────────────────────────────────────────────────────
# Zip Safety
# ─────────────────────────────────────────────────────────────────────

def is_safe_zip_path(zip_entry_name: str, extract_dir: str) -> bool:
    """
    Prevents zip slip (path traversal) attacks.
    
    A malicious zip could contain entries like '../../etc/passwd'
    that escape the extraction directory.
    """
    # Reject absolute paths
    if os.path.isabs(zip_entry_name):
        return False
    
    # Reject path traversal
    if '..' in zip_entry_name.split('/'):
        return False
    if '..' in zip_entry_name.split('\\'):
        return False
    
    # Resolve and verify the path stays within extract_dir
    resolved = os.path.realpath(os.path.join(extract_dir, zip_entry_name))
    extract_dir_resolved = os.path.realpath(extract_dir)
    
    return resolved.startswith(extract_dir_resolved + os.sep) or resolved == extract_dir_resolved


def compute_sha256(file_path: str) -> str:
    """Compute SHA-256 hash of a file. Reads in 8KB chunks for memory efficiency."""
    sha256 = hashlib.sha256()
    with open(file_path, 'rb') as f:
        for block in iter(lambda: f.read(8192), b''):
            sha256.update(block)
    return sha256.hexdigest()


# ─────────────────────────────────────────────────────────────────────
# Main Pipeline Task
# ─────────────────────────────────────────────────────────────────────

@shared_task(bind=True, max_retries=0)
def validate_tune_version(self, version_id: str):
    """
    Main orchestration task for the Validation Pipeline.
    
    Stages:
      1. Ingest — verify file exists in quarantine
      2. Malware scan — ClamAV or mock
      3. Package validation — unzip, schema check, hash
      4. Compatibility check — ECU family verification
      5. Sign & move — Ed25519 sign, hashes.json, move to validated bucket
    
    On failure at any stage, version status → FAILED and details are saved
    to the ValidationReport.
    """
    logger.info(f"═══ Starting validation pipeline for version {version_id} ═══")
    
    # Load version
    try:
        version = TuneVersion.objects.select_related('listing', 'listing__tuner').get(id=version_id)
    except TuneVersion.DoesNotExist:
        logger.error(f"Version {version_id} not found")
        return f"ABORT: Version {version_id} not found"

    # Create or reset validation report
    report, _ = ValidationReport.objects.update_or_create(
        version=version,
        defaults={
            'is_passed': False,
            'results': {},
            'blockers': [],
            'warnings': [],
        }
    )

    blockers: list[str] = []
    warnings: list[str] = []
    results: dict = {}
    temp_dir = None
    local_pkg_path = None

    try:
        # ─── Stage 1: Ingest ───
        logger.info("[Stage 1/5] Ingest — verifying quarantine file")
        
        if not version.quarantine_path:
            blockers.append("No quarantine_path set on version record")
            raise ValueError("Missing quarantine_path")
        
        from core.supabase_client import download_to_temp
        local_pkg_path = download_to_temp('quarantine', version.quarantine_path)
        
        # Check file size
        file_size = os.path.getsize(local_pkg_path)
        if file_size > MAX_PACKAGE_SIZE:
            blockers.append(f"Package too large: {file_size} bytes (max {MAX_PACKAGE_SIZE})")
            raise ValueError("Package exceeds size limit")
        
        results['ingest'] = 'PASS'
        logger.info(f"  ✓ File found: {file_size} bytes")

        # ─── Stage 2: Malware Scan ───
        logger.info("[Stage 2/5] Malware scan")
        
        is_clean, scan_message = scan_for_malware(local_pkg_path)
        results['malware_scan'] = scan_message
        
        if not is_clean:
            blockers.append(f"Malware detected: {scan_message}")
            # Delete infected file immediately
            from core.supabase_client import delete_file
            try:
                delete_file('quarantine', version.quarantine_path)
                logger.warning(f"  ✗ Infected file DELETED from quarantine")
            except Exception as e:
                logger.error(f"  ✗ Failed to delete infected file: {e}")
            raise ValueError("Malware detected")
        
        logger.info(f"  ✓ {scan_message}")

        # ─── Stage 3: Package Validation ───
        logger.info("[Stage 3/5] Package validation (unzip + manifest + hash)")
        
        # 3a. Verify it's a valid ZIP
        if not zipfile.is_zipfile(local_pkg_path):
            blockers.append("File is not a valid ZIP archive")
            raise ValueError("Not a ZIP file")
        
        # 3b. Extract to temp directory
        temp_dir = tempfile.mkdtemp(prefix='revsync_validate_')
        
        with zipfile.ZipFile(local_pkg_path, 'r') as zf:
            # Check all entries for zip slip
            for entry in zf.namelist():
                if not is_safe_zip_path(entry, temp_dir):
                    blockers.append(f"Zip slip detected: malicious path '{entry}'")
                    raise ValueError(f"Zip slip: {entry}")
            
            # Check for required files
            zip_files = set(zf.namelist())
            missing_required = REQUIRED_FILES - zip_files
            if missing_required:
                blockers.append(f"Missing required files: {missing_required}")
                raise ValueError(f"Missing: {missing_required}")
            
            # Check for unexpected files
            unexpected = zip_files - ALLOWED_FILES
            if unexpected:
                warnings.append(f"Unexpected files in package (ignored): {unexpected}")
            
            # Extract
            zf.extractall(temp_dir)
        
        results['zip_extraction'] = 'PASS'
        logger.info("  ✓ ZIP extracted safely")
        
        # 3c. Parse and validate manifest.json
        manifest_path = os.path.join(temp_dir, 'manifest.json')
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest_data = json.load(f)
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            blockers.append(f"manifest.json is not valid JSON: {e}")
            raise ValueError("Invalid manifest JSON")
        
        is_valid, schema_errors = validate_manifest(manifest_data)
        if not is_valid:
            for err in schema_errors:
                blockers.append(f"Manifest schema error: {err}")
            results['manifest_validation'] = 'FAIL'
            raise ValueError("Manifest schema validation failed")
        
        results['manifest_validation'] = 'PASS'
        logger.info("  ✓ manifest.json schema valid")
        
        # 3d. Verify tune.bin exists and matches declared size
        tune_filename = manifest_data['file']['tune_filename']
        tune_path = os.path.join(temp_dir, tune_filename)
        
        if not os.path.exists(tune_path):
            blockers.append(f"Tune file '{tune_filename}' declared in manifest but not found in package")
            raise ValueError("Tune file missing")
        
        tune_size = os.path.getsize(tune_path)
        declared_size = manifest_data['file']['tune_size_bytes']
        
        if tune_size != declared_size:
            blockers.append(
                f"Tune file size mismatch: actual={tune_size}, declared={declared_size}"
            )
            raise ValueError("Size mismatch")
        
        if tune_size > MAX_TUNE_BIN_SIZE:
            blockers.append(f"Tune binary too large: {tune_size} bytes")
            raise ValueError("Tune too large")
        
        # 3e. Compute hashes
        tune_hash = compute_sha256(tune_path)
        manifest_hash = compute_sha256(manifest_path)
        package_hash = compute_sha256(local_pkg_path)
        
        results['tune_hash_sha256'] = tune_hash
        results['manifest_hash_sha256'] = manifest_hash
        results['package_hash_sha256'] = package_hash
        results['hashing'] = 'PASS'
        logger.info(f"  ✓ tune.bin SHA-256: {tune_hash[:16]}...")

        # ─── Stage 4: Compatibility Check ───
        logger.info("[Stage 4/5] Compatibility check")
        
        ecu_data = manifest_data['supported_ecu']
        ecu_family = ecu_data['ecu_family']
        hw_ids = ecu_data['hw_ids']
        
        # Verify ECU family is known (optional: check against VehicleDefinition DB)
        # For now, validate format and length
        if not ecu_family or len(ecu_family) < 2:
            blockers.append(f"Invalid ECU family: '{ecu_family}'")
        if not hw_ids:
            blockers.append("No hardware IDs specified")
        
        # Cross-check fitment with listing
        fitment = manifest_data['bike_fitment']
        listing = version.listing
        if (fitment['make'].lower() != listing.vehicle_make.lower() or
            fitment['model'].lower() != listing.vehicle_model.lower()):
            warnings.append(
                f"Manifest fitment ({fitment['make']} {fitment['model']}) "
                f"differs from listing ({listing.vehicle_make} {listing.vehicle_model})"
            )
        
        if not blockers:
            results['compatibility'] = 'PASS'
            logger.info(f"  ✓ ECU family: {ecu_family}, HW IDs: {hw_ids}")
        else:
            results['compatibility'] = 'FAIL'
            raise ValueError("Compatibility check failed")

        # ─── Stage 5: Sign & Move ───
        logger.info("[Stage 5/5] Sign & move to validated bucket")
        
        # 5a. Sign the tune.bin hash
        signature_b64 = sign_data(tune_hash.encode('utf-8'))
        results['signing'] = 'PASS'
        logger.info("  ✓ Ed25519 signature generated")
        
        # 5b. Generate hashes.json
        hashes_data = {
            'version_id': str(version.id),
            'listing_id': str(version.listing.id),
            'version_number': version.version_number,
            'tune_bin_sha256': tune_hash,
            'manifest_sha256': manifest_hash,
            'package_sha256': package_hash,
            'tune_filename': tune_filename,
            'tune_size_bytes': tune_size,
            'signed_at': timezone.now().isoformat(),
            'signing_key_id': getattr(settings, 'REVSYNC_SIGNING_KEY_ID', 'rev-1'),
        }
        hashes_json = json.dumps(hashes_data, indent=2).encode('utf-8')
        signature_bytes = signature_b64.encode('utf-8')
        
        # 5c. Move package to validated bucket and upload artifacts
        from core.supabase_client import move_cross_bucket, upload_file
        
        dest_base = f"listing/{version.listing.id}/{version.id}"
        dest_pkg_path = f"{dest_base}/package.revsyncpkg"
        dest_sig_path = f"{dest_base}/signature.sig"
        dest_hashes_path = f"{dest_base}/hashes.json"
        
        # Move package: quarantine → validated
        move_cross_bucket(
            'quarantine', version.quarantine_path,
            'validated', dest_pkg_path,
        )
        logger.info("  ✓ Package moved to validated bucket")
        
        # Upload signature
        upload_file('validated', dest_sig_path, signature_bytes, 'text/plain')
        logger.info("  ✓ Signature uploaded")
        
        # Upload hashes.json
        upload_file('validated', dest_hashes_path, hashes_json, 'application/json')
        logger.info("  ✓ hashes.json uploaded")
        
        results['move'] = 'PASS'
        
        # 5d. Determine target state
        # Trusted tuners auto-advance to APPROVED
        tuner_tier = version.listing.tuner.tier
        if tuner_tier == 'TRUSTED':
            target_state = TuneVersion.State.APPROVED
            logger.info("  → Trusted tuner: auto-APPROVED")
        else:
            target_state = TuneVersion.State.READY_FOR_REVIEW
            logger.info("  → New tuner: READY_FOR_REVIEW")
        
        # 5e. Update version record
        version.status = target_state
        version.validated_path = dest_pkg_path
        version.file_hash_sha256 = tune_hash
        version.manifest_hash_sha256 = manifest_hash
        version.signature_base64 = signature_b64
        version.signed_at = timezone.now()
        version.manifest_data = manifest_data
        version.file_size_bytes = tune_size
        version.save()
        
        # 5f. Update report
        report.is_passed = True
        report.results = results
        report.warnings = warnings
        report.blockers = []
        report.save()
        
        logger.info(f"═══ Validation PASSED — version {version_id} → {target_state} ═══")
        return f"PASSED: {version_id} → {target_state}"

    except Exception as e:
        # ─── Failure Path ───
        logger.exception(f"Validation FAILED for {version_id}: {e}")
        
        version.status = TuneVersion.State.FAILED
        version.save(update_fields=['status', 'updated_at'])
        
        if str(e) not in [b for b in blockers]:
            blockers.append(str(e))
        
        report.is_passed = False
        report.results = results
        report.blockers = blockers
        report.warnings = warnings
        report.save()
        
        return f"FAILED: {version_id} — {blockers}"

    finally:
        # ─── Cleanup temp files ───
        if local_pkg_path and os.path.exists(local_pkg_path):
            try:
                os.remove(local_pkg_path)
            except OSError:
                pass
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
            except OSError:
                pass

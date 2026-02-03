from celery import shared_task
from django.conf import settings
from .models import TuneVersion, ValidationReport
import logging
import json
import hashlib
import time
from .signing import sign_data

logger = logging.getLogger(__name__)

# --- MOCK STORAGE CLIENT ---
class MockSupabase:
    def download_to_temp(self, bucket, path):
        # Create a dummy file for testing
        temp_path = f"/tmp/{os.path.basename(path)}"
        with open(temp_path, 'wb') as f:
            f.write(b"MOCK_TUNE_DATA")
        return temp_path
        
    def move_object(self, src_bucket, src_path, dest_bucket, dest_path):
        logger.info(f"MOVING {src_path} -> {dest_path}")
        return True

storage_client = MockSupabase()
import os

@shared_task
def validate_tune_version(version_id):
    """
    Main orchestration task for the Validation Pipeline.
    """
    logger.info(f"Starting validation for {version_id}")
    
    try:
        version = TuneVersion.objects.get(id=version_id)
    except TuneVersion.DoesNotExist:
        logger.error("Version not found")
        return

    # 1. Pipeline State Init
    report = ValidationReport.objects.create(version=version)
    blockers = []
    update_data = {}
    
    try:
        # 2. Fetch File (Quarantine)
        local_path = storage_client.download_to_temp("revsync-quarantine", version.quarantine_path)
        
        # 3. Malware Scan (Stub)
        # scan_result = run_clamav(local_path)
        # if scan_result.is_infected: 
        #    blockers.append("Malware detected")
        
        # 4. Extract & Parse Manifest
        # In real code: with zipfile.ZipFile(local_path) as z: ...
        
        # MOCK Logic
        file_hash = hashlib.sha256(b"MOCK_TUNE_DATA").hexdigest()
        manifest_data = {
            "supported_ecu": ["ECU123"],
            "version": "1.0.0" 
        }
        
        # 5. Schema Validation
        if "supported_ecu" not in manifest_data:
            blockers.append("Manifest missing 'supported_ecu'")
            
        update_data = {
            "file_hash_sha256": file_hash,
            "manifest_data": manifest_data,
            "file_size_bytes": 1024
        }
        
        # 6. Compatibility Check
        # if not is_supported(manifest_data['supported_ecu']):
        #     blockers.append("Unsupported ECU family")

        # 7. Final Decision
        if blockers:
            version.status = TuneVersion.State.FAILED
            report.is_passed = False
            report.blockers = blockers
        else:
            # 8. Sign & Move
            # Sign the file hash
            sig = sign_data(file_hash.encode('utf-8'))
            
            # Move to Validated Bucket
            dest_path = f"{version.listing.id}/{version.id}/package.revsyncpkg"
            storage_client.move_object(
                "revsync-quarantine", version.quarantine_path,
                "revsync-validated", dest_path
            )
            
            # Update Version Record
            update_data.update({
                "status": TuneVersion.State.READY_FOR_REVIEW,
                "validated_path": dest_path,
                "signature_base64": sig,
                "signed_at": None # Set to now()
            })
            
            report.is_passed = True
            
    except Exception as e:
        logger.exception("Validation Crash")
        version.status = TuneVersion.State.FAILED
        report.blockers.append(str(e))
        report.is_passed = False
        
    # Save Updates
    for k, v in update_data.items():
        setattr(version, k, v)
    
    if version.status == TuneVersion.State.READY_FOR_REVIEW:
        from django.utils import timezone
        version.signed_at = timezone.now()

    version.save()
    report.save()
    
    return f"Finished validation for {version_id}. Status: {version.status}"

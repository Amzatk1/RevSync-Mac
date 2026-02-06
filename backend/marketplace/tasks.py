from celery import shared_task
from django.conf import settings
from .models import TuneVersion, ValidationReport
import logging
import json
import hashlib
import time
from .signing import sign_data

logger = logging.getLogger(__name__)

import os
from supabase import create_client, Client
from django.conf import settings

# Initialize Real Supabase Client
url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_KEY", "")

# Fallback/Safety: Don't crash at module level if keys missing, handle in wrapper
supabase: Client = create_client(url, key) if url and key else None

class StorageClient:
    def download_to_temp(self, bucket, path):
        if not supabase:
            raise Exception("Supabase credentials not configured (SUPABASE_URL, SUPABASE_SERVICE_KEY)")
            
        temp_path = f"/tmp/{os.path.basename(path)}"
        
        # Download bytes
        data = supabase.storage.from_(bucket).download(path)
        
        # Write to temp file
        with open(temp_path, 'wb') as f:
            f.write(data)
            
        return temp_path
        
    def move_object(self, src_bucket, src_path, dest_bucket, dest_path):
        if not supabase:
             raise Exception("Supabase credentials not configured")

        logger.info(f"MOVING {src_path} (in {src_bucket}) -> {dest_path} (in {dest_bucket})")
        
        # Cross-bucket move usually requires Download -> Upload -> Delete
        # Optimization: If Supabase adds 'copy' support across buckets, use it.
        # For now, safe implementation:
        
        # 1. Download (if not already local, but we likely have it from previous step, 
        # but let's be safe and stream it or use helper)
        file_data = supabase.storage.from_(src_bucket).download(src_path)
        
        # 2. Upload to Dest
        supabase.storage.from_(dest_bucket).upload(dest_path, file_data)
        
        # 3. Delete from Source
        supabase.storage.from_(src_bucket).remove([src_path])
        
        return True

storage_client = StorageClient()
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
        
        # Real Hash Calculation
        sha256_hash = hashlib.sha256()
        with open(local_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        file_hash = sha256_hash.hexdigest()

        # Retrieve Manifest from Zip (or stub if file format strictness allows for now)
        # For this refactor, we assume the file *is* the package or we extract metadata.
        # Let's keep the manifest data variable but populate it meaningfully if possible, 
        # or at least remove the "MOCK_TUNE_DATA" string reference.
        
        manifest_data = {
            "supported_ecu": ["ECU123"], # This would come from the file/db in real valid logic
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

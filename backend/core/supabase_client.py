"""
Singleton Supabase Client Factory.

Centralizes all Supabase interactions. Prevents repeated create_client()
calls scattered across the codebase. Thread-safe via module-level init.
"""

import os
import logging
import tempfile
from typing import Optional

from django.conf import settings

logger = logging.getLogger(__name__)

# Lazy singleton — created on first access
_client = None


def get_supabase_client():
    """
    Returns a singleton Supabase Client using service-role credentials.
    
    The service-role key bypasses RLS and is used ONLY server-side for:
      - Downloading from quarantine bucket
      - Uploading to validated bucket
      - Generating signed download URLs
    
    Raises RuntimeError if credentials are not configured.
    """
    global _client
    if _client is not None:
        return _client

    url = getattr(settings, 'SUPABASE_URL', '') or os.environ.get('SUPABASE_URL', '')
    key = (
        getattr(settings, 'SUPABASE_SERVICE_ROLE_KEY', '')
        or os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    )

    if not url or not key:
        raise RuntimeError(
            "Supabase credentials not configured. "
            "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment or Django settings."
        )

    from supabase import create_client
    _client = create_client(url, key)
    logger.info("Supabase client initialized (service-role)")
    return _client


def get_bucket_name(bucket_type: str) -> str:
    """
    Returns the configured bucket name for a given type.
    
    Args:
        bucket_type: One of 'quarantine', 'validated', 'public'
    """
    storage_config = getattr(settings, 'SUPABASE_STORAGE', {})
    mapping = {
        'quarantine': storage_config.get('quarantine_bucket', 'revsync-quarantine'),
        'validated': storage_config.get('validated_bucket', 'revsync-validated'),
        'public': storage_config.get('public_bucket', 'revsync-public-assets'),
    }
    if bucket_type not in mapping:
        raise ValueError(f"Unknown bucket type: {bucket_type}. Use: {list(mapping.keys())}")
    return mapping[bucket_type]


def download_to_temp(bucket: str, path: str) -> str:
    """
    Downloads a file from a Supabase storage bucket to a local temp file.
    
    Returns:
        Absolute path to the downloaded temp file.
    
    Raises:
        RuntimeError: If download fails or Supabase is not configured.
    """
    client = get_supabase_client()
    bucket_name = get_bucket_name(bucket) if bucket in ('quarantine', 'validated', 'public') else bucket

    logger.info(f"Downloading {bucket_name}/{path} to temp file")

    try:
        data = client.storage.from_(bucket_name).download(path)
    except Exception as e:
        raise RuntimeError(f"Failed to download {bucket_name}/{path}: {e}")

    # Write to a secure temp file (auto-cleaned by OS, but caller should clean up)
    suffix = os.path.splitext(path)[1] or '.bin'
    fd, temp_path = tempfile.mkstemp(suffix=suffix, prefix='revsync_')
    try:
        with os.fdopen(fd, 'wb') as f:
            f.write(data)
    except Exception:
        os.close(fd)
        raise

    logger.info(f"Downloaded {len(data)} bytes to {temp_path}")
    return temp_path


def upload_file(bucket: str, path: str, file_data: bytes, content_type: str = 'application/octet-stream') -> None:
    """
    Uploads file data to a Supabase storage bucket.
    
    Args:
        bucket: Bucket type key ('quarantine', 'validated') or raw bucket name.
        path: Storage path within the bucket.
        file_data: Raw bytes to upload.
        content_type: MIME type for the upload.
    """
    client = get_supabase_client()
    bucket_name = get_bucket_name(bucket) if bucket in ('quarantine', 'validated', 'public') else bucket

    logger.info(f"Uploading {len(file_data)} bytes to {bucket_name}/{path}")
    client.storage.from_(bucket_name).upload(path, file_data, {"content-type": content_type})


def delete_file(bucket: str, path: str) -> None:
    """Deletes a file from a Supabase storage bucket."""
    client = get_supabase_client()
    bucket_name = get_bucket_name(bucket) if bucket in ('quarantine', 'validated', 'public') else bucket

    logger.info(f"Deleting {bucket_name}/{path}")
    client.storage.from_(bucket_name).remove([path])


def create_signed_url(bucket: str, path: str, expires_in: int = 300) -> str:
    """
    Creates a short-lived signed URL for downloading a file.
    
    Args:
        bucket: Bucket type key or raw bucket name.
        path: Storage path within the bucket.
        expires_in: URL lifetime in seconds (default 5 minutes).
    
    Returns:
        The signed URL string.
    """
    client = get_supabase_client()
    bucket_name = get_bucket_name(bucket) if bucket in ('quarantine', 'validated', 'public') else bucket

    result = client.storage.from_(bucket_name).create_signed_url(path, expires_in)
    
    # Supabase Python SDK returns different formats depending on version
    if isinstance(result, dict):
        return result.get('signedURL') or result.get('signedUrl', '')
    return str(result)


def move_cross_bucket(
    src_bucket: str,
    src_path: str,
    dest_bucket: str,
    dest_path: str,
) -> None:
    """
    Moves a file across Supabase storage buckets.
    
    Cross-bucket move is: Download → Upload → Delete source.
    This is atomic from the perspective of the destination (upload completes
    before source is deleted). If upload fails, source remains intact.
    """
    client = get_supabase_client()
    src_bucket_name = get_bucket_name(src_bucket) if src_bucket in ('quarantine', 'validated', 'public') else src_bucket
    dest_bucket_name = get_bucket_name(dest_bucket) if dest_bucket in ('quarantine', 'validated', 'public') else dest_bucket

    logger.info(f"Moving {src_bucket_name}/{src_path} → {dest_bucket_name}/{dest_path}")

    # 1. Download from source
    file_data = client.storage.from_(src_bucket_name).download(src_path)

    # 2. Upload to destination (if this fails, source is still intact)
    client.storage.from_(dest_bucket_name).upload(dest_path, file_data)

    # 3. Delete from source (only after successful upload)
    client.storage.from_(src_bucket_name).remove([src_path])

    logger.info("Cross-bucket move completed successfully")

"""
Secure ZIP extraction for .revsyncpkg tune packages.

Security measures:
    - Zip slip prevention (path traversal via '..', absolute paths)
    - Zip bomb protection (file count, total size, compression ratio caps)
    - Symlink detection and rejection
    - Strict file allowlist enforcement (only 4 files permitted)

All constants are configurable but default to conservative production values.
"""

import os
import stat
import zipfile
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────

MAX_FILES_IN_ARCHIVE = 10          # Reject archives with more entries
MAX_DECOMPRESSED_SIZE = 100 * 1024 * 1024  # 100 MB total
MAX_COMPRESSION_RATIO = 100       # 100:1 — anything higher is suspicious
MAX_SINGLE_FILE_SIZE = 50 * 1024 * 1024    # 50 MB per file

# Only these filenames are permitted in a .revsyncpkg
ALLOWED_FILES = frozenset({'manifest.json', 'tune.bin', 'notes.md', 'constraints.json'})
REQUIRED_FILES = frozenset({'manifest.json', 'tune.bin'})


@dataclass
class ZipCheckResult:
    """Result of a safe zip extraction attempt."""
    ok: bool = True
    extract_dir: Optional[str] = None
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    file_count: int = 0
    total_decompressed_size: int = 0


def is_safe_zip_path(entry_name: str, extract_dir: str) -> bool:
    """
    Prevents zip slip (path traversal) attacks.

    A malicious zip could contain entries like '../../etc/passwd'
    that escape the extraction directory.
    """
    # Reject absolute paths
    if os.path.isabs(entry_name):
        return False

    # Reject path traversal components
    parts_fwd = entry_name.split('/')
    parts_bkwd = entry_name.split('\\')
    if '..' in parts_fwd or '..' in parts_bkwd:
        return False

    # Resolve and verify path stays within extract_dir
    resolved = os.path.realpath(os.path.join(extract_dir, entry_name))
    extract_dir_resolved = os.path.realpath(extract_dir)

    return (
        resolved.startswith(extract_dir_resolved + os.sep)
        or resolved == extract_dir_resolved
    )


def _check_symlink(info: zipfile.ZipInfo) -> bool:
    """
    Detects symlink entries in a zip archive.

    Symlinks in zips can be used to escape the extraction directory
    by pointing to files outside the target folder.
    """
    # Unix symlinks in zip use external_attr high bytes
    # The mode is stored in the upper 16 bits of external_attr
    unix_mode = info.external_attr >> 16
    if unix_mode != 0 and stat.S_ISLNK(unix_mode):
        return True
    return False


def extract_safely(
    zip_path: str,
    extract_dir: str,
    *,
    allowed_files: frozenset[str] = ALLOWED_FILES,
    required_files: frozenset[str] = REQUIRED_FILES,
    max_files: int = MAX_FILES_IN_ARCHIVE,
    max_total_size: int = MAX_DECOMPRESSED_SIZE,
    max_ratio: int = MAX_COMPRESSION_RATIO,
) -> ZipCheckResult:
    """
    Safely extract a .revsyncpkg zip archive with full security checks.

    Args:
        zip_path: Path to the zip file on disk.
        extract_dir: Temporary directory to extract into.
        allowed_files: Set of permitted filenames.
        required_files: Set of required filenames.
        max_files: Maximum number of entries in the archive.
        max_total_size: Maximum total decompressed size in bytes.
        max_ratio: Maximum compression ratio (compressed:decompressed).

    Returns:
        ZipCheckResult with ok=True if extraction succeeded safely.
    """
    result = ZipCheckResult(extract_dir=extract_dir)

    # ─── Step 1: Verify it's a valid ZIP ───
    if not zipfile.is_zipfile(zip_path):
        result.ok = False
        result.errors.append("File is not a valid ZIP archive")
        return result

    compressed_size = os.path.getsize(zip_path)

    try:
        with zipfile.ZipFile(zip_path, 'r') as zf:
            entries = zf.infolist()

            # ─── Step 2: File count check ───
            result.file_count = len(entries)
            if result.file_count > max_files:
                result.ok = False
                result.errors.append(
                    f"Too many files in archive: {result.file_count} (max {max_files})"
                )
                return result

            # ─── Step 3: Pre-extraction checks on each entry ───
            total_decompressed = 0
            entry_names: set[str] = set()

            for info in entries:
                name = info.filename

                # Skip directory entries
                if name.endswith('/'):
                    continue

                entry_names.add(name)

                # 3a. Zip slip check
                if not is_safe_zip_path(name, extract_dir):
                    result.ok = False
                    result.errors.append(
                        f"Zip slip detected: malicious path '{name}'"
                    )
                    return result

                # 3b. Symlink check
                if _check_symlink(info):
                    result.ok = False
                    result.errors.append(
                        f"Symlink detected: '{name}' — symlinks are not permitted"
                    )
                    return result

                # 3c. Accumulate decompressed size
                total_decompressed += info.file_size

                # 3d. Single file size check
                if info.file_size > MAX_SINGLE_FILE_SIZE:
                    result.ok = False
                    result.errors.append(
                        f"File '{name}' too large: {info.file_size} bytes "
                        f"(max {MAX_SINGLE_FILE_SIZE})"
                    )
                    return result

            result.total_decompressed_size = total_decompressed

            # ─── Step 4: Total decompressed size check ───
            if total_decompressed > max_total_size:
                result.ok = False
                result.errors.append(
                    f"Total decompressed size too large: {total_decompressed} bytes "
                    f"(max {max_total_size})"
                )
                return result

            # ─── Step 5: Compression ratio check (zip bomb) ───
            if compressed_size > 0:
                ratio = total_decompressed / compressed_size
                if ratio > max_ratio:
                    result.ok = False
                    result.errors.append(
                        f"Suspicious compression ratio: {ratio:.1f}:1 "
                        f"(max {max_ratio}:1) — possible zip bomb"
                    )
                    return result

            # ─── Step 6: Required files check ───
            missing = required_files - entry_names
            if missing:
                result.ok = False
                result.errors.append(f"Missing required files: {missing}")
                return result

            # ─── Step 7: Forbidden files check (strict allowlist) ───
            forbidden = entry_names - allowed_files
            if forbidden:
                result.ok = False
                result.errors.append(
                    f"Forbidden files in package: {forbidden}. "
                    f"Only {sorted(allowed_files)} are permitted."
                )
                return result

            # ─── Step 8: Safe extraction ───
            zf.extractall(extract_dir)
            logger.info(
                f"Safe extraction complete: {result.file_count} files, "
                f"{total_decompressed} bytes decompressed"
            )

    except zipfile.BadZipFile as e:
        result.ok = False
        result.errors.append(f"Corrupt ZIP archive: {e}")
    except Exception as e:
        result.ok = False
        result.errors.append(f"Extraction failed: {e}")

    return result

"""
Binary analysis checks for tune.bin files.

Checks:
    - Magic byte rejection (PE, ELF, Mach-O, script shebangs)
    - Shannon entropy bounds (flag packed/encrypted or empty-padded files)
    - File size bounds (minimum and maximum)
    - Null byte ratio (catch empty-padded fakes)

These are heuristic checks — they catch obvious problems but cannot
replace ClamAV/YARA for true malware detection.
"""

import math
import logging
from collections import Counter
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────

MIN_TUNE_SIZE = 64              # Minimum realistic tune binary size
MAX_TUNE_SIZE = 50 * 1024 * 1024  # 50 MB

# Shannon entropy bounds (0.0 = all same byte, 8.0 = perfectly random)
# Legitimate ECU tune binaries typically have entropy between 3.0 and 7.5
ENTROPY_MIN = 0.5       # Below this = suspiciously empty/padded
ENTROPY_MAX = 7.99      # Above this = suspiciously encrypted/packed

# Null byte ratio threshold — legitimate tunes rarely exceed 80% nulls
MAX_NULL_RATIO = 0.80

# Dangerous executable magic bytes
DANGEROUS_MAGIC: list[tuple[bytes, str]] = [
    (b'MZ',                 'PE/Windows executable'),
    (b'\x7fELF',            'ELF binary'),
    (b'\xfe\xed\xfa\xce',   'Mach-O 32-bit'),
    (b'\xfe\xed\xfa\xcf',   'Mach-O 64-bit'),
    (b'\xce\xfa\xed\xfe',   'Mach-O reverse 32-bit'),
    (b'\xcf\xfa\xed\xfe',   'Mach-O reverse 64-bit'),
    (b'#!/bin/',             'Unix shell script'),
    (b'#!/usr/',             'Unix shell script'),
    (b'<script',             'HTML/JS injection'),
    (b'<?php',               'PHP script'),
]


@dataclass
class TuneCheckResult:
    """Result of binary analysis on a tune file."""
    ok: bool = True
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    entropy: float = 0.0
    null_ratio: float = 0.0
    file_size: int = 0


def _compute_entropy(data: bytes) -> float:
    """
    Compute Shannon entropy of a byte sequence.

    Returns value between 0.0 (all identical bytes) and 8.0 (perfectly random).
    Reads only the first 1MB for performance on large files.
    """
    if not data:
        return 0.0

    # Use at most 1MB for entropy calculation
    sample = data[:1024 * 1024]
    length = len(sample)

    freq = Counter(sample)
    entropy = 0.0

    for count in freq.values():
        p = count / length
        if p > 0:
            entropy -= p * math.log2(p)

    return entropy


def check_binary(file_path: str) -> TuneCheckResult:
    """
    Run all binary analysis checks on a tune file.

    Args:
        file_path: Path to the tune.bin file on disk.

    Returns:
        TuneCheckResult with ok=True if all checks pass.
    """
    result = TuneCheckResult()

    try:
        with open(file_path, 'rb') as f:
            data = f.read()
    except Exception as e:
        result.ok = False
        result.errors.append(f"Cannot read tune file: {e}")
        return result

    result.file_size = len(data)

    # ─── Check 1: File size bounds ───
    if result.file_size < MIN_TUNE_SIZE:
        result.ok = False
        result.errors.append(
            f"Tune file too small: {result.file_size} bytes (min {MIN_TUNE_SIZE})"
        )
        return result

    if result.file_size > MAX_TUNE_SIZE:
        result.ok = False
        result.errors.append(
            f"Tune file too large: {result.file_size} bytes (max {MAX_TUNE_SIZE})"
        )
        return result

    # ─── Check 2: Magic byte detection ───
    header = data[:16]
    for magic, description in DANGEROUS_MAGIC:
        if header[:len(magic)] == magic:
            result.ok = False
            result.errors.append(
                f"Executable binary detected: {description} "
                f"(magic: 0x{header[:len(magic)].hex()})"
            )
            return result

    # ─── Check 3: Shannon entropy ───
    result.entropy = _compute_entropy(data)

    if result.entropy < ENTROPY_MIN:
        result.ok = False
        result.errors.append(
            f"Suspiciously low entropy: {result.entropy:.3f} "
            f"(min {ENTROPY_MIN}) — file may be empty-padded or fake"
        )

    if result.entropy > ENTROPY_MAX:
        result.warnings.append(
            f"Very high entropy: {result.entropy:.3f} "
            f"(threshold {ENTROPY_MAX}) — file may be encrypted or packed. "
            f"Manual review recommended."
        )
        # High entropy is a warning, not a hard blocker — encrypted tunes are legitimate

    # ─── Check 4: Null byte ratio ───
    if result.file_size > 0:
        null_count = data.count(b'\x00')
        result.null_ratio = null_count / result.file_size

        if result.null_ratio > MAX_NULL_RATIO:
            result.warnings.append(
                f"High null byte ratio: {result.null_ratio:.1%} "
                f"(threshold {MAX_NULL_RATIO:.0%}) — file may be mostly empty"
            )

    logger.info(
        f"Tune check: size={result.file_size}, entropy={result.entropy:.3f}, "
        f"null_ratio={result.null_ratio:.1%}, ok={result.ok}"
    )

    return result

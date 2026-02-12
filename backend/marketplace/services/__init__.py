"""
Enforcement service for the RevSync marketplace.

Handles:
    - Version suspension with reason tracking and audit logging
    - Version removal: artifact deletion (SUSPENDED → ARCHIVED)
    - Entitlement revocation for affected versions
    - Offender escalation: warn → temp-ban → permanent account suspension
    - Malware incident handling: immediate tuner suspension

All actions create AuditLog entries and are idempotent.
"""

import logging
from datetime import timedelta
from typing import Optional

from django.utils import timezone

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────
# Escalation Thresholds
# ─────────────────────────────────────────────────────────────────────

FAILURE_WINDOW_DAYS = 30       # Rolling window for counting failures
WARNING_THRESHOLD = 3          # Failures before first warning
UPLOAD_BAN_THRESHOLD = 5       # Failures before temporary upload ban
UPLOAD_BAN_DAYS = 7            # Duration of temporary upload ban


def suspend_version(
    version_id: str,
    reason: str,
    actor_user=None,
) -> None:
    """
    Suspend a TuneVersion: set status=SUSPENDED, record reason and actor.

    Idempotent — silently succeeds if already suspended.

    Args:
        version_id: UUID of the TuneVersion to suspend.
        reason: Human-readable reason for suspension.
        actor_user: The admin/moderator performing the action.
    """
    from marketplace.models import TuneVersion
    from core.models import AuditLog

    version = TuneVersion.objects.get(id=version_id)

    if version.status == TuneVersion.State.SUSPENDED:
        logger.info(f"Version {version_id} already suspended — no-op")
        return

    old_status = version.status
    version.status = TuneVersion.State.SUSPENDED
    version.suspension_reason = reason

    if actor_user:
        version.suspended_by = actor_user

    update_fields = ['status', 'suspension_reason', 'updated_at']
    if actor_user:
        update_fields.append('suspended_by')

    version.save(update_fields=update_fields)

    AuditLog.objects.create(
        user=actor_user,
        action='ENFORCE_SUSPEND_VERSION',
        data={
            'version_id': str(version_id),
            'listing_id': str(version.listing_id),
            'reason': reason,
            'previous_status': old_status,
        },
    )

    logger.warning(
        f"Version {version_id} suspended: {reason} "
        f"(by {'system' if not actor_user else actor_user.email})"
    )


def remove_version_artifacts(
    version_id: str,
    actor_user=None,
) -> None:
    """
    Remove a suspended version: delete storage artifacts, set ARCHIVED.

    This is a destructive action — the package is permanently deleted
    from the validated bucket. The version record remains for audit.

    Args:
        version_id: UUID of the TuneVersion to remove.
        actor_user: The admin performing the removal.
    """
    from marketplace.models import TuneVersion
    from marketplace.validation.storage import remove_validated_artifacts
    from core.models import AuditLog

    version = TuneVersion.objects.get(id=version_id)

    if version.status not in (TuneVersion.State.SUSPENDED, TuneVersion.State.PUBLISHED):
        logger.warning(
            f"Cannot remove version {version_id} — status is {version.status}"
        )
        return

    # Delete artifacts from storage
    remove_validated_artifacts(
        str(version.listing_id),
        str(version.id),
    )

    # Update version record
    version.status = TuneVersion.State.ARCHIVED
    version.removed_at = timezone.now()
    version.save(update_fields=['status', 'removed_at', 'updated_at'])

    AuditLog.objects.create(
        user=actor_user,
        action='ENFORCE_REMOVE_VERSION',
        data={
            'version_id': str(version_id),
            'listing_id': str(version.listing_id),
        },
    )

    logger.warning(f"Version {version_id} artifacts removed and archived")


def revoke_entitlements_for_version(version_id: str) -> int:
    """
    Revoke all active entitlements for a specific tune version.

    Returns the number of entitlements revoked.
    """
    from marketplace.models import TuneVersion, PurchaseEntitlement
    from core.models import AuditLog

    version = TuneVersion.objects.get(id=version_id)

    revoked_count = PurchaseEntitlement.objects.filter(
        listing=version.listing,
        is_revoked=False,
    ).update(is_revoked=True)

    if revoked_count > 0:
        AuditLog.objects.create(
            user=None,
            action='ENFORCE_REVOKE_ENTITLEMENTS',
            data={
                'version_id': str(version_id),
                'listing_id': str(version.listing_id),
                'count': revoked_count,
            },
        )
        logger.warning(
            f"Revoked {revoked_count} entitlements for version {version_id}"
        )

    return revoked_count


def check_escalation(tuner_user_id: str) -> Optional[str]:
    """
    Check a tuner's recent failure history and apply escalating penalties.

    Escalation levels:
        1. >= 3 failures in 30 days → warning audit log
        2. >= 5 failures in 30 days → temporary upload ban (7 days)
        3. Any malware hit          → immediate account suspension

    Args:
        tuner_user_id: UUID of the tuner's User account.

    Returns:
        Action taken: 'warning', 'upload_ban', or None.
    """
    from tuners.models import TunerProfile
    from core.models import AuditLog

    try:
        profile = TunerProfile.objects.get(user_id=tuner_user_id)
    except TunerProfile.DoesNotExist:
        logger.error(f"No TunerProfile for user {tuner_user_id}")
        return None

    # Increment failure counter
    profile.failed_upload_count += 1
    profile.save(update_fields=['failed_upload_count'])

    # Check escalation thresholds
    if profile.failed_upload_count >= UPLOAD_BAN_THRESHOLD:
        # Level 2: Temporary upload ban
        profile.upload_suspended_until = timezone.now() + timedelta(days=UPLOAD_BAN_DAYS)
        profile.save(update_fields=['upload_suspended_until'])

        AuditLog.objects.create(
            user=None,
            action='ENFORCE_UPLOAD_BAN',
            data={
                'tuner_user_id': str(tuner_user_id),
                'failures': profile.failed_upload_count,
                'ban_until': profile.upload_suspended_until.isoformat(),
            },
        )
        logger.warning(
            f"Tuner {tuner_user_id} upload-banned until "
            f"{profile.upload_suspended_until.isoformat()} "
            f"({profile.failed_upload_count} failures)"
        )
        return 'upload_ban'

    elif profile.failed_upload_count >= WARNING_THRESHOLD:
        # Level 1: Warning
        AuditLog.objects.create(
            user=None,
            action='ENFORCE_TUNER_WARNING',
            data={
                'tuner_user_id': str(tuner_user_id),
                'failures': profile.failed_upload_count,
            },
        )
        logger.info(
            f"Tuner {tuner_user_id} warned: "
            f"{profile.failed_upload_count} failures in window"
        )
        return 'warning'

    return None


def handle_malware_hit(
    version_id: str,
    tuner_user_id: str,
    scan_details: Optional[list[str]] = None,
) -> None:
    """
    Handle a confirmed malware detection: suspend version + tuner.

    This is the nuclear option — called when ClamAV or YARA detect
    actual malicious content. The tuner account is immediately suspended.

    Args:
        version_id: UUID of the infected TuneVersion.
        tuner_user_id: UUID of the tuner's User account.
        scan_details: Details from the scan result.
    """
    from tuners.models import TunerProfile
    from core.models import AuditLog

    # 1. Suspend the version
    suspend_version(
        version_id,
        reason=f"Malware detected: {'; '.join(scan_details or ['Unknown threat'])}",
    )

    # 2. Suspend the tuner account
    try:
        profile = TunerProfile.objects.get(user_id=tuner_user_id)
        profile.is_suspended = True
        profile.malware_strike_count += 1
        profile.save(update_fields=['is_suspended', 'malware_strike_count'])

        AuditLog.objects.create(
            user=None,
            action='ENFORCE_MALWARE_SUSPENSION',
            data={
                'tuner_user_id': str(tuner_user_id),
                'version_id': str(version_id),
                'scan_details': scan_details or [],
                'malware_strikes': profile.malware_strike_count,
            },
        )

        logger.critical(
            f"MALWARE: Tuner {tuner_user_id} suspended — "
            f"version {version_id} — strike {profile.malware_strike_count}"
        )

    except TunerProfile.DoesNotExist:
        logger.error(
            f"Cannot suspend tuner {tuner_user_id} — profile not found"
        )

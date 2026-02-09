"""
Shared permission classes for RevSync API.

These are role-based permissions that leverage the flag-based access
model on the User model (is_tuner, is_moderator, is_admin, tuner_tier).
"""

from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Only users with is_admin=True."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'is_admin', False)
        )


class IsModerator(permissions.BasePermission):
    """Users with is_moderator=True OR is_admin=True."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            getattr(request.user, 'is_moderator', False)
            or getattr(request.user, 'is_admin', False)
        )


class IsVerifiedUser(permissions.BasePermission):
    """Only users who have verified their email address."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'is_verified', False)
        )


class IsTuner(permissions.BasePermission):
    """
    Users with is_tuner=True AND an active (non-suspended) TunerProfile.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not getattr(request.user, 'is_tuner', False):
            return False
        # Check for active tuner profile
        profile = getattr(request.user, 'tuner_profile', None)
        if profile is None:
            return False
        if getattr(profile, 'is_suspended', False):
            return False
        return True


class IsTrustedTuner(permissions.BasePermission):
    """
    Users with is_tuner=True AND tuner_tier='TRUSTED'.
    Trusted tuners can auto-approve their own tune versions.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not getattr(request.user, 'is_tuner', False):
            return False
        return getattr(request.user, 'tuner_tier', '') == 'TRUSTED'


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission: object.user == request.user OR request.user is admin.
    Expects the object to have a 'user' attribute.
    """

    def has_object_permission(self, request, view, obj):
        if getattr(request.user, 'is_admin', False):
            return True
        obj_user = getattr(obj, 'user', None)
        return obj_user == request.user

"""
Rate limiting / throttle classes for RevSync API.

These enforce per-user rate limits on sensitive operations to prevent
abuse, scraping, and denial-of-service attacks.
"""

from rest_framework.throttling import UserRateThrottle


class DownloadRateThrottle(UserRateThrottle):
    """
    Limits tune package downloads to 10 per hour per authenticated user.
    
    This prevents:
      - Automated scraping of paid tune files
      - Download URL harvesting via rapid requests
      - Abuse of signed URL generation (each call generates a new 5-min URL)
    """
    scope = 'download'
    rate = '10/hour'


class UploadRateThrottle(UserRateThrottle):
    """
    Limits tune package uploads to 5 per hour per authenticated tuner.
    
    This prevents:
      - Storage abuse (large file uploads)
      - Flooding the validation pipeline
    """
    scope = 'upload'
    rate = '5/hour'


class PaymentRateThrottle(UserRateThrottle):
    """
    Limits payment intent creation to 3 per 10 minutes per user.
    
    This prevents:
      - Card testing attacks (using Stripe to validate stolen cards)
      - Accidental double-purchases from rapid tapping
    """
    scope = 'payment'
    rate = '3/min'


class TunerApplicationThrottle(UserRateThrottle):
    """
    Limits tuner applications to 1 per day per user.
    
    Prevents spam applications after rejection.
    """
    scope = 'tuner_application'
    rate = '1/day'

default_app_config = "publishing.apps.PublishingConfig"

# Celery auto-discovery hint
from .tasks import app as celery_app  # noqa: F401

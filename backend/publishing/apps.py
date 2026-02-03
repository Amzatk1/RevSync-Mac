from django.apps import App, AppConfig


class PublishingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "publishing"
    verbose_name = "RevSync Publishing"

    def ready(self):
        # Import signals if needed in future
        try:
            import publishing.signals  # noqa: F401
        except Exception:
            # Avoid blocking app init if optional dependencies are missing
            pass

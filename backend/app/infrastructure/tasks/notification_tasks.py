"""Placeholder task modules — implemented in their respective phases."""
from app.infrastructure.celery_app import celery_app


@celery_app.task(name="app.infrastructure.tasks.notification_tasks.send_email")
def send_email(to: str, subject: str, body: str, html: str | None = None) -> dict:
    """Send transactional email via AWS SES. Implemented in Phase 9."""
    raise NotImplementedError("Email notifications implemented in Phase 9")


@celery_app.task(name="app.infrastructure.tasks.notification_tasks.send_push_notification")
def send_push_notification(device_token: str, title: str, body: str, data: dict | None = None) -> dict:
    """Send push notification via FCM. Implemented in Phase 9."""
    raise NotImplementedError("Push notifications implemented in Phase 9")


@celery_app.task(name="app.infrastructure.tasks.notification_tasks.send_sms")
def send_sms(to: str, message: str) -> dict:
    """Send SMS via Twilio. Implemented in Phase 9."""
    raise NotImplementedError("SMS notifications implemented in Phase 9")

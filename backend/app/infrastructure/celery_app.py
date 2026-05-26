"""
app/workers/celery_app.py
──────────────────────────
Celery application instance and configuration.

Uses Redis as both broker and result backend.
Beat schedule for periodic tasks defined in beat_schedule.py.
"""
from __future__ import annotations

from celery import Celery

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "swigato",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "app.infrastructure.tasks.notification_tasks",
        "app.infrastructure.tasks.order_tasks",
        "app.infrastructure.tasks.payment_tasks",
        "app.infrastructure.tasks.analytics_tasks",
        "app.infrastructure.tasks.cleanup_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,                  # Re-queue on worker crash
    worker_prefetch_multiplier=1,         # Process one task at a time per worker (fairness)
    task_soft_time_limit=300,             # 5 min soft limit → raises SoftTimeLimitExceeded
    task_time_limit=360,                  # 6 min hard limit → SIGKILL
    result_expires=86400,                 # Keep results for 24 hours
)

# Import beat schedule
from app.infrastructure.beat_schedule import BEAT_SCHEDULE  # noqa: E402
celery_app.conf.beat_schedule = BEAT_SCHEDULE

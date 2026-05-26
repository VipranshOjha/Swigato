"""Cleanup Celery tasks."""
from app.infrastructure.celery_app import celery_app


@celery_app.task(name="app.infrastructure.tasks.cleanup_tasks.expire_abandoned_carts")
def expire_abandoned_carts() -> dict:
    return {"status": "not_implemented", "phase": 5}


@celery_app.task(name="app.infrastructure.tasks.cleanup_tasks.cleanup_old_location_logs")
def cleanup_old_location_logs() -> dict:
    return {"status": "not_implemented", "phase": 8}

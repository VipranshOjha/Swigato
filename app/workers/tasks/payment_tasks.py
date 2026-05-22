"""Payment-related Celery tasks. Full implementation in Phase 7."""
from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.tasks.payment_tasks.process_weekly_payouts")
def process_weekly_payouts() -> dict:
    return {"status": "not_implemented", "phase": 7}

"""Analytics Celery tasks. Full implementation in Phase 10."""
from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.tasks.analytics_tasks.update_restaurant_ratings")
def update_restaurant_ratings() -> dict:
    return {"status": "not_implemented", "phase": 10}


@celery_app.task(name="app.workers.tasks.analytics_tasks.generate_daily_analytics")
def generate_daily_analytics() -> dict:
    return {"status": "not_implemented", "phase": 10}

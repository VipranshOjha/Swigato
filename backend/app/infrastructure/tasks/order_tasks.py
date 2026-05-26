"""Order-related Celery tasks. Full implementation in Phase 6 and 8."""
from app.infrastructure.celery_app import celery_app


@celery_app.task(name="app.infrastructure.tasks.order_tasks.cancel_unpaid_orders")
def cancel_unpaid_orders() -> dict:
    """Cancel orders that remain unpaid after 15 minutes. Phase 6."""
    return {"status": "not_implemented", "phase": 6}


@celery_app.task(name="app.infrastructure.tasks.order_tasks.flush_rider_locations_to_db")
def flush_rider_locations_to_db() -> dict:
    """Flush Redis GEO rider positions to PostgreSQL. Phase 8."""
    return {"status": "not_implemented", "phase": 8}

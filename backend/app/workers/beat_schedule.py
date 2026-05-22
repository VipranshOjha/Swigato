"""
app/workers/beat_schedule.py
─────────────────────────────
Celery Beat periodic task schedule.
All times in UTC.
"""
from celery.schedules import crontab

BEAT_SCHEDULE = {
    # Cancel orders that are unpaid after 15 minutes
    "cancel-unpaid-orders": {
        "task": "app.workers.tasks.order_tasks.cancel_unpaid_orders",
        "schedule": 300.0,  # Every 5 minutes
    },
    # Expire abandoned carts older than 7 days
    "expire-abandoned-carts": {
        "task": "app.workers.tasks.cleanup_tasks.expire_abandoned_carts",
        "schedule": crontab(minute=0, hour="*"),  # Hourly
    },
    # Recalculate restaurant ratings
    "update-restaurant-ratings": {
        "task": "app.workers.tasks.analytics_tasks.update_restaurant_ratings",
        "schedule": crontab(minute="*/30"),  # Every 30 minutes
    },
    # Daily analytics aggregation
    "generate-daily-analytics": {
        "task": "app.workers.tasks.analytics_tasks.generate_daily_analytics",
        "schedule": crontab(minute=0, hour=0),  # Midnight UTC
    },
    # Flush Redis rider locations to PostgreSQL
    "flush-rider-locations": {
        "task": "app.workers.tasks.order_tasks.flush_rider_locations_to_db",
        "schedule": 60.0,  # Every 60 seconds
    },
    # Weekly payout batch
    "weekly-payouts": {
        "task": "app.workers.tasks.payment_tasks.process_weekly_payouts",
        "schedule": crontab(minute=0, hour=9, day_of_week=1),  # Monday 9am UTC
    },
    # Clean up old location logs (>30 days)
    "cleanup-location-logs": {
        "task": "app.workers.tasks.cleanup_tasks.cleanup_old_location_logs",
        "schedule": crontab(minute=0, hour=2),  # 2am UTC daily
    },
}

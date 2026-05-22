"""
app/redis.py
────────────
Async Redis client factory.
Separate DB numbers for cache, Celery, and rate limiting.
"""
from __future__ import annotations

import redis.asyncio as aioredis
from redis.asyncio import Redis

from app.config import get_settings

_cache_client: Redis | None = None
_rate_limit_client: Redis | None = None


def _build_redis_url(base_url: str, db: int) -> str:
    parts = base_url.rsplit("/", 1)
    return f"{parts[0]}/{db}"


def init_redis() -> None:
    global _cache_client, _rate_limit_client
    settings = get_settings()
    _cache_client = aioredis.from_url(
        _build_redis_url(settings.redis_url, settings.redis_cache_db),
        encoding="utf-8",
        decode_responses=True,
    )
    _rate_limit_client = aioredis.from_url(
        _build_redis_url(settings.redis_url, settings.redis_rate_limit_db),
        encoding="utf-8",
        decode_responses=True,
    )


async def close_redis() -> None:
    global _cache_client, _rate_limit_client
    if _cache_client:
        await _cache_client.aclose()
        _cache_client = None
    if _rate_limit_client:
        await _rate_limit_client.aclose()
        _rate_limit_client = None


def get_cache() -> Redis:
    if _cache_client is None:
        raise RuntimeError("Redis not initialized.")
    return _cache_client


def get_rate_limit_redis() -> Redis:
    if _rate_limit_client is None:
        raise RuntimeError("Redis not initialized.")
    return _rate_limit_client

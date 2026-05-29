"""
app/core/middleware.py
──────────────────────
Production middleware stack:

1. RequestIDMiddleware — assigns a unique ID to every request for tracing
2. StructuredLoggingMiddleware — logs every request/response with context
3. RateLimitMiddleware — Redis sliding window per IP and per endpoint
4. SecurityHeadersMiddleware — adds security HTTP headers

Middleware is registered in main.py in order (outermost first).
"""
from __future__ import annotations

import time
import uuid
from collections.abc import Callable

import structlog
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.core.exceptions import RateLimitError
from app.redis import get_rate_limit_redis

logger = structlog.get_logger(__name__)


# 1. Request ID

class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Assigns X-Request-ID to every request.
    If the client sends one, we use it (useful for distributed tracing).
    Otherwise we generate a UUID.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        # Store in request state so handlers can access it
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


# 2. Structured Logging

class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """
    Logs every HTTP request and response with structured fields.
    Excluded paths: /health, /ready, /metrics (high-frequency, low-value)
    """

    EXCLUDE_PATHS = {"/health", "/ready", "/metrics"}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.url.path in self.EXCLUDE_PATHS:
            return await call_next(request)

        start = time.perf_counter()
        request_id = getattr(request.state, "request_id", "unknown")

        response = await call_next(request)

        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        log = logger.bind(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
            client_ip=request.client.host if request.client else "unknown",
        )

        if response.status_code >= 500:
            await log.aerror("http_request")
        elif response.status_code >= 400:
            await log.awarning("http_request")
        else:
            await log.ainfo("http_request")

        return response


# 3. Rate Limiting

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding window rate limiter backed by Redis.

    Applies per-endpoint limits from settings.
    Falls back to global limit for unlisted endpoints.

    Algorithm: Redis atomic INCR + EXPIRE (sliding window approximation).
    For production, upgrade to the token bucket or sliding log algorithm
    using redis-py's pipeline if precision is critical.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        settings = get_settings()
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"

        # Determine limit for this path
        limit, window = self._get_limit(path, settings)

        redis = get_rate_limit_redis()
        key = f"rl:{path}:{client_ip}"

        pipe = redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, window)
        results = await pipe.execute()
        count = results[0]

        if count > limit:
            raise RateLimitError(
                f"Rate limit exceeded: {limit} requests per {window}s"
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - count))
        return response

    @staticmethod
    def _get_limit(path: str, settings) -> tuple[int, int]:
        """Returns (max_requests, window_seconds) for the given path."""
        if "/auth/login" in path:
            return settings.rate_limit_login_per_minute, 60
        if "/auth/register" in path:
            return settings.rate_limit_register_per_minute, 60
        if "/auth/forgot-password" in path:
            return settings.rate_limit_forgot_password_per_minute, 60
        return settings.rate_limit_global_per_minute, 60


# 4. Security Headers

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds security HTTP headers to every response.
    These won't be set by the framework automatically.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
        return response


# Registration

def register_middleware(app: FastAPI) -> None:
    """
    Register all middleware on the FastAPI app.
    Order matters: last added = outermost (first to run on request).
    """
    settings = get_settings()

    # CORS — must be outermost
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(StructuredLoggingMiddleware)
    app.add_middleware(RequestIDMiddleware)
    # Rate limiting applied after request ID is set
    app.add_middleware(RateLimitMiddleware)

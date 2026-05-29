"""
app/config.py
─────────────
Central configuration using pydantic-settings.
All settings are loaded from environment variables / .env file.
Type-safe, validated at startup — misconfiguration fails fast.

This is the SINGLE SOURCE OF TRUTH for all configuration.
No other file should call os.getenv() directly.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import computed_field, model_validator, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_env: Literal["development", "staging", "production", "testing"] = "development"
    app_debug: bool = False
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_name: str = "Swigato"
    app_version: str = "1.0.0"
    allowed_origins: list[str] = ["http://localhost:3000"]

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v  # type: ignore
        raise ValueError(v)

    # Security
    # RS256 asymmetric signing — generate with:
    #   openssl genrsa -out keys/private.pem 2048
    #   openssl rsa -in keys/private.pem -pubout -out keys/public.pem
    jwt_private_key_path: Path = Path("./keys/private.pem")
    jwt_public_key_path: Path = Path("./keys/public.pem")
    jwt_algorithm: str = "RS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 30

    # Keep SECRET_KEY for backwards-compat (used by existing .env)
    # Now only used as a fallback; primary auth is RS256 JWT
    secret_key: str = "change-me-to-a-long-random-string-in-production"

    # Database
    # Existing .env has: DATABASE_URL=postgresql://...
    # We need the asyncpg variant. The app will transform it automatically.
    database_url: str = "postgresql+asyncpg://postgres:mypassword@localhost:5432/swigato"
    database_pool_size: int = 20
    database_max_overflow: int = 10
    database_pool_timeout: int = 30

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_cache_db: int = 0
    redis_celery_db: int = 1
    redis_rate_limit_db: int = 2

    # Celery
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/1"

    # Email / AWS SES
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "ap-south-1"
    ses_from_email: str = "no-reply@swigato.com"
    ses_from_name: str = "Swigato"

    # Cloudflare R2
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "swigato-media"
    r2_public_url: str = "https://media.swigato.com"

    # Payment — Razorpay
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""

    # Payment — Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # SMS
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""

    # Firebase
    firebase_credentials_path: Path = Path("./keys/firebase-service-account.json")

    # Rate Limiting
    rate_limit_login_per_minute: int = 5
    rate_limit_register_per_minute: int = 10
    rate_limit_forgot_password_per_minute: int = 3
    rate_limit_global_per_minute: int = 100

    # OTP
    otp_expire_minutes: int = 10
    otp_length: int = 6

    # Geo
    default_delivery_radius_km: float = 10.0
    max_delivery_radius_km: float = 25.0

    # Computed properties
    @computed_field  # type: ignore[misc]
    @property
    def jwt_private_key(self) -> str:
        """Read RSA private key. Returns empty string in testing (fixture provides key)."""
        if self.app_env == "testing":
            return ""
        try:
            return self.jwt_private_key_path.read_text()
        except FileNotFoundError:
            return ""  # Graceful in dev before keys are generated

    @computed_field  # type: ignore[misc]
    @property
    def jwt_public_key(self) -> str:
        """Read RSA public key."""
        if self.app_env == "testing":
            return ""
        try:
            return self.jwt_public_key_path.read_text()
        except FileNotFoundError:
            return ""

    @computed_field  # type: ignore[misc]
    @property
    def async_database_url(self) -> str:
        """
        Ensure the database URL uses the asyncpg driver.
        Converts postgresql:// → postgresql+asyncpg://
        so the existing .env value works without changes.
        """
        url = self.database_url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url  # Already correct format

    @computed_field  # type: ignore[misc]
    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @computed_field  # type: ignore[misc]
    @property
    def is_testing(self) -> bool:
        return self.app_env == "testing"

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        """Enforce critical settings in production."""
        if self.is_production:
            assert self.secret_key != "change-me-to-a-long-random-string-in-production", \
                "SECRET_KEY must be set in production"
            assert self.razorpay_key_id, "RAZORPAY_KEY_ID must be set in production"
            assert self.aws_access_key_id, "AWS_ACCESS_KEY_ID must be set in production"
        return self


@lru_cache
def get_settings() -> Settings:
    """
    Returns a cached Settings instance.
    Use get_settings.cache_clear() in tests to reset between test runs.
    """
    return Settings()

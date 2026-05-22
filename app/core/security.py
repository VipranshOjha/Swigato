"""
app/core/security.py
─────────────────────
JWT creation/verification, password hashing, and token utilities.

Design decisions:
- RS256 (asymmetric) over HS256: Public key can be shared with other services
  for token verification without exposing the signing secret.
- argon2 (via pwdlib): Memory-hard hash, OWASP recommended for 2024+.
  More resistant to GPU brute-force than bcrypt.
- Refresh tokens stored hashed in DB (SHA-256) — raw token only ever in response.
- Access tokens are short-lived (15 min) and stateless.
- Revocation via Redis jti blacklist — O(1) lookup, auto-expires with token.
"""
from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from jose import JWTError, jwt
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

from app.config import get_settings
from app.core.exceptions import TokenExpiredError, TokenInvalidError

logger = structlog.get_logger(__name__)

# ─── Password Hashing ─────────────────────────────────────────────────────────

# argon2 with production-grade parameters
_pwd_hasher = PasswordHash([Argon2Hasher()])


def hash_password(plain: str) -> str:
    """Hash a plain-text password using argon2."""
    return _pwd_hasher.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against a stored hash."""
    return _pwd_hasher.verify(plain, hashed)


def check_needs_rehash(hashed: str) -> bool:
    """
    Check if a stored hash needs to be upgraded.
    Call after verify_password — if True, rehash and save the new hash.
    """
    return _pwd_hasher.check_needs_rehash(hashed)


# ─── JWT ──────────────────────────────────────────────────────────────────────

def _get_private_key() -> str:
    return get_settings().jwt_private_key


def _get_public_key() -> str:
    return get_settings().jwt_public_key


def create_access_token(
    subject: int | str,
    roles: list[str],
    extra_claims: dict[str, Any] | None = None,
) -> tuple[str, str]:
    """
    Create a signed JWT access token.

    Args:
        subject: The user ID (stored as 'sub' claim).
        roles: List of role strings (e.g. ['customer', 'admin']).
        extra_claims: Optional additional claims to include.

    Returns:
        Tuple of (encoded_jwt, jti) where jti is the unique token ID.
    """
    settings = get_settings()
    now = datetime.now(UTC)
    jti = secrets.token_hex(16)

    claims: dict[str, Any] = {
        "sub": str(subject),
        "roles": roles,
        "jti": jti,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_access_token_expire_minutes),
        "type": "access",
    }
    if extra_claims:
        claims.update(extra_claims)

    token = jwt.encode(claims, _get_private_key(), algorithm=settings.jwt_algorithm)
    return token, jti


def create_refresh_token() -> tuple[str, str]:
    """
    Create a cryptographically secure refresh token.

    Returns:
        Tuple of (raw_token, hashed_token).
        - raw_token: Sent to the client (never stored).
        - hashed_token: SHA-256 hash stored in DB.
    """
    raw = secrets.token_urlsafe(64)
    hashed = _hash_token(raw)
    return raw, hashed


def _hash_token(token: str) -> str:
    """SHA-256 hash of a raw token for secure storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def hash_refresh_token(raw_token: str) -> str:
    """Hash a refresh token for database lookup."""
    return _hash_token(raw_token)


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT access token.

    Raises:
        TokenExpiredError: If the token has expired.
        TokenInvalidError: If the token is malformed or signature invalid.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            _get_public_key(),
            algorithms=[settings.jwt_algorithm],
        )
        if payload.get("type") != "access":
            raise TokenInvalidError("Not an access token.")
        return payload
    except JWTError as e:
        if "expired" in str(e).lower():
            raise TokenExpiredError() from e
        raise TokenInvalidError(str(e)) from e


def create_otp(length: int | None = None) -> str:
    """Generate a numeric OTP of given length."""
    settings = get_settings()
    n = length or settings.otp_length
    # secrets.randbelow is cryptographically secure
    return "".join(str(secrets.randbelow(10)) for _ in range(n))


def create_email_verification_token() -> str:
    """Generate a URL-safe token for email verification links."""
    return secrets.token_urlsafe(32)


def create_password_reset_token() -> str:
    """Generate a URL-safe token for password reset links."""
    return secrets.token_urlsafe(32)

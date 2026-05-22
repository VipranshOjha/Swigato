"""
app/models/__init__.py
──────────────────────
Import all models here so Alembic can detect them via autogenerate
and so app/main.py can import them without specifying each file.
"""
from app.models.user import (  # noqa: F401
    EmailVerification,
    PasswordReset,
    RefreshToken,
    Role,
    User,
    UserRole,
)
from app.models.audit import AuditLog  # noqa: F401
from sqlalchemy import Column, BigInteger, String, TIMESTAMP
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True)

    full_name = Column(String, nullable=False)

    email = Column(String, unique=True, nullable=False)

    phone = Column(String, unique=True, nullable=False)

    password_hash = Column(String, nullable=False)

    role = Column(String, nullable=False)

    created_at = Column(
        TIMESTAMP,
        server_default=func.now()
    )

    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now()
    )

    deleted_at = Column(TIMESTAMP, nullable=True)
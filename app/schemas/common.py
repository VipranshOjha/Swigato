"""
app/schemas/common.py
──────────────────────
Shared Pydantic v2 schemas used across multiple domains.
"""
from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class AppBaseModel(BaseModel):
    """Base for all response schemas — ORM mode on by default."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


class PaginatedResponse(AppBaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool

    @classmethod
    def create(cls, items: list[T], total: int, page: int, page_size: int) -> "PaginatedResponse[T]":
        total_pages = (total + page_size - 1) // page_size if total > 0 else 1
        return cls(
            items=items, total=total, page=page, page_size=page_size,
            total_pages=total_pages, has_next=page < total_pages, has_prev=page > 1,
        )


class MessageResponse(AppBaseModel):
    message: str


class ErrorDetail(AppBaseModel):
    code: str
    message: str


class ErrorResponse(AppBaseModel):
    error: ErrorDetail

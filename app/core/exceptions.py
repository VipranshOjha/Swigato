"""
app/core/exceptions.py
──────────────────────
Custom exception hierarchy and FastAPI exception handlers.

Design:
- All app-level exceptions inherit from SwigatoException
- Each exception carries HTTP status code and error code for API consumers
- Exception handlers registered in main.py convert these to JSON responses
- Generic 500 handler ensures no raw Python tracebacks leak in production
"""
from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.responses import ORJSONResponse


# ─── Base ────────────────────────────────────────────────────────────────────

class SwigatoException(Exception):
    """Base class for all application exceptions."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred."

    def __init__(self, message: str | None = None, **kwargs):
        self.message = message or self.__class__.message
        for key, value in kwargs.items():
            setattr(self, key, value)
        super().__init__(self.message)

    def to_dict(self) -> dict:
        return {
            "error": {
                "code": self.error_code,
                "message": self.message,
            }
        }


# ─── Auth ─────────────────────────────────────────────────────────────────────

class AuthenticationError(SwigatoException):
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "AUTHENTICATION_FAILED"
    message = "Authentication failed."


class InvalidCredentialsError(AuthenticationError):
    error_code = "INVALID_CREDENTIALS"
    message = "Invalid email or password."


class TokenExpiredError(AuthenticationError):
    error_code = "TOKEN_EXPIRED"
    message = "Token has expired. Please log in again."


class TokenInvalidError(AuthenticationError):
    error_code = "TOKEN_INVALID"
    message = "Token is invalid or malformed."


class EmailNotVerifiedError(AuthenticationError):
    error_code = "EMAIL_NOT_VERIFIED"
    message = "Please verify your email address before logging in."


class RefreshTokenInvalidError(AuthenticationError):
    error_code = "REFRESH_TOKEN_INVALID"
    message = "Refresh token is invalid or has been revoked."


# ─── Authorization ────────────────────────────────────────────────────────────

class PermissionDeniedError(SwigatoException):
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "PERMISSION_DENIED"
    message = "You do not have permission to perform this action."


class AccountSuspendedError(SwigatoException):
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "ACCOUNT_SUSPENDED"
    message = "Your account has been suspended. Contact support."


# ─── Not Found ────────────────────────────────────────────────────────────────

class NotFoundError(SwigatoException):
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "NOT_FOUND"
    message = "The requested resource was not found."


class UserNotFoundError(NotFoundError):
    error_code = "USER_NOT_FOUND"
    message = "User not found."


class RestaurantNotFoundError(NotFoundError):
    error_code = "RESTAURANT_NOT_FOUND"
    message = "Restaurant not found."


class MenuItemNotFoundError(NotFoundError):
    error_code = "MENU_ITEM_NOT_FOUND"
    message = "Menu item not found."


class OrderNotFoundError(NotFoundError):
    error_code = "ORDER_NOT_FOUND"
    message = "Order not found."


class CouponNotFoundError(NotFoundError):
    error_code = "COUPON_NOT_FOUND"
    message = "Coupon not found."


# ─── Conflict / Business Logic ────────────────────────────────────────────────

class ConflictError(SwigatoException):
    status_code = status.HTTP_409_CONFLICT
    error_code = "CONFLICT"
    message = "A conflict occurred with existing data."


class EmailAlreadyExistsError(ConflictError):
    error_code = "EMAIL_EXISTS"
    message = "An account with this email already exists."


class PhoneAlreadyExistsError(ConflictError):
    error_code = "PHONE_EXISTS"
    message = "An account with this phone number already exists."


class InvalidOrderStateTransitionError(SwigatoException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "INVALID_ORDER_TRANSITION"
    message = "This order status transition is not allowed."


class CartRestaurantMismatchError(SwigatoException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "CART_RESTAURANT_MISMATCH"
    message = "Your cart contains items from a different restaurant. Clear it first."


class RestaurantClosedError(SwigatoException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "RESTAURANT_CLOSED"
    message = "This restaurant is currently closed."


class MenuItemUnavailableError(SwigatoException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "MENU_ITEM_UNAVAILABLE"
    message = "One or more items in your cart are no longer available."


class CouponInvalidError(SwigatoException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "COUPON_INVALID"
    message = "This coupon is invalid or cannot be applied."


class CouponExpiredError(CouponInvalidError):
    error_code = "COUPON_EXPIRED"
    message = "This coupon has expired."


class CouponUsageLimitError(CouponInvalidError):
    error_code = "COUPON_USAGE_LIMIT"
    message = "This coupon has reached its usage limit."


class PaymentError(SwigatoException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    error_code = "PAYMENT_ERROR"
    message = "Payment processing failed."


class InvalidWebhookSignatureError(SwigatoException):
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "INVALID_WEBHOOK_SIGNATURE"
    message = "Webhook signature verification failed."


# ─── Validation ───────────────────────────────────────────────────────────────

class ValidationError(SwigatoException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "VALIDATION_ERROR"
    message = "Request validation failed."


class MinOrderValueError(ValidationError):
    error_code = "MIN_ORDER_VALUE"
    message = "Your order does not meet the minimum order value."


# ─── Rate Limiting ────────────────────────────────────────────────────────────

class RateLimitError(SwigatoException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    error_code = "RATE_LIMIT_EXCEEDED"
    message = "Too many requests. Please try again later."


# ─── Exception Handlers ───────────────────────────────────────────────────────

def register_exception_handlers(app: FastAPI) -> None:
    """Register all custom exception handlers on the FastAPI app."""

    @app.exception_handler(SwigatoException)
    async def swigato_exception_handler(
        request: Request, exc: SwigatoException
    ) -> ORJSONResponse:
        return ORJSONResponse(
            status_code=exc.status_code,
            content=exc.to_dict(),
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request, exc: Exception
    ) -> ORJSONResponse:
        """
        Catch-all: Never expose raw Python errors in production.
        Log the full traceback but return a safe response.
        """
        import structlog
        logger = structlog.get_logger()
        await logger.aerror(
            "unhandled_exception",
            path=request.url.path,
            method=request.method,
            exc=str(exc),
            exc_type=type(exc).__name__,
        )
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred. Our team has been notified.",
                }
            },
        )

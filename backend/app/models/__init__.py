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
from app.models.address import Address  # noqa: F401
from app.models.audit import AuditLog  # noqa: F401
from app.models.restaurant import (  # noqa: F401
    ApprovalStatus,
    DocumentType,
    OperatingHour,
    Restaurant,
    RestaurantCategory,
    RestaurantDocument,
    restaurant_category_mapping,
)
from app.models.menu import (  # noqa: F401
    MenuCategory,
    MenuItem,
)
from app.models.cart import (  # noqa: F401
    Cart,
    CartItem,
)
from app.models.order import (  # noqa: F401
    Order,
    OrderItem,
    OrderStatusHistory,
)
from app.models.payment import (  # noqa: F401
    Payment,
    PaymentEvent,
    Refund,
)
from app.models.delivery import (  # noqa: F401
    DeliveryPartnerProfile,
    DeliveryLocationLog,
)
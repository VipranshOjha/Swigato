# PROJECT_CONTEXT.md

# Swigato

## Project Overview

Swigato is a production-grade food delivery platform inspired by Swiggy, Zomato, Uber Eats, and DoorDash.

The goal is to build a complete real-world food delivery ecosystem consisting of:

- Customers
- Restaurant Owners
- Delivery Partners
- Administrators

This project is being developed primarily as a backend engineering portfolio project and learning platform, while maintaining production-quality architecture and engineering standards.

The objective is not merely to clone Swiggy's UI but to understand and implement the complete backend architecture behind a modern food delivery platform.

---

# Long-Term Vision

Swigato should eventually support:

- User registration and authentication
- Role-based access control
- Restaurant onboarding
- Menu management
- Cart management
- Order placement
- Payment processing
- Coupon engine
- Delivery partner management
- Real-time order tracking
- Notifications
- Search
- Analytics
- Admin dashboard
- Review and rating systems

The architecture should remain scalable enough to later evolve from a modular monolith into microservices if desired.

---

# Development Philosophy

Priority order:

1. Correctness
2. Security
3. Maintainability
4. Scalability
5. Performance
6. Developer Experience

Code should favor readability and explicitness over cleverness.

Avoid premature optimization.

Build features completely before optimizing them.

Every major feature should have:

- API schemas
- Validation
- Business logic
- Error handling
- Authorization
- Tests
- Documentation

---

# Tech Stack

## Backend

- Python 3.12+
- FastAPI
- SQLAlchemy 2.x
- Pydantic v2
- Alembic
- PostgreSQL
- Redis
- Celery
- WebSockets

## Authentication

- JWT Access Tokens
- JWT Refresh Tokens
- Argon2 password hashing via pwdlib
- Role Based Access Control (RBAC)

## Database

Primary Database:

- PostgreSQL

Extensions:

- PostGIS

Caching & Realtime:

- Redis

---

# Current Architecture

Architecture follows:

API Layer
→ Service Layer
→ Repository Layer
→ Database Layer

Rules:

- Routers contain HTTP logic only
- Services contain business logic
- Repositories contain database logic only
- Models represent persistence
- Schemas represent API contracts

Business logic should never live in routers.

Database queries should never live directly in routers.

---

# Roles

System supports multiple roles:

- customer
- restaurant_owner
- delivery_partner
- admin
- super_admin

Users may hold multiple roles.

RBAC is enforced through dependencies and permissions.

---

# Database Design

Database schema was designed manually before implementation.

Core domains:

Authentication:
- users
- roles
- user_roles
- refresh_tokens
- email_verifications
- password_resets

Restaurant:
- restaurants
- restaurant_categories
- menu_categories
- menu_items

Cart:
- carts
- cart_items

Orders:
- orders
- order_items
- order_status_history

Payments:
- payments
- refunds

Delivery:
- delivery_partner_profiles
- delivery_location_logs

Reviews:
- reviews

Coupons:
- coupons
- order_coupons

Addresses:
- user_addresses

Additional supporting tables may be added if they improve architecture.

---

# External Services

Current decisions:

Payments:
- Razorpay first
- Stripe later

Email:
- AWS SES

Storage:
- Cloudflare R2 preferred
- S3-compatible abstraction layer

Location:
- Redis Geo for realtime tracking
- PostgreSQL/PostGIS for historical persistence

Delivery:
- Cash on Delivery supported

---

# Security Standards

Mandatory requirements:

- Password hashing using Argon2
- JWT rotation
- Refresh token storage
- Rate limiting
- Input validation
- CORS protection
- Audit logging
- Permission checks
- Soft deletes where appropriate

Never store plaintext passwords.

Never expose internal errors to clients.

Never trust frontend validation.

---

# API Standards

All APIs should:

- Use versioned routes (/api/v1)
- Return structured JSON responses
- Use proper HTTP status codes
- Use pagination where needed
- Use consistent naming conventions
- Include OpenAPI documentation

---

# Frontend

Frontend currently exists as a separate application.

Responsibilities:

- Authentication UI
- Profile management
- Restaurant browsing
- Ordering flow
- Delivery tracking
- Admin dashboards

Frontend should communicate exclusively through backend APIs.

No mock data should remain once backend endpoints exist.

---

# Current Progress

Completed:

✅ Project setup
✅ PostgreSQL configuration
✅ Redis configuration
✅ Alembic migrations
✅ Authentication domain
✅ Registration
✅ Login
✅ Refresh tokens
✅ Password reset flows
✅ Email verification flows
✅ RBAC foundation
✅ Swagger documentation
✅ Frontend ↔ Backend integration
✅ User Profile Management
✅ Address Management
✅ Protected Routes
✅ JWT Session Persistence
✅ Automatic Token Refresh
✅ Profile & Address Frontend Integration
✅ Restaurant Domain & DB Schema (Phase 3)
✅ Restaurant Onboarding & Owner Dashboard
✅ Admin Restaurant Approval & Suspension
✅ Public Restaurant Search & Discovery APIs
✅ Restaurant Frontend Integration (Onboarding, Dashboards, Discovery)
✅ Menu Management Domain (Phase 4): Menu Category & Menu Item DB models, CRUD schemas, and API endpoints (owner and public)
✅ Owner Menu Management UI & Public Restaurant Menu Discovery UI (Phase 4 Frontend)
✅ Cart Management Domain & DB Schema (Phase 5): Cart and CartItem models, repositories, schemas, and business logic
✅ Cart API Endpoints: Get cart, add/update/remove items, clear cart (Phase 5 API)
✅ Single-restaurant enforcement in Cart business rules (Phase 5 Business Logic)
✅ Cart Frontend Integration: Floating cart overlay, cart page, item count update (Phase 5 Frontend)
✅ Order Management Domain (Phase 6): Order, OrderItem, and OrderStatusHistory DB models, CRUD schemas, repositories, and services
✅ Customer checkout order placement, cancellation, and tracking API endpoints (Phase 6 Customer APIs)
✅ Owner Order Management dashboard and order action APIs: accept, reject, mark preparation/ready (Phase 6 Owner APIs)
✅ Admin system-wide order audit logs and detailed listing APIs (Phase 6 Admin APIs)
✅ Order Flow Frontend: Checkout page, Order History dashboard, Order detail status tracker, and Owner order manager (Phase 6 Frontend)
✅ Payments Domain & DB Schema (Phase 7): Payment and Refund models, repositories, schemas, and service layers
✅ Payment checkout integration: Payment initialization and mock Razorpay payment processing (Phase 7 APIs)
✅ Idempotent payment webhook receiver: Razorpay event logging and async order state transitioning (Phase 7 Webhook)
✅ Payments Frontend Integration: Payment selection and mock checkout widget, success redirection, and admin transaction panel (Phase 7 Frontend)

Currently Working On:

🔄 Delivery Partner Domain & Management (Phase 8)

Next Phase:

➡ Reviews, Coupons, and Notifications (Phase 9)

---

# Future Roadmap

✅ Phase 1: Authentication & Foundation
✅ Phase 2: Profiles & Addresses
✅ Phase 3: Restaurants
✅ Phase 4: Menus
✅ Phase 5: Cart
✅ Phase 6: Orders
✅ Phase 7: Payments

🔄 Phase 8: Delivery

⬜ Phase 9: Reviews, Coupons, Notifications

⬜ Phase 10: Search, Analytics, Observability


---

# Current Application State

Backend:
✅ Running locally
✅ PostgreSQL connected
✅ Redis connected
✅ Alembic migrations working
✅ OpenAPI documentation available
✅ Restaurant endpoints active (Owner, Admin, Public)
✅ Menu endpoints active (Owner, Public)
✅ Cart endpoints active (Customer)
✅ Order endpoints active (Customer, Owner, Admin)
✅ Payment endpoints and webhooks active (Customer, Admin)

Frontend:
✅ Running locally
✅ Authentication integrated
✅ Profile management integrated
✅ Address management integrated
✅ Protected routes enabled
✅ Restaurant Onboarding & Dashboards integrated
✅ Menu listing and item availability management integrated
✅ Cart view, item addition, quantity updates, and cart persistence integrated
✅ Checkout, order tracking, and order history panels integrated
✅ Payment integration and admin transaction log panel integrated

Testing:
✅ Authentication flow verified
✅ Profile updates verified
✅ Address CRUD verified
✅ Default address logic verified
✅ Restaurant creation, submission, approval, and search verified
✅ Menu CRUD and item availability toggle verified
✅ Cart CRUD and single-restaurant enforcement verified
✅ Order status transitioning, customer/owner dashboard permissions verified
✅ Payment initialization and idempotent webhook transaction flows verified

---

# AI Assistant Instructions

When making changes:

1. Preserve architecture boundaries.
2. Follow existing patterns.
3. Prefer consistency over novelty.
4. Update tests when functionality changes.
5. Generate Alembic migrations when schema changes.
6. Never remove security features.
7. Never bypass authorization.
8. Keep code production-ready.
9. Ask before introducing major architectural changes.
10. If a better design exists, explain it before implementing.

When uncertain:

Choose the solution that would be used in a real production system serving thousands of users.
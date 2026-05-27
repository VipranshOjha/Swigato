<div align="center">
  <img src="./assets/swigato-logo.png" alt="Swigato Logo" width="220" />
  <h1>Swigato — Food Delivery Platform</h1>
  <p><strong>A production-grade, full-stack food delivery ecosystem built with FastAPI, PostgreSQL, and Vite.</strong></p>
  
  [![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
</div>

<br>

## Project Overview

Swigato is a complete, real-world food delivery ecosystem inspired by industry leaders like Swiggy, Zomato, Uber Eats, and DoorDash. Developed as a comprehensive backend engineering portfolio project, it maintains production-quality architecture, rigorous engineering standards, and an intuitive user interface utilizing the **Kinetic Zest** design system.

The objective of Swigato is to encapsulate the vast architectural complexity behind a modern food delivery platform. It elegantly handles four distinct user roles, resilient state-machine-driven order fulfillment, transactional delivery mapping, mock payment webhooks, and Role-Based Access Control (RBAC).

---

## Architecture Overview

Swigato is built as a robust modular monolith, specifically architected to facilitate a seamless transition to microservices if needed. 

### Backend Layering Strategy:
1. **API / Router Layer:** Dedicated strictly to HTTP lifecycle, validation, and request/response mapping.
2. **Service Layer:** Centralizes business rules, logic mapping, external API workflows, and state transitions.
3. **Repository Layer:** Abstracted data access patterns for seamless DB interactions.
4. **Database & Infrastructure Layer:** PostgreSQL for relational integrity, PostGIS for location logic, and Redis for volatile caching/real-time tracking.

### Security First:
- Argon2 Password Hashing
- JWT Access & Refresh Token Rotation
- Soft-Delete Entity Management
- Strict Database Transaction Management (`with_for_update` row locks to prevent race conditions during order acceptance)

---

## Features by Domain

### 🍔 Customer
- **Authentication & Profiles:** JWT-based login, password reset flow, and secure session management.
- **Address Management:** CRUD for multiple delivery addresses with geospatial tracking.
- **Discovery:** Browse active restaurants, explore menus, and filter by dietary tags (Veg/Non-Veg).
- **Cart & Checkout:** Persistent cart logic enforcing single-restaurant constraint.
- **Real-Time Tracking:** Track active orders across state transitions (Placed → Accepted → Preparing → Picked Up → Delivered).

### 🏪 Restaurant Owner
- **Onboarding:** Automated registration and profile management requiring admin approval.
- **Menu Management:** Complete CRUD interface for defining Categories, Menu Items, and toggling live availability.
- **Order Fulfillment:** Live dashboard to Accept/Reject incoming orders, mark as Preparing, and dispatch as Ready for Pickup.

### 🛵 Delivery Partner
- **Fleet Onboarding:** Registration via vehicle type and automated dispatch verification.
- **Availability Matrix:** Real-time Online/Offline toggle.
- **Order Assignment:** Smart backend dispatching that allocates orders and calculates delivery fee commissions on the fly.
- **Fulfillment Workflow:** Transaction-safe workflow to Accept, Pickup, Navigate, and Mark Delivered.
- **Earnings Tracker:** Live dashboard aggregating lifetime deliveries and payouts.

### 🛡️ Admin
- **Ecosystem Moderation:** Dashboard to audit, approve, or suspend Restaurants and Delivery Partners.
- **System Logs:** Read-only access to global Order states and Payment logs.

---

## Tech Stack

### Backend
- **Core:** Python 3.12+, FastAPI
- **Database ORM:** SQLAlchemy 2.x (Async)
- **Migrations:** Alembic
- **Databases:** PostgreSQL (Primary), Redis (Caching)
- **Data Validation:** Pydantic v2
- **Auth:** JWT, Argon2 (pwdlib)

### Frontend
- **Core:** Vanilla JS (ES6 Modules), HTML5
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (CDN)
- **HTTP Client:** Axios (Interceptors for token refresh rotation)

---

## Repository Structure

```text
Swigato/
├── backend/                  # FastAPI Backend Application
│   ├── alembic/              # Database schema migrations
│   ├── app/                  # Application Logic
│   │   ├── api/v1/           # API Routers grouped by version/domain
│   │   ├── core/             # Configuration, Security, Middlewares
│   │   ├── models/           # SQLAlchemy ORM Models
│   │   ├── repositories/     # Data Access Abstractions
│   │   ├── schemas/          # Pydantic Request/Response Models
│   │   └── services/         # Business Logic & Workflows
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # Vite Frontend Application
│   ├── js/                   # Vanilla JS logic mapping directly to APIs
│   ├── *.html                # Screen-specific templates
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Multi-page bundler configuration
│
└── docs/                     # Architectural Documentation
    ├── PROJECT_CONTEXT.md
    └── FRONTEND_CONTEXT.md
```

---

## Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```
2. **Set up the virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```
3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Run migrations to set up your PostgreSQL DB:**
   ```bash
   alembic upgrade head
   ```
5. **Start the server:**
   ```bash
   uvicorn app.main:app --reload
   ```

---

## Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```
2. **Install Node modules:**
   ```bash
   npm install
   ```
3. **Start the Vite dev server:**
   ```bash
   npm run dev
   ```
4. The web app will generally be available at `http://localhost:5173`.

---

## Environment Variables

Create `.env` files in both backend and frontend roots using the provided examples.

**Backend (`backend/.env`):**
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/swigato
SECRET_KEY=your_super_secret_jwt_key
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Frontend (`frontend/.env.local`):**
```env
VITE_API_URL=http://127.0.0.1:8000
```

---

## API Documentation

FastAPI dynamically generates comprehensive documentation. Once the backend server is running, navigate to:
- **Swagger UI:** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`

All endpoints require authorization context enforced by FastAPI dependencies depending on the user role.

---

## Delivery Workflow

Swigato handles delivery dispatch robustly:
1. Restaurant marks an order as `READY_FOR_PICKUP`.
2. Backend triggers `auto_assign_order` scanning for an online, available delivery partner.
3. System applies explicit `with_for_update()` transactional locking to guarantee one-to-one assignment.
4. Earning is calculated securely on the server-side.
5. The assigned partner must `accept_order` explicitly. If rejected, the system falls back to recalculating dispatch.
6. The state machine enforces progression: `ACCEPTED` → `PICKED_UP` → `IN_TRANSIT` → `DELIVERED`.

---

## Payment Simulation Architecture

To prevent locking the UI behind actual credit card payments, Swigato simulates a modern asynchronous Payment Gateway Flow (similar to Stripe/Razorpay):
1. **Checkout:** Frontend hits `POST /api/v1/payments/orders/{id}/initialize` to generate a secure transaction intent.
2. **Payment Form:** The user submits mock card details.
3. **Webhook Callback:** An idempotent webhook securely notifies the backend that the transaction succeeded, automatically progressing the order from `AWAITING_PAYMENT` to `PLACED`.

---

## Current Development Status

The foundational milestones have been successfully completed:
- [x] Phase 1 & 2: Auth, RBAC, Profile & Addresses
- [x] Phase 3 & 4: Restaurant Lifecycle & Catalog/Menu DB
- [x] Phase 5: Stateful Cart system with constraints
- [x] Phase 6: Core Order Management System
- [x] Phase 7: Payment Intent & Webhook simulation
- [x] Phase 8: Delivery Partner fleet mapping & state tracking

---

## Upcoming Phases

- **Phase 9:** Reviews, Rating system, and Promotional Coupons
- **Phase 10:** Algorithmic Search, Analytics Engine, and System Observability/Logging

---

## License

This project is open-source and available under the [MIT License](LICENSE).

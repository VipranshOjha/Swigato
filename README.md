# Swigato

Swigato is a modern, full-stack food delivery platform demonstrating a robust modular monolith architecture. Designed for high concurrency, real-time tracking, and enterprise-grade transaction integrity.

## Overview

Swigato supports four distinct user roles, seamlessly orchestrated through a Realtime WebSocket architecture:
* **Customers:** Browse restaurants, add to cart, checkout, and track orders in real-time.
* **Restaurant Owners:** Manage menus, accept/reject orders, and track active fulfillment streams.
* **Delivery Partners:** Auto-assigned to ready orders with a strict 1-active-order dispatch capacity.
* **Administrators:** Observe the platform entirely passively via a realtime firehose multiplexer.

## Features & Capabilities

### Architectural Highlights
* **Modular Monolith**: Clean separation of Domain Services, Repositories, and the API layer.
* **Transaction Integrity**: Built-in row-level locking (`FOR UPDATE`, `FOR UPDATE SKIP LOCKED`) ensures zero state-machine corruption, no lost updates, and prevents double-assignment of delivery partners.
* **Zero N+1 Queries**: SQLAlchemy `selectinload` efficiently eager-loads deep relationships without degrading DB performance.
* **Test Infrastructure**: Comprehensive `pytest` infrastructure utilizing independent asynchronous database session factories to accurately validate concurrency and locks.

### Realtime Engine
* **Push-Based**: 100% push-based realtime architecture (0% polling overhead).
* **Decoupled EventBus**: Business logic safely publishes post-commit domain events completely agnostic of the transport layer.
* **Multi-Tenant Routing**: Strict server-authoritative routing (`customer:{id}`, `restaurant:{id}`, `admin:system`). Clients cannot subscribe to arbitrary topics.
* **React Query Integration**: Realtime signals transparently instruct TanStack Query to refetch relevant queries or aggressively invalidate local cache.
* **Self-Healing WebSockets**: Automatic pruning of stale connections and intelligent React Query refetches when the browser regains connectivity.

## Tech Stack

### Backend
* **Python 3.10+ / FastAPI**
* **Async SQLAlchemy 2.0**
* **PostgreSQL**
* **Pytest & Pytest-Asyncio**

### Frontend
* **React 19 / Vite**
* **TanStack Query (React Query v5)**
* **Tailwind CSS**
* **React Router v6**

## Local Setup Instructions

### Prerequisites
* Python 3.10+
* Node.js 18+
* PostgreSQL running locally

### Backend Setup
1. Clone the repository and navigate to `backend/`.
2. Create and activate a virtual environment: `python -m venv venv`
3. Install dependencies: `pip install -r requirements.txt`
4. Create a `.env` file containing:
   ```env
   DATABASE_URL=postgresql+asyncpg://user:password@localhost/swigato
   TEST_DATABASE_URL=postgresql+asyncpg://user:password@localhost/swigato_test
   SECRET_KEY=your_secret_key
   ```
5. Run tests: `pytest -v tests/`
6. Start the server: `uvicorn app.main:app --reload`

### Frontend Setup
1. Navigate to `frontend/`.
2. Install dependencies: `npm install`
3. Create a `.env.local` file containing:
   ```env
   VITE_API_URL=http://localhost:8000/api/v1
   VITE_WS_URL=ws://localhost:8000/api/v1/ws
   ```
4. Start the development server: `npm run dev`

## Current Project Status
**Phase 12 Completed.**
The project has established a highly stable Domain layer, Realtime layer, and Concurrency architecture. Structural testing and transaction locks protect the platform under high load. The next focus (Phase 13) shifts back to the Frontend to harden the User Experience, error boundaries, and loading states.

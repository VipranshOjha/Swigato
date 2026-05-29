# Project Context: Swigato

## 1. System Architecture
Swigato is built as a **Modular Monolith**. It physically deploys as a single application unit but is logically partitioned into distinct domains (Order, Delivery, Owner, Auth). 

**Flow:** Request -> FastAPI Router -> Domain Service -> Repository -> Database.

## 2. Domain Model
* **User**: Base identity, controls RBAC (Customer, Owner, Rider, Admin).
* **Restaurant / Menu**: Owned by `RESTAURANT_OWNER`.
* **Cart / CartItem**: Ephemeral staging ground for order creation.
* **Order / OrderItem**: The central transactional entity of the platform.
* **DeliveryPartnerProfile**: Controls rider state (online/suspended) and tracks capacity.

## 3. Order State Machine
The Order lifecycle strictly follows these allowed transitions:
`PENDING` -> `ACCEPTED` / `REJECTED` / `CANCELLED`
`ACCEPTED` -> `PREPARING`
`PREPARING` -> `READY_FOR_PICKUP`
`READY_FOR_PICKUP` -> `RIDER_ASSIGNED`
`RIDER_ASSIGNED` -> `PICKED_UP`
`PICKED_UP` -> `IN_TRANSIT`
`IN_TRANSIT` -> `DELIVERED`

## 4. Delivery State Machine
Riders are governed by a **strict 1-active-order capacity model**.
A rider is eligible for `auto_assign_order` only if:
- `is_online == True`
- `is_suspended == False`
- Active orders (`RIDER_ASSIGNED`, `PICKED_UP`, `IN_TRANSIT`) == 0.

## 5. Repository Pattern
Data access is entirely encapsulated inside the `repositories/` directory.
- Repositories handle all SQLAlchemy queries, `.options(selectinload())` relationship loading, and `with_for_update()` locking semantics.

## 6. Service Layer Rules
Business logic lives exclusively in the `services/` directory.
- Services never execute raw SQL.
- Services perform permission checks (`PermissionDeniedError`) and state validations (`InvalidOrderStateTransitionError`).
- Services mutate state through Repositories, execute `commit()`, and *then* trigger the `EventBus`.

## 7. Realtime Architecture
Swigato uses a **Push-Based Realtime Model**.
WebSockets are completely passive (read-only for clients). All state-mutations must occur via standard REST HTTP endpoints. This prevents duplicating auth/business logic into WebSocket handlers.

## 8. EventBus Architecture
The `InMemoryEventBus` decouples domain services from network transports.
Services invoke `event_bus.safe_publish(tenant_scope, envelope)`. The Bus routes the event into an asynchronous queue, where the `WebSocketManager` consumes it and broadcasts it down to connected, authenticated browser clients.

## 9. WebSocket Routing Model
Tenant Isolation is **Server-Authoritative**.
- A customer automatically joins `customer:{user_id}` during handshake.
- A restaurant owner joins `restaurant:{restaurant_id}`.
- Admins join the `admin:system` firehose.
Clients are blocked from issuing arbitrary `SUBSCRIBE` commands.

## 10. React Query Integration
The frontend utilizes `TanStack Query`. When a realtime event is received via WebSocket, the client simply invokes `queryClient.invalidateQueries({ queryKey })`. This forces the browser to silently refetch the active orders in the background, combining the speed of push-events with the absolute safety of REST GET payloads.

## 11. Transaction Locking Strategy
Phase 11 introduced essential concurrency controls to prevent race conditions:
* **`get_cart_for_update` (FOR UPDATE):** Prevents the Double-Checkout cart race.
* **`get_by_id_for_update` (FOR UPDATE):** Forces strict serialization on all Order state transitions (e.g., Accept vs Cancel).
* **`find_available_partner` (FOR UPDATE SKIP LOCKED):** Allows concurrent dispatch algorithms to instantly bypass locked riders, preventing double-assignments without causing queue blocking.

## 12. Testing Architecture
Phase 12 established a robust `pytest` and `pytest-asyncio` foundation:
* **Integration Tests:** Use a shared `db_session` fixture wrapped in a ROLLBACK block for fast, clean business logic validation.
* **Concurrency Tests:** Use a `session_factory` to spin up independent database connection pools inside `asyncio.gather()` loops, actively verifying that the row-level locks successfully serialize conflicting transitions (1 success, 1 failure).

## 13. Current Technical Debt
* **EventBus Scaling:** The `InMemoryEventBus` will fail to distribute events properly when horizontally scaling multiple FastAPI workers. Migration to a `RedisEventBus` with distributed sequence generation is required.
* **Optimistic Frontend Updates:** WebSockets currently trigger React Query refetches (Thundering Herd risk). Payload enrichment could allow `queryClient.setQueryData` for HTTP-free UI updates.
* **`useDeliveryRealtime.js`:** A hollowed-out wrapper hook that remains from the Phase 10F polling removal.

## 14. Roadmap
* **Phase 13:** Frontend UX Hardening (Loading states, Empty States, Error Boundaries).
* **Phase 14:** Observability & Telemetry (Prometheus Metrics).
* **Phase 15:** Redis Pub/Sub Migration for Horizontal Scale.

---

## ARCHITECTURAL INVARIANTS
*These are non-negotiable engineering rules.*

1. **Services own business logic.** Endpoints must remain thin.
2. **Repositories own SQL.** Services must never invoke raw `select()` or `with_for_update()`.
3. **Events publish AFTER commit.** Never publish an event for a state that hasn't successfully hit the database.
4. **WebSockets are read-only.** Mutations must use HTTP.
5. **React Query is the Source of Truth.** Realtime events trigger invalidations, not manual state array manipulation.
6. **Protected topics are server-authoritative.** The server dictates what the client listens to based on their JWT.
7. **State-machine mutations use row locks.** Any state transition must wrap the entity in `FOR UPDATE`.
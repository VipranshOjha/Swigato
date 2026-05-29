# Frontend Context: Swigato

## 1. Frontend Folder Structure
```
frontend/
├── src/
│   ├── components/       # Reusable UI components (buttons, badges)
│   ├── features/         # Role-specific modules (auth, customer, delivery, owner, admin)
│   ├── hooks/            # Custom React hooks (queries, realtime)
│   ├── lib/              # Utility configurations (axios, react-query)
│   ├── providers/        # React Context providers (WebSocket, Auth)
│   ├── services/         # API wrappers mapping to backend REST routes
│   └── App.jsx           # Main application routing
```

## 2. Routing Architecture
Swigato uses `react-router-dom` for client-side routing.
The application is split into distinct role-based branches protected by higher-order components (HOCs).
- `/` -> Customer Dashboard
- `/owner` -> Restaurant Dashboard
- `/delivery` -> Rider Dashboard
- `/admin` -> Admin Firehose Dashboard

## 3. Role Dashboards
- **Customer**: Browses menus, manages cart state locally, and checks out. Uses Realtime UI to track `ORDER_ACCEPTED` -> `DELIVERED`.
- **Owner**: Kanban-style interface. Relies on Realtime events to pop new `PENDING` orders into the queue immediately.
- **Delivery**: Simple accept/reject and step-by-step progression UI.
- **Admin**: A read-only event stream (firehose) built to visualize the global pulse of the platform.

## 4. Query Key Architecture
Query keys strictly follow a factory pattern in `lib/react-query/queryKeys.js`.
Example: `queryKeys.owner.orders.list({ status: 'active' })`.
This ensures that cache invalidations target precise sub-trees rather than wiping the entire cache.

## 5. WebSocketProvider Design
`providers/WebSocketProvider.jsx` maintains the singular `WebSocket` connection for the browser tab.
- Initializes on mount using the JWT token as a bearer header.
- Automatically reconnects on close with exponential backoff.
- Features a **Reconnect Healing** sequence: After recovering from a drop, it emits a `realtime-reconnect` window event to alert the application.

## 6. useRealtime Architecture
`hooks/useRealtime.js` is the central hook that bridges WebSockets and React Query.
Components pass an `onEvent` callback. When the WebSocket receives a message, the hook invokes the callback.
It also listens to the `realtime-reconnect` window event and injects a simulated `SYSTEM_RECONNECT` payload to force an immediate state recovery fetch.

## 7. Realtime Invalidation Strategy
The frontend explicitly **does not** modify data arrays in-memory based on WebSocket payloads.
Instead, upon receiving `ORDER_CREATED`, `ORDER_ACCEPTED`, etc., the frontend executes `queryClient.invalidateQueries()`. This safely refetches the list from the REST API, eliminating complex client-side state merging logic.

## 8. Current Reusable Hooks
All HTTP fetching is abstracted behind TanStack Query hooks located in `src/hooks/queries/`.
- `useOrderQueries.js`: Customer order tracking.
- `useOwnerQueries.js`: Owner dashboard and restaurant management.
- `useDeliveryQueries.js`: Rider assignment queue.
*Note: Phase 10F successfully stripped all `refetchInterval` polling parameters from these hooks.*

## 9. Protected Routes
The `ProtectedRoute` component intercepts navigation.
If the user's JWT lacks the required `Role`, they are redirected to the appropriate dashboard or login screen.

## 10. Error/Loading Handling Status
* **Loading**: Generally relies on `isLoading` from TanStack Query, but lacks consistent global skeletons.
* **Errors**: `isError` is captured, but explicit UX handling (Toast notifications, error boundaries, "Try Again" buttons) is largely missing.
* **Empty States**: Empty queues or empty tracking screens lack polished zero-data UX.

## 11. Phase 13 UX Hardening Targets
Phase 13 focuses entirely on stabilizing the frontend UX:
1. Polish loading states and spinners across all dashboards.
2. Implement robust Error Boundaries.
3. Handle graceful degradation (e.g., if WebSockets fail, alert the user rather than silently dropping updates).
4. Build engaging Empty States (e.g., "No active deliveries right now!").
5. Improve Toast notifications for transient failures (e.g., "Failed to accept order").
# Swigato Frontend — React Query Architecture

## Overview

The Swigato React frontend uses **TanStack Query v5 (React Query)** for all server-state management. Client state (auth session, UI toggles) remains in React Context. This separation ensures clean boundaries between "data the server owns" and "data the client owns."

---

## State Management Split

| Domain | Mechanism | Example |
|---|---|---|
| Server state | React Query | Restaurants, Orders, Cart, Reviews |
| Auth session | React Context (`AuthContext`) | Current user, tokens |
| UI state | React Context / local state | Toast, modals, form inputs |
| Cart mutations | React Query + Context bridge | `CartContext` wraps React Query |

---

## Query Key Architecture

All query keys live in `src/lib/react-query/queryKeys.js` using a **deep factory pattern**:

```
queryKeys.restaurants.all         → ['restaurants']
queryKeys.restaurants.lists()     → ['restaurants', 'list']
queryKeys.restaurants.list({q})   → ['restaurants', 'list', {q}]
queryKeys.restaurants.details()   → ['restaurants', 'detail']
queryKeys.restaurants.detail(id)  → ['restaurants', 'detail', id]
```

### Why deep factories?

- `invalidateQueries({ queryKey: queryKeys.restaurants.all })` → invalidates **every** restaurant query (lists + details).
- `invalidateQueries({ queryKey: queryKeys.restaurants.lists() })` → invalidates only lists, keeping details cached.
- Filters are embedded in the key, so `list({search:'pizza'})` and `list({search:'burger'})` are independent cache entries.

---

## Mutation Keys

All mutation keys live in `src/lib/react-query/mutationKeys.js`. These are used for:

- **DevTools traceability**: mutations appear with readable names instead of anonymous entries.
- **Analytics hooks**: you can subscribe to mutation lifecycle events globally via `MutationCache`.
- **Deduplication reasoning**: easier to debug when two components fire the same mutation type.

---

## Stale Time & GC Strategy

| Setting | Value | Rationale |
|---|---|---|
| `staleTime` | 5 minutes | Restaurants/menus don't change rapidly. Avoids duplicate fetches on back-navigation. |
| `gcTime` | 10 minutes | Keep unused data in memory a bit longer so returning users see instant loads. |
| `refetchOnWindowFocus` | `false` | Food delivery apps are single-tab. Avoids unexpected refetches mid-checkout. |

### Per-domain overrides

| Domain | `retry` | `staleTime` | Rationale |
|---|---|---|---|
| Auth queries | `RETRY_NONE (0)` | N/A | Fail fast. Don't retry 401/403. |
| Analytics | `RETRY_RELAXED (2)` | 30s | Best-effort, tolerate flakes. |
| Cart | default | `0` | Always re-validate after mutations. |
| Active order detail | default | `0` | Polling handles freshness. |

Import presets from `queryClient.js`:
```js
import { RETRY_NONE, RETRY_RELAXED } from '../lib/react-query/queryClient';
```

---

## Invalidation Map

When a mutation succeeds, specific queries must be invalidated. This is documented and implemented in `src/lib/react-query/invalidation.js`.

| Mutation | Invalidates |
|---|---|
| Add/Remove cart item | `cart.current()` |
| Place order | `cart.all`, `orders.lists()` |
| Submit review | `orders.detail(orderId)` |
| Update restaurant (owner) | `restaurants.detail(id)`, `restaurants.lists()` |
| Admin approve restaurant | `restaurants.detail(id)`, `restaurants.lists()` |

Use the helper:
```js
import { invalidateByEntity } from '../lib/react-query/invalidation';

invalidateByEntity('order', orderId);
invalidateByEntity('cart');
```

---

## Request Cancellation

React Query natively passes an `AbortSignal` to `queryFn`. We leverage this for:

- **Restaurant search** (rapid typing cancels stale requests)
- **Live filtering** on owner/admin dashboards
- **Any typeahead/autocomplete** added later

Implementation pattern:
```js
queryFn: ({ signal }) => fetchWithCancel('/api/restaurants', params, signal)
```

The `fetchWithCancel` helper lives in `src/lib/react-query/cancellation.js` and passes the signal directly to Axios.

---

## Conditional Polling

Polling is **never global**. It is only used for:

1. **Active order tracking** — `useOrderDetail` checks `order.status` and polls at 30s intervals only if the order is not finalized (delivered/cancelled/rejected).
2. **Delivery partner tracking** — planned for Phase 4, same pattern.

Implementation:
```js
refetchInterval: (query) => {
    const status = query.state?.data?.status;
    const isFinished = ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(status);
    return (!isFinished && status) ? 30000 : false;
}
```

---

## Optimistic Updates

Optimistic updates are used **only for low-risk, reversible mutations**:

| ✅ Optimistic | ❌ Not Optimistic |
|---|---|
| Cart: add item | Checkout / payment |
| Cart: update quantity | Place order |
| Cart: remove item | Admin actions |

The flow follows the standard React Query optimistic pattern:
1. `onMutate`: Cancel outgoing refetches → Snapshot previous data → Set optimistic data
2. `onError`: Rollback to snapshot
3. `onSettled`: Invalidate to sync with server truth

---

## Suspense Preparation

The current architecture **does not use** React Suspense for data fetching, but is designed to be compatible:

- All queries use `useQuery` (not `useSuspenseQuery`), so Suspense can be adopted per-route later.
- The `Loadable` wrapper in `routes/index.jsx` already uses `<Suspense>` for code-splitting. Data-level suspense can layer on top without conflict.
- No blocking patterns (like `await queryClient.fetchQuery()` in render) are used.

---

## Migration Status

| Phase | Module | Status |
|---|---|---|
| Phase 2 | Customer flows | ✅ Migrated to React Query |
| Phase 3 | Owner dashboard | 🔲 Next |
| Phase 4 | Delivery dashboard | 🔲 Planned |
| Phase 5 | Admin dashboard | 🔲 Planned |

### Deprecated hooks
- `useApi.js` — Retained temporarily. Will be removed after Phase 5.
- `useCart.js` — Deleted. Replaced by `CartContext` + React Query.
- `useRestaurant.js` — Deleted. Replaced by `useRestaurantQueries.js`.

---

## File Index

```
src/lib/react-query/
├── queryClient.js      # QueryClient + retry presets + error normalization
├── queryKeys.js        # Deep query key factories
├── mutationKeys.js     # Mutation key registry
├── invalidation.js     # Centralized invalidation + reset helpers
└── cancellation.js     # AbortSignal wrapper for Axios

src/hooks/queries/
├── useRestaurantQueries.js
├── useOrderQueries.js
└── useAddressQueries.js

src/hooks/mutations/
├── useCartMutations.js
├── useOrderMutations.js
└── useReviewMutations.js
```

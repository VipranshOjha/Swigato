# FRONTEND_CONTEXT.md

Project: Swigato
Frontend: React SPA (`frontend/`)
Stack: React 19, Vite 8, React Router v7, TanStack React Query v5, Tailwind CSS v3, Axios, Lucide React

---

## Architecture Overview

```
frontend/
├── index.html                  # Vite entry point
├── vite.config.js              # Vite + React plugin config
├── tailwind.config.js          # Tailwind design tokens
└── src/
    ├── main.jsx                # App bootstrap (QueryClientProvider, RouterProvider)
    ├── App.jsx                 # Root app component
    ├── api/
    │   └── api.client.js       # Axios instance with JWT refresh interceptor
    ├── services/               # Domain API modules
    │   ├── auth.service.js
    │   ├── user.service.js
    │   ├── restaurant.service.js
    │   ├── owner.service.js
    │   ├── cart.service.js
    │   ├── order.service.js
    │   ├── payment.service.js
    │   ├── delivery.service.js
    │   ├── admin.service.js
    │   └── storage.service.js
    ├── hooks/
    │   ├── queries/            # React Query read hooks per domain
    │   ├── mutations/          # React Query mutation hooks per domain
    │   ├── realtime/           # Polling-based realtime hooks
    │   └── useApi.js           # Generic API hook wrapper
    ├── contexts/
    │   ├── AuthContext.jsx     # JWT token state + user profile
    │   ├── CartContext.jsx     # Cart item count badge
    │   └── ToastContext.jsx    # Global toast notifications
    ├── routes/
    │   ├── index.jsx           # createBrowserRouter config (all routes)
    │   ├── ProtectedRoute.jsx  # Redirect unauthenticated users to /login
    │   ├── PublicRoute.jsx     # Redirect authenticated users away from auth pages
    │   └── RoleRoute.jsx       # Redirect users without required role
    ├── layouts/
    │   ├── AuthLayout.jsx      # Centered card layout for login/register
    │   ├── CustomerLayout.jsx  # Top navbar with cart badge
    │   ├── OwnerLayout.jsx     # Sidebar for restaurant owner panel
    │   ├── DeliveryLayout.jsx  # Sidebar for delivery partner panel
    │   └── AdminLayout.jsx     # Sidebar for admin panel
    ├── pages/
    │   ├── auth/
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── customer/
    │   │   ├── Home.jsx
    │   │   ├── Restaurants.jsx
    │   │   ├── RestaurantDetail.jsx
    │   │   ├── Cart.jsx
    │   │   ├── Checkout.jsx
    │   │   ├── Orders.jsx
    │   │   ├── OrderDetail.jsx
    │   │   └── OrderSuccess.jsx
    │   ├── owner/
    │   │   ├── Dashboard.jsx
    │   │   ├── Restaurants.jsx
    │   │   ├── EditRestaurant.jsx
    │   │   ├── MenuManagement.jsx
    │   │   ├── Orders.jsx
    │   │   ├── OrderDetail.jsx
    │   │   └── Reviews.jsx
    │   ├── delivery/
    │   │   ├── Dashboard.jsx
    │   │   └── OrderDetail.jsx
    │   ├── admin/
    │   │   ├── Dashboard.jsx
    │   │   ├── Restaurants.jsx
    │   │   ├── Orders.jsx
    │   │   ├── OrderDetail.jsx
    │   │   ├── Payments.jsx
    │   │   ├── DeliveryPartners.jsx
    │   │   └── Reviews.jsx
    │   └── error/
    │       ├── NotFound.jsx
    │       └── Unauthorized.jsx
    ├── components/
    │   ├── common/             # Shared: PageLoader, Modal, Toast, StatusBadge,
    │   │                       #         SearchBar, EmptyState, ErrorState,
    │   │                       #         RatingStars, ConfirmDialog
    │   ├── cards/              # RestaurantCard, MenuItemCard, OrderCard, etc.
    │   ├── cart/               # CartItem, CartSummary, FloatingCart
    │   ├── checkout/           # AddressSelector, PaymentForm
    │   ├── customer/           # Customer-specific widgets
    │   ├── owner/              # Owner-specific widgets
    │   ├── delivery/           # Delivery-specific widgets
    │   ├── order/              # OrderStatusTracker, OrderTimeline
    │   ├── admin/              # Admin-specific widgets
    │   └── skeletons/          # Skeleton loading states
    ├── constants/
    │   ├── routes.js           # ROUTES constant map
    │   └── roles.js            # ROLES constant map
    ├── lib/
    │   └── react-query/
    │       └── queryKeys.js    # Hierarchical query key factory
    └── utils/
        └── order.utils.js      # isOrderActive helper
```

---

## Routing

| Route                          | Component              | Guard                          |
|-------------------------------|------------------------|--------------------------------|
| `/login`                       | `Login`                | PublicRoute (redirect if authed) |
| `/register`                    | `Register`             | PublicRoute                    |
| `/`                            | `Home`                 | CustomerLayout (public)        |
| `/restaurants`                 | `Restaurants`          | CustomerLayout (public)        |
| `/restaurants/:slug`           | `RestaurantDetail`     | CustomerLayout (public)        |
| `/cart`                        | `Cart`                 | CustomerLayout (public)        |
| `/checkout`                    | `Checkout`             | ProtectedRoute                 |
| `/orders`                      | `Orders`               | ProtectedRoute                 |
| `/orders/:id`                  | `OrderDetail`          | ProtectedRoute                 |
| `/orders/:id/success`          | `OrderSuccess`         | ProtectedRoute                 |
| `/owner/*`                     | Owner pages            | ProtectedRoute + RoleRoute(owner) |
| `/owner/restaurants`           | `OwnerRestaurants`     | Owner                          |
| `/owner/restaurants/:id/edit`  | `OwnerEditRestaurant`  | Owner                          |
| `/owner/menu/:restaurantId`    | `OwnerMenuManagement`  | Owner                          |
| `/owner/orders`                | `OwnerOrders`          | Owner                          |
| `/owner/orders/:id`            | `OwnerOrderDetail`     | Owner                          |
| `/owner/reviews`               | `OwnerReviews`         | Owner                          |
| `/delivery/*`                  | Delivery pages         | ProtectedRoute + RoleRoute(delivery) |
| `/delivery/orders/:id`         | `DeliveryOrderDetail`  | Delivery                       |
| `/admin/*`                     | Admin pages            | ProtectedRoute + RoleRoute(admin) |
| `/admin/restaurants`           | `AdminRestaurants`     | Admin                          |
| `/admin/orders`                | `AdminOrders`          | Admin                          |
| `/admin/orders/:id`            | `AdminOrderDetail`     | Admin                          |
| `/admin/payments`              | `AdminPayments`        | Admin                          |
| `/admin/delivery`              | `AdminDeliveryPartners`| Admin                          |
| `/admin/reviews`               | `AdminReviews`         | Admin                          |
| `/unauthorized`                | `Unauthorized`         | Public                         |
| `*`                            | `NotFound`             | Public                         |

---

## Data Layer

### React Query Hooks (queries/)

| Hook                         | Domain         | Description                              |
|-----------------------------|----------------|------------------------------------------|
| `useRestaurantQueries`      | Restaurants    | Public list, detail by slug              |
| `useCartQueries`            | Cart           | Get cart                                 |
| `useOrderQueries`           | Orders         | Customer order list, order detail        |
| `useOrderTracking`          | Orders         | Polling-based order status tracker       |
| `useOwnerQueries`           | Owner          | Restaurants, menu items, categories, orders, reviews |
| `useOwnerDashboardQuery`    | Owner          | Dashboard summary (stats)                |
| `useDeliveryQueries`        | Delivery       | Partner profile, active order, order detail, earnings |
| `useAdminQueries`           | Admin          | Restaurants, orders, payments, delivery partners, reviews |
| `useAddressQueries`         | Addresses      | User address list                        |

### React Query Hooks (mutations/)

| Hook                        | Domain         | Description                              |
|-----------------------------|----------------|------------------------------------------|
| `useCartMutations`          | Cart           | Add, update, remove, clear               |
| `useOrderMutations`         | Orders         | Place order, cancel order                |
| `useOwnerMutations`         | Owner          | Create/update restaurant, menu CRUD, order actions |
| `useDeliveryMutations`      | Delivery       | Toggle availability, accept/pickup/deliver order |
| `useAdminMutations`         | Admin          | Approve/suspend restaurant, approve/suspend delivery partner, moderate reviews |
| `useReviewMutations`        | Reviews        | Submit review                            |

### Realtime Hooks (realtime/)

| Hook                        | Description                                        |
|----------------------------|----------------------------------------------------|
| `useDeliveryRealtime`      | Polling loop for delivery partner's active order   |

---

## Contexts

| Context         | Provides                                      |
|-----------------|-----------------------------------------------|
| `AuthContext`   | `user`, `token`, `login()`, `logout()`, `refreshToken()` |
| `CartContext`   | `cartCount`, `refreshCartCount()`             |
| `ToastContext`  | `showToast(message, type)`                    |

---

## Backend API Integration

All service modules call the Axios client at `VITE_API_URL` (default: `http://127.0.0.1:8000`).

The Axios client (`api.client.js`) automatically:
- Attaches `Authorization: Bearer <access_token>` to all requests
- On 401, attempts token refresh via `POST /api/v1/auth/refresh`
- On refresh success, retries the original request
- On refresh failure, clears auth state and redirects to `/login`

---

## Backend Domains Integrated

✅ Authentication — Login, Register, Logout, Refresh token
✅ Profiles — View and update user profile
✅ Addresses — CRUD, default address management
✅ Restaurants — Public listing, detail, owner onboarding, admin approval/suspension
✅ Menus — Categories, menu items, dietary tags, availability toggle
✅ Cart — Add item, update quantity, remove item, clear cart, single-restaurant constraint
✅ Orders — Checkout, order detail, status tracking, owner fulfillment, admin audit
✅ Payments — Payment initialization, mock Razorpay flow, webhook, admin transaction panel
✅ Delivery — Partner portal, availability toggle, order assignment workflow, admin panel
✅ Reviews — Customer submit, owner listing, admin moderation

---

## Frontend Environment

```env
# frontend/.env.local
VITE_API_URL=http://127.0.0.1:8000
```

Dev server: `npm run dev` → `http://localhost:5173`
Build: `npm run build`

---

## Rules

- Frontend must integrate with real backend APIs only.
- No mock data.
- No fake services.
- No placeholder backend logic.
- All new pages must follow the existing service → query hook → page component pattern.
- Role-based pages must use RoleRoute with the appropriate ROLES constant.
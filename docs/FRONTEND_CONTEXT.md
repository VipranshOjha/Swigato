Project: Swigato

Current Backend Domains Implemented:

✅ Authentication
- Login
- Register
- Logout
- Refresh token
- Email verification
- Password reset

✅ Profiles
- View profile
- Update profile

✅ Addresses
- CRUD addresses
- Default address

✅ Restaurants
- Owner onboarding
- Approval workflow
- Public listing
- Restaurant detail page

✅ Menus
- Categories
- Menu items
- Dietary tags
- Availability toggle

✅ Cart
- Add item
- Update quantity
- Remove item
- Clear cart
- Single restaurant constraint
- Dynamic totals

✅ Orders
- Checkout order placement
- Order details & status tracking
- Owner dashboard order management (accept, reject, status updates)
- Admin order list auditing

✅ Payments
- Payment initialization (intent creation)
- Mock gateway integration (Razorpay flow)
- Webhooks receiver for captured/failed status updates
- Refund creation and status auditing

✅ Delivery
- Onboarding & Admin Approval
- Partner availability states (online/offline)
- Delivery path location tracking
- Auto order assignment matching logic
- Delivery status transitioning (assigned, accepted, picking_up, picked_up, delivering, delivered, failed)

User Roles:

1. Customer
2. Restaurant Owner
3. Delivery Partner
4. Admin
5. Super Admin

Frontend Existing Pages:

- Login (`login.html`, `js/login.js`)
- Register (`register.html`, `js/register.js`)
- Profile Settings (`profile-settings.html`, `js/profile-settings.js`)
- Address Management (`address-management.html`, `js/address-management.js`)
- Owner Dashboard (`owner-dashboard.html`, `js/owner-dashboard.js`)
- Owner Menu Management (`owner-menu.html`, `js/owner-menu.js`)
- Owner Restaurant details (`owner-restaurant-detail.html`, `js/owner-restaurant-detail.js`)
- Owner Order Management (`owner-orders.html`, `js/owner-orders.js`)
- Restaurant Onboarding (`restaurant-onboarding.html`, `js/restaurant-onboarding.js`)
- Public Restaurant Listing (`restaurants.html` / `index.html`, `js/restaurants.js`)
- Public Restaurant Details & Menu Discovery (`restaurant.html`, `js/restaurant.js`)
- Cart (`cart.html`, `js/cart.js`)
- Checkout (`checkout.html`, `js/checkout.js`)
- Payment processing (`payment.html`, `js/payment.js`)
- Order Success (`order-success.html`, `js/order-success.js`)
- Order History (`order-history.html`, `js/order-history.js`)
- Order Detail Status Tracker (`order-detail.html`, `js/order-detail.js`)
- Delivery Dashboard (`delivery-dashboard.html`, `js/delivery-dashboard.js`)
- Delivery Order Details (`delivery-order-detail.html`, `js/delivery-order-detail.js`)
- Admin Restaurants/Users Dashboard (`admin-dashboard.html`, `js/admin-dashboard.js`)
- Admin Payments Audit Dashboard (`admin-payments.html`, `js/admin-payments.js`)
- Admin Delivery Management (`admin-delivery.html`, `js/admin-delivery.js`)

Backend API already exists.

Frontend must integrate with real APIs only.

No mock data.
No fake services.
No placeholder backend logic.
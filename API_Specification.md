# API Specification

---

## 1. Auth APIs
* **Base Route:** `/auth`

### Signup
* **Endpoint:** `POST /auth/register`
* **Description:** Creates a new user account.

### Login
* **Endpoint:** `POST /auth/login`
* **Description:** Authenticates a user and returns a JWT token.

### Get Current User
* **Endpoint:** `GET /auth/me`
* **Description:** Retrieves the profile details of the currently authenticated user.

### Logout
* **Endpoint:** `POST /auth/logout`
* **Description:** Invalidates the user session (optional initially).

---

## 2. User APIs
* **Base Route:** `/users`

### Get User Profile
* **Endpoint:** `GET /users/{id}`
* **Description:** Retrieves the profile of a specific user.

### Update User
* **Endpoint:** `PUT /users/{id}`
* **Description:** Updates the profile information of a specific user.

---

## 3. Address APIs
* **Base Route:** `/addresses`

### Add Address
* **Endpoint:** `POST /addresses`
* **Description:** Adds a new address to the user's profile.

### Get My Addresses
* **Endpoint:** `GET /addresses`
* **Description:** Retrieves all addresses saved by the logged-in user.

### Update Address
* **Endpoint:** `PUT /addresses/{id}`
* **Description:** Updates a specific address by ID.

### Delete Address
* **Endpoint:** `DELETE /addresses/{id}`
* **Description:** Deletes a specific address by ID.

---

## 4. Restaurant APIs
* **Base Route:** `/restaurants`

### Create Restaurant
* **Endpoint:** `POST /restaurants`
* **Description:** Registers a new restaurant (seller operation).

### Get All Restaurants
* **Endpoint:** `GET /restaurants`
* **Description:** Retrieves a list of all restaurants.
* **Query Parameters (Planned):**
  * `page` (pagination)
  * `limit` (pagination)
  * `filter` (filtering)
  * `q` (search)

### Get Restaurant By ID
* **Endpoint:** `GET /restaurants/{id}`
* **Description:** Retrieves details of a specific restaurant.

### Update Restaurant
* **Endpoint:** `PUT /restaurants/{id}`
* **Description:** Updates restaurant details.

### Delete Restaurant
* **Endpoint:** `DELETE /restaurants/{id}`
* **Description:** Performs a soft delete on a restaurant.

---

## 5. Menu Category APIs
* **Base Route:** `/menu-categories`

### Create Menu Category
* **Endpoint:** `POST /menu-categories`
* **Description:** Creates a new menu category.

### Get Restaurant Categories
* **Endpoint:** `GET /restaurants/{id}/menu-categories`
* **Description:** Retrieves all menu categories for a specific restaurant.

---

## 6. Menu Item APIs
* **Base Route:** `/menu-items`

### Create Menu Item
* **Endpoint:** `POST /menu-items`
* **Description:** Creates a new menu item under a category.

### Get Restaurant Menu
* **Endpoint:** `GET /restaurants/{id}/menu`
* **Description:** Retrieves the entire menu for a specific restaurant.

### Get Menu Item
* **Endpoint:** `GET /menu-items/{id}`
* **Description:** Retrieves details of a specific menu item.

### Update Menu Item
* **Endpoint:** `PUT /menu-items/{id}`
* **Description:** Updates a specific menu item's details.

### Delete Menu Item
* **Endpoint:** `DELETE /menu-items/{id}`
* **Description:** Performs a soft delete on a menu item.

---

## 7. Cart APIs
* **Base Route:** `/cart`

### Get My Cart
* **Endpoint:** `GET /cart`
* **Description:** Retrieves the current user's active shopping cart.

### Add Item To Cart
* **Endpoint:** `POST /cart/items`
* **Description:** Adds a menu item to the cart.

### Update Quantity
* **Endpoint:** `PUT /cart/items/{menu_item_id}`
* **Description:** Updates the quantity of a specific item in the cart.

### Remove Item
* **Endpoint:** `DELETE /cart/items/{menu_item_id}`
* **Description:** Removes a specific item from the cart.

### Clear Cart
* **Endpoint:** `DELETE /cart`
* **Description:** Empties the entire cart.

---

## 8. Order APIs
> [!IMPORTANT]
> This is a core component of the API.

* **Base Route:** `/orders`

### Place Order
* **Endpoint:** `POST /orders`
* **Description:** Converts the user's active cart into a new order.

### Get My Orders
* **Endpoint:** `GET /orders`
* **Description:** Retrieves the order history for the logged-in user.

### Get Order By ID
* **Endpoint:** `GET /orders/{id}`
* **Description:** Retrieves details of a specific order.

### Cancel Order
* **Endpoint:** `PATCH /orders/{id}/cancel`
* **Description:** Cancels a pending or active order.

### Update Order Status
* **Endpoint:** `PATCH /orders/{id}/status`
* **Description:** Updates the status of an order (seller/admin operation).
* **Allowed Statuses:** `accepted`, `preparing`, `delivered`, etc.

---

## 9. Payment APIs
* **Base Route:** `/payments`

### Create Payment
* **Endpoint:** `POST /payments`
* **Description:** Initializes a payment transaction for an order.

### Verify Payment
* **Endpoint:** `POST /payments/verify`
* **Description:** Verifies the payment transaction status.
* **Future Integrations:** Razorpay, Stripe, PayPal.

### Get Payment Details
* **Endpoint:** `GET /payments/{id}`
* **Description:** Retrieves details of a payment transaction.

---

## 10. Review APIs
* **Base Route:** `/reviews`

### Add Review
* **Endpoint:** `POST /reviews`
* **Description:** Submits a review and rating for a restaurant/order.

### Get Restaurant Reviews
* **Endpoint:** `GET /restaurants/{id}/reviews`
* **Description:** Retrieves all reviews for a specific restaurant.

---

## 11. Coupon APIs
* **Base Route:** `/coupons`

### Validate Coupon
* **Endpoint:** `POST /coupons/validate`
* **Description:** Validates a coupon code against the current cart.

### Create Coupon
* **Endpoint:** `POST /coupons`
* **Description:** Creates a new promotional coupon (administrator access required).

---

## 12. Delivery APIs
* **Base Route:** `/delivery`

### Update Rider Location
* **Endpoint:** `POST /delivery/location`
* **Description:** Updates the real-time geographic location of the delivery rider.

### Get Live Order Tracking
* **Endpoint:** `GET /orders/{id}/tracking`
* **Description:** Retrieves live tracking info/coordinates for a delivery.

---

## 13. Search APIs
* **Base Route:** `/search`

### Search Restaurants
* **Endpoint:** `GET /search/restaurants?q={query}`
* **Description:** Performs a text search for restaurants.
* **Example:** `GET /search/restaurants?q=pizza`

### Search Menu Items
* **Endpoint:** `GET /search/menu-items?q={query}`
* **Description:** Performs a text search for menu items.
* **Example:** `GET /search/menu-items?q=burger`
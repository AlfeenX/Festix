# Festix API Endpoints Documentation

## Service Ports & URLs

| Service | Port | URL |
|---------|------|-----|
| API Gateway | 3000 | `http://localhost:3000/api` |
| Auth Service | 3001 | `http://localhost:3001` |
| Event Service | 3002 | `http://localhost:3002` |
| Seat Service | 3003 | `http://localhost:3003` |
| Order Service | 3004 | `http://localhost:3004` |
| Payment Service | 3005 | `http://localhost:3005` |
| Notification Service | 3006 | `http://localhost:3006` |

---

## API Gateway (Port 3000)

### Service Discovery
- **GET** `/api/services` - Get list of all microservices and their URLs
  - Auth: None
  - Response: Service status and configuration

### Authentication (proxied to auth-service:3001)
- **POST** `/api/auth/register` - Create new user account
  - Auth: None
  - Body: `{ email, password, full_name }`
  - Returns: `{ user, accessToken, refreshToken }`

- **POST** `/api/auth/login` - Authenticate user
  - Auth: None
  - Body: `{ email, password }`
  - Returns: `{ user, accessToken, refreshToken }`

- **POST** `/api/auth/refresh` - Refresh access token
  - Auth: None
  - Body: `{ refreshToken }`
  - Returns: `{ accessToken, refreshToken }`

- **POST** `/api/auth/logout` - Logout user
  - Auth: Required (Bearer token)
  - Returns: `{ message }`

- **GET** `/api/auth/verify` - Verify token validity
  - Auth: Required (Bearer token)
  - Returns: `{ valid, user }`

- **GET** `/api/auth/users/:id` - Get user details
  - Auth: Required
  - Returns: User profile data

### Events (proxied to event-service:3002)
- **GET** `/api/events` - List all published events
  - Auth: None
  - Query: `?q=search&refresh=true`
  - Returns: Array of events

- **GET** `/api/events/:id` - Get event details
  - Auth: None
  - Returns: Event with venue and seat count

- **POST** `/api/events` - Create new event
  - Auth: Required (ADMIN/SUPER_ADMIN)
  - Body: `{ title, description, venue_id, starts_at, ends_at, is_published }`

- **PUT** `/api/events/:id` - Update event
  - Auth: Required (ADMIN/SUPER_ADMIN)
  - Body: Partial event object

- **DELETE** `/api/events/:id` - Delete event
  - Auth: Required (ADMIN/SUPER_ADMIN)

- **POST** `/api/events/:id/banner` - Upload event banner
  - Auth: Required (ADMIN/SUPER_ADMIN)
  - Type: multipart/form-data with file

- **POST** `/api/events/:id/seats/generate` - Generate seats for event
  - Auth: Required (ADMIN/SUPER_ADMIN)
  - Body: `{ rows, seats_per_row, categories }`

### Venues (proxied to event-service:3002)
- **GET** `/api/venues` - List all venues
  - Auth: None
  - Returns: Array of venues

- **POST** `/api/venues` - Create new venue
  - Auth: Required (ADMIN/SUPER_ADMIN)
  - Body: `{ name, address, city, capacity }`

### Seats (proxied to seat-service:3003)
- **GET** `/api/events/:eventId/seats` - Get all seats for event
  - Auth: None
  - Returns: Array of seats with status

- **POST** `/api/seats/lock` - Reserve seats temporarily
  - Auth: Required (USER)
  - Body: `{ seat_ids, user_id }`
  - Returns: `{ locked, failed, expiresIn }`

- **POST** `/api/seats/unlock` - Release reserved seats
  - Auth: Required (USER)
  - Body: `{ seat_ids, user_id }`

- **POST** `/api/waiting-room/:eventId/join` - Join waiting room
  - Auth: Required
  - Body: `{ user_id }`
  - Returns: `{ status, position }`

- **GET** `/api/waiting-room/:eventId/position/:userId` - Get queue position
  - Auth: None
  - Returns: `{ position, status }`

### Orders (proxied to order-service:3004)
- **POST** `/api/checkout` - Create order with locked seats
  - Auth: Required (USER)
  - Body: `{ user_id, event_id, seat_ids, idempotency_key }`
  - Returns: `{ order, idempotency_key }`

- **GET** `/api/orders` - Get user orders
  - Auth: Required
  - Query: `?user_id=uuid`
  - Returns: Array of orders with items

- **GET** `/api/orders/:id` - Get order details
  - Auth: Required
  - Returns: Order with seat information

- **PATCH** `/api/orders/:id/status` - Update order status (admin)
  - Auth: Required (ADMIN)
  - Body: `{ status }`

- **POST** `/api/orders/:id/cancel` - Cancel order
  - Auth: Required
  - Returns: `{ message }`

### Payments (proxied to payment-service:3005)
- **POST** `/api/payments/pay` - Process payment
  - Auth: Required (USER)
  - Body: `{ order_id, amount, payment_method, idempotency_key }`
  - Returns: `{ payment, success, transaction_id }`

- **GET** `/api/payments/:orderId` - Get payment history
  - Auth: Required
  - Returns: Array of payments

- **POST** `/api/payments/:id/refund` - Refund payment
  - Auth: Required (ADMIN)
  - Returns: `{ message }`

### Notifications (proxied to notification-service:3006)
- **GET** `/api/notifications/:userId` - Get user notifications
  - Auth: Required
  - Returns: Last 50 notifications

- **PATCH** `/api/notifications/:id/read` - Mark notification as read
  - Auth: Required
  - Returns: `{ message }`

- **POST** `/api/notifications/send` - Send notification (manual)
  - Auth: Required (ADMIN)
  - Body: `{ user_id, type, title, message }`

### Admin (proxied to respective services)
- **GET** `/api/admin/stats` - Get system statistics
  - Auth: Required (ADMIN/SUPER_ADMIN)
  - Returns: `{ total_events, tickets_sold, orders_by_status }`

- **GET** `/api/admin/orders` - Get all orders
  - Auth: Required (ADMIN/SUPER_ADMIN)
  - Query: `?status=PAID`
  - Returns: Array of all orders (limited to 100)

- **GET** `/api/admin/payments/stats` - Get payment statistics
  - Auth: Required (ADMIN/SUPER_ADMIN)
  - Returns: `{ by_status, success_rate }`

- **GET** `/api/admin/events/*` - Event management endpoints
  - Auth: Required (ADMIN/SUPER_ADMIN)

---

## Direct Service Endpoints (Bypass Gateway)

### Auth Service (Port 3001)
- `POST /register`
- `POST /login`
- `POST /refresh`
- `POST /logout`
- `GET /verify`
- `GET /users/:id`

### Event Service (Port 3002)
- `GET /events`
- `GET /events/:id`
- `POST /events`
- `PUT /events/:id`
- `DELETE /events/:id`
- `POST /events/:id/banner`
- `POST /events/:id/seats/generate`
- `GET /venues`
- `POST /venues`
- `GET /admin/stats`
- `GET /uploads/*` (static file serving)

### Seat Service (Port 3003)
- `GET /events/:eventId/seats`
- `POST /seats/lock`
- `POST /seats/unlock`
- `POST /waiting-room/:eventId/join`
- `GET /waiting-room/:eventId/position/:userId`
- `POST /waiting-room/:eventId/admit-next`
- `POST /seats/release-expired`
- WebSocket support for real-time seat updates

### Order Service (Port 3004)
- `POST /checkout`
- `GET /orders` (with `user_id` query param)
- `GET /orders/:id`
- `GET /admin/orders` (with optional `status` query param)
- `PATCH /orders/:id/status`
- `POST /orders/:id/cancel`

### Payment Service (Port 3005)
- `POST /pay`
- `GET /payments/:orderId`
- `POST /payments/:id/refund`
- `GET /admin/payments/stats`

### Notification Service (Port 3006)
- `GET /notifications/:userId`
- `PATCH /notifications/:id/read`
- `POST /notifications/send`

---

## Authentication

All protected endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <accessToken>
```

### Token Types
- **Access Token**: Short-lived token (15 minutes default) for API requests
- **Refresh Token**: Long-lived token (7 days default) for obtaining new access tokens

### User Roles
- `USER` - Regular user (default)
- `ADMIN` - Event administrator
- `SUPER_ADMIN` - System administrator

---

## Rate Limiting

API Gateway implements rate limiting:
- **Limit**: 100 requests per 60 seconds per IP
- **Status**: 429 Too Many Requests when exceeded

---

## Common Response Codes

- `200 OK` - Successful GET/PUT/PATCH
- `201 Created` - Successful POST creating resource
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `429 Too Many Requests` - Rate limit exceeded
- `504 Service Unavailable` - Backend service timeout

# Festix

A scalable distributed high-traffic concert ticket booking platform built from the architecture spec in `Architecture.md`.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────────────────────┐
│  Next.js    │────▶│  API Gateway │────▶│  Microservices                      │
│  Frontend   │     │  (port 3000) │     │  auth · event · seat · order        │
│  (3100)     │     │  JWT · Rate  │     │  payment · notification             │
└─────────────┘     │  Limiting    │     └──────────┬──────────────────────────┘
                    └──────────────┘                │
         WebSocket ─────────────────────────────────┤
         (seat-service:3003)                        │
                                                    ▼
                    ┌──────────┐  ┌──────────┐  ┌──────────┐
                    │ Postgres │  │  Redis   │  │ RabbitMQ │
                    └──────────┘  └──────────┘  └──────────┘
```

### Microservices

| Service | Port | Responsibility |
|---------|------|----------------|
| API Gateway | 3000 | Routing, auth middleware, rate limiting |
| Auth Service | 3001 | Register, login, JWT, RBAC |
| Event Service | 3002 | Event CRUD, venues, seat map generation |
| Seat Service | 3003 | Seat locking (Redis), waiting room, WebSocket |
| Order Service | 3004 | Checkout, orders, idempotency |
| Payment Service | 3005 | Payment simulation, callbacks |
| Notification Service | 3006 | In-app notifications via RabbitMQ |
| Queue Worker | — | Async ticket generation, lock expiry |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### Run with Docker (recommended)

```bash
# Start all infrastructure and services
docker compose up -d --build

# Seed admin password and sample seats (after postgres is healthy)
npm install
npx tsx scripts/seed.ts
```

Open:
- **Frontend**: http://localhost:3100
- **API Gateway**: http://localhost:3000/api/services
- **Grafana**: http://localhost:3030 (admin / festix)
- **Prometheus**: http://localhost:9090
- **RabbitMQ**: http://localhost:15672 (festix / festix_secret)

**Default admin**: `admin@festix.com` / `Admin123!`

### Local Development

```bash
cp .env.example .env
npm install

# Start infrastructure only
docker compose up -d postgres redis rabbitmq

# Build shared packages
npm run build -w @festix/shared -w @festix/service-common

# Run all services + frontend
npm run dev
```

## Features

- **JWT Authentication** with refresh tokens and RBAC (USER, ADMIN, SUPER_ADMIN)
- **Distributed seat locking** via Redis (`SET NX EX`) with TTL auto-release
- **Virtual waiting room** for traffic spikes (FIFO queue in Redis sorted sets)
- **Queue-based checkout** with RabbitMQ async processing
- **Idempotency keys** on orders and payments
- **Real-time seat updates** via Socket.IO
- **Event-driven architecture** (USER_REGISTERED, SEAT_RESERVED, ORDER_CREATED, PAYMENT_SUCCESS, TICKET_GENERATED)
- **Prometheus metrics** on every service (`/metrics` endpoint)
- **k6 load testing** script for 10,000+ concurrent users simulation

## API Examples

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test1234","full_name":"Test User"}'

# List events
curl http://localhost:3000/api/events

# Lock seats (authenticated)
curl -X POST http://localhost:3000/api/seats/lock \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"seat_ids":["<seat-uuid>"],"user_id":"<user-uuid>"}'
```

## Load Testing

```bash
# Install k6: https://k6.io/docs/get-started/installation/
k6 run k6/load-test.js
```

## Project Structure

```
Festix/
├── Architecture.md          # System specification
├── docker-compose.yml       # Full stack orchestration
├── packages/
│   ├── shared/              # DB, Redis, RabbitMQ, types, metrics
│   └── service-common/      # Express app factory
├── services/
│   ├── auth-service/
│   ├── event-service/
│   ├── seat-service/
│   ├── order-service/
│   ├── payment-service/
│   ├── notification-service/
│   └── queue-worker/
├── infra/
│   ├── nginx-gateway/        # Nginx-based API gateway
├── frontend/                # Next.js 15 app
├── infra/                   # Prometheus & Grafana config
├── scripts/                 # DB init & seed
└── k6/                      # Load test scripts
```

## License

MIT

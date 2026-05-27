-- Festix Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE order_status AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
CREATE TYPE seat_category AS ENUM ('VIP', 'REGULAR', 'ECONOMY');
CREATE TYPE seat_status AS ENUM ('AVAILABLE', 'LOCKED', 'RESERVED', 'SOLD');

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name user_role UNIQUE NOT NULL
);

INSERT INTO roles (name) VALUES ('USER'), ('ADMIN'), ('SUPER_ADMIN');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id) DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  capacity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  banner_url VARCHAR(500),
  venue_id UUID REFERENCES venues(id),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  row_label VARCHAR(10) NOT NULL,
  seat_number INTEGER NOT NULL,
  category seat_category NOT NULL DEFAULT 'REGULAR',
  price DECIMAL(10, 2) NOT NULL,
  status seat_status DEFAULT 'AVAILABLE',
  UNIQUE(event_id, row_label, seat_number)
);

CREATE TABLE seat_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(seat_id)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  event_id UUID NOT NULL REFERENCES events(id),
  status order_status DEFAULT 'PENDING',
  total_amount DECIMAL(10, 2) NOT NULL,
  idempotency_key VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id),
  price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  amount DECIMAL(10, 2) NOT NULL,
  status payment_status DEFAULT 'PENDING',
  payment_method VARCHAR(50) DEFAULT 'SIMULATED',
  transaction_id VARCHAR(255),
  idempotency_key VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  seat_id UUID NOT NULL REFERENCES seats(id),
  user_id UUID NOT NULL REFERENCES users(id),
  event_id UUID NOT NULL REFERENCES events(id),
  ticket_code VARCHAR(50) UNIQUE NOT NULL,
  qr_data TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_starts_at ON events(starts_at);
CREATE INDEX idx_seats_event_status ON seats(event_id, status);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Seed admin user (password set by scripts/seed.ts: Admin123!)
INSERT INTO users (email, password_hash, full_name, role_id)
VALUES (
  'admin@festix.com',
  '$2b$12$placeholder.run.seed.script.to.set.real.hash',
  'Festix Admin',
  2
);

-- Seed sample venue and event
INSERT INTO venues (id, name, address, city, capacity)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Jakarta Arena', 'Jl. Sudirman', 'Jakarta', 1000);

INSERT INTO events (id, title, description, venue_id, starts_at, ends_at, is_published)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'Summer Music Festival 2026',
  'The biggest concert of the year featuring top artists.',
  'a0000000-0000-0000-0000-000000000001',
  '2026-08-15 19:00:00+00',
  '2026-08-15 23:00:00+00',
  true
);

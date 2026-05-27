export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type SeatCategory = 'VIP' | 'REGULAR' | 'ECONOMY';
export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'RESERVED' | 'SOLD';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  venue_id: string | null;
  starts_at: string;
  ends_at: string;
  is_published: boolean;
  venue_name?: string;
  venue_city?: string;
}

export interface Seat {
  id: string;
  event_id: string;
  row_label: string;
  seat_number: number;
  category: SeatCategory;
  price: number;
  status: SeatStatus;
}

export interface Order {
  id: string;
  user_id: string;
  event_id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  seat_id: string;
  price: number;
  row_label?: string;
  seat_number?: number;
}

export interface Ticket {
  id: string;
  order_id: string;
  seat_id: string;
  event_id: string;
  ticket_code: string;
  qr_data: string;
  issued_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

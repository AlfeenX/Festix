'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Event } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface AdminStats {
  total_events: number;
  tickets_sold: number;
  orders_by_status: { status: string; count: string }[];
}

interface PaymentStats {
  success_rate: string;
  by_status: { status: string; count: string; total: string }[];
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [orders, setOrders] = useState<unknown[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', starts_at: '', ends_at: '' });

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      router.push('/');
      return;
    }
    api<AdminStats>('/admin/stats').then(setStats).catch(console.error);
    api<PaymentStats>('/admin/payments/stats').then(setPaymentStats).catch(console.error);
    api<unknown[]>('/admin/orders').then(setOrders).catch(console.error);
    api<Event[]>('/events?refresh=1').then(setEvents).catch(console.error);
  }, [user, router]);

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/admin/events', {
        method: 'POST',
        body: JSON.stringify({ ...newEvent, is_published: true }),
      });
      setNewEvent({ title: '', description: '', starts_at: '', ends_at: '' });
      const updated = await api<Event[]>('/events?refresh=1');
      setEvents(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create event');
    }
  };

  const generateSeats = async (eventId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/admin/events/${eventId}/seats/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          rows: 8,
          seats_per_row: 20,
          categories: [
            { rows: ['A', 'B'], category: 'VIP', price: 500 },
            { rows: ['C', 'D', 'E'], category: 'REGULAR', price: 250 },
            { rows: ['F', 'G', 'H'], category: 'ECONOMY', price: 100 },
          ],
        }),
      });
      alert('Seats generated!');
    } catch {
      alert('Failed to generate seats');
    }
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return <div className="container"><p>Access denied.</p></div>;
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Admin Dashboard</h1>

      <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Total Events</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats?.total_events ?? '—'}</p>
        </div>
        <div className="card">
          <h3 style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Tickets Sold</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats?.tickets_sold ?? '—'}</p>
        </div>
        <div className="card">
          <h3 style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Payment Success Rate</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 700 }}>{paymentStats?.success_rate ?? '—'}%</p>
        </div>
        <div className="card">
          <h3 style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Orders by Status</h3>
          {stats?.orders_by_status?.map((o) => (
            <p key={o.status} style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {o.status}: {o.count}
            </p>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Create Event</h2>
        <form onSubmit={createEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <input className="input" placeholder="Title" value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} required />
          <input className="input" placeholder="Description" value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} />
          <input className="input" type="datetime-local" value={newEvent.starts_at}
            onChange={(e) => setNewEvent({ ...newEvent, starts_at: e.target.value })} required />
          <input className="input" type="datetime-local" value={newEvent.ends_at}
            onChange={(e) => setNewEvent({ ...newEvent, ends_at: e.target.value })} required />
          <button className="btn btn-primary" type="submit" style={{ gridColumn: 'span 2' }}>Create Event</button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Events</h2>
        {events.map((event) => (
          <div key={event.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
            <span>{event.title}</span>
            <button className="btn btn-outline" onClick={() => generateSeats(event.id)}>Generate Seats</button>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Recent Orders</h2>
        {(orders as { id: string; email: string; event_title: string; status: string; total_amount: number }[]).slice(0, 20).map((order) => (
          <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.875rem', borderBottom: '1px solid var(--border)' }}>
            <span>{order.email} — {order.event_title}</span>
            <span>{order.status} · ${Number(order.total_amount).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <p style={{ marginTop: '2rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
        Monitoring: <a href="http://localhost:3030" target="_blank">Grafana</a> ·{' '}
        <a href="http://localhost:9090" target="_blank">Prometheus</a> ·{' '}
        <a href="http://localhost:15672" target="_blank">RabbitMQ</a>
      </p>
    </div>
  );
}

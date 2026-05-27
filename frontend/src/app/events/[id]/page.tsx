'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { api, Event, Seat } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3003';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [queueStatus, setQueueStatus] = useState<string | null>(null);

  const loadSeats = useCallback(() => {
    api<Seat[]>(`/events/${id}/seats?refresh=1`).then(setSeats).catch(console.error);
  }, [id]);

  useEffect(() => {
    api<Event>(`/events/${id}`).then(setEvent).catch(console.error);
    loadSeats();
  }, [id, loadSeats]);

  useEffect(() => {
    const socket = io(WS_URL, { transports: ['websocket'] });
    socket.emit('join:event', id);
    if (user) socket.emit('join:user', user.id);

    socket.on('seats:update', (data: { seats: Seat[] }) => {
      setSeats(data.seats);
      setSelected((prev) => {
        const next = new Set(prev);
        for (const sid of prev) {
          const seat = data.seats.find((s) => s.id === sid);
          if (seat && seat.status !== 'AVAILABLE') next.delete(sid);
        }
        return next;
      });
    });

    socket.on('queue:admitted', () => setQueueStatus('admitted'));

    return () => { socket.disconnect(); };
  }, [id, user]);

  const joinWaitingRoom = async () => {
    if (!user) { router.push('/login'); return; }
    try {
      const res = await api<{ status: string; position: number }>(
        `/waiting-room/${id}/join`,
        { method: 'POST', body: JSON.stringify({ user_id: user.id }) }
      );
      setQueueStatus(res.status === 'admitted' ? 'admitted' : `waiting (#${res.position})`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join queue');
    }
  };

  const toggleSeat = (seat: Seat) => {
    if (seat.status !== 'AVAILABLE') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(seat.id)) next.delete(seat.id);
      else if (next.size < 6) next.add(seat.id);
      return next;
    });
  };

  const handleCheckout = async () => {
    if (!user) { router.push('/login'); return; }
    if (selected.size === 0) return;
    setLoading(true);
    setError('');
    try {
      await api('/seats/lock', {
        method: 'POST',
        body: JSON.stringify({ seat_ids: Array.from(selected), user_id: user.id }),
      });

      const order = await api<{ order: { id: string; total_amount: number | string } }>('/checkout', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          event_id: id,
          seat_ids: Array.from(selected),
        }),
      });

      const paymentAmount = Number(order.order.total_amount);
      if (Number.isNaN(paymentAmount)) {
        throw new Error('Invalid order amount received from checkout');
      }

      const payment = await api<{ success: boolean; transaction_id: string | null }>('/payments/pay', {
        method: 'POST',
        body: JSON.stringify({
          order_id: order.order.id,
          amount: paymentAmount,
        }),
      });

      if (payment.success) {
        router.push(`/orders?success=${order.order.id}`);
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const rows = [...new Set(seats.map((s) => s.row_label))].sort();
  const total = seats.filter((s) => selected.has(s.id)).reduce((sum, s) => sum + Number(s.price), 0);

  const seatClass = (seat: Seat) => {
    if (selected.has(seat.id)) return 'seat seat-selected';
    if (seat.status === 'AVAILABLE') return 'seat seat-available';
    return 'seat seat-sold';
  };

  return (
    <div className="container">
      {event && (
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{event.title}</h1>
          <p style={{ color: 'var(--muted)' }}>
            {event.venue_name} · {new Date(event.starts_at).toLocaleString()}
          </p>
          {event.description && (
            <p style={{ marginTop: '1rem', color: 'var(--muted)', maxWidth: 700 }}>{event.description}</p>
          )}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        <div className="card">
          <div className="stage">STAGE</div>
          <div className="seat-map">
            {rows.map((row) => (
              <div key={row} className="seat-row">
                <span className="seat-row-label">{row}</span>
                {seats.filter((s) => s.row_label === row).map((seat) => (
                  <button
                    key={seat.id}
                    className={seatClass(seat)}
                    onClick={() => toggleSeat(seat)}
                    disabled={seat.status !== 'AVAILABLE'}
                    title={`${seat.category} - $${seat.price}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
            <span>■ Available</span>
            <span style={{ color: 'var(--accent)' }}>■ Selected</span>
            <span>■ Taken</span>
          </div>
        </div>

        <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '1rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Your Selection</h3>
          {selected.size === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Select up to 6 seats</p>
          ) : (
            <ul style={{ listStyle: 'none', marginBottom: '1rem' }}>
              {seats.filter((s) => selected.has(s.id)).map((s) => (
                <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.875rem' }}>
                  <span>{s.row_label}{s.seat_number} <span className={`badge badge-${s.category.toLowerCase()}`}>{s.category}</span></span>
                  <span>${s.price}</span>
                </li>
              ))}
            </ul>
          )}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {!user && (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              <a href="/login">Login</a> to book seats
            </p>
          )}

          {user && queueStatus && queueStatus !== 'admitted' && (
            <div className="alert" style={{ background: '#eab30820', color: 'var(--warning)' }}>
              Waiting room: {queueStatus}
            </div>
          )}

          {user && !queueStatus && (
            <button className="btn btn-outline" style={{ width: '100%', marginBottom: '0.5rem' }} onClick={joinWaitingRoom}>
              Join Waiting Room
            </button>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={!user || selected.size === 0 || loading}
            onClick={handleCheckout}
          >
            {loading ? 'Processing...' : `Checkout (${selected.size} seats)`}
          </button>
        </div>
      </div>
    </div>
  );
}

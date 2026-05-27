'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, Order } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function OrdersPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const successId = searchParams.get('success');

  useEffect(() => {
    if (!user) return;
    api<Order[]>(`/orders?user_id=${user.id}`).then(setOrders).catch(console.error);
  }, [user]);

  if (!user) {
    return (
      <div className="container">
        <p>Please <a href="/login">login</a> to view orders.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>My Orders</h1>

      {successId && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          Payment successful! Your e-tickets are being generated.
        </div>
      )}

      {orders.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No orders yet. <a href="/events">Browse events</a></p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => (
            <div key={order.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>{order.event_title || 'Event'}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                    {new Date(order.created_at || '').toLocaleString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${order.status === 'PAID' ? 'badge-economy' : ''}`}
                    style={{
                      background: order.status === 'PAID' ? '#22c55e20' : '#eab30820',
                      color: order.status === 'PAID' ? 'var(--success)' : 'var(--warning)',
                    }}>
                    {order.status}
                  </span>
                  <p style={{ fontWeight: 700, marginTop: '0.5rem' }}>${Number(order.total_amount).toFixed(2)}</p>
                </div>
              </div>
              {order.items && Array.isArray(order.items) && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Seats:</p>
                  {order.items.map((item, i) => (
                    <span key={i} style={{ marginRight: '0.75rem', fontSize: '0.875rem' }}>
                      {item.row_label}{item.seat_number}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

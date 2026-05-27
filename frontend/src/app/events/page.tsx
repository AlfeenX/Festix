'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Event } from '@/lib/api';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api<Event[]>(`/events${search ? `?q=${encodeURIComponent(search)}` : ''}`)
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Upcoming Events</h1>
        <input
          className="input"
          style={{ maxWidth: 300 }}
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading events...</p>
      ) : events.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No events found.</p>
      ) : (
        <div className="grid grid-2">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`} className="card" style={{ display: 'block' }}>
              <div style={{
                height: 160,
                background: 'linear-gradient(135deg, var(--accent), #4c1d95)',
                borderRadius: 8,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
              }}>
                🎵
              </div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{event.title}</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                {event.venue_name}{event.venue_city ? `, ${event.venue_city}` : ''}
              </p>
              <p style={{ fontSize: '0.875rem' }}>
                {new Date(event.starts_at).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
              {event.available_seats !== undefined && (
                <p style={{ color: 'var(--success)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  {event.available_seats} seats available
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

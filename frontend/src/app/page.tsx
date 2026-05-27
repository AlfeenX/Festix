import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container">
      <section style={{
        textAlign: 'center',
        padding: '4rem 0 6rem',
        background: 'radial-gradient(ellipse at center, #7c3aed15 0%, transparent 70%)',
      }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.1 }}>
          Concert Tickets,<br />
          <span style={{ color: 'var(--accent)' }}>Built for Scale</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.25rem', maxWidth: 600, margin: '0 auto 2rem' }}>
          Festix is a distributed high-traffic ticketing platform with real-time seat booking,
          queue-based checkout, and microservices architecture.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/events" className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
            Browse Events
          </Link>
          <Link href="/register" className="btn btn-outline" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
            Create Account
          </Link>
        </div>
      </section>

      <section className="grid grid-2" style={{ marginBottom: '4rem' }}>
        {[
          { title: 'Real-Time Seats', desc: 'WebSocket-powered live seat availability updates during flash sales.' },
          { title: 'Distributed Locking', desc: 'Redis-based seat locks prevent double booking under high concurrency.' },
          { title: 'Waiting Room', desc: 'Virtual queue system handles traffic spikes with FIFO admission.' },
          { title: 'Queue Checkout', desc: 'RabbitMQ async processing prevents database overload during peaks.' },
        ].map((f) => (
          <div key={f.title} className="card">
            <h3 style={{ marginBottom: '0.5rem' }}>{f.title}</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav style={{
      borderBottom: '1px solid var(--border)',
      padding: '1rem 0',
      marginBottom: '2rem',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>
          Festix
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/events">Events</Link>
          {user ? (
            <>
              <Link href="/orders">My Orders</Link>
              {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                <Link href="/admin">Admin</Link>
              )}
              <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{user.full_name}</span>
              <button className="btn btn-outline" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

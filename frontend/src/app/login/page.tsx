'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, margin: '2rem auto' }}>
      <div className="card">
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Login</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', color: 'var(--muted)', fontSize: '0.875rem', textAlign: 'center' }}>
          No account? <Link href="/register">Register</Link>
        </p>
        <p style={{ marginTop: '0.5rem', color: 'var(--muted)', fontSize: '0.75rem', textAlign: 'center' }}>
          Admin: admin@festix.com / Admin123!
        </p>
      </div>
    </div>
  );
}

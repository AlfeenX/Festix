'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form.email, form.password, form.fullName);
      router.push('/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, margin: '2rem auto' }}>
      <div className="card">
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Create Account</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input className="input" placeholder="Full Name" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <input className="input" type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input" type="password" placeholder="Password (min 8, upper, lower, number)"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', color: 'var(--muted)', fontSize: '0.875rem', textAlign: 'center' }}>
          Have an account? <Link href="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Mail, Lock, User, Loader2, ArrowRight, Ticket } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFlash } from '@/components/FlashProvider';

export default function RegisterPage() {
  const { register } = useAuth();
  const { showFlash } = useFlash();
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
      showFlash({ type: 'success', title: 'Registrasi berhasil', description: 'Akun sudah dibuat dan siap digunakan.' });
      router.push('/events');
    } catch (err) {
      const description = err instanceof Error ? err.message : 'Registration failed';
      setError(description);
      showFlash({ type: 'error', title: 'Registrasi gagal', description });
    } finally {
      setForm((prev) => ({ ...prev, password: '' }));
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md my-16 px-4">
      <Card className="p-8 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl text-primary mb-2 shadow-inner">
            <Ticket className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold font-sora text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground font-sans">Join Festix to purchase live concert tickets</p>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertDescription className="font-semibold text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <Label htmlFor="fullName" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Full Name</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
              <Input
                id="fullName"
                type="text"
                className="w-full pl-11 pr-4 h-12 rounded-2xl bg-muted border-border text-sm"
                placeholder="John Doe"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <Label htmlFor="email" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
              <Input
                id="email"
                type="email"
                className="w-full pl-11 pr-4 h-12 rounded-2xl bg-muted border-border text-sm"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <Label htmlFor="password" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
              <Input
                id="password"
                type="password"
                className="w-full pl-11 pr-4 h-12 rounded-2xl bg-muted border-border text-sm"
                placeholder="min 8 chars, mixed case, numbers"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-vibe-gradient text-white border-0 font-extrabold h-12 rounded-full text-sm hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Sign Up
                <ArrowRight className="h-4.5 w-4.5" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground font-medium">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Login Here
          </Link>
        </p>

      </Card>
    </div>
  );
}

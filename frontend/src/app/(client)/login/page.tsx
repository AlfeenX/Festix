'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Mail, Lock, Loader2, ArrowRight, ShieldAlert, Key } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role === 'ADMIN' || parsed.role === 'SUPER_ADMIN') {
          router.push('/admin');
          return;
        }
      }
      router.push('/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[420px] my-16 px-6 sm:px-0 min-h-[80vh] flex flex-col justify-center bg-background antialiased">
      <div className="space-y-8 w-full">
        
        {/* Brand Header */}
        <div className="space-y-2 text-left">
          <div className="text-[10px] tracking-[0.25em] font-bold text-neutral-400 dark:text-neutral-500 uppercase">
            Akses Masuk Aplikasi
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">
            Kembali Eksplorasi.
          </h1>
          <p className="text-sm text-muted-foreground font-normal leading-relaxed">
            Masuk untuk melanjutkan pemesanan tiket pertunjukan musik dan festival favoritmu.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-xl border-red-200/40 bg-red-50/50 text-red-700 dark:bg-red-950/20 dark:text-red-400">
            <AlertDescription className="text-xs font-medium flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Input Form Area */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/80">
              Alamat Email
            </Label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-foreground transition-colors duration-200" />
              <Input
                id="email"
                type="email"
                className="w-full pl-11 pr-4 h-11 rounded-xl bg-neutral-50 dark:bg-neutral-900 border-muted focus-visible:border-neutral-400 dark:focus-visible:border-neutral-700 text-sm transition-all duration-200"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/80">
                Kata Sandi
              </Label>
              <Link href="#" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                Lupa Sandi?
              </Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-foreground transition-colors duration-200" />
              <Input
                id="password"
                type="password"
                className="w-full pl-11 pr-4 h-11 rounded-xl bg-neutral-50 dark:bg-neutral-900 border-muted focus-visible:border-neutral-400 dark:focus-visible:border-neutral-700 text-sm transition-all duration-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Action Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground/40 rounded-xl text-xs font-medium h-11 transition-all duration-200 shadow-none flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Memvalidasi Sesi...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Akun</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </form>

        {/* Register Redirection */}
        <p className="text-left text-xs text-muted-foreground font-normal">
          Belum memiliki akun?{' '}
          <Link href="/register" className="text-foreground font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity">
            Daftar Sekarang
          </Link>
        </p>

        {/* Modern Minimalist Demo Sandbox Credentials */}
        <div className="pt-6 border-t border-muted/60 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            <Key className="h-3 w-3 text-muted-foreground/80" />
            Akses Uji Coba (Sandbox Admin)
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-[11px] font-mono p-3 bg-neutral-50 dark:bg-neutral-900 border border-muted rounded-xl text-muted-foreground">
            <div className="space-y-0.5 border-r border-muted pr-2">
              <span className="block text-[9px] uppercase font-sans font-semibold text-neutral-400">Email</span>
              <span className="text-foreground select-all break-all">admin@festix.com</span>
            </div>
            <div className="space-y-0.5 pl-1">
              <span className="block text-[9px] uppercase font-sans font-semibold text-neutral-400">Password</span>
              <span className="text-foreground select-all">Admin123!</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
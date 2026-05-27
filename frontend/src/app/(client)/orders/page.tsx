'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, Order } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { TicketCard } from '@/components/TicketCard';
import { Sparkles, Loader2, Music, ChevronRight, TicketCheck } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFlash } from '@/components/FlashProvider';

export default function OrdersPage() {
  const { user } = useAuth();
  const { showFlash } = useFlash();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const successId = searchParams.get('success');
  const flashedSuccessId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api<Order[]>(`/orders?user_id=${user.id}`)
      .then(setOrders)
      .catch((error) => showFlash({
        type: 'error',
        title: 'Gagal memuat order',
        description: error instanceof Error ? error.message : 'Data order tidak bisa dimuat.',
      }))
      .finally(() => setLoading(false));
  }, [user, showFlash]);

  useEffect(() => {
    if (!successId || flashedSuccessId.current === successId) return;
    flashedSuccessId.current = successId;
    showFlash({
      type: 'success',
      title: 'Pembayaran berhasil',
      description: 'Tiket digital sudah dibuat dan bisa dilihat di daftar order.',
    });
  }, [successId, showFlash]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md my-16 px-4">
        <Card className="rounded-lg p-8 text-center shadow-none">
          <div className="mx-auto w-fit rounded-lg bg-primary/10 p-3.5 text-primary">
            <Music className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Please Sign In</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You must be logged in to view your purchased tickets.
          </p>
          <Button
            asChild
            className="mt-5 flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg text-sm font-bold"
          >
            <Link href="/login">
              Go to Login
              <ChevronRight className="h-4.5 w-4.5" />
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-border pb-6 text-left sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
            <TicketCheck className="h-8 w-8 text-primary" />
            My Orders & Tickets
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Ringkasan order, status pembayaran, dan e-ticket siap scan.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-lg">
          <Link href="/events">Cari event</Link>
        </Button>
      </div>

      {successId && (
        <Alert className="flex items-center gap-3.5 rounded-lg border-emerald-500/25 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">
          <Sparkles className="h-5 w-5 text-emerald-500 shrink-0" />
          <div>
            <AlertTitle className="font-bold">Payment Complete</AlertTitle>
            <AlertDescription className="text-sm font-medium">
              E-ticket sudah dibuat dan bisa dicek di daftar order.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Retrieving order database...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card className="mx-auto max-w-md rounded-lg border-border p-12 text-center shadow-none">
          <div className="mx-auto w-fit rounded-lg bg-muted p-3.5 text-muted-foreground/60">
            <Music className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-foreground">No Orders Yet</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You haven't bought tickets to any shows yet.
          </p>
          <Button
            asChild
            className="mt-5 flex h-11 w-full cursor-pointer items-center justify-center gap-1 rounded-lg text-sm font-bold"
          >
            <Link href="/events">
              Find Live Shows
              <ChevronRight className="h-4.5 w-4.5" />
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => (
            <TicketCard key={order.id} order={order} />
          ))}
        </div>
      )}

    </div>
  );
}

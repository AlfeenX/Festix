'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, Order } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { TicketCard } from '@/components/TicketCard';
import { Sparkles, CalendarDays, Loader2, Music, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function OrdersPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const successId = searchParams.get('success');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api<Order[]>(`/orders?user_id=${user.id}`)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md my-16 px-4">
        <Card className="p-8 shadow-lg text-center space-y-4 py-8">
          <div className="p-3.5 bg-primary/10 text-primary rounded-full w-fit mx-auto">
            <Music className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold font-sora text-foreground">Please Sign In</h2>
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">
            You must be logged in to view your purchased tickets.
          </p>
          <Button
            asChild
            className="w-full bg-vibe-gradient text-white border-0 font-extrabold h-11 rounded-full text-sm hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen">
      
      {/* Header */}
      <div className="pb-6 border-b border-border text-left">
        <h1 className="text-3xl font-extrabold font-sora text-foreground flex items-center gap-2">
          <CalendarDays className="h-8 w-8 text-primary" />
          My Orders & Tickets
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mt-1">
          Access your digital gate passes, check seat numbers, and track your payment receipts.
        </p>
      </div>

      {successId && (
        <Alert className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm animate-bounce">
          <Sparkles className="h-5 w-5 text-emerald-500 shrink-0" />
          <div>
            <AlertTitle className="font-bold text-emerald-700 dark:text-emerald-300">Payment Complete!</AlertTitle>
            <AlertDescription className="text-sm font-medium">
              Your secure digital tickets have been generated. Check in below.
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
        <Card className="p-12 text-center max-w-md mx-auto space-y-4 shadow-md border-border">
          <div className="p-3.5 bg-muted text-muted-foreground/50 rounded-full w-fit mx-auto">
            <Music className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold font-sora text-foreground">No Orders Yet</h3>
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">
            You haven't bought tickets to any shows yet.
          </p>
          <Button
            asChild
            className="w-full bg-vibe-gradient text-white border-0 font-extrabold h-11 rounded-full text-sm hover:shadow-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
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

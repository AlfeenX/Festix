'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { api, Event, Seat } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Calendar, MapPin, Loader2, ArrowLeft, ShieldCheck, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFlash } from '@/components/FlashProvider';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3003';

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value));
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { showFlash } = useFlash();
  const [event, setEvent] = useState<Event | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [queueStatus, setQueueStatus] = useState<string | null>(null);

  const loadSeats = useCallback(() => {
    api<Seat[]>(`/events/${id}/seats?refresh=1`).then(setSeats).catch(console.error);
  }, [id]);

  useEffect(() => {
    api<Event>(`/events/${id}`).then(setEvent).catch(console.error);
    loadSeats();
  }, [id, loadSeats]);

  useEffect(() => {
    const socket = io(WS_URL, { transports: ['websocket'] });
    socket.emit('join:event', id);
    if (user) socket.emit('join:user', user.id);

    socket.on('seats:update', (data: { seats: Seat[] }) => {
      setSeats(data.seats);
      setSelected((prev) => {
        const next = new Set(prev);
        for (const sid of prev) {
          const seat = data.seats.find((s) => s.id === sid);
          if (seat && seat.status !== 'AVAILABLE') next.delete(sid);
        }
        return next;
      });
    });

    socket.on('queue:admitted', () => setQueueStatus('admitted'));

    return () => { socket.disconnect(); };
  }, [id, user]);

  const joinWaitingRoom = async () => {
    if (!user) { router.push('/login'); return; }
    try {
      const res = await api<{ status: string; position: number }>(
        `/waiting-room/${id}/join`,
        { method: 'POST', body: JSON.stringify({ user_id: user.id }) }
      );
      setQueueStatus(res.status === 'admitted' ? 'admitted' : `waiting (#${res.position})`);
      showFlash({
        type: 'success',
        title: res.status === 'admitted' ? 'Antrean aktif' : 'Masuk antrean',
        description: res.status === 'admitted' ? 'Anda bisa melanjutkan pemesanan.' : `Posisi antrean Anda #${res.position}.`,
      });
    } catch (e) {
      const description = e instanceof Error ? e.message : 'Failed to join queue';
      setError(description);
      showFlash({ type: 'error', title: 'Gagal masuk antrean', description });
    }
  };

  const toggleSeat = (seat: Seat) => {
    if (seat.status !== 'AVAILABLE') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(seat.id)) next.delete(seat.id);
      else if (next.size < 6) next.add(seat.id);
      return next;
    });
  };

  const handleCheckout = async () => {
    if (!user) { router.push('/login'); return; }
    if (selected.size === 0) return;
    setLoading(true);
    setError('');
    try {
      await api('/seats/lock', {
        method: 'POST',
        body: JSON.stringify({ seat_ids: Array.from(selected), user_id: user.id }),
      });

      const order = await api<{ order: { id: string; total_amount: number | string } }>('/checkout', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id, event_id: id, seat_ids: Array.from(selected) }),
      });

      showFlash({
        type: 'success',
        title: 'Order dibuat',
        description: 'Lanjutkan checkout dan pilih metode pembayaran.',
      });
      router.push(`/checkout/${order.order.id}`);
    } catch (e) {
      const description = e instanceof Error ? e.message : 'Checkout failed';
      setError(description);
      showFlash({ type: 'error', title: 'Checkout gagal', description });
    } finally {
      setLoading(false);
    }
  };

  const rows = [...new Set(seats.map((s) => s.row_label))].sort();
  const total = seats.filter((s) => selected.has(s.id)).reduce((sum, s) => sum + Number(s.price), 0);

  const getSeatStyles = (seat: Seat) => {
    if (selected.has(seat.id)) {
      return 'bg-neutral-900 border-neutral-900 text-white dark:bg-neutral-100 dark:border-neutral-100 dark:text-neutral-900 font-medium scale-95 shadow-sm';
    }
    if (seat.status !== 'AVAILABLE') {
      return 'bg-neutral-100 border-transparent text-neutral-300 dark:bg-neutral-800/50 dark:text-neutral-700 cursor-not-allowed';
    }
    
    switch (seat.category.toUpperCase()) {
      case 'VIP':
        return 'bg-transparent border-amber-500/30 text-amber-600 hover:bg-amber-50';
      case 'REGULAR':
        return 'bg-transparent border-blue-500/30 text-blue-600 hover:bg-blue-550';
      case 'ECONOMY':
      default:
        return 'bg-transparent border-emerald-500/30 text-emerald-600 hover:bg-emerald-50';
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8 space-y-10 bg-background antialiased">
      
      {/* Navigation */}
      <div>
        <Link href="/events" className="inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali
        </Link>
      </div>

      {/* Header Info */}
      {event && (
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-muted pb-8">
          <div className="space-y-3 max-w-2xl">
            <Badge variant="secondary" className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
              Konfirmasi Instan
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {event.title}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {event.description || 'Saksikan pertunjukan luar biasa ini secara langsung dengan sistem suara berkualitas tinggi.'}
            </p>
          </div>

          <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row md:flex-col gap-3 text-xs bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-4 border border-muted/60">
            <div className="flex items-center gap-2.5 text-foreground/80 font-medium">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{new Date(event.starts_at).toLocaleString('id-ID', {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}</span>
            </div>
            <div className="flex items-center gap-2.5 text-foreground/80 font-medium">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{event.venue_name || 'TBA'}{event.venue_city ? `, ${event.venue_city}` : ''}</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="rounded-xl border-red-100 bg-red-50/50 text-red-700">
          <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left: Seat Selection (No horizontal scroll guarantee) */}
        <div className="lg:col-span-7 space-y-8 w-full">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Pilih Tempat Duduk</h2>
            <p className="text-xs text-muted-foreground">Ketuk kursi yang tersedia di bawah ini.</p>
          </div>

          {/* Stage Line */}
          <div className="w-full pt-2">
            <div className="w-full h-[1px] bg-neutral-200 dark:bg-neutral-800" />
            <div className="text-center text-[9px] tracking-[0.4em] text-muted-foreground/70 font-medium uppercase mt-1.5">
              PANGGUNG UTAMA
            </div>
          </div>

          {/* Flexible Seat Map Area */}
          <div className="flex flex-col gap-3 py-4 w-full items-stretch">
            {rows.map((row) => (
              <div key={row} className="flex gap-3 items-start justify-start sm:justify-center w-full">
                {/* Row Indicator */}
                <span className="w-4 text-[10px] font-mono font-bold text-muted-foreground/50 text-center pt-2 shrink-0">
                  {row}
                </span>
                
                {/* Seats container with flex-wrap to prevent overflow */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  {seats.filter((s) => s.row_label === row).map((seat) => (
                    <button
                      key={seat.id}
                      disabled={seat.status !== 'AVAILABLE'}
                      onClick={() => toggleSeat(seat)}
                      className={`h-7 w-7 sm:h-8 sm:w-8 rounded-md border text-[9px] font-mono transition-all duration-150 focus:outline-none shrink-0 ${getSeatStyles(seat)}`}
                      title={`${seat.category} - ${row}${seat.seat_number}`}
                    >
                      {seat.seat_number}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legend Grid */}
          <div className="flex flex-wrap justify-start sm:justify-center items-center gap-x-5 gap-y-2 text-[10px] text-muted-foreground font-medium pt-4 border-t border-muted">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-transparent border border-amber-500/40" />
              <span>VIP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-transparent border border-blue-500/40" />
              <span>Regular</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-transparent border border-emerald-500/40" />
              <span>Economy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-neutral-900 dark:bg-neutral-100" />
              <span>Pilihan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-neutral-100 dark:bg-neutral-800" />
              <span>Terisi</span>
            </div>
          </div>
        </div>

        {/* Right: Checkout Sidebar */}
        <Card className="lg:col-span-5 p-5 bg-neutral-50/50 dark:bg-neutral-900/10 border border-muted shadow-none rounded-xl space-y-5 w-full">
          <h3 className="text-sm font-semibold text-foreground">
            Struktur Tiket
          </h3>
          
          {selected.size === 0 ? (
            <div className="text-center py-10 space-y-2 border border-dashed border-muted rounded-xl bg-background">
              <HelpCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Belum memilih nomor kursi</p>
                <p className="text-[10px] text-muted-foreground/60">Sesi pemesanan aktif setelah kursi dipilih.</p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-muted/40 space-y-0.5">
              {seats.filter((s) => selected.has(s.id)).map((s) => (
                <li key={s.id} className="flex justify-between items-center py-2.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="h-5 w-7 rounded bg-background border border-muted flex items-center justify-center font-mono font-bold text-foreground text-[10px]">
                      {s.row_label}{s.seat_number}
                    </span>
                    <span className="text-muted-foreground capitalize text-[10px]">{s.category.toLowerCase()}</span>
                  </div>
                  <span className="font-semibold text-foreground">{formatCurrency(s.price)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="pt-2 border-t border-muted/60 flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-lg font-bold tracking-tight text-foreground">{formatCurrency(total)}</span>
          </div>

          {!user && (
            <div className="p-3 bg-background border border-muted rounded-lg text-center text-xs text-muted-foreground">
              Silakan <Link href="/login" className="text-foreground font-semibold underline underline-offset-2">Masuk</Link> untuk memproses order.
            </div>
          )}

          {user && queueStatus && queueStatus !== 'admitted' && (
            <div className="p-2.5 bg-amber-500/5 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-lg text-center text-xs font-medium">
              Antrean Anda: {queueStatus}
            </div>
          )}

          {user && !queueStatus && (
            <Button
              variant="outline"
              onClick={joinWaitingRoom}
              className="w-full rounded-lg text-xs font-medium bg-background border-muted text-foreground hover:bg-neutral-50 h-9"
            >
              Ambil Antrean Booking
            </Button>
          )}

          <Button
            onClick={handleCheckout}
            disabled={!user || selected.size === 0 || loading || (queueStatus !== null && queueStatus !== 'admitted')}
            className="w-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 disabled:bg-neutral-200 disabled:text-neutral-400 rounded-lg text-xs font-medium shadow-none h-9 transition-opacity"
          >
            {loading ? (
              <div className="flex items-center gap-2 justify-center">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Memproses Dokumen...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Konfirmasi Pemesanan ({formatCurrency(total)})</span>
              </div>
            )}
          </Button>
        </Card>

      </div>
    </div>
  );
}

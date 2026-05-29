'use client';

import { useEffect, useMemo, useState } from 'react';
import { Armchair, CheckCircle2, Cpu, Loader2, RefreshCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFlash } from '@/components/FlashProvider';
import { api, Event, Seat } from '@/lib/api';
import { formatCurrency, formatDateTime } from '../_config/format';

type SeatStatus = {
  total: number;
  available: number;
};

const seatConfig = {
  rows: 8,
  seats_per_row: 20,
  categories: [
    { rows: ['A', 'B'], category: 'VIP', price: 750000 },
    { rows: ['C', 'D', 'E'], category: 'REGULAR', price: 350000 },
    { rows: ['F', 'G', 'H'], category: 'ECONOMY', price: 150000 },
  ],
};

export default function AdminSeatingPage() {
  const { showFlash } = useFlash();
  const [events, setEvents] = useState<Event[]>([]);
  const [seatStatus, setSeatStatus] = useState<Record<string, SeatStatus>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const loadedEvents = await api<Event[]>('/events?refresh=1');
      setEvents(loadedEvents);

      const statusEntries = await Promise.all(
        loadedEvents.map(async (event) => {
          try {
            const seats = await api<Seat[]>(`/events/${event.id}/seats?refresh=1`);
            return [
              event.id,
              {
                total: seats.length,
                available: seats.filter((seat) => seat.status === 'AVAILABLE').length,
              },
            ] as const;
          } catch {
            return [event.id, { total: 0, available: Number(event.available_seats || 0) }] as const;
          }
        })
      );

      setSeatStatus(Object.fromEntries(statusEntries));
    } catch (error) {
      showFlash({
        type: 'error',
        title: 'Gagal memuat seating',
        description: error instanceof Error ? error.message : 'Data seating tidak bisa dimuat.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = useMemo(() => {
    const generated = Object.values(seatStatus).filter((status) => status.total > 0).length;
    const totalSeats = Object.values(seatStatus).reduce((sum, status) => sum + status.total, 0);
    const availableSeats = Object.values(seatStatus).reduce((sum, status) => sum + status.available, 0);

    return { generated, totalSeats, availableSeats };
  }, [seatStatus]);

  const generateSeats = async (eventId: string) => {
    setGenerating(eventId);
    try {
      await api(`/admin/events/${eventId}/seats/generate`, {
        method: 'POST',
        body: JSON.stringify(seatConfig),
      });
      await loadData();
      showFlash({
        type: 'success',
        title: 'Seating berhasil dibuat',
        description: 'Layout kursi event sudah digenerate.',
      });
    } catch (error) {
      showFlash({
        type: 'error',
        title: 'Gagal generate seating',
        description: error instanceof Error ? error.message : 'Layout kursi tidak bisa dibuat.',
      });
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3 rounded-md">Seating</Badge>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            <Armchair className="h-7 w-7 text-primary" />
            Konfigurasi Seating
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Generate layout kursi per event. Tombol akan nonaktif otomatis setelah seats berhasil dibuat.
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg border-border/80 p-4 shadow-none">
          <p className="text-xs text-muted-foreground">Event sudah seating</p>
          <p className="mt-1 text-2xl font-bold">{summary.generated}/{events.length}</p>
        </Card>
        <Card className="rounded-lg border-border/80 p-4 shadow-none">
          <p className="text-xs text-muted-foreground">Total kursi dibuat</p>
          <p className="mt-1 text-2xl font-bold">{summary.totalSeats}</p>
        </Card>
        <Card className="rounded-lg border-border/80 p-4 shadow-none">
          <p className="text-xs text-muted-foreground">Kursi tersedia</p>
          <p className="mt-1 text-2xl font-bold">{summary.availableSeats}</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => {
          const status = seatStatus[event.id] || { total: 0, available: 0 };
          const isGenerated = status.total > 0;
          const isGenerating = generating === event.id;

          return (
            <Card key={event.id} className="rounded-lg border-border/80 bg-card p-4 shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(event.starts_at)}</p>
                </div>
                <Badge variant={isGenerated ? 'default' : 'outline'} className="rounded-md">
                  {isGenerated ? 'Generated' : 'Belum dibuat'}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <span className="block text-muted-foreground">Total kursi</span>
                  <span className="mt-1 block text-lg font-bold text-foreground">{status.total}</span>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <span className="block text-muted-foreground">Tersedia</span>
                  <span className="mt-1 block text-lg font-bold text-foreground">{status.available}</span>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground">
                <p>Venue: {event.venue_name || 'TBA'}{event.venue_city ? `, ${event.venue_city}` : ''}</p>
                <p className="mt-1">Template: VIP {formatCurrency(750000)}, Regular {formatCurrency(350000)}, Economy {formatCurrency(150000)}</p>
              </div>

              <Button
                variant={isGenerated ? 'secondary' : 'default'}
                className="mt-4 w-full gap-2 rounded-lg"
                disabled={isGenerated || isGenerating}
                onClick={() => generateSeats(event.id)}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isGenerated ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Cpu className="h-4 w-4" />
                )}
                {isGenerating ? 'Generating...' : isGenerated ? 'Seat sudah digenerate' : 'Generate Seat'}
              </Button>
            </Card>
          );
        })}
        {events.length === 0 && (
          <Card className="rounded-lg border-dashed border-border p-10 text-center text-sm text-muted-foreground shadow-none md:col-span-2 xl:col-span-3">
            Belum ada event untuk dikonfigurasi.
          </Card>
        )}
      </div>
    </div>
  );
}

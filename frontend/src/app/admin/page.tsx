'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Armchair,
  CalendarClock,
  ClipboardList,
  DollarSign,
  Loader2,
  TicketCheck,
  TrendingUp,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, Event, Order } from '@/lib/api';
import { formatCurrency, formatDateTime, getEventStatus } from './_config/format';

const fallbackTrend = [
  { label: 'Jan', revenue: 2600000, orders: 32 },
  { label: 'Feb', revenue: 3400000, orders: 46 },
  { label: 'Mar', revenue: 2800000, orders: 38 },
  { label: 'Apr', revenue: 5100000, orders: 71 },
  { label: 'Mei', revenue: 6200000, orders: 84 },
  { label: 'Jun', revenue: 7600000, orders: 96 },
];

export default function AdminOverviewPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api<Event[]>('/events?refresh=1'),
      api<Order[]>('/admin/orders?refresh=1'),
    ]).then(([eventsResult, ordersResult]) => {
      if (eventsResult.status === 'fulfilled') setEvents(eventsResult.value);
      if (ordersResult.status === 'fulfilled') setOrders(ordersResult.value);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const paidOrders = orders.filter((order) => order.status?.toUpperCase() === 'PAID' || order.status?.toUpperCase() === 'COMPLETED');
    const availableSeats = events.reduce((sum, event) => sum + Number(event.available_seats || 0), 0);
    const upcomingEvents = events.filter((event) => getEventStatus(event.starts_at, event.ends_at) === 'Upcoming');

    return [
      {
        label: 'Revenue',
        value: revenue > 0 ? formatCurrency(revenue) : formatCurrency(0),
        helper: 'Total nominal order yang tercatat',
        icon: DollarSign,
      },
      {
        label: 'Order Masuk',
        value: orders.length.toString(),
        helper: `${paidOrders.length} order sudah selesai dibayar`,
        icon: ClipboardList,
      },
      {
        label: 'Event Aktif',
        value: events.length.toString(),
        helper: `${upcomingEvents.length} event akan datang`,
        icon: CalendarClock,
      },
      {
        label: 'Kursi Tersedia',
        value: availableSeats.toString(),
        helper: 'Akumulasi kursi dari katalog event',
        icon: Armchair,
      },
    ];
  }, [events, orders]);

  const topEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
      .slice(0, 5);
  }, [events]);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3 rounded-md">Admin Dashboard</Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Operasional Festix</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Pantau jadwal event, penjualan tiket, okupansi kursi, dan order terbaru dari satu tempat.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/events">Kelola Event</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/events">Tambah Event</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="rounded-lg border-border/80 bg-card p-4 shadow-none">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{stat.helper}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-lg border-border/80 bg-card p-5 shadow-none xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Tren Penjualan</h2>
              <p className="text-xs text-muted-foreground">Fallback chart ditampilkan saat endpoint analitik belum tersedia.</p>
            </div>
            <Badge variant="outline" className="rounded-md">
              <TrendingUp className="h-3 w-3" />
              6 bulan
            </Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fallbackTrend} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip formatter={(value) => (typeof value === 'number' ? formatCurrency(value) : value)} />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#revenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-lg border-border/80 bg-card p-5 shadow-none">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Event Terdekat</h2>
              <p className="text-xs text-muted-foreground">Prioritas pengecekan seating dan publikasi.</p>
            </div>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="space-y-3">
            {topEvents.map((event) => (
              <Link
                key={event.id}
                href={`/admin/events`}
                className="flex items-start gap-3 rounded-lg border border-border/70 p-3 transition-colors hover:bg-muted/50"
              >
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <TicketCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(event.starts_at)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{event.venue_name || 'Venue TBA'}{event.venue_city ? `, ${event.venue_city}` : ''}</p>
                </div>
                <Badge variant="outline" className="rounded-md text-[10px]">{getEventStatus(event.starts_at, event.ends_at)}</Badge>
              </Link>
            ))}
            {!loading && topEvents.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <Activity className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Belum ada event</p>
                <p className="text-xs text-muted-foreground">Buat event pertama untuk mengaktifkan dashboard.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

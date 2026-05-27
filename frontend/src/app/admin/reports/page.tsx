'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, LineChart, TicketCheck } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { api, Event, Order } from '@/lib/api';
import { formatCurrency } from '../_config/format';

export default function AdminReportsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    Promise.allSettled([
      api<Event[]>('/events?refresh=1'),
      api<Order[]>('/admin/orders?refresh=1'),
    ]).then(([eventsResult, ordersResult]) => {
      if (eventsResult.status === 'fulfilled') setEvents(eventsResult.value);
      if (ordersResult.status === 'fulfilled') setOrders(ordersResult.value);
    });
  }, []);

  const reportRows = useMemo(() => {
    return events.slice(0, 8).map((event) => {
      const eventOrders = orders.filter((order) => order.event_id === event.id || order.event_title === event.title);
      return {
        name: event.title.length > 18 ? `${event.title.slice(0, 18)}...` : event.title,
        revenue: eventOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
        orders: eventOrders.length,
      };
    });
  }, [events, orders]);

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <Badge variant="secondary" className="mb-3 rounded-md">Reports</Badge>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          <LineChart className="h-7 w-7 text-primary" />
          Laporan Penjualan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Analitik ringan untuk revenue dan order per event.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg border-border/80 p-4 shadow-none">
          <BarChart3 className="mb-3 h-5 w-5 text-primary" />
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
        </Card>
        <Card className="rounded-lg border-border/80 p-4 shadow-none">
          <TicketCheck className="mb-3 h-5 w-5 text-primary" />
          <p className="text-xs text-muted-foreground">Total Order</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </Card>
        <Card className="rounded-lg border-border/80 p-4 shadow-none">
          <LineChart className="mb-3 h-5 w-5 text-primary" />
          <p className="text-xs text-muted-foreground">Event Terpantau</p>
          <p className="text-2xl font-bold">{events.length}</p>
        </Card>
      </div>

      <Card className="rounded-lg border-border/80 p-5 shadow-none">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Revenue per Event</h2>
          <p className="text-xs text-muted-foreground">Data akan terisi penuh ketika endpoint order admin tersedia.</p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportRows} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip formatter={(value) => (typeof value === 'number' ? formatCurrency(value) : value)} />
              <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

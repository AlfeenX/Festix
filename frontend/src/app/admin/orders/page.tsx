'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api, Order } from '@/lib/api';
import { formatCurrency, formatDateTime } from '../_config/format';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api<Order[]>('/admin/orders?refresh=1')
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat order.'));
  }, []);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter((order) =>
      [order.id, order.event_id, order.event_title, order.status]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(keyword))
    );
  }, [orders, search]);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3 rounded-md">Orders</Badge>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            <ClipboardList className="h-7 w-7 text-primary" />
            Monitor Order
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Pantau transaksi tiket, status pembayaran, dan nominal penjualan.</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari order..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      {error && (
        <Card className="rounded-lg border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700 shadow-none dark:text-amber-300">
          {error}
        </Card>
      )}

      <Card className="overflow-hidden rounded-lg border-border/80 bg-card py-0 shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-4">Order ID</TableHead>
              <TableHead className="px-6 py-4">Event</TableHead>
              <TableHead className="px-6 py-4">Status</TableHead>
              <TableHead className="px-6 py-4">Tanggal</TableHead>
              <TableHead className="px-6 py-4 text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="px-6 py-4 font-mono text-xs">{order.id}</TableCell>
                <TableCell className="px-6 py-4 font-medium">{order.event_title || order.event_id}</TableCell>
                <TableCell className="px-6 py-4">
                  <Badge variant="outline" className="rounded-md">{order.status}</Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-xs text-muted-foreground">{formatDateTime(order.created_at)}</TableCell>
                <TableCell className="px-6 py-4 text-right font-semibold">{formatCurrency(Number(order.total_amount || 0))}</TableCell>
              </TableRow>
            ))}
            {filteredOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                  Belum ada order yang ditampilkan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

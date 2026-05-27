'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import QRCode from 'qrcode';
import { ArrowRight, Calendar, CheckCircle2, Clock3, QrCode, Receipt, Ticket } from 'lucide-react';
import { Order } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TicketCardProps {
  order: Order;
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) * 1000);
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusTone(status: string) {
  if (status === 'PAID') return 'border-emerald-500/25 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300';
  if (status === 'FAILED' || status === 'CANCELLED') return 'border-red-500/25 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300';
  return 'border-amber-500/25 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
}

export function TicketCard({ order }: TicketCardProps) {
  const [ticketQr, setTicketQr] = useState<Record<string, string>>({});
  const isPaid = order.status === 'PAID';

  useEffect(() => {
    let active = true;
    async function buildQr() {
      const entries = await Promise.all(
        (order.tickets || []).map(async (ticket) => {
          const value = ticket.qr_data || ticket.ticket_code;
          const image = await QRCode.toDataURL(value, {
            width: 180,
            margin: 1,
            color: { dark: '#111827', light: '#ffffff' },
          });
          return [ticket.id, image] as const;
        })
      );
      if (active) setTicketQr(Object.fromEntries(entries));
    }
    buildQr().catch(console.error);
    return () => { active = false; };
  }, [order.tickets]);

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card shadow-none">
      <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`rounded-md ${statusTone(order.status)}`}>
              {isPaid ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <Clock3 className="mr-1 h-3 w-3" />}
              {order.status}
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8)}</span>
          </div>
          <h3 className="mt-3 truncate text-xl font-bold tracking-tight">{order.event_title || 'Event'}</h3>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(order.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Receipt className="h-4 w-4" />
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>

        {!isPaid && (
          <Button asChild className="h-9 shrink-0 rounded-lg">
            <Link href={`/checkout/${order.id}`}>
              Lanjut bayar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          {(order.items || []).map((item, index) => (
            <span key={`${item.seat_id}-${index}`} className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs font-semibold">
              <Ticket className="h-3.5 w-3.5 text-primary" />
              Seat {item.row_label}{item.seat_number}
            </span>
          ))}
        </div>

        {isPaid ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(order.tickets || []).map((ticket) => (
              <div key={ticket.id} className="flex items-center gap-4 rounded-lg border border-border bg-background p-3">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md border border-border bg-white p-2">
                  {ticketQr[ticket.id] ? (
                    <Image src={ticketQr[ticket.id]} alt={ticket.ticket_code} width={88} height={88} className="h-full w-full object-contain" unoptimized />
                  ) : (
                    <QrCode className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">E-ticket</p>
                  <p className="truncate font-mono text-sm font-bold">{ticket.ticket_code}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Issued {formatDate(ticket.issued_at)}</p>
                </div>
              </div>
            ))}
            {(!order.tickets || order.tickets.length === 0) && (
              <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground sm:col-span-2">
                Ticket sedang dibuat. Refresh halaman beberapa saat lagi.
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            E-ticket akan muncul setelah pembayaran dikonfirmasi dari simulator mobile.
          </div>
        )}
      </div>
    </article>
  );
}

'use client';

import { Ticket, Barcode, Calendar, Receipt } from 'lucide-react';
import { Order } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface TicketCardProps {
  order: Order;
}

export function TicketCard({ order }: TicketCardProps) {
  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';

  const isPaid = order.status === 'PAID';

  return (
    <Card className="overflow-hidden shadow-md flex flex-col md:flex-row w-full relative py-0 gap-0">
      {/* Left colored accent */}
      <div className={`w-3 md:w-4 ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'} shrink-0`} />

      {/* Main ticket body */}
      <CardContent className="p-6 flex-grow flex flex-col justify-between gap-4">
        <div>
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-primary/80">
                E-Ticket
              </span>
              <h3 className="text-xl font-bold font-sora text-foreground mt-1">
                {order.event_title || 'Event'}
              </h3>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <Badge variant={isPaid ? "default" : "outline"} className={`h-6 font-bold ${
                isPaid 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10' 
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/10'
              }`}>
                {order.status}
              </Badge>
              <span className="text-xs text-muted-foreground mt-1">
                ID: #{order.id.slice(0, 8)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary/70 shrink-0" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary/70 shrink-0" />
              <span>Total: <strong className="text-foreground font-bold">${Number(order.total_amount).toFixed(2)}</strong></span>
            </div>
          </div>
        </div>

        {order.items && Array.isArray(order.items) && (
          <div className="space-y-2 mt-2">
            <Separator className="border-dashed" />
            <span className="text-xs text-muted-foreground font-semibold block">
              ASSIGNED SEATS
            </span>
            <div className="flex flex-wrap gap-2">
              {order.items.map((item, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs font-bold bg-muted text-foreground border border-border rounded-lg flex items-center gap-1"
                >
                  <Ticket className="h-3 w-3 text-primary/80" />
                  Seat {item.row_label}{item.seat_number}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Decorative perforation separator for md+ */}
      <div className="hidden md:flex flex-col justify-between items-center py-2 relative shrink-0">
        <div className="w-6 h-6 bg-background border-r border-b border-border rounded-full -mt-5" />
        <div className="h-full border-l border-dashed border-border my-1" />
        <div className="w-6 h-6 bg-background border-r border-t border-border rounded-full -mb-5" />
      </div>

      {/* Barcode side */}
      <div className="bg-muted/30 px-8 py-6 flex flex-col justify-center items-center gap-2 md:w-48 border-t md:border-t-0 md:border-l border-border shrink-0">
        {isPaid ? (
          <>
            <Barcode className="h-12 w-28 text-foreground/80 stroke-[1.5]" />
            <span className="text-[10px] tracking-[0.25em] font-mono text-muted-foreground">
              SECURE-PASS
            </span>
          </>
        ) : (
          <span className="text-xs text-amber-500 font-bold text-center">
            Awaiting Payment Complete
          </span>
        )}
      </div>
    </Card>
  );
}

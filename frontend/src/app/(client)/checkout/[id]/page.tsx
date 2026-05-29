'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, CreditCard, Loader2, Smartphone, Ticket, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { api, Order, Payment } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useFlash } from '@/components/FlashProvider';

const paymentMethods = [
  { id: 'FESTIX_WALLET', label: 'Festix Wallet', description: 'Simulasi e-wallet instan', icon: WalletCards },
  { id: 'MOBILE_BANKING', label: 'Mobile Banking', description: 'Konfirmasi dari layar banking', icon: Building2 },
  { id: 'QRIS_FAKE', label: 'QRIS Sandbox', description: 'Scan QR dan bayar dari hape', icon: Smartphone },
  { id: 'VIRTUAL_CARD', label: 'Virtual Card', description: 'Kartu uji tanpa transaksi nyata', icon: CreditCard },
];

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value));
}

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { showFlash } = useFlash();
  const [order, setOrder] = useState<Order | null>(null);
  const [method, setMethod] = useState(paymentMethods[0].id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    api<Order>(`/orders/${id}`)
      .then(setOrder)
      .catch((error) => showFlash({
        type: 'error',
        title: 'Checkout tidak tersedia',
        description: error instanceof Error ? error.message : 'Order tidak bisa dimuat.',
      }))
      .finally(() => setLoading(false));
  }, [id, user, showFlash]);

  const selectedMethod = useMemo(
    () => paymentMethods.find((item) => item.id === method) || paymentMethods[0],
    [method]
  );

  const continuePayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!order) return;

    setSaving(true);
    try {
      const payment = await api<{ payment: Payment }>('/payments/pay', {
        method: 'POST',
        body: JSON.stringify({
          order_id: order.id,
          amount: Number(order.total_amount),
          payment_method: method,
          idempotency_key: `${order.id}:${method}`,
        }),
      });
      router.push(`/payment/${payment.payment.id}`);
    } catch (error) {
      showFlash({
        type: 'error',
        title: 'Gagal membuat pembayaran',
        description: error instanceof Error ? error.message : 'Payment session tidak bisa dibuat.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card className="rounded-lg p-8 text-center shadow-none">
          <h1 className="text-xl font-bold">Login diperlukan</h1>
          <p className="mt-2 text-sm text-muted-foreground">Masuk terlebih dahulu untuk melanjutkan checkout.</p>
          <Button asChild className="mt-5 w-full">
            <Link href="/login">Masuk</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <Link href="/events" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke event
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <form onSubmit={continuePayment} className="space-y-6">
          <div>
            <Badge variant="secondary" className="mb-3 rounded-md">Checkout</Badge>
            <h1 className="text-3xl font-bold tracking-tight">Review pesanan</h1>
            <p className="mt-1 text-sm text-muted-foreground">Pilih metode pembayaran sebelum diarahkan ke halaman QR.</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-bold">Metode pembayaran</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {paymentMethods.map((item) => {
                const Icon = item.icon;
                const active = method === item.id;
                return (
                  <Label
                    key={item.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                      active ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={item.id}
                      checked={active}
                      onChange={() => setMethod(item.id)}
                      className="sr-only"
                    />
                    <span className={`rounded-md p-2 ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{item.label}</span>
                      <span className="block text-xs font-normal text-muted-foreground">{item.description}</span>
                    </span>
                  </Label>
                );
              })}
            </div>
          </section>

          <Button type="submit" disabled={saving || order.status === 'PAID'} className="h-11 gap-2 rounded-lg">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
            Lanjut ke pembayaran {selectedMethod.label}
          </Button>
        </form>

        <aside className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Order</p>
              <h2 className="mt-1 text-lg font-bold">{order.event_title || 'Event'}</h2>
            </div>
            <Badge variant="outline" className="rounded-md">{order.status}</Badge>
          </div>

          <div className="mt-5 space-y-2">
            {(order.items || []).map((item, index) => (
              <div key={`${item.seat_id}-${index}`} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 font-semibold">
                  <Ticket className="h-4 w-4 text-primary" />
                  Seat {item.row_label}{item.seat_number}
                </span>
                <span className="text-muted-foreground">{formatCurrency(item.price)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total bayar</span>
              <span className="text-2xl font-bold">{formatCurrency(order.total_amount)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Ini adalah fake payment sandbox. Tidak ada transaksi uang nyata.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

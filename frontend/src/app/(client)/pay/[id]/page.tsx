'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Building2, CheckCircle2, CreditCard, Loader2, ShieldCheck, Smartphone, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, Payment } from '@/lib/api';

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value));
}

function methodView(method?: string) {
  switch (method) {
    case 'MOBILE_BANKING':
      return { label: 'Nusantara Mobile', icon: Building2, tone: 'bg-sky-600', account: 'Tabungan Utama **** 2041' };
    case 'QRIS_FAKE':
      return { label: 'QRIS Sandbox', icon: Smartphone, tone: 'bg-rose-600', account: 'QR Merchant Festix Live' };
    case 'VIRTUAL_CARD':
      return { label: 'Virtual Card', icon: CreditCard, tone: 'bg-zinc-900', account: 'Card **** 8842' };
    case 'FESTIX_WALLET':
    default:
      return { label: 'Festix Wallet', icon: WalletCards, tone: 'bg-emerald-600', account: 'Wallet Balance Rp 9.500.000' };
  }
}

export default function FakeMobilePaymentPage() {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');

  const view = useMemo(() => methodView(payment?.payment_method), [payment?.payment_method]);
  const Icon = view.icon;

  const loadPayment = async () => {
    try {
      const data = await api<Payment>(`/payments/session/${id}`);
      setPayment(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Payment tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayment();
  }, [id]);

  const confirmPayment = async () => {
    setConfirming(true);
    setMessage('');
    try {
      const result = await api<{ payment: Payment; success: boolean; transaction_id?: string | null }>(
        `/payments/${id}/confirm`,
        { method: 'POST', body: JSON.stringify({ confirmed_by: 'mobile-simulator' }) }
      );
      setPayment(result.payment);
      setMessage(result.success ? 'Pembayaran berhasil dikonfirmasi.' : 'Pembayaran gagal. Silakan buat ulang pembayaran.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Konfirmasi pembayaran gagal.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-600" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
        <Card className="max-w-sm rounded-[28px] p-6 text-center shadow-none">
          <h1 className="text-lg font-bold">Payment tidak tersedia</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </Card>
      </div>
    );
  }

  const paid = payment.status === 'SUCCESS';

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-6 text-neutral-950">
      <div className="mx-auto max-w-[390px]">
        <div className="overflow-hidden rounded-[32px] bg-white shadow-2xl shadow-neutral-900/10">
          <div className={`${view.tone} p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-white/15 p-2">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">{view.label}</p>
                  <p className="text-xs text-white/75">Secure Payment Simulator</p>
                </div>
              </div>
              <Badge className="rounded-md bg-white/15 text-white hover:bg-white/15">{payment.status}</Badge>
            </div>

            <div className="mt-8">
              <p className="text-xs text-white/70">Total pembayaran</p>
              <p className="mt-1 text-4xl font-black tracking-tight">{formatCurrency(payment.amount)}</p>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div className="rounded-2xl border border-neutral-200 p-4">
              <p className="text-xs font-semibold uppercase text-neutral-500">Merchant</p>
              <p className="mt-1 text-base font-bold">Festix Ticketing</p>
              <p className="text-sm text-neutral-500">{payment.event_title}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-neutral-100 p-4">
                <p className="text-xs text-neutral-500">Sumber dana</p>
                <p className="mt-1 text-sm font-bold">{view.account}</p>
              </div>
              <div className="rounded-2xl bg-neutral-100 p-4">
                <p className="text-xs text-neutral-500">Order</p>
                <p className="mt-1 text-sm font-bold">#{payment.order_id.slice(0, 8)}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-neutral-950 p-4 text-white">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
                <div>
                  <p className="text-sm font-bold">Fake gateway sandbox</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/65">Konfirmasi ini hanya mengubah status order demo menjadi paid dan membuat e-ticket.</p>
                </div>
              </div>
            </div>

            {message && (
              <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {message}
              </p>
            )}

            <Button
              onClick={confirmPayment}
              disabled={confirming || paid}
              className="h-12 w-full rounded-2xl bg-neutral-950 text-white hover:bg-neutral-800"
            >
              {paid ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Pembayaran berhasil
                </>
              ) : confirming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Konfirmasi Bayar'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

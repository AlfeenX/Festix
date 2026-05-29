'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { ArrowLeft, CheckCircle2, Clock3, Loader2, RefreshCcw, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, Payment } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useFlash } from '@/components/FlashProvider';

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value));
}

function methodLabel(method?: string) {
  switch (method) {
    case 'FESTIX_WALLET': return 'Festix Wallet';
    case 'MOBILE_BANKING': return 'Mobile Banking';
    case 'QRIS_FAKE': return 'QRIS Sandbox';
    case 'VIRTUAL_CARD': return 'Virtual Card';
    default: return method || 'Fake Payment';
  }
}

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { showFlash } = useFlash();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [qr, setQr] = useState('');
  const [loading, setLoading] = useState(true);

  const paymentUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const publicBase = process.env.NEXT_PUBLIC_PUBLIC_APP_URL || window.location.origin;
    return `${publicBase}/pay/${id}`;
  }, [id]);

  const loadPayment = async () => {
    try {
      const data = await api<Payment>(`/payments/session/${id}`);
      setPayment(data);
      if (data.status === 'SUCCESS') {
        showFlash({
          type: 'success',
          title: 'Pembayaran berhasil',
          description: 'E-ticket sudah dibuat. Anda akan diarahkan ke My Orders.',
        });
        setTimeout(() => router.push(`/orders?success=${data.order_id}`), 900);
      }
    } catch (error) {
      showFlash({
        type: 'error',
        title: 'Gagal memuat pembayaran',
        description: error instanceof Error ? error.message : 'Payment session tidak ditemukan.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayment();
    const timer = setInterval(loadPayment, 3000);
    return () => clearInterval(timer);
  }, [id]);

  useEffect(() => {
    if (!paymentUrl) return;
    QRCode.toDataURL(paymentUrl, {
      width: 320,
      margin: 2,
      color: { dark: '#111827', light: '#ffffff' },
    }).then(setQr).catch(console.error);
  }, [paymentUrl]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card className="rounded-lg p-8 text-center shadow-none">
          <h1 className="text-xl font-bold">Login diperlukan</h1>
          <p className="mt-2 text-sm text-muted-foreground">Masuk untuk melihat status pembayaran.</p>
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

  if (!payment) return null;

  const isPaid = payment.status === 'SUCCESS';

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <Link href={`/checkout/${payment.order_id}`} className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke checkout
      </Link>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <Card className="rounded-lg p-6 text-center shadow-none">
          <Badge variant={isPaid ? 'default' : 'secondary'} className="mx-auto mb-4 rounded-md">
            {isPaid ? 'Paid' : 'Awaiting mobile confirmation'}
          </Badge>
          <div className="mx-auto flex aspect-square max-w-[320px] items-center justify-center rounded-lg border border-border bg-white p-4">
            {qr ? (
              <Image src={qr} alt="QR fake payment" width={300} height={300} className="h-full w-full object-contain" unoptimized />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="mt-4 text-sm font-semibold text-foreground">Scan QR dengan hape</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            QR membuka halaman fake {methodLabel(payment.payment_method)}. Setelah dikonfirmasi dari hape, status order berubah menjadi paid.
          </p>
          <Button variant="outline" asChild className="mt-4 h-9 rounded-lg text-xs">
            <Link href={`/pay/${id}`} target="_blank">
              Buka simulator pembayaran
            </Link>
          </Button>
        </Card>

        <div className="space-y-5">
          <div>
            <Badge variant="secondary" className="mb-3 rounded-md">Payment</Badge>
            <h1 className="text-3xl font-bold tracking-tight">{payment.event_title || 'Event payment'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Selesaikan pembayaran dari simulator mobile.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Metode</p>
              <p className="mt-1 text-base font-bold">{methodLabel(payment.payment_method)}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="mt-1 text-base font-bold">{formatCurrency(payment.amount)}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Status payment</p>
              <p className="mt-1 flex items-center gap-2 text-base font-bold">
                {isPaid ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Clock3 className="h-4 w-4 text-amber-500" />}
                {payment.status}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Order</p>
              <p className="mt-1 text-base font-bold">{payment.order_status}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Smartphone className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-bold">Alur fake payment</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Scan QR, tampilkan layar mirip e-wallet/banking di hape, lalu tekan konfirmasi. Halaman ini polling status otomatis.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={loadPayment} className="gap-2 rounded-lg">
              <RefreshCcw className="h-4 w-4" />
              Refresh status
            </Button>
            {isPaid && (
              <Button onClick={() => router.push(`/orders?success=${payment.order_id}`)} className="rounded-lg">
                Lihat e-ticket
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

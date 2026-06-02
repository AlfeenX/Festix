'use client';

import { useState } from 'react';
import { 
  Search, BookOpen, HelpCircle, MessageSquare, Phone, Mail, 
  ChevronDown, AlertCircle, Ticket, User, ShieldAlert, RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

export default function HelpCenterPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const categories = [
    { id: 'All', label: 'Semua Topik', icon: HelpCircle },
    { id: 'ticketing', label: 'Tiket & Pembelian', icon: Ticket },
    { id: 'account', label: 'Akun & Keamanan', icon: User },
    { id: 'queue', label: 'Sistem Antrean', icon: RefreshCw },
    { id: 'refund', label: 'Refund & Pembatalan', icon: ShieldAlert },
  ];

  const faqs: FAQ[] = [
    {
      category: 'ticketing',
      question: 'Bagaimana cara membeli tiket di Festix?',
      answer: 'Cari event yang Anda inginkan di homepage, pilih kategori kursi pada seat map, lalu klik Checkout. Anda memiliki waktu terbatas untuk menyelesaikan pembayaran melalui kanal pembayaran simulasi yang tersedia.'
    },
    {
      category: 'queue',
      question: 'Apa itu Virtual Waiting Room di Festix?',
      answer: 'Saat terjadi lonjakan lalu lintas (flash sale tiket konser besar), Festix mengarahkan user ke Waiting Room virtual. Antrean diproses secara FIFO (First-In, First-Out) dengan pemantauan posisi antrean Anda secara real-time.'
    },
    {
      category: 'ticketing',
      question: 'Mengapa status pemesanan saya dibatalkan otomatis?',
      answer: 'Setiap pemesanan kursi memiliki batas waktu pembayaran (TTL lock). Jika pembayaran tidak diselesaikan sebelum waktu berakhir, kursi akan otomatis dilepas kembali ke publik dan status order diubah menjadi CANCELLED.'
    },
    {
      category: 'refund',
      question: 'Apakah tiket yang sudah dibeli bisa dibatalkan atau direfund?',
      answer: 'Pembatalan dan refund bergantung pada kebijakan promotor masing-masing event. Anda dapat mengajukan permintaan refund melalui menu Detail Order di dashboard profil Anda jika event tersebut mendukung pengembalian dana.'
    },
    {
      category: 'account',
      question: 'Bagaimana cara mengamankan akun saya dari calo/bot?',
      answer: 'Festix menerapkan kebijakan 1 akun per nomor identitas dan membatasi transaksi maksimal per user. Pastikan Anda mengaktifkan verifikasi email dan tidak membagikan token akses JWT Anda kepada orang lain.'
    },
    {
      category: 'queue',
      question: 'Berapa kapasitas antrean maksimal yang bisa ditangani Festix?',
      answer: 'Sistem backend kami dirancang menggunakan arsitektur microservices terdistribusi dengan Redis locking dan queue broker (RabbitMQ/Kafka) yang mampu menangani lebih dari 10.000+ request per detik secara stabil.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(search.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setFormSubmitted(true);
      setTimeout(() => {
        setFormSubmitted(false);
        setFormData({ name: '', email: '', subject: '', message: '' });
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <Badge variant="secondary" className="rounded-md">Pusat Bantuan</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-sora">Ada yang Bisa Kami Bantu?</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cari panduan penggunaan, solusi kendala transaksi tiket, atau pelajari bagaimana sistem antrean tangguh Festix bekerja untuk mengamankan tiket konser impian Anda.
          </p>
          
          {/* Search Bar */}
          <div className="relative mt-6 max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Cari solusi kendala (misal: antrean, refund, tiket)..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-card border-border rounded-lg text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setOpenFaqIndex(null);
                }}
                className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all gap-2 text-center group cursor-pointer ${
                  isActive 
                    ? 'border-primary bg-primary/5 text-primary shadow-xs' 
                    : 'border-border/80 bg-card hover:bg-muted/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                <span className="text-xs font-semibold">{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          
          {/* Left: FAQ list (Interactive Accordion) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold font-sora">Pertanyaan Populer</h2>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-xl space-y-2 bg-card/50">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium text-foreground">Tidak ditemukan hasil</p>
                <p className="text-xs text-muted-foreground">Cobalah mencari dengan kata kunci lain atau pilih kategori yang berbeda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div 
                      key={index} 
                      className="border border-border/80 bg-card rounded-xl overflow-hidden transition-all shadow-2xs"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-foreground hover:bg-muted/20 gap-4 transition-colors cursor-pointer"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                      </button>
                      
                      <div className={`transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-60 border-t border-border/40' : 'max-h-0 pointer-events-none'
                      } overflow-hidden`}>
                        <div className="p-4 text-xs sm:text-sm text-muted-foreground leading-relaxed bg-muted/10">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Contact Form */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold font-sora">Hubungi Kami</h2>
            </div>

            <Card className="border-border/80 bg-card shadow-sm rounded-xl">
              <CardContent className="p-5 space-y-4">
                {formSubmitted ? (
                  <div className="text-center py-8 space-y-3">
                    <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                      ✓
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Pesan Terkirim!</h3>
                    <p className="text-xs text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                      Terima kasih atas pesan Anda. Tim dukungan Festix akan membalas via email dalam 24 jam.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Punya pertanyaan teknis atau butuh bantuan mendesak? Isi formulir di bawah ini.
                    </p>
                    
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nama Lengkap</label>
                      <Input 
                        type="text" 
                        required
                        placeholder="Masukkan nama Anda"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-9 text-xs bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Alamat Email</label>
                      <Input 
                        type="email" 
                        required
                        placeholder="contoh@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-9 text-xs bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Perihal Kendala</label>
                      <Input 
                        type="text" 
                        placeholder="Perihal tiket, antrean, dsb."
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="h-9 text-xs bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Detail Pesan</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Jelaskan detail pertanyaan atau masalah Anda secara rinci..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full rounded-md border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>

                    <Button type="submit" className="w-full h-9 text-xs font-bold mt-2">
                      Kirim Tiket Bantuan
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Alternatif Kontak */}
            <div className="space-y-3 bg-muted/20 border border-border/60 rounded-xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Kontak Alternatif</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <span>+62 (21) 5098-7654 (Telepon)</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  <span>support@festix.com (Email)</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

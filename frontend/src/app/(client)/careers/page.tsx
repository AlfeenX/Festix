'use client';

import { useState } from 'react';
import { 
  Briefcase, CheckCircle2, DollarSign, Globe, Heart, Send, 
  Sparkles, Star, Users, Zap, Building, GraduationCap, ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Job {
  id: string;
  title: string;
  department: string;
  type: string;
  location: string;
  salary: string;
  description: string;
  requirements: string[];
}

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', cvUrl: '', coverLetter: '' });

  const benefits = [
    { title: 'Remunera Kontras', desc: 'Gaji bersaing, bonus performa tahunan, dan tunjangan opsi saham awal.', icon: DollarSign },
    { title: 'Bekerja Fleksibel', desc: 'Model kerja hybrid / remote dengan tunjangan workstation di rumah Anda.', icon: Globe },
    { title: 'Tunjangan Kesehatan', desc: 'Asuransi kesehatan lengkap termasuk perawatan gigi, mata, dan mental health.', icon: Heart },
    { title: 'Inovasi Skala Besar', desc: 'Kesempatan memecahkan masalah konkurensi ekstrem (10.000+ RPS).', icon: Zap },
  ];

  const jobs: Job[] = [
    {
      id: 'sr-dist-systems',
      title: 'Senior Distributed Systems Engineer',
      department: 'Engineering',
      type: 'Full-time / Hybrid (Jakarta)',
      location: 'Jakarta Selatan',
      salary: 'Rp 25.000.000 - Rp 45.000.000',
      description: 'Kami mencari insinyur sistem terdistribusi senior untuk memimpin desain Waiting Room virtual, Redis locking, dan pipeline transaksi Kafka yang tangguh selama lonjakan pesanan tiket konser.',
      requirements: [
        'Pengalaman 5+ tahun dalam backend engineering menggunakan Node.js, Go, atau Rust.',
        'Keahlian mendalam dalam database PostgreSQL, Redis, dan antrean pesan Kafka/RabbitMQ.',
        'Pemahaman kuat tentang concurrency control, race conditions, dan distributed transactions.'
      ]
    },
    {
      id: 'frontend-engineer',
      title: 'Frontend Web Engineer (Next.js)',
      department: 'Product',
      type: 'Full-time / Remote Friendly',
      location: 'Jakarta / Remote',
      salary: 'Rp 15.000.000 - Rp 28.000.000',
      description: 'Bergabunglah untuk merancang antarmuka pembelian tiket yang responsif, visual seat map interaktif berbasis SVG, dan dashboard operasional admin berestetika tinggi menggunakan Next.js.',
      requirements: [
        'Pengalaman 3+ tahun dengan React.js, Next.js, dan TailwindCSS.',
        'Memahami optimasi performa web (Core Web Vitals) dan SEO best practices.',
        'Terbiasa dengan state management (Zustand/Redux) dan integrasi SSE/WebSockets.'
      ]
    },
    {
      id: 'security-engineer',
      title: 'Security & Anti-Bot Engineer',
      department: 'Security',
      type: 'Full-time / Hybrid (Jakarta)',
      location: 'Jakarta Selatan',
      salary: 'Rp 20.000.000 - Rp 35.000.000',
      description: 'Fokus pada perlindungan sistem checkout Festix dari serangan Bot pembelian massal, pencegahan brute-force, perlindungan API, dan penerapan rate-limiting tingkat lanjut.',
      requirements: [
        'Pengalaman 3+ tahun di bidang keamanan web / cybersecurity.',
        'Keahlian mendalam tentang rate-limiting (Redis token-bucket), WAF (Cloudflare/AWS), dan perlindungan API.',
        'Familiar dengan rekayasa terbalik (reverse engineering) pada request bot dan pencegahan botting otomatis.'
      ]
    },
    {
      id: 'product-manager',
      title: 'Product Manager (Ticketing Scale)',
      department: 'Product',
      type: 'Full-time / Hybrid (Jakarta)',
      location: 'Jakarta Selatan',
      salary: 'Rp 18.000.000 - Rp 32.000.000',
      description: 'Pimpin siklus hidup produk ticketing Festix dari riset promotor, fitur waiting room, payment integrations, hingga pelacakan keberhasilan transaksi pasca penjualan tiket konser.',
      requirements: [
        'Pengalaman 3+ tahun sebagai PM produk SaaS atau ticketing berorientasi skala.',
        'Kemampuan berkomunikasi kuat dengan tim teknis, desainer UI/UX, dan stakeholder promotor.',
        'Berorientasi pada data dalam pengambilan keputusan fitur produk.'
      ]
    }
  ];

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.cvUrl) {
      setFormSubmitted(true);
      setTimeout(() => {
        setFormSubmitted(false);
        setSelectedJob(null);
        setFormData({ name: '', email: '', phone: '', cvUrl: '', coverLetter: '' });
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="secondary" className="rounded-md">Careers & Work With Us</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-sora leading-tight">
            Mari Definisikan Ulang Pengalaman Konser Musik
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
            Bekerja bersama tim insinyur dan desainer berbakat untuk memecahkan masalah skalabilitas distributed systems ekstrem di Indonesia.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="space-y-8">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold font-sora">Kenapa Bergabung Bersama Festix?</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Kami mengutamakan pertumbuhan diri, kompensasi adil, dan tantangan teknologi yang seru.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <Card key={i} className="border-border/80 bg-card/60 p-5 shadow-none rounded-xl hover:bg-muted/10 transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary w-fit mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-2">{b.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Jobs & Application Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Job Openings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold font-sora">Lowongan Aktif</h2>
            </div>

            <div className="space-y-3">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => {
                    setSelectedJob(job);
                    setFormSubmitted(false);
                  }}
                  className={`w-full flex items-start justify-between p-5 border rounded-xl transition-all text-left gap-4 cursor-pointer hover:shadow-2xs ${
                    selectedJob?.id === job.id 
                      ? 'border-primary bg-primary/5 shadow-2xs' 
                      : 'border-border/80 bg-card hover:bg-muted/20'
                  }`}
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">{job.title}</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Building className="h-3 w-3" /> {job.department}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {job.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${selectedJob?.id === job.id ? 'translate-x-1 text-primary' : ''} shrink-0 mt-1`} />
                </button>
              ))}
            </div>
          </div>

          {/* Job Details & Application Form */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold font-sora">Ajukan Lamaran</h2>
            </div>

            {selectedJob ? (
              <Card className="border-border/80 bg-card shadow-sm rounded-xl">
                <CardContent className="p-5 space-y-4">
                  {formSubmitted ? (
                    <div className="text-center py-10 space-y-3">
                      <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                        ✓
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">Lamaran Terkirim!</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Terima kasih sudah melamar sebagai <strong>{selectedJob.title}</strong>. Tim HR kami akan meninjau berkas Anda dan menghubungi dalam 3-5 hari kerja.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Job specifics */}
                      <div className="space-y-1 pb-3 border-b border-border/60">
                        <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/20 bg-primary/5">{selectedJob.department}</Badge>
                        <h3 className="text-sm font-bold text-foreground">{selectedJob.title}</h3>
                        <p className="text-[11px] text-muted-foreground font-medium">{selectedJob.location}</p>
                        <p className="text-xs font-semibold text-foreground mt-1">{selectedJob.salary}</p>
                      </div>

                      {/* Job requirements */}
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kualifikasi Utama:</h4>
                        <ul className="space-y-1">
                          {selectedJob.requirements.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-relaxed">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Application Form */}
                      <form onSubmit={handleApplySubmit} className="space-y-3 pt-3 border-t border-border/60">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nama Lengkap</label>
                          <Input 
                            type="text" 
                            required
                            placeholder="Nama Lengkap Anda"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="h-8 text-xs bg-background border-border"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email</label>
                          <Input 
                            type="email" 
                            required
                            placeholder="nama@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="h-8 text-xs bg-background border-border"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nomor Telepon</label>
                          <Input 
                            type="tel" 
                            placeholder="+62 812..."
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="h-8 text-xs bg-background border-border"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Link CV / Portfolio</label>
                          <Input 
                            type="url" 
                            required
                            placeholder="https://drive.google.com/... atau LinkedIn"
                            value={formData.cvUrl}
                            onChange={(e) => setFormData({ ...formData, cvUrl: e.target.value })}
                            className="h-8 text-xs bg-background border-border"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Surat Lamaran Singkat</label>
                          <textarea
                            rows={3}
                            placeholder="Ceritakan singkat mengapa Anda tertarik bergabung..."
                            value={formData.coverLetter}
                            onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                            className="w-full rounded-md border border-border bg-background p-2 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                          />
                        </div>

                        <Button type="submit" className="w-full h-9 text-xs font-bold mt-2 flex items-center justify-center gap-1.5">
                          <Send className="h-3 w-3" />
                          Ajukan Lamaran Kerja
                        </Button>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-xl space-y-3 bg-card/50">
                <Briefcase className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-xs sm:text-sm font-semibold text-foreground">Pilih Pekerjaan</p>
                <p className="text-[11px] text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                  Pilih salah satu posisi lowongan aktif di sebelah kiri untuk melihat kualifikasi dan melamar.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

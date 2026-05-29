'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Ticket, Search, Zap, Shield, Heart, ArrowRight, Music, Disc, 
  Sparkles, Mic, Calendar, MapPin, SlidersHorizontal, Users, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  const genres = ['All', 'Music Festivals', 'Electronic', 'Rock & Metal', 'Pop & R&B', 'Jazz & Blues'];

  const stats = [
    { label: 'Live Events', value: '150+' },
    { label: 'Tickets Booked', value: '80K+' },
    { label: 'Verified Venues', value: '45' },
    { label: 'Queue Buffer', value: '0.0ms' },
  ];

  const mockFeaturedEvents = [
    {
      id: 'neon-lights-2026',
      title: 'Neon Lights Festival 2026',
      genre: 'Electronic',
      date: 'June 18, 2026',
      venue: 'Marina Bay, Singapore',
      price: 'Rp1.200.000',
      rating: '4.92',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'rock-the-bay',
      title: 'Rock the Bay: Echoes of Sound',
      genre: 'Rock & Metal',
      date: 'July 04, 2026',
      venue: 'Symphony Ampitheatre, San Francisco',
      price: 'Rp850.000',
      rating: '4.85',
      image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'velvet-grooves',
      title: 'Velvet Grooves: Jazz Night out',
      genre: 'Jazz & Blues',
      date: 'August 12, 2026',
      venue: 'The Blue Note Lounge, New York',
      price: 'Rp450.000',
      rating: '4.98',
      image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'tokyo-pop-experience',
      title: 'Tokyo Pop Experience',
      genre: 'Pop & R&B',
      date: 'September 20, 2026',
      venue: 'Shibuya Dome, Tokyo',
      price: 'Rp1.100.000',
      rating: '4.90',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'tomorrow-land-mini',
      title: 'Echoes of Tomorrowland',
      genre: 'Electronic',
      date: 'October 05, 2026',
      venue: 'Boom, Belgium',
      price: 'Rp1.990.000',
      rating: '4.99',
      image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'indie-sunrise',
      title: 'Sunrise Acoustic & Indie Session',
      genre: 'Music Festivals',
      date: 'November 15, 2026',
      venue: 'Ubud Arts Center, Bali',
      price: 'Rp350.000',
      rating: '4.76',
      image: 'https://images.unsplash.com/photo-1484755560693-a4074577af3a?auto=format&fit=crop&w=800&q=80',
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      
      {/* ========================================================================= */}
      {/* 1. AIRBNB HERO REDESIGN (Full Image Bleeding + Floating Center Capsule)   */}
      {/* ========================================================================= */}
      <section className="relative w-full h-screen min-h-[600px] bg-black overflow-hidden flex flex-col justify-between pb-12">
        {/* Full Image Bleeding Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/concert.jpg" 
            alt="Live Concert Experience" 
            className="w-full h-full object-cover object-center select-none"
          />
          {/* Subtle Dark Overlay khas Airbnb agar teks & komponen putih tetap terbaca sempurna */}
          <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />
        </div>

        {/* MIDDLE CONTENT: Big Typography & Floating Search Capsule */}
        <div className="relative z-10 w-full mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center my-auto space-y-8">
          
          {/* Stark Typography */}
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black font-sora tracking-tight text-white leading-none">
              Live the Beat. Secure the Seat.
            </h2>
            <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto font-normal leading-relaxed">
              Temukan dan amankan tiket konser internasional berskala besar dengan jaminan sistem antrean instan yang andal dan transparan.
            </p>
          </div>

          {/* Floating Search Capsule - Airbnb Signature Iconography */}
          <div className="bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl md:rounded-full p-2 text-foreground transition-all">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-0">
              
              {/* Field 1: Destinasi / Event */}
              <div className="flex-1 w-full px-5 py-1 text-left md:border-r border-border/60">
                <label className="block text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Event</label>
                <input 
                  type="text"
                  placeholder="Search concerts, venues, cities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent p-0 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-0 focus:outline-none mt-0.5"
                />
              </div>

              {/* Field 2: Tipe Pengalaman (Statis ala BnB) */}
              <div className="flex-1 hidden md:block px-6 py-1 text-left border-r border-border/60">
                <label className="block text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Location</label>
                <span className="block text-xs sm:text-sm text-muted-foreground truncate font-normal mt-0.5">Jakarta
                  <MapPin className="h-3 w-3 inline text-muted-foreground/60 ml-1" />
                </span>
              </div>

              {/* Tombol Aksi Kapsul Gelap Kontras */}
              <Button
                asChild
                className="w-full md:w-auto h-10 md:h-10 px-6 rounded-xl md:rounded-full bg-foreground text-background hover:bg-foreground/90 font-bold shrink-0 flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Link href={search ? `/events?q=${encodeURIComponent(search)}` : '/events'}>
                  <Search className="h-3.5 w-3.5 stroke-[3]" />
                  <span className="text-xs">Search</span>
                </Link>
              </Button>

            </div>
          </div>

        </div>

        {/* BOTTOM ACCENT: Indikator Geser Kebawah Minimalis */}
        <div className="relative z-10 w-full text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/50 animate-bounce block cursor-pointer">
            Explore Trending Shows ↓
          </span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TRENDING EVENTS SECTION (Airbnb Clean Borderless Card Layout)          */}
      {/* ========================================================================= */}
      <section className="py-14 bg-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold font-sora tracking-tight text-foreground">
                Trending experiences
              </h2>
              <p className="text-xs text-muted-foreground">Highly-rated drops based on seat demand</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full border-border text-xs flex items-center gap-1.5 h-9">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </Button>
          </div>

          {/* Grid Modul Kamar/Destinasi Khas Airbnb */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
            {mockFeaturedEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="group flex flex-col space-y-3 cursor-pointer">
                
                {/* Image Wrapper dengan Aspek Rasio Kotak Sempurna Airbnb */}
                <div className="aspect-square w-full bg-muted overflow-hidden relative rounded-xl">
                  <img 
                    src={event.image} 
                    alt={event.title}
                    className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Tombol Wishlist Favorit (Heart) khas Airbnb */}
                  <button className="absolute top-3 right-3 p-2 rounded-full bg-background/40 backdrop-blur-md border border-white/10 hover:bg-background/80 text-white hover:text-rose-500 transition-all shadow-xs">
                    <Heart className="h-4 w-4 fill-current text-transparent hover:text-rose-500" />
                  </button>
                  <Badge variant="secondary" className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-background text-foreground rounded-md border border-border">
                    {event.genre}
                  </Badge>
                </div>
                
                {/* Teks Metadata Tanpa Kotak Border Card */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-foreground tracking-tight leading-snug line-clamp-1">
                      {event.title}
                    </h3>
                    <span className="flex items-center gap-1 text-xs font-semibold shrink-0">
                      ★ <span>{event.rating}</span>
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs font-normal flex items-center gap-1">
                    <MapPin className="h-3 w-3 inline text-muted-foreground/60" />
                    {event.venue}
                  </p>
                  <p className="text-muted-foreground text-[11px] font-medium">{event.date}</p>
                  
                  <div className="pt-1.5 flex items-baseline gap-1 text-xs">
                    <span className="font-bold text-foreground text-sm">{event.price}</span>
                    <span className="text-muted-foreground font-normal">/ person</span>
                  </div>
                </div>

              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CATEGORY SECTION (Horizontal Icon Strip ala Airbnb Categories)         */}
      {/* ========================================================================= */}
      <section className="py-12 border-b border-border bg-muted/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center md:text-left mb-6">
            <h2 className="text-lg font-bold font-sora tracking-tight text-foreground">Explore Categories</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { title: 'Live Concerts', icon: Music, desc: 'Stadium & arena acoustics' },
              { title: 'Electronic Beats', icon: Disc, desc: 'Raves & night clubs' },
              { title: 'Stand-up Comedy', icon: Mic, desc: 'Live theater & acts' },
              { title: 'Grand Festivals', icon: Ticket, desc: 'Multi-day experience camps' }
            ].map((cat, i) => {
              const Icon = cat.icon;
              return (
                <div key={i} className="flex flex-col items-start p-4 bg-background border border-border/80 rounded-xl hover:shadow-xs transition-all cursor-pointer group">
                  <div className="p-2 bg-muted rounded-lg text-foreground group-hover:text-primary transition-colors mb-3">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-xs text-foreground">{cat.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{cat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold font-sora tracking-tight text-foreground">Their Stories</h1>
          <p className="text-muted-foreground">
            Testimoni pengguna yang telah merasakan pengalaman luar biasa dengan Festix.
          </p>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Alice', story: 'Saya berhasil mendapatkan tiket konser favorit saya dalam hitungan menit! Sistem antrean mereka benar-benar instan dan transparan.' },
            { name: 'Bob', story: 'Festix menyelamatkan saya dari stres saat mencoba membeli tiket untuk festival besar. Antrean virtual mereka sangat efisien!' },
            { name: 'Charlie', story: 'Pengalaman pengguna yang luar biasa! Saya bisa melihat posisi saya dalam antrean secara real-time, jadi saya tahu persis kapan giliran saya.' }
          ].map((testimonial, i) => (
            <Card key={i} className="bg-muted/20 border-border rounded-xl shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground italic">"{testimonial.story}"</p>
                <p className="text-xs text-foreground font-semibold mt-4">- {testimonial.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. NEWSLETTER / CTA SECTION                                              */}
      {/* ========================================================================= */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="border border-border bg-muted/20 rounded-2xl p-8 md:p-12 text-center flex flex-col items-center gap-4">
            <h2 className="text-xl md:text-2xl font-bold font-sora tracking-tight text-foreground">
              Get notified first when tickets drop
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Dapatkan pemberitahuan pertama rilis konser favorit Anda. Kami mengirim info pendaftaran presale eksklusif berdasarkan minat preferensi musik Anda.
            </p>
            
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-2 w-full max-w-md pt-2">
              <Input
                type="email"
                placeholder="Enter your email address"
                required
                className="flex-grow px-4 h-10 bg-background border-border text-xs rounded-full"
              />
              <Button
                type="submit"
                className="bg-foreground text-background font-semibold h-10 px-6 rounded-full text-xs hover:bg-foreground/90 transition-all shrink-0"
              >
                Join Guestlist
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER (Airbnb Expanded & Structured Style)                               */}
      {/* ========================================================================= */}
      <footer className="bg-muted/30 border-t border-border pt-12 pb-8 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Bagian Atas: Grid Navigasi Multi-Kolom */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-border/60 text-xs">
            
            {/* Kolom 1: Support / Bantuan */}
            <div className="space-y-3">
              <h3 className="font-bold text-foreground tracking-wide uppercase text-[10px]">Support</h3>
              <ul className="space-y-2.5 text-muted-foreground font-normal">
                <li><Link href="/help" className="hover:underline">Help Center</Link></li>
                <li><Link href="/queue-info" className="hover:underline">Festix Cover & Refund</Link></li>
                <li><Link href="/anti-scalping" className="hover:underline">Anti-Scalping Policy</Link></li>
                <li><Link href="/safety" className="hover:underline">Cancellation Options</Link></li>
                <li><Link href="/report" className="hover:underline">Report Vulnerability</Link></li>
              </ul>
            </div>

            {/* Kolom 2: Ecosystem / Marketplace */}
            <div className="space-y-3">
              <h3 className="font-bold text-foreground tracking-wide uppercase text-[10px]">Community</h3>
              <ul className="space-y-2.5 text-muted-foreground font-normal">
                <li><Link href="/forums" className="hover:underline">Festix Forums</Link></li>
                <li><Link href="/blog" className="hover:underline">Live Music News</Link></li>
                <li><Link href="/combating-bots" className="hover:underline">Combating Checkout Bots</Link></li>
                <li><Link href="/accessibility" className="hover:underline">Accessibility Features</Link></li>
              </ul>
            </div>

            {/* Kolom 3: Partners & Promoters */}
            <div className="space-y-3">
              <h3 className="font-bold text-foreground tracking-wide uppercase text-[10px]">Hosting / Promoters</h3>
              <ul className="space-y-2.5 text-muted-foreground font-normal">
                <li><Link href="/merchant" className="hover:underline">List an Event</Link></li>
                <li><Link href="/api-docs" className="hover:underline">Ticketing API Access</Link></li>
                <li><Link href="/enterprise" className="hover:underline">High-Traffic Solutions</Link></li>
                <li><Link href="/careers" className="hover:underline">Careers at Festix</Link></li>
              </ul>
            </div>

          </div>

          {/* Bagian Bawah: Legalitas, Lokalisasi & Sosial Media */}
          <div className="pt-6 flex flex-col lg:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground">
            
            {/* Sisi Kiri: Hak Cipta & Link Syarat Ketentuan Ketat */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-2 gap-y-1 text-center lg:text-left order-2 lg:order-1 font-normal">
              <span>© 2026 Festix, Inc.</span>
              <span>·</span>
              <Link href="/privacy" className="hover:underline">Privacy</Link>
              <span>·</span>
              <Link href="/terms" className="hover:underline">Terms</Link>
              <span>·</span>
              <Link href="/sitemap" className="hover:underline">Sitemap</Link>
              <span>·</span>
              <Link href="/uk-hosting" className="hover:underline">UK Gate Passes</Link>
            </div>

            {/* Sisi Kanan: Pilihan Bahasa, Kurs, dan Sosial Media */}
            <div className="flex flex-wrap items-center justify-center gap-6 font-semibold text-foreground order-1 lg:order-2">
              
              {/* Bahasa & Kurs Khas Airbnb */}
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1.5 hover:underline bg-transparent border-0 p-0 cursor-pointer">
                  <Globe className="h-3.5 w-3.5 stroke-[2]" /> 
                  <span className="text-xs">English (US)</span>
                </button>
                <button className="hover:underline bg-transparent border-0 p-0 cursor-pointer text-xs">
                  Rp IDR
                </button>
              </div>

              {/* Tautan Sosial Media Minimalis Flat */}
              <div className="flex items-center gap-3 text-muted-foreground">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>

            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}

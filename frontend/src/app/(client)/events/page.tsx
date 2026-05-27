'use client';

import { useEffect, useState } from 'react';
import { api, Event } from '@/lib/api';
import { EventCard } from '@/components/EventCard';
import { Search, CalendarRange, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api<Event[]>(`/events${search ? `?q=${encodeURIComponent(search)}` : ''}`)
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-12 py-8 space-y-8 min-h-screen bg-background antialiased">
      
      {/* Airbnb-style Floating Search & Header Wrapper */}
      <div className="flex flex-col gap-6 pb-6 border-b border-muted/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CalendarRange className="h-7 w-7 text-rose-500" />
              Temukan Pengalaman Live
            </h1>
            <p className="text-sm text-muted-foreground">
              Ikuti konser musik, stand-up comedy, dan festival budaya terdekat.
            </p>
          </div>
          
          {/* Airbnb-style Search Bar & Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-full border border-border bg-card overflow-hidden">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-rose-500 rounded-full text-white">
                <Search className="h-4 w-4" />
              </div>
              <Input
                type="text"
                className="w-full pl-14 pr-4 h-12 rounded-full border-none bg-transparent text-sm placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Cari event, kota, atau tempat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            {/* Filter Button (Opsional untuk estetika Airbnb) */}
            <Button variant="outline" className="h-12 px-4 rounded-full border-border flex items-center gap-2 text-sm font-medium hover:bg-muted">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        /* Airbnb Skeleton Loader (Lebih baik daripada Spinner) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3 animate-pulse">
              <div className="aspect-[4/3] w-full bg-muted rounded-xl" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        /* Empty State yang clean */
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto space-y-2">
          <p className="text-xl font-semibold text-foreground">Tidak ada hasil ditemukan</p>
          <p className="text-sm text-muted-foreground">
            Coba hapus beberapa filter atau ubah kata kunci pencarian Anda.
          </p>
        </div>
      ) : (
        /* Airbnb Grid Layout: Menggunakan 4 kolom di layar besar untuk memaksimalkan eksplorasi visual */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

    </div>
  );
}
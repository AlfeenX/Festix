'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, Event } from '@/lib/api';
import { EventCard } from '@/components/EventCard';
import { Search, CalendarRange, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function getEventStatus(startsAt: string, endsAt: string) {
  const now = Date.now();
  const starts = new Date(startsAt).getTime();
  const ends = new Date(endsAt).getTime();

  if (starts > now) return 'Upcoming';
  if (ends < now) return 'Past';
  return 'Ongoing';
}

export function EventsContent() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Upcoming' | 'Ongoing' | 'Past'>('All');
  const [selectedCity, setSelectedCity] = useState('All');

  // Initialize search from URL params
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearch(q);
    }
  }, [searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    api<Event[]>('/events?refresh=1')
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cities = useMemo(() => {
    return Array.from(
      new Set(events.map((event) => event.venue_city).filter(Boolean) as string[])
    ).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const filteredEvents = useMemo(() => {
    const keyword = debouncedSearch.toLowerCase();
    return events.filter((event) => {
      const searchMatch =
        !keyword ||
        [event.title, event.description, event.venue_name, event.venue_city]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(keyword));

      const status = getEventStatus(event.starts_at, event.ends_at);
      const statusMatch = selectedStatus === 'All' || status === selectedStatus;
      const cityMatch = selectedCity === 'All' || event.venue_city === selectedCity;

      return searchMatch && statusMatch && cityMatch;
    });
  }, [events, debouncedSearch, selectedStatus, selectedCity]);

  return (
    <div className="mx-auto max-w-350 px-6 md:px-10 lg:px-12 py-8 space-y-8 min-h-screen bg-background antialiased">
      
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
          <div className="flex flex-col gap-3 w-full md:w-auto md:flex-row md:items-center md:gap-3">
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
                className="h-12 rounded-full border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary"
              >
                <option value="All">Semua status</option>
                <option value="Upcoming">Akan datang</option>
                <option value="Ongoing">Sedang berjalan</option>
                <option value="Past">Selesai</option>
              </select>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="h-12 rounded-full border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary"
              >
                <option value="All">Semua kota</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        /* Airbnb Skeleton Loader (Lebih baik daripada Spinner) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3 animate-pulse">
              <div className="aspect-4/3 w-full bg-muted rounded-xl" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
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
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

    </div>
  );
}

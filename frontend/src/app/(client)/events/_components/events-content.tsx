'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { api, Event, Venue } from '@/lib/api';
import { CalendarRange, Search } from 'lucide-react';
import { EventCard } from '@/components/EventCard';
import { Input } from '@/components/ui/input';

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
  const [cities, setCities] = useState<string[]>([]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Initialize search from URL params
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearch(q);
    }
  }, [searchParams]);

  // Load all cities from venues to populate the filter dropdown
  useEffect(() => {
    api<Venue[]>('/venues')
      .then((venuesList) => {
        const uniqueCities = Array.from(
          new Set(venuesList.map((v) => v.city).filter(Boolean) as string[])
        ).sort((a, b) => a.localeCompare(b));
        setCities(uniqueCities);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedStatus, selectedCity]);

  // Fetch paginated events from server
  useEffect(() => {
    setLoading(true);
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(page));
    queryParams.append('limit', '10');
    queryParams.append('refresh', '1');

    if (debouncedSearch) {
      queryParams.append('q', debouncedSearch);
    }
    if (selectedStatus !== 'All') {
      queryParams.append('status', selectedStatus);
    }
    if (selectedCity !== 'All') {
      queryParams.append('city', selectedCity);
    }

    api<{ data: Event[]; total: number; page: number; limit: number; totalPages: number }>(
      `/events?${queryParams.toString()}`
    )
      .then((res) => {
        setEvents(res.data || []);
        setTotalPages(res.totalPages || 1);
      })
      .catch((error) => {
        console.error('Error fetching events:', error);
        setEvents([]);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, selectedStatus, selectedCity]);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      if (page <= 2) {
        end = 4;
      } else if (page >= totalPages - 1) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('ellipsis');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }

    return pages.map((p, idx) => {
      if (p === 'ellipsis') {
        return (
          <PaginationItem key={`ellipsis-${idx}`}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      return (
        <PaginationItem key={p}>
          <PaginationLink
            href="#"
            isActive={p === page}
            onClick={(e) => {
              e.preventDefault();
              setPage(p as number);
            }}
          >
            {p}
          </PaginationLink>
        </PaginationItem>
      );
    });
  };

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

      {/* Pagination UI */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center pt-8 border-t border-muted/60">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage(page - 1);
                  }}
                  className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {renderPageNumbers()}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) setPage(page + 1);
                  }}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

    </div>
  );
}

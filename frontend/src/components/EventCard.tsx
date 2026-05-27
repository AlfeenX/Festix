'use client';

import Link from 'next/link';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import { Event } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const date = new Date(event.starts_at);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const isSoldOut = event.available_seats !== undefined && event.available_seats <= 0;
  const isSellingFast = event.available_seats !== undefined && event.available_seats > 0 && event.available_seats < 50;

  // Generate a premium dynamic color gradient based on event title
  const getGradient = (text: string) => {
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      'from-primary to-primary/60',
      'from-rose-500 to-orange-500',
      'from-violet-600 to-indigo-600',
      'from-emerald-500 to-teal-500',
      'from-blue-600 to-indigo-500',
    ];
    return gradients[hash % gradients.length];
  };

  return (
    <Link href={`/events/${event.id}`} className="group block h-full">
      <Card className="hover:border-primary/20 shadow-md hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 h-full flex flex-col relative py-0 gap-0">
        
        {/* Banner area */}
        <div className={`h-48 bg-gradient-to-tr ${getGradient(event.title)} flex items-center justify-center relative overflow-hidden rounded-t-xl`}>
          <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />
          <Ticket className="h-16 w-16 text-white/25 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" />
          
          {/* Top badges */}
          <div className="absolute top-4 right-4 flex gap-2">
            {isSoldOut ? (
              <Badge variant="destructive" className="h-6 font-bold">
                Sold Out
              </Badge>
            ) : isSellingFast ? (
              <Badge className="h-6 font-bold bg-amber-500 text-white hover:bg-amber-500 animate-pulse border-0">
                Selling Fast
              </Badge>
            ) : (
              <Badge variant="outline" className="h-6 font-bold bg-background/95 backdrop-blur-xs text-primary border-primary/20">
                Tickets Live
              </Badge>
            )}
          </div>
        </div>

        {/* Info area */}
        <CardContent className="p-6 flex flex-col flex-grow gap-4">
          <div className="flex-grow">
            <h3 className="text-xl font-bold font-sora text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors duration-200">
              {event.title}
            </h3>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {event.description || 'No description provided for this amazing event.'}
            </p>
          </div>

          <div className="space-y-2 mt-auto text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary/70 shrink-0" />
              <span>{formattedDate}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary/70 shrink-0" />
              <span className="line-clamp-1">
                {event.venue_name || 'TBA'}{event.venue_city ? `, ${event.venue_city}` : ''}
              </span>
            </div>
          </div>
          
          {event.available_seats !== undefined && event.available_seats > 0 && (
            <div className="border-t border-border pt-4 flex justify-between items-center text-xs mt-auto">
              <span className="text-muted-foreground font-medium">Availability</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {event.available_seats} seats left
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

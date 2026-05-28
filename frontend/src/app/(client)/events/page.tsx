'use client';

import { Suspense } from 'react';
import { EventsContent } from './_components/events-content';

export default function EventsPage() {
  return (
    <Suspense fallback={<EventsLoadingFallback />}>
      <EventsContent />
    </Suspense>
  );
}

function EventsLoadingFallback() {
  return (
    <div className="mx-auto max-w-350 px-6 md:px-10 lg:px-12 py-8 space-y-8 min-h-screen bg-background antialiased">
      <div className="flex flex-col gap-6 pb-6 border-b border-muted/60">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-3 animate-pulse">
            <div className="aspect-4/3 w-full bg-muted rounded-xl" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
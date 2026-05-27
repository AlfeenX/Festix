'use client';

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FlashType = 'success' | 'error' | 'info';

type Flash = {
  id: number;
  type: FlashType;
  title: string;
  description?: string;
};

type FlashInput = Omit<Flash, 'id'>;

type FlashContextValue = {
  showFlash: (flash: FlashInput) => void;
};

const FlashContext = createContext<FlashContextValue | null>(null);

const flashStyles: Record<FlashType, string> = {
  success: 'border-emerald-500/30 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-50',
  error: 'border-destructive/30 bg-red-50 text-red-950 dark:bg-red-950/40 dark:text-red-50',
  info: 'border-primary/25 bg-primary/10 text-foreground',
};

const flashIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function FlashProvider({ children }: { children: ReactNode }) {
  const [flashes, setFlashes] = useState<Flash[]>([]);

  const dismissFlash = useCallback((id: number) => {
    setFlashes((current) => current.filter((flash) => flash.id !== id));
  }, []);

  const showFlash = useCallback((flash: FlashInput) => {
    const id = Date.now() + Math.random();
    setFlashes((current) => [...current.slice(-2), { ...flash, id }]);
    window.setTimeout(() => dismissFlash(id), 4500);
  }, [dismissFlash]);

  const value = useMemo(() => ({ showFlash }), [showFlash]);

  return (
    <FlashContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:right-6">
        {flashes.map((flash) => {
          const Icon = flashIcons[flash.type];
          return (
            <div
              key={flash.id}
              role="status"
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 text-sm shadow-lg shadow-black/5 backdrop-blur',
                flashStyles[flash.type]
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-5">{flash.title}</p>
                {flash.description && <p className="mt-0.5 text-xs opacity-80">{flash.description}</p>}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-6 w-6 shrink-0 rounded-md hover:bg-black/5"
                onClick={() => dismissFlash(flash.id)}
                aria-label="Tutup pesan"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
      </div>
    </FlashContext.Provider>
  );
}

export function useFlash() {
  const context = useContext(FlashContext);
  if (!context) throw new Error('useFlash must be used within FlashProvider');
  return context;
}

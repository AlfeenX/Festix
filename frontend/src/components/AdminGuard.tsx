'use client';

import { useEffect, ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        router.push('/');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, loading, router]);

  if (loading || (!isAuthorized && user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'))) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground font-sans">Checking authorization...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-md my-16 px-4">
        <Card className="p-8 shadow-lg border-destructive/20 text-center flex flex-col items-center gap-4 py-8">
          <div className="p-3 bg-destructive/10 rounded-full text-destructive">
            <ShieldAlert className="h-10 w-10" />
          </div>
          
          <Alert variant="destructive" className="border-0 bg-transparent p-0 text-center flex flex-col items-center gap-2">
            <AlertTitle className="text-2xl font-bold font-sora text-destructive tracking-tight">
              Access Denied
            </AlertTitle>
            <AlertDescription className="text-sm font-sans mt-2">
              You do not have the required permissions to view this admin panel. Backing out...
            </AlertDescription>
          </Alert>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

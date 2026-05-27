'use client';

import { ShieldCheck, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

function getInitials(name?: string) {
  return (name || 'Festix Admin')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminProfilePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Badge variant="secondary" className="mb-3 rounded-md">Profile</Badge>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          <UserCircle className="h-7 w-7 text-primary" />
          Admin Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Informasi akun yang sedang digunakan untuk mengelola dashboard Festix.</p>
      </div>

      <Card className="rounded-lg border-border/80 bg-card p-5 shadow-none">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20 rounded-xl border border-border">
            <AvatarFallback className="rounded-xl bg-muted text-xl font-bold">
              {getInitials(user?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold text-foreground">{user?.full_name || 'Festix Admin'}</h2>
            <p className="truncate text-sm text-muted-foreground">{user?.email || 'admin@festix.local'}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className="rounded-md">{user?.role || 'ADMIN'}</Badge>
              <Badge variant="outline" className="rounded-md">
                <ShieldCheck className="h-3 w-3" />
                Authorized
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

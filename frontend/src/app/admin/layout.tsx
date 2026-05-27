'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  BellRing,
  ChevronDown,
  LogOut,
  Menu,
  PanelLeft,
  PanelLeftClose,
  Search,
  Ticket,
  UserCircle,
} from 'lucide-react';
import { AdminGuard } from '@/components/AdminGuard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api, Event, Order, User, Venue } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getAdminNavGroups, type AdminNavItem } from './_config/navigation';

type MenuBadges = Partial<Record<AdminNavItem['id'], number>>;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [badges, setBadges] = useState<MenuBadges>({});
  const [viewedNotificationSignature, setViewedNotificationSignature] = useState('');

  const navGroups = useMemo(() => getAdminNavGroups(user?.role), [user?.role]);
  const notifications = useMemo(() => {
    return navGroups
      .flatMap((group) => group.items)
      .map((item) => ({
        ...item,
        count: badges[item.id] || 0,
      }))
      .filter((item) => item.count > 0 && ['events', 'orders', 'users'].includes(item.id));
  }, [badges, navGroups]);
  const notificationSignature = notifications.map((item) => `${item.id}:${item.count}`).join('|');
  const hasUnreadNotifications = notifications.length > 0 && notificationSignature !== viewedNotificationSignature;
  const NotificationIcon = hasUnreadNotifications ? BellRing : Bell;

  useEffect(() => {
    if (!user) return;

    Promise.allSettled([
      api<Event[]>('/events?refresh=1'),
      api<Venue[]>('/venues'),
      api<Order[]>('/admin/orders?refresh=1'),
      user.role === 'SUPER_ADMIN' ? api<User[]>('/admin/users?refresh=1') : Promise.resolve([]),
    ]).then(([eventsResult, venuesResult, ordersResult, usersResult]) => {
      const nextBadges: MenuBadges = {};
      if (eventsResult.status === 'fulfilled') nextBadges.events = eventsResult.value.length;
      if (venuesResult.status === 'fulfilled') nextBadges.venues = venuesResult.value.length;
      if (ordersResult.status === 'fulfilled') nextBadges.orders = ordersResult.value.length;
      if (usersResult.status === 'fulfilled') nextBadges.users = usersResult.value.length;
      setBadges(nextBadges);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setViewedNotificationSignature(localStorage.getItem(`festix-admin-notifications:${user.id}`) || '');
  }, [user]);

  const checkActive = (item: AdminNavItem) => {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const getInitials = (name?: string) =>
    (name || 'Festix Admin')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const markNotificationsViewed = (open: boolean) => {
    if (!open || !user || !notificationSignature) return;
    localStorage.setItem(`festix-admin-notifications:${user.id}`, notificationSignature);
    setViewedNotificationSignature(notificationSignature);
  };

  const renderNavItem = (item: AdminNavItem, mobile = false) => {
    const Icon = item.icon;
    const isActive = checkActive(item);
    const badge = badges[item.id];

    const content = (
      <Link
        key={item.id}
        href={item.href}
        onClick={() => mobile && setIsMobileOpen(false)}
        className={`group flex items-center rounded-lg text-[13px] font-medium transition-colors ${
          isCollapsed && !mobile ? 'mx-auto h-10 w-10 justify-center px-0' : 'gap-3 px-3 py-2'
        } ${
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {(!isCollapsed || mobile) && (
          <>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {typeof badge === 'number' && (
              <Badge variant="secondary" className="h-5 rounded-md px-1.5 text-[10px]">
                {badge}
              </Badge>
            )}
          </>
        )}
      </Link>
    );

    if (isCollapsed && !mobile) {
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            <div className="space-y-0.5">
              <p>{item.label}</p>
              <p className="max-w-52 text-[11px] text-muted-foreground">{item.description}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  const sidebarContent = (mobile = false) => (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-border/70 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Ticket className="h-4 w-4" />
        </div>
        {(!isCollapsed || mobile) && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">Festix Admin</p>
            <p className="truncate text-[11px] text-muted-foreground">Ticketing operations</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {(!isCollapsed || mobile) && (
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground/70">
                {group.label}
              </div>
            )}
            {group.items.map((item) => renderNavItem(item, mobile))}
          </div>
        ))}
      </nav>

      <div className="border-t border-border/70 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`flex w-full items-center rounded-lg text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                isCollapsed && !mobile ? 'justify-center p-1' : 'gap-2 p-2'
              }`}
            >
              <Avatar className="h-9 w-9 rounded-lg border border-border">
                <AvatarFallback className="rounded-lg bg-muted text-xs font-bold">
                  {getInitials(user?.full_name)}
                </AvatarFallback>
              </Avatar>
              {(!isCollapsed || mobile) && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">{user?.full_name || 'Festix Admin'}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{user?.email || 'admin@festix.local'}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isCollapsed && !mobile ? 'right' : 'top'}
            align={isCollapsed && !mobile ? 'center' : 'start'}
            className="w-64"
          >
            <DropdownMenuLabel>
              <span className="block truncate text-xs font-semibold text-foreground">{user?.full_name || 'Festix Admin'}</span>
              <span className="block truncate text-[11px] font-normal text-muted-foreground">{user?.email || 'admin@festix.local'}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/profile" onClick={() => mobile && setIsMobileOpen(false)}>
                <UserCircle className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <AdminGuard>
      <TooltipProvider delayDuration={100}>
        <div className="flex min-h-screen bg-background text-foreground">
          <aside
            className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/70 bg-card transition-all duration-200 md:flex ${
              isCollapsed ? 'w-16' : 'w-72'
            }`}
          >
            {sidebarContent()}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed((value) => !value)}
                  className="hidden h-9 w-9 rounded-lg md:inline-flex"
                >
                  {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>

                <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg md:hidden">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="flex w-80 flex-col p-0">
                    <SheetTitle className="sr-only">Admin sidebar navigation</SheetTitle>
                    {sidebarContent(true)}
                  </SheetContent>
                </Sheet>

                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <div className="flex h-9 w-72 items-center justify-between rounded-lg border border-border bg-card pl-9 pr-3 text-xs text-muted-foreground">
                    <span>Cari event, order, atau seating</span>
                    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">/</kbd>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <DropdownMenu onOpenChange={markNotificationsViewed}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg" aria-label="Notifikasi">
                      <NotificationIcon className="h-4 w-4" />
                      {hasUnreadNotifications && (
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-2">
                    <DropdownMenuLabel className="px-2 py-1.5">
                      <span className="block text-xs font-semibold">Notifikasi</span>
                      <span className="block text-[11px] font-normal text-muted-foreground">
                        {notifications.length ? 'Ringkasan data operasional terbaru.' : 'Belum ada notifikasi baru.'}
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length ? (
                      notifications.map((notification) => {
                        const Icon = notification.icon;
                        return (
                          <DropdownMenuItem key={notification.id} asChild className="cursor-pointer p-0">
                            <Link href={notification.href} className="flex w-full items-start gap-3 rounded-md px-2 py-2">
                              <span className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
                                <Icon className="h-3.5 w-3.5" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-semibold">{notification.label}</span>
                                <span className="block text-[11px] text-muted-foreground">{notification.count} data tersedia untuk ditinjau.</span>
                              </span>
                              <Badge variant="secondary" className="h-5 rounded-md px-1.5 text-[10px]">
                                {notification.count}
                              </Badge>
                            </Link>
                          </DropdownMenuItem>
                        );
                      })
                    ) : (
                      <div className="px-2 py-4 text-center text-xs text-muted-foreground">Tidak ada item yang perlu ditinjau.</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <ThemeToggle />
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" asChild>
                  <Link href="/events">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </header>

            <main className="w-full flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
          </div>
        </div>
      </TooltipProvider>
    </AdminGuard>
  );
}

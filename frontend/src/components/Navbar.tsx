'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { 
  Ticket, Calendar, LayoutDashboard, LogOut, Menu, Search, 
  HelpCircle, Briefcase, User, Smartphone 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/SearchInput';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/events?q=${encodeURIComponent(query.trim())}`);
      setSearchQuery('');
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  // Navigasi menu sesuai request
  const navLinks = [
    { name: 'Find Events', href: '/events', icon: Calendar },
    { name: 'Get Help', href: '/help', icon: HelpCircle },
    { name: 'Work With Us', href: '/careers', icon: Briefcase },
  ];

  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* 1. BRAND LOGO */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="bg-vibe-gradient text-white p-2 rounded-xl shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                <Ticket className="h-5 w-5" />
              </span>
              <span className="font-sora text-2xl font-extrabold tracking-tight text-vibe-gradient hidden sm:block">
                Festix
              </span>
            </Link>
          </div>

          {/* 2. SEARCH BAR (Tengah) */}
          <div className="flex-1 max-w-md hidden sm:block relative">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search events, artists, venues..."
              inputClassName="w-full bg-muted/50 border-border focus-visible:ring-1 focus-visible:ring-primary rounded-full"
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          {/* 3. DESKTOP NAV LINKS */}
          <div className="hidden lg:flex items-center gap-5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-semibold flex items-center gap-1.5 transition-colors duration-200 ${
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* 4. UTILITY ACTIONS DESKTOP */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            
            {user ? (
              /* KONDISI: USER LOGIN */
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <Button variant="ghost" size="icon" asChild title="My Orders" className="rounded-full text-muted-foreground hover:text-foreground">
                  <Link href="/orders">
                    <Ticket className="h-5 w-5" />
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-full border border-border h-9 w-9 p-0 overflow-hidden outline-none">
                      <Avatar className="h-full w-full">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {user.full_name ? getInitials(user.full_name) : <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="end" className="w-56 mt-2">
                    <DropdownMenuLabel className="font-sora flex flex-col">
                      <span className="font-bold text-sm truncate">{user.full_name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{user.role}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="flex items-center gap-2 cursor-pointer">
                        <Ticket className="h-4 w-4" />
                        My Tickets
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      onClick={logout}
                      className="flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              /* KONDISI: USER BELUM LOGIN */
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-medium hidden lg:flex items-center gap-1.5" asChild>
                  <Link href="/download">
                    <Smartphone className="h-4 w-4" /> Get App
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="font-semibold" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" className="bg-vibe-gradient hover:opacity-95 text-white rounded-full font-bold shadow-sm px-4" asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* 5. MOBILE VIEW CONTROL */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            
            {user && (
              <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground" asChild>
                <Link href="/orders">
                  <Ticket className="h-5 w-5" />
                </Link>
              </Button>
            )}

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-85 p-6 flex flex-col gap-6">
                
                <SheetHeader className="text-left p-0">
                  <SheetTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-vibe-gradient text-white p-2 rounded-xl">
                        <Ticket className="h-5 w-5" />
                      </span>
                      <span className="font-sora text-2xl font-extrabold tracking-tight bg-vibe-gradient bg-clip-text text-transparent">
                        Festix
                      </span>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                {/* Mobile Search */}
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search events..."
                  className="w-full"
                  inputClassName="w-full bg-muted/60 rounded-xl border-0"
                  onKeyDown={handleSearchKeyDown}
                />
                
                {/* Mobile Links */}
                <div className="flex flex-col gap-2 flex-1">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded-xl font-semibold text-sm transition-all ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {link.name}
                      </Link>
                    );
                  })}

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-xl font-semibold text-sm transition-all ${
                        pathname.startsWith('/admin')
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Admin Panel
                    </Link>
                  )}
                </div>

                {/* Mobile Footer Auth */}
                {user ? (
                  <div className="border-t border-border pt-4 space-y-4">
                    <div className="flex items-center gap-3 px-2">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold text-foreground text-sm">{user.full_name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{user.role}</div>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setIsOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-sm"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 border-t border-border pt-4">
                    <Button variant="outline" className="rounded-xl w-full" asChild onClick={() => setIsOpen(false)}>
                      <Link href="/download" className="flex items-center justify-center gap-2">
                        <Smartphone className="h-4 w-4" /> Get App
                      </Link>
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" className="rounded-xl" asChild onClick={() => setIsOpen(false)}>
                        <Link href="/login">Login</Link>
                      </Button>
                      <Button className="bg-vibe-gradient text-white font-bold rounded-xl border-0 shadow-sm" asChild onClick={() => setIsOpen(false)}>
                        <Link href="/register">Sign Up</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </nav>
  );
}
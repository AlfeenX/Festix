import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  LineChart,
  Armchair,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type AdminNavItem = {
  id: 'overview' | 'events' | 'orders' | 'seating' | 'reports' | 'users';
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  description: string;
  roles?: string[];
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: 'Operasional',
    items: [
      {
        id: 'overview',
        label: 'Dashboard',
        href: '/admin',
        icon: BarChart3,
        exact: true,
        description: 'Ringkasan event, order, dan okupansi kursi',
      },
      {
        id: 'events',
        label: 'Event',
        href: '/admin/events',
        icon: CalendarDays,
        description: 'Kelola jadwal, venue, dan publikasi event',
      },
      {
        id: 'orders',
        label: 'Order',
        href: '/admin/orders',
        icon: ClipboardList,
        description: 'Pantau transaksi dan status pembayaran tiket',
      },
      {
        id: 'seating',
        label: 'Seating',
        href: '/admin/seating',
        icon: Armchair,
        description: 'Generate dan audit konfigurasi kursi',
      },
      {
        id: 'users',
        label: 'Users',
        href: '/admin/users',
        icon: Users,
        description: 'Kelola akun pengguna dan role akses',
        roles: ['SUPER_ADMIN'],
      },
    ],
  },
  {
    label: 'Insight',
    items: [
      {
        id: 'reports',
        label: 'Reports',
        href: '/admin/reports',
        icon: LineChart,
        description: 'Analitik revenue dan performa event',
      },
    ],
  },
];

export function getAdminNavGroups(role?: string | null) {
  return ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || (role && item.roles.includes(role))),
  })).filter((group) => group.items.length > 0);
}

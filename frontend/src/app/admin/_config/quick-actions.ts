import { Gauge, LineChart, Server, type LucideIcon } from 'lucide-react';

export type AdminQuickAction = {
  id: 'grafana' | 'prometheus' | 'rabbitmq';
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export const ADMIN_QUICK_ACTIONS: AdminQuickAction[] = [
  {
    id: 'grafana',
    label: 'Grafana',
    description: 'Dashboard monitoring & alerting',
    href: process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://localhost:3030',
    icon: LineChart,
  },
  {
    id: 'prometheus',
    label: 'Prometheus',
    description: 'Metrics explorer & targets',
    href: process.env.NEXT_PUBLIC_PROMETHEUS_URL || 'http://localhost:9090',
    icon: Gauge,
  },
  {
    id: 'rabbitmq',
    label: 'RabbitMQ',
    description: 'Queue management console',
    href: process.env.NEXT_PUBLIC_RABBITMQ_URL || 'http://localhost:15672',
    icon: Server,
  },
];

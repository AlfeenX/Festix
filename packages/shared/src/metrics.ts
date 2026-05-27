import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export function createMetrics(serviceName: string): {
  register: Registry;
  httpRequestsTotal: Counter;
  httpRequestDuration: Histogram;
  activeConnections: Gauge;
} {
  const register = new Registry();
  register.setDefaultLabels({ service: serviceName });
  collectDefaultMetrics({ register });

  const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [register],
  });

  const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration',
    labelNames: ['method', 'route'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register],
  });

  const activeConnections = new Gauge({
    name: 'active_connections',
    help: 'Active connections',
    registers: [register],
  });

  return { register, httpRequestsTotal, httpRequestDuration, activeConnections };
}

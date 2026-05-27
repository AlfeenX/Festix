import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createMetrics } from '@festix/shared';

export interface ServiceOptions {
  name: string;
  port: number;
  // API gateway often only proxies requests; consuming the request body here can
  // prevent http-proxy-middleware from forwarding POST bodies correctly.
  enableJsonBodyParsing?: boolean;
}

export function createServiceApp(options: ServiceOptions): {
  app: Express;
  metrics: ReturnType<typeof createMetrics>;
  start: () => void;
} {
  const app = express();
  const metrics = createMetrics(options.name);

  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3100', credentials: true }));
  app.use(morgan('combined'));
  if (options.enableJsonBodyParsing !== false) {
    app.use(express.json({ limit: '10mb' }));
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.path;
      metrics.httpRequestsTotal.inc({ method: req.method, route, status: String(res.statusCode) });
      metrics.httpRequestDuration.observe({ method: req.method, route }, duration);
    });
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: options.name, timestamp: new Date().toISOString() });
  });

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', metrics.register.contentType);
    res.end(await metrics.register.metrics());
  });

  const start = () => {
    app.listen(options.port, () => {
      console.log(`[${options.name}] listening on port ${options.port}`);
    });
  };

  return { app, metrics, start };
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
}

import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import { createServiceApp, errorHandler } from '@festix/service-common';
import { getRedis, RedisKeys } from '@festix/shared';
import type { JwtPayload, UserRole } from '@festix/shared';

const PORT = parseInt(process.env.GATEWAY_PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'festix-dev-secret-change-in-prod';

const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  event: process.env.EVENT_SERVICE_URL || 'http://localhost:3002',
  seat: process.env.SEAT_SERVICE_URL || 'http://localhost:3003',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
};

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
const RATE_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '60', 10);

const { app, start } = createServiceApp({ name: 'api-gateway', port: PORT, enableJsonBodyParsing: true });

async function rateLimiter(req: Request, res: Response, next: NextFunction) {
  try {
    const redis = getRedis();
    const ip = req.ip || 'unknown';
    const key = RedisKeys.rateLimit(ip, req.path);
    const current = await redis.incr(key);
    if (current === 1) await redis.expire(key, RATE_WINDOW);
    if (current > RATE_LIMIT) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }
    next();
  } catch {
    next();
  }
}

function authMiddleware(roles?: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.headers['x-user-id'] = payload.sub;
      req.headers['x-user-role'] = payload.role;
      req.headers['x-user-email'] = payload.email;
      if (roles && !roles.includes(payload.role) && payload.role !== 'SUPER_ADMIN') {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

app.use(rateLimiter);

function proxy(target: string, pathRewrite?: (path: string, req: Request) => string) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: pathRewrite
      ? (path, req) => pathRewrite(path, req as Request)
      : undefined,
    on: {
      proxyReq: (proxyReq, req) => {
        const request = req as Request & { body?: unknown };
        if (request.headers['x-user-id']) proxyReq.setHeader('x-user-id', request.headers['x-user-id'] as string);
        if (request.headers['x-user-role']) proxyReq.setHeader('x-user-role', request.headers['x-user-role'] as string);

        if (request.body && typeof request.body === 'object' && Object.keys(request.body).length > 0) {
          const bodyData = JSON.stringify(request.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData).toString());
          proxyReq.write(bodyData);
        }
      },
    },
  });
}

app.use('/api/auth', proxy(SERVICES.auth, (_path, req) => req.originalUrl.replace(/^\/api\/auth/, '')));

// Seat routes (some public, some protected)
app.get('/api/events/:eventId/seats', proxy(SERVICES.seat, (_path, req) => req.originalUrl.replace(/^\/api/, '')));
app.post('/api/waiting-room/:eventId/join', authMiddleware(), proxy(SERVICES.seat, (_path, req) => req.originalUrl.replace(/^\/api/, '')));
app.use('/api/seats', authMiddleware(['USER']), proxy(SERVICES.seat, (_path, req) => req.originalUrl.replace(/^\/api/, '')));

// Public events
app.use('/api/events', proxy(SERVICES.event, (_path, req) => req.originalUrl.replace(/^\/api\/events/, '/events')));
app.use('/api/venues', proxy(SERVICES.event, (_path, req) => req.originalUrl.replace(/^\/api\/venues/, '/venues')));

// Protected user routes
app.use('/api/checkout', authMiddleware(['USER']), proxy(SERVICES.order, (_path, req) => req.originalUrl.replace(/^\/api\/checkout/, '/checkout')));
app.use('/api/orders', authMiddleware(), proxy(SERVICES.order, (_path, req) => req.originalUrl.replace(/^\/api\/orders/, '/orders')));
app.post('/api/payments/pay', authMiddleware(['USER']), proxy(SERVICES.payment, (_path, req) => req.originalUrl.replace(/^\/api\/payments/, '')));
app.use('/api/payments', authMiddleware(['USER']), proxy(SERVICES.payment, (_path, req) => req.originalUrl.replace(/^\/api\/payments/, '')));
app.use('/api/notifications', authMiddleware(), proxy(SERVICES.notification, (_path, req) => req.originalUrl.replace(/^\/api\/notifications/, '/notifications')));

// Admin routes
const rewriteAdminEvents = (_path: string, req: Request) => req.originalUrl.replace(/^\/api\/admin\/events/, '/events');
const rewriteAdminStats = (_path: string, req: Request) => req.originalUrl.replace(/^\/api\/admin\/stats/, '/admin/stats');
const rewriteAdminOrders = (_path: string, req: Request) => req.originalUrl.replace(/^\/api\/admin\/orders/, '/admin/orders');
const rewriteAdminPayments = (_path: string, req: Request) => req.originalUrl.replace(/^\/api\/admin\/payments/, '/admin/payments');
app.use('/api/admin/events', authMiddleware(['ADMIN', 'SUPER_ADMIN']), proxy(SERVICES.event, rewriteAdminEvents));
app.use('/api/admin/stats', authMiddleware(['ADMIN', 'SUPER_ADMIN']), proxy(SERVICES.event, rewriteAdminStats));
app.use('/api/admin/orders', authMiddleware(['ADMIN', 'SUPER_ADMIN']), proxy(SERVICES.order, rewriteAdminOrders));
app.use('/api/admin/payments', authMiddleware(['ADMIN', 'SUPER_ADMIN']), proxy(SERVICES.payment, rewriteAdminPayments));

app.get('/api/services', (_req, res) => {
  res.json({
    gateway: 'ok',
    services: Object.entries(SERVICES).map(([name, url]) => ({ name, url })),
  });
});

app.use(errorHandler);
start();

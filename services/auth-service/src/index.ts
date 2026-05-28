import bcrypt from 'bcrypt';
import jwt, { JsonWebTokenError, SignOptions, TokenExpiredError } from 'jsonwebtoken';
import { z } from 'zod';
import { createServiceApp, asyncHandler, errorHandler } from '@festix/service-common';
import { query, publishEvent, DOMAIN_EVENTS } from '@festix/shared';
import type { JwtPayload, UserRole } from '@festix/shared';

const PORT = parseInt(process.env.AUTH_SERVICE_PORT || '3001', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'festix-dev-secret-change-in-prod';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase').regex(/[0-9]/, 'Must contain number'),
  full_name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const adminUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase').regex(/[0-9]/, 'Must contain number').optional(),
  full_name: z.string().min(2),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
});

function signAccess(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES } as SignOptions);
}

function signRefresh(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES } as SignOptions);
}

function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

function sendInvalidToken(res: { status: (code: number) => { json: (body: unknown) => void } }, err: unknown) {
  if (err instanceof TokenExpiredError) {
    res.status(401).json({ error: 'Token expired' });
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  throw err;
}

const { app, start } = createServiceApp({ name: 'auth-service', port: PORT });

function isSuperAdmin(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  return req.headers['x-user-role'] === 'SUPER_ADMIN';
}

function requireSuperAdmin(req: { headers: Record<string, string | string[] | undefined> }, res: { status: (code: number) => { json: (body: unknown) => void } }): boolean {
  if (!isSuperAdmin(req)) {
    res.status(403).json({ error: 'SUPER_ADMIN access required' });
    return false;
  }
  return true;
}

app.post('/register', asyncHandler(async (req, res) => {
  const body = registerSchema.parse(req.body);
  const existing = await query('SELECT id FROM users WHERE email = $1', [body.email]);
  if (existing.rows.length > 0) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const hash = await bcrypt.hash(body.password, 12);
  const result = await query<{ id: string; email: string; full_name: string }>(
    `INSERT INTO users (email, password_hash, full_name, role_id)
     VALUES ($1, $2, $3, 1) RETURNING id, email, full_name`,
    [body.email, hash, body.full_name]
  );
  const user = result.rows[0];
  const payload: JwtPayload = { sub: user.id, email: user.email, role: 'USER' };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(user.id);

  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
    [user.id, await bcrypt.hash(refreshToken, 10)]
  );

  await publishEvent('notification.send', {
    event: DOMAIN_EVENTS.USER_REGISTERED,
    payload: { userId: user.id, email: user.email },
    timestamp: new Date().toISOString(),
  });

  res.status(201).json({
    user: { id: user.id, email: user.email, full_name: user.full_name, role: 'USER' },
    accessToken,
    refreshToken,
  });
}));

app.post('/login', asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const result = await query<{ id: string; email: string; full_name: string; password_hash: string; role: UserRole }>(
    `SELECT u.id, u.email, u.full_name, u.password_hash, r.name as role
     FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = $1 AND u.is_active = true`,
    [body.email]
  );
  if (result.rows.length === 0) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const user = result.rows[0];
  const valid = await bcrypt.compare(body.password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(user.id);

  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
    [user.id, await bcrypt.hash(refreshToken, 10)]
  );

  res.json({
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    accessToken,
    refreshToken,
  });
}));

app.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }
  const decoded = jwt.verify(refreshToken, JWT_SECRET) as { sub: string; type?: string };
  if (decoded.type !== 'refresh') {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const result = await query<{ id: string; email: string; role: UserRole }>(
    `SELECT u.id, u.email, r.name as role FROM users u
     JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
    [decoded.sub]
  );
  if (result.rows.length === 0) {
    res.status(401).json({ error: 'User not found' });
    return;
  }
  const user = result.rows[0];
  const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
  res.json({ accessToken: signAccess(payload), refreshToken: signRefresh(user.id) });
}));

app.post('/logout', asyncHandler(async (req, res) => {
  const auth = req.headers.authorization?.replace('Bearer ', '');
  if (auth) {
    try {
      const decoded = verifyToken(auth);
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [decoded.sub]);
    } catch { /* ignore */ }
  }
  res.json({ message: 'Logged out' });
}));

app.get('/verify', asyncHandler(async (req, res) => {
  const auth = req.headers.authorization?.replace('Bearer ', '');
  if (!auth) {
    res.status(401).json({ error: 'No token' });
    return;
  }
  try {
    const payload = verifyToken(auth);
    res.json({ valid: true, user: payload });
  } catch (err) {
    sendInvalidToken(res, err);
  }
}));

// For API gateway middleware (nginx `auth_request`) which can only reliably consume status codes and headers.
// Returns 204 and forwards the verified user context via headers.
app.get('/internal/verify', asyncHandler(async (req, res) => {
  const auth = req.headers.authorization?.replace('Bearer ', '');
  if (!auth) {
    res.status(401).json({ error: 'No token' });
    return;
  }
  try {
    const payload = verifyToken(auth);
    res.setHeader('x-user-id', payload.sub);
    res.setHeader('x-user-role', payload.role);
    res.setHeader('x-user-email', payload.email);
    res.status(204).send();
  } catch (err) {
    sendInvalidToken(res, err);
  }
}));

app.get('/users/:id', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT u.id, u.email, u.full_name, r.name as role, u.created_at
     FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
    [req.params.id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(result.rows[0]);
}));

app.get('/admin/users', asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;

  const result = await query(
    `SELECT u.id, u.email, u.full_name, r.name as role, u.is_active, u.created_at, u.updated_at
     FROM users u
     JOIN roles r ON u.role_id = r.id
     ORDER BY u.created_at DESC`
  );

  res.json(result.rows);
}));

app.post('/admin/users', asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;

  const body = adminUserSchema.required({ password: true }).parse(req.body);
  const hash = await bcrypt.hash(body.password, 12);
  const result = await query(
    `INSERT INTO users (email, password_hash, full_name, role_id)
     SELECT $1, $2, $3, id FROM roles WHERE name = $4
     RETURNING id, email, full_name,
       (SELECT name FROM roles WHERE id = users.role_id) as role,
       is_active, created_at, updated_at`,
    [body.email, hash, body.full_name, body.role]
  );

  res.status(201).json(result.rows[0]);
}));

app.put('/admin/users/:id', asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;

  const body = adminUserSchema.parse(req.body);
  const params = body.password
    ? [req.params.id, body.email, body.full_name, body.role, await bcrypt.hash(body.password, 12)]
    : [req.params.id, body.email, body.full_name, body.role];
  const passwordUpdate = body.password ? ', password_hash = $5' : '';

  const result = await query(
    `UPDATE users
     SET email = $2,
         full_name = $3,
         role_id = (SELECT id FROM roles WHERE name = $4),
         is_active = true,
         updated_at = NOW()
         ${passwordUpdate}
     WHERE id = $1
     RETURNING id, email, full_name,
       (SELECT name FROM roles WHERE id = users.role_id) as role,
       is_active, created_at, updated_at`,
    params
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json(result.rows[0]);
}));

app.delete('/admin/users/:id', asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;

  if (req.params.id === req.headers['x-user-id']) {
    res.status(400).json({ error: 'Cannot delete the active user' });
    return;
  }

  const result = await query(
    `DELETE FROM users WHERE id = $1
     RETURNING id, email, full_name`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ message: 'User deleted', user: result.rows[0] });
}));

app.use(errorHandler);
start();

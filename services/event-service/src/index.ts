import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { createServiceApp, asyncHandler, errorHandler } from '@festix/service-common';
import { query, getRedis, RedisKeys } from '@festix/shared';

const PORT = parseInt(process.env.EVENT_SERVICE_PORT || '3002', 10);
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  venue_id: z.string().uuid().optional(),
  starts_at: z.string(),
  ends_at: z.string(),
  is_published: z.boolean().optional(),
});

const seatGenSchema = z.object({
  rows: z.number().min(1).max(50),
  seats_per_row: z.number().min(1).max(100),
  categories: z.array(z.object({
    rows: z.array(z.string()),
    category: z.enum(['VIP', 'REGULAR', 'ECONOMY']),
    price: z.number().positive(),
  })),
});

const { app, start } = createServiceApp({ name: 'event-service', port: PORT });
app.use('/uploads', express.static(uploadDir));

async function invalidateEventCache(eventId: string) {
  const redis = getRedis();
  await redis.del(RedisKeys.eventCache(eventId));
  await redis.del(RedisKeys.eventsList());
}

app.get('/events', asyncHandler(async (req, res) => {
  const redis = getRedis();
  const cached = await redis.get(RedisKeys.eventsList());
  if (cached && !req.query.refresh) {
    res.json(JSON.parse(cached));
    return;
  }

  const search = req.query.q as string | undefined;
  let sql = `SELECT e.*, v.name as venue_name, v.city as venue_city,
    (SELECT COUNT(*) FROM seats s WHERE s.event_id = e.id AND s.status = 'AVAILABLE') as available_seats
    FROM events e LEFT JOIN venues v ON e.venue_id = v.id WHERE e.is_published = true`;
  const params: unknown[] = [];
  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (e.title ILIKE $${params.length} OR e.description ILIKE $${params.length})`;
  }
  sql += ' ORDER BY e.starts_at ASC';

  const result = await query(sql, params);
  await redis.setex(RedisKeys.eventsList(), 60, JSON.stringify(result.rows));
  res.json(result.rows);
}));

app.get('/events/:id', asyncHandler(async (req, res) => {
  const redis = getRedis();
  const cacheKey = RedisKeys.eventCache(String(req.params.id));
  const cached = await redis.get(cacheKey);
  if (cached) {
    res.json(JSON.parse(cached));
    return;
  }

  const result = await query(
    `SELECT e.*, v.name as venue_name, v.address, v.city, v.capacity
     FROM events e LEFT JOIN venues v ON e.venue_id = v.id WHERE e.id = $1`,
    [String(req.params.id)]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  await redis.setex(cacheKey, 120, JSON.stringify(result.rows[0]));
  res.json(result.rows[0]);
}));

app.post('/events', asyncHandler(async (req, res) => {
  const body = eventSchema.parse(req.body);
  const result = await query(
    `INSERT INTO events (title, description, venue_id, starts_at, ends_at, is_published, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [body.title, body.description, body.venue_id, body.starts_at, body.ends_at,
      body.is_published ?? false, req.headers['x-user-id']]
  );
  await invalidateEventCache(result.rows[0].id);
  res.status(201).json(result.rows[0]);
}));

app.put('/events/:id', asyncHandler(async (req, res) => {
  const body = eventSchema.partial().parse(req.body);
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [key, val] of Object.entries(body)) {
    if (val !== undefined) {
      fields.push(`${key} = $${i++}`);
      values.push(val);
    }
  }
  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }
  fields.push(`updated_at = NOW()`);
  values.push(String(req.params.id));
  const result = await query(
    `UPDATE events SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  await invalidateEventCache(String(req.params.id));
  res.json(result.rows[0]);
}));

app.delete('/events/:id', asyncHandler(async (req, res) => {
  await query('DELETE FROM events WHERE id = $1', [String(req.params.id)]);
  await invalidateEventCache(String(req.params.id));
  res.json({ message: 'Event deleted' });
}));

app.post('/events/:id/banner', upload.single('banner'), asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const bannerUrl = `/uploads/${req.file.filename}`;
  const result = await query(
    'UPDATE events SET banner_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [bannerUrl, String(req.params.id)]
  );
  await invalidateEventCache(String(req.params.id));
  res.json(result.rows[0]);
}));

app.post('/events/:id/seats/generate', asyncHandler(async (req, res) => {
  const body = seatGenSchema.parse(req.body);
  const eventId = String(req.params.id);
  const seats: unknown[][] = [];

  for (let r = 0; r < body.rows; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    for (let s = 1; s <= body.seats_per_row; s++) {
      const catConfig = body.categories.find((c) => c.rows.includes(rowLabel));
      const category = catConfig?.category || 'REGULAR';
      const price = catConfig?.price || 100;
      seats.push([eventId, rowLabel, s, category, price]);
    }
  }

  for (const seat of seats) {
    await query(
      `INSERT INTO seats (event_id, row_label, seat_number, category, price)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
      seat
    );
  }

  const redis = getRedis();
  const count = await query(
    "SELECT COUNT(*) as cnt FROM seats WHERE event_id = $1 AND status = 'AVAILABLE'",
    [eventId]
  );
  await redis.set(RedisKeys.eventStock(eventId), count.rows[0].cnt);

  res.json({ message: `Generated ${seats.length} seats`, total: seats.length });
}));

app.get('/venues', asyncHandler(async (_req, res) => {
  const result = await query('SELECT * FROM venues ORDER BY name');
  res.json(result.rows);
}));

app.post('/venues', asyncHandler(async (req, res) => {
  const { name, address, city, capacity } = req.body;
  const result = await query(
    'INSERT INTO venues (name, address, city, capacity) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, address, city, capacity]
  );
  res.status(201).json(result.rows[0]);
}));

app.get('/admin/stats', asyncHandler(async (_req, res) => {
  const [events, tickets, orders] = await Promise.all([
    query('SELECT COUNT(*) as count FROM events'),
    query('SELECT COUNT(*) as count FROM tickets'),
    query(`SELECT status, COUNT(*) as count FROM orders GROUP BY status`),
  ]);
  res.json({
    total_events: events.rows[0].count,
    tickets_sold: tickets.rows[0].count,
    orders_by_status: orders.rows,
  });
}));

app.use(errorHandler);
start();

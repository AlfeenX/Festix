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

const venueSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  capacity: z.number().int().min(0).optional(),
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
  const search = req.query.q as string | undefined;
  const status = req.query.status as string | undefined;
  const city = req.query.city as string | undefined;
  const published = req.query.published as string | undefined;
  const venueName = req.query.venueName as string | undefined;
  const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

  const userRole = req.headers['x-user-role'] as string | undefined;
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  let baseSql = `FROM events e LEFT JOIN venues v ON e.venue_id = v.id`;
  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (!isAdmin) {
    whereClauses.push('e.is_published = true');
  } else if (published && published !== 'All') {
    if (published === 'Published') {
      whereClauses.push('e.is_published = true');
    } else if (published === 'Draft') {
      whereClauses.push('e.is_published = false');
    }
  }

  if (search) {
    params.push(`%${search}%`);
    whereClauses.push(`(e.title ILIKE $${params.length} OR e.description ILIKE $${params.length} OR v.name ILIKE $${params.length} OR v.city ILIKE $${params.length})`);
  }

  if (city && city !== 'All') {
    params.push(city);
    whereClauses.push(`v.city = $${params.length}`);
  }

  if (venueName && venueName !== 'All') {
    params.push(venueName);
    whereClauses.push(`v.name = $${params.length}`);
  }

  if (status && status !== 'All') {
    const now = new Date().toISOString();
    params.push(now);
    if (status === 'Upcoming') {
      whereClauses.push(`e.starts_at > $${params.length}`);
    } else if (status === 'Past') {
      whereClauses.push(`e.ends_at < $${params.length}`);
    } else if (status === 'Ongoing') {
      whereClauses.push(`e.starts_at <= $${params.length} AND e.ends_at >= $${params.length}`);
    }
  }

  const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
  
  const countSql = `SELECT COUNT(*) ${baseSql}${whereSql}`;
  let selectSql = `SELECT e.*, v.name as venue_name, v.city as venue_city,
    (SELECT COUNT(*) FROM seats s WHERE s.event_id = e.id AND s.status = 'AVAILABLE') as available_seats
    ${baseSql}${whereSql} ORDER BY e.starts_at ASC`;

  const isCacheable = !page && !search && !status && !city && !published && !venueName && !isAdmin;
  if (isCacheable) {
    const cached = await redis.get(RedisKeys.eventsList());
    if (cached && !req.query.refresh) {
      res.json(JSON.parse(cached));
      return;
    }
  }

  if (page !== undefined) {
    const offset = (page - 1) * limit;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const paginatedParams = [...params, limit, offset];
    selectSql += ` LIMIT $${paginatedParams.length - 1} OFFSET $${paginatedParams.length}`;
    const result = await query(selectSql, paginatedParams);

    res.json({
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } else {
    const result = await query(selectSql, params);
    if (isCacheable) {
      await redis.setex(RedisKeys.eventsList(), 60, JSON.stringify(result.rows));
    }
    res.json(result.rows);
  }
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

app.get('/venues', asyncHandler(async (req, res) => {
  const search = req.query.q as string | undefined;
  const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

  let sql = 'SELECT * FROM venues';
  let countSql = 'SELECT COUNT(*) FROM venues';
  const params: unknown[] = [];

  if (search) {
    params.push(`%${search}%`);
    const searchFilter = ' WHERE name ILIKE $1 OR address ILIKE $1 OR city ILIKE $1';
    sql += searchFilter;
    countSql += searchFilter;
  }

  sql += ' ORDER BY name';

  if (page !== undefined) {
    const offset = (page - 1) * limit;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const paginatedParams = [...params, limit, offset];
    sql += ` LIMIT $${paginatedParams.length - 1} OFFSET $${paginatedParams.length}`;
    const result = await query(sql, paginatedParams);

    res.json({
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } else {
    const result = await query(sql, params);
    res.json(result.rows);
  }
}));

app.post('/admin/venues', asyncHandler(async (req, res) => {
  const body = venueSchema.parse(req.body);
  const result = await query(
    'INSERT INTO venues (name, address, city, capacity) VALUES ($1, $2, $3, $4) RETURNING *',
    [body.name, body.address || null, body.city || null, body.capacity ?? 0]
  );
  res.status(201).json(result.rows[0]);
}));

app.put('/admin/venues/:id', asyncHandler(async (req, res) => {
  const body = venueSchema.partial().parse(req.body);
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined) {
      fields.push(`${key} = $${i++}`);
      values.push(value === '' ? null : value);
    }
  }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  values.push(String(req.params.id));
  const result = await query(
    `UPDATE venues SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }

  res.json(result.rows[0]);
}));

app.delete('/admin/venues/:id', asyncHandler(async (req, res) => {
  const usage = await query('SELECT COUNT(*) as count FROM events WHERE venue_id = $1', [String(req.params.id)]);
  if (parseInt(usage.rows[0].count, 10) > 0) {
    res.status(409).json({ error: 'Venue is still used by one or more events' });
    return;
  }

  const result = await query('DELETE FROM venues WHERE id = $1 RETURNING *', [String(req.params.id)]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }

  res.json({ message: 'Venue deleted', venue: result.rows[0] });
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

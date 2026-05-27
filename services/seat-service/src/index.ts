import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { z } from 'zod';
import { createServiceApp, asyncHandler, errorHandler } from '@festix/service-common';
import {
  query, getRedis, RedisKeys, acquireLock, releaseLock,
  publishEvent, DOMAIN_EVENTS,
} from '@festix/shared';

const PORT = parseInt(process.env.SEAT_SERVICE_PORT || '3003', 10);
const SEAT_LOCK_TTL = parseInt(process.env.SEAT_LOCK_TTL || '300', 10);
const MAX_ACTIVE = parseInt(process.env.WAITING_ROOM_MAX_ACTIVE || '500', 10);

const lockSchema = z.object({
  seat_ids: z.array(z.string().uuid()).min(1).max(10),
  user_id: z.string().uuid(),
});

const { app, metrics } = createServiceApp({ name: 'seat-service', port: PORT });
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3100', credentials: true },
});

function broadcastSeatUpdate(eventId: string, seats: unknown[]) {
  io.to(`event:${eventId}`).emit('seats:update', { eventId, seats, timestamp: new Date().toISOString() });
}

app.get('/events/:eventId/seats', asyncHandler(async (req, res) => {
  const redis = getRedis();
  const eventId = String(req.params.eventId);
  const cacheKey = `event:${eventId}:seats`;
  const cached = await redis.get(cacheKey);
  if (cached && !req.query.refresh) {
    res.json(JSON.parse(cached));
    return;
  }

  const result = await query(
    'SELECT * FROM seats WHERE event_id = $1 ORDER BY row_label, seat_number',
    [eventId]
  );
  await redis.setex(cacheKey, 30, JSON.stringify(result.rows));
  res.json(result.rows);
}));

app.post('/seats/lock', asyncHandler(async (req, res) => {
  const body = lockSchema.parse(req.body);
  const locked: string[] = [];
  const failed: string[] = [];

  for (const seatId of body.seat_ids) {
    const seatResult = await query<{ id: string; event_id: string; status: string }>(
      'SELECT id, event_id, status FROM seats WHERE id = $1',
      [seatId]
    );
    if (seatResult.rows.length === 0 || seatResult.rows[0].status !== 'AVAILABLE') {
      failed.push(seatId);
      continue;
    }

    const lockKey = RedisKeys.seatLock(seatId);
    const acquired = await acquireLock(lockKey, body.user_id, SEAT_LOCK_TTL);
    if (!acquired) {
      failed.push(seatId);
      continue;
    }

    const expiresAt = new Date(Date.now() + SEAT_LOCK_TTL * 1000);
    await query(
      `UPDATE seats SET status = 'LOCKED' WHERE id = $1 AND status = 'AVAILABLE'`,
      [seatId]
    );
    await query(
      `INSERT INTO seat_locks (seat_id, user_id, expires_at)
       VALUES ($1, $2, $3) ON CONFLICT (seat_id) DO UPDATE SET user_id = $2, expires_at = $3`,
      [seatId, body.user_id, expiresAt]
    );
    locked.push(seatId);
  }

  if (locked.length > 0) {
    const eventResult = await query('SELECT event_id FROM seats WHERE id = $1', [locked[0]]);
    const eventId = eventResult.rows[0]?.event_id;
    if (eventId) {
      const seats = await query('SELECT * FROM seats WHERE event_id = $1', [eventId]);
      broadcastSeatUpdate(eventId, seats.rows);
      const redis = getRedis();
      await redis.del(`event:${eventId}:seats`);
      await publishEvent('notification.send', {
        event: DOMAIN_EVENTS.SEAT_RESERVED,
        payload: { seatIds: locked, userId: body.user_id, eventId },
        timestamp: new Date().toISOString(),
      });
    }
  }

  res.json({ locked, failed, expiresIn: SEAT_LOCK_TTL });
}));

app.post('/seats/unlock', asyncHandler(async (req, res) => {
  const { seat_ids, user_id } = req.body;
  for (const seatId of seat_ids as string[]) {
    const lockKey = RedisKeys.seatLock(seatId);
    await releaseLock(lockKey, user_id);
    await query(
      `UPDATE seats SET status = 'AVAILABLE' WHERE id = $1 AND status = 'LOCKED'`,
      [seatId]
    );
    await query('DELETE FROM seat_locks WHERE seat_id = $1 AND user_id = $2', [seatId, user_id]);
  }
  res.json({ message: 'Seats released' });
}));

app.post('/waiting-room/:eventId/join', asyncHandler(async (req, res) => {
  const { user_id } = req.body;
  const eventId = String(req.params.eventId);
  const redis = getRedis();
  const queueKey = RedisKeys.waitingRoom(eventId);
  const activeKey = RedisKeys.activeUsers(eventId);

  const activeCount = parseInt((await redis.get(activeKey)) || '0', 10);
  if (activeCount < MAX_ACTIVE) {
    await redis.incr(activeKey);
    await redis.expire(activeKey, 3600);
    res.json({ status: 'admitted', position: 0 });
    return;
  }

  const score = Date.now();
  await redis.zadd(queueKey, score, user_id);
  const position = await redis.zrank(queueKey, user_id);
  res.json({ status: 'waiting', position: (position ?? 0) + 1 });
}));

app.get('/waiting-room/:eventId/position/:userId', asyncHandler(async (req, res) => {
  const redis = getRedis();
  const position = await redis.zrank(RedisKeys.waitingRoom(String(req.params.eventId)), String(req.params.userId));
  res.json({ position: position !== null ? position + 1 : 0, status: position !== null ? 'waiting' : 'admitted' });
}));

app.post('/waiting-room/:eventId/admit-next', asyncHandler(async (req, res) => {
  const redis = getRedis();
  const queueKey = RedisKeys.waitingRoom(String(req.params.eventId));
  const activeKey = RedisKeys.activeUsers(String(req.params.eventId));
  const members = await redis.zrange(queueKey, 0, 0);
  if (members.length === 0) {
    res.json({ admitted: null });
    return;
  }
  const userId = members[0];
  await redis.zrem(queueKey, userId);
  await redis.incr(activeKey);
  io.to(`user:${userId}`).emit('queue:admitted', { eventId: String(req.params.eventId) });
  res.json({ admitted: userId });
}));

app.post('/seats/release-expired', asyncHandler(async (_req, res) => {
  const expired = await query(
    `SELECT sl.seat_id, sl.user_id FROM seat_locks sl WHERE sl.expires_at < NOW()`
  );
  let released = 0;
  for (const row of expired.rows) {
    await releaseLock(RedisKeys.seatLock(row.seat_id), row.user_id);
    await query(`UPDATE seats SET status = 'AVAILABLE' WHERE id = $1 AND status = 'LOCKED'`, [row.seat_id]);
    await query('DELETE FROM seat_locks WHERE seat_id = $1', [row.seat_id]);
    released++;
  }
  res.json({ released });
}));

io.on('connection', (socket) => {
  metrics.activeConnections.inc();
  socket.on('join:event', (eventId: string) => {
    socket.join(`event:${eventId}`);
  });
  socket.on('join:user', (userId: string) => {
    socket.join(`user:${userId}`);
  });
  socket.on('disconnect', () => metrics.activeConnections.dec());
});

app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`[seat-service] listening on port ${PORT} (HTTP + WebSocket)`);
});

export { io, broadcastSeatUpdate };

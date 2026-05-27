import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { createServiceApp, asyncHandler, errorHandler } from '@festix/service-common';
import { query, publishEvent, DOMAIN_EVENTS } from '@festix/shared';

const PORT = parseInt(process.env.ORDER_SERVICE_PORT || '3004', 10);

const checkoutSchema = z.object({
  user_id: z.string().uuid(),
  event_id: z.string().uuid(),
  seat_ids: z.array(z.string().uuid()).min(1),
  idempotency_key: z.string().optional(),
});

const { app, start } = createServiceApp({ name: 'order-service', port: PORT });

app.post('/checkout', asyncHandler(async (req, res) => {
  const body = checkoutSchema.parse(req.body);
  const idempotencyKey = body.idempotency_key || uuidv4();

  const existing = await query('SELECT * FROM orders WHERE idempotency_key = $1', [idempotencyKey]);
  if (existing.rows.length > 0) {
    res.json({ order: existing.rows[0], duplicate: true });
    return;
  }

  const seats = await query<{ id: string; price: string; status: string; event_id: string }>(
    `SELECT id, price, status, event_id FROM seats
     WHERE id = ANY($1) AND event_id = $2`,
    [body.seat_ids, body.event_id]
  );

  if (seats.rows.length !== body.seat_ids.length) {
    res.status(400).json({ error: 'Some seats not found' });
    return;
  }

  const invalid = seats.rows.filter((s) => s.status !== 'LOCKED');
  if (invalid.length > 0) {
    res.status(409).json({ error: 'Seats not locked', seats: invalid.map((s) => s.id) });
    return;
  }

  const total = seats.rows.reduce((sum, s) => sum + parseFloat(s.price), 0);

  const orderResult = await query(
    `INSERT INTO orders (user_id, event_id, status, total_amount, idempotency_key)
     VALUES ($1, $2, 'PENDING', $3, $4) RETURNING *`,
    [body.user_id, body.event_id, total, idempotencyKey]
  );
  const order = orderResult.rows[0];
  order.total_amount = parseFloat(order.total_amount);

  for (const seat of seats.rows) {
    await query(
      'INSERT INTO order_items (order_id, seat_id, price) VALUES ($1, $2, $3)',
      [order.id, seat.id, seat.price]
    );
    await query(`UPDATE seats SET status = 'RESERVED' WHERE id = $1`, [seat.id]);
  }

  await publishEvent('order.processing', {
    event: DOMAIN_EVENTS.ORDER_CREATED,
    payload: { orderId: order.id, userId: body.user_id, total, seatIds: body.seat_ids },
    timestamp: new Date().toISOString(),
    correlationId: order.id,
  });

  res.status(201).json({ order, idempotency_key: idempotencyKey });
}));

app.get('/orders', asyncHandler(async (req, res) => {
  const userId = req.query.user_id as string;
  if (!userId) {
    res.status(400).json({ error: 'user_id required' });
    return;
  }
  const result = await query(
    `SELECT o.*, e.title as event_title,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'seat_id', oi.seat_id,
          'price', oi.price,
          'row_label', s.row_label,
          'seat_number', s.seat_number
        )) FILTER (WHERE oi.id IS NOT NULL),
        '[]'
      ) as items,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'id', t.id,
          'seat_id', t.seat_id,
          'ticket_code', t.ticket_code,
          'qr_data', t.qr_data,
          'issued_at', t.issued_at
        )) FILTER (WHERE t.id IS NOT NULL),
        '[]'
      ) as tickets
     FROM orders o
     JOIN events e ON o.event_id = e.id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN seats s ON s.id = oi.seat_id
     LEFT JOIN tickets t ON t.order_id = o.id
     WHERE o.user_id = $1
     GROUP BY o.id, e.title
     ORDER BY o.created_at DESC`,
    [userId]
  );
  res.json(result.rows);
}));

app.get('/orders/:id', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT o.*, e.title as event_title,
      (SELECT json_agg(json_build_object(
        'seat_id', oi.seat_id, 'price', oi.price,
        'row_label', s.row_label, 'seat_number', s.seat_number
      )) FROM order_items oi JOIN seats s ON s.id = oi.seat_id WHERE oi.order_id = o.id) as items,
      (SELECT json_agg(json_build_object(
        'id', t.id, 'seat_id', t.seat_id, 'ticket_code', t.ticket_code,
        'qr_data', t.qr_data, 'issued_at', t.issued_at
      )) FROM tickets t WHERE t.order_id = o.id) as tickets
     FROM orders o JOIN events e ON o.event_id = e.id WHERE o.id = $1`,
    [req.params.id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json(result.rows[0]);
}));

app.get('/admin/orders', asyncHandler(async (req, res) => {
  const status = req.query.status as string | undefined;
  let sql = `SELECT o.*, u.email, e.title as event_title FROM orders o
    JOIN users u ON o.user_id = u.id JOIN events e ON o.event_id = e.id`;
  const params: unknown[] = [];
  if (status) {
    params.push(status);
    sql += ` WHERE o.status = $${params.length}`;
  }
  sql += ' ORDER BY o.created_at DESC LIMIT 100';
  const result = await query(sql, params);
  res.json(result.rows);
}));

app.patch('/orders/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const result = await query(
    'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  res.json(result.rows[0]);
}));

app.post('/orders/:id/cancel', asyncHandler(async (req, res) => {
  const order = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (order.rows.length === 0) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  await query("UPDATE orders SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1", [req.params.id]);
  const items = await query('SELECT seat_id FROM order_items WHERE order_id = $1', [req.params.id]);
  for (const item of items.rows) {
    await query("UPDATE seats SET status = 'AVAILABLE' WHERE id = $1", [item.seat_id]);
  }
  res.json({ message: 'Order cancelled' });
}));

app.use(errorHandler);
start();

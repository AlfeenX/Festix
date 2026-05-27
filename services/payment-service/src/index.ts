import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { createServiceApp, asyncHandler, errorHandler } from '@festix/service-common';
import { query, publishEvent, DOMAIN_EVENTS } from '@festix/shared';

const PORT = parseInt(process.env.PAYMENT_SERVICE_PORT || '3005', 10);
const FAILURE_RATE = parseFloat(process.env.PAYMENT_FAILURE_RATE || '0.05');

const paySchema = z.object({
  order_id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  payment_method: z.string().default('SIMULATED'),
  idempotency_key: z.string().optional(),
});

const { app, start } = createServiceApp({ name: 'payment-service', port: PORT });

function generateTicketCode(): string {
  return `FST-${uuidv4().slice(0, 8).toUpperCase()}`;
}

async function generateTicketsForOrder(orderId: string) {
  const order = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (order.rows.length === 0) return;

  const orderData = order.rows[0];
  const items = await query(
    `SELECT oi.*, s.row_label, s.seat_number
     FROM order_items oi
     JOIN seats s ON s.id = oi.seat_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  for (const item of items.rows) {
    const existing = await query('SELECT id FROM tickets WHERE order_id = $1 AND seat_id = $2', [orderId, item.seat_id]);
    if (existing.rows.length > 0) {
      await query("UPDATE seats SET status = 'SOLD' WHERE id = $1", [item.seat_id]);
      continue;
    }

    const ticketCode = generateTicketCode();
    const qrData = JSON.stringify({
      ticketCode,
      orderId,
      seatId: item.seat_id,
      eventId: orderData.event_id,
      row: item.row_label,
      seat: item.seat_number,
    });

    await query(
      `INSERT INTO tickets (order_id, seat_id, user_id, event_id, ticket_code, qr_data)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orderId, item.seat_id, orderData.user_id, orderData.event_id, ticketCode, qrData]
    );
    await query("UPDATE seats SET status = 'SOLD' WHERE id = $1", [item.seat_id]);
  }
}

async function getPaymentSession(paymentId: string) {
  return query(
    `SELECT p.*, o.status as order_status, o.total_amount, o.user_id, e.title as event_title
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     JOIN events e ON e.id = o.event_id
     WHERE p.id = $1`,
    [paymentId]
  );
}

app.post('/pay', asyncHandler(async (req, res) => {
  const body = paySchema.parse(req.body);
  const idempotencyKey = body.idempotency_key || uuidv4();

  const existing = await query('SELECT * FROM payments WHERE idempotency_key = $1', [idempotencyKey]);
  if (existing.rows.length > 0) {
    res.json({ payment: existing.rows[0], duplicate: true, success: existing.rows[0].status === 'SUCCESS' });
    return;
  }

  const order = await query('SELECT * FROM orders WHERE id = $1', [body.order_id]);
  if (order.rows.length === 0) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  if (Number(order.rows[0].total_amount) !== Number(body.amount)) {
    res.status(400).json({ error: 'Payment amount does not match order total' });
    return;
  }

  const paymentResult = await query(
    `INSERT INTO payments (order_id, amount, status, payment_method, idempotency_key)
     VALUES ($1, $2, 'PENDING', $3, $4) RETURNING *`,
    [body.order_id, body.amount, body.payment_method, idempotencyKey]
  );
  const payment = paymentResult.rows[0];

  await publishEvent('payment.processing', {
    event: DOMAIN_EVENTS.ORDER_PROCESSING,
    payload: { paymentId: payment.id, orderId: body.order_id, amount: body.amount },
    timestamp: new Date().toISOString(),
    correlationId: body.order_id,
  });

  res.status(201).json({
    payment,
    success: false,
    payment_url: `/pay/${payment.id}`,
  });
}));

app.get('/session/:id', asyncHandler(async (req, res) => {
  const result = await getPaymentSession(String(req.params.id));
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Payment not found' });
    return;
  }
  res.json(result.rows[0]);
}));

app.post('/:id/confirm', asyncHandler(async (req, res) => {
  const paymentId = String(req.params.id);
  const result = await getPaymentSession(paymentId);
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Payment not found' });
    return;
  }

  const payment = result.rows[0];
  if (payment.status === 'SUCCESS') {
    res.json({ payment, success: true, duplicate: true });
    return;
  }

  if (payment.status !== 'PENDING') {
    res.status(409).json({ error: `Payment is already ${payment.status}` });
    return;
  }

  const success = true;
  const transactionId = `TXN-${uuidv4().slice(0, 8).toUpperCase()}`;

  if (success) {
    await query(
      `UPDATE payments SET status = 'SUCCESS', transaction_id = $1, updated_at = NOW() WHERE id = $2`,
      [transactionId, paymentId]
    );
    await query("UPDATE orders SET status = 'PAID', updated_at = NOW() WHERE id = $1", [payment.order_id]);
    await generateTicketsForOrder(payment.order_id);

    await publishEvent('ticket.generation', {
      event: DOMAIN_EVENTS.PAYMENT_SUCCESS,
      payload: { paymentId, orderId: payment.order_id, transactionId },
      timestamp: new Date().toISOString(),
      correlationId: payment.order_id,
    });
  } else {
    await query("UPDATE payments SET status = 'FAILED', updated_at = NOW() WHERE id = $1", [paymentId]);
    await query("UPDATE orders SET status = 'FAILED', updated_at = NOW() WHERE id = $1", [payment.order_id]);

    await publishEvent('notification.send', {
      event: DOMAIN_EVENTS.PAYMENT_FAILED,
      payload: { paymentId, orderId: payment.order_id },
      timestamp: new Date().toISOString(),
    });
  }

  const updated = await query('SELECT * FROM payments WHERE id = $1', [paymentId]);
  res.json({
    payment: updated.rows[0],
    success,
    transaction_id: success ? transactionId : null,
  });
}));

app.get('/payments/:orderId', asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC', [req.params.orderId]);
  res.json(result.rows);
}));

app.post('/payments/:id/refund', asyncHandler(async (req, res) => {
  await query("UPDATE payments SET status = 'REFUNDED', updated_at = NOW() WHERE id = $1", [req.params.id]);
  const payment = await query('SELECT order_id FROM payments WHERE id = $1', [req.params.id]);
  if (payment.rows[0]) {
    await query("UPDATE orders SET status = 'REFUNDED', updated_at = NOW() WHERE id = $1", [payment.rows[0].order_id]);
  }
  res.json({ message: 'Payment refunded' });
}));

app.get('/admin/payments/stats', asyncHandler(async (_req, res) => {
  const result = await query(
    `SELECT status, COUNT(*) as count, SUM(amount) as total
     FROM payments GROUP BY status`
  );
  const total = await query('SELECT COUNT(*) as count FROM payments');
  const success = await query("SELECT COUNT(*) as count FROM payments WHERE status = 'SUCCESS'");
  const rate = total.rows[0].count > 0
    ? (parseInt(success.rows[0].count, 10) / parseInt(total.rows[0].count, 10)) * 100
    : 0;
  res.json({ by_status: result.rows, success_rate: rate.toFixed(2) });
}));

app.use(errorHandler);
start();

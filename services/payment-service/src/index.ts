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

app.post('/pay', asyncHandler(async (req, res) => {
  const body = paySchema.parse(req.body);
  const idempotencyKey = body.idempotency_key || uuidv4();

  const existing = await query('SELECT * FROM payments WHERE idempotency_key = $1', [idempotencyKey]);
  if (existing.rows.length > 0) {
    res.json({ payment: existing.rows[0], duplicate: true });
    return;
  }

  const order = await query('SELECT * FROM orders WHERE id = $1', [body.order_id]);
  if (order.rows.length === 0) {
    res.status(404).json({ error: 'Order not found' });
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

  const success = Math.random() > FAILURE_RATE;
  const transactionId = `TXN-${uuidv4().slice(0, 8).toUpperCase()}`;

  if (success) {
    await query(
      `UPDATE payments SET status = 'SUCCESS', transaction_id = $1, updated_at = NOW() WHERE id = $2`,
      [transactionId, payment.id]
    );
    await query("UPDATE orders SET status = 'PAID', updated_at = NOW() WHERE id = $1", [body.order_id]);

    await publishEvent('ticket.generation', {
      event: DOMAIN_EVENTS.PAYMENT_SUCCESS,
      payload: { paymentId: payment.id, orderId: body.order_id, transactionId },
      timestamp: new Date().toISOString(),
      correlationId: body.order_id,
    });
  } else {
    await query("UPDATE payments SET status = 'FAILED', updated_at = NOW() WHERE id = $1", [payment.id]);
    await query("UPDATE orders SET status = 'FAILED', updated_at = NOW() WHERE id = $1", [body.order_id]);

    await publishEvent('notification.send', {
      event: DOMAIN_EVENTS.PAYMENT_FAILED,
      payload: { paymentId: payment.id, orderId: body.order_id },
      timestamp: new Date().toISOString(),
    });
  }

  const updated = await query('SELECT * FROM payments WHERE id = $1', [payment.id]);
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

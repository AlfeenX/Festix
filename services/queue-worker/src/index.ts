import { v4 as uuidv4 } from 'uuid';
import { consumeQueue, query, publishEvent, DOMAIN_EVENTS } from '@festix/shared';

console.log('[queue-worker] Starting workers...');

function generateTicketCode(): string {
  return `FST-${uuidv4().slice(0, 8).toUpperCase()}`;
}

consumeQueue('order.processing', async (msg) => {
  const { orderId, userId } = msg.payload as { orderId: string; userId: string };
  console.log(`[worker] Processing order ${orderId}`);
  await query("UPDATE orders SET status = 'PROCESSING', updated_at = NOW() WHERE id = $1", [orderId]);
}).catch(console.error);

consumeQueue('ticket.generation', async (msg) => {
  const { orderId } = msg.payload as { orderId: string };
  console.log(`[worker] Generating tickets for order ${orderId}`);

  const order = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (order.rows.length === 0) return;

  const orderData = order.rows[0];
  const items = await query(
  'SELECT oi.*, s.row_label, s.seat_number FROM order_items oi JOIN seats s ON s.id = oi.seat_id WHERE oi.order_id = $1',
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

  await publishEvent('notification.send', {
    event: DOMAIN_EVENTS.TICKET_GENERATED,
    payload: { userId: orderData.user_id, orderId },
    timestamp: new Date().toISOString(),
  });

  console.log(`[worker] Generated ${items.rows.length} tickets for order ${orderId}`);
}).catch(console.error);

consumeQueue('payment.processing', async (msg) => {
  console.log(`[worker] Payment event:`, msg.event, msg.payload);
}).catch(console.error);

setInterval(async () => {
  try {
    const res = await fetch(`http://localhost:${process.env.SEAT_SERVICE_PORT || 3003}/seats/release-expired`, {
      method: 'POST',
    });
    const data = (await res.json()) as { released: number };
    if (data.released > 0) {
      console.log(`[worker] Released ${data.released} expired seat locks`);
    }
  } catch {
    /* seat service may not be up yet */
  }
}, 60000);

console.log('[queue-worker] All consumers registered');

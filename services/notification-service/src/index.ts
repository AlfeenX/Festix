import { createServiceApp, asyncHandler, errorHandler } from '@festix/service-common';
import { query, consumeQueue } from '@festix/shared';

const PORT = parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3006', 10);

const { app, start } = createServiceApp({ name: 'notification-service', port: PORT });

async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string
) {
  await query(
    'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
    [userId, type, title, message]
  );
  console.log(`[notification] ${type} -> user ${userId}: ${title}`);
}

app.get('/notifications/:userId', asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [req.params.userId]
  );
  res.json(result.rows);
}));

app.patch('/notifications/:id/read', asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read = true WHERE id = $1', [req.params.id]);
  res.json({ message: 'Marked as read' });
}));

app.post('/notifications/send', asyncHandler(async (req, res) => {
  const { user_id, type, title, message } = req.body;
  await createNotification(user_id, type, title, message);
  res.json({ message: 'Notification sent' });
}));

consumeQueue('notification.send', async (msg) => {
  const payload = msg.payload as Record<string, unknown>;
  const userId = payload.userId as string;
  if (!userId) return;

  switch (msg.event) {
    case 'USER_REGISTERED':
      await createNotification(userId, 'WELCOME', 'Welcome to Festix!', 'Your account has been created successfully.');
      break;
    case 'SEAT_RESERVED':
      await createNotification(userId, 'SEAT', 'Seats Reserved', 'Your seats have been temporarily reserved. Complete checkout within 5 minutes.');
      break;
    case 'PAYMENT_SUCCESS':
      await createNotification(userId, 'PAYMENT', 'Payment Successful', 'Your payment was processed. Your e-tickets are being generated.');
      break;
    case 'PAYMENT_FAILED':
      await createNotification(userId, 'PAYMENT', 'Payment Failed', 'Your payment could not be processed. Please try again.');
      break;
    case 'TICKET_GENERATED':
      await createNotification(userId, 'TICKET', 'E-Tickets Ready', 'Your e-tickets are ready! Check your order history.');
      break;
    default:
      if (payload.title && payload.message) {
        await createNotification(
          userId,
          (payload.type as string) || 'INFO',
          payload.title as string,
          payload.message as string
        );
      }
  }
}).catch(console.error);

app.use(errorHandler);
start();

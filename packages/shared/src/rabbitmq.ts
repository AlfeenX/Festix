import amqp, { Channel, ConsumeMessage } from 'amqplib';
import { EventMessage } from './events';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connection: any = null;
let channel: Channel | null = null;

export async function getChannel(): Promise<Channel> {
  if (channel) return channel;

  const url = process.env.RABBITMQ_URL || 'amqp://festix:festix_secret@localhost:5672';
  connection = await amqp.connect(url);
  channel = await connection.createChannel() as Channel;

  const queues = [
    'order.processing',
    'payment.processing',
    'notification.send',
    'ticket.generation',
    'dead.letter',
  ];

  for (const q of queues) {
    await channel.assertQueue(q, { durable: true });
  }

  await channel.assertExchange('festix.events', 'topic', { durable: true });

  return channel;
}

export async function publishEvent(
  queue: string,
  message: EventMessage
): Promise<void> {
  const ch = await getChannel();
  ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
    contentType: 'application/json',
  });
}

export async function consumeQueue(
  queue: string,
  handler: (msg: EventMessage, raw: ConsumeMessage) => Promise<void>
): Promise<void> {
  const ch = await getChannel();
  await ch.prefetch(10);
  await ch.consume(queue, async (raw) => {
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw.content.toString()) as EventMessage;
      await handler(parsed, raw);
      ch.ack(raw);
    } catch (err) {
      console.error(`[rabbitmq] Error processing ${queue}:`, err);
      ch.nack(raw, false, false);
      const dlqMsg: EventMessage = {
        event: 'ORDER_CREATED',
        payload: { error: String(err), original: raw.content.toString() },
        timestamp: new Date().toISOString(),
      };
      ch.sendToQueue('dead.letter', Buffer.from(JSON.stringify(dlqMsg)), { persistent: true });
    }
  });
}

export async function closeRabbitMQ(): Promise<void> {
  if (channel) await channel.close();
  if (connection?.close) await connection.close();
  channel = null;
  connection = null;
}

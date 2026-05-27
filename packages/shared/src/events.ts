export const DOMAIN_EVENTS = {
  USER_REGISTERED: 'USER_REGISTERED',
  SEAT_RESERVED: 'SEAT_RESERVED',
  SEAT_RELEASED: 'SEAT_RELEASED',
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_PROCESSING: 'ORDER_PROCESSING',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  TICKET_GENERATED: 'TICKET_GENERATED',
  NOTIFICATION_SEND: 'NOTIFICATION_SEND',
} as const;

export type DomainEvent = (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];

export const QUEUES = {
  ORDER_PROCESSING: 'order.processing',
  PAYMENT_PROCESSING: 'payment.processing',
  NOTIFICATION: 'notification.send',
  TICKET_GENERATION: 'ticket.generation',
  DLQ: 'dead.letter',
} as const;

export interface EventMessage<T = unknown> {
  event: DomainEvent;
  payload: T;
  timestamp: string;
  correlationId?: string;
}

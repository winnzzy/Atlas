import type { NotificationPriority, NotificationType } from '@prisma/client';

export const NOTIFICATION_EVENT_NAMES = {
  QUEUED: 'notification.queued',
  DELIVERED: 'notification.delivered',
  FAILED: 'notification.failed',
  READ: 'notification.read',
  CANCELLED: 'notification.cancelled',
} as const;

export interface NotificationVariables {
  [key: string]: string | number | boolean | null;
}

export interface NotificationContext {
  recipientId: string;
  type: NotificationType;
  priority: NotificationPriority;
  templateCode: string;
  variables: NotificationVariables;
  sourceEventType: string;
  sourceEventId?: string;
  sourceAggregateId?: string;
  occurredAt?: Date;
  expiresAt?: Date;
}

export class NotificationQueuedEvent {
  constructor(
    public readonly notificationId: string,
    public readonly recipientId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class NotificationDeliveryFailedEvent {
  constructor(
    public readonly notificationId: string,
    public readonly channel: string,
    public readonly reason: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

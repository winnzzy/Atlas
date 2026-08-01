import { DeliveryStatus, NotificationChannel, NotificationPriority, NotificationType } from '@prisma/client';
import { NotificationMapper } from '../notification.mapper';

describe('NotificationMapper', () => {
  let mapper: NotificationMapper;

  beforeEach(() => {
    mapper = new NotificationMapper();
  });

  it('maps notification record to response dto', () => {
    const dto = mapper.toNotificationDto({
      id: 'notif-1',
      userId: 'user-1',
      type: NotificationType.TRANSFER,
      status: DeliveryStatus.DELIVERED,
      priority: NotificationPriority.HIGH,
      title: 'Transfer completed',
      body: 'Done',
      templateCode: 'transfer.completed',
      templateVersion: 1,
      sourceEventType: 'transfer.completed',
      sourceAggregateId: 'trf-1',
      readAt: null,
      createdAt: new Date('2026-07-19T10:00:00.000Z'),
      deliveries: [
        {
          id: 'delivery-1',
          channel: NotificationChannel.IN_APP,
          status: DeliveryStatus.DELIVERED,
          recipient: 'user-1',
          provider: 'atlas-in-app',
          failureReason: null,
          createdAt: new Date('2026-07-19T10:00:01.000Z'),
        },
      ],
      auditEvents: [
        {
          id: 'audit-1',
          status: DeliveryStatus.DELIVERED,
          channel: NotificationChannel.IN_APP,
          reason: 'Delivery completed',
          createdAt: new Date('2026-07-19T10:00:02.000Z'),
        },
      ],
    });

    expect(dto.id).toBe('notif-1');
    expect(dto.recipientId).toBe('user-1');
    expect(dto.deliveries).toHaveLength(1);
    expect(dto.auditEvents).toHaveLength(1);
  });

  it('maps preference and template records', () => {
    const preference = mapper.toPreferenceDto({
      id: 'pref-1',
      userId: 'user-1',
      type: NotificationType.SECURITY,
      channel: NotificationChannel.EMAIL,
      enabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      timezone: 'UTC',
      language: 'en',
    });

    const template = mapper.toTemplateDto({
      id: 'tpl-1',
      code: 'auth.login',
      name: 'Login',
      type: NotificationType.SECURITY,
      channel: NotificationChannel.EMAIL,
      language: 'en',
      version: 1,
      subjectTemplate: 'Login',
      bodyTemplate: 'Body',
      isActive: true,
    });

    expect(preference.id).toBe('pref-1');
    expect(template.id).toBe('tpl-1');
  });
});

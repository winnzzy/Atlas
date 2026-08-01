import { DeliveryStatus, NotificationChannel, NotificationPriority, NotificationType } from '@prisma/client';
import { NotificationRepository } from '../notification.repository';

describe('NotificationRepository', () => {
  const prisma = {
    notification: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    notificationDelivery: {
      create: jest.fn(),
      update: jest.fn(),
    },
    notificationAuditEvent: {
      create: jest.fn(),
    },
    notificationPreference: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    notificationTemplate: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    accountHolder: {
      findFirst: jest.fn(),
    },
  };

  let repository: NotificationRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new NotificationRepository(prisma as never);
  });

  it('creates notification with queued audit event', async () => {
    prisma.notification.create.mockResolvedValue({ id: 'notif-1' });

    await repository.createNotification({
      userId: 'user-1',
      type: NotificationType.SECURITY,
      priority: NotificationPriority.HIGH,
      templateCode: 'auth.login',
      templateVersion: 1,
      title: 'Login alert',
      body: 'New login detected',
      variables: { ipAddress: '127.0.0.1' },
      sourceEventType: 'auth.login',
      sourceAggregateId: 'user-1',
    });

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          type: NotificationType.SECURITY,
          auditEvents: {
            create: {
              status: 'QUEUED',
              reason: 'Notification created',
            },
          },
        }),
      }),
    );
  });

  it('creates delivery and audit event', async () => {
    prisma.notificationDelivery.create.mockResolvedValue({ id: 'delivery-1' });

    const result = await repository.createDelivery({
      notificationId: 'notif-1',
      channel: NotificationChannel.EMAIL,
      recipient: 'user@test.com',
      provider: 'atlas-email',
    });

    expect(result).toBe('delivery-1');
    expect(prisma.notificationAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notificationId: 'notif-1',
          status: DeliveryStatus.QUEUED,
          channel: NotificationChannel.EMAIL,
        }),
      }),
    );
  });

  it('updates delivery state transitions with audit', async () => {
    prisma.notificationDelivery.update.mockResolvedValue({
      notificationId: 'notif-1',
      channel: NotificationChannel.IN_APP,
    });

    await repository.markDeliveryProcessing('delivery-1');
    await repository.markDeliveryDelivered('delivery-1', 'provider-1');
    await repository.markDeliveryFailed('delivery-1', 'failed');

    expect(prisma.notificationDelivery.update).toHaveBeenCalledTimes(3);
    expect(prisma.notificationAuditEvent.create).toHaveBeenCalledTimes(3);
  });

  it('updates notification status and writes audit', async () => {
    prisma.notification.update.mockResolvedValue({ id: 'notif-1' });

    await repository.updateNotificationStatus('notif-1', DeliveryStatus.CANCELLED);

    expect(prisma.notification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'notif-1' },
        data: expect.objectContaining({ status: DeliveryStatus.CANCELLED }),
      }),
    );
    expect(prisma.notificationAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notificationId: 'notif-1',
          status: DeliveryStatus.CANCELLED,
        }),
      }),
    );
  });

  it('searches notifications with filters and pagination', async () => {
    prisma.notification.findMany.mockResolvedValue([{ id: 'notif-1' }]);
    prisma.notification.count.mockResolvedValue(1);

    const result = await repository.searchNotifications({
      recipientId: 'user-1',
      channel: NotificationChannel.EMAIL,
      status: DeliveryStatus.DELIVERED,
      type: NotificationType.TRANSACTION,
      priority: NotificationPriority.NORMAL,
      from: new Date('2026-07-01T00:00:00.000Z'),
      to: new Date('2026-07-31T23:59:59.000Z'),
      limit: 10,
      offset: 5,
    });

    expect(result.total).toBe(1);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 10,
      }),
    );
  });

  it('manages preferences and templates', async () => {
    prisma.notificationPreference.findMany.mockResolvedValue([{ id: 'pref-1' }]);
    prisma.notificationPreference.upsert.mockResolvedValue({ id: 'pref-1' });
    prisma.notificationTemplate.findFirst.mockResolvedValue({ id: 'template-1' });
    prisma.notificationTemplate.findMany.mockResolvedValue([{ id: 'template-1' }]);
    prisma.notificationTemplate.upsert.mockResolvedValue({ id: 'template-1' });

    await repository.findPreferences('user-1');
    await repository.upsertPreference({
      userId: 'user-1',
      type: NotificationType.SECURITY,
      channel: NotificationChannel.EMAIL,
      enabled: true,
      timezone: 'UTC',
      language: 'en',
      quietHoursStart: null,
      quietHoursEnd: null,
    });

    await repository.findTemplate({
      code: 'auth.login',
      channel: NotificationChannel.EMAIL,
      language: 'en',
    });
    await repository.listTemplates();
    await repository.upsertTemplate({
      code: 'auth.login',
      name: 'Login',
      type: NotificationType.SECURITY,
      channel: NotificationChannel.EMAIL,
      language: 'en',
      version: 1,
      subjectTemplate: 'Login',
      bodyTemplate: 'Body',
      variables: { ipAddress: 'IP' },
    });

    expect(prisma.notificationPreference.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.notificationTemplate.upsert).toHaveBeenCalledTimes(1);
  });

  it('resolves user contact and account holder', async () => {
    prisma.user.findUnique.mockResolvedValue({ email: 'user@test.com', phoneNumber: null });
    prisma.accountHolder.findFirst.mockResolvedValue({ userId: 'user-1' });

    const contact = await repository.findUserContact('user-1');
    const owner = await repository.findPrimaryAccountHolder('acc-1');

    expect(contact?.email).toBe('user@test.com');
    expect(owner).toBe('user-1');
  });
});

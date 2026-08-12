import { NotFoundException } from '@nestjs/common';
import { DeliveryStatus, NotificationChannel, NotificationPriority, NotificationType } from '@prisma/client';
import { NotificationService } from '../notification.service';
import type { NotificationContext } from '../../events/notification.events';

describe('NotificationService', () => {
  const repository = {
    createNotification: jest.fn(),
    findNotificationById: jest.fn(),
    searchNotifications: jest.fn(),
    updateNotificationStatus: jest.fn(),
    softDeleteNotification: jest.fn(),
  };

  const mapper = {
    toNotificationDto: jest.fn(),
  };

  const policy = {
    selectChannels: jest.fn(),
  };

  const preferencesService = {
    getPreferences: jest.fn(),
  };

  const templateService = {
    resolve: jest.fn(),
  };

  const deliveryService = {
    queueAndDeliver: jest.fn(),
  };

  let service: NotificationService;

  const notificationRecord = {
    id: 'notif-1',
    userId: 'user-1',
    type: NotificationType.TRANSACTION,
    status: DeliveryStatus.QUEUED,
    priority: NotificationPriority.NORMAL,
    title: 'Transaction posted',
    body: 'Transaction body',
    templateCode: 'transaction.posted',
    templateVersion: 1,
    sourceEventType: 'transaction.posted',
    sourceAggregateId: 'txn-1',
    readAt: null,
    createdAt: new Date('2026-07-19T10:00:00.000Z'),
    deliveries: [],
    auditEvents: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationService(
      repository as never,
      mapper as never,
      policy as never,
      preferencesService as never,
      templateService as never,
      deliveryService as never,
    );
  });

  it('creates and delivers notification from domain event', async () => {
    const context: NotificationContext = {
      recipientId: 'user-1',
      type: NotificationType.TRANSACTION,
      priority: NotificationPriority.NORMAL,
      templateCode: 'transaction.posted',
      variables: { amount: '10.00' },
      sourceEventType: 'transaction.posted',
      sourceAggregateId: 'txn-1',
    };

    preferencesService.getPreferences.mockResolvedValue([
      {
        type: NotificationType.TRANSACTION,
        channel: NotificationChannel.IN_APP,
        enabled: true,
        quietHoursStart: null,
        quietHoursEnd: null,
        timezone: 'UTC',
        language: 'en',
      },
    ]);
    policy.selectChannels.mockReturnValue([NotificationChannel.IN_APP, NotificationChannel.EMAIL]);
    templateService.resolve.mockResolvedValue({
      title: 'Transaction posted',
      body: 'Your transaction posted',
      code: 'transaction.posted',
      version: 1,
      type: NotificationType.TRANSACTION,
    });
    repository.createNotification.mockResolvedValue(notificationRecord);
    repository.findNotificationById.mockResolvedValue(notificationRecord);
    mapper.toNotificationDto.mockReturnValue({ id: 'notif-1' });

    const result = await service.createFromDomainEvent(context);

    expect(result).toEqual({ id: 'notif-1' });
    expect(templateService.resolve).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'transaction.posted', channel: NotificationChannel.IN_APP }),
    );
    expect(deliveryService.queueAndDeliver).toHaveBeenCalledWith(
      expect.objectContaining({ notificationId: 'notif-1', channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL] }),
    );
  });

  it('returns null when notification processing fails', async () => {
    const context: NotificationContext = {
      recipientId: 'user-1',
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.NORMAL,
      templateCode: 'account.created',
      variables: {},
      sourceEventType: 'account.created',
      sourceAggregateId: 'acc-1',
    };

    preferencesService.getPreferences.mockRejectedValue(new Error('preference store offline'));

    const result = await service.createFromDomainEvent(context);

    expect(result).toBeNull();
  });

  it('searches notifications with defaults', async () => {
    repository.searchNotifications.mockResolvedValue({ items: [notificationRecord], total: 1 });
    mapper.toNotificationDto.mockReturnValue({ id: 'notif-1' });

    const result = await service.search({});

    expect(result.total).toBe(1);
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(0);
    expect(repository.searchNotifications).toHaveBeenCalledWith(expect.objectContaining({ limit: 50, offset: 0 }));
  });

  it('throws NotFoundException when notification does not exist', async () => {
    repository.findNotificationById.mockResolvedValue(null);

    await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
  });

  it('marks notification as read', async () => {
    repository.findNotificationById.mockResolvedValue({ ...notificationRecord, status: DeliveryStatus.READ });
    mapper.toNotificationDto.mockReturnValue({ id: 'notif-1', status: DeliveryStatus.READ });

    const result = await service.markRead('notif-1');

    expect(result).toEqual({ id: 'notif-1', status: DeliveryStatus.READ });
    expect(repository.updateNotificationStatus).toHaveBeenCalledWith('notif-1', DeliveryStatus.READ);
  });

  it('cancels notification delivery', async () => {
    repository.findNotificationById.mockResolvedValue({ ...notificationRecord, status: DeliveryStatus.CANCELLED });
    mapper.toNotificationDto.mockReturnValue({ id: 'notif-1', status: DeliveryStatus.CANCELLED });

    const result = await service.cancel('notif-1');

    expect(result).toEqual({ id: 'notif-1', status: DeliveryStatus.CANCELLED });
    expect(repository.updateNotificationStatus).toHaveBeenCalledWith('notif-1', DeliveryStatus.CANCELLED);
  });

  it('clears (soft-deletes) a notification the caller owns', async () => {
    repository.findNotificationById.mockResolvedValue(notificationRecord); // userId: user-1
    mapper.toNotificationDto.mockReturnValue({ id: 'notif-1' });

    const result = await service.clearForUser('user-1', 'notif-1');

    expect(result).toEqual({ id: 'notif-1', cleared: true });
    expect(repository.softDeleteNotification).toHaveBeenCalledWith('notif-1');
  });

  it('refuses to clear a notification owned by another user and does not delete it', async () => {
    repository.findNotificationById.mockResolvedValue({ ...notificationRecord, userId: 'user-2' });

    await expect(service.clearForUser('user-1', 'notif-1')).rejects.toThrow(NotFoundException);
    expect(repository.softDeleteNotification).not.toHaveBeenCalled();
  });
});

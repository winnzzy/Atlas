import { DeliveryStatus, NotificationChannel, NotificationPriority, NotificationType } from '@prisma/client';
import { NotificationPolicy } from '../../policies/notification.policy';
import { NotificationPreferencesService } from '../notification-preferences.service';
import { NotificationService } from '../notification.service';

describe('Notification workflow integration', () => {
  const repository = {
    createNotification: jest.fn(),
    findNotificationById: jest.fn(),
    searchNotifications: jest.fn(),
    updateNotificationStatus: jest.fn(),
    findPreferences: jest.fn(),
    upsertPreference: jest.fn(),
  };

  const mapper = {
    toNotificationDto: jest.fn(),
  };

  const validator = {
    validateQuietHours: jest.fn(),
  };

  const templateService = {
    resolve: jest.fn(),
  };

  const deliveryService = {
    queueAndDeliver: jest.fn().mockResolvedValue(DeliveryStatus.DELIVERED),
  };

  let policy: NotificationPolicy;
  let preferencesService: NotificationPreferencesService;
  let notificationService: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    policy = new NotificationPolicy();
    preferencesService = new NotificationPreferencesService(
      repository as never,
      policy,
      validator as never,
    );
    notificationService = new NotificationService(
      repository as never,
      mapper as never,
      policy,
      preferencesService,
      templateService as never,
      deliveryService as never,
    );
  });

  it('executes delivery workflow end to end', async () => {
    repository.findPreferences.mockResolvedValue([
      {
        type: NotificationType.TRANSACTION,
        channel: NotificationChannel.IN_APP,
        enabled: true,
        quietHoursStart: null,
        quietHoursEnd: null,
        timezone: 'UTC',
        language: 'en',
      },
      {
        type: NotificationType.TRANSACTION,
        channel: NotificationChannel.EMAIL,
        enabled: true,
        quietHoursStart: null,
        quietHoursEnd: null,
        timezone: 'UTC',
        language: 'en',
      },
    ]);

    templateService.resolve.mockResolvedValue({
      title: 'Transaction posted',
      body: 'Body',
      code: 'transaction.posted',
      version: 1,
      type: NotificationType.TRANSACTION,
    });

    repository.createNotification.mockResolvedValue({ id: 'notif-1' });
    repository.findNotificationById.mockResolvedValue({ id: 'notif-1' });
    mapper.toNotificationDto.mockReturnValue({ id: 'notif-1' });

    const result = await notificationService.createFromDomainEvent({
      recipientId: 'user-1',
      type: NotificationType.TRANSACTION,
      priority: NotificationPriority.NORMAL,
      templateCode: 'transaction.posted',
      variables: { amount: '10.00' },
      sourceEventType: 'transaction.posted',
      sourceAggregateId: 'txn-1',
    });

    expect(result).toEqual({ id: 'notif-1' });
    expect(deliveryService.queueAndDeliver).toHaveBeenCalledWith(
      expect.objectContaining({ channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL] }),
    );
  });

  it('executes preference workflow with defaults and update', async () => {
    repository.findPreferences.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'pref-existing' }]);
    repository.upsertPreference.mockImplementation(async (input) => ({ id: `${input.type}-${input.channel}`, ...input }));

    const defaults = await preferencesService.getPreferences('user-1');
    expect(defaults.length).toBeGreaterThan(0);

    repository.upsertPreference.mockResolvedValue({
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

    const updated = await preferencesService.updatePreference('user-1', {
      type: NotificationType.SECURITY,
      channel: NotificationChannel.EMAIL,
      enabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      timezone: 'UTC',
      language: 'en',
    });

    expect(updated.id).toBe('pref-1');
    expect(validator.validateQuietHours).toHaveBeenCalledWith('22:00', '07:00');
  });
});

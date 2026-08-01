import { DeliveryStatus, NotificationChannel } from '@prisma/client';
import { NotificationDeliveryService } from '../notification-delivery.service';

describe('NotificationDeliveryService', () => {
  const repository = {
    updateNotificationStatus: jest.fn(),
    createDelivery: jest.fn(),
    markDeliveryProcessing: jest.fn(),
    markDeliveryDelivered: jest.fn(),
    markDeliveryFailed: jest.fn(),
    findUserContact: jest.fn(),
  };

  let service: NotificationDeliveryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationDeliveryService(repository as never);
  });

  it('cancels notifications when no channels are selected', async () => {
    const result = await service.queueAndDeliver({
      notificationId: 'notif-1',
      userId: 'user-1',
      title: 'title',
      body: 'body',
      channels: [],
    });

    expect(result).toBe(DeliveryStatus.CANCELLED);
    expect(repository.updateNotificationStatus).toHaveBeenCalledWith('notif-1', DeliveryStatus.CANCELLED);
  });

  it('delivers to in-app and email channels', async () => {
    repository.createDelivery.mockResolvedValue('delivery-1');
    repository.findUserContact.mockResolvedValue({ email: 'user@test.com', phoneNumber: null });

    const result = await service.queueAndDeliver({
      notificationId: 'notif-1',
      userId: 'user-1',
      title: 'title',
      body: 'body',
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    });

    expect(result).toBe(DeliveryStatus.DELIVERED);
    expect(repository.createDelivery).toHaveBeenCalledTimes(2);
    expect(repository.markDeliveryDelivered).toHaveBeenCalledTimes(2);
    expect(repository.updateNotificationStatus).toHaveBeenCalledWith('notif-1', DeliveryStatus.DELIVERED);
  });

  it('marks delivery as failed when provider is unavailable', async () => {
    repository.findUserContact.mockResolvedValue({ email: 'user@test.com', phoneNumber: null });

    const result = await service.queueAndDeliver({
      notificationId: 'notif-1',
      userId: 'user-1',
      title: 'title',
      body: 'body',
      channels: [NotificationChannel.PUSH],
    });

    expect(result).toBe(DeliveryStatus.FAILED);
    expect(repository.createDelivery).not.toHaveBeenCalled();
    expect(repository.updateNotificationStatus).toHaveBeenCalledWith('notif-1', DeliveryStatus.FAILED);
  });

  it('marks delivery as failed when recipient contact is missing', async () => {
    repository.findUserContact.mockResolvedValue(null);

    await expect(
      service.queueAndDeliver({
        notificationId: 'notif-1',
        userId: 'user-1',
        title: 'title',
        body: 'body',
        channels: [NotificationChannel.EMAIL],
      }),
    ).rejects.toThrow('Recipient contact record was not found');

    expect(repository.createDelivery).not.toHaveBeenCalled();
  });
});

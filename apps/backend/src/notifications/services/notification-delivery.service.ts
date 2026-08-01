import { Injectable, Logger } from '@nestjs/common';
import { DeliveryStatus, NotificationChannel } from '@prisma/client';
import { NotificationRepository } from '../repositories/notification.repository'; // eslint-disable-line @typescript-eslint/consistent-type-imports

interface DeliveryProvider {
  readonly channel: NotificationChannel;
  readonly providerName: string;
  deliver(input: {
    recipient: string;
    title: string;
    body: string;
  }): Promise<{ providerMessageId?: string }>;
}

class InAppDeliveryProvider implements DeliveryProvider {
  readonly channel = NotificationChannel.IN_APP;
  readonly providerName = 'atlas-in-app';

  async deliver(): Promise<{ providerMessageId?: string }> {
    return { providerMessageId: crypto.randomUUID() };
  }
}

class EmailDeliveryProvider implements DeliveryProvider {
  readonly channel = NotificationChannel.EMAIL;
  readonly providerName = 'atlas-email';

  async deliver(): Promise<{ providerMessageId?: string }> {
    return { providerMessageId: crypto.randomUUID() };
  }
}

@Injectable()
export class NotificationDeliveryService {
  private readonly logger = new Logger(NotificationDeliveryService.name);
  private readonly providers = new Map<NotificationChannel, DeliveryProvider>([
    [NotificationChannel.IN_APP, new InAppDeliveryProvider()],
    [NotificationChannel.EMAIL, new EmailDeliveryProvider()],
  ]);

  constructor(private readonly repository: NotificationRepository) {}

  async queueAndDeliver(input: {
    notificationId: string;
    userId: string;
    title: string;
    body: string;
    channels: NotificationChannel[];
  }): Promise<DeliveryStatus> {
    if (input.channels.length === 0) {
      await this.repository.updateNotificationStatus(input.notificationId, DeliveryStatus.CANCELLED);
      return DeliveryStatus.CANCELLED;
    }

    let delivered = 0;
    let failed = 0;

    for (const channel of input.channels) {
      const provider = this.providers.get(channel);
      if (!provider) {
        failed += 1;
        continue;
      }

      const recipient = await this.resolveRecipient(input.userId, channel);
      const deliveryId = await this.repository.createDelivery({
        notificationId: input.notificationId,
        channel,
        recipient,
        provider: provider.providerName,
      });

      try {
        await this.repository.markDeliveryProcessing(deliveryId);
        const result = await provider.deliver({
          recipient,
          title: input.title,
          body: input.body,
        });
        await this.repository.markDeliveryDelivered(deliveryId, result.providerMessageId);
        delivered += 1;
      } catch (error) {
        failed += 1;
        const reason = this.errorMessage(error);
        this.logger.warn(`Notification delivery failed: ${reason}`);
        await this.repository.markDeliveryFailed(deliveryId, reason);
      }
    }

    const status = delivered > 0 ? DeliveryStatus.DELIVERED : DeliveryStatus.FAILED;
    await this.repository.updateNotificationStatus(input.notificationId, status);

    if (failed > 0 && delivered === 0) {
      return DeliveryStatus.FAILED;
    }

    return status;
  }

  private async resolveRecipient(userId: string, channel: NotificationChannel): Promise<string> {
    if (channel === NotificationChannel.IN_APP) {
      return userId;
    }

    const contact = await this.repository.findUserContact(userId);
    if (!contact) {
      throw new Error('Recipient contact record was not found');
    }

    if (channel === NotificationChannel.EMAIL) {
      return contact.email;
    }

    if (channel === NotificationChannel.SMS) {
      if (!contact.phoneNumber) {
        throw new Error('Recipient phone number was not found');
      }
      return contact.phoneNumber;
    }

    return userId;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown delivery failure';
  }
}

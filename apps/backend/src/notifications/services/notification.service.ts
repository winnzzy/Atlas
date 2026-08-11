import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DeliveryStatus, NotificationChannel } from '@prisma/client';
import type { NotificationContext } from '../events/notification.events';
import { NotificationMapper } from '../mappers/notification.mapper'; // eslint-disable-line @typescript-eslint/consistent-type-imports
import type { NotificationResponseDto, NotificationSearchResponseDto, SearchNotificationsDto } from '../dto';
import { NotificationPolicy } from '../policies/notification.policy'; // eslint-disable-line @typescript-eslint/consistent-type-imports
import { NotificationRepository } from '../repositories/notification.repository'; // eslint-disable-line @typescript-eslint/consistent-type-imports
import { NotificationDeliveryService } from './notification-delivery.service'; // eslint-disable-line @typescript-eslint/consistent-type-imports
import { NotificationPreferencesService } from './notification-preferences.service'; // eslint-disable-line @typescript-eslint/consistent-type-imports
import { NotificationTemplateService } from './notification-template.service'; // eslint-disable-line @typescript-eslint/consistent-type-imports

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly repository: NotificationRepository,
    private readonly mapper: NotificationMapper,
    private readonly policy: NotificationPolicy,
    private readonly preferencesService: NotificationPreferencesService,
    private readonly templateService: NotificationTemplateService,
    private readonly deliveryService: NotificationDeliveryService,
  ) {}

  async createFromDomainEvent(context: NotificationContext): Promise<NotificationResponseDto | null> {
    try {
      const preferences = await this.preferencesService.getPreferences(context.recipientId);
      const selectedChannels = this.policy.selectChannels(
        preferences,
        context.type,
        context.priority,
        new Date(),
      );
      const language = preferences.find((preference) => preference.type === context.type)?.language ?? 'en';
      const renderChannel = selectedChannels.includes(NotificationChannel.IN_APP)
        ? NotificationChannel.IN_APP
        : selectedChannels[0] ?? NotificationChannel.IN_APP;

      const rendered = await this.templateService.resolve({
        code: context.templateCode,
        channel: renderChannel,
        language,
        variables: context.variables,
      });

      const notification = await this.repository.createNotification({
        userId: context.recipientId,
        type: context.type,
        priority: context.priority,
        templateCode: rendered.code,
        templateVersion: rendered.version,
        title: rendered.title,
        body: rendered.body,
        variables: context.variables,
        sourceEventType: context.sourceEventType,
        sourceEventId: context.sourceEventId,
        sourceAggregateId: context.sourceAggregateId,
        expiresAt: context.expiresAt,
      });

      await this.deliveryService.queueAndDeliver({
        notificationId: notification.id,
        userId: context.recipientId,
        title: rendered.title,
        body: rendered.body,
        channels: selectedChannels,
      });

      const refreshed = await this.repository.findNotificationById(notification.id);
      return refreshed ? this.mapper.toNotificationDto(refreshed) : this.mapper.toNotificationDto(notification);
    } catch (error) {
      this.logger.warn(
        `Notification handling skipped for ${context.sourceEventType}: ${this.errorMessage(error)}`,
      );
      return null;
    }
  }

  async search(dto: SearchNotificationsDto): Promise<NotificationSearchResponseDto> {
    const limit = dto.limit ?? 50;
    const offset = dto.offset ?? 0;
    const result = await this.repository.searchNotifications({
      recipientId: dto.recipientId,
      channel: dto.channel,
      status: dto.status,
      type: dto.type,
      priority: dto.priority,
      from: dto.from ? new Date(dto.from) : undefined,
      to: dto.to ? new Date(dto.to) : undefined,
      limit,
      offset,
    });

    return {
      items: result.items.map((item) => this.mapper.toNotificationDto(item)),
      total: result.total,
      limit,
      offset,
    };
  }

  /** Search restricted to the caller's own notifications. */
  async searchForUser(userId: string, dto: SearchNotificationsDto): Promise<NotificationSearchResponseDto> {
    // recipientId is forced, so a caller cannot widen the query to another user.
    return this.search({ ...dto, recipientId: userId });
  }

  async getById(id: string): Promise<NotificationResponseDto> {
    const notification = await this.repository.findNotificationById(id);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.mapper.toNotificationDto(notification);
  }

  /** Resolves a notification only when the caller is its recipient. */
  async getByIdForUser(userId: string, id: string): Promise<NotificationResponseDto> {
    const notification = await this.repository.findNotificationById(id);
    if (!notification || notification.userId !== userId) {
      // Report not-found rather than forbidden so IDs cannot be probed.
      throw new NotFoundException('Notification not found');
    }

    return this.mapper.toNotificationDto(notification);
  }

  async markRead(id: string): Promise<NotificationResponseDto> {
    await this.repository.updateNotificationStatus(id, DeliveryStatus.READ);
    return this.getById(id);
  }

  async markReadForUser(userId: string, id: string): Promise<NotificationResponseDto> {
    await this.getByIdForUser(userId, id);
    return this.markRead(id);
  }

  async cancel(id: string): Promise<NotificationResponseDto> {
    await this.repository.updateNotificationStatus(id, DeliveryStatus.CANCELLED);
    return this.getById(id);
  }

  async cancelForUser(userId: string, id: string): Promise<NotificationResponseDto> {
    await this.getByIdForUser(userId, id);
    return this.cancel(id);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}

import { Inject, Injectable } from '@nestjs/common';
import type {
  DeliveryStatus,
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  NotificationPreferenceView,
  NotificationTemplateView,
  NotificationView,
} from '../mappers/notification.mapper';
import type { NotificationVariables } from '../events/notification.events';

export interface NotificationCreateInput {
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  templateCode: string;
  templateVersion: number;
  title: string;
  body: string;
  variables: NotificationVariables;
  sourceEventType: string;
  sourceEventId?: string;
  sourceAggregateId?: string;
  expiresAt?: Date;
}

export interface NotificationSearchInput {
  recipientId?: string;
  channel?: NotificationChannel;
  status?: DeliveryStatus;
  type?: NotificationType;
  priority?: NotificationPriority;
  from?: Date;
  to?: Date;
  limit: number;
  offset: number;
}

@Injectable()
export class NotificationRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createNotification(input: NotificationCreateInput): Promise<NotificationView> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        priority: input.priority,
        templateCode: input.templateCode,
        templateVersion: input.templateVersion,
        title: input.title,
        body: input.body,
        variables: input.variables as Prisma.InputJsonValue,
        sourceEventType: input.sourceEventType,
        sourceEventId: input.sourceEventId,
        sourceAggregateId: input.sourceAggregateId,
        expiresAt: input.expiresAt,
        auditEvents: {
          create: {
            status: 'QUEUED',
            reason: 'Notification created',
          },
        },
      },
      include: this.notificationInclude(),
    });

    return notification as unknown as NotificationView;
  }

  async createDelivery(input: {
    notificationId: string;
    channel: NotificationChannel;
    recipient: string;
    provider?: string;
  }): Promise<string> {
    const delivery = await this.prisma.notificationDelivery.create({
      data: {
        notificationId: input.notificationId,
        channel: input.channel,
        recipient: input.recipient,
        provider: input.provider,
        status: 'QUEUED',
      },
    });

    await this.createAuditEvent({
      notificationId: input.notificationId,
      status: 'QUEUED',
      channel: input.channel,
      reason: 'Delivery queued',
    });

    return delivery.id;
  }

  async markDeliveryProcessing(deliveryId: string): Promise<void> {
    const delivery = await this.prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'PROCESSING',
        processingAt: new Date(),
      },
    });

    await this.createAuditEvent({
      notificationId: delivery.notificationId,
      status: 'PROCESSING',
      channel: delivery.channel,
      reason: 'Delivery processing',
    });
  }

  async markDeliveryDelivered(deliveryId: string, providerMessageId?: string): Promise<void> {
    const delivery = await this.prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        providerMessageId,
      },
    });

    await this.createAuditEvent({
      notificationId: delivery.notificationId,
      status: 'DELIVERED',
      channel: delivery.channel,
      reason: 'Delivery completed',
    });
  }

  async markDeliveryFailed(deliveryId: string, reason: string): Promise<void> {
    const delivery = await this.prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureReason: reason,
      },
    });

    await this.createAuditEvent({
      notificationId: delivery.notificationId,
      status: 'FAILED',
      channel: delivery.channel,
      reason,
    });
  }

  async updateNotificationStatus(notificationId: string, status: DeliveryStatus): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status,
        readAt: status === 'READ' ? new Date() : undefined,
        cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
      },
    });

    await this.createAuditEvent({
      notificationId,
      status,
      reason: `Notification ${status.toLowerCase()}`,
    });
  }

  async findNotificationById(id: string): Promise<NotificationView | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: this.notificationInclude(),
    });

    return notification as unknown as NotificationView | null;
  }

  async searchNotifications(input: NotificationSearchInput): Promise<{
    items: NotificationView[];
    total: number;
  }> {
    const where: Prisma.NotificationWhereInput = {
      deletedAt: null,
      userId: input.recipientId,
      type: input.type,
      status: input.status,
      priority: input.priority,
      createdAt: this.dateRange(input.from, input.to),
      deliveries: input.channel ? { some: { channel: input.channel } } : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: this.notificationInclude(),
        orderBy: { createdAt: 'desc' },
        skip: input.offset,
        take: input.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: items as unknown as NotificationView[],
      total,
    };
  }

  async findPreferences(userId: string): Promise<NotificationPreferenceView[]> {
    const preferences = await this.prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: [{ type: 'asc' }, { channel: 'asc' }],
    });
    return preferences as unknown as NotificationPreferenceView[];
  }

  async upsertPreference(input: {
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
    enabled: boolean;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
    timezone: string;
    language: string;
  }): Promise<NotificationPreferenceView> {
    const preference = await this.prisma.notificationPreference.upsert({
      where: {
        userId_type_channel: {
          userId: input.userId,
          type: input.type,
          channel: input.channel,
        },
      },
      create: input,
      update: {
        enabled: input.enabled,
        quietHoursStart: input.quietHoursStart,
        quietHoursEnd: input.quietHoursEnd,
        timezone: input.timezone,
        language: input.language,
      },
    });

    return preference as unknown as NotificationPreferenceView;
  }

  async findTemplate(input: {
    code: string;
    channel: NotificationChannel;
    language: string;
  }): Promise<NotificationTemplateView | null> {
    const template = await this.prisma.notificationTemplate.findFirst({
      where: {
        code: input.code,
        channel: input.channel,
        language: input.language,
        isActive: true,
      },
      orderBy: { version: 'desc' },
    });

    return template as unknown as NotificationTemplateView | null;
  }

  async listTemplates(): Promise<NotificationTemplateView[]> {
    const templates = await this.prisma.notificationTemplate.findMany({
      orderBy: [{ code: 'asc' }, { channel: 'asc' }, { version: 'desc' }],
    });
    return templates as unknown as NotificationTemplateView[];
  }

  async upsertTemplate(input: {
    code: string;
    name: string;
    type: NotificationType;
    channel: NotificationChannel;
    language: string;
    version: number;
    subjectTemplate: string;
    bodyTemplate: string;
    variables: Record<string, string>;
  }): Promise<NotificationTemplateView> {
    const template = await this.prisma.notificationTemplate.upsert({
      where: {
        code_channel_language_version: {
          code: input.code,
          channel: input.channel,
          language: input.language,
          version: input.version,
        },
      },
      create: {
        ...input,
        variables: input.variables as Prisma.InputJsonValue,
      },
      update: {
        name: input.name,
        type: input.type,
        subjectTemplate: input.subjectTemplate,
        bodyTemplate: input.bodyTemplate,
        variables: input.variables as Prisma.InputJsonValue,
        isActive: true,
      },
    });

    return template as unknown as NotificationTemplateView;
  }

  async findUserContact(userId: string): Promise<{ email: string; phoneNumber: string | null } | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phoneNumber: true },
    });
  }

  async findPrimaryAccountHolder(accountId: string): Promise<string | null> {
    const holder = await this.prisma.accountHolder.findFirst({
      where: { accountId, role: 'OWNER' },
      select: { userId: true },
    });

    return holder?.userId ?? null;
  }

  private async createAuditEvent(input: {
    notificationId: string;
    status: DeliveryStatus;
    channel?: NotificationChannel;
    reason?: string;
  }): Promise<void> {
    await this.prisma.notificationAuditEvent.create({
      data: {
        notificationId: input.notificationId,
        status: input.status,
        channel: input.channel,
        reason: input.reason,
      },
    });
  }

  private notificationInclude() {
    return {
      deliveries: {
        orderBy: { createdAt: 'asc' },
      },
      auditEvents: {
        orderBy: { createdAt: 'asc' },
      },
    } satisfies Prisma.NotificationInclude;
  }

  private dateRange(from?: Date, to?: Date): Prisma.DateTimeFilter | undefined {
    if (!from && !to) {
      return undefined;
    }

    return {
      gte: from,
      lte: to,
    };
  }
}

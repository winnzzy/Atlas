import { Injectable } from '@nestjs/common';
import type {
  DeliveryStatus,
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from '@prisma/client';
import {
  NotificationAuditDto,
  NotificationDeliveryDto,
  NotificationPreferenceResponseDto,
  NotificationResponseDto,
  NotificationTemplateResponseDto,
} from '../dto';

export interface NotificationDeliveryView {
  id: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  recipient: string;
  provider: string | null;
  failureReason: string | null;
  createdAt: Date;
}

export interface NotificationAuditView {
  id: string;
  status: DeliveryStatus;
  channel: NotificationChannel | null;
  reason: string | null;
  createdAt: Date;
}

export interface NotificationView {
  id: string;
  userId: string;
  type: NotificationType;
  status: DeliveryStatus;
  priority: NotificationPriority;
  title: string;
  body: string;
  templateCode: string;
  templateVersion: number;
  sourceEventType: string;
  sourceAggregateId: string | null;
  readAt: Date | null;
  createdAt: Date;
  deliveries: NotificationDeliveryView[];
  auditEvents: NotificationAuditView[];
}

export interface NotificationPreferenceView {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  enabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
  language: string;
}

export interface NotificationTemplateView {
  id: string;
  code: string;
  name: string;
  type: NotificationType;
  channel: NotificationChannel;
  language: string;
  version: number;
  subjectTemplate: string;
  bodyTemplate: string;
  isActive: boolean;
}

@Injectable()
export class NotificationMapper {
  toNotificationDto(record: NotificationView): NotificationResponseDto {
    const dto = new NotificationResponseDto();
    dto.id = record.id;
    dto.recipientId = record.userId;
    dto.type = record.type;
    dto.status = record.status;
    dto.priority = record.priority;
    dto.title = record.title;
    dto.body = record.body;
    dto.templateCode = record.templateCode;
    dto.templateVersion = record.templateVersion;
    dto.sourceEventType = record.sourceEventType;
    dto.sourceAggregateId = record.sourceAggregateId;
    dto.readAt = record.readAt?.toISOString() ?? null;
    dto.createdAt = record.createdAt.toISOString();
    dto.deliveries = record.deliveries.map((delivery) => this.toDeliveryDto(delivery));
    dto.auditEvents = record.auditEvents.map((audit) => this.toAuditDto(audit));
    return dto;
  }

  toPreferenceDto(record: NotificationPreferenceView): NotificationPreferenceResponseDto {
    const dto = new NotificationPreferenceResponseDto();
    dto.id = record.id;
    dto.userId = record.userId;
    dto.type = record.type;
    dto.channel = record.channel;
    dto.enabled = record.enabled;
    dto.quietHoursStart = record.quietHoursStart;
    dto.quietHoursEnd = record.quietHoursEnd;
    dto.timezone = record.timezone;
    dto.language = record.language;
    return dto;
  }

  toTemplateDto(record: NotificationTemplateView): NotificationTemplateResponseDto {
    const dto = new NotificationTemplateResponseDto();
    dto.id = record.id;
    dto.code = record.code;
    dto.name = record.name;
    dto.type = record.type;
    dto.channel = record.channel;
    dto.language = record.language;
    dto.version = record.version;
    dto.subjectTemplate = record.subjectTemplate;
    dto.bodyTemplate = record.bodyTemplate;
    dto.isActive = record.isActive;
    return dto;
  }

  private toDeliveryDto(record: NotificationDeliveryView): NotificationDeliveryDto {
    const dto = new NotificationDeliveryDto();
    dto.id = record.id;
    dto.channel = record.channel;
    dto.status = record.status;
    dto.recipient = record.recipient;
    dto.provider = record.provider;
    dto.failureReason = record.failureReason;
    dto.createdAt = record.createdAt.toISOString();
    return dto;
  }

  private toAuditDto(record: NotificationAuditView): NotificationAuditDto {
    const dto = new NotificationAuditDto();
    dto.id = record.id;
    dto.status = record.status;
    dto.channel = record.channel;
    dto.reason = record.reason;
    dto.createdAt = record.createdAt.toISOString();
    return dto;
  }
}

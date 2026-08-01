import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  DeliveryStatus,
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from '@prisma/client';

export class SearchNotificationsDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  recipientId?: string;

  @ApiPropertyOptional({ enum: NotificationChannel })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({ enum: DeliveryStatus })
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationPriority })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  offset?: number;
}

export class NotificationDeliveryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: NotificationChannel })
  channel!: NotificationChannel;

  @ApiProperty({ enum: DeliveryStatus })
  status!: DeliveryStatus;

  @ApiProperty()
  recipient!: string;

  @ApiPropertyOptional()
  provider?: string | null;

  @ApiPropertyOptional()
  failureReason?: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class NotificationAuditDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: DeliveryStatus })
  status!: DeliveryStatus;

  @ApiPropertyOptional({ enum: NotificationChannel })
  channel?: NotificationChannel | null;

  @ApiPropertyOptional()
  reason?: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class NotificationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  recipientId!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ enum: DeliveryStatus })
  status!: DeliveryStatus;

  @ApiProperty({ enum: NotificationPriority })
  priority!: NotificationPriority;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  templateCode!: string;

  @ApiProperty()
  templateVersion!: number;

  @ApiProperty()
  sourceEventType!: string;

  @ApiPropertyOptional()
  sourceAggregateId?: string | null;

  @ApiPropertyOptional()
  readAt?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ type: [NotificationDeliveryDto] })
  deliveries!: NotificationDeliveryDto[];

  @ApiProperty({ type: [NotificationAuditDto] })
  auditEvents!: NotificationAuditDto[];
}

export class NotificationSearchResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  items!: NotificationResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  offset!: number;
}

export class UpdateNotificationPreferenceDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @IsString()
  quietHoursStart?: string;

  @ApiPropertyOptional({ example: '07:00' })
  @IsOptional()
  @IsString()
  quietHoursEnd?: string;

  @ApiPropertyOptional({ example: 'America/New_York' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  language?: string;
}

export class NotificationPreferenceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ enum: NotificationChannel })
  channel!: NotificationChannel;

  @ApiProperty()
  enabled!: boolean;

  @ApiPropertyOptional()
  quietHoursStart?: string | null;

  @ApiPropertyOptional()
  quietHoursEnd?: string | null;

  @ApiProperty()
  timezone!: string;

  @ApiProperty()
  language!: string;
}

export class CreateNotificationTemplateDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @ApiPropertyOptional({ default: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  version?: number;

  @ApiProperty()
  @IsString()
  subjectTemplate!: string;

  @ApiProperty()
  @IsString()
  bodyTemplate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}

export class PreviewNotificationTemplateDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @ApiPropertyOptional({ default: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  variables?: Record<string, string | number | boolean | null>;
}

export class NotificationTemplateResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ enum: NotificationChannel })
  channel!: NotificationChannel;

  @ApiProperty()
  language!: string;

  @ApiProperty()
  version!: number;

  @ApiProperty()
  subjectTemplate!: string;

  @ApiProperty()
  bodyTemplate!: string;

  @ApiProperty()
  isActive!: boolean;
}

export class NotificationPreviewResponseDto {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  templateCode!: string;

  @ApiProperty()
  version!: number;
}

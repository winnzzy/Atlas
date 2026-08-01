import { Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationType } from '@prisma/client';
import type { UpdateNotificationPreferenceDto } from '../dto';
import type { NotificationPreferenceView } from '../mappers/notification.mapper';
import { NotificationPolicy } from '../policies/notification.policy'; // eslint-disable-line @typescript-eslint/consistent-type-imports
import { NotificationRepository } from '../repositories/notification.repository'; // eslint-disable-line @typescript-eslint/consistent-type-imports
import { NotificationValidator } from '../validators/notification.validator'; // eslint-disable-line @typescript-eslint/consistent-type-imports

@Injectable()
export class NotificationPreferencesService {
  constructor(
    private readonly repository: NotificationRepository,
    private readonly policy: NotificationPolicy,
    private readonly validator: NotificationValidator,
  ) {}

  async getPreferences(userId: string): Promise<NotificationPreferenceView[]> {
    const existing = await this.repository.findPreferences(userId);
    if (existing.length > 0) {
      return existing;
    }

    return this.createDefaultPreferences(userId);
  }

  async updatePreference(
    userId: string,
    dto: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreferenceView> {
    this.validator.validateQuietHours(dto.quietHoursStart, dto.quietHoursEnd);

    return this.repository.upsertPreference({
      userId,
      type: dto.type,
      channel: dto.channel,
      enabled: dto.enabled,
      quietHoursStart: dto.quietHoursStart ?? null,
      quietHoursEnd: dto.quietHoursEnd ?? null,
      timezone: dto.timezone ?? 'America/New_York',
      language: dto.language ?? 'en',
    });
  }

  private async createDefaultPreferences(userId: string): Promise<NotificationPreferenceView[]> {
    const created: NotificationPreferenceView[] = [];

    for (const type of Object.values(NotificationType)) {
      for (const channel of Object.values(NotificationChannel)) {
        const preference = await this.repository.upsertPreference({
          userId,
          type,
          channel,
          enabled: this.policy.defaultEnabled(type, channel),
          quietHoursStart: null,
          quietHoursEnd: null,
          timezone: 'America/New_York',
          language: 'en',
        });
        created.push(preference);
      }
    }

    return created;
  }
}

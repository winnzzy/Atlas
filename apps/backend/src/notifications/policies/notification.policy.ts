import { Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationPriority, NotificationType } from '@prisma/client';
import type { NotificationPreferenceView } from '../mappers/notification.mapper';

const ACTIVE_DELIVERY_CHANNELS = new Set<NotificationChannel>([
  NotificationChannel.IN_APP,
  NotificationChannel.EMAIL,
]);

@Injectable()
export class NotificationPolicy {
  defaultEnabled(type: NotificationType, channel: NotificationChannel): boolean {
    if (type === NotificationType.MARKETING) {
      return false;
    }

    return channel === NotificationChannel.IN_APP || channel === NotificationChannel.EMAIL;
  }

  selectChannels(
    preferences: NotificationPreferenceView[],
    type: NotificationType,
    priority: NotificationPriority,
    now: Date,
  ): NotificationChannel[] {
    const selected: NotificationChannel[] = [];

    for (const preference of preferences) {
      if (preference.type !== type || !ACTIVE_DELIVERY_CHANNELS.has(preference.channel)) {
        continue;
      }

      if (!preference.enabled) {
        continue;
      }

      if (priority !== NotificationPriority.URGENT && this.isInQuietHours(preference, now)) {
        continue;
      }

      selected.push(preference.channel);
    }

    return selected;
  }

  isSupportedChannel(channel: NotificationChannel): boolean {
    return ACTIVE_DELIVERY_CHANNELS.has(channel);
  }

  private isInQuietHours(preference: NotificationPreferenceView, now: Date): boolean {
    if (!preference.quietHoursStart || !preference.quietHoursEnd) {
      return false;
    }

    const localMinutes = this.getLocalMinutes(now, preference.timezone);
    const start = this.toMinutes(preference.quietHoursStart);
    const end = this.toMinutes(preference.quietHoursEnd);

    if (start === end) {
      return false;
    }

    if (start < end) {
      return localMinutes >= start && localMinutes < end;
    }

    return localMinutes >= start || localMinutes < end;
  }

  private getLocalMinutes(now: Date, timezone: string): number {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(now);
    const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
    const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
    return hour * 60 + minute;
  }

  private toMinutes(value: string): number {
    const [hourText, minuteText] = value.split(':');
    return Number(hourText) * 60 + Number(minuteText);
  }
}

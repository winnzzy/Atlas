import { NotificationChannel, NotificationPriority, NotificationType } from '@prisma/client';
import { NotificationPolicy } from '../notification.policy';

describe('NotificationPolicy', () => {
  let policy: NotificationPolicy;

  beforeEach(() => {
    policy = new NotificationPolicy();
  });

  it('disables marketing preferences by default', () => {
    expect(policy.defaultEnabled(NotificationType.MARKETING, NotificationChannel.EMAIL)).toBe(false);
  });

  it('enables in-app and email channels by default for non-marketing notifications', () => {
    expect(policy.defaultEnabled(NotificationType.SECURITY, NotificationChannel.IN_APP)).toBe(true);
    expect(policy.defaultEnabled(NotificationType.SECURITY, NotificationChannel.EMAIL)).toBe(true);
    expect(policy.defaultEnabled(NotificationType.SECURITY, NotificationChannel.SMS)).toBe(false);
  });

  it('selects active channels based on preferences', () => {
    const selected = policy.selectChannels(
      [
        {
          type: NotificationType.TRANSACTION,
          channel: NotificationChannel.IN_APP,
          enabled: true,
          quietHoursStart: null,
          quietHoursEnd: null,
          timezone: 'UTC',
        },
        {
          type: NotificationType.TRANSACTION,
          channel: NotificationChannel.EMAIL,
          enabled: true,
          quietHoursStart: null,
          quietHoursEnd: null,
          timezone: 'UTC',
        },
        {
          type: NotificationType.TRANSACTION,
          channel: NotificationChannel.SMS,
          enabled: true,
          quietHoursStart: null,
          quietHoursEnd: null,
          timezone: 'UTC',
        },
      ] as never,
      NotificationType.TRANSACTION,
      NotificationPriority.NORMAL,
      new Date('2026-07-19T12:00:00.000Z'),
    );

    expect(selected).toEqual([NotificationChannel.IN_APP, NotificationChannel.EMAIL]);
  });

  it('skips non-urgent notifications during quiet hours', () => {
    const selected = policy.selectChannels(
      [
        {
          type: NotificationType.SECURITY,
          channel: NotificationChannel.EMAIL,
          enabled: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00',
          timezone: 'UTC',
        },
      ] as never,
      NotificationType.SECURITY,
      NotificationPriority.HIGH,
      new Date('2026-07-19T23:30:00.000Z'),
    );

    expect(selected).toEqual([]);
  });

  it('allows urgent notifications during quiet hours', () => {
    const selected = policy.selectChannels(
      [
        {
          type: NotificationType.SECURITY,
          channel: NotificationChannel.EMAIL,
          enabled: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00',
          timezone: 'UTC',
        },
      ] as never,
      NotificationType.SECURITY,
      NotificationPriority.URGENT,
      new Date('2026-07-19T23:30:00.000Z'),
    );

    expect(selected).toEqual([NotificationChannel.EMAIL]);
  });

  it('reports supported channels', () => {
    expect(policy.isSupportedChannel(NotificationChannel.IN_APP)).toBe(true);
    expect(policy.isSupportedChannel(NotificationChannel.EMAIL)).toBe(true);
    expect(policy.isSupportedChannel(NotificationChannel.PUSH)).toBe(false);
  });
});

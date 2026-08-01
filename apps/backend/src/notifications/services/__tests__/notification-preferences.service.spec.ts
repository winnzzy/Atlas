import { NotificationChannel, NotificationType } from '@prisma/client';
import { NotificationPreferencesService } from '../notification-preferences.service';

describe('NotificationPreferencesService', () => {
  const repository = {
    findPreferences: jest.fn(),
    upsertPreference: jest.fn(),
  };

  const policy = {
    defaultEnabled: jest.fn(),
  };

  const validator = {
    validateQuietHours: jest.fn(),
  };

  let service: NotificationPreferencesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationPreferencesService(repository as never, policy as never, validator as never);
  });

  it('returns existing preferences when present', async () => {
    repository.findPreferences.mockResolvedValue([{ id: 'pref-1' }]);

    const result = await service.getPreferences('user-1');

    expect(result).toEqual([{ id: 'pref-1' }]);
    expect(repository.upsertPreference).not.toHaveBeenCalled();
  });

  it('creates defaults when preferences are missing', async () => {
    repository.findPreferences.mockResolvedValue([]);
    policy.defaultEnabled.mockImplementation(
      (type: NotificationType, channel: NotificationChannel) =>
        type !== NotificationType.MARKETING && channel !== NotificationChannel.SMS,
    );
    repository.upsertPreference.mockImplementation(async (input) => ({
      id: `${input.type}-${input.channel}`,
      ...input,
    }));

    const result = await service.getPreferences('user-1');

    expect(result).toHaveLength(Object.values(NotificationType).length * Object.values(NotificationChannel).length);
    expect(repository.upsertPreference).toHaveBeenCalled();
  });

  it('updates preference with validator guard', async () => {
    repository.upsertPreference.mockResolvedValue({
      id: 'pref-1',
      userId: 'user-1',
      type: NotificationType.SECURITY,
      channel: NotificationChannel.EMAIL,
      enabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      timezone: 'America/New_York',
      language: 'en',
    });

    const result = await service.updatePreference('user-1', {
      type: NotificationType.SECURITY,
      channel: NotificationChannel.EMAIL,
      enabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    });

    expect(result.id).toBe('pref-1');
    expect(validator.validateQuietHours).toHaveBeenCalledWith('22:00', '07:00');
    expect(repository.upsertPreference).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', type: NotificationType.SECURITY }),
    );
  });
});

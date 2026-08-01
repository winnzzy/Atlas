import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { NotificationChannel, NotificationPriority, NotificationType } from '@prisma/client';
import {
  CreateNotificationTemplateDto,
  PreviewNotificationTemplateDto,
  SearchNotificationsDto,
  UpdateNotificationPreferenceDto,
} from '../../dto';
import { NotificationController } from '../notification.controller';

describe('NotificationController', () => {
  const notificationService = {
    search: jest.fn(),
    getById: jest.fn(),
    markRead: jest.fn(),
    cancel: jest.fn(),
  };

  const preferencesService = {
    getPreferences: jest.fn(),
    updatePreference: jest.fn(),
  };

  const templateService = {
    listTemplates: jest.fn(),
    createOrUpdateTemplate: jest.fn(),
    preview: jest.fn(),
  };

  const mapper = {
    toPreferenceDto: jest.fn(),
    toTemplateDto: jest.fn(),
  };

  let controller: NotificationController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new NotificationController(
      notificationService as never,
      preferencesService as never,
      templateService as never,
      mapper as never,
    );
  });

  it('has bearer auth metadata for authorization contract', () => {
    const keys = Reflect.getMetadataKeys(NotificationController).map((key) => String(key));
    expect(keys.some((key) => key.includes('swagger/apiSecurity'))).toBe(true);
  });

  it('handles search endpoint success', async () => {
    notificationService.search.mockResolvedValue({ items: [], total: 0, limit: 50, offset: 0 });

    const result = await controller.search({ limit: 10, offset: 0 });

    expect(result.total).toBe(0);
    expect(notificationService.search).toHaveBeenCalledWith({ limit: 10, offset: 0 });
  });

  it('handles get by id success and not found error', async () => {
    notificationService.getById.mockResolvedValueOnce({ id: 'notif-1' });
    notificationService.getById.mockRejectedValueOnce(new NotFoundException('Notification not found'));

    await expect(controller.getById('notif-1')).resolves.toEqual({ id: 'notif-1' });
    await expect(controller.getById('missing')).rejects.toThrow(NotFoundException);
  });

  it('handles mark read and cancel endpoints', async () => {
    notificationService.markRead.mockResolvedValue({ id: 'notif-1', status: 'READ' });
    notificationService.cancel.mockResolvedValue({ id: 'notif-1', status: 'CANCELLED' });

    const readResult = await controller.markRead('notif-1');
    const cancelResult = await controller.cancel('notif-1');

    expect(readResult.status).toBe('READ');
    expect(cancelResult.status).toBe('CANCELLED');
  });

  it('handles preference endpoints success and error', async () => {
    preferencesService.getPreferences.mockResolvedValue([{ id: 'pref-1' }]);
    mapper.toPreferenceDto.mockReturnValue({ id: 'pref-1' });

    const list = await controller.getPreferences('user-1');
    expect(list).toEqual([{ id: 'pref-1' }]);

    preferencesService.updatePreference.mockResolvedValue({ id: 'pref-2' });
    mapper.toPreferenceDto.mockReturnValueOnce({ id: 'pref-2' });

    const updated = await controller.updatePreference('user-1', {
      type: NotificationType.SECURITY,
      channel: NotificationChannel.EMAIL,
      enabled: true,
    });

    expect(updated.id).toBe('pref-2');

    preferencesService.updatePreference.mockRejectedValueOnce(new Error('bad preference'));
    await expect(
      controller.updatePreference('user-1', {
        type: NotificationType.SECURITY,
        channel: NotificationChannel.EMAIL,
        enabled: true,
      }),
    ).rejects.toThrow('bad preference');
  });

  it('handles template endpoints success and error', async () => {
    templateService.listTemplates.mockResolvedValue([{ id: 'tpl-1' }]);
    mapper.toTemplateDto.mockReturnValue({ id: 'tpl-1' });

    const templates = await controller.listTemplates();
    expect(templates).toEqual([{ id: 'tpl-1' }]);

    templateService.createOrUpdateTemplate.mockResolvedValue({ id: 'tpl-2' });
    mapper.toTemplateDto.mockReturnValueOnce({ id: 'tpl-2' });

    const upserted = await controller.upsertTemplate({
      code: 'auth.login',
      name: 'Login',
      type: NotificationType.SECURITY,
      channel: NotificationChannel.EMAIL,
      subjectTemplate: 'x',
      bodyTemplate: 'y',
    });

    expect(upserted.id).toBe('tpl-2');

    templateService.preview.mockResolvedValue({ title: 'T', body: 'B', templateCode: 'auth.login', version: 1 });
    await expect(
      controller.previewTemplate({ code: 'auth.login', channel: NotificationChannel.EMAIL }),
    ).resolves.toEqual({ title: 'T', body: 'B', templateCode: 'auth.login', version: 1 });

    templateService.preview.mockRejectedValueOnce(new Error('preview failed'));
    await expect(
      controller.previewTemplate({ code: 'missing', channel: NotificationChannel.EMAIL }),
    ).rejects.toThrow('preview failed');
  });

  it('validates search query dto constraints', async () => {
    const dto = plainToInstance(SearchNotificationsDto, {
      limit: 150,
      offset: -1,
      priority: NotificationPriority.NORMAL,
      type: NotificationType.SYSTEM,
      channel: NotificationChannel.EMAIL,
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('validates update preference dto constraints', async () => {
    const dto = plainToInstance(UpdateNotificationPreferenceDto, {
      type: 'INVALID',
      channel: NotificationChannel.EMAIL,
      enabled: 'yes',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('validates create template dto constraints', async () => {
    const dto = plainToInstance(CreateNotificationTemplateDto, {
      code: 1,
      name: 2,
      type: NotificationType.SYSTEM,
      channel: NotificationChannel.IN_APP,
      subjectTemplate: 3,
      bodyTemplate: 4,
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('validates preview template dto constraints', async () => {
    const dto = plainToInstance(PreviewNotificationTemplateDto, {
      code: 1,
      channel: 'INVALID',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});

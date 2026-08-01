import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { NotificationTemplateService } from '../notification-template.service';

describe('NotificationTemplateService', () => {
  const repository = {
    findTemplate: jest.fn(),
    upsertTemplate: jest.fn(),
    listTemplates: jest.fn(),
  };

  const validator = {
    validateTemplate: jest.fn(),
    extractTemplateVariables: jest.fn(),
  };

  let service: NotificationTemplateService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationTemplateService(repository as never, validator as never);
  });

  it('resolves and renders template variables', async () => {
    repository.findTemplate.mockResolvedValue({
      code: 'transaction.posted',
      version: 2,
      type: NotificationType.TRANSACTION,
      subjectTemplate: 'Transaction {{transactionId}}',
      bodyTemplate: 'Amount {{amount}} {{currency}}',
    });

    const result = await service.resolve({
      code: 'transaction.posted',
      channel: NotificationChannel.IN_APP,
      language: 'en',
      variables: { transactionId: 'txn-1', amount: '10.00', currency: 'USD' },
    });

    expect(result.title).toBe('Transaction txn-1');
    expect(result.body).toBe('Amount 10.00 USD');
    expect(result.version).toBe(2);
  });

  it('throws when template is missing', async () => {
    repository.findTemplate.mockResolvedValue(null);

    await expect(
      service.resolve({
        code: 'missing',
        channel: NotificationChannel.IN_APP,
        language: 'en',
        variables: {},
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates or updates template and auto-builds variable map', async () => {
    validator.extractTemplateVariables
      .mockReturnValueOnce(['accountId'])
      .mockReturnValueOnce(['reason']);
    repository.upsertTemplate.mockResolvedValue({ id: 'template-1' });

    const result = await service.createOrUpdateTemplate({
      code: 'account.closed',
      name: 'Account Closed',
      type: NotificationType.SYSTEM,
      channel: NotificationChannel.EMAIL,
      subjectTemplate: 'Account {{accountId}}',
      bodyTemplate: 'Closed for {{reason}}',
    });

    expect(result).toEqual({ id: 'template-1' });
    expect(validator.validateTemplate).toHaveBeenCalled();
    expect(repository.upsertTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { accountId: 'accountId', reason: 'reason' } }),
    );
  });

  it('lists templates', async () => {
    repository.listTemplates.mockResolvedValue([{ id: 'template-1' }]);

    const result = await service.listTemplates();

    expect(result).toEqual([{ id: 'template-1' }]);
  });

  it('previews a template', async () => {
    repository.findTemplate.mockResolvedValue({
      code: 'account.frozen',
      version: 1,
      type: NotificationType.SECURITY,
      subjectTemplate: 'Account frozen',
      bodyTemplate: 'Reason {{reason}}',
    });

    const result = await service.preview({
      code: 'account.frozen',
      channel: NotificationChannel.IN_APP,
      language: 'en',
      variables: { reason: 'review' },
    });

    expect(result).toEqual({
      title: 'Account frozen',
      body: 'Reason review',
      templateCode: 'account.frozen',
      version: 1,
    });
  });

  it('propagates validation errors from validator', async () => {
    validator.validateTemplate.mockImplementation(() => {
      throw new BadRequestException('invalid');
    });

    await expect(
      service.createOrUpdateTemplate({
        code: 'INVALID CODE',
        name: 'Invalid',
        type: NotificationType.SYSTEM,
        channel: NotificationChannel.IN_APP,
        subjectTemplate: 'x',
        bodyTemplate: 'y',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { NotificationChannel, NotificationType } from '@prisma/client';
import type {
  CreateNotificationTemplateDto,
  NotificationPreviewResponseDto,
  PreviewNotificationTemplateDto,
} from '../dto';
import { NotificationRepository } from '../repositories/notification.repository'; // eslint-disable-line @typescript-eslint/consistent-type-imports
import { NotificationValidator } from '../validators/notification.validator'; // eslint-disable-line @typescript-eslint/consistent-type-imports
import type { NotificationTemplateView } from '../mappers/notification.mapper';
import type { NotificationVariables } from '../events/notification.events';

interface TemplateDefinition {
  code: string;
  name: string;
  type: NotificationType;
  subjectTemplate: string;
  bodyTemplate: string;
  variables: Record<string, string>;
}

const DEFAULT_TEMPLATES: TemplateDefinition[] = [
  {
    code: 'account.created',
    name: 'Account Created',
    type: NotificationType.SYSTEM,
    subjectTemplate: 'Your {{accountType}} account is open',
    bodyTemplate: 'Your {{accountType}} account {{accountName}} is ready in {{currency}}.',
    variables: { accountType: 'Account type', accountName: 'Account name', currency: 'Currency' },
  },
  {
    code: 'account.frozen',
    name: 'Account Frozen',
    type: NotificationType.SECURITY,
    subjectTemplate: 'Account security restriction applied',
    bodyTemplate: 'A restriction was applied to account {{accountId}} for {{reason}}.',
    variables: { accountId: 'Account identifier', reason: 'Restriction reason' },
  },
  {
    code: 'account.closed',
    name: 'Account Closed',
    type: NotificationType.SYSTEM,
    subjectTemplate: 'Account closed',
    bodyTemplate: 'Account {{accountId}} was closed for {{reason}}.',
    variables: { accountId: 'Account identifier', reason: 'Closure reason' },
  },
  {
    code: 'transaction.posted',
    name: 'Transaction Posted',
    type: NotificationType.TRANSACTION,
    subjectTemplate: 'Transaction posted',
    bodyTemplate: '{{currency}} {{amount}} {{transactionType}} was posted to your account.',
    variables: { currency: 'Currency', amount: 'Amount', transactionType: 'Transaction type' },
  },
  {
    code: 'transaction.failed',
    name: 'Transaction Failed',
    type: NotificationType.TRANSACTION,
    subjectTemplate: 'Transaction failed',
    bodyTemplate: 'Your {{transactionType}} transaction could not be completed: {{reason}}.',
    variables: { transactionType: 'Transaction type', reason: 'Failure reason' },
  },
  {
    code: 'transaction.reversed',
    name: 'Transaction Reversed',
    type: NotificationType.TRANSACTION,
    subjectTemplate: 'Transaction reversed',
    bodyTemplate: 'Transaction {{transactionId}} was reversed for {{reason}}.',
    variables: { transactionId: 'Transaction identifier', reason: 'Reversal reason' },
  },
  {
    code: 'transfer.created',
    name: 'Transfer Created',
    type: NotificationType.TRANSFER,
    subjectTemplate: 'Transfer created',
    bodyTemplate: 'Your {{transferType}} transfer for {{currency}} {{amount}} was created.',
    variables: { transferType: 'Transfer type', currency: 'Currency', amount: 'Amount' },
  },
  {
    code: 'transfer.completed',
    name: 'Transfer Completed',
    type: NotificationType.TRANSFER,
    subjectTemplate: 'Transfer completed',
    bodyTemplate: 'Transfer {{transferId}} completed with status {{status}}.',
    variables: { transferId: 'Transfer identifier', status: 'Transfer status' },
  },
  {
    code: 'transfer.failed',
    name: 'Transfer Failed',
    type: NotificationType.TRANSFER,
    subjectTemplate: 'Transfer failed',
    bodyTemplate: 'Transfer {{transferId}} failed: {{reason}}.',
    variables: { transferId: 'Transfer identifier', reason: 'Failure reason' },
  },
  {
    code: 'card.issued',
    name: 'Card Issued',
    type: NotificationType.CARD,
    subjectTemplate: 'Card issued',
    bodyTemplate: 'Your {{cardType}} card ending in {{cardId}} was issued.',
    variables: { cardType: 'Card type', cardId: 'Card identifier' },
  },
  {
    code: 'card.activated',
    name: 'Card Activated',
    type: NotificationType.CARD,
    subjectTemplate: 'Card activated',
    bodyTemplate: 'Card {{cardId}} is now active.',
    variables: { cardId: 'Card identifier' },
  },
  {
    code: 'card.frozen',
    name: 'Card Frozen',
    type: NotificationType.CARD,
    subjectTemplate: 'Card frozen',
    bodyTemplate: 'Card {{cardId}} was frozen for {{reason}}.',
    variables: { cardId: 'Card identifier', reason: 'Freeze reason' },
  },
  {
    code: 'card.cancelled',
    name: 'Card Cancelled',
    type: NotificationType.CARD,
    subjectTemplate: 'Card cancelled',
    bodyTemplate: 'Card {{cardId}} was cancelled for {{reason}}.',
    variables: { cardId: 'Card identifier', reason: 'Cancellation reason' },
  },
  {
    code: 'investment.deposit.approved',
    name: 'Investment Deposit Approved',
    type: NotificationType.INVESTMENT,
    subjectTemplate: 'Investment deposit approved',
    bodyTemplate: 'Your investment deposit of {{amount}} for product {{productId}} was approved.',
    variables: { amount: 'Deposit amount', productId: 'Investment product identifier' },
  },
  {
    code: 'investment.withdrawal.approved',
    name: 'Investment Withdrawal Approved',
    type: NotificationType.INVESTMENT,
    subjectTemplate: 'Investment withdrawal approved',
    bodyTemplate: 'Your investment withdrawal of {{amount}} for product {{productId}} was approved.',
    variables: { amount: 'Withdrawal amount', productId: 'Investment product identifier' },
  },
  {
    code: 'investment.portfolio.updated',
    name: 'Portfolio Updated',
    type: NotificationType.INVESTMENT,
    subjectTemplate: 'Portfolio updated',
    bodyTemplate: 'Your portfolio value is {{totalValue}} after {{changeType}}.',
    variables: { totalValue: 'Portfolio total value', changeType: 'Change type' },
  },
  {
    code: 'investment.asset.price_updated',
    name: 'Asset Price Updated',
    type: NotificationType.INVESTMENT,
    subjectTemplate: 'Asset price updated',
    bodyTemplate: '{{assetSymbol}} price updated to {{currency}} {{newPrice}}.',
    variables: { assetSymbol: 'Asset symbol', currency: 'Currency', newPrice: 'New price' },
  },
  {
    code: 'auth.login',
    name: 'Login Alert',
    type: NotificationType.SECURITY,
    subjectTemplate: 'New login',
    bodyTemplate: 'A login to your Atlas account was recorded from {{ipAddress}}.',
    variables: { ipAddress: 'IP address' },
  },
  {
    code: 'auth.password_reset',
    name: 'Password Reset',
    type: NotificationType.SECURITY,
    subjectTemplate: 'Password reset completed',
    bodyTemplate: 'Your password was reset from {{ipAddress}}.',
    variables: { ipAddress: 'IP address' },
  },
  {
    code: 'auth.session_revoked',
    name: 'Session Revoked',
    type: NotificationType.SECURITY,
    subjectTemplate: 'Session revoked',
    bodyTemplate: 'A session was revoked for your Atlas account.',
    variables: {},
  },
];

@Injectable()
export class NotificationTemplateService implements OnModuleInit {
  private readonly logger = new Logger(NotificationTemplateService.name);

  constructor(
    private readonly repository: NotificationRepository,
    private readonly validator: NotificationValidator,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureDefaultTemplates();
    } catch (error) {
      this.logger.warn(`Notification templates were not bootstrapped: ${this.errorMessage(error)}`);
    }
  }

  async resolve(input: {
    code: string;
    channel: NotificationChannel;
    language: string;
    variables: NotificationVariables;
  }): Promise<{
    title: string;
    body: string;
    code: string;
    version: number;
    type: NotificationType;
  }> {
    const template = await this.repository.findTemplate(input);
    if (!template) {
      throw new NotFoundException(`Notification template ${input.code} is not active`);
    }

    return {
      title: this.render(template.subjectTemplate, input.variables),
      body: this.render(template.bodyTemplate, input.variables),
      code: template.code,
      version: template.version,
      type: template.type,
    };
  }

  async createOrUpdateTemplate(dto: CreateNotificationTemplateDto): Promise<NotificationTemplateView> {
    this.validator.validateTemplate({
      code: dto.code,
      subjectTemplate: dto.subjectTemplate,
      bodyTemplate: dto.bodyTemplate,
      type: dto.type,
      channel: dto.channel,
    });

    const variables = dto.variables ?? this.buildVariableMap(dto.subjectTemplate, dto.bodyTemplate);
    return this.repository.upsertTemplate({
      code: dto.code,
      name: dto.name,
      type: dto.type,
      channel: dto.channel,
      language: dto.language ?? 'en',
      version: dto.version ?? 1,
      subjectTemplate: dto.subjectTemplate,
      bodyTemplate: dto.bodyTemplate,
      variables,
    });
  }

  async listTemplates(): Promise<NotificationTemplateView[]> {
    return this.repository.listTemplates();
  }

  async preview(dto: PreviewNotificationTemplateDto): Promise<NotificationPreviewResponseDto> {
    const rendered = await this.resolve({
      code: dto.code,
      channel: dto.channel,
      language: dto.language ?? 'en',
      variables: dto.variables ?? {},
    });

    return {
      title: rendered.title,
      body: rendered.body,
      templateCode: rendered.code,
      version: rendered.version,
    };
  }

  private async ensureDefaultTemplates(): Promise<void> {
    for (const definition of DEFAULT_TEMPLATES) {
      for (const channel of [NotificationChannel.IN_APP, NotificationChannel.EMAIL]) {
        await this.repository.upsertTemplate({
          code: definition.code,
          name: definition.name,
          type: definition.type,
          channel,
          language: 'en',
          version: 1,
          subjectTemplate: definition.subjectTemplate,
          bodyTemplate: definition.bodyTemplate,
          variables: definition.variables,
        });
      }
    }
  }

  private render(template: string, variables: NotificationVariables): string {
    return template.replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g, (_match, key: string) => {
      const value = variables[key];
      return value === undefined || value === null ? '' : String(value);
    });
  }

  private buildVariableMap(subjectTemplate: string, bodyTemplate: string): Record<string, string> {
    const variables = [
      ...this.validator.extractTemplateVariables(subjectTemplate),
      ...this.validator.extractTemplateVariables(bodyTemplate),
    ];

    return variables.reduce<Record<string, string>>((acc, variable) => {
      acc[variable] = variable;
      return acc;
    }, {});
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}

import { Injectable, Logger } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationPriority, NotificationType } from '@prisma/client';
import { AccountService } from '../../accounts/services/account.service'; // eslint-disable-line @typescript-eslint/consistent-type-imports
import type { DomainEvent } from '../../accounts/events/account.events';
import { TransactionEventType } from '../../transactions/events/transaction.events';
import type {
  TransactionFailedEvent,
  TransactionPostedEvent,
  TransactionReversedEvent,
} from '../../transactions/events/transaction.events';
import { TransferEventType } from '../../transfers/events/transfer.events';
import type {
  TransferCompletedEvent,
  TransferCreatedEvent,
  TransferFailedEvent,
} from '../../transfers/events/transfer.events';
import { CARD_EVENT_NAMES } from '../../cards/events/card.events';
import type { CardIssuedEvent, CardStatusEvent } from '../../cards/events/card.events';
import { InvestmentEventType } from '../../investments/events/investment.events';
import type {
  AssetPriceUpdatedEvent,
  InvestmentDepositApprovedEvent,
  InvestmentWithdrawalApprovedEvent,
  PortfolioUpdatedEvent,
} from '../../investments/events/investment.events';
import { NotificationRepository } from '../repositories/notification.repository'; // eslint-disable-line @typescript-eslint/consistent-type-imports
import { NotificationService } from '../services/notification.service'; // eslint-disable-line @typescript-eslint/consistent-type-imports
import type { NotificationContext, NotificationVariables } from './notification.events';

interface AuthNotificationEvent {
  userId: string;
  eventId?: string;
  ipAddress?: string;
  occurredAt?: Date;
}

@Injectable()
export class NotificationEventHandler implements OnModuleInit {
  private readonly logger = new Logger(NotificationEventHandler.name);

  constructor(
    private readonly accountService: AccountService,
    private readonly notificationService: NotificationService,
    private readonly repository: NotificationRepository,
  ) {}

  onModuleInit(): void {
    const eventBus = this.accountService.getEventBus();
    for (const eventType of ['account.created', 'account.frozen', 'account.closed']) {
      eventBus.subscribe(eventType, (event) => {
        void this.handleAccountEvent(event);
      });
    }
  }

  @OnEvent(TransactionEventType.TRANSACTION_POSTED, { async: true })
  async handleTransactionPosted(event: TransactionPostedEvent): Promise<void> {
    await this.notifyAccountHolder(event.accountId, {
      type: NotificationType.TRANSACTION,
      priority: NotificationPriority.NORMAL,
      templateCode: 'transaction.posted',
      variables: {
        transactionId: event.transactionId,
        transactionType: event.payload.type,
        amount: event.payload.amount,
        currency: 'currency' in event.payload ? String(event.payload.currency) : 'USD',
      },
      sourceEventType: TransactionEventType.TRANSACTION_POSTED,
      sourceAggregateId: event.transactionId,
      occurredAt: event.timestamp,
    });
  }

  @OnEvent(TransactionEventType.TRANSACTION_FAILED, { async: true })
  async handleTransactionFailed(event: TransactionFailedEvent): Promise<void> {
    await this.notifyAccountHolder(event.accountId, {
      type: NotificationType.TRANSACTION,
      priority: NotificationPriority.HIGH,
      templateCode: 'transaction.failed',
      variables: {
        transactionId: event.transactionId,
        transactionType: event.payload.type,
        reason: event.payload.reason,
      },
      sourceEventType: TransactionEventType.TRANSACTION_FAILED,
      sourceAggregateId: event.transactionId,
      occurredAt: event.timestamp,
    });
  }

  @OnEvent(TransactionEventType.TRANSACTION_REVERSED, { async: true })
  async handleTransactionReversed(event: TransactionReversedEvent): Promise<void> {
    await this.notifyAccountHolder(event.accountId, {
      type: NotificationType.TRANSACTION,
      priority: NotificationPriority.HIGH,
      templateCode: 'transaction.reversed',
      variables: {
        transactionId: event.transactionId,
        reason: event.payload.reason,
        reversalId: event.payload.reversalId,
      },
      sourceEventType: TransactionEventType.TRANSACTION_REVERSED,
      sourceAggregateId: event.transactionId,
      occurredAt: event.timestamp,
    });
  }

  @OnEvent(TransferEventType.TRANSFER_CREATED, { async: true })
  async handleTransferCreated(event: TransferCreatedEvent): Promise<void> {
    await this.notifyAccountHolder(event.sourceAccountId, {
      type: NotificationType.TRANSFER,
      priority: NotificationPriority.NORMAL,
      templateCode: 'transfer.created',
      variables: {
        transferId: event.transferId,
        transferType: event.payload.type,
        amount: event.payload.amount,
        currency: event.payload.currency,
      },
      sourceEventType: TransferEventType.TRANSFER_CREATED,
      sourceAggregateId: event.transferId,
      occurredAt: event.timestamp,
    });
  }

  @OnEvent(TransferEventType.TRANSFER_COMPLETED, { async: true })
  async handleTransferCompleted(event: TransferCompletedEvent): Promise<void> {
    await this.notifyAccountHolder(event.sourceAccountId, {
      type: NotificationType.TRANSFER,
      priority: NotificationPriority.NORMAL,
      templateCode: 'transfer.completed',
      variables: {
        transferId: event.transferId,
        status: event.payload.status,
      },
      sourceEventType: TransferEventType.TRANSFER_COMPLETED,
      sourceAggregateId: event.transferId,
      occurredAt: event.timestamp,
    });
  }

  @OnEvent(TransferEventType.TRANSFER_FAILED, { async: true })
  async handleTransferFailed(event: TransferFailedEvent): Promise<void> {
    await this.notifyAccountHolder(event.sourceAccountId, {
      type: NotificationType.TRANSFER,
      priority: NotificationPriority.HIGH,
      templateCode: 'transfer.failed',
      variables: {
        transferId: event.transferId,
        reason: event.payload.reason,
      },
      sourceEventType: TransferEventType.TRANSFER_FAILED,
      sourceAggregateId: event.transferId,
      occurredAt: event.timestamp,
    });
  }

  @OnEvent(CARD_EVENT_NAMES.ISSUED, { async: true })
  async handleCardIssued(event: CardIssuedEvent): Promise<void> {
    await this.notifyCardCustomer(event, NotificationPriority.NORMAL, 'card.issued', {
      cardId: this.shortId(event.cardId),
      cardType: event.cardType,
    });
  }

  @OnEvent(CARD_EVENT_NAMES.ACTIVATED, { async: true })
  async handleCardActivated(event: CardStatusEvent): Promise<void> {
    await this.notifyCardCustomer(event, NotificationPriority.NORMAL, 'card.activated', {
      cardId: this.shortId(event.cardId),
    });
  }

  @OnEvent(CARD_EVENT_NAMES.FROZEN, { async: true })
  async handleCardFrozen(event: CardStatusEvent): Promise<void> {
    await this.notifyCardCustomer(event, NotificationPriority.HIGH, 'card.frozen', {
      cardId: this.shortId(event.cardId),
      reason: event.reason ?? 'security review',
    });
  }

  @OnEvent(CARD_EVENT_NAMES.CANCELLED, { async: true })
  async handleCardCancelled(event: CardStatusEvent): Promise<void> {
    await this.notifyCardCustomer(event, NotificationPriority.HIGH, 'card.cancelled', {
      cardId: this.shortId(event.cardId),
      reason: event.reason ?? 'requested cancellation',
    });
  }

  @OnEvent(InvestmentEventType.DEPOSIT_APPROVED, { async: true })
  async handleInvestmentDepositApproved(event: InvestmentDepositApprovedEvent): Promise<void> {
    await this.notificationService.createFromDomainEvent({
      recipientId: event.userId,
      type: NotificationType.INVESTMENT,
      priority: NotificationPriority.NORMAL,
      templateCode: 'investment.deposit.approved',
      variables: {
        depositId: event.depositId,
        productId: event.productId,
        amount: event.amount,
      },
      sourceEventType: InvestmentEventType.DEPOSIT_APPROVED,
      sourceAggregateId: event.depositId,
      occurredAt: event.timestamp,
    });
  }

  @OnEvent(InvestmentEventType.WITHDRAWAL_APPROVED, { async: true })
  async handleInvestmentWithdrawalApproved(event: InvestmentWithdrawalApprovedEvent): Promise<void> {
    await this.notificationService.createFromDomainEvent({
      recipientId: event.userId,
      type: NotificationType.INVESTMENT,
      priority: NotificationPriority.NORMAL,
      templateCode: 'investment.withdrawal.approved',
      variables: {
        withdrawalId: event.withdrawalId,
        productId: event.productId,
        amount: event.amount,
      },
      sourceEventType: InvestmentEventType.WITHDRAWAL_APPROVED,
      sourceAggregateId: event.withdrawalId,
      occurredAt: event.timestamp,
    });
  }

  @OnEvent(InvestmentEventType.PORTFOLIO_UPDATED, { async: true })
  async handlePortfolioUpdated(event: PortfolioUpdatedEvent): Promise<void> {
    await this.notificationService.createFromDomainEvent({
      recipientId: event.userId,
      type: NotificationType.INVESTMENT,
      priority: NotificationPriority.LOW,
      templateCode: 'investment.portfolio.updated',
      variables: {
        productId: event.productId,
        totalValue: event.totalValue,
        changeType: event.changeType,
      },
      sourceEventType: InvestmentEventType.PORTFOLIO_UPDATED,
      sourceAggregateId: event.productId,
      occurredAt: event.timestamp,
    });
  }

  @OnEvent(InvestmentEventType.ASSET_PRICE_UPDATED, { async: true })
  handleAssetPriceUpdated(event: AssetPriceUpdatedEvent): void {
    this.logger.debug(
      `Asset price event consumed without direct recipient: ${event.assetSymbol} ${event.currency} ${event.newPrice}`,
    );
  }

  @OnEvent('auth.login', { async: true })
  async handleLogin(event: AuthNotificationEvent): Promise<void> {
    await this.notificationService.createFromDomainEvent({
      recipientId: event.userId,
      type: NotificationType.SECURITY,
      priority: NotificationPriority.HIGH,
      templateCode: 'auth.login',
      variables: { ipAddress: event.ipAddress ?? 'unknown location' },
      sourceEventType: 'auth.login',
      sourceEventId: event.eventId,
      sourceAggregateId: event.userId,
      occurredAt: event.occurredAt,
    });
  }

  @OnEvent('auth.password_reset', { async: true })
  async handlePasswordReset(event: AuthNotificationEvent): Promise<void> {
    await this.notificationService.createFromDomainEvent({
      recipientId: event.userId,
      type: NotificationType.SECURITY,
      priority: NotificationPriority.URGENT,
      templateCode: 'auth.password_reset',
      variables: { ipAddress: event.ipAddress ?? 'unknown location' },
      sourceEventType: 'auth.password_reset',
      sourceEventId: event.eventId,
      sourceAggregateId: event.userId,
      occurredAt: event.occurredAt,
    });
  }

  @OnEvent('auth.session_revoked', { async: true })
  async handleSessionRevoked(event: AuthNotificationEvent): Promise<void> {
    await this.notificationService.createFromDomainEvent({
      recipientId: event.userId,
      type: NotificationType.SECURITY,
      priority: NotificationPriority.HIGH,
      templateCode: 'auth.session_revoked',
      variables: {},
      sourceEventType: 'auth.session_revoked',
      sourceEventId: event.eventId,
      sourceAggregateId: event.userId,
      occurredAt: event.occurredAt,
    });
  }

  private async handleAccountEvent(event: DomainEvent): Promise<void> {
    const payload = event.payload;
    if (event.eventType === 'account.created') {
      await this.notificationService.createFromDomainEvent({
        recipientId: String(payload['userId']),
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.NORMAL,
        templateCode: 'account.created',
        variables: {
          accountId: event.aggregateId,
          accountType: this.value(payload['accountType']),
          accountName: this.value(payload['name']),
          currency: this.value(payload['currency']),
        },
        sourceEventType: event.eventType,
        sourceEventId: event.eventId,
        sourceAggregateId: event.aggregateId,
        occurredAt: new Date(event.occurredAt),
      });
      return;
    }

    const userId = await this.repository.findPrimaryAccountHolder(event.aggregateId);
    if (!userId) {
      return;
    }

    const context = this.accountContext(event, userId);
    if (context) {
      await this.notificationService.createFromDomainEvent(context);
    }
  }

  private accountContext(event: DomainEvent, userId: string): NotificationContext | null {
    if (event.eventType === 'account.frozen') {
      return {
        recipientId: userId,
        type: NotificationType.SECURITY,
        priority: NotificationPriority.URGENT,
        templateCode: 'account.frozen',
        variables: {
          accountId: event.aggregateId,
          reason: this.value(event.payload['reason']),
        },
        sourceEventType: event.eventType,
        sourceEventId: event.eventId,
        sourceAggregateId: event.aggregateId,
        occurredAt: new Date(event.occurredAt),
      };
    }

    if (event.eventType === 'account.closed') {
      return {
        recipientId: userId,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.HIGH,
        templateCode: 'account.closed',
        variables: {
          accountId: event.aggregateId,
          reason: this.value(event.payload['reason']),
        },
        sourceEventType: event.eventType,
        sourceEventId: event.eventId,
        sourceAggregateId: event.aggregateId,
        occurredAt: new Date(event.occurredAt),
      };
    }

    return null;
  }

  private async notifyAccountHolder(
    accountId: string,
    context: Omit<NotificationContext, 'recipientId'>,
  ): Promise<void> {
    const userId = await this.repository.findPrimaryAccountHolder(accountId);
    if (!userId) {
      return;
    }

    await this.notificationService.createFromDomainEvent({
      recipientId: userId,
      ...context,
    });
  }

  private async notifyCardCustomer(
    event: CardStatusEvent | CardIssuedEvent,
    priority: NotificationPriority,
    templateCode: string,
    variables: NotificationVariables,
  ): Promise<void> {
    const recipientId = event.customerId ?? (await this.repository.findPrimaryAccountHolder(event.accountId));
    if (!recipientId) {
      return;
    }

    await this.notificationService.createFromDomainEvent({
      recipientId,
      type: NotificationType.CARD,
      priority,
      templateCode,
      variables,
      sourceEventType: templateCode,
      sourceAggregateId: event.cardId,
      occurredAt: new Date(),
    });
  }

  private value(value: unknown): string {
    return value === undefined || value === null ? '' : String(value);
  }

  private shortId(value: string): string {
    return value.slice(-4);
  }
}

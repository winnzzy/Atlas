import { NotificationPriority, NotificationType } from '@prisma/client';
import { CARD_EVENT_NAMES } from '../../../cards/events/card.events';
import { InvestmentEventType } from '../../../investments/events/investment.events';
import { TransactionEventType } from '../../../transactions/events/transaction.events';
import { TransferEventType } from '../../../transfers/events/transfer.events';
import { NotificationEventHandler } from '../notification-event.handler';

describe('NotificationEventHandler', () => {
  const subscribe = jest.fn();
  const accountService = {
    getEventBus: jest.fn().mockReturnValue({ subscribe }),
  };
  const notificationService = {
    createFromDomainEvent: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };
  const repository = {
    findPrimaryAccountHolder: jest.fn().mockResolvedValue('user-1'),
  };

  let handler: NotificationEventHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    accountService.getEventBus.mockReturnValue({ subscribe });
    repository.findPrimaryAccountHolder.mockResolvedValue('user-1');
    notificationService.createFromDomainEvent.mockResolvedValue({ id: 'notif-1' });
    handler = new NotificationEventHandler(
      accountService as never,
      notificationService as never,
      repository as never,
    );
  });

  it('subscribes to account domain events on module init', () => {
    handler.onModuleInit();

    expect(subscribe).toHaveBeenCalledTimes(3);
    expect(subscribe).toHaveBeenCalledWith('account.created', expect.any(Function));
    expect(subscribe).toHaveBeenCalledWith('account.frozen', expect.any(Function));
    expect(subscribe).toHaveBeenCalledWith('account.closed', expect.any(Function));
  });

  it('handles account created event', async () => {
    handler.onModuleInit();
    const callback = subscribe.mock.calls[0]?.[1] as (event: unknown) => void;

    callback({
      eventType: 'account.created',
      eventId: 'evt-1',
      aggregateId: 'acc-1',
      occurredAt: new Date('2026-07-19T10:00:00.000Z').toISOString(),
      payload: {
        userId: 'user-1',
        accountType: 'CHECKING',
        name: 'Main',
        currency: 'USD',
      },
    });

    await Promise.resolve();

    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'user-1',
        type: NotificationType.SYSTEM,
        templateCode: 'account.created',
      }),
    );
  });

  it('handles transaction notifications', async () => {
    await handler.handleTransactionPosted({
      accountId: 'acc-1',
      transactionId: 'txn-1',
      timestamp: new Date('2026-07-19T10:00:00.000Z'),
      payload: { type: 'DEPOSIT', amount: '10.00', currency: 'USD' },
    } as never);

    await handler.handleTransactionFailed({
      accountId: 'acc-1',
      transactionId: 'txn-2',
      timestamp: new Date('2026-07-19T10:00:00.000Z'),
      payload: { type: 'WITHDRAWAL', reason: 'Insufficient funds' },
    } as never);

    await handler.handleTransactionReversed({
      accountId: 'acc-1',
      transactionId: 'txn-3',
      timestamp: new Date('2026-07-19T10:00:00.000Z'),
      payload: { reason: 'Dispute', reversalId: 'rev-1' },
    } as never);

    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.TRANSACTION,
        sourceEventType: TransactionEventType.TRANSACTION_POSTED,
      }),
    );
    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.TRANSACTION,
        sourceEventType: TransactionEventType.TRANSACTION_FAILED,
      }),
    );
    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.TRANSACTION,
        sourceEventType: TransactionEventType.TRANSACTION_REVERSED,
      }),
    );
  });

  it('handles transfer notifications', async () => {
    await handler.handleTransferCreated({
      sourceAccountId: 'acc-1',
      transferId: 'trf-1',
      timestamp: new Date('2026-07-19T10:00:00.000Z'),
      payload: { type: 'INTERNAL', amount: '10.00', currency: 'USD' },
    } as never);
    await handler.handleTransferCompleted({
      sourceAccountId: 'acc-1',
      transferId: 'trf-1',
      timestamp: new Date('2026-07-19T10:00:00.000Z'),
      payload: { status: 'COMPLETED' },
    } as never);
    await handler.handleTransferFailed({
      sourceAccountId: 'acc-1',
      transferId: 'trf-1',
      timestamp: new Date('2026-07-19T10:00:00.000Z'),
      payload: { reason: 'Network error' },
    } as never);

    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({ sourceEventType: TransferEventType.TRANSFER_CREATED }),
    );
    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({ sourceEventType: TransferEventType.TRANSFER_COMPLETED }),
    );
    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({ sourceEventType: TransferEventType.TRANSFER_FAILED }),
    );
  });

  it('handles card notifications', async () => {
    await handler.handleCardIssued({
      accountId: 'acc-1',
      customerId: 'user-1',
      cardId: 'card-1234',
      cardType: 'VIRTUAL',
    } as never);
    await handler.handleCardActivated({ accountId: 'acc-1', customerId: 'user-1', cardId: 'card-1234' } as never);
    await handler.handleCardFrozen({
      accountId: 'acc-1',
      customerId: 'user-1',
      cardId: 'card-1234',
      reason: 'Risk rule',
    } as never);
    await handler.handleCardCancelled({
      accountId: 'acc-1',
      customerId: 'user-1',
      cardId: 'card-1234',
      reason: 'User request',
    } as never);

    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.CARD, sourceEventType: 'card.issued' }),
    );
    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.CARD, sourceEventType: CARD_EVENT_NAMES.ACTIVATED }),
    );
    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.CARD, sourceEventType: CARD_EVENT_NAMES.FROZEN }),
    );
    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.CARD, sourceEventType: CARD_EVENT_NAMES.CANCELLED }),
    );
  });

  it('handles investment notifications and consumes asset price updates', async () => {
    await handler.handleInvestmentDepositApproved({
      userId: 'user-1',
      depositId: 'dep-1',
      productId: 'prod-1',
      amount: 10,
      timestamp: new Date('2026-07-19T10:00:00.000Z'),
    } as never);

    await handler.handleInvestmentWithdrawalApproved({
      userId: 'user-1',
      withdrawalId: 'wd-1',
      productId: 'prod-1',
      amount: 5,
      timestamp: new Date('2026-07-19T10:00:00.000Z'),
    } as never);

    await handler.handlePortfolioUpdated({
      userId: 'user-1',
      productId: 'prod-1',
      totalValue: 100,
      changeType: 'UP',
      timestamp: new Date('2026-07-19T10:00:00.000Z'),
    } as never);

    handler.handleAssetPriceUpdated({
      assetSymbol: 'BTC',
      currency: 'USD',
      newPrice: 60000,
      previousPrice: 59000,
      changeAmount: 1000,
      changePercent: 1.69,
      timestamp: new Date('2026-07-19T10:00:00.000Z'),
    } as never);

    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({ sourceEventType: InvestmentEventType.DEPOSIT_APPROVED }),
    );
    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({ sourceEventType: InvestmentEventType.WITHDRAWAL_APPROVED }),
    );
    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({ sourceEventType: InvestmentEventType.PORTFOLIO_UPDATED }),
    );
  });

  it('handles security notifications', async () => {
    await handler.handleLogin({ userId: 'user-1', eventId: 'evt-1', ipAddress: '127.0.0.1' });
    await handler.handlePasswordReset({ userId: 'user-1', eventId: 'evt-2', ipAddress: '127.0.0.2' });
    await handler.handleSessionRevoked({ userId: 'user-1', eventId: 'evt-3' });

    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.SECURITY, sourceEventType: 'auth.login' }),
    );
    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.SECURITY, sourceEventType: 'auth.password_reset' }),
    );
    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.SECURITY, sourceEventType: 'auth.session_revoked' }),
    );
  });

  it('skips account-holder notifications when no holder exists', async () => {
    repository.findPrimaryAccountHolder.mockResolvedValueOnce(null);

    await handler.handleTransactionPosted({
      accountId: 'acc-1',
      transactionId: 'txn-1',
      timestamp: new Date('2026-07-19T10:00:00.000Z'),
      payload: { type: 'DEPOSIT', amount: '10.00', currency: 'USD' },
    } as never);

    expect(notificationService.createFromDomainEvent).not.toHaveBeenCalled();
  });

  it('uses urgent priority for account frozen notifications', async () => {
    handler.onModuleInit();
    const callback = subscribe.mock.calls.find((call) => call[0] === 'account.frozen')?.[1] as
      | ((event: unknown) => void)
      | undefined;

    expect(callback).toBeDefined();
    callback?.({
      eventType: 'account.frozen',
      eventId: 'evt-2',
      aggregateId: 'acc-1',
      occurredAt: new Date('2026-07-19T10:00:00.000Z').toISOString(),
      payload: { reason: 'Fraud' },
    });

    await Promise.resolve();

    expect(notificationService.createFromDomainEvent).toHaveBeenCalledWith(
      expect.objectContaining({ priority: NotificationPriority.URGENT, templateCode: 'account.frozen' }),
    );
  });
});

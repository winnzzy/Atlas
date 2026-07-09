export enum LedgerEventType {
  JOURNAL_POSTED = 'ledger.journal.posted',
  JOURNAL_REVERSED = 'ledger.journal.reversed',
  HOLD_CREATED = 'ledger.hold.created',
  HOLD_RELEASED = 'ledger.hold.released',
  HOLD_EXPIRED = 'ledger.hold.expired',
  BALANCE_CHANGED = 'ledger.balance.changed',
  RECONCILIATION_COMPLETED = 'ledger.reconciliation.completed',
  SETTLEMENT_COMPLETED = 'ledger.settlement.completed',
}

export class LedgerEvent {
  constructor(
    public readonly type: LedgerEventType,
    public readonly payload: Record<string, unknown>,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class JournalPostedEvent extends LedgerEvent {
  constructor(
    public readonly transactionId: string,
    public readonly postingType: string,
    public readonly totalAmount: string,
    public readonly lineCount: number,
    public readonly userId?: string,
  ) {
    super(LedgerEventType.JOURNAL_POSTED, {
      transactionId,
      postingType,
      totalAmount,
      lineCount,
      userId,
    });
  }
}

export class JournalReversedEvent extends LedgerEvent {
  constructor(
    public readonly originalTransactionId: string,
    public readonly reversalTransactionId: string,
    public readonly reason: string,
    public readonly userId?: string,
  ) {
    super(LedgerEventType.JOURNAL_REVERSED, {
      originalTransactionId,
      reversalTransactionId,
      reason,
      userId,
    });
  }
}

export class HoldCreatedEvent extends LedgerEvent {
  constructor(
    public readonly holdId: string,
    public readonly accountId: string,
    public readonly amount: string,
    public readonly reason: string,
  ) {
    super(LedgerEventType.HOLD_CREATED, {
      holdId,
      accountId,
      amount,
      reason,
    });
  }
}

export class HoldReleasedEvent extends LedgerEvent {
  constructor(
    public readonly holdId: string,
    public readonly accountId: string,
    public readonly amount: string,
    public readonly releasedAmount: string,
  ) {
    super(LedgerEventType.HOLD_RELEASED, {
      holdId,
      accountId,
      amount,
      releasedAmount,
    });
  }
}

export class BalanceChangedEvent extends LedgerEvent {
  constructor(
    public readonly accountId: string,
    public readonly previousBalance: string,
    public readonly newBalance: string,
    public readonly changeAmount: string,
    public readonly direction: 'DEBIT' | 'CREDIT',
  ) {
    super(LedgerEventType.BALANCE_CHANGED, {
      accountId,
      previousBalance,
      newBalance,
      changeAmount,
      direction,
    });
  }
}

export class ReconciliationCompletedEvent extends LedgerEvent {
  constructor(
    public readonly reconciliationId: string,
    public readonly accountId: string,
    public readonly isBalanced: boolean,
    public readonly variance?: string,
  ) {
    super(LedgerEventType.RECONCILIATION_COMPLETED, {
      reconciliationId,
      accountId,
      isBalanced,
      variance,
    });
  }
}

export class SettlementCompletedEvent extends LedgerEvent {
  constructor(
    public readonly transactionId: string,
    public readonly settledAmount: string,
  ) {
    super(LedgerEventType.SETTLEMENT_COMPLETED, {
      transactionId,
      settledAmount,
    });
  }
}

import { Money } from '../value-objects/money';
import { LedgerAccountId } from '../value-objects/ledger-account-id';
import { JournalId } from '../value-objects/journal-id';
import { PostingId } from '../value-objects/posting-id';
import { BalanceType, PostingType, ReversalReasonCode } from '../enums';

export interface DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly type?: string;
}

export class LedgerPosted implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;

  constructor(
    readonly aggregateId: string,
    readonly journalId: JournalId,
    readonly postingIds: PostingId[],
    readonly postingType: PostingType,
    readonly totalAmount: Money,
    readonly affectedAccounts: LedgerAccountId[],
  ) {
    this.eventId = `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    this.occurredAt = new Date();
  }
}

export class LedgerReversed implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;

  constructor(
    readonly aggregateId: string,
    readonly originalJournalId: JournalId,
    readonly reversalJournalId: JournalId,
    readonly amount: Money,
    readonly reasonCode: ReversalReasonCode,
    readonly affectedAccounts: LedgerAccountId[],
  ) {
    this.eventId = `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    this.occurredAt = new Date();
  }
}

export class HoldCreated implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;

  constructor(
    readonly aggregateId: string,
    readonly holdId: string,
    readonly accountId: LedgerAccountId,
    readonly amount: Money,
    readonly expiresAt: Date,
  ) {
    this.eventId = `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    this.occurredAt = new Date();
  }
}

export class HoldReleased implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;

  constructor(
    readonly aggregateId: string,
    readonly holdId: string,
    readonly accountId: LedgerAccountId,
    readonly releasedAmount: Money,
    readonly isFullRelease: boolean,
  ) {
    this.eventId = `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    this.occurredAt = new Date();
  }
}

export class SettlementCompleted implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;

  constructor(
    readonly aggregateId: string,
    readonly settlementId: string,
    readonly journalId: JournalId,
    readonly sourceAccountId: LedgerAccountId,
    readonly destinationAccountId: LedgerAccountId,
    readonly amount: Money,
  ) {
    this.eventId = `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    this.occurredAt = new Date();
  }
}

export class BalanceChanged implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;

  constructor(
    readonly aggregateId: string,
    readonly accountId: LedgerAccountId,
    readonly balanceType: BalanceType,
    readonly previousBalance: Money,
    readonly newBalance: Money,
    readonly journalId?: JournalId,
  ) {
    this.eventId = `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    this.occurredAt = new Date();
  }
}

export class ReconciliationCompleted implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;

  constructor(
    readonly aggregateId: string,
    readonly reconciliationId: string,
    readonly balanced: boolean,
    readonly accountCount: number,
    readonly varianceTotal?: Money,
  ) {
    this.eventId = `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    this.occurredAt = new Date();
  }
}
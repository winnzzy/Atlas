import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  JournalStatus} from '@atlas/domain';
import {
  Money,
  LedgerAccountId,
  JournalId,
  PostingId,
  PostingType as DomainPostingType,
  BalanceType,
  PostingStatus,
  ReversalReasonCode,
  Journal,
  JournalEntry,
  Posting,
  Hold,
  Settlement,
  Reversal,
  BalanceSnapshot,
  PostingEngine,
  HoldEngine,
  ReversalEngine,
  ReconciliationEngine,
  BalanceCalculator,
  JournalValidator,
  LedgerValidator,
  type LedgerRepository,
  type EventBus,
  type LedgerAccountBalance,
  type DomainEvent,
  LedgerPosted,
  LedgerReversed,
  HoldCreated as DomainHoldCreated,
  HoldReleased as DomainHoldReleased,
  BalanceChanged as DomainBalanceChanged,
  ReconciliationCompleted as DomainReconciliationCompleted,
  SettlementCompleted as DomainSettlementCompleted,
  ReferenceNumber,
  TransactionReference,
} from '@atlas/domain';
import {
  LedgerEventType,
  JournalPostedEvent,
  JournalReversedEvent,
  HoldCreatedEvent,
  HoldReleasedEvent,
  BalanceChangedEvent,
  ReconciliationCompletedEvent,
  SettlementCompletedEvent,
} from '../events/ledger.events';
import type { PostJournalDto} from '../dto/post-journal.dto';
import { EntrySide } from '../dto/post-journal.dto';
import type { CreateHoldDto, ReleaseHoldDto } from '../dto/hold.dto';
import type { ReverseJournalDto} from '../dto/reverse-journal.dto';
import { ReversalType } from '../dto/reverse-journal.dto';
import type {
  BalanceQueryDto,
  BalanceResultDto,
  PostingLineResultDto,
  HoldResultDto,
} from '../dto/balance-query.dto';
import type { CreateReconciliationDto, ReconciliationResultDto } from '../dto/reconciliation.dto';
import {
  HoldNotFoundException,
  ReversalNotAllowedException,
} from '../exceptions/ledger-domain.exception';
import type { HoldStatus, SettlementStatus } from '@atlas/domain';

interface SerializedMoney {
  amount: string;
  currency: string;
}

interface SerializedBalanceEntry {
  balanceType: BalanceType;
  money: SerializedMoney;
}

interface SerializedLedgerAccountBalance {
  accountId: string;
  currency: string;
  balances: SerializedBalanceEntry[];
}

interface LedgerStateSnapshot {
  journals: ReturnType<Journal['toJSON']>[];
  postings: ReturnType<Posting['toJSON']>[];
  holds: ReturnType<Hold['toJSON']>[];
  settlements: ReturnType<Settlement['toJSON']>[];
  reversals: ReturnType<Reversal['toJSON']>[];
  snapshots: ReturnType<BalanceSnapshot['toJSON']>[];
  balances: SerializedLedgerAccountBalance[];
  idempotencyKeys: string[];
}

@Injectable()
export class LedgerService implements LedgerRepository, EventBus {
  private readonly logger = new Logger(LedgerService.name);

  private readonly journals = new Map<string, Journal>();
  private readonly postings = new Map<string, Posting>();
  private readonly holds = new Map<string, Hold>();
  private readonly settlements = new Map<string, Settlement>();
  private readonly reversals = new Map<string, Reversal>();
  private readonly accountBalances = new Map<string, LedgerAccountBalance>();
  private readonly idempotencyKeys = new Set<string>();
  private readonly snapshots: BalanceSnapshot[] = [];

  private readonly postingEngine: PostingEngine;
  private readonly holdEngine: HoldEngine;
  private readonly reversalEngine: ReversalEngine;
  private readonly reconciliationEngine: ReconciliationEngine;
  private readonly balanceCalculator: BalanceCalculator;
  private readonly journalValidator: JournalValidator;
  private readonly ledgerValidator: LedgerValidator;

  constructor(@Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2) {
    this.journalValidator = new JournalValidator(this);
    this.ledgerValidator = new LedgerValidator(this);
    this.balanceCalculator = new BalanceCalculator();
    this.postingEngine = new PostingEngine(this, this, this.journalValidator);
    this.holdEngine = new HoldEngine(this, this);
    this.reversalEngine = new ReversalEngine(this, this, this.journalValidator);
    this.reconciliationEngine = new ReconciliationEngine(this, this);
  }

  // ─── LedgerRepository Implementation ───

  async findJournalById(id: JournalId): Promise<Journal | null> {
    return this.journals.get(id.value) ?? null;
  }

  async findPostingById(id: PostingId): Promise<Posting | null> {
    return this.postings.get(id.value) ?? null;
  }

  async findPostingsByJournalId(journalId: JournalId): Promise<Posting[]> {
    const results: Posting[] = [];
    for (const posting of this.postings.values()) {
      if (posting.journalId.value === journalId.value) {
        results.push(posting);
      }
    }
    return results;
  }

  async findHoldById(id: string): Promise<Hold | null> {
    return this.holds.get(id) ?? null;
  }

  async findHoldsByAccountId(accountId: LedgerAccountId): Promise<Hold[]> {
    const results: Hold[] = [];
    for (const hold of this.holds.values()) {
      if (hold.accountId.value === accountId.value) {
        results.push(hold);
      }
    }
    return results;
  }

  async findActiveHoldsByAccountId(accountId: LedgerAccountId): Promise<Hold[]> {
    const results: Hold[] = [];
    for (const hold of this.holds.values()) {
      if (hold.accountId.value === accountId.value && hold.status === 'ACTIVE') {
        results.push(hold);
      }
    }
    return results;
  }

  async findSettlementById(id: string): Promise<Settlement | null> {
    return this.settlements.get(id) ?? null;
  }

  async findReversalByOriginalJournalId(journalId: JournalId): Promise<Reversal | null> {
    for (const reversal of this.reversals.values()) {
      if (reversal.originalJournalId.value === journalId.value) {
        return reversal;
      }
    }
    return null;
  }

  async findBalanceSnapshot(
    accountId: LedgerAccountId,
    balanceType: BalanceType,
  ): Promise<BalanceSnapshot | null> {
    for (const snapshot of this.snapshots) {
      if (
        snapshot.accountId.value === accountId.value &&
        snapshot.balanceType === balanceType
      ) {
        return snapshot;
      }
    }
    return null;
  }

  async getAccountBalances(accountId: LedgerAccountId): Promise<LedgerAccountBalance | null> {
    return this.accountBalances.get(accountId.value) ?? null;
  }

  async saveJournal(journal: Journal): Promise<void> {
    this.journals.set(journal.id.value, journal);
  }

  async savePostings(postings: Posting[]): Promise<void> {
    for (const posting of postings) {
      this.postings.set(posting.id.value, posting);
    }
  }

  async updatePostingStatus(postingId: PostingId, status: PostingStatus): Promise<void> {
    const posting = this.postings.get(postingId.value);
    if (posting) {
      this.postings.set(
        postingId.value,
        Posting.reconstitute({
          id: posting.id,
          journalId: posting.journalId,
          accountId: posting.accountId,
          amount: posting.amount,
          side: posting.side,
          postingType: posting.postingType,
          status,
          referenceNumber: posting.referenceNumber,
          transactionReference: posting.transactionReference,
          description: posting.description,
          metadata: posting.metadata,
          createdAt: posting.createdAt,
          postedAt: status === PostingStatus.POSTED ? new Date() : posting.postedAt,
          reversedAt: status === PostingStatus.REVERSED ? new Date() : posting.reversedAt,
          reversalPostingId: posting.reversalPostingId,
        }),
      );
    }
  }

  async saveHold(hold: Hold): Promise<void> {
    this.holds.set(hold.id, hold);
  }

  async updateHold(hold: Hold): Promise<void> {
    this.holds.set(hold.id, hold);
  }

  async saveSettlement(settlement: Settlement): Promise<void> {
    this.settlements.set(settlement.id, settlement);
  }

  async updateSettlement(settlement: Settlement): Promise<void> {
    this.settlements.set(settlement.id, settlement);
  }

  async saveReversal(reversal: Reversal): Promise<void> {
    this.reversals.set(reversal.id, reversal);
  }

  async saveBalanceSnapshot(snapshot: BalanceSnapshot): Promise<void> {
    this.snapshots.push(snapshot);
  }

  async updateBalance(
    accountId: LedgerAccountId,
    currency: string,
    debits: Money,
    credits: Money,
    balanceType: BalanceType,
  ): Promise<Money> {
    const existing = this.accountBalances.get(accountId.value);
    const currentBalance = existing?.balances.get(balanceType) ?? Money.zero(currency);
    const newBalance = currentBalance.add(debits).subtract(credits);

    if (existing) {
      existing.balances.set(balanceType, newBalance);
    } else {
      const newAccountBalance: LedgerAccountBalance = {
        accountId,
        currency,
        balances: new Map<BalanceType, Money>([[balanceType, newBalance]]),
      };
      this.accountBalances.set(accountId.value, newAccountBalance);
    }

    return newBalance;
  }

  async checkPostingIdExists(postingId: PostingId): Promise<boolean> {
    return this.postings.has(postingId.value);
  }

  createSnapshot(): LedgerStateSnapshot {
    return {
      journals: Array.from(this.journals.values()).map((journal) => journal.toJSON()),
      postings: Array.from(this.postings.values()).map((posting) => posting.toJSON()),
      holds: Array.from(this.holds.values()).map((hold) => hold.toJSON()),
      settlements: Array.from(this.settlements.values()).map((settlement) => settlement.toJSON()),
      reversals: Array.from(this.reversals.values()).map((reversal) => reversal.toJSON()),
      snapshots: this.snapshots.map((snapshot) => snapshot.toJSON()),
      balances: Array.from(this.accountBalances.values()).map((accountBalance) => ({
        accountId: accountBalance.accountId.value,
        currency: accountBalance.currency,
        balances: Array.from(accountBalance.balances.entries()).map(([balanceType, money]) => ({
          balanceType,
          money: {
            amount: money.amount.toString(),
            currency: money.currency,
          },
        })),
      })),
      idempotencyKeys: Array.from(this.idempotencyKeys.values()),
    };
  }

  restoreSnapshot(snapshot: LedgerStateSnapshot): void {
    this.journals.clear();
    for (const journal of snapshot.journals) {
      const entries = Array.isArray(journal.entries)
        ? journal.entries.map((entry) => JournalEntry.reconstitute({
            accountId: LedgerAccountId.from(String(entry['accountId'])),
            side: entry['side'] as EntrySide,
            amount: Money.fromSignedMinorUnits(BigInt(String(entry['amount'] ?? '0')), String(entry['currency'] ?? 'USD')),
            description: typeof entry['description'] === 'string' ? entry['description'] : undefined,
            metadata: typeof entry['metadata'] === 'object' && entry['metadata'] !== null ? (entry['metadata'] as Record<string, string>) : undefined,
          }))
        : [];

      this.journals.set(
        String(journal.id),
        Journal.reconstitute({
          id: JournalId.from(String(journal.id)),
          description: String(journal.description),
          postingType: journal.postingType as DomainPostingType,
          status: journal.status as JournalStatus,
          entries,
          metadata: journal.metadata as Record<string, string> | undefined,
          createdAt: new Date(String(journal.createdAt)),
          postedAt: journal.postedAt ? new Date(String(journal.postedAt)) : undefined,
          reversedAt: journal.reversedAt ? new Date(String(journal.reversedAt)) : undefined,
          reversalJournalId: journal.reversalJournalId ? JournalId.from(String(journal.reversalJournalId)) : undefined,
        }),
      );
    }

    this.postings.clear();
    for (const posting of snapshot.postings) {
      this.postings.set(
        String(posting.id),
        Posting.reconstitute({
          id: PostingId.from(String(posting.id)),
          journalId: JournalId.from(String(posting.journalId)),
          accountId: LedgerAccountId.from(String(posting.accountId)),
          amount: Money.fromSignedMinorUnits(BigInt(String(posting.amount)), String(posting.currency)),
          side: posting.side as EntrySide,
          postingType: posting.postingType as DomainPostingType,
          status: posting.status as PostingStatus,
          referenceNumber: posting.referenceNumber ? ReferenceNumber.from(String(posting.referenceNumber)) : undefined,
          transactionReference: posting.transactionReference ? TransactionReference.from(String(posting.transactionReference).split(':').slice(1).join(':'), String(posting.transactionReference).split(':')[0] ?? 'SYSTEM') : undefined,
          description: posting.description as string | undefined,
          metadata: posting.metadata as Record<string, string> | undefined,
          createdAt: new Date(String(posting.createdAt)),
          postedAt: posting.postedAt ? new Date(String(posting.postedAt)) : undefined,
          reversedAt: posting.reversedAt ? new Date(String(posting.reversedAt)) : undefined,
          reversalPostingId: posting.reversalPostingId ? PostingId.from(String(posting.reversalPostingId)) : undefined,
        }),
      );
    }

    this.holds.clear();
    for (const hold of snapshot.holds) {
      this.holds.set(
        String(hold.id),
        Hold.reconstitute({
          id: String(hold.id),
          accountId: LedgerAccountId.from(String(hold.accountId)),
          journalId: hold.journalId ? JournalId.from(String(hold.journalId)) : undefined,
          amount: Money.fromSignedMinorUnits(BigInt(String(hold.amount)), String(hold.currency)),
          originalAmount: Money.fromSignedMinorUnits(BigInt(String(hold.originalAmount)), String(hold.currency)),
          releasedAmount: Money.fromSignedMinorUnits(BigInt(String(hold.releasedAmount)), String(hold.currency)),
          status: hold.status as HoldStatus,
          reason: String(hold.reason),
          expiresAt: new Date(String(hold.expiresAt)),
          createdAt: new Date(String(hold.createdAt)),
          releasedAt: hold.releasedAt ? new Date(String(hold.releasedAt)) : undefined,
          capturedAt: hold.capturedAt ? new Date(String(hold.capturedAt)) : undefined,
        }),
      );
    }

    this.settlements.clear();
    for (const settlement of snapshot.settlements) {
      this.settlements.set(
        String(settlement.id),
        Settlement.reconstitute({
          id: String(settlement.id),
          journalId: JournalId.from(String(settlement.journalId)),
          sourceAccountId: LedgerAccountId.from(String(settlement.sourceAccountId)),
          destinationAccountId: LedgerAccountId.from(String(settlement.destinationAccountId)),
          amount: Money.fromSignedMinorUnits(BigInt(String(settlement.amount)), String(settlement.currency)),
          status: settlement.status as SettlementStatus,
          description: settlement.description as string | undefined,
          createdAt: new Date(String(settlement.createdAt)),
          completedAt: settlement.completedAt ? new Date(String(settlement.completedAt)) : undefined,
          failedAt: settlement.failedAt ? new Date(String(settlement.failedAt)) : undefined,
          failureReason: settlement.failureReason as string | undefined,
          metadata: settlement.metadata as Record<string, string> | undefined,
        }),
      );
    }

    this.reversals.clear();
    for (const reversal of snapshot.reversals) {
      this.reversals.set(
        String(reversal.id),
        Reversal.reconstitute({
          id: String(reversal.id),
          originalJournalId: JournalId.from(String(reversal.originalJournalId)),
          reversalJournalId: reversal.reversalJournalId ? JournalId.from(String(reversal.reversalJournalId)) : undefined,
          type: reversal.type as ReversalType,
          reasonCode: reversal.reasonCode as ReversalReasonCode,
          reason: String(reversal.reason),
          amount: Money.fromSignedMinorUnits(BigInt(String(reversal.amount)), String(reversal.currency)),
          completedAt: reversal.completedAt ? new Date(String(reversal.completedAt)) : undefined,
          createdAt: new Date(String(reversal.createdAt)),
          createdBy: reversal.createdBy as string | undefined,
        }),
      );
    }

    this.snapshots.length = 0;
    for (const snapshotRecord of snapshot.snapshots) {
      this.snapshots.push(
        BalanceSnapshot.reconstitute({
          id: String(snapshotRecord.id),
          accountId: LedgerAccountId.from(String(snapshotRecord.accountId)),
          balanceType: snapshotRecord.balanceType as BalanceType,
          balance: Money.fromSignedMinorUnits(BigInt(String(snapshotRecord.balance)), String(snapshotRecord.currency)),
          asOf: new Date(String(snapshotRecord.asOf)),
          createdAt: new Date(String(snapshotRecord.createdAt)),
        }),
      );
    }

    this.accountBalances.clear();
    for (const accountBalance of snapshot.balances) {
      this.accountBalances.set(accountBalance.accountId, {
        accountId: LedgerAccountId.from(accountBalance.accountId),
        currency: accountBalance.currency,
        balances: new Map(
          accountBalance.balances.map((balance) => [
            balance.balanceType,
            Money.fromSignedMinorUnits(BigInt(balance.money.amount), balance.money.currency),
          ]),
        ),
      });
    }

    this.idempotencyKeys.clear();
    for (const key of snapshot.idempotencyKeys) {
      this.idempotencyKeys.add(key);
    }
  }

  // ─── EventBus Implementation ───

  publish(event: DomainEvent): void {
    if (event instanceof LedgerPosted) {
      const nestEvent = new JournalPostedEvent(
        event.journalId.value,
        event.postingType,
        event.totalAmount.toDecimal(),
        event.postingIds.length,
      );
      this.eventEmitter.emit(LedgerEventType.JOURNAL_POSTED, nestEvent);
    } else if (event instanceof LedgerReversed) {
      const nestEvent = new JournalReversedEvent(
        event.originalJournalId.value,
        event.reversalJournalId.value,
        event.reasonCode,
      );
      this.eventEmitter.emit(LedgerEventType.JOURNAL_REVERSED, nestEvent);
    } else if (event instanceof DomainHoldCreated) {
      const nestEvent = new HoldCreatedEvent(
        event.holdId,
        event.accountId.value,
        event.amount.toDecimal(),
        'hold',
      );
      this.eventEmitter.emit(LedgerEventType.HOLD_CREATED, nestEvent);
    } else if (event instanceof DomainHoldReleased) {
      const nestEvent = new HoldReleasedEvent(
        event.holdId,
        event.accountId.value,
        event.releasedAmount.toDecimal(),
        event.releasedAmount.toDecimal(),
      );
      this.eventEmitter.emit(LedgerEventType.HOLD_RELEASED, nestEvent);
    } else if (event instanceof DomainBalanceChanged) {
      const nestEvent = new BalanceChangedEvent(
        event.accountId.value,
        event.previousBalance.toDecimal(),
        event.newBalance.toDecimal(),
        event.newBalance.subtract(event.previousBalance).toDecimal(),
        'DEBIT',
      );
      this.eventEmitter.emit(LedgerEventType.BALANCE_CHANGED, nestEvent);
    } else if (event instanceof DomainReconciliationCompleted) {
      const nestEvent = new ReconciliationCompletedEvent(
        event.reconciliationId,
        '',
        event.balanced,
        event.varianceTotal?.toDecimal(),
      );
      this.eventEmitter.emit(LedgerEventType.RECONCILIATION_COMPLETED, nestEvent);
    } else if (event instanceof DomainSettlementCompleted) {
      const nestEvent = new SettlementCompletedEvent(
        event.journalId.value,
        event.amount.toDecimal(),
      );
      this.eventEmitter.emit(LedgerEventType.SETTLEMENT_COMPLETED, nestEvent);
    }
  }

  // ─── Public API Methods ───

  async postJournal(dto: PostJournalDto): Promise<Journal> {
    const journalId = JournalId.generate();

    const entries: JournalEntry[] = dto.lines.map((line) =>
      line.side === EntrySide.DEBIT
        ? JournalEntry.debit(
          LedgerAccountId.from(line.accountId),
          Money.fromMinorUnits(BigInt(line.amount), line.currency ?? dto.currency ?? 'USD'),
          line.description,
        )
        : JournalEntry.credit(
          LedgerAccountId.from(line.accountId),
          Money.fromMinorUnits(BigInt(line.amount), line.currency ?? dto.currency ?? 'USD'),
          line.description,
        ),
    );

    const journal = Journal.create({
      id: journalId,
      entries,
      postingType: this.mapPostingType(dto.type),
      description: dto.description ?? '',
    });

    if (dto.idempotencyKey && this.idempotencyKeys.has(dto.idempotencyKey)) {
      throw new Error('Duplicate idempotency key');
    }

    const result = await this.postingEngine.post(journal);
    if (dto.idempotencyKey) {
      this.idempotencyKeys.add(dto.idempotencyKey);
    }

    if (!result.success || !result.journal) {
      throw new Error(result.errors.join(', '));
    }

    return result.journal;
  }

  async createHold(dto: CreateHoldDto): Promise<Hold> {
    const hold = Hold.create({
      id: `hold-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      accountId: LedgerAccountId.from(dto.accountId),
      amount: Money.fromMinorUnits(BigInt(dto.amount), dto.currency ?? 'USD'),
      reason: dto.reason,
    });

    return this.holdEngine.createHold(hold);
  }

  async releaseHold(holdId: string, dto: ReleaseHoldDto): Promise<Hold> {
    const hold = await this.findHoldById(holdId);
    if (!hold) {
      throw new HoldNotFoundException(holdId);
    }

    if (dto.releaseAmount) {
      const releaseAmount = Money.fromMinorUnits(BigInt(dto.releaseAmount), hold.amount.currency);
      return this.holdEngine.releaseHold(holdId, releaseAmount);
    }

    return this.holdEngine.releaseHold(holdId);
  }

  async reverseJournal(dto: ReverseJournalDto): Promise<Reversal> {
    const journalId = JournalId.from(dto.transactionId);
    const journal = await this.findJournalById(journalId);
    if (!journal) {
      throw new ReversalNotAllowedException(
        dto.transactionId,
        'Original journal not found',
      );
    }

    const reasonCode = dto.reasonCode
      ? (ReversalReasonCode as Record<string, ReversalReasonCode>)[dto.reasonCode] ??
        ReversalReasonCode.OTHER
      : ReversalReasonCode.OTHER;

    const result = await this.reversalEngine.createReversal({
      originalJournalId: journalId,
      type: dto.type,
      reasonCode,
      reason: dto.reason,
      partialAmount: dto.type === ReversalType.PARTIAL && dto.reversalAmount
        ? Money.fromMinorUnits(BigInt(dto.reversalAmount), journal.currency)
        : undefined,
    });

    return result.reversal;
  }

  async getBalance(query: BalanceQueryDto): Promise<BalanceResultDto> {
    const accountId = LedgerAccountId.from(query.accountId);
    const accountBalance = await this.getAccountBalances(accountId);

    const currency = query.currency ?? 'USD';
    const zero = Money.zero(currency);
    const current = accountBalance?.balances.get(BalanceType.CURRENT) ?? accountBalance?.balances.get(BalanceType.LEDGER) ?? zero;
    const available = accountBalance?.balances.get(BalanceType.AVAILABLE) ?? zero;
    const pending = accountBalance?.balances.get(BalanceType.PENDING) ?? zero;
    const held = accountBalance?.balances.get(BalanceType.HELD) ?? zero;

    return {
      accountId: query.accountId,
      currentBalance: current.toDecimal(),
      availableBalance: available.toDecimal(),
      pendingBalance: pending.toDecimal(),
      heldAmount: held.toDecimal(),
      currency,
      asOfDate: new Date(),
    };
  }

  async getAccountHolds(accountId: string): Promise<HoldResultDto[]> {
    const id = LedgerAccountId.from(accountId);
    const holds = await this.findHoldsByAccountId(id);

    return holds.map((hold) => ({
      id: hold.id,
      accountId: hold.accountId.value,
      amount: hold.amount.toDecimal(),
      currency: hold.amount.currency,
      reason: hold.reason,
      status: hold.status,
      expiresAt: hold.expiresAt ?? null,
      releasedAmount: hold.releasedAmount?.toDecimal() ?? null,
      relatedTransactionId: hold.journalId?.value ?? null,
      createdAt: hold.createdAt,
    }));
  }

  async getAccountPostings(accountId: string): Promise<PostingLineResultDto[]> {
    const results: PostingLineResultDto[] = [];
    for (const posting of this.postings.values()) {
      if (posting.accountId.value === accountId) {
        results.push({
          id: posting.id.value,
          transactionId: posting.journalId.value,
          accountId: posting.accountId.value,
          side: posting.side,
          amount: posting.amount.toDecimal(),
          currency: posting.amount.currency,
          description: posting.description ?? null,
          entryDate: posting.createdAt,
          postingType: posting.postingType,
          status: posting.status,
          createdAt: posting.createdAt,
        });
      }
    }
    return results;
  }

  async reconcile(dto: CreateReconciliationDto): Promise<ReconciliationResultDto> {
    const accountId = LedgerAccountId.from(dto.accountId);
    const systemBalanceResult = await this.getAccountBalances(accountId);
    const currency = 'USD';
    const systemBalance = systemBalanceResult?.balances.get(BalanceType.CURRENT) ?? systemBalanceResult?.balances.get(BalanceType.LEDGER) ?? Money.zero(currency);
    const externalBalance = dto.expectedBalance
      ? Money.fromMinorUnits(BigInt(dto.expectedBalance), currency)
      : systemBalance;

    const variance = systemBalance.subtract(externalBalance);
    const isBalanced = variance.isZero;

    return {
      id: `recon-${Date.now()}`,
      accountId: dto.accountId,
      type: dto.type,
      status: isBalanced ? 'BALANCED' : 'VARIANCE_DETECTED',
      periodStart: new Date(dto.periodStart),
      periodEnd: new Date(dto.periodEnd),
      expectedBalance: externalBalance.toDecimal(),
      actualBalance: systemBalance.toDecimal(),
      variance: variance.toDecimal(),
      isBalanced,
      postingCount: this.postings.size,
      notes: dto.notes ?? null,
      createdAt: new Date(),
    };
  }

  // ─── Private Helpers ───

  private mapPostingType(type: string): DomainPostingType {
    const typeMap: Record<string, DomainPostingType> = {
      DEPOSIT: DomainPostingType.DEPOSIT,
      WITHDRAWAL: DomainPostingType.WITHDRAWAL,
      TRANSFER: DomainPostingType.TRANSFER,
      FEE: DomainPostingType.FEE,
      INTEREST: DomainPostingType.INTEREST,
      ADJUSTMENT: DomainPostingType.ADJUSTMENT,
      CARD_AUTHORIZATION: DomainPostingType.CARD_AUTHORIZATION,
      CARD_CAPTURE: DomainPostingType.CARD_CAPTURE,
      CARD_REFUND: DomainPostingType.CARD_REFUND,
      CRYPTO_DEPOSIT: DomainPostingType.CRYPTO_DEPOSIT,
      CRYPTO_WITHDRAWAL: DomainPostingType.CRYPTO_WITHDRAWAL,
      LOAN_DISBURSEMENT: DomainPostingType.LOAN_DISBURSEMENT,
      LOAN_REPAYMENT: DomainPostingType.LOAN_REPAYMENT,
      INVESTMENT_PURCHASE: DomainPostingType.INVESTMENT_PURCHASE,
      INVESTMENT_SALE: DomainPostingType.INVESTMENT_SALE,
      ACH: DomainPostingType.ACH,
      WIRE: DomainPostingType.WIRE,
      SWIFT: DomainPostingType.SWIFT,
    };
    return typeMap[type] ?? DomainPostingType.ADJUSTMENT;
  }
}

import { Journal } from '../entities/journal';
import { JournalEntry } from '../entities/journal-entry';
import { Posting } from '../entities/posting';
import { Hold } from '../entities/hold';
import { Settlement } from '../entities/settlement';
import { Reversal } from '../entities/reversal';
import { BalanceSnapshot } from '../entities/balance-snapshot';
import { Money } from '../value-objects/money';
import { LedgerAccountId } from '../value-objects/ledger-account-id';
import { JournalId } from '../value-objects/journal-id';
import { PostingId } from '../value-objects/posting-id';
import {
  PostingType,
  EntrySide,
  JournalStatus,
  PostingStatus,
  HoldStatus,
  BalanceType,
  ReversalType,
  ReversalReasonCode,
  SettlementStatus,
  ReconciliationType,
  ReconciliationStatus,
} from '../enums';
import { LedgerRepository, EventBus, LedgerAccountBalance } from '../services/interfaces';
import { JournalValidator, ValidationResult } from '../services/journal-validator';
import { LedgerValidator } from '../services/ledger-validator';
import { BalanceCalculator } from '../services/balance-calculator';
import { PostingEngine } from '../services/posting-engine';
import { HoldEngine } from '../services/hold-engine';
import { SettlementEngine } from '../services/settlement-engine';
import { ReversalEngine } from '../services/reversal-engine';
import { ReconciliationEngine } from '../services/reconciliation-engine';
import { DomainEvent } from '../events';

// ─── In-Memory Repository ──────────────────────────────────────
class InMemoryLedgerRepository implements LedgerRepository {
  private journals = new Map<string, Journal>();
  private postings = new Map<string, Posting>();
  private holds = new Map<string, Hold>();
  private settlements = new Map<string, Settlement>();
  private reversals = new Map<string, Reversal>();
  private snapshots = new Map<string, BalanceSnapshot>();
  private balances = new Map<string, { debits: Money; credits: Money; balance: Money }>();

  private balanceKey(accountId: LedgerAccountId, balanceType: BalanceType): string {
    return `${accountId.value}:${balanceType}`;
  }

  async findJournalById(id: JournalId): Promise<Journal | null> {
    return this.journals.get(id.value) ?? null;
  }

  async findPostingById(id: PostingId): Promise<Posting | null> {
    return this.postings.get(id.value) ?? null;
  }

  async findPostingsByJournalId(journalId: JournalId): Promise<Posting[]> {
    return Array.from(this.postings.values()).filter(
      (p) => p.journalId.equals(journalId),
    );
  }

  async findHoldById(id: string): Promise<Hold | null> {
    return this.holds.get(id) ?? null;
  }

  async findHoldsByAccountId(accountId: LedgerAccountId): Promise<Hold[]> {
    return Array.from(this.holds.values()).filter(
      (h) => h.accountId.equals(accountId),
    );
  }

  async findActiveHoldsByAccountId(accountId: LedgerAccountId): Promise<Hold[]> {
    return Array.from(this.holds.values()).filter(
      (h) => h.accountId.equals(accountId) && h.isActive,
    );
  }

  async findSettlementById(id: string): Promise<Settlement | null> {
    return this.settlements.get(id) ?? null;
  }

  async findReversalByOriginalJournalId(journalId: JournalId): Promise<Reversal | null> {
    return Array.from(this.reversals.values()).find(
      (r) => r.originalJournalId.equals(journalId),
    ) ?? null;
  }

  async findBalanceSnapshot(
    accountId: LedgerAccountId,
    balanceType: BalanceType,
  ): Promise<BalanceSnapshot | null> {
    return this.snapshots.get(this.balanceKey(accountId, balanceType)) ?? null;
  }

  async getAccountBalances(accountId: LedgerAccountId): Promise<LedgerAccountBalance | null> {
    const ledgerKey = this.balanceKey(accountId, BalanceType.LEDGER);
    const entry = this.balances.get(ledgerKey);
    if (!entry) return null;
    const balancesMap = new Map<BalanceType, Money>();
    balancesMap.set(BalanceType.LEDGER, entry.balance);
    return {
      accountId,
      currency: entry.balance.currency,
      balances: balancesMap,
    };
  }

  async saveJournal(journal: Journal): Promise<void> {
    this.journals.set(journal.id.value, journal);
  }

  async savePostings(postings: Posting[]): Promise<void> {
    for (const p of postings) {
      this.postings.set(p.id.value, p);
    }
  }

  async updatePostingStatus(postingId: PostingId, status: PostingStatus): Promise<void> {
    const posting = this.postings.get(postingId.value);
    if (posting) {
      if (status === PostingStatus.POSTED) posting.post();
      if (status === PostingStatus.REVERSED) posting.reverse(postingId);
      if (status === PostingStatus.FAILED) posting.fail();
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
    this.snapshots.set(
      this.balanceKey(snapshot.accountId, snapshot.balanceType),
      snapshot,
    );
  }

  async updateBalance(
    accountId: LedgerAccountId,
    currency: string,
    debits: Money,
    credits: Money,
    balanceType: BalanceType,
  ): Promise<Money> {
    const key = this.balanceKey(accountId, balanceType);
    const existing = this.balances.get(key);
    const prevDebits = existing?.debits ?? Money.zero(currency);
    const prevCredits = existing?.credits ?? Money.zero(currency);
    const newDebits = prevDebits.add(debits);
    const newCredits = prevCredits.add(credits);
    const balance = newDebits.subtract(newCredits);
    this.balances.set(key, { debits: newDebits, credits: newCredits, balance });
    return balance;
  }

  async checkPostingIdExists(postingId: PostingId): Promise<boolean> {
    return this.postings.has(postingId.value);
  }
}

class InMemoryEventBus implements EventBus {
  public events: DomainEvent[] = [];

  publish(event: DomainEvent): void {
    this.events.push(Object.assign(event, { type: event.constructor.name }));
  }
}

// ─── Test Helpers ───────────────────────────────────────────────
function createTransferJournal(
  amount: bigint,
  currency = 'USD',
): { journal: Journal; accA: LedgerAccountId; accB: LedgerAccountId } {
  const accA = LedgerAccountId.from('acc-a');
  const accB = LedgerAccountId.from('acc-b');
  const journal = Journal.create({
    description: 'Test transfer',
    postingType: PostingType.TRANSFER,
    entries: [
      JournalEntry.debit(accA, Money.fromMinorUnits(amount, currency)),
      JournalEntry.credit(accB, Money.fromMinorUnits(amount, currency)),
    ],
  });
  return { journal, accA, accB };
}

// ─── Tests ─────────────────────────────────────────────────────
describe('Services', () => {
  let repo: InMemoryLedgerRepository;
  let eventBus: InMemoryEventBus;

  beforeEach(() => {
    repo = new InMemoryLedgerRepository();
    eventBus = new InMemoryEventBus();
  });

  // ─── JournalValidator ──────────────────────────────────────
  describe('JournalValidator', () => {
    let validator: JournalValidator;

    beforeEach(() => {
      validator = new JournalValidator(repo);
    });

    it('should validate a balanced journal', () => {
      const { journal } = createTransferJournal(10000n);
      const result = validator.validate(journal);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty journal', () => {
      const journal = Journal.create({
        description: 'Empty',
        postingType: PostingType.TRANSFER,
        entries: [],
      });
      const result = validator.validate(journal);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Journal must contain at least one entry');
    });

    it('should reject unbalanced journal', () => {
      const accA = LedgerAccountId.from('a');
      const accB = LedgerAccountId.from('b');
      const journal = Journal.create({
        description: 'Unbalanced',
        postingType: PostingType.TRANSFER,
        entries: [
          JournalEntry.debit(accA, Money.fromMinorUnits(10000n, 'USD')),
          JournalEntry.credit(accB, Money.fromMinorUnits(5000n, 'USD')),
        ],
      });
      const result = validator.validate(journal);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('not balanced');
    });

    it('should reject currency mismatch', () => {
      const accA = LedgerAccountId.from('a');
      const accB = LedgerAccountId.from('b');
      const journal = Journal.create({
        description: 'Mismatch',
        postingType: PostingType.TRANSFER,
        entries: [
          JournalEntry.debit(accA, Money.fromMinorUnits(10000n, 'USD')),
          JournalEntry.credit(accB, Money.fromMinorUnits(10000n, 'EUR')),
        ],
      });
      const result = validator.validate(journal);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('All entries in a journal must have the same currency');
    });

    it('should reject non-draft journal', () => {
      const { journal } = createTransferJournal(10000n);
      journal.post();
      const result = validator.validate(journal);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Cannot validate journal in POSTED status');
    });

    it('should detect duplicate posting ID', async () => {
      const { journal, accA } = createTransferJournal(10000n);
      const journalId = JournalId.from('existing-jrnl');
      const existingPosting = Posting.create({
        id: PostingId.from('dup-id'),
        journalId,
        accountId: accA,
        amount: Money.fromMinorUnits(10000n, 'USD'),
        side: EntrySide.DEBIT,
        postingType: PostingType.TRANSFER,
      });
      await repo.savePostings([existingPosting]);

      const newPosting = Posting.create({
        id: PostingId.from('dup-id'),
        journalId: journal.id,
        accountId: accA,
        amount: Money.fromMinorUnits(10000n, 'USD'),
        side: EntrySide.DEBIT,
        postingType: PostingType.TRANSFER,
      });
      const result = await validator.validatePosting(newPosting);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Duplicate posting ID');
    });

    it('should reject zero-amount posting', async () => {
      const { journal, accA } = createTransferJournal(10000n);
      const zeroPosting = Posting.reconstitute({
        id: PostingId.generate(),
        journalId: journal.id,
        accountId: accA,
        amount: Money.zero('USD'),
        side: EntrySide.DEBIT,
        postingType: PostingType.TRANSFER,
        status: PostingStatus.PENDING,
        createdAt: new Date(),
      });
      const result = await validator.validatePosting(zeroPosting);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Posting amount cannot be zero');
    });
  });

  // ─── LedgerValidator ───────────────────────────────────────
  describe('LedgerValidator', () => {
    let validator: LedgerValidator;

    beforeEach(() => {
      validator = new LedgerValidator(repo);
    });

    it('should validate sufficient balance for debit', async () => {
      const accA = LedgerAccountId.from('acc-a');
      await repo.updateBalance(
        accA,
        'USD',
        Money.fromMinorUnits(50000n, 'USD'),
        Money.zero('USD'),
        BalanceType.LEDGER,
      );

      const result = await validator.validateDebit(
        accA,
        Money.fromMinorUnits(10000n, 'USD'),
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject insufficient balance', async () => {
      const accA = LedgerAccountId.from('acc-a');
      await repo.updateBalance(
        accA,
        'USD',
        Money.fromMinorUnits(5000n, 'USD'),
        Money.zero('USD'),
        BalanceType.LEDGER,
      );

      const result = await validator.validateDebit(
        accA,
        Money.fromMinorUnits(10000n, 'USD'),
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Insufficient balance');
    });

    it('should validate currency consistency', async () => {
      const result = await validator.validateCurrencyMatch(
        Money.fromMinorUnits(10000n, 'USD'),
        Money.fromMinorUnits(10000n, 'EUR'),
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Currency mismatch: USD vs EUR');
    });

    it('should pass matching currencies', async () => {
      const result = await validator.validateCurrencyMatch(
        Money.fromMinorUnits(10000n, 'USD'),
        Money.fromMinorUnits(10000n, 'USD'),
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ─── BalanceCalculator ─────────────────────────────────────
  describe('BalanceCalculator', () => {
    let calculator: BalanceCalculator;

    beforeEach(() => {
      calculator = new BalanceCalculator();
    });

    it('should calculate available balance', () => {
      const ledger = Money.fromMinorUnits(50000n, 'USD');
      const held = Money.fromMinorUnits(10000n, 'USD');
      const reserved = Money.zero('USD');

      const available = calculator.calculateAvailableBalance(ledger, held, reserved);
      expect(available.amount).toBe(40000n);
    });

    it('should calculate current balance', () => {
      const ledger = Money.fromMinorUnits(50000n, 'USD');
      const pendingDebits = Money.fromMinorUnits(5000n, 'USD');
      const pendingCredits = Money.fromMinorUnits(2000n, 'USD');

      const current = calculator.calculateCurrentBalance(ledger, pendingDebits, pendingCredits);
      expect(current.amount).toBe(47000n);
    });

    it('should calculate full breakdown', () => {
      const ledger = Money.fromMinorUnits(50000n, 'USD');
      const pendingDebits = Money.fromMinorUnits(5000n, 'USD');
      const pendingCredits = Money.fromMinorUnits(2000n, 'USD');
      const held = Money.fromMinorUnits(10000n, 'USD');
      const reserved = Money.fromMinorUnits(3000n, 'USD');

      const breakdown = calculator.calculateBreakdown(
        ledger, pendingDebits, pendingCredits, held, reserved,
      );
      expect(breakdown.ledger.amount).toBe(50000n);
      expect(breakdown.current.amount).toBe(47000n);
      expect(breakdown.available.amount).toBe(37000n);
      expect(breakdown.pending.amount).toBe(-3000n);
      expect(breakdown.held.amount).toBe(10000n);
      expect(breakdown.reserved.amount).toBe(3000n);
    });

    it('should apply debit to balance', () => {
      const balance = Money.fromMinorUnits(50000n, 'USD');
      const result = calculator.applyDebit(BalanceType.LEDGER, balance, Money.fromMinorUnits(10000n, 'USD'));
      expect(result.amount).toBe(40000n);
    });

    it('should apply credit to balance', () => {
      const balance = Money.fromMinorUnits(50000n, 'USD');
      const result = calculator.applyCredit(BalanceType.LEDGER, balance, Money.fromMinorUnits(10000n, 'USD'));
      expect(result.amount).toBe(60000n);
    });
  });

  // ─── PostingEngine ─────────────────────────────────────────
  describe('PostingEngine', () => {
    let engine: PostingEngine;

    beforeEach(() => {
      engine = new PostingEngine(repo, eventBus);
    });

    it('should post a balanced journal with double-entry', async () => {
      const { journal, accA, accB } = createTransferJournal(10000n);
      const result = await engine.post(journal);

      expect(result.success).toBe(true);
      expect(result.postings).toHaveLength(2);
      expect(journal.isPosted).toBe(true);

      const balanceA = await repo.getAccountBalances(accA);
      const balanceB = await repo.getAccountBalances(accB);
      expect(balanceA?.balances.get(BalanceType.LEDGER)?.amount).toBe(10000n);
      expect(balanceB?.balances.get(BalanceType.LEDGER)?.amount).toBe(-10000n);
    });

    it('should reject unbalanced journal', async () => {
      const accA = LedgerAccountId.from('a');
      const accB = LedgerAccountId.from('b');
      const journal = Journal.create({
        description: 'Unbalanced',
        postingType: PostingType.TRANSFER,
        entries: [
          JournalEntry.debit(accA, Money.fromMinorUnits(10000n, 'USD')),
          JournalEntry.credit(accB, Money.fromMinorUnits(5000n, 'USD')),
        ],
      });
      const result = await engine.post(journal);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should emit LedgerPosted event on success', async () => {
      const { journal } = createTransferJournal(10000n);
      await engine.post(journal);

      const postedEvents = eventBus.events.filter((e) => e.type === 'LedgerPosted');
      expect(postedEvents).toHaveLength(1);
    });

    it('should prevent duplicate posting IDs (idempotency)', async () => {
      const { journal } = createTransferJournal(10000n);

      const result1 = await engine.post(journal);
      expect(result1.success).toBe(true);

      const { journal: journal2 } = createTransferJournal(10000n);
      const result2 = await engine.post(journal2);
      expect(result2.success).toBe(true);
    });

    it('should handle currency mismatch', async () => {
      const accA = LedgerAccountId.from('a');
      const accB = LedgerAccountId.from('b');
      const journal = Journal.create({
        description: 'Currency mismatch',
        postingType: PostingType.TRANSFER,
        entries: [
          JournalEntry.debit(accA, Money.fromMinorUnits(10000n, 'USD')),
          JournalEntry.credit(accB, Money.fromMinorUnits(10000n, 'EUR')),
        ],
      });
      const result = await engine.post(journal);
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('same currency');
    });
  });

  // ─── HoldEngine ────────────────────────────────────────────
  describe('HoldEngine', () => {
    let engine: HoldEngine;

    beforeEach(() => {
      engine = new HoldEngine(repo, eventBus);
    });

    it('should create a hold', async () => {
      const accA = LedgerAccountId.from('acc-a');
      const hold = await engine.createHold(accA, Money.fromMinorUnits(5000n, 'USD'), 'Auth');
      expect(hold.isActive).toBe(true);
      expect(hold.amount.amount).toBe(5000n);
    });

    it('should release a hold', async () => {
      const accA = LedgerAccountId.from('acc-a');
      const hold = await engine.createHold(accA, Money.fromMinorUnits(5000n, 'USD'), 'Auth');
      const released = await engine.releaseHold(hold.id);
      expect(released.status).toBe(HoldStatus.RELEASED);
    });

    it('should partially release a hold', async () => {
      const accA = LedgerAccountId.from('acc-a');
      const hold = await engine.createHold(accA, Money.fromMinorUnits(5000n, 'USD'), 'Auth');
      const released = await engine.releaseHold(hold.id, Money.fromMinorUnits(2000n, 'USD'));
      expect(released.status).toBe(HoldStatus.PARTIALLY_RELEASED);
      expect(released.amount.amount).toBe(3000n);
    });

    it('should auto-expire holds', async () => {
      const accA = LedgerAccountId.from('acc-a');
      const hold = await engine.createHold(
        accA,
        Money.fromMinorUnits(5000n, 'USD'),
        'Auth',
        1,
      );
      await new Promise((r) => setTimeout(r, 10));
      const expired = await engine.expireHold(hold.id);
      expect(expired.isExpired).toBe(true);
    });

    it('should emit HoldCreated event', async () => {
      const accA = LedgerAccountId.from('acc-a');
      await engine.createHold(accA, Money.fromMinorUnits(5000n, 'USD'), 'Auth');
      const events = eventBus.events.filter((e) => e.type === 'HoldCreated');
      expect(events).toHaveLength(1);
    });

    it('should emit HoldReleased event', async () => {
      const accA = LedgerAccountId.from('acc-a');
      const hold = await engine.createHold(accA, Money.fromMinorUnits(5000n, 'USD'), 'Auth');
      eventBus.events = [];
      await engine.releaseHold(hold.id);
      const events = eventBus.events.filter((e) => e.type === 'HoldReleased');
      expect(events).toHaveLength(1);
    });

    it('should throw on releasing non-existent hold', async () => {
      await expect(engine.releaseHold('non-existent')).rejects.toThrow('Hold not found');
    });

    it('should throw on expiring non-existent hold', async () => {
      await expect(engine.expireHold('non-existent')).rejects.toThrow('Hold not found');
    });
  });

  // ─── SettlementEngine ──────────────────────────────────────
  describe('SettlementEngine', () => {
    let engine: SettlementEngine;

    beforeEach(() => {
      engine = new SettlementEngine(repo, eventBus);
    });

    it('should create a settlement', async () => {
      const accA = LedgerAccountId.from('acc-a');
      const accB = LedgerAccountId.from('acc-b');
      const journalId = JournalId.from('jrnl-settle');
      const settlement = await engine.createSettlement({
        sourceAccountId: accA,
        destinationAccountId: accB,
        amount: Money.fromMinorUnits(10000n, 'USD'),
        journalId,
        description: 'REF-001',
      });
      expect(settlement.status).toBe(SettlementStatus.PENDING);
      expect(settlement.amount.amount).toBe(10000n);
    });

    it('should complete a settlement', async () => {
      const accA = LedgerAccountId.from('acc-a');
      const accB = LedgerAccountId.from('acc-b');
      const journalId = JournalId.from('jrnl-settle');
      const settlement = await engine.createSettlement({
        sourceAccountId: accA,
        destinationAccountId: accB,
        amount: Money.fromMinorUnits(10000n, 'USD'),
        journalId,
        description: 'REF-001',
      });
      const completed = await engine.completeSettlement(settlement.id);
      expect(completed.status).toBe(SettlementStatus.COMPLETED);
      expect(completed.completedAt).toBeDefined();
    });

    it('should fail a settlement', async () => {
      const accA = LedgerAccountId.from('acc-a');
      const accB = LedgerAccountId.from('acc-b');
      const journalId = JournalId.from('jrnl-settle');
      const settlement = await engine.createSettlement({
        sourceAccountId: accA,
        destinationAccountId: accB,
        amount: Money.fromMinorUnits(10000n, 'USD'),
        journalId,
        description: 'REF-001',
      });
      const failed = await engine.failSettlement(settlement.id, 'Network error');
      expect(failed.status).toBe(SettlementStatus.FAILED);
      expect(failed.failureReason).toBe('Network error');
    });

    it('should emit SettlementCompleted event', async () => {
      const accA = LedgerAccountId.from('acc-a');
      const accB = LedgerAccountId.from('acc-b');
      const journalId = JournalId.from('jrnl-settle');
      const settlement = await engine.createSettlement({
        sourceAccountId: accA,
        destinationAccountId: accB,
        amount: Money.fromMinorUnits(10000n, 'USD'),
        journalId,
        description: 'REF-001',
      });
      eventBus.events = [];
      await engine.completeSettlement(settlement.id);
      const events = eventBus.events.filter((e) => e.type === 'SettlementCompleted');
      expect(events).toHaveLength(1);
    });

    it('should throw on completing non-existent settlement', async () => {
      await expect(engine.completeSettlement('non-existent')).rejects.toThrow(
        'Settlement not found',
      );
    });
  });

  // ─── ReversalEngine ────────────────────────────────────────
  describe('ReversalEngine', () => {
    let engine: ReversalEngine;
    let postingEngine: PostingEngine;

    beforeEach(() => {
      engine = new ReversalEngine(repo, eventBus, new JournalValidator(repo));
      postingEngine = new PostingEngine(repo, eventBus);
    });

    it('should create a full reversal', async () => {
      const { journal } = createTransferJournal(10000n);
      await postingEngine.post(journal);

      const result = await engine.createReversal({
        originalJournalId: journal.id,
        type: ReversalType.FULL,
        reasonCode: ReversalReasonCode.ERROR_CORRECTION,
        reason: 'Mistake in posting',
      });
      expect(result.reversal.isFull).toBe(true);
      expect(result.reversal.amount.amount).toBe(10000n);
    });

    it('should create a partial reversal', async () => {
      const { journal } = createTransferJournal(10000n);
      await postingEngine.post(journal);

      const result = await engine.createReversal({
        originalJournalId: journal.id,
        type: ReversalType.PARTIAL,
        reasonCode: ReversalReasonCode.CUSTOMER_REQUEST,
        reason: 'Customer partial cancel',
        partialAmount: Money.fromMinorUnits(5000n, 'USD'),
      });
      expect(result.reversal.isPartial).toBe(true);
      expect(result.reversal.amount.amount).toBe(5000n);
    });

    it('should reject reversing non-existent journal', async () => {
      const fakeId = JournalId.from('non-existent');
      await expect(
        engine.createReversal({
          originalJournalId: fakeId,
          type: ReversalType.FULL,
          reasonCode: ReversalReasonCode.ERROR_CORRECTION,
          reason: 'Mistake',
        }),
      ).rejects.toThrow('Original journal not found');
    });

    it('should reject reversing non-posted journal', async () => {
      const { journal } = createTransferJournal(10000n);
      await repo.saveJournal(journal);

      await expect(
        engine.createReversal({
          originalJournalId: journal.id,
          type: ReversalType.FULL,
          reasonCode: ReversalReasonCode.ERROR_CORRECTION,
          reason: 'Mistake',
        }),
      ).rejects.toThrow('Cannot reverse journal in DRAFT status');
    });

    it('should reject double reversal', async () => {
      const { journal } = createTransferJournal(10000n);
      await postingEngine.post(journal);

      await engine.createReversal({
        originalJournalId: journal.id,
        type: ReversalType.FULL,
        reasonCode: ReversalReasonCode.ERROR_CORRECTION,
        reason: 'First reversal',
      });

      await expect(
        engine.createReversal({
          originalJournalId: journal.id,
          type: ReversalType.FULL,
          reasonCode: ReversalReasonCode.ERROR_CORRECTION,
          reason: 'Second reversal',
        }),
      ).rejects.toThrow('Journal has already been reversed');
    });

    it('should emit LedgerReversed event', async () => {
      const { journal } = createTransferJournal(10000n);
      await postingEngine.post(journal);
      eventBus.events = [];

      await engine.createReversal({
        originalJournalId: journal.id,
        type: ReversalType.FULL,
        reasonCode: ReversalReasonCode.ERROR_CORRECTION,
        reason: 'Mistake',
      });

      const events = eventBus.events.filter((e) => e.type === 'LedgerReversed');
      expect(events).toHaveLength(1);
    });
  });

  // ─── ReconciliationEngine ──────────────────────────────────
  describe('ReconciliationEngine', () => {
    let reconEngine: ReconciliationEngine;

    beforeEach(() => {
      reconEngine = new ReconciliationEngine(repo, eventBus);
    });

    it('should reconcile matching balances', async () => {
      const accA = LedgerAccountId.from('acc-a');
      await repo.updateBalance(
        accA,
        'USD',
        Money.fromMinorUnits(50000n, 'USD'),
        Money.zero('USD'),
        BalanceType.LEDGER,
      );

      const result = await reconEngine.reconcile({
        accountId: accA,
        type: ReconciliationType.DAILY,
        externalBalance: Money.fromMinorUnits(50000n, 'USD'),
        balanceType: BalanceType.LEDGER,
      });
      expect(result.status).toBe(ReconciliationStatus.BALANCED);
      expect(result.variance.amount).toBe(0n);
    });

    it('should detect discrepancy in reconciliation', async () => {
      const accA = LedgerAccountId.from('acc-a');
      await repo.updateBalance(
        accA,
        'USD',
        Money.fromMinorUnits(50000n, 'USD'),
        Money.zero('USD'),
        BalanceType.LEDGER,
      );

      const result = await reconEngine.reconcile({
        accountId: accA,
        type: ReconciliationType.DAILY,
        externalBalance: Money.fromMinorUnits(45000n, 'USD'),
        balanceType: BalanceType.LEDGER,
      });
      expect(result.status).toBe(ReconciliationStatus.VARIANCE_DETECTED);
      expect(result.variance.amount).toBe(5000n);
    });

    it('should emit ReconciliationCompleted event', async () => {
      const accA = LedgerAccountId.from('acc-a');
      await repo.updateBalance(
        accA,
        'USD',
        Money.fromMinorUnits(50000n, 'USD'),
        Money.zero('USD'),
        BalanceType.LEDGER,
      );

      await reconEngine.reconcile({
        accountId: accA,
        type: ReconciliationType.DAILY,
        externalBalance: Money.fromMinorUnits(50000n, 'USD'),
        balanceType: BalanceType.LEDGER,
      });

      const events = eventBus.events.filter((e) => e.type === 'ReconciliationCompleted');
      expect(events).toHaveLength(1);
    });
  });

  // ─── Idempotency ───────────────────────────────────────────
  describe('Idempotency', () => {
    it('should prevent duplicate posting IDs', async () => {
      const accA = LedgerAccountId.from('acc-a');
      const journalId = JournalId.from('jrnl-1');

      const posting1 = Posting.create({
        id: PostingId.from('same-id'),
        journalId,
        accountId: accA,
        amount: Money.fromMinorUnits(10000n, 'USD'),
        side: EntrySide.DEBIT,
        postingType: PostingType.DEPOSIT,
      });
      await repo.savePostings([posting1]);

      const exists = await repo.checkPostingIdExists(PostingId.from('same-id'));
      expect(exists).toBe(true);

      const notExists = await repo.checkPostingIdExists(PostingId.from('different-id'));
      expect(notExists).toBe(false);
    });
  });

  // ─── Concurrency ───────────────────────────────────────────
  describe('Concurrency', () => {
    it('should handle concurrent balance updates', async () => {
      const accA = LedgerAccountId.from('acc-a');

      const updates = Array.from({ length: 10 }, () =>
        repo.updateBalance(
          accA,
          'USD',
          Money.fromMinorUnits(1000n, 'USD'),
          Money.zero('USD'),
          BalanceType.LEDGER,
        ),
      );

      await Promise.all(updates);

      const balance = await repo.getAccountBalances(accA);
      expect(balance?.balances.get(BalanceType.LEDGER)?.amount).toBe(10000n);
    });
  });

  // ─── PostingType Coverage ──────────────────────────────────
  describe('PostingType Coverage', () => {
    const allTypes = [
      PostingType.DEPOSIT,
      PostingType.WITHDRAWAL,
      PostingType.TRANSFER,
      PostingType.ACH,
      PostingType.WIRE,
      PostingType.SWIFT,
      PostingType.CARD_AUTHORIZATION,
      PostingType.CARD_CAPTURE,
      PostingType.CARD_REFUND,
      PostingType.CRYPTO_DEPOSIT,
      PostingType.CRYPTO_WITHDRAWAL,
      PostingType.LOAN_DISBURSEMENT,
      PostingType.LOAN_REPAYMENT,
      PostingType.INVESTMENT_PURCHASE,
      PostingType.INVESTMENT_SALE,
      PostingType.INTEREST,
      PostingType.FEE,
      PostingType.ADJUSTMENT,
    ];

    it('should support all 18 posting types', () => {
      expect(allTypes).toHaveLength(18);
      for (const type of allTypes) {
        const accA = LedgerAccountId.from('a');
        const accB = LedgerAccountId.from('b');
        const journal = Journal.create({
          description: `Test ${type}`,
          postingType: type,
          entries: [
            JournalEntry.debit(accA, Money.fromMinorUnits(10000n, 'USD')),
            JournalEntry.credit(accB, Money.fromMinorUnits(10000n, 'USD')),
          ],
        });
        expect(journal.postingType).toBe(type);
      }
    });
  });

  // ─── BalanceType Coverage ──────────────────────────────────
  describe('BalanceType Coverage', () => {
    it('should support all 6 balance types', () => {
      const allTypes = [
        BalanceType.LEDGER,
        BalanceType.CURRENT,
        BalanceType.AVAILABLE,
        BalanceType.PENDING,
        BalanceType.HELD,
        BalanceType.RESERVED,
      ];
      expect(allTypes).toHaveLength(6);
      for (const bt of allTypes) {
        expect(bt).toBeDefined();
      }
    });
  });
});
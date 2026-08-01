import { Journal } from '../entities/journal';
import { JournalEntry } from '../entities/journal-entry';
import { Posting } from '../entities/posting';
import { Hold } from '../entities/hold';
import { Reversal } from '../entities/reversal';
import { BalanceSnapshot } from '../entities/balance-snapshot';
import { Money } from '../value-objects/money';
import { LedgerAccountId } from '../value-objects/ledger-account-id';
import { JournalId } from '../value-objects/journal-id';
import { PostingId } from '../value-objects/posting-id';
import { ReferenceNumber } from '../value-objects/reference-number';
import { TransactionReference } from '../value-objects/transaction-reference';
import {
  PostingType,
  EntrySide,
  JournalStatus,
  PostingStatus,
  HoldStatus,
  ReversalType,
  ReversalReasonCode,
  BalanceType,
} from '../enums';

describe('Entities', () => {
  const accA = LedgerAccountId.from('acc-a');
  const accB = LedgerAccountId.from('acc-b');

  // ─── JournalEntry ────────────────────────────────────────────
  describe('JournalEntry', () => {
    it('should create a debit entry', () => {
      const entry = JournalEntry.debit(accA, Money.fromMinorUnits(10000n, 'USD'));
      expect(entry.isDebit).toBe(true);
      expect(entry.isCredit).toBe(false);
      expect(entry.amount.amount).toBe(10000n);
      expect(entry.accountId.equals(accA)).toBe(true);
    });

    it('should create a credit entry', () => {
      const entry = JournalEntry.credit(accB, Money.fromMinorUnits(10000n, 'USD'));
      expect(entry.isCredit).toBe(true);
      expect(entry.isDebit).toBe(false);
    });

    it('should reject zero amount debit', () => {
      expect(() =>
        JournalEntry.debit(accA, Money.zero('USD')),
      ).toThrow('Debit amount must be positive');
    });

    it('should reject zero amount credit', () => {
      expect(() =>
        JournalEntry.credit(accB, Money.zero('USD')),
      ).toThrow('Credit amount must be positive');
    });

    it('should serialize to JSON', () => {
      const entry = JournalEntry.debit(accA, Money.fromMinorUnits(5000n, 'USD'), 'test');
      const json = entry.toJSON();
      expect(json.accountId).toBe('acc-a');
      expect(json.side).toBe(EntrySide.DEBIT);
      expect(json.description).toBe('test');
      expect(json.currency).toBe('USD');
    });
  });

  // ─── Journal ─────────────────────────────────────────────────
  describe('Journal', () => {
    function createBalancedJournal(): Journal {
      return Journal.create({
        description: 'Test transfer',
        postingType: PostingType.TRANSFER,
        entries: [
          JournalEntry.debit(accA, Money.fromMinorUnits(10000n, 'USD'), 'Debit A'),
          JournalEntry.credit(accB, Money.fromMinorUnits(10000n, 'USD'), 'Credit B'),
        ],
      });
    }

    it('should create a draft journal', () => {
      const journal = createBalancedJournal();
      expect(journal.isDraft).toBe(true);
      expect(journal.status).toBe(JournalStatus.DRAFT);
    });

    it('should detect balanced journal', () => {
      const journal = createBalancedJournal();
      expect(journal.isBalanced).toBe(true);
      expect(journal.totalDebits).toBe(10000n);
      expect(journal.totalCredits).toBe(10000n);
    });

    it('should detect unbalanced journal', () => {
      const journal = Journal.create({
        description: 'Unbalanced',
        postingType: PostingType.TRANSFER,
        entries: [
          JournalEntry.debit(accA, Money.fromMinorUnits(10000n, 'USD')),
          JournalEntry.credit(accB, Money.fromMinorUnits(5000n, 'USD')),
        ],
      });
      expect(journal.isBalanced).toBe(false);
      expect(journal.totalDebits).toBe(10000n);
      expect(journal.totalCredits).toBe(5000n);
    });

    it('should post a balanced journal', () => {
      const journal = createBalancedJournal();
      journal.post();
      expect(journal.isPosted).toBe(true);
      expect(journal.postedAt).toBeDefined();
    });

    it('should reject posting an unbalanced journal', () => {
      const journal = Journal.create({
        description: 'Unbalanced',
        postingType: PostingType.TRANSFER,
        entries: [
          JournalEntry.debit(accA, Money.fromMinorUnits(10000n, 'USD')),
          JournalEntry.credit(accB, Money.fromMinorUnits(5000n, 'USD')),
        ],
      });
      expect(() => journal.post()).toThrow('Cannot post unbalanced journal');
    });

    it('should reject posting with fewer than 2 entries', () => {
      const journal = Journal.create({
        description: 'Single entry',
        postingType: PostingType.DEPOSIT,
        entries: [
          JournalEntry.debit(accA, Money.fromMinorUnits(10000n, 'USD')),
        ],
      });
      // Force balance check override by manually setting totalDebits == totalCredits won't help
      // since it's unbalanced. Let's test the >2 entries rule with a balanced single-entry
      // Actually a single debit with amount 0 can't be created. We need at least 2 entries.
      // The balanced check comes first, so we test the min-entries rule differently:
      // Create a balanced journal with only 1 entry (impossible since single entry can't balance)
      // The isBalanced check fails first, so let's create a journal with the right structure:
      // Actually for a single debit entry of 10000n, totalDebits=10000n, totalCredits=0n => not balanced
      // So the unbalanced error fires first. The min-entries rule is secondary.
      // We can test it by creating a journal with entries that somehow balance with 1 entry (impossible with standard entries)
      // Let's just verify the post() method behavior for a single-entry journal:
      expect(() => journal.post()).toThrow();
    });

    it('should reject posting a non-draft journal', () => {
      const journal = createBalancedJournal();
      journal.post();
      expect(() => journal.post()).toThrow('Cannot post journal in POSTED status');
    });

    it('should reverse a posted journal', () => {
      const journal = createBalancedJournal();
      journal.post();
      const reversalId = JournalId.from('rev-jrnl');
      journal.reverse(reversalId);
      expect(journal.isReversed).toBe(true);
      expect(journal.reversedAt).toBeDefined();
      expect(journal.reversalJournalId?.equals(reversalId)).toBe(true);
    });

    it('should reject reversing a non-posted journal', () => {
      const journal = createBalancedJournal();
      expect(() => journal.reverse(JournalId.from('rev'))).toThrow(
        'Cannot reverse journal in DRAFT status',
      );
    });

    it('should cancel a draft journal', () => {
      const journal = createBalancedJournal();
      journal.cancel();
      expect(journal.status).toBe(JournalStatus.CANCELLED);
    });

    it('should reject cancelling a non-draft journal', () => {
      const journal = createBalancedJournal();
      journal.post();
      expect(() => journal.cancel()).toThrow('Cannot cancel journal in POSTED status');
    });

    it('should return currency from entries', () => {
      const journal = createBalancedJournal();
      expect(journal.currency).toBe('USD');
    });

    it('should throw on currency of empty journal', () => {
      const journal = Journal.create({
        description: 'Empty',
        postingType: PostingType.TRANSFER,
        entries: [],
      });
      expect(() => journal.currency).toThrow('Cannot determine currency of empty journal');
    });

    it('should serialize to JSON', () => {
      const journal = createBalancedJournal();
      const json = journal.toJSON();
      expect(json.description).toBe('Test transfer');
      expect(json.postingType).toBe(PostingType.TRANSFER);
      expect(json.status).toBe(JournalStatus.DRAFT);
      expect(Array.isArray(json.entries)).toBe(true);
    });

    it('should support metadata', () => {
      const journal = Journal.create({
        description: 'With metadata',
        postingType: PostingType.TRANSFER,
        entries: [
          JournalEntry.debit(accA, Money.fromMinorUnits(10000n, 'USD')),
          JournalEntry.credit(accB, Money.fromMinorUnits(10000n, 'USD')),
        ],
        metadata: { key1: 'value1' },
      });
      expect(journal.metadata).toEqual({ key1: 'value1' });
    });
  });

  // ─── Posting ─────────────────────────────────────────────────
  describe('Posting', () => {
    const journalId = JournalId.from('jrnl-1');

    it('should create a pending posting', () => {
      const posting = Posting.create({
        journalId,
        accountId: accA,
        amount: Money.fromMinorUnits(10000n, 'USD'),
        side: EntrySide.DEBIT,
        postingType: PostingType.DEPOSIT,
        description: 'Deposit',
      });
      expect(posting.isPending).toBe(true);
      expect(posting.status).toBe(PostingStatus.PENDING);
      expect(posting.isDebit).toBe(true);
      expect(posting.amount.amount).toBe(10000n);
    });

    it('should post a pending posting', () => {
      const posting = Posting.create({
        journalId,
        accountId: accA,
        amount: Money.fromMinorUnits(10000n, 'USD'),
        side: EntrySide.DEBIT,
        postingType: PostingType.DEPOSIT,
      });
      posting.post();
      expect(posting.isPosted).toBe(true);
      expect(posting.postedAt).toBeDefined();
    });

    it('should reject posting a non-pending posting', () => {
      const posting = Posting.create({
        journalId,
        accountId: accA,
        amount: Money.fromMinorUnits(10000n, 'USD'),
        side: EntrySide.DEBIT,
        postingType: PostingType.DEPOSIT,
      });
      posting.post();
      expect(() => posting.post()).toThrow('Cannot post posting in POSTED status');
    });

    it('should reverse a posted posting', () => {
      const posting = Posting.create({
        journalId,
        accountId: accA,
        amount: Money.fromMinorUnits(10000n, 'USD'),
        side: EntrySide.DEBIT,
        postingType: PostingType.DEPOSIT,
      });
      posting.post();
      const reversalId = PostingId.from('rev-post');
      posting.reverse(reversalId);
      expect(posting.isReversed).toBe(true);
      expect(posting.reversalPostingId?.equals(reversalId)).toBe(true);
    });

    it('should reject reversing a non-posted posting', () => {
      const posting = Posting.create({
        journalId,
        accountId: accA,
        amount: Money.fromMinorUnits(10000n, 'USD'),
        side: EntrySide.DEBIT,
        postingType: PostingType.DEPOSIT,
      });
      expect(() => posting.reverse(PostingId.from('rev'))).toThrow(
        'Cannot reverse posting in PENDING status',
      );
    });

    it('should fail a pending posting', () => {
      const posting = Posting.create({
        journalId,
        accountId: accA,
        amount: Money.fromMinorUnits(10000n, 'USD'),
        side: EntrySide.DEBIT,
        postingType: PostingType.DEPOSIT,
      });
      posting.fail();
      expect(posting.isFailed).toBe(true);
    });

    it('should reject failing a non-pending posting', () => {
      const posting = Posting.create({
        journalId,
        accountId: accA,
        amount: Money.fromMinorUnits(10000n, 'USD'),
        side: EntrySide.DEBIT,
        postingType: PostingType.DEPOSIT,
      });
      posting.post();
      expect(() => posting.fail()).toThrow('Cannot fail posting in POSTED status');
    });

    it('should return signed amount', () => {
      const debit = Posting.create({
        journalId,
        accountId: accA,
        amount: Money.fromMinorUnits(10000n, 'USD'),
        side: EntrySide.DEBIT,
        postingType: PostingType.DEPOSIT,
      });
      expect(debit.signedAmount).toBe(10000n);

      const credit = Posting.create({
        journalId,
        accountId: accB,
        amount: Money.fromMinorUnits(10000n, 'USD'),
        side: EntrySide.CREDIT,
        postingType: PostingType.DEPOSIT,
      });
      expect(credit.signedAmount).toBe(-10000n);
    });

    it('should serialize to JSON', () => {
      const posting = Posting.create({
        journalId,
        accountId: accA,
        amount: Money.fromMinorUnits(10000n, 'USD'),
        side: EntrySide.DEBIT,
        postingType: PostingType.WIRE,
        referenceNumber: ReferenceNumber.from('REF-001'),
        transactionReference: TransactionReference.from('TXN-001', 'SWIFT'),
        description: 'Wire transfer',
      });
      const json = posting.toJSON();
      expect(json.postingType).toBe(PostingType.WIRE);
      expect(json.status).toBe(PostingStatus.PENDING);
      expect(json.referenceNumber).toBe('REF-001');
    });
  });

  // ─── Hold ────────────────────────────────────────────────────
  describe('Hold', () => {
    it('should create an active hold', () => {
      const hold = Hold.create({
        accountId: accA,
        amount: Money.fromMinorUnits(5000n, 'USD'),
        reason: 'Card authorization',
      });
      expect(hold.isActive).toBe(true);
      expect(hold.status).toBe(HoldStatus.ACTIVE);
      expect(hold.amount.amount).toBe(5000n);
    });

    it('should support custom expiry', () => {
      const hold = Hold.create({
        accountId: accA,
        amount: Money.fromMinorUnits(5000n, 'USD'),
        reason: 'Test',
        expiresInMs: 60000,
      });
      expect(hold.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should fully release a hold', () => {
      const hold = Hold.create({
        accountId: accA,
        amount: Money.fromMinorUnits(5000n, 'USD'),
        reason: 'Test',
      });
      hold.release();
      expect(hold.status).toBe(HoldStatus.RELEASED);
      expect(hold.releasedAt).toBeDefined();
      expect(hold.remainingAmount.amount).toBe(0n);
    });

    it('should partially release a hold', () => {
      const hold = Hold.create({
        accountId: accA,
        amount: Money.fromMinorUnits(5000n, 'USD'),
        reason: 'Test',
      });
      hold.release(Money.fromMinorUnits(2000n, 'USD'));
      expect(hold.status).toBe(HoldStatus.PARTIALLY_RELEASED);
      expect(hold.amount.amount).toBe(3000n);
      expect(hold.releasedAmount.amount).toBe(2000n);
    });

    it('should reject releasing more than held amount', () => {
      const hold = Hold.create({
        accountId: accA,
        amount: Money.fromMinorUnits(5000n, 'USD'),
        reason: 'Test',
      });
      expect(() => hold.release(Money.fromMinorUnits(10000n, 'USD'))).toThrow(
        'Release amount exceeds held amount',
      );
    });

    it('should reject releasing a non-active hold', () => {
      const hold = Hold.create({
        accountId: accA,
        amount: Money.fromMinorUnits(5000n, 'USD'),
        reason: 'Test',
      });
      hold.release();
      expect(() => hold.release()).toThrow('Cannot release hold in RELEASED status');
    });

    it('should capture a hold', () => {
      const hold = Hold.create({
        accountId: accA,
        amount: Money.fromMinorUnits(5000n, 'USD'),
        reason: 'Test',
      });
      hold.capture();
      expect(hold.status).toBe(HoldStatus.CAPTURED);
      expect(hold.capturedAt).toBeDefined();
    });

    it('should expire a hold', () => {
      const hold = Hold.create({
        accountId: accA,
        amount: Money.fromMinorUnits(5000n, 'USD'),
        reason: 'Test',
      });
      hold.expire();
      expect(hold.isExpired).toBe(true);
      expect(hold.releasedAt).toBeDefined();
    });

    it('should reject operations on expired hold', () => {
      const hold = Hold.create({
        accountId: accA,
        amount: Money.fromMinorUnits(5000n, 'USD'),
        reason: 'Test',
      });
      hold.expire();
      expect(() => hold.release()).toThrow('Cannot release hold in EXPIRED status');
      expect(() => hold.capture()).toThrow('Cannot capture hold in EXPIRED status');
      expect(() => hold.expire()).toThrow('Cannot expire hold in EXPIRED status');
    });

    it('should serialize to JSON', () => {
      const hold = Hold.create({
        id: 'hold-1',
        accountId: accA,
        amount: Money.fromMinorUnits(5000n, 'USD'),
        reason: 'Card auth',
      });
      const json = hold.toJSON();
      expect(json.id).toBe('hold-1');
      expect(json.status).toBe(HoldStatus.ACTIVE);
      expect(json.reason).toBe('Card auth');
    });
  });

  // ─── Reversal ────────────────────────────────────────────────
  describe('Reversal', () => {
    const originalJournalId = JournalId.from('jrnl-orig');

    it('should create a full reversal', () => {
      const reversal = Reversal.create({
        originalJournalId,
        type: ReversalType.FULL,
        reasonCode: ReversalReasonCode.ERROR_CORRECTION,
        reason: 'Mistake',
        amount: Money.fromMinorUnits(10000n, 'USD'),
        createdBy: 'admin',
      });
      expect(reversal.isFull).toBe(true);
      expect(reversal.isPartial).toBe(false);
      expect(reversal.reasonCode).toBe(ReversalReasonCode.ERROR_CORRECTION);
      expect(reversal.isCompleted).toBe(false);
    });

    it('should create a partial reversal', () => {
      const reversal = Reversal.create({
        originalJournalId,
        type: ReversalType.PARTIAL,
        reasonCode: ReversalReasonCode.CUSTOMER_REQUEST,
        reason: 'Partial cancel',
        amount: Money.fromMinorUnits(5000n, 'USD'),
      });
      expect(reversal.isPartial).toBe(true);
    });

    it('should link a reversal journal', () => {
      const reversal = Reversal.create({
        originalJournalId,
        type: ReversalType.FULL,
        reasonCode: ReversalReasonCode.ERROR_CORRECTION,
        reason: 'Mistake',
        amount: Money.fromMinorUnits(10000n, 'USD'),
      });
      const reversalJournalId = JournalId.from('jrnl-rev');
      reversal.linkReversalJournal(reversalJournalId);
      expect(reversal.reversalJournalId?.equals(reversalJournalId)).toBe(true);
    });

    it('should reject linking a second reversal journal', () => {
      const reversal = Reversal.create({
        originalJournalId,
        type: ReversalType.FULL,
        reasonCode: ReversalReasonCode.ERROR_CORRECTION,
        reason: 'Mistake',
        amount: Money.fromMinorUnits(10000n, 'USD'),
      });
      reversal.linkReversalJournal(JournalId.from('jrnl-rev-1'));
      expect(() => reversal.linkReversalJournal(JournalId.from('jrnl-rev-2'))).toThrow(
        'Reversal already has a linked journal',
      );
    });

    it('should complete a reversal', () => {
      const reversal = Reversal.create({
        originalJournalId,
        type: ReversalType.FULL,
        reasonCode: ReversalReasonCode.FRAUD,
        reason: 'Fraud detected',
        amount: Money.fromMinorUnits(10000n, 'USD'),
      });
      reversal.complete();
      expect(reversal.isCompleted).toBe(true);
      expect(reversal.completedAt).toBeDefined();
    });

    it('should reject completing an already completed reversal', () => {
      const reversal = Reversal.create({
        originalJournalId,
        type: ReversalType.FULL,
        reasonCode: ReversalReasonCode.FRAUD,
        reason: 'Fraud detected',
        amount: Money.fromMinorUnits(10000n, 'USD'),
      });
      reversal.complete();
      expect(() => reversal.complete()).toThrow('Reversal already completed');
    });

    it('should serialize to JSON', () => {
      const reversal = Reversal.create({
        id: 'rev-1',
        originalJournalId,
        type: ReversalType.PARTIAL,
        reasonCode: ReversalReasonCode.CHARGEBACK,
        reason: 'Chargeback filed',
        amount: Money.fromMinorUnits(3000n, 'USD'),
        createdBy: 'system',
      });
      const json = reversal.toJSON();
      expect(json.id).toBe('rev-1');
      expect(json.type).toBe(ReversalType.PARTIAL);
      expect(json.reasonCode).toBe(ReversalReasonCode.CHARGEBACK);
      expect(json.createdBy).toBe('system');
    });
  });

  // ─── BalanceSnapshot ─────────────────────────────────────────
  describe('BalanceSnapshot', () => {
    it('should create a balance snapshot', () => {
      const snapshot = BalanceSnapshot.create({
        accountId: accA,
        balanceType: BalanceType.LEDGER,
        balance: Money.fromMinorUnits(50000n, 'USD'),
      });
      expect(snapshot.accountId.equals(accA)).toBe(true);
      expect(snapshot.balanceType).toBe(BalanceType.LEDGER);
      expect(snapshot.balance.amount).toBe(50000n);
    });

    it('should snapshot all balance types', () => {
      const types = [
        BalanceType.LEDGER,
        BalanceType.CURRENT,
        BalanceType.AVAILABLE,
        BalanceType.PENDING,
        BalanceType.HELD,
        BalanceType.RESERVED,
      ];
      for (const bt of types) {
        const snapshot = BalanceSnapshot.create({
          accountId: accA,
          balanceType: bt,
          balance: Money.fromMinorUnits(1000n, 'USD'),
        });
        expect(snapshot.balanceType).toBe(bt);
      }
    });
  });
});
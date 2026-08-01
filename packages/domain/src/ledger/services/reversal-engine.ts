import { Reversal } from '../entities/reversal';
import { Journal } from '../entities/journal';
import { JournalEntry } from '../entities/journal-entry';
import { Posting } from '../entities/posting';
import { JournalId } from '../value-objects/journal-id';
import { Money } from '../value-objects/money';
import { ReversalReasonCode, ReversalType, PostingStatus, EntrySide } from '../enums';
import { LedgerReversed } from '../events';
import { LedgerRepository, EventBus } from './interfaces';
import { JournalValidator } from './journal-validator';

export interface CreateReversalRequest {
  originalJournalId: JournalId;
  type: ReversalType;
  reasonCode: ReversalReasonCode;
  reason: string;
  partialAmount?: Money;
}

/**
 * ReversalEngine - Domain service for managing journal reversals.
 * Supports full, partial, and linked reversals with reason codes.
 */
export class ReversalEngine {
  constructor(
    private readonly repository: LedgerRepository,
    private readonly eventBus: EventBus,
    private readonly journalValidator: JournalValidator,
  ) {}

  async createReversal(request: CreateReversalRequest): Promise<{ reversal: Reversal; reversalJournal: Journal }> {
    const originalJournal = await this.repository.findJournalById(request.originalJournalId);
    if (!originalJournal) {
      throw new Error(`Original journal not found: ${request.originalJournalId.value}`);
    }

    if (!originalJournal.isPosted) {
      throw new Error(`Cannot reverse journal in ${originalJournal.status} status`);
    }

    const originalPostings = await this.repository.findPostingsByJournalId(request.originalJournalId);
    if (originalPostings.length === 0) {
      throw new Error('No postings found for the original journal');
    }

    const existingReversal = await this.repository.findReversalByOriginalJournalId(request.originalJournalId);
    if (existingReversal && request.type !== ReversalType.PARTIAL) {
      throw new Error('Journal has already been reversed');
    }

    const reversalEntries = this.createReversalEntries(
      originalPostings,
      request.type,
      request.partialAmount,
    );

    const reversalJournal = Journal.create({
      description: `Reversal of ${request.originalJournalId.value}: ${request.reason}`,
      postingType: originalJournal.postingType,
      entries: reversalEntries,
    });

    const validation = this.journalValidator.validate(reversalJournal);
    if (!validation.valid) {
      throw new Error(`Reversal journal validation failed: ${validation.errors.join(', ')}`);
    }

    const reversalPostings = this.createReversalPostings(
      originalPostings,
      reversalJournal.id,
      request.type,
      request.partialAmount,
      originalJournal.postingType,
    );

    const totalAmount = this.calculateReversalTotal(reversalPostings);

    const reversal = Reversal.create({
      originalJournalId: request.originalJournalId,
      type: request.type,
      reasonCode: request.reasonCode,
      reason: request.reason,
      amount: totalAmount,
    });

    reversal.linkReversalJournal(reversalJournal.id);
    reversal.complete();

    await this.repository.saveJournal(reversalJournal);
    await this.repository.savePostings(reversalPostings);
    await this.repository.saveReversal(reversal);

    for (const posting of originalPostings) {
      await this.repository.updatePostingStatus(posting.id, PostingStatus.REVERSED);
    }

    const affectedAccounts = reversalPostings.map(p => p.accountId);
    this.eventBus.publish(
      new LedgerReversed(
        reversalJournal.id.value,
        request.originalJournalId,
        reversalJournal.id,
        totalAmount,
        request.reasonCode,
        affectedAccounts,
      ),
    );

    return { reversal, reversalJournal };
  }

  private createReversalEntries(
    originalPostings: Posting[],
    type: ReversalType,
    partialAmount?: Money,
  ): JournalEntry[] {
    if (type === ReversalType.PARTIAL && partialAmount) {
      const debitSource = originalPostings.find((posting) => posting.isDebit);
      const creditSource = originalPostings.find((posting) => posting.isCredit);

      if (!debitSource || !creditSource) {
        throw new Error('Cannot create partial reversal without both debit and credit sides');
      }

      return [
        JournalEntry.credit(debitSource.accountId, partialAmount, `Partial reversal of posting ${debitSource.id.value}`),
        JournalEntry.debit(creditSource.accountId, partialAmount, `Partial reversal of posting ${creditSource.id.value}`),
      ];
    }

    const entries: JournalEntry[] = [];

    for (const originalPosting of originalPostings) {
      const amount = Money.fromMinorUnits(originalPosting.amount.amount, originalPosting.amount.currency);
      if (originalPosting.isDebit) {
        entries.push(JournalEntry.credit(originalPosting.accountId, amount, `Reversal of posting ${originalPosting.id.value}`));
      } else {
        entries.push(JournalEntry.debit(originalPosting.accountId, amount, `Reversal of posting ${originalPosting.id.value}`));
      }
    }

    return entries;
  }

  private createReversalPostings(
    originalPostings: Posting[],
    reversalJournalId: JournalId,
    type: ReversalType,
    partialAmount?: Money,
    postingType?: import('../enums').PostingType,
  ): Posting[] {
    if (type === ReversalType.PARTIAL && partialAmount) {
      const debitSource = originalPostings.find((posting) => posting.isDebit);
      const creditSource = originalPostings.find((posting) => posting.isCredit);

      if (!debitSource || !creditSource) {
        throw new Error('Cannot create partial reversal without both debit and credit sides');
      }

      return [
        Posting.create({
          journalId: reversalJournalId,
          accountId: debitSource.accountId,
          amount: partialAmount,
          side: EntrySide.CREDIT,
          postingType: postingType ?? debitSource.postingType,
          description: `Partial reversal of posting ${debitSource.id.value}`,
        }),
        Posting.create({
          journalId: reversalJournalId,
          accountId: creditSource.accountId,
          amount: partialAmount,
          side: EntrySide.DEBIT,
          postingType: postingType ?? creditSource.postingType,
          description: `Partial reversal of posting ${creditSource.id.value}`,
        }),
      ];
    }

    const reversalPostings: Posting[] = [];
    const reversalPostingType = postingType ?? originalPostings[0]?.postingType;

    for (const originalPosting of originalPostings) {
      const amount = Money.fromMinorUnits(originalPosting.amount.amount, originalPosting.amount.currency);
      const side = originalPosting.isDebit ? EntrySide.CREDIT : EntrySide.DEBIT;
      reversalPostings.push(
        Posting.create({
          journalId: reversalJournalId,
          accountId: originalPosting.accountId,
          amount,
          side,
          postingType: reversalPostingType ?? originalPosting.postingType,
          description: type === ReversalType.PARTIAL
            ? `Partial reversal of posting ${originalPosting.id.value}`
            : `Reversal of posting ${originalPosting.id.value}`,
        }),
      );
    }

    return reversalPostings;
  }

  private calculateReversalTotal(postings: Posting[]): Money {
    const firstPosting = postings[0];
    if (!firstPosting) {
      throw new Error('Cannot calculate total of empty postings');
    }
    
    let totalDebits = Money.zero(firstPosting.amount.currency);
    for (const posting of postings) {
      if (posting.isDebit) {
        totalDebits = totalDebits.add(posting.amount);
      }
    }
    return totalDebits;
  }

  async getReversal(journalId: JournalId): Promise<Reversal | null> {
    return this.repository.findReversalByOriginalJournalId(journalId);
  }
}
import { Journal } from '../entities/journal';
import { Posting } from '../entities/posting';
import { JournalEntry } from '../entities/journal-entry';
import { JournalId } from '../value-objects/journal-id';
import { PostingId } from '../value-objects/posting-id';
import { LedgerAccountId } from '../value-objects/ledger-account-id';
import { Money } from '../value-objects/money';
import { ReferenceNumber } from '../value-objects/reference-number';
import { TransactionReference } from '../value-objects/transaction-reference';
import { BalanceType, PostingType, EntrySide } from '../enums';
import { LedgerPosted, BalanceChanged } from '../events';
import { LedgerRepository, EventBus } from './interfaces';
import { JournalValidator } from './journal-validator';
import { LedgerValidator } from './ledger-validator';

export interface PostJournalRequest {
  journalId?: JournalId;
  description: string;
  postingType: PostingType;
  entries: Array<{
    accountId: LedgerAccountId;
    amount: Money;
    isDebit: boolean;
    description?: string;
  }>;
  referenceNumber?: ReferenceNumber;
  transactionReference?: TransactionReference;
  metadata?: Record<string, string>;
}

export interface PostJournalResult {
  journal: Journal;
  postings: Posting[];
  events: LedgerPosted[];
}

/**
 * PostingEngine - Core domain service for posting journals to the ledger.
 * Orchestrates validation, posting creation, balance updates, and event emission.
 */
export class PostingEngine {
  private readonly ledgerValidator: LedgerValidator;

  constructor(
    private readonly repository: LedgerRepository,
    private readonly eventBus: EventBus,
    private readonly journalValidator: JournalValidator = new JournalValidator(repository),
  ) {
    this.ledgerValidator = new LedgerValidator(repository);
  }

  private getLedgerValidator(): LedgerValidator {
    return this.ledgerValidator;
  }

  async post(journal: Journal): Promise<{ success: boolean; journal?: Journal; postings: Posting[]; errors: string[] }> {
    const validation = this.journalValidator.validate(journal);
    if (!validation.valid) {
      return { success: false, postings: [], errors: validation.errors };
    }

    const postings: Posting[] = [];
    for (const entry of journal.entries) {
      const posting = Posting.create({
        journalId: journal.id,
        accountId: entry.accountId,
        amount: entry.amount,
        side: entry.side,
        postingType: journal.postingType,
        description: entry.description,
        metadata: entry.metadata,
      });

      const postingValidation = await this.journalValidator.validatePosting(posting);
      if (!postingValidation.valid) {
        return { success: false, postings: [], errors: postingValidation.errors };
      }

      const accountBalances = await this.repository.getAccountBalances(posting.accountId);
      if (posting.isDebit && accountBalances) {
        const ledgerValidator = this.getLedgerValidator();
        const balanceValidation = await ledgerValidator.validateSufficientBalance(
          posting.accountId,
          posting.amount,
          BalanceType.LEDGER,
        );
        if (!balanceValidation.valid) {
          return { success: false, postings: [], errors: balanceValidation.errors };
        }
      }

      postings.push(posting);
    }

    journal.post();

    for (const posting of postings) {
      posting.post();

      const currency = posting.amount.currency;
      const debits = posting.isDebit ? posting.amount : Money.zero(currency);
      const credits = posting.isCredit ? posting.amount : Money.zero(currency);
      const previousBalance = (await this.repository.getAccountBalances(posting.accountId))?.balances.get(BalanceType.LEDGER) ?? Money.zero(currency);
      const newBalance = await this.repository.updateBalance(
        posting.accountId,
        currency,
        debits,
        credits,
        BalanceType.LEDGER,
      );

      this.eventBus.publish(
        new BalanceChanged(
          posting.accountId.value,
          posting.accountId,
          BalanceType.LEDGER,
          previousBalance,
          newBalance,
          journal.id,
        ),
      );
    }

    await this.repository.saveJournal(journal);
    await this.repository.savePostings(postings);

    const ledgerPosted = new LedgerPosted(
      journal.id.value,
      journal.id,
      postings.map((posting) => posting.id),
      journal.postingType,
      Money.fromMinorUnits(journal.totalDebits, journal.currency),
      postings.map((posting) => posting.accountId),
    );
    this.eventBus.publish(ledgerPosted);

    return { success: true, journal, postings, errors: [] };
  }

  async postJournal(request: PostJournalRequest): Promise<PostJournalResult> {
    // Build journal entries
    const journalEntries: JournalEntry[] = request.entries.map((entry) =>
      entry.isDebit
        ? JournalEntry.debit(entry.accountId, entry.amount, entry.description)
        : JournalEntry.credit(entry.accountId, entry.amount, entry.description),
    );

    // Create journal
    const journal = Journal.create({
      id: request.journalId,
      description: request.description,
      postingType: request.postingType,
      entries: journalEntries,
      metadata: request.metadata,
    });

    const result = await this.post(journal);
    if (!result.success || !result.journal) {
      throw new Error(`Journal posting failed: ${result.errors.join(', ')}`);
    }

    return {
      journal: result.journal,
      postings: result.postings,
      events: [],
    };
  }

  async getJournal(journalId: JournalId): Promise<Journal | null> {
    return this.repository.findJournalById(journalId);
  }

  async getPostingsByJournal(journalId: JournalId): Promise<Posting[]> {
    return this.repository.findPostingsByJournalId(journalId);
  }
}
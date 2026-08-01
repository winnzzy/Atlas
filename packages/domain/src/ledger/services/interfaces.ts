import { LedgerAccountId } from '../value-objects/ledger-account-id';
import { JournalId } from '../value-objects/journal-id';
import { PostingId } from '../value-objects/posting-id';
import { Money } from '../value-objects/money';
import { Journal } from '../entities/journal';
import { Posting } from '../entities/posting';
import { Hold } from '../entities/hold';
import { Settlement } from '../entities/settlement';
import { BalanceSnapshot } from '../entities/balance-snapshot';
import { Reversal } from '../entities/reversal';
import { BalanceType, PostingStatus } from '../enums';
import { DomainEvent } from '../events';

export interface LedgerAccountBalance {
  accountId: LedgerAccountId;
  currency: string;
  balances: Map<BalanceType, Money>;
}

export interface LedgerRepository {
  findJournalById(id: JournalId): Promise<Journal | null>;
  findPostingById(id: PostingId): Promise<Posting | null>;
  findPostingsByJournalId(journalId: JournalId): Promise<Posting[]>;
  findHoldById(id: string): Promise<Hold | null>;
  findHoldsByAccountId(accountId: LedgerAccountId): Promise<Hold[]>;
  findActiveHoldsByAccountId(accountId: LedgerAccountId): Promise<Hold[]>;
  findSettlementById(id: string): Promise<Settlement | null>;
  findReversalByOriginalJournalId(journalId: JournalId): Promise<Reversal | null>;
  findBalanceSnapshot(accountId: LedgerAccountId, balanceType: BalanceType): Promise<BalanceSnapshot | null>;
  getAccountBalances(accountId: LedgerAccountId): Promise<LedgerAccountBalance | null>;
  saveJournal(journal: Journal): Promise<void>;
  savePostings(postings: Posting[]): Promise<void>;
  updatePostingStatus(postingId: PostingId, status: PostingStatus): Promise<void>;
  saveHold(hold: Hold): Promise<void>;
  updateHold(hold: Hold): Promise<void>;
  saveSettlement(settlement: Settlement): Promise<void>;
  updateSettlement(settlement: Settlement): Promise<void>;
  saveReversal(reversal: Reversal): Promise<void>;
  saveBalanceSnapshot(snapshot: BalanceSnapshot): Promise<void>;
  updateBalance(accountId: LedgerAccountId, currency: string, debits: Money, credits: Money, balanceType: BalanceType): Promise<Money>;
  checkPostingIdExists(postingId: PostingId): Promise<boolean>;
}

export interface EventBus {
  publish(event: DomainEvent): void;
}
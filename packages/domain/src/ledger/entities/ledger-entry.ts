import { LedgerAccountId } from '../value-objects/ledger-account-id';
import { JournalId } from '../value-objects/journal-id';
import { PostingId } from '../value-objects/posting-id';
import { Money } from '../value-objects/money';
import { EntrySide, PostingType } from '../enums';

export interface LedgerEntryProps {
  id: PostingId;
  journalId: JournalId;
  accountId: LedgerAccountId;
  side: EntrySide;
  amount: Money;
  postingType: PostingType;
  description?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
}

/**
 * LedgerEntry - A permanent record of a financial transaction in the ledger.
 * Immutable once created. Each entry is linked to a journal and an account.
 */
export class LedgerEntry {
  private constructor(private readonly props: LedgerEntryProps) {}

  static create(params: {
    id?: PostingId;
    journalId: JournalId;
    accountId: LedgerAccountId;
    side: EntrySide;
    amount: Money;
    postingType: PostingType;
    description?: string;
    metadata?: Record<string, string>;
  }): LedgerEntry {
    const id = params.id ?? PostingId.generate();
    return new LedgerEntry({
      id,
      journalId: params.journalId,
      accountId: params.accountId,
      side: params.side,
      amount: params.amount,
      postingType: params.postingType,
      description: params.description,
      metadata: params.metadata,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: LedgerEntryProps): LedgerEntry {
    return new LedgerEntry(props);
  }

  get id(): PostingId {
    return this.props.id;
  }

  get journalId(): JournalId {
    return this.props.journalId;
  }

  get accountId(): LedgerAccountId {
    return this.props.accountId;
  }

  get side(): EntrySide {
    return this.props.side;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get postingType(): PostingType {
    return this.props.postingType;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get metadata(): Record<string, string> | undefined {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isDebit(): boolean {
    return this.props.side === EntrySide.DEBIT;
  }

  get isCredit(): boolean {
    return this.props.side === EntrySide.CREDIT;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.props.id.value,
      journalId: this.props.journalId.value,
      accountId: this.props.accountId.value,
      side: this.props.side,
      amount: this.props.amount.toString(),
      currency: this.props.amount.currency,
      postingType: this.props.postingType,
      description: this.props.description,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}
import { PostingId } from '../value-objects/posting-id';
import { LedgerAccountId } from '../value-objects/ledger-account-id';
import { JournalId } from '../value-objects/journal-id';
import { Money } from '../value-objects/money';
import { ReferenceNumber } from '../value-objects/reference-number';
import { TransactionReference } from '../value-objects/transaction-reference';
import { PostingType, PostingStatus, EntrySide } from '../enums';

export interface PostingProps {
  id: PostingId;
  journalId: JournalId;
  accountId: LedgerAccountId;
  amount: Money;
  side: EntrySide;
  postingType: PostingType;
  status: PostingStatus;
  referenceNumber?: ReferenceNumber;
  transactionReference?: TransactionReference;
  description?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  postedAt?: Date;
  reversedAt?: Date;
  reversalPostingId?: PostingId;
}

/**
 * Posting - Represents a single financial posting to a ledger account.
 * This is the primary transaction record that affects account balances.
 */
export class Posting {
  private constructor(private readonly props: PostingProps) {}

  static create(params: {
    id?: PostingId;
    journalId: JournalId;
    accountId: LedgerAccountId;
    amount: Money;
    side: EntrySide;
    postingType: PostingType;
    referenceNumber?: ReferenceNumber;
    transactionReference?: TransactionReference;
    description?: string;
    metadata?: Record<string, string>;
  }): Posting {
    const id = params.id ?? PostingId.generate();
    return new Posting({
      id,
      journalId: params.journalId,
      accountId: params.accountId,
      amount: params.amount,
      side: params.side,
      postingType: params.postingType,
      status: PostingStatus.PENDING,
      referenceNumber: params.referenceNumber,
      transactionReference: params.transactionReference,
      description: params.description,
      metadata: params.metadata,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: PostingProps): Posting {
    return new Posting(props);
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

  get amount(): Money {
    return this.props.amount;
  }

  get side(): EntrySide {
    return this.props.side;
  }

  get postingType(): PostingType {
    return this.props.postingType;
  }

  get status(): PostingStatus {
    return this.props.status;
  }

  get referenceNumber(): ReferenceNumber | undefined {
    return this.props.referenceNumber;
  }

  get transactionReference(): TransactionReference | undefined {
    return this.props.transactionReference;
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

  get postedAt(): Date | undefined {
    return this.props.postedAt;
  }

  get reversedAt(): Date | undefined {
    return this.props.reversedAt;
  }

  get reversalPostingId(): PostingId | undefined {
    return this.props.reversalPostingId;
  }

  get isDebit(): boolean {
    return this.props.side === EntrySide.DEBIT;
  }

  get isCredit(): boolean {
    return this.props.side === EntrySide.CREDIT;
  }

  get isPending(): boolean {
    return this.props.status === PostingStatus.PENDING;
  }

  get isPosted(): boolean {
    return this.props.status === PostingStatus.POSTED;
  }

  get isReversed(): boolean {
    return this.props.status === PostingStatus.REVERSED;
  }

  get isFailed(): boolean {
    return this.props.status === PostingStatus.FAILED;
  }

  get signedAmount(): bigint {
    return this.isDebit ? this.props.amount.amount : -this.props.amount.amount;
  }

  post(): void {
    if (this.props.status !== PostingStatus.PENDING) {
      throw new Error(`Cannot post posting in ${this.props.status} status`);
    }
    this.props.status = PostingStatus.POSTED;
    this.props.postedAt = new Date();
  }

  reverse(reversalPostingId: PostingId): void {
    if (this.props.status !== PostingStatus.POSTED) {
      throw new Error(`Cannot reverse posting in ${this.props.status} status`);
    }
    this.props.status = PostingStatus.REVERSED;
    this.props.reversedAt = new Date();
    this.props.reversalPostingId = reversalPostingId;
  }

  fail(): void {
    if (this.props.status !== PostingStatus.PENDING) {
      throw new Error(`Cannot fail posting in ${this.props.status} status`);
    }
    this.props.status = PostingStatus.FAILED;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.props.id.value,
      journalId: this.props.journalId.value,
      accountId: this.props.accountId.value,
      amount: this.props.amount.toString(),
      currency: this.props.amount.currency,
      side: this.props.side,
      postingType: this.props.postingType,
      status: this.props.status,
      referenceNumber: this.props.referenceNumber?.value,
      transactionReference: this.props.transactionReference?.toString(),
      description: this.props.description,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      postedAt: this.props.postedAt?.toISOString(),
      reversedAt: this.props.reversedAt?.toISOString(),
      reversalPostingId: this.props.reversalPostingId?.value,
    };
  }
}
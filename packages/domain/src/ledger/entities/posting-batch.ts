import { PostingId } from '../value-objects/posting-id';
import { JournalId } from '../value-objects/journal-id';
import { Money } from '../value-objects/money';
import { PostingBatchStatus } from '../enums';
import { Posting } from './posting';

export interface PostingBatchProps {
  id: string;
  journalId: JournalId;
  postings: Posting[];
  status: PostingBatchStatus;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * PostingBatch - Groups multiple postings that must be committed atomically.
 * Ensures all-or-nothing semantics for multi-account transactions.
 */
export class PostingBatch {
  private constructor(private readonly props: PostingBatchProps) {}

  static create(params: {
    id?: string;
    journalId: JournalId;
    postings: Posting[];
  }): PostingBatch {
    const id = params.id ?? `batch_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    return new PostingBatch({
      id,
      journalId: params.journalId,
      postings: params.postings,
      status: PostingBatchStatus.PENDING,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: PostingBatchProps): PostingBatch {
    return new PostingBatch(props);
  }

  get id(): string {
    return this.props.id;
  }

  get journalId(): JournalId {
    return this.props.journalId;
  }

  get postings(): readonly Posting[] {
    return this.props.postings;
  }

  get status(): PostingBatchStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get postingIds(): PostingId[] {
    return this.props.postings.map((p) => p.id);
  }

  get totalDebits(): Money {
    const debitPostings = this.props.postings.filter((p) => p.isDebit);
    if (debitPostings.length === 0) {
      return Money.zero(this.props.postings[0]?.amount.currency ?? 'USD');
    }
    const total = debitPostings.reduce((sum, p) => sum + p.amount.amount, 0n);
    return Money.fromMinorUnits(total, debitPostings[0]!.amount.currency);
  }

  get totalCredits(): Money {
    const creditPostings = this.props.postings.filter((p) => p.isCredit);
    if (creditPostings.length === 0) {
      return Money.zero(this.props.postings[0]?.amount.currency ?? 'USD');
    }
    const total = creditPostings.reduce((sum, p) => sum + p.amount.amount, 0n);
    return Money.fromMinorUnits(total, creditPostings[0]!.amount.currency);
  }

  get isBalanced(): boolean {
    return this.totalDebits.amount === this.totalCredits.amount;
  }

  commit(): void {
    if (this.props.status !== PostingBatchStatus.PENDING) {
      throw new Error(`Cannot commit batch in ${this.props.status} status`);
    }
    for (const posting of this.props.postings) {
      posting.post();
    }
    this.props.status = PostingBatchStatus.COMMITTED;
    this.props.completedAt = new Date();
  }

  rollback(): void {
    if (this.props.status !== PostingBatchStatus.PENDING) {
      throw new Error(`Cannot rollback batch in ${this.props.status} status`);
    }
    for (const posting of this.props.postings) {
      posting.fail();
    }
    this.props.status = PostingBatchStatus.ROLLED_BACK;
    this.props.completedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      journalId: this.props.journalId.value,
      postings: this.props.postings.map((p) => p.toJSON()),
      status: this.props.status,
      createdAt: this.props.createdAt.toISOString(),
      completedAt: this.props.completedAt?.toISOString(),
    };
  }
}
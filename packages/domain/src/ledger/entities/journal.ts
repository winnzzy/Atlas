import { JournalId } from '../value-objects/journal-id';
import { JournalStatus, PostingType } from '../enums';
import { JournalEntry } from './journal-entry';

export interface JournalProps {
  id: JournalId;
  description: string;
  postingType: PostingType;
  status: JournalStatus;
  entries: JournalEntry[];
  metadata?: Record<string, string>;
  createdAt: Date;
  postedAt?: Date;
  reversedAt?: Date;
  reversalJournalId?: JournalId;
}

/**
 * Journal - A collection of journal entries that must balance (debits == credits).
 * This is the primary unit of work in double-entry bookkeeping.
 */
export class Journal {
  private constructor(private readonly props: JournalProps) {}

  static create(params: {
    id?: JournalId;
    description: string;
    postingType: PostingType;
    entries: JournalEntry[];
    metadata?: Record<string, string>;
  }): Journal {
    const id = params.id ?? JournalId.generate();
    return new Journal({
      id,
      description: params.description,
      postingType: params.postingType,
      status: JournalStatus.DRAFT,
      entries: params.entries,
      metadata: params.metadata,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: JournalProps): Journal {
    return new Journal(props);
  }

  get id(): JournalId {
    return this.props.id;
  }

  get description(): string {
    return this.props.description;
  }

  get postingType(): PostingType {
    return this.props.postingType;
  }

  get status(): JournalStatus {
    return this.props.status;
  }

  get entries(): readonly JournalEntry[] {
    return this.props.entries;
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

  get reversalJournalId(): JournalId | undefined {
    return this.props.reversalJournalId;
  }

  get isPosted(): boolean {
    return this.props.status === JournalStatus.POSTED;
  }

  get isReversed(): boolean {
    return this.props.status === JournalStatus.REVERSED;
  }

  get isDraft(): boolean {
    return this.props.status === JournalStatus.DRAFT;
  }

  get totalDebits(): bigint {
    return this.props.entries
      .filter((e) => e.isDebit)
      .reduce((sum, e) => sum + e.amount.amount, 0n);
  }

  get totalCredits(): bigint {
    return this.props.entries
      .filter((e) => e.isCredit)
      .reduce((sum, e) => sum + e.amount.amount, 0n);
  }

  get isBalanced(): boolean {
    return this.totalDebits === this.totalCredits;
  }

  get currency(): string {
    if (this.props.entries.length === 0) {
      throw new Error('Cannot determine currency of empty journal');
    }
    return this.props.entries[0]!.amount.currency;
  }

  post(): void {
    if (this.props.status !== JournalStatus.DRAFT) {
      throw new Error(`Cannot post journal in ${this.props.status} status`);
    }
    if (!this.isBalanced) {
      throw new Error('Cannot post unbalanced journal: debits must equal credits');
    }
    if (this.props.entries.length < 2) {
      throw new Error('Journal must have at least 2 entries');
    }
    this.props.status = JournalStatus.POSTED;
    this.props.postedAt = new Date();
  }

  reverse(reversalJournalId: JournalId): void {
    if (this.props.status !== JournalStatus.POSTED) {
      throw new Error(`Cannot reverse journal in ${this.props.status} status`);
    }
    this.props.status = JournalStatus.REVERSED;
    this.props.reversedAt = new Date();
    this.props.reversalJournalId = reversalJournalId;
  }

  cancel(): void {
    if (this.props.status !== JournalStatus.DRAFT) {
      throw new Error(`Cannot cancel journal in ${this.props.status} status`);
    }
    this.props.status = JournalStatus.CANCELLED;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.props.id.value,
      description: this.props.description,
      postingType: this.props.postingType,
      status: this.props.status,
      entries: this.props.entries.map((e) => e.toJSON()),
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      postedAt: this.props.postedAt?.toISOString(),
      reversedAt: this.props.reversedAt?.toISOString(),
      reversalJournalId: this.props.reversalJournalId?.value,
    };
  }
}
import { JournalId } from '../value-objects/journal-id';
import { Money } from '../value-objects/money';
import { ReversalType, ReversalReasonCode } from '../enums';

export interface ReversalProps {
  id: string;
  originalJournalId: JournalId;
  reversalJournalId?: JournalId;
  type: ReversalType;
  reasonCode: ReversalReasonCode;
  reason: string;
  amount: Money;
  completedAt?: Date;
  createdAt: Date;
  createdBy?: string;
}

/**
 * Reversal - Represents the reversal of a previously posted journal.
 * Supports full, partial, and linked reversals with reason codes.
 */
export class Reversal {
  private constructor(private readonly props: ReversalProps) {}

  static create(params: {
    id?: string;
    originalJournalId: JournalId;
    type: ReversalType;
    reasonCode: ReversalReasonCode;
    reason: string;
    amount: Money;
    createdBy?: string;
  }): Reversal {
    const id = params.id ?? `rev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    return new Reversal({
      id,
      originalJournalId: params.originalJournalId,
      type: params.type,
      reasonCode: params.reasonCode,
      reason: params.reason,
      amount: params.amount,
      createdAt: new Date(),
      createdBy: params.createdBy,
    });
  }

  static reconstitute(props: ReversalProps): Reversal {
    return new Reversal(props);
  }

  get id(): string {
    return this.props.id;
  }

  get originalJournalId(): JournalId {
    return this.props.originalJournalId;
  }

  get reversalJournalId(): JournalId | undefined {
    return this.props.reversalJournalId;
  }

  get type(): ReversalType {
    return this.props.type;
  }

  get reasonCode(): ReversalReasonCode {
    return this.props.reasonCode;
  }

  get reason(): string {
    return this.props.reason;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get createdBy(): string | undefined {
    return this.props.createdBy;
  }

  get isFull(): boolean {
    return this.props.type === ReversalType.FULL;
  }

  get isPartial(): boolean {
    return this.props.type === ReversalType.PARTIAL;
  }

  get isCompleted(): boolean {
    return this.props.completedAt !== undefined;
  }

  linkReversalJournal(journalId: JournalId): void {
    if (this.props.reversalJournalId) {
      throw new Error('Reversal already has a linked journal');
    }
    this.props.reversalJournalId = journalId;
  }

  complete(): void {
    if (this.props.completedAt) {
      throw new Error('Reversal already completed');
    }
    this.props.completedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      originalJournalId: this.props.originalJournalId.value,
      reversalJournalId: this.props.reversalJournalId?.value,
      type: this.props.type,
      reasonCode: this.props.reasonCode,
      reason: this.props.reason,
      amount: this.props.amount.toString(),
      currency: this.props.amount.currency,
      completedAt: this.props.completedAt?.toISOString(),
      createdAt: this.props.createdAt.toISOString(),
      createdBy: this.props.createdBy,
    };
  }
}
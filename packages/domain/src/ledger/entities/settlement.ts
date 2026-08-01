import { LedgerAccountId } from '../value-objects/ledger-account-id';
import { JournalId } from '../value-objects/journal-id';
import { Money } from '../value-objects/money';
import { SettlementStatus } from '../enums';

export interface SettlementProps {
  id: string;
  journalId: JournalId;
  sourceAccountId: LedgerAccountId;
  destinationAccountId: LedgerAccountId;
  amount: Money;
  status: SettlementStatus;
  description?: string;
  createdAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, string>;
}

/**
 * Settlement - Represents the final settlement of funds between accounts.
 * Used for inter-account transfers, clearing, and netting operations.
 */
export class Settlement {
  private constructor(private readonly props: SettlementProps) {}

  static create(params: {
    id?: string;
    journalId: JournalId;
    sourceAccountId: LedgerAccountId;
    destinationAccountId: LedgerAccountId;
    amount: Money;
    description?: string;
    metadata?: Record<string, string>;
  }): Settlement {
    const id = params.id ?? `stl_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    return new Settlement({
      id,
      journalId: params.journalId,
      sourceAccountId: params.sourceAccountId,
      destinationAccountId: params.destinationAccountId,
      amount: params.amount,
      status: SettlementStatus.PENDING,
      description: params.description,
      createdAt: new Date(),
      metadata: params.metadata,
    });
  }

  static reconstitute(props: SettlementProps): Settlement {
    return new Settlement(props);
  }

  get id(): string {
    return this.props.id;
  }

  get journalId(): JournalId {
    return this.props.journalId;
  }

  get sourceAccountId(): LedgerAccountId {
    return this.props.sourceAccountId;
  }

  get destinationAccountId(): LedgerAccountId {
    return this.props.destinationAccountId;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get status(): SettlementStatus {
    return this.props.status;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get failedAt(): Date | undefined {
    return this.props.failedAt;
  }

  get failureReason(): string | undefined {
    return this.props.failureReason;
  }

  get metadata(): Record<string, string> | undefined {
    return this.props.metadata;
  }

  get isPending(): boolean {
    return this.props.status === SettlementStatus.PENDING;
  }

  get isCompleted(): boolean {
    return this.props.status === SettlementStatus.COMPLETED;
  }

  get isFailed(): boolean {
    return this.props.status === SettlementStatus.FAILED;
  }

  complete(): void {
    if (this.props.status !== SettlementStatus.PENDING && this.props.status !== SettlementStatus.IN_PROGRESS) {
      throw new Error(`Cannot complete settlement in ${this.props.status} status`);
    }
    this.props.status = SettlementStatus.COMPLETED;
    this.props.completedAt = new Date();
  }

  start(): void {
    if (this.props.status !== SettlementStatus.PENDING) {
      throw new Error(`Cannot start settlement in ${this.props.status} status`);
    }
    this.props.status = SettlementStatus.IN_PROGRESS;
  }

  fail(reason: string): void {
    if (this.props.status === SettlementStatus.COMPLETED) {
      throw new Error('Cannot fail a completed settlement');
    }
    this.props.status = SettlementStatus.FAILED;
    this.props.failedAt = new Date();
    this.props.failureReason = reason;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      journalId: this.props.journalId.value,
      sourceAccountId: this.props.sourceAccountId.value,
      destinationAccountId: this.props.destinationAccountId.value,
      amount: this.props.amount.toString(),
      currency: this.props.amount.currency,
      status: this.props.status,
      description: this.props.description,
      createdAt: this.props.createdAt.toISOString(),
      completedAt: this.props.completedAt?.toISOString(),
      failedAt: this.props.failedAt?.toISOString(),
      failureReason: this.props.failureReason,
      metadata: this.props.metadata,
    };
  }
}
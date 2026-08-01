import { LedgerAccountId } from '../value-objects/ledger-account-id';
import { JournalId } from '../value-objects/journal-id';
import { Money } from '../value-objects/money';
import { HoldStatus } from '../enums';

export interface HoldProps {
  id: string;
  accountId: LedgerAccountId;
  journalId?: JournalId;
  amount: Money;
  originalAmount: Money;
  releasedAmount: Money;
  status: HoldStatus;
  reason: string;
  expiresAt: Date;
  createdAt: Date;
  releasedAt?: Date;
  capturedAt?: Date;
}

/**
 * Hold - Represents a reservation of funds on a ledger account.
 * Supports full/partial release, expiration, and capture.
 */
export class Hold {
  private constructor(private readonly props: HoldProps) {}

  static create(params: {
    id?: string;
    accountId: LedgerAccountId;
    journalId?: JournalId;
    amount: Money;
    reason: string;
    expiresInMs?: number;
  }): Hold {
    const id = params.id ?? `hold_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    const expiresInMs = params.expiresInMs ?? 24 * 60 * 60 * 1000; // Default 24 hours
    return new Hold({
      id,
      accountId: params.accountId,
      journalId: params.journalId,
      amount: params.amount,
      originalAmount: params.amount,
      releasedAmount: Money.zero(params.amount.currency),
      status: HoldStatus.ACTIVE,
      reason: params.reason,
      expiresAt: new Date(Date.now() + expiresInMs),
      createdAt: new Date(),
    });
  }

  static reconstitute(props: HoldProps): Hold {
    return new Hold(props);
  }

  get id(): string {
    return this.props.id;
  }

  get accountId(): LedgerAccountId {
    return this.props.accountId;
  }

  get journalId(): JournalId | undefined {
    return this.props.journalId;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get originalAmount(): Money {
    return this.props.originalAmount;
  }

  get releasedAmount(): Money {
    return this.props.releasedAmount;
  }

  get status(): HoldStatus {
    return this.props.status;
  }

  get reason(): string {
    return this.props.reason;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get releasedAt(): Date | undefined {
    return this.props.releasedAt;
  }

  get capturedAt(): Date | undefined {
    return this.props.capturedAt;
  }

  get isActive(): boolean {
    return this.props.status === HoldStatus.ACTIVE || this.props.status === HoldStatus.PARTIALLY_RELEASED;
  }

  get isExpired(): boolean {
    return this.props.status === HoldStatus.EXPIRED;
  }

  get remainingAmount(): Money {
    return this.props.originalAmount.subtract(this.props.releasedAmount);
  }

  release(amount?: Money): void {
    if (!this.isActive) {
      throw new Error(`Cannot release hold in ${this.props.status} status`);
    }

    const releaseAmount = amount ?? this.props.amount;
    if (releaseAmount.greaterThan(this.props.amount)) {
      throw new Error('Release amount exceeds held amount');
    }

    this.props.releasedAmount = this.props.releasedAmount.add(releaseAmount);
    this.props.amount = this.props.amount.subtract(releaseAmount);

    if (this.props.amount.isZero) {
      this.props.status = HoldStatus.RELEASED;
      this.props.releasedAt = new Date();
    } else {
      this.props.status = HoldStatus.PARTIALLY_RELEASED;
    }
  }

  capture(): void {
    if (!this.isActive) {
      throw new Error(`Cannot capture hold in ${this.props.status} status`);
    }
    this.props.status = HoldStatus.CAPTURED;
    this.props.capturedAt = new Date();
  }

  expire(): void {
    if (!this.isActive) {
      throw new Error(`Cannot expire hold in ${this.props.status} status`);
    }
    this.props.status = HoldStatus.EXPIRED;
    this.props.releasedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      accountId: this.props.accountId.value,
      journalId: this.props.journalId?.value,
      amount: this.props.amount.toString(),
      originalAmount: this.props.originalAmount.toString(),
      releasedAmount: this.props.releasedAmount.toString(),
      currency: this.props.amount.currency,
      status: this.props.status,
      reason: this.props.reason,
      expiresAt: this.props.expiresAt.toISOString(),
      createdAt: this.props.createdAt.toISOString(),
      releasedAt: this.props.releasedAt?.toISOString(),
      capturedAt: this.props.capturedAt?.toISOString(),
    };
  }
}
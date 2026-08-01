import { LedgerAccountId } from '../value-objects/ledger-account-id';
import { Money } from '../value-objects/money';
import { BalanceType } from '../enums';

export interface BalanceSnapshotProps {
  id: string;
  accountId: LedgerAccountId;
  balanceType: BalanceType;
  balance: Money;
  asOf: Date;
  createdAt: Date;
}

/**
 * BalanceSnapshot - An immutable point-in-time record of an account balance.
 * Used for reconciliation, reporting, and audit trails.
 */
export class BalanceSnapshot {
  private constructor(private readonly props: BalanceSnapshotProps) {}

  static create(params: {
    id?: string;
    accountId: LedgerAccountId;
    balanceType: BalanceType;
    balance: Money;
    asOf?: Date;
  }): BalanceSnapshot {
    const id = params.id ?? `snap_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    return new BalanceSnapshot({
      id,
      accountId: params.accountId,
      balanceType: params.balanceType,
      balance: params.balance,
      asOf: params.asOf ?? new Date(),
      createdAt: new Date(),
    });
  }

  static reconstitute(props: BalanceSnapshotProps): BalanceSnapshot {
    return new BalanceSnapshot(props);
  }

  get id(): string {
    return this.props.id;
  }

  get accountId(): LedgerAccountId {
    return this.props.accountId;
  }

  get balanceType(): BalanceType {
    return this.props.balanceType;
  }

  get balance(): Money {
    return this.props.balance;
  }

  get asOf(): Date {
    return this.props.asOf;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  equals(other: BalanceSnapshot): boolean {
    return (
      this.props.accountId.equals(other.accountId) &&
      this.props.balanceType === other.balanceType &&
      this.props.balance.equals(other.balance)
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      accountId: this.props.accountId.value,
      balanceType: this.props.balanceType,
      balance: this.props.balance.toString(),
      currency: this.props.balance.currency,
      asOf: this.props.asOf.toISOString(),
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}
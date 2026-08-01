import { Money } from '../value-objects/money';
import { LedgerAccountId } from '../value-objects/ledger-account-id';
import { EntrySide } from '../enums';

export interface JournalEntryProps {
  accountId: LedgerAccountId;
  side: EntrySide;
  amount: Money;
  description?: string;
  metadata?: Record<string, string>;
}

/**
 * JournalEntry - A single line in a journal (debit or credit).
 * Each journal entry represents one side of a double-entry transaction.
 */
export class JournalEntry {
  private constructor(private readonly props: JournalEntryProps) {}

  static debit(accountId: LedgerAccountId, amount: Money, description?: string): JournalEntry {
    if (!amount.isPositive) {
      throw new Error('Debit amount must be positive');
    }
    return new JournalEntry({
      accountId,
      side: EntrySide.DEBIT,
      amount,
      description,
    });
  }

  static credit(accountId: LedgerAccountId, amount: Money, description?: string): JournalEntry {
    if (!amount.isPositive) {
      throw new Error('Credit amount must be positive');
    }
    return new JournalEntry({
      accountId,
      side: EntrySide.CREDIT,
      amount,
      description,
    });
  }

  static reconstitute(props: JournalEntryProps): JournalEntry {
    return new JournalEntry(props);
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

  get description(): string | undefined {
    return this.props.description;
  }

  get metadata(): Record<string, string> | undefined {
    return this.props.metadata;
  }

  get isDebit(): boolean {
    return this.props.side === EntrySide.DEBIT;
  }

  get isCredit(): boolean {
    return this.props.side === EntrySide.CREDIT;
  }

  toJSON(): Record<string, unknown> {
    return {
      accountId: this.props.accountId.value,
      side: this.props.side,
      amount: this.props.amount.toString(),
      currency: this.props.amount.currency,
      description: this.props.description,
      metadata: this.props.metadata,
    };
  }
}
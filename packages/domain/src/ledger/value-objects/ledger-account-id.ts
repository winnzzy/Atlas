/**
 * LedgerAccountId - Branded type for ledger account identifiers.
 * Prevents mixing up different ID types at compile time.
 */
export class LedgerAccountId {
  private readonly _value: string;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('LedgerAccountId cannot be empty');
    }
    this._value = value;
  }

  static from(value: string): LedgerAccountId {
    return new LedgerAccountId(value);
  }

  static generate(): LedgerAccountId {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return new LedgerAccountId(`lacct_${timestamp}_${random}`);
  }

  get value(): string {
    return this._value;
  }

  equals(other: LedgerAccountId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
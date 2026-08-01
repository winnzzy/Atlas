/**
 * TransactionReference - External transaction reference for cross-system correlation.
 * Links ledger entries to external systems (SWIFT, ACH, card networks, etc.).
 */
export class TransactionReference {
  private readonly _value: string;
  private readonly _system: string;

  private constructor(value: string, system: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('TransactionReference value cannot be empty');
    }
    if (!system || system.trim().length === 0) {
      throw new Error('TransactionReference system cannot be empty');
    }
    this._value = value;
    this._system = system;
  }

  static from(value: string, system: string): TransactionReference {
    return new TransactionReference(value, system);
  }

  static generate(system: string): TransactionReference {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return new TransactionReference(`${system}-${timestamp}-${random}`, system);
  }

  get value(): string {
    return this._value;
  }

  get system(): string {
    return this._system;
  }

  equals(other: TransactionReference): boolean {
    return this._value === other._value && this._system === other._system;
  }

  toString(): string {
    return `${this._system}:${this._value}`;
  }
}
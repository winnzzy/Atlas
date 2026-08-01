/**
 * ReferenceNumber - Human-readable reference number for ledger transactions.
 * Used for customer-facing identifiers and external references.
 */
export class ReferenceNumber {
  private readonly _value: string;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('ReferenceNumber cannot be empty');
    }
    if (value.length > 50) {
      throw new Error('ReferenceNumber cannot exceed 50 characters');
    }
    this._value = value;
  }

  static from(value: string): ReferenceNumber {
    return new ReferenceNumber(value);
  }

  static generate(prefix = 'REF'): ReferenceNumber {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return new ReferenceNumber(`${prefix}-${timestamp}-${random}`);
  }

  get value(): string {
    return this._value;
  }

  equals(other: ReferenceNumber): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
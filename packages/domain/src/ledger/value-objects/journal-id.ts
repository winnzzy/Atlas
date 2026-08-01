/**
 * JournalId - Branded type for journal entry identifiers.
 */
export class JournalId {
  private readonly _value: string;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('JournalId cannot be empty');
    }
    this._value = value;
  }

  static from(value: string): JournalId {
    return new JournalId(value);
  }

  static generate(): JournalId {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return new JournalId(`jrn_${timestamp}_${random}`);
  }

  get value(): string {
    return this._value;
  }

  equals(other: JournalId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
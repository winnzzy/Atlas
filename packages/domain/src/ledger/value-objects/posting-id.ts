/**
 * PostingId - Branded type for posting identifiers.
 */
export class PostingId {
  private readonly _value: string;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('PostingId cannot be empty');
    }
    this._value = value;
  }

  static from(value: string): PostingId {
    return new PostingId(value);
  }

  static generate(): PostingId {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return new PostingId(`pst_${timestamp}_${random}`);
  }

  get value(): string {
    return this._value;
  }

  equals(other: PostingId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
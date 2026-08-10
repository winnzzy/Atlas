/**
 * Money Value Object - Immutable financial amount with currency.
 * All monetary calculations go through this object.
 * Amounts are stored as integers in minor units (cents) to avoid floating point.
 */
export class Money {
  private constructor(
    private readonly _amount: bigint,
    private readonly _currency: string,
    allowNegative = false,
  ) {
    if (!allowNegative && _amount < 0n) {
      throw new Error('Money amount cannot be negative');
    }
    if (!_currency || _currency.length !== 3) {
      throw new Error('Currency must be a 3-letter ISO code');
    }
  }

  static fromMinorUnits(amount: bigint, currency: string): Money {
    return new Money(amount, currency.toUpperCase());
  }

  static fromSignedMinorUnits(amount: bigint, currency: string): Money {
    return new Money(amount, currency.toUpperCase(), true);
  }

  static fromDecimal(amount: number, currency: string, decimals = 2): Money {
    const factor = 10 ** decimals;
    const minor = BigInt(Math.round(amount * factor));
    return new Money(minor, currency.toUpperCase());
  }

  static fromString(amount: string, currency: string): Money {
    const parsed = BigInt(amount);
    return new Money(parsed, currency.toUpperCase());
  }

  static zero(currency: string): Money {
    return new Money(0n, currency.toUpperCase());
  }

  get amount(): bigint {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  get isZero(): boolean {
    return this._amount === 0n;
  }

  get isPositive(): boolean {
    return this._amount > 0n;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this._amount + other._amount, this._currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this._amount - other._amount;
    return new Money(result, this._currency);
  }

  negate(): Money {
    return new Money(this._amount, this._currency);
  }

  multiply(factor: number): Money {
    const result = BigInt(Math.round(Number(this._amount) * factor));
    return new Money(result, this._currency);
  }

  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }

  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._amount > other._amount;
  }

  lessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._amount < other._amount;
  }

  greaterThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._amount >= other._amount;
  }

  lessThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._amount <= other._amount;
  }

  isGreaterThanZero(): boolean {
    return this._amount > 0n;
  }

  toString(): string {
    return this._amount.toString();
  }

  toDecimal(decimals = 2): string {
    const factor = 10n ** BigInt(decimals);
    const whole = this._amount / factor;
    const frac = this._amount % factor;
    return `${whole}.${frac.toString().padStart(decimals, '0')}`;
  }

  toJSON(): string {
    return JSON.stringify({
      amount: this._amount.toString(),
      currency: this._currency,
    });
  }

  private assertSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new Error(
        `Currency mismatch: cannot operate on ${this._currency} and ${other._currency}`,
      );
    }
  }
}

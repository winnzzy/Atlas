/**
 * Currency Value Object
 * Validates and encapsulates ISO 4217 currency codes.
 */
export class Currency {
  private static readonly SUPPORTED_CURRENCIES: Record<string, number> = {
    USD: 2,
    EUR: 2,
    GBP: 2,
    JPY: 0,
    CAD: 2,
    AUD: 2,
    CHF: 2,
    CNY: 2,
    INR: 2,
    BRL: 2,
    BTC: 8,
    ETH: 18,
  };

  private constructor(
    private readonly _code: string,
    private readonly _decimals: number,
  ) {}

  static of(code: string): Currency {
    const upper = code.toUpperCase();
    const decimals = Currency.SUPPORTED_CURRENCIES[upper];
    if (decimals === undefined) {
      throw new Error(`Unsupported currency: ${code}`);
    }
    return new Currency(upper, decimals);
  }

  static usd(): Currency {
    return new Currency('USD', 2);
  }

  static eur(): Currency {
    return new Currency('EUR', 2);
  }

  static gbp(): Currency {
    return new Currency('GBP', 2);
  }

  static btc(): Currency {
    return new Currency('BTC', 8);
  }

  get code(): string {
    return this._code;
  }

  get decimals(): number {
    return this._decimals;
  }

  get isCrypto(): boolean {
    return this._code === 'BTC' || this._code === 'ETH';
  }

  get isFiat(): boolean {
    return !this.isCrypto;
  }

  equals(other: Currency): boolean {
    return this._code === other._code;
  }

  toString(): string {
    return this._code;
  }
}

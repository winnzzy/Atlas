import { Money } from '../value-objects/money';

describe('Money', () => {
  describe('creation', () => {
    it('should create money from minor units', () => {
      const money = Money.fromMinorUnits(1000n, 'USD');
      expect(money.amount).toBe(1000n);
      expect(money.currency).toBe('USD');
    });

    it('should create money from decimal', () => {
      const money = Money.fromDecimal(10.5, 'USD');
      expect(money.amount).toBe(1050n);
      expect(money.currency).toBe('USD');
    });

    it('should create money from string', () => {
      const money = Money.fromString('5000', 'eur');
      expect(money.amount).toBe(5000n);
      expect(money.currency).toBe('EUR');
    });

    it('should create zero money', () => {
      const money = Money.zero('USD');
      expect(money.amount).toBe(0n);
      expect(money.isZero).toBe(true);
    });

    it('should uppercase currency code', () => {
      const money = Money.fromMinorUnits(100n, 'usd');
      expect(money.currency).toBe('USD');
    });

    it('should reject negative amounts', () => {
      expect(() => Money.fromMinorUnits(-1n, 'USD')).toThrow(
        'Money amount cannot be negative',
      );
    });

    it('should reject invalid currency codes', () => {
      expect(() => Money.fromMinorUnits(100n, '')).toThrow(
        'Currency must be a 3-letter ISO code',
      );
      expect(() => Money.fromMinorUnits(100n, 'US')).toThrow(
        'Currency must be a 3-letter ISO code',
      );
      expect(() => Money.fromMinorUnits(100n, 'USDD')).toThrow(
        'Currency must be a 3-letter ISO code',
      );
    });
  });

  describe('arithmetic', () => {
    it('should add two amounts of the same currency', () => {
      const a = Money.fromMinorUnits(100n, 'USD');
      const b = Money.fromMinorUnits(200n, 'USD');
      const result = a.add(b);
      expect(result.amount).toBe(300n);
    });

    it('should subtract two amounts of the same currency', () => {
      const a = Money.fromMinorUnits(500n, 'USD');
      const b = Money.fromMinorUnits(200n, 'USD');
      const result = a.subtract(b);
      expect(result.amount).toBe(300n);
    });

    it('should reject addition with different currencies', () => {
      const usd = Money.fromMinorUnits(100n, 'USD');
      const eur = Money.fromMinorUnits(100n, 'EUR');
      expect(() => usd.add(eur)).toThrow('Currency mismatch');
    });

    it('should reject subtraction with different currencies', () => {
      const usd = Money.fromMinorUnits(100n, 'USD');
      const eur = Money.fromMinorUnits(100n, 'EUR');
      expect(() => usd.subtract(eur)).toThrow('Currency mismatch');
    });

    it('should multiply by a factor', () => {
      const money = Money.fromMinorUnits(1000n, 'USD');
      const result = money.multiply(1.5);
      expect(result.amount).toBe(1500n);
    });
  });

  describe('comparison', () => {
    it('should check equality', () => {
      const a = Money.fromMinorUnits(100n, 'USD');
      const b = Money.fromMinorUnits(100n, 'USD');
      const c = Money.fromMinorUnits(200n, 'USD');
      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
    });

    it('should compare greater than', () => {
      const a = Money.fromMinorUnits(200n, 'USD');
      const b = Money.fromMinorUnits(100n, 'USD');
      expect(a.greaterThan(b)).toBe(true);
      expect(b.greaterThan(a)).toBe(false);
    });

    it('should compare less than', () => {
      const a = Money.fromMinorUnits(100n, 'USD');
      const b = Money.fromMinorUnits(200n, 'USD');
      expect(a.lessThan(b)).toBe(true);
      expect(b.lessThan(a)).toBe(false);
    });

    it('should reject comparisons with different currencies', () => {
      const usd = Money.fromMinorUnits(100n, 'USD');
      const eur = Money.fromMinorUnits(100n, 'EUR');
      expect(() => usd.greaterThan(eur)).toThrow('Currency mismatch');
      expect(() => usd.lessThan(eur)).toThrow('Currency mismatch');
    });
  });

  describe('utility', () => {
    it('should convert to string', () => {
      const money = Money.fromMinorUnits(12345n, 'USD');
      expect(money.toString()).toBe('12345');
    });

    it('should convert to decimal string', () => {
      const money = Money.fromMinorUnits(12345n, 'USD');
      expect(money.toDecimal()).toBe('123.45');
    });

    it('should convert to JSON', () => {
      const money = Money.fromMinorUnits(100n, 'USD');
      const json = JSON.parse(money.toJSON());
      expect(json).toEqual({ amount: '100', currency: 'USD' });
    });

    it('should identify positive amounts', () => {
      const positive = Money.fromMinorUnits(100n, 'USD');
      const zero = Money.zero('USD');
      expect(positive.isPositive).toBe(true);
      expect(positive.isZero).toBe(false);
      expect(zero.isPositive).toBe(false);
      expect(zero.isZero).toBe(true);
    });
  });
});
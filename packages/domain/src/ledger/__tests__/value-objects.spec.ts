import { Money } from '../value-objects/money';
import { Currency } from '../value-objects/currency';
import { LedgerAccountId } from '../value-objects/ledger-account-id';
import { JournalId } from '../value-objects/journal-id';
import { PostingId } from '../value-objects/posting-id';
import { ReferenceNumber } from '../value-objects/reference-number';
import { TransactionReference } from '../value-objects/transaction-reference';

describe('Value Objects', () => {
  describe('Money', () => {
    describe('creation', () => {
      it('should create money from minor units', () => {
        const money = Money.fromMinorUnits(10000n, 'USD');
        expect(money.amount).toBe(10000n);
        expect(money.currency).toBe('USD');
      });

      it('should create zero money', () => {
        const zero = Money.zero('USD');
        expect(zero.amount).toBe(0n);
        expect(zero.currency).toBe('USD');
      });

      it('should create money from decimal', () => {
        const money = Money.fromDecimal(100, 'USD');
        expect(money.amount).toBe(10000n);
      });
    });

    describe('arithmetic', () => {
      it('should add two money amounts of same currency', () => {
        const a = Money.fromMinorUnits(5000n, 'USD');
        const b = Money.fromMinorUnits(3000n, 'USD');
        const result = a.add(b);
        expect(result.amount).toBe(8000n);
        expect(result.currency).toBe('USD');
      });

      it('should subtract two money amounts of same currency', () => {
        const a = Money.fromMinorUnits(5000n, 'USD');
        const b = Money.fromMinorUnits(3000n, 'USD');
        const result = a.subtract(b);
        expect(result.amount).toBe(2000n);
      });

      it('should throw on currency mismatch for add', () => {
        const usd = Money.fromMinorUnits(5000n, 'USD');
        const eur = Money.fromMinorUnits(3000n, 'EUR');
        expect(() => usd.add(eur)).toThrow();
      });

      it('should throw on currency mismatch for subtract', () => {
        const usd = Money.fromMinorUnits(5000n, 'USD');
        const eur = Money.fromMinorUnits(3000n, 'EUR');
        expect(() => usd.subtract(eur)).toThrow();
      });
    });

    describe('comparison', () => {
      it('should compare equal amounts', () => {
        const a = Money.fromMinorUnits(5000n, 'USD');
        const b = Money.fromMinorUnits(5000n, 'USD');
        expect(a.equals(b)).toBe(true);
      });

      it('should detect unequal amounts', () => {
        const a = Money.fromMinorUnits(5000n, 'USD');
        const b = Money.fromMinorUnits(3000n, 'USD');
        expect(a.equals(b)).toBe(false);
      });

      it('should detect greater than', () => {
        const a = Money.fromMinorUnits(5000n, 'USD');
        const b = Money.fromMinorUnits(3000n, 'USD');
        expect(a.greaterThan(b)).toBe(true);
        expect(b.greaterThan(a)).toBe(false);
      });

      it('should detect less than', () => {
        const a = Money.fromMinorUnits(3000n, 'USD');
        const b = Money.fromMinorUnits(5000n, 'USD');
        expect(a.lessThan(b)).toBe(true);
        expect(b.lessThan(a)).toBe(false);
      });
    });

    describe('properties', () => {
      it('should detect zero', () => {
        const zero = Money.zero('USD');
        expect(zero.isZero).toBe(true);
        const nonZero = Money.fromMinorUnits(1n, 'USD');
        expect(nonZero.isZero).toBe(false);
      });

      it('should detect positive', () => {
        const positive = Money.fromMinorUnits(1n, 'USD');
        expect(positive.isPositive).toBe(true);
        const zero = Money.zero('USD');
        expect(zero.isPositive).toBe(false);
      });

      it('should negate', () => {
        const positive = Money.fromMinorUnits(5000n, 'USD');
        const negative = positive.negate();
        expect(negative.amount).toBe(-5000n);
      });
    });
  });

  describe('Currency', () => {
    it('should create valid currency', () => {
      const usd = Currency.of('USD');
      expect(usd.code).toBe('USD');
    });

    it('should normalize to uppercase', () => {
      const usd = Currency.of('usd');
      expect(usd.code).toBe('USD');
    });

    it('should reject invalid currency code', () => {
      expect(() => Currency.of('INVALID_LONG_CODE')).toThrow();
    });

    it('should support common currencies', () => {
      expect(Currency.of('USD').code).toBe('USD');
      expect(Currency.of('EUR').code).toBe('EUR');
      expect(Currency.of('GBP').code).toBe('GBP');
      expect(Currency.of('BTC').code).toBe('BTC');
    });
  });

  describe('LedgerAccountId', () => {
    it('should create from string', () => {
      const id = LedgerAccountId.from('acc-123');
      expect(id.value).toBe('acc-123');
    });

    it('should generate unique ids', () => {
      const id1 = LedgerAccountId.generate();
      const id2 = LedgerAccountId.generate();
      expect(id1.value).not.toBe(id2.value);
    });

    it('should compare equal ids', () => {
      const id1 = LedgerAccountId.from('acc-123');
      const id2 = LedgerAccountId.from('acc-123');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should detect different ids', () => {
      const id1 = LedgerAccountId.from('acc-123');
      const id2 = LedgerAccountId.from('acc-456');
      expect(id1.equals(id2)).toBe(false);
    });

    it('should reject empty value', () => {
      expect(() => LedgerAccountId.from('')).toThrow();
    });
  });

  describe('JournalId', () => {
    it('should create from string', () => {
      const id = JournalId.from('jrnl-123');
      expect(id.value).toBe('jrnl-123');
    });

    it('should generate unique ids', () => {
      const id1 = JournalId.generate();
      const id2 = JournalId.generate();
      expect(id1.value).not.toBe(id2.value);
    });

    it('should compare equal ids', () => {
      const id1 = JournalId.from('jrnl-123');
      const id2 = JournalId.from('jrnl-123');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should reject empty value', () => {
      expect(() => JournalId.from('')).toThrow();
    });
  });

  describe('PostingId', () => {
    it('should create from string', () => {
      const id = PostingId.from('post-123');
      expect(id.value).toBe('post-123');
    });

    it('should generate unique ids', () => {
      const id1 = PostingId.generate();
      const id2 = PostingId.generate();
      expect(id1.value).not.toBe(id2.value);
    });

    it('should compare equal ids', () => {
      const id1 = PostingId.from('post-123');
      const id2 = PostingId.from('post-123');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should reject empty value', () => {
      expect(() => PostingId.from('')).toThrow();
    });
  });

  describe('ReferenceNumber', () => {
    it('should create from string', () => {
      const ref = ReferenceNumber.from('REF-001');
      expect(ref.value).toBe('REF-001');
    });

    it('should generate unique reference', () => {
      const ref1 = ReferenceNumber.generate();
      const ref2 = ReferenceNumber.generate();
      expect(ref1.value).not.toBe(ref2.value);
    });

    it('should reject empty value', () => {
      expect(() => ReferenceNumber.from('')).toThrow();
    });
  });

  describe('TransactionReference', () => {
    it('should create from string with system', () => {
      const ref = TransactionReference.from('TXN-001', 'SWIFT');
      expect(ref.value).toBe('TXN-001');
      expect(ref.system).toBe('SWIFT');
    });

    it('should generate unique reference', () => {
      const ref1 = TransactionReference.generate('ACH');
      const ref2 = TransactionReference.generate('ACH');
      expect(ref1.value).not.toBe(ref2.value);
    });

    it('should reject empty value', () => {
      expect(() => TransactionReference.from('', 'SWIFT')).toThrow();
    });

    it('should reject empty system', () => {
      expect(() => TransactionReference.from('TXN-001', '')).toThrow();
    });
  });
});
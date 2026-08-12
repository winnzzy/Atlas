import { TransactionPolicy, type TransactionAuthorizationContext } from '../transaction.policy';
import { TransactionType } from '../../enums/transaction-type.enum';
import { TransactionStatus } from '../../enums/transaction-status.enum';

describe('TransactionPolicy', () => {
  let policy: TransactionPolicy;
  let repository: {
    sumAmountByAccountAndDateRange: jest.Mock;
  };

  beforeEach(() => {
    policy = new TransactionPolicy();
    repository = {
      sumAmountByAccountAndDateRange: jest.fn().mockResolvedValue('0.00'),
    };
  });

  describe('authorize', () => {
    const baseContext: TransactionAuthorizationContext = {
      transactionType: TransactionType.DEPOSIT,
      accountId: 'acc-123',
      amount: '100.00',
      currency: 'USD',
      userId: 'user-123',
      accountStatus: 'ACTIVE',
      accountCurrency: 'USD',
      availableBalance: '1000.00',
    };

    it('should allow a valid deposit transaction', async () => {
      const result = await policy.authorize(baseContext, repository as never);
      expect(result.allowed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should reject when account status is FROZEN', async () => {
      const result = await policy.authorize({
        ...baseContext,
        accountStatus: 'FROZEN',
      }, repository as never);
      expect(result.allowed).toBe(false);
      expect(result.violations).toContainEqual(expect.stringContaining('FROZEN'));
    });

    it('should reject when account status is CLOSED', async () => {
      const result = await policy.authorize({
        ...baseContext,
        accountStatus: 'CLOSED',
      }, repository as never);
      expect(result.allowed).toBe(false);
      expect(result.violations).toContainEqual(expect.stringContaining('CLOSED'));
    });

    it('should reject when account status is LOCKED', async () => {
      const result = await policy.authorize({
        ...baseContext,
        accountStatus: 'LOCKED',
      }, repository as never);
      expect(result.allowed).toBe(false);
      expect(result.violations).toContainEqual(expect.stringContaining('LOCKED'));
    });

    it('should reject when amount is zero', async () => {
      const result = await policy.authorize({
        ...baseContext,
        amount: '0.00',
      }, repository as never);
      expect(result.allowed).toBe(false);
      expect(result.violations).toContainEqual(expect.stringContaining('minimum'));
    });

    it('should reject when amount is negative', async () => {
      const result = await policy.authorize({
        ...baseContext,
        amount: '-50.00',
      }, repository as never);
      expect(result.allowed).toBe(false);
      expect(result.violations).toContainEqual(expect.stringContaining('minimum'));
    });

    it('should reject when currency is missing', async () => {
      const result = await policy.authorize({
        ...baseContext,
        currency: '',
      }, repository as never);
      expect(result.allowed).toBe(false);
      expect(result.violations).toContainEqual(expect.stringContaining('Currency mismatch'));
    });

    it('should reject when account currency does not match transaction currency', async () => {
      const result = await policy.authorize({
        ...baseContext,
        accountCurrency: 'EUR',
      }, repository as never);
      expect(result.allowed).toBe(false);
      expect(result.violations).toContainEqual(expect.stringContaining('Currency mismatch'));
    });

    it('should reject withdrawal when insufficient balance', async () => {
      const result = await policy.authorize({
        ...baseContext,
        transactionType: TransactionType.WITHDRAWAL,
        amount: '5000.00',
        availableBalance: '1000.00',
      }, repository as never);
      expect(result.allowed).toBe(false);
      expect(result.violations).toContainEqual(expect.stringContaining('Insufficient funds'));
    });

    it('should allow withdrawal with sufficient balance', async () => {
      const result = await policy.authorize({
        ...baseContext,
        transactionType: TransactionType.WITHDRAWAL,
        amount: '500.00',
        availableBalance: '1000.00',
      }, repository as never);
      expect(result.allowed).toBe(true);
    });

    it('should reject internal transfer without counterparty', async () => {
      const result = await policy.authorize({
        ...baseContext,
        transactionType: TransactionType.INTERNAL_TRANSFER,
        counterpartyAccountId: undefined,
      }, repository as never);
      expect(result.allowed).toBe(false);
      expect(result.violations).toContainEqual(expect.stringContaining('counterparty'));
    });

    it('should reject internal transfer to same account', async () => {
      const result = await policy.authorize({
        ...baseContext,
        transactionType: TransactionType.INTERNAL_TRANSFER,
        counterpartyAccountId: 'acc-123',
      }, repository as never);
      expect(result.allowed).toBe(false);
      expect(result.violations).toContainEqual(expect.stringContaining('same account'));
    });

    it('should allow transfer to different account', async () => {
      const result = await policy.authorize({
        ...baseContext,
        transactionType: TransactionType.INTERNAL_TRANSFER,
        counterpartyAccountId: 'acc-456',
        availableBalance: '1000.00',
      }, repository as never);
      expect(result.allowed).toBe(true);
    });

    it('should reject amount exceeding single transaction limit', async () => {
      const result = await policy.authorize({
        ...baseContext,
        amount: '1500000.00',
      }, repository as never);
      expect(result.allowed).toBe(false);
      expect(result.violations).toContainEqual(expect.stringContaining('limit'));
    });

    it('should allow various transaction types', async () => {
      const types = [
        TransactionType.ACH_CREDIT,
        TransactionType.WIRE_DOMESTIC,
        TransactionType.CARD_PURCHASE,
        TransactionType.CRYPTO_DEPOSIT,
        TransactionType.PAYROLL_DEPOSIT,
      ];

      for (const type of types) {
        const result = await policy.authorize({
          ...baseContext,
          transactionType: type,
        }, repository as never);
        expect(result.allowed).toBe(true);
      }
    });

    it('should allow pending accounts for deposits', async () => {
      const result = await policy.authorize({
        ...baseContext,
        accountStatus: 'PENDING',
      }, repository as never);
      expect(result.allowed).toBe(true);
    });

    // Item 8: the daily transfer limit was removed, so a transfer that would
    // previously have exceeded a per-type daily cap must now be allowed.
    it('should allow an internal transfer far above the former daily limit', async () => {
      const result = await policy.authorize({
        ...baseContext,
        transactionType: TransactionType.INTERNAL_TRANSFER,
        counterpartyAccountId: 'acc-456',
        amount: '500000.00', // former INTERNAL_TRANSFER daily cap was 100000
        availableBalance: '100000000.00',
      }, repository as never);
      expect(result.allowed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should allow repeated ACH transfers without a daily cumulative cap', async () => {
      // The old daily cap consulted prior same-day totals; that lookup is gone.
      repository.sumAmountByAccountAndDateRange.mockResolvedValue('1000000.00');
      const result = await policy.authorize({
        ...baseContext,
        transactionType: TransactionType.ACH_CREDIT,
        amount: '100000.00', // former ACH daily cap was 25000
      }, repository as never);
      expect(result.allowed).toBe(true);
      expect(repository.sumAmountByAccountAndDateRange).not.toHaveBeenCalled();
    });
  });

  describe('canCancel', () => {
    it('should allow cancellation of CREATED transactions', () => {
      expect(policy.canCancel(TransactionStatus.CREATED)).toBe(true);
    });

    it('should allow cancellation of VALIDATED transactions', () => {
      expect(policy.canCancel(TransactionStatus.VALIDATED)).toBe(true);
    });

    it('should allow cancellation of AUTHORIZED transactions', () => {
      expect(policy.canCancel(TransactionStatus.AUTHORIZED)).toBe(true);
    });

    it('should allow cancellation of PENDING transactions', () => {
      expect(policy.canCancel(TransactionStatus.PENDING)).toBe(true);
    });

    it('should not allow cancellation of COMPLETED transactions', () => {
      expect(policy.canCancel(TransactionStatus.COMPLETED)).toBe(false);
    });

    it('should not allow cancellation of SETTLED transactions', () => {
      expect(policy.canCancel(TransactionStatus.SETTLED)).toBe(false);
    });

    it('should not allow cancellation of FAILED transactions', () => {
      expect(policy.canCancel(TransactionStatus.FAILED)).toBe(false);
    });

    it('should not allow cancellation of CANCELLED transactions', () => {
      expect(policy.canCancel(TransactionStatus.CANCELLED)).toBe(false);
    });
  });

  describe('canReverse', () => {
    it('should allow reversal of POSTED transactions', () => {
      expect(policy.canReverse(TransactionStatus.POSTED)).toBe(true);
    });

    it('should allow reversal of SETTLED transactions', () => {
      expect(policy.canReverse(TransactionStatus.SETTLED)).toBe(true);
    });

    it('should allow reversal of COMPLETED transactions', () => {
      expect(policy.canReverse(TransactionStatus.COMPLETED)).toBe(true);
    });

    it('should not allow reversal of CREATED transactions', () => {
      expect(policy.canReverse(TransactionStatus.CREATED)).toBe(false);
    });

    it('should not allow reversal of FAILED transactions', () => {
      expect(policy.canReverse(TransactionStatus.FAILED)).toBe(false);
    });

    it('should not allow reversal of CANCELLED transactions', () => {
      expect(policy.canReverse(TransactionStatus.CANCELLED)).toBe(false);
    });

    it('should not allow reversal of REVERSED transactions', () => {
      expect(policy.canReverse(TransactionStatus.REVERSED)).toBe(false);
    });
  });

  describe('canFail', () => {
    it('should allow failing CREATED transactions', () => {
      expect(policy.canFail(TransactionStatus.CREATED)).toBe(true);
    });

    it('should allow failing VALIDATED transactions', () => {
      expect(policy.canFail(TransactionStatus.VALIDATED)).toBe(true);
    });

    it('should allow failing AUTHORIZED transactions', () => {
      expect(policy.canFail(TransactionStatus.AUTHORIZED)).toBe(true);
    });

    it('should allow failing PENDING transactions', () => {
      expect(policy.canFail(TransactionStatus.PENDING)).toBe(true);
    });

    it('should allow failing POSTED transactions', () => {
      expect(policy.canFail(TransactionStatus.POSTED)).toBe(true);
    });

    it('should not allow failing COMPLETED transactions', () => {
      expect(policy.canFail(TransactionStatus.COMPLETED)).toBe(false);
    });
  });
});
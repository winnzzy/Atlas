import { InvestmentPolicy } from '../investment.policy';
import { AssetStatus, DepositStatus, WithdrawalStatus, WalletStatus } from '../../enums/investment-status.enum';

describe('InvestmentPolicy', () => {
  let policy: InvestmentPolicy;

  beforeEach(() => {
    policy = new InvestmentPolicy();
  });

  describe('assertCanDeposit', () => {
    it('should allow deposit for active product and active wallet', () => {
      expect(() =>
        policy.assertCanDeposit(AssetStatus.ACTIVE, WalletStatus.ACTIVE, 100),
      ).not.toThrow();
    });

    it('should throw for non-active product', () => {
      expect(() =>
        policy.assertCanDeposit(AssetStatus.DISABLED, WalletStatus.ACTIVE, 100),
      ).toThrow();
    });

    it('should throw for non-active wallet', () => {
      expect(() =>
        policy.assertCanDeposit(AssetStatus.ACTIVE, WalletStatus.FROZEN, 100),
      ).toThrow();
    });

    it('should throw for zero amount', () => {
      expect(() =>
        policy.assertCanDeposit(AssetStatus.ACTIVE, WalletStatus.ACTIVE, 0),
      ).toThrow();
    });
  });

  describe('assertCanApproveDeposit', () => {
    it('should allow approval for pending deposit', () => {
      expect(() => policy.assertCanApproveDeposit(DepositStatus.PENDING)).not.toThrow();
    });

    it('should throw for non-pending deposit', () => {
      expect(() => policy.assertCanApproveDeposit(DepositStatus.APPROVED)).toThrow();
    });
  });

  describe('assertCanRejectDeposit', () => {
    it('should allow rejection for pending deposit', () => {
      expect(() => policy.assertCanRejectDeposit(DepositStatus.PENDING)).not.toThrow();
    });

    it('should throw for non-pending deposit', () => {
      expect(() => policy.assertCanRejectDeposit(DepositStatus.REJECTED)).toThrow();
    });
  });

  describe('assertCanWithdraw', () => {
    it('should allow valid withdrawal', () => {
      expect(() =>
        policy.assertCanWithdraw(AssetStatus.ACTIVE, null, 1.0, 5.0, 0.01, 0.001),
      ).not.toThrow();
    });

    it('should throw for inactive product', () => {
      expect(() =>
        policy.assertCanWithdraw(AssetStatus.DISABLED, null, 1.0, 5.0, 0.01, 0.001),
      ).toThrow();
    });

    it('should throw for pending existing withdrawal', () => {
      expect(() =>
        policy.assertCanWithdraw(AssetStatus.ACTIVE, WithdrawalStatus.PENDING, 1.0, 5.0, 0.01, 0.001),
      ).toThrow();
    });

    it('should throw for insufficient balance', () => {
      expect(() =>
        policy.assertCanWithdraw(AssetStatus.ACTIVE, null, 10.0, 5.0, 0.01, 0.001),
      ).toThrow();
    });

    it('should throw for amount below minimum', () => {
      expect(() =>
        policy.assertCanWithdraw(AssetStatus.ACTIVE, null, 0.001, 5.0, 0.1, 0.001),
      ).toThrow();
    });
  });

  describe('assertCanApproveWithdrawal / assertCanRejectWithdrawal', () => {
    it('should allow approve for pending', () => {
      expect(() => policy.assertCanApproveWithdrawal(WithdrawalStatus.PENDING)).not.toThrow();
    });

    it('should throw approve for non-pending', () => {
      expect(() => policy.assertCanApproveWithdrawal(WithdrawalStatus.APPROVED)).toThrow();
    });

    it('should allow reject for pending', () => {
      expect(() => policy.assertCanRejectWithdrawal(WithdrawalStatus.PENDING)).not.toThrow();
    });

    it('should throw reject for non-pending', () => {
      expect(() => policy.assertCanRejectWithdrawal(WithdrawalStatus.REJECTED)).toThrow();
    });
  });

  describe('assertCanUpdatePrice', () => {
    it('should allow for active product', () => {
      expect(() => policy.assertCanUpdatePrice(AssetStatus.ACTIVE)).not.toThrow();
    });

    it('should throw for disabled product', () => {
      expect(() => policy.assertCanUpdatePrice(AssetStatus.DISABLED)).toThrow();
    });
  });

  describe('assertCanManageWallet', () => {
    it('should allow for active product', () => {
      expect(() => policy.assertCanManageWallet(AssetStatus.ACTIVE)).not.toThrow();
    });

    it('should throw for suspended product', () => {
      expect(() => policy.assertCanManageWallet(AssetStatus.SUSPENDED)).toThrow();
    });
  });

  describe('asset status assertions', () => {
    it('assertAssetCanSuspend should throw if already suspended', () => {
      expect(() => policy.assertAssetCanSuspend(AssetStatus.SUSPENDED)).toThrow();
    });

    it('assertAssetCanDisable should throw if already disabled', () => {
      expect(() => policy.assertAssetCanDisable(AssetStatus.DISABLED)).toThrow();
    });

    it('assertAssetCanActivate should throw if already active', () => {
      expect(() => policy.assertAssetCanActivate(AssetStatus.ACTIVE)).toThrow();
    });
  });

  describe('assertAssetCanBeDeleted', () => {
    it('should allow deletion when no holdings', () => {
      expect(() => policy.assertAssetCanBeDeleted(false)).not.toThrow();
    });

    it('should throw when holdings exist', () => {
      expect(() => policy.assertAssetCanBeDeleted(true)).toThrow();
    });
  });
});
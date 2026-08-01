import { InvestmentValidator } from '../investment.validator';
import { CryptoAssetSymbol } from '../../enums/asset-symbol.enum';
import {
  AssetNotFoundException,
  InvalidAmountException,
  PriceNotFoundException,
  WalletAddressRequiredException,
} from '../../exceptions/investment-domain.exception';

describe('InvestmentValidator', () => {
  let validator: InvestmentValidator;

  beforeEach(() => {
    validator = new InvestmentValidator();
  });

  describe('validateAmount', () => {
    it('should pass for positive amount', () => {
      expect(() => validator.validateAmount(100)).not.toThrow();
    });

    it('should throw for zero amount', () => {
      expect(() => validator.validateAmount(0)).toThrow(InvalidAmountException);
    });

    it('should throw for negative amount', () => {
      expect(() => validator.validateAmount(-10)).toThrow(InvalidAmountException);
    });
  });

  describe('validatePrice', () => {
    it('should pass for positive price', () => {
      expect(() => validator.validatePrice(50000)).not.toThrow();
    });

    it('should throw for zero price', () => {
      expect(() => validator.validatePrice(0)).toThrow(PriceNotFoundException);
    });

    it('should throw for negative price', () => {
      expect(() => validator.validatePrice(-100)).toThrow(PriceNotFoundException);
    });
  });

  describe('validateWalletAddress', () => {
    it('should pass for valid address', () => {
      expect(() => validator.validateWalletAddress('0xABC123')).not.toThrow();
    });

    it('should throw for empty address', () => {
      expect(() => validator.validateWalletAddress('')).toThrow(WalletAddressRequiredException);
    });

    it('should throw for whitespace-only address', () => {
      expect(() => validator.validateWalletAddress('   ')).toThrow(WalletAddressRequiredException);
    });
  });

  describe('validateDestinationWallet', () => {
    it('should pass for valid wallet', () => {
      expect(() => validator.validateDestinationWallet('0xABC')).not.toThrow();
    });

    it('should throw for empty wallet', () => {
      expect(() => validator.validateDestinationWallet('')).toThrow(WalletAddressRequiredException);
    });
  });

  describe('validateCryptoAssetSymbol', () => {
    it('should pass for valid symbols', () => {
      const validSymbols = Object.values(CryptoAssetSymbol);
      validSymbols.forEach((symbol) => {
        expect(() => validator.validateCryptoAssetSymbol(symbol)).not.toThrow();
      });
    });

    it('should throw for invalid symbol', () => {
      expect(() => validator.validateCryptoAssetSymbol('INVALID')).toThrow(AssetNotFoundException);
    });
  });

  describe('validateMemoRequirement', () => {
    it('should pass for non-XRP symbol without memo', () => {
      expect(() =>
        validator.validateMemoRequirement(CryptoAssetSymbol.BTC, undefined),
      ).not.toThrow();
    });

    it('should throw for XRP without memo', () => {
      expect(() =>
        validator.validateMemoRequirement(CryptoAssetSymbol.XRP, undefined),
      ).toThrow(InvalidAmountException);
    });

    it('should throw for XRP with empty memo', () => {
      expect(() =>
        validator.validateMemoRequirement(CryptoAssetSymbol.XRP, ''),
      ).toThrow(InvalidAmountException);
    });

    it('should pass for XRP with valid memo', () => {
      expect(() =>
        validator.validateMemoRequirement(CryptoAssetSymbol.XRP, '12345'),
      ).not.toThrow();
    });
  });

  describe('validateCreateDeposit', () => {
    it('should pass for valid deposit', () => {
      expect(() =>
        validator.validateCreateDeposit({ amount: 1.5, productId: 'prod-1' }),
      ).not.toThrow();
    });

    it('should throw without asset or product id', () => {
      expect(() =>
        validator.validateCreateDeposit({ amount: 1.5 }),
      ).toThrow(AssetNotFoundException);
    });

    it('should throw for zero amount', () => {
      expect(() =>
        validator.validateCreateDeposit({ amount: 0, productId: 'prod-1' }),
      ).toThrow(InvalidAmountException);
    });
  });

  describe('validateCreateWithdrawal', () => {
    it('should pass for valid withdrawal', () => {
      expect(() =>
        validator.validateCreateWithdrawal({
          amount: 1.0,
          productId: 'prod-1',
          toAddress: '0xABC',
        }),
      ).not.toThrow();
    });

    it('should throw without address', () => {
      expect(() =>
        validator.validateCreateWithdrawal({
          amount: 1.0,
          productId: 'prod-1',
        }),
      ).toThrow(WalletAddressRequiredException);
    });

    it('should throw without product id', () => {
      expect(() =>
        validator.validateCreateWithdrawal({
          amount: 1.0,
          toAddress: '0xABC',
        }),
      ).toThrow(AssetNotFoundException);
    });
  });

  describe('validateCreateWallet', () => {
    it('should pass for valid wallet', () => {
      expect(() =>
        validator.validateCreateWallet({ address: '0xABC', productId: 'prod-1' }),
      ).not.toThrow();
    });

    it('should throw without product id', () => {
      expect(() =>
        validator.validateCreateWallet({ address: '0xABC' }),
      ).toThrow(AssetNotFoundException);
    });

    it('should throw without address', () => {
      expect(() =>
        validator.validateCreateWallet({ address: '', productId: 'prod-1' }),
      ).toThrow(WalletAddressRequiredException);
    });
  });

  describe('validateCreateAsset', () => {
    it('should throw for empty symbol', () => {
      expect(() =>
        validator.validateCreateAsset({ symbol: '', name: 'Bitcoin', assetClass: 'CRYPTO' as never }),
      ).toThrow(AssetNotFoundException);
    });

    it('should throw for empty name', () => {
      expect(() =>
        validator.validateCreateAsset({ symbol: 'BTC', name: '', assetClass: 'CRYPTO' as never }),
      ).toThrow(InvalidAmountException);
    });
  });
});
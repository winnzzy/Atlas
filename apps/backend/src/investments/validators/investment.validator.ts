import { Injectable } from '@nestjs/common';
import type { AssetClass} from '../enums/asset-class.enum';
import { ACTIVE_ASSET_CLASSES } from '../enums/asset-class.enum';
import { CryptoAssetSymbol } from '../enums/asset-symbol.enum';
import {
  AssetNotFoundException,
  AssetDisabledException,
  InvalidAmountException,
  PriceNotFoundException,
  WalletAddressRequiredException,
} from '../exceptions/investment-domain.exception';

/**
 * Validates investment-related business rules.
 * Centralizes all validation logic for the investment module.
 */
@Injectable()
export class InvestmentValidator {
  /**
   * Validates that an asset class is currently enabled for trading.
   */
  validateAssetClassEnabled(assetClass: AssetClass): void {
    if (!ACTIVE_ASSET_CLASSES.has(assetClass)) {
      throw new AssetDisabledException(assetClass);
    }
  }

  /**
   * Validates that an asset symbol is a valid crypto asset.
   */
  validateCryptoAssetSymbol(symbol: string): void {
    const validSymbols = Object.values(CryptoAssetSymbol);
    if (!validSymbols.includes(symbol as CryptoAssetSymbol)) {
      throw new AssetNotFoundException(symbol);
    }
  }

  /**
   * Validates that a memo/tag is provided for assets that require it.
   * XRP requires a destination tag for deposits.
   */
  validateMemoRequirement(symbol: CryptoAssetSymbol, memo?: string): void {
    if (symbol === CryptoAssetSymbol.XRP && (!memo || memo.trim().length === 0)) {
      throw new InvalidAmountException(`Destination tag is required for ${symbol} deposits`);
    }
  }

  /**
   * Validates that an amount is greater than zero.
   */
  validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new InvalidAmountException();
    }
  }

  /**
   * Validates that a price is greater than zero.
   */
  validatePrice(price: number): void {
    if (price <= 0) {
      throw new PriceNotFoundException('Price must be greater than zero');
    }
  }

  /**
   * Validates that a wallet address is not empty.
   */
  validateWalletAddress(address: string): void {
    if (!address || address.trim().length === 0) {
      throw new WalletAddressRequiredException();
    }
  }

  /**
   * Validates that a destination wallet address is provided for withdrawals.
   */
  validateDestinationWallet(walletAddress: string): void {
    if (!walletAddress || walletAddress.trim().length === 0) {
      throw new WalletAddressRequiredException();
    }
  }

  /**
   * Validates a create deposit request.
   */
  validateCreateDeposit(dto: { amount: number; assetId?: string; productId?: string }): void {
    if (!dto.assetId && !dto.productId) {
      throw new AssetNotFoundException('Asset ID is required');
    }
    this.validateAmount(dto.amount);
  }

  /**
   * Validates a create withdrawal request.
   */
  validateCreateWithdrawal(dto: { amount: number; productId?: string; assetId?: string; destinationAddress?: string; toAddress?: string }): void {
    if (!dto.productId && !dto.assetId) {
      throw new AssetNotFoundException('Asset ID is required');
    }
    this.validateAmount(dto.amount);
    const address = dto.destinationAddress || dto.toAddress;
    if (!address || address.trim().length === 0) {
      throw new WalletAddressRequiredException();
    }
  }

  /**
   * Validates a create wallet request.
   */
  validateCreateWallet(dto: { address: string; productId?: string; assetId?: string }): void {
    if (!dto.productId && !dto.assetId) {
      throw new AssetNotFoundException('Asset ID is required');
    }
    this.validateWalletAddress(dto.address);
  }

  /**
   * Validates a create asset request.
   */
  validateCreateAsset(dto: { symbol: string; name: string; assetClass: AssetClass }): void {
    if (!dto.symbol || dto.symbol.trim().length === 0) {
      throw new AssetNotFoundException('Asset symbol is required');
    }

    if (!dto.name || dto.name.trim().length === 0) {
      throw new InvalidAmountException('Asset name is required');
    }

    this.validateAssetClassEnabled(dto.assetClass);
  }
}

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

export class AssetNotFoundException extends NotFoundException {
  constructor(assetSymbol: string) {
    super(`Asset not found: ${assetSymbol}`);
    this.name = 'AssetNotFoundException';
  }
}

export class AssetNotTradableException extends BadRequestException {
  constructor(assetSymbol: string) {
    super(`Asset ${assetSymbol} is not currently tradable`);
    this.name = 'AssetNotTradableException';
  }
}

export class AssetAlreadyExistsException extends ConflictException {
  constructor(assetSymbol: string) {
    super(`Asset already exists: ${assetSymbol}`);
    this.name = 'AssetAlreadyExistsException';
  }
}

export class PortfolioNotFoundException extends NotFoundException {
  constructor(customerId: string) {
    super(`Portfolio not found for customer: ${customerId}`);
    this.name = 'PortfolioNotFoundException';
  }
}

export class HoldingNotFoundException extends NotFoundException {
  constructor(portfolioId: string, assetSymbol: string) {
    super(`Holding not found for asset ${assetSymbol} in portfolio ${portfolioId}`);
    this.name = 'HoldingNotFoundException';
  }
}

export class InsufficientHoldingException extends BadRequestException {
  constructor(assetSymbol: string, requested: number, available: number) {
    super(
      `Insufficient ${assetSymbol} holding: requested ${requested}, available ${available}`,
    );
    this.name = 'InsufficientHoldingException';
  }
}

export class DepositNotFoundException extends NotFoundException {
  constructor(depositId: string) {
    super(`Deposit not found: ${depositId}`);
    this.name = 'DepositNotFoundException';
  }
}

export class DepositAlreadyProcessedException extends ConflictException {
  constructor(depositId: string) {
    super(`Deposit already processed: ${depositId}`);
    this.name = 'DepositAlreadyProcessedException';
  }
}

export class WithdrawalNotFoundException extends NotFoundException {
  constructor(withdrawalId: string) {
    super(`Withdrawal not found: ${withdrawalId}`);
    this.name = 'WithdrawalNotFoundException';
  }
}

export class WithdrawalAlreadyProcessedException extends ConflictException {
  constructor(withdrawalId: string) {
    super(`Withdrawal already processed: ${withdrawalId}`);
    this.name = 'WithdrawalAlreadyProcessedException';
  }
}

export class WalletNotFoundException extends NotFoundException {
  constructor(walletId: string) {
    super(`Wallet not found: ${walletId}`);
    this.name = 'WalletNotFoundException';
  }
}

export class WalletAlreadyExistsException extends ConflictException {
  constructor(assetSymbol: string, network: string) {
    super(`Wallet already exists for ${assetSymbol} on network ${network}`);
    this.name = 'WalletAlreadyExistsException';
  }
}

export class PriceNotFoundException extends NotFoundException {
  constructor(assetSymbol: string) {
    super(`Price not found for asset: ${assetSymbol}`);
    this.name = 'PriceNotFoundException';
  }
}

export class InvalidAmountException extends BadRequestException {
  constructor(message = 'Amount must be greater than zero') {
    super(message);
    this.name = 'InvalidAmountException';
  }
}

export class InvestmentFrozenException extends ForbiddenException {
  constructor(customerId: string) {
    super(`Investment account is frozen for customer: ${customerId}`);
    this.name = 'InvestmentFrozenException';
  }
}

export class AssetSuspendedException extends ForbiddenException {
  constructor(assetSymbol: string) {
    super(`Asset is suspended: ${assetSymbol}`);
    this.name = 'AssetSuspendedException';
  }
}

export class AssetDisabledException extends ForbiddenException {
  constructor(assetSymbol: string) {
    super(`Asset is disabled: ${assetSymbol}`);
    this.name = 'AssetDisabledException';
  }
}

export class WalletAddressRequiredException extends BadRequestException {
  constructor() {
    super('Destination wallet address is required for withdrawal');
    this.name = 'WalletAddressRequiredException';
  }
}

export class BelowMinWithdrawalException extends BadRequestException {
  constructor(amount: number, minWithdrawal: number) {
    super(`Withdrawal amount ${amount} is below minimum withdrawal of ${minWithdrawal}`);
    this.name = 'BelowMinWithdrawalException';
  }
}

export class InsufficientHoldingsException extends BadRequestException {
  constructor(requested: number, available: number) {
    super(`Insufficient holdings: requested ${requested}, available ${available}`);
    this.name = 'InsufficientHoldingsException';
  }
}

export class PendingWithdrawalExistsException extends ConflictException {
  constructor() {
    super('A pending withdrawal already exists for this product');
    this.name = 'PendingWithdrawalExistsException';
  }
}

/**
 * Unified domain exception factory for investment module.
 * Provides static factory methods for common investment errors.
 */
export class InvestmentDomainException {
  static assetNotFound(idOrSymbol: string) {
    return new NotFoundException(`Investment asset not found: ${idOrSymbol}`);
  }

  static assetAlreadyExists(symbol: string) {
    return new ConflictException(`Asset already exists: ${symbol}`);
  }

  static assetNotTradable(symbol: string) {
    return new BadRequestException(`Asset ${symbol} is not currently tradable`);
  }

  static portfolioNotFound(userId: string) {
    return new NotFoundException(`Portfolio not found for user: ${userId}`);
  }

  static holdingNotFound(userId: string, productId: string) {
    return new NotFoundException(`Holding not found for product ${productId} in user ${userId}`);
  }

  static insufficientHolding(symbol: string, requested: number, available: number) {
    return new BadRequestException(
      `Insufficient ${symbol} holding: requested ${requested}, available ${available}`,
    );
  }

  static depositNotFound(id: string) {
    return new NotFoundException(`Deposit not found: ${id}`);
  }

  static depositAlreadyProcessed(id: string) {
    return new ConflictException(`Deposit already processed: ${id}`);
  }

  static withdrawalNotFound(id: string) {
    return new NotFoundException(`Withdrawal not found: ${id}`);
  }

  static withdrawalAlreadyProcessed(id: string) {
    return new ConflictException(`Withdrawal already processed: ${id}`);
  }

  static walletNotFound(id: string) {
    return new NotFoundException(`Wallet not found: ${id}`);
  }

  static walletAddressExists(address: string, network?: string) {
    return new ConflictException(
      `Wallet address already exists: ${address}${network ? ` on network ${network}` : ''}`,
    );
  }

  static priceNotFound(symbol: string) {
    return new NotFoundException(`Price not found for asset: ${symbol}`);
  }

  static invalidAmount(message = 'Amount must be greater than zero') {
    return new BadRequestException(message);
  }

  static investmentFrozen(customerId: string) {
    return new ForbiddenException(`Investment account is frozen for customer: ${customerId}`);
  }

  static assetSuspended(symbol: string) {
    return new ForbiddenException(`Asset is suspended: ${symbol}`);
  }

  static assetDisabled(symbol: string) {
    return new ForbiddenException(`Asset is disabled: ${symbol}`);
  }

  static walletAddressRequired() {
    return new BadRequestException('Destination wallet address is required for withdrawal');
  }

  static invalidStatusTransition(action: string, currentStatus: string) {
    return new BadRequestException(
      `Cannot perform '${action}' on entity with status '${currentStatus}'`,
    );
  }

  static belowMinDeposit(amount: number, minDeposit: number) {
    return new BadRequestException(
      `Deposit amount ${amount} is below minimum deposit of ${minDeposit}`,
    );
  }

  static belowMinWithdrawal(amount: number, minWithdrawal: number) {
    return new BadRequestException(
      `Withdrawal amount ${amount} is below minimum withdrawal of ${minWithdrawal}`,
    );
  }

  static insufficientBalance(available: number, requested: number) {
    return new BadRequestException(
      `Insufficient balance: available ${available}, requested ${requested}`,
    );
  }

  static pendingWithdrawalExists() {
    return new ConflictException('A pending withdrawal already exists for this product');
  }

  static assetAlreadySuspended() {
    return new ConflictException('Asset is already suspended');
  }

  static assetAlreadyDisabled() {
    return new ConflictException('Asset is already disabled');
  }

  static assetAlreadyActive() {
    return new ConflictException('Asset is already active');
  }

  static assetInUse() {
    return new ConflictException('Cannot modify asset that is currently in use');
  }

  static invalidDepositStatus(currentStatus: string, expectedStatus: string) {
    return new BadRequestException(
      `Invalid deposit status: current '${currentStatus}', expected '${expectedStatus}'`,
    );
  }

  static invalidWithdrawalStatus(currentStatus: string, expectedStatus: string) {
    return new BadRequestException(
      `Invalid withdrawal status: current '${currentStatus}', expected '${expectedStatus}'`,
    );
  }

  static insufficientHoldings(requested: number, available: number) {
    return new BadRequestException(
      `Insufficient holdings: requested ${requested}, available ${available}`,
    );
  }
}

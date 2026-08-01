/**
 * Domain events emitted by the Investment module.
 * Events are published via NestJS EventEmitter2 and consumed by
 * audit logging, notifications, and other cross-cutting concerns.
 */

export enum InvestmentEventType {
  INVESTMENT_CREATED = 'investment.created',
  DEPOSIT_REQUESTED = 'investment.deposit.requested',
  DEPOSIT_APPROVED = 'investment.deposit.approved',
  DEPOSIT_REJECTED = 'investment.deposit.rejected',
  WITHDRAWAL_REQUESTED = 'investment.withdrawal.requested',
  WITHDRAWAL_APPROVED = 'investment.withdrawal.approved',
  WITHDRAWAL_REJECTED = 'investment.withdrawal.rejected',
  PORTFOLIO_UPDATED = 'investment.portfolio.updated',
  ASSET_PRICE_UPDATED = 'investment.asset.price_updated',
  ASSET_STATUS_CHANGED = 'investment.asset.status_changed',
  WALLET_ADDRESS_CHANGED = 'investment.wallet.address_changed',
}

export class InvestmentCreatedEvent {
  constructor(
    public readonly portfolioId: string,
    public readonly customerId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class InvestmentDepositRequestedEvent {
  constructor(
    public readonly depositId: string,
    public readonly userId: string,
    public readonly productId: string,
    public readonly amount: number,
    public readonly reference: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class InvestmentDepositApprovedEvent {
  constructor(
    public readonly depositId: string,
    public readonly userId: string,
    public readonly productId: string,
    public readonly amount: number,
    public readonly approvedBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class InvestmentWithdrawalRequestedEvent {
  constructor(
    public readonly withdrawalId: string,
    public readonly userId: string,
    public readonly productId: string,
    public readonly amount: number,
    public readonly destinationWallet: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class InvestmentWithdrawalApprovedEvent {
  constructor(
    public readonly withdrawalId: string,
    public readonly userId: string,
    public readonly productId: string,
    public readonly amount: number,
    public readonly approvedBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class InvestmentDepositRejectedEvent {
  constructor(
    public readonly depositId: string,
    public readonly userId: string,
    public readonly productId: string,
    public readonly reason: string,
    public readonly rejectedBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class InvestmentWithdrawalRejectedEvent {
  constructor(
    public readonly withdrawalId: string,
    public readonly userId: string,
    public readonly productId: string,
    public readonly reason: string,
    public readonly rejectedBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class PortfolioUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly productId: string,
    public readonly totalValue: number,
    public readonly changeType: string,
    public readonly updatedBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class AssetPriceUpdatedEvent {
  constructor(
    public readonly productId: string,
    public readonly assetSymbol: string,
    public readonly newPrice: number,
    public readonly currency: string,
    public readonly updatedBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class AssetStatusChangedEvent {
  constructor(
    public readonly productId: string,
    public readonly assetSymbol: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
    public readonly changedBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class WalletAddressChangedEvent {
  constructor(
    public readonly walletId: string,
    public readonly productId: string,
    public readonly network: string,
    public readonly address: string,
    public readonly action: string,
    public readonly changedBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
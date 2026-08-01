import { Decimal } from '@prisma/client/runtime/library';
import { Injectable } from '@nestjs/common';
import type { AssetResponseDto } from '../dto/create-asset.dto';
import type { WalletResponseDto } from '../dto/wallet.dto';
import type { DepositResponseDto } from '../dto/deposit.dto';
import type { WithdrawalResponseDto } from '../dto/withdrawal.dto';
import type { PriceResponseDto, AssetWithPriceDto } from '../dto/price.dto';
import type { HoldingDto, PortfolioResponseDto, PortfolioTransactionResponseDto } from '../dto/portfolio.dto';
import type {
  AssetStatus,
  DepositStatus,
  WalletStatus,
  WithdrawalStatus} from '../enums/investment-status.enum';
import type { AssetClass } from '../enums/asset-class.enum';

function toNumber(value: unknown): number {
  if (value instanceof Decimal) return value.toNumber();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  return 0;
}

interface ProductWithPriceHistory {
  id: string;
  symbol: string;
  name: string;
  assetClass: string;
  status: string;
  description: string | null;
  iconUrl: string | null;
  decimals: number;
  minDeposit: Decimal | null;
  minWithdrawal: Decimal | null;
  withdrawalFee: Decimal | null;
  createdAt: Date;
  updatedAt: Date;
  priceHistory?: Array<{
    id: string;
    price: Decimal;
    currency: string;
    change24h: Decimal | null;
    change24hPct: Decimal | null;
    marketCap: Decimal | null;
    volume24h: Decimal | null;
    createdAt: Date;
  }>;
}

interface DepositWithRelations {
  id: string;
  userId: string;
  productId: string;
  walletId: string;
  amount: Decimal;
  txHash: string | null;
  network: string;
  status: string;
  reference: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  product?: { symbol: string; name: string } | null;
  wallet?: { address: string; network: string } | null;
}

interface WithdrawalWithRelations {
  id: string;
  userId: string;
  productId: string;
  amount: Decimal;
  toAddress: string;
  toMemo: string | null;
  network: string;
  fee: Decimal;
  netAmount: Decimal;
  status: string;
  reference: string;
  txHash: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  product?: { symbol: string; name: string } | null;
}

interface WalletWithProduct {
  id: string;
  productId: string;
  network: string;
  address: string;
  memo: string | null;
  label: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  product?: { symbol: string; name: string } | null;
}

interface PositionWithProduct {
  id: string;
  portfolioId: string;
  productId: string;
  quantity: Decimal;
  averageCost: Decimal;
  totalCost: Decimal;
  currentValue: Decimal;
  profitLoss: Decimal;
  profitLossPct: Decimal;
  createdAt: Date;
  updatedAt: Date;
  product: ProductWithPriceHistory;
}

interface PortfolioEntryWithProduct {
  id: string;
  portfolioId: string;
  productId: string;
  type: string;
  quantity: Decimal;
  pricePerUnit: Decimal;
  totalAmount: Decimal;
  status: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  product?: { symbol: string; name: string } | null;
}

@Injectable()
export class InvestmentMapper {
  toAssetResponseDto(product: ProductWithPriceHistory): AssetResponseDto {
    return {
      id: product.id,
      symbol: product.symbol,
      name: product.name,
      assetClass: product.assetClass as AssetClass,
      status: product.status as AssetStatus,
      description: product.description ?? undefined,
      iconUrl: product.iconUrl ?? undefined,
      decimals: product.decimals,
      minDeposit: product.minDeposit ? toNumber(product.minDeposit) : undefined,
      minWithdrawal: product.minWithdrawal ? toNumber(product.minWithdrawal) : undefined,
      withdrawalFee: product.withdrawalFee ? toNumber(product.withdrawalFee) : undefined,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  toAssetWithPriceDto(product: ProductWithPriceHistory): AssetWithPriceDto {
    const latestPrice = product.priceHistory?.[0];
    return {
      id: product.id,
      symbol: product.symbol,
      name: product.name,
      assetClass: product.assetClass,
      status: product.status,
      description: product.description,
      iconUrl: product.iconUrl,
      currentPrice: latestPrice ? toNumber(latestPrice.price) : null,
      change24h: latestPrice?.change24h ? toNumber(latestPrice.change24h) : null,
      change24hPct: latestPrice?.change24hPct ? toNumber(latestPrice.change24hPct) : null,
      marketCap: latestPrice?.marketCap ? toNumber(latestPrice.marketCap) : null,
      minDeposit: product.minDeposit ? toNumber(product.minDeposit) : null,
      minWithdrawal: product.minWithdrawal ? toNumber(product.minWithdrawal) : null,
      withdrawalFee: product.withdrawalFee ? toNumber(product.withdrawalFee) : null,
    };
  }

  toWalletResponseDto(wallet: WalletWithProduct): WalletResponseDto {
    return {
      id: wallet.id,
      productId: wallet.productId,
      network: wallet.network,
      address: wallet.address,
      memo: wallet.memo,
      label: wallet.label,
      status: wallet.status as WalletStatus,
      productSymbol: wallet.product?.symbol,
      productName: wallet.product?.name,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  toDepositResponseDto(deposit: DepositWithRelations): DepositResponseDto {
    return {
      id: deposit.id,
      userId: deposit.userId,
      productId: deposit.productId,
      walletId: deposit.walletId,
      amount: toNumber(deposit.amount),
      txHash: deposit.txHash,
      network: deposit.network,
      status: deposit.status as DepositStatus,
      reference: deposit.reference,
      approvedBy: deposit.approvedBy,
      approvedAt: deposit.approvedAt,
      rejectedBy: deposit.rejectedBy,
      rejectedAt: deposit.rejectedAt,
      rejectionReason: deposit.rejectionReason,
      createdAt: deposit.createdAt,
      updatedAt: deposit.updatedAt,
    };
  }

  toWithdrawalResponseDto(withdrawal: WithdrawalWithRelations): WithdrawalResponseDto {
    return {
      id: withdrawal.id,
      userId: withdrawal.userId,
      productId: withdrawal.productId,
      amount: toNumber(withdrawal.amount),
      toAddress: withdrawal.toAddress,
      toMemo: withdrawal.toMemo,
      network: withdrawal.network,
      fee: toNumber(withdrawal.fee),
      netAmount: toNumber(withdrawal.netAmount),
      status: withdrawal.status as WithdrawalStatus,
      reference: withdrawal.reference,
      txHash: withdrawal.txHash,
      approvedBy: withdrawal.approvedBy,
      approvedAt: withdrawal.approvedAt,
      rejectedBy: withdrawal.rejectedBy,
      rejectedAt: withdrawal.rejectedAt,
      rejectionReason: withdrawal.rejectionReason,
      createdAt: withdrawal.createdAt,
      updatedAt: withdrawal.updatedAt,
    };
  }

  toPriceResponseDto(price: {
    id: string;
    productId: string;
    price: Decimal;
    currency: string;
    change24h: Decimal | null;
    change24hPct: Decimal | null;
    marketCap: Decimal | null;
    volume24h: Decimal | null;
    createdAt: Date;
    updatedBy?: string | null;
    product?: { symbol: string } | null;
  }): PriceResponseDto {
    return {
      id: price.id,
      productId: price.productId,
      symbol: price.product?.symbol ?? '',
      price: toNumber(price.price),
      currency: price.currency,
      change24h: price.change24h ? toNumber(price.change24h) : null,
      change24hPct: price.change24hPct ? toNumber(price.change24hPct) : null,
      marketCap: price.marketCap ? toNumber(price.marketCap) : null,
      volume24h: price.volume24h ? toNumber(price.volume24h) : null,
      updatedBy: price.updatedBy,
      createdAt: price.createdAt,
    };
  }

  toHoldingDto(
    position: PositionWithProduct,
    currentPrice: number,
    totalPortfolioValue: number,
  ): HoldingDto {
    const quantity = toNumber(position.quantity);
    const averageCost = toNumber(position.averageCost);
    const totalCost = toNumber(position.totalCost);
    const currentValue = quantity * currentPrice;
    const unrealizedPnl = currentValue - totalCost;
    const unrealizedPnlPct = totalCost > 0 ? (unrealizedPnl / totalCost) * 100 : 0;
    const allocationPct = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;
    const realizedPnl = toNumber(position.profitLoss);

    return {
      productId: position.productId,
      symbol: position.product.symbol,
      name: position.product.name,
      assetClass: position.product.assetClass,
      quantity,
      averageCost,
      currentPrice,
      currentValue,
      totalCost,
      unrealizedPnl,
      unrealizedPnlPct,
      realizedPnl,
      allocationPct,
    };
  }

  toPortfolioResponseDto(
    portfolioId: string,
    userId: string,
    holdings: HoldingDto[],
    totalRealizedPnl: number,
    createdAt?: Date,
    updatedAt?: Date,
  ): PortfolioResponseDto {
    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
    const totalUnrealizedPnl = holdings.reduce((sum, h) => sum + h.unrealizedPnl, 0);
    const totalProfitLossPct = totalCost > 0 ? (totalUnrealizedPnl / totalCost) * 100 : 0;

    return {
      id: portfolioId,
      userId,
      totalValueUsd: totalValue,
      totalCostBasisUsd: totalCost,
      totalProfitLossUsd: totalUnrealizedPnl,
      totalProfitLossPct,
      totalRealizedPnl,
      holdings,
      currency: 'USD',
      createdAt: createdAt ?? new Date(),
      updatedAt: updatedAt ?? new Date(),
    };
  }

  toPortfolioTransactionResponseDto(entry: PortfolioEntryWithProduct): PortfolioTransactionResponseDto {
    return {
      id: entry.id,
      portfolioId: entry.portfolioId,
      productId: entry.productId,
      productSymbol: entry.product?.symbol ?? '',
      productName: entry.product?.name ?? '',
      type: entry.type,
      quantity: toNumber(entry.quantity),
      pricePerUnitUsd: toNumber(entry.pricePerUnit),
      totalAmountUsd: toNumber(entry.totalAmount),
      status: entry.status,
      notes: entry.description ?? undefined,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }
}
import { ApiProperty } from '@nestjs/swagger';

export class HoldingDto {
  @ApiProperty() productId!: string;
  @ApiProperty() symbol!: string;
  @ApiProperty() name!: string;
  @ApiProperty() assetClass!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() averageCost!: number;
  @ApiProperty() currentPrice!: number;
  @ApiProperty() currentValue!: number;
  @ApiProperty() totalCost!: number;
  @ApiProperty() unrealizedPnl!: number;
  @ApiProperty() unrealizedPnlPct!: number;
  @ApiProperty() realizedPnl!: number;
  @ApiProperty() allocationPct!: number;
}

export class HoldingResponseDto extends HoldingDto {}

export class PortfolioResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() totalValueUsd!: number;
  @ApiProperty() totalCostBasisUsd!: number;
  @ApiProperty() totalProfitLossUsd!: number;
  @ApiProperty() totalProfitLossPct!: number;
  @ApiProperty() totalRealizedPnl!: number;
  @ApiProperty({ type: [HoldingResponseDto] }) holdings!: HoldingResponseDto[];
  @ApiProperty() currency!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PortfolioTransactionResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() portfolioId!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() productSymbol!: string;
  @ApiProperty() productName!: string;
  @ApiProperty() type!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() pricePerUnitUsd!: number;
  @ApiProperty() totalAmountUsd!: number;
  @ApiProperty() status!: string;
  @ApiProperty({ required: false }) notes?: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PortfolioSummaryDto {
  @ApiProperty() totalValue!: number;
  @ApiProperty() totalCost!: number;
  @ApiProperty() totalUnrealizedPnl!: number;
  @ApiProperty() totalRealizedPnl!: number;
  @ApiProperty() holdingsCount!: number;
  @ApiProperty() bestPerformer?: string;
  @ApiProperty() worstPerformer?: string;
}
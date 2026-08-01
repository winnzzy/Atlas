import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePriceDto {
  @ApiProperty({ description: 'Product symbol' })
  @IsString()
  @MaxLength(20)
  productSymbol!: string;

  @ApiProperty({ description: 'Current price in USD' })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ description: '24h change amount' })
  @IsOptional()
  @IsNumber()
  change24h?: number;

  @ApiPropertyOptional({ description: '24h change percentage' })
  @IsOptional()
  @IsNumber()
  change24hPct?: number;

  @ApiPropertyOptional({ description: 'Market cap' })
  @IsOptional()
  @IsNumber()
  marketCap?: number;

  @ApiPropertyOptional({ description: '24h volume' })
  @IsOptional()
  @IsNumber()
  volume24h?: number;
}

export class PriceResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() symbol!: string;
  @ApiProperty() price!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() change24h?: number | null;
  @ApiProperty() change24hPct?: number | null;
  @ApiProperty() marketCap?: number | null;
  @ApiProperty() volume24h?: number | null;
  @ApiProperty() updatedBy?: string | null;
  @ApiProperty() createdAt!: Date;
}

export class AssetWithPriceDto {
  @ApiProperty() id!: string;
  @ApiProperty() symbol!: string;
  @ApiProperty() name!: string;
  @ApiProperty() assetClass!: string;
  @ApiProperty() status!: string;
  @ApiProperty() description?: string | null;
  @ApiProperty() iconUrl?: string | null;
  @ApiProperty() currentPrice?: number | null;
  @ApiProperty() change24h?: number | null;
  @ApiProperty() change24hPct?: number | null;
  @ApiProperty() marketCap?: number | null;
  @ApiProperty() minDeposit?: number | null;
  @ApiProperty() minWithdrawal?: number | null;
  @ApiProperty() withdrawalFee?: number | null;
}
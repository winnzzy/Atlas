import { IsString, IsEnum, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetClass } from '../enums/asset-class.enum';
import { AssetStatus } from '../enums/investment-status.enum';

export class CreateAssetDto {
  @ApiProperty({ description: 'Asset symbol (e.g., BTC, ETH)' })
  @IsString()
  @MaxLength(20)
  symbol!: string;

  @ApiProperty({ description: 'Asset name' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: AssetClass, description: 'Asset class' })
  @IsEnum(AssetClass)
  assetClass!: AssetClass;

  @ApiPropertyOptional({ description: 'Asset description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  iconUrl?: string;

  @ApiPropertyOptional({ description: 'Decimal places for quantity', default: 8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  decimals?: number;

  @ApiPropertyOptional({ description: 'Minimum deposit amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minDeposit?: number;

  @ApiPropertyOptional({ description: 'Minimum withdrawal amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minWithdrawal?: number;

  @ApiPropertyOptional({ description: 'Withdrawal fee' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  withdrawalFee?: number;
}

export class UpdateAssetDto {
  @ApiPropertyOptional({ description: 'Asset name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Asset description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  iconUrl?: string;

  @ApiPropertyOptional({ description: 'Decimal places for quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  decimals?: number;

  @ApiPropertyOptional({ description: 'Minimum deposit amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minDeposit?: number;

  @ApiPropertyOptional({ description: 'Minimum withdrawal amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minWithdrawal?: number;

  @ApiPropertyOptional({ description: 'Withdrawal fee' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  withdrawalFee?: number;
}

export class UpdateAssetStatusDto {
  @ApiProperty({ enum: AssetStatus })
  @IsEnum(AssetStatus)
  status!: AssetStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AssetResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  symbol!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: AssetClass })
  assetClass!: AssetClass;

  @ApiProperty({ enum: AssetStatus })
  status!: AssetStatus;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  iconUrl?: string;

  @ApiPropertyOptional()
  decimals?: number;

  @ApiPropertyOptional()
  network?: string;

  @ApiPropertyOptional()
  minDeposit?: number;

  @ApiPropertyOptional()
  minWithdrawal?: number;

  @ApiPropertyOptional()
  withdrawalFee?: number;

  @ApiPropertyOptional()
  currentPrice?: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

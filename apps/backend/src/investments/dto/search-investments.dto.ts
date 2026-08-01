import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  AssetStatus,
  DepositStatus,
  WithdrawalStatus,
  WalletStatus,
} from '../enums/investment-status.enum';
import { AssetClass } from '../enums/asset-class.enum';

export class SearchAssetsDto {
  @ApiPropertyOptional({ description: 'Filter by asset class' })
  @IsOptional()
  @IsEnum(AssetClass)
  assetClass?: AssetClass;

  @ApiPropertyOptional({ description: 'Filter by asset status' })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @ApiPropertyOptional({ description: 'Search by symbol or name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class SearchDepositsDto {
  @ApiPropertyOptional({ description: 'Filter by customer user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ enum: DepositStatus })
  @IsOptional()
  @IsEnum(DepositStatus)
  status?: DepositStatus;

  @ApiPropertyOptional({ description: 'Filter by product symbol' })
  @IsOptional()
  @IsString()
  productSymbol?: string;

  @ApiPropertyOptional({ description: 'Filter from date' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter to date' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class SearchWithdrawalsDto {
  @ApiPropertyOptional({ description: 'Filter by customer user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ enum: WithdrawalStatus })
  @IsOptional()
  @IsEnum(WithdrawalStatus)
  status?: WithdrawalStatus;

  @ApiPropertyOptional({ description: 'Filter by product symbol' })
  @IsOptional()
  @IsString()
  productSymbol?: string;

  @ApiPropertyOptional({ description: 'Filter from date' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter to date' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class SearchWalletsDto {
  @ApiPropertyOptional({ description: 'Filter by product ID' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter by network' })
  @IsOptional()
  @IsString()
  network?: string;

  @ApiPropertyOptional({ enum: WalletStatus })
  @IsOptional()
  @IsEnum(WalletStatus)
  status?: WalletStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class PaginatedResponseDto<T> {
  data!: T[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}
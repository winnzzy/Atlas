import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, Max, MaxLength, Min, IsNumber } from 'class-validator';
import { TransferStatus } from '../enums/transfer-status.enum';
import { TransferType } from '../enums/transfer-type.enum';

export class SearchTransfersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  reference?: string;

  @ApiPropertyOptional({ enum: TransferStatus })
  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;

  @ApiPropertyOptional({ enum: TransferType })
  @IsOptional()
  @IsEnum(TransferType)
  type?: TransferType;

  @ApiPropertyOptional({ description: 'Beneficiary ID' })
  @IsOptional()
  @IsUUID()
  beneficiaryId?: string;

  @ApiPropertyOptional({ description: 'Account ID' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  minAmount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  maxAmount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

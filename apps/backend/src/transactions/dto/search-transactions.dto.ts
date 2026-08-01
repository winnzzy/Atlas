import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

/**
 * DTO for searching/filtering transactions.
 * Supports cursor-based pagination for large datasets.
 */
export class SearchTransactionsDto {
  @ApiPropertyOptional({ description: 'Filter by reference number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  reference?: string;

  @ApiPropertyOptional({ description: 'Filter by idempotency key' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  idempotencyKey?: string;

  @ApiPropertyOptional({ enum: TransactionType, description: 'Filter by transaction type' })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ enum: TransactionStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'Filter by account ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Filter by counterparty account ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  counterpartyAccountId?: string;

  @ApiPropertyOptional({ description: 'Filter by currency code' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum amount' })
  @IsOptional()
  @IsString()
  minAmount?: string;

  @ApiPropertyOptional({ description: 'Filter by maximum amount' })
  @IsOptional()
  @IsString()
  maxAmount?: string;

  @ApiPropertyOptional({ description: 'Filter by created from date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by created to date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({ description: 'Filter by creator ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Cursor for pagination (transaction ID)' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Number of results per page', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * DTO for statement export requests.
 * Placeholder only - no PDF generation.
 */
export class StatementExportDto {
  @ApiProperty({ description: 'Account ID', format: 'uuid' })
  @IsString()
  @IsUUID()
  accountId!: string;

  @ApiProperty({ description: 'Statement start date (ISO 8601)' })
  @IsDateString()
  fromDate!: string;

  @ApiProperty({ description: 'Statement end date (ISO 8601)' })
  @IsDateString()
  toDate!: string;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;
}

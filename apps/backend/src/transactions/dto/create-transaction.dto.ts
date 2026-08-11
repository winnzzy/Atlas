import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  MaxLength,
  IsObject,
  IsDateString,
} from 'class-validator';
import { TransactionType } from '../enums/transaction-type.enum';

/**
 * DTO for creating a new transaction.
 * Orchestrates the business workflow — all accounting is delegated to the Ledger Engine.
 */
export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType, description: 'Type of transaction' })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiProperty({ description: 'Source account ID', format: 'uuid' })
  @IsUUID()
  accountId!: string;

  @ApiPropertyOptional({ description: 'Destination/counterparty account ID for transfers', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  counterpartyAccountId?: string;

  @ApiProperty({ description: 'Transaction amount (string representation for precision)' })
  @IsString()
  amount!: string;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Transaction description' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ description: 'Unique idempotency key to prevent duplicates' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'External reference number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  reference?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as key-value pairs' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({ description: 'ID of the user creating the transaction', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Transaction expiration date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Counterparty name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  counterparty?: string;

  @ApiPropertyOptional({ description: 'Counterparty account number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  counterpartyAccount?: string;

  @ApiPropertyOptional({ description: 'SWIFT code for international wires' })
  @IsOptional()
  @IsString()
  @MaxLength(11)
  swiftCode?: string;

  @ApiPropertyOptional({ description: 'Routing number for ACH/wire' })
  @IsOptional()
  @IsString()
  @MaxLength(9)
  routingNumber?: string;

  @ApiPropertyOptional({ description: 'Beneficiary name for wire transfers' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  beneficiaryName?: string;

  @ApiPropertyOptional({ description: 'Beneficiary bank for wire transfers' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  beneficiaryBank?: string;
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PostingType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
  FEE = 'FEE',
  INTEREST = 'INTEREST',
  ADJUSTMENT = 'ADJUSTMENT',
  CARD_AUTHORIZATION = 'CARD_AUTHORIZATION',
  CARD_CAPTURE = 'CARD_CAPTURE',
  CRYPTO_DEPOSIT = 'CRYPTO_DEPOSIT',
  CRYPTO_WITHDRAWAL = 'CRYPTO_WITHDRAWAL',
  PAYROLL = 'PAYROLL',
  ACH = 'ACH',
  WIRE = 'WIRE',
  SWIFT = 'SWIFT',
  LOAN_PAYMENT = 'LOAN_PAYMENT',
  INVESTMENT_PURCHASE = 'INVESTMENT_PURCHASE',
  INVESTMENT_SALE = 'INVESTMENT_SALE',
}

export enum EntrySide {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export class JournalLineDto {
  @ApiProperty({ description: 'Account ID for this line' })
  @IsUUID()
  @IsNotEmpty()
  accountId!: string;

  @ApiProperty({ enum: EntrySide, description: 'Debit or Credit side' })
  @IsEnum(EntrySide)
  side!: EntrySide;

  @ApiProperty({ description: 'Amount in minor units (cents)' })
  @IsString()
  @IsNotEmpty()
  amount!: string;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Description for this line' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class PostJournalDto {
  @ApiProperty({ enum: PostingType, description: 'Type of posting' })
  @IsEnum(PostingType)
  type!: PostingType;

  @ApiProperty({ description: 'ISO date string for the entry date' })
  @IsString()
  @IsNotEmpty()
  entryDate!: string;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Description/notes' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Idempotency key to prevent duplicate posting' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Source reference (e.g. external system ID)' })
  @IsOptional()
  @IsString()
  sourceReference?: string;

  @ApiProperty({ type: [JournalLineDto], description: 'Journal lines (debits and credits)' })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines!: JournalLineDto[];
}

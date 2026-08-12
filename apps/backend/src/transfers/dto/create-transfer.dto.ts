import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { TransferType } from '../enums/transfer-type.enum';

export class TransferFeeDto {
  @ApiProperty({ description: 'Fee amount as a decimal string' })
  @IsString()
  amount!: string;

  @ApiProperty({ description: 'Fee model', enum: ['FLAT', 'PERCENTAGE'] })
  @IsString()
  feeType!: 'FLAT' | 'PERCENTAGE';

  @ApiPropertyOptional({ description: 'Fee waiver flag' })
  @IsOptional()
  @IsBoolean()
  waived?: boolean;

  @ApiPropertyOptional({ description: 'Fee sharing model', enum: ['OUR', 'BEN', 'SHA', 'SHARED'] })
  @IsOptional()
  @IsString()
  sharing?: 'OUR' | 'BEN' | 'SHA' | 'SHARED';
}

export class CreateBeneficiaryDto {
  @ApiProperty({ description: 'Beneficiary display name' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'Beneficiary type', enum: ['DOMESTIC', 'INTERNATIONAL', 'SWIFT'] })
  @IsString()
  type!: 'DOMESTIC' | 'INTERNATIONAL' | 'SWIFT';

  @ApiPropertyOptional({ description: 'US routing number' })
  @IsOptional()
  @IsString()
  @MaxLength(9)
  routingNumber?: string;

  @ApiPropertyOptional({ description: 'SWIFT/BIC code' })
  @IsOptional()
  @IsString()
  @MaxLength(11)
  swiftCode?: string;

  @ApiPropertyOptional({ description: 'IBAN (future-ready)' })
  @IsOptional()
  @IsString()
  @MaxLength(34)
  iban?: string;

  @ApiProperty({ description: 'Country code' })
  @IsString()
  @MaxLength(2)
  country!: string;

  @ApiProperty({ description: 'Currency code' })
  @IsString()
  @MaxLength(3)
  currency!: string;

  @ApiPropertyOptional({ description: 'Bank name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankName?: string;

  @ApiPropertyOptional({ description: 'External account number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Bank branch' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  branchName?: string;

  @ApiPropertyOptional({ description: 'Favorite recipient flag' })
  @IsOptional()
  @IsBoolean()
  favorite?: boolean;
}

export class CreateTransferDto {
  @ApiProperty({ enum: TransferType })
  @IsEnum(TransferType)
  type!: TransferType;

  @ApiProperty({ description: 'Source account ID', format: 'uuid' })
  @IsUUID()
  sourceAccountId!: string;

  @ApiPropertyOptional({ description: 'Destination Atlas account ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  destinationAccountId?: string;

  @ApiPropertyOptional({ description: 'External beneficiary ID' })
  @IsOptional()
  @IsUUID()
  beneficiaryId?: string;

  @ApiProperty({ description: 'Amount in major units as a string' })
  @IsString()
  amount!: string;

  @ApiProperty({ description: 'Currency code', default: 'USD' })
  @IsString()
  @MaxLength(3)
  currency!: string;

  @ApiPropertyOptional({ description: 'Transfer description' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ description: 'Memo for recipient' })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  memo?: string;

  @ApiPropertyOptional({ description: 'Idempotency key' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Reference number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  reference?: string;

  @ApiPropertyOptional({ description: 'Scheduled execution timestamp' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ type: TransferFeeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TransferFeeDto)
  fee?: TransferFeeDto;

  @ApiPropertyOptional({ description: 'Country of destination' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  destinationCountry?: string;

  @ApiPropertyOptional({ description: 'SWIFT/BIC code for international transfers' })
  @IsOptional()
  @IsString()
  @MaxLength(11)
  swiftCode?: string;

  @ApiPropertyOptional({ description: 'Routing number for domestic transfers' })
  @IsOptional()
  @IsString()
  @MaxLength(9)
  routingNumber?: string;

  @ApiPropertyOptional({ description: 'Bank name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankName?: string;

  @ApiPropertyOptional({ description: 'Beneficiary name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  beneficiaryName?: string;

  @ApiPropertyOptional({ description: 'External destination account number' })
  @IsOptional()
  @IsString()
  @MaxLength(34)
  destinationAccountNumber?: string;

  @ApiPropertyOptional({ description: 'External destination account type', enum: ['CHECKING', 'SAVINGS'] })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  destinationAccountType?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, string>;
}

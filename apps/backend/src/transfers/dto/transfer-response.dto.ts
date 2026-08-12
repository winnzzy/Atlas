import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransferStatus } from '../enums/transfer-status.enum';
import { TransferType } from '../enums/transfer-type.enum';

export class TransferResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  reference?: string;

  @ApiProperty({ enum: TransferType })
  type!: TransferType;

  @ApiProperty({ enum: TransferStatus })
  status!: TransferStatus;

  @ApiPropertyOptional({
    description:
      'Customer-facing status note (e.g. a pending transfer awaiting support). Never carries internal restriction reasons.',
  })
  statusMessage?: string;

  @ApiProperty()
  sourceAccountId!: string;

  @ApiPropertyOptional()
  destinationAccountId?: string;

  @ApiPropertyOptional()
  beneficiaryId?: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty()
  currency!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  memo?: string;

  @ApiPropertyOptional()
  idempotencyKey?: string;

  @ApiPropertyOptional()
  feeAmount?: string;

  @ApiPropertyOptional()
  feeType?: string;

  @ApiPropertyOptional()
  feeSharing?: string;

  @ApiPropertyOptional()
  beneficiaryName?: string;

  @ApiPropertyOptional()
  beneficiaryBank?: string;

  @ApiPropertyOptional()
  routingNumber?: string;

  @ApiPropertyOptional()
  swiftCode?: string;

  @ApiPropertyOptional()
  iban?: string;

  @ApiPropertyOptional()
  settlementReference?: string;

  @ApiPropertyOptional()
  submittedAt?: Date;

  @ApiPropertyOptional()
  sentAt?: Date;

  @ApiPropertyOptional()
  settlementAt?: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  failedAt?: Date;

  @ApiPropertyOptional()
  cancelledAt?: Date;

  @ApiPropertyOptional()
  returnedAt?: Date;

  @ApiPropertyOptional()
  reversedAt?: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional()
  metadata?: Record<string, string>;
}

export class BeneficiaryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  currency!: string;

  @ApiPropertyOptional()
  routingNumber?: string;

  @ApiPropertyOptional()
  swiftCode?: string;

  @ApiPropertyOptional()
  iban?: string;

  @ApiPropertyOptional()
  bankName?: string;

  @ApiPropertyOptional()
  accountNumber?: string;

  @ApiProperty()
  country!: string;

  @ApiPropertyOptional()
  favorite?: boolean;

  @ApiPropertyOptional()
  verifiedAt?: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class TransferSearchResponseDto {
  @ApiProperty({ type: [TransferResponseDto] })
  items!: TransferResponseDto[];

  @ApiPropertyOptional()
  nextCursor?: string;

  @ApiProperty()
  totalCount!: number;

  @ApiProperty()
  limit!: number;
}

export class BeneficiarySearchResponseDto {
  @ApiProperty({ type: [BeneficiaryResponseDto] })
  items!: BeneficiaryResponseDto[];

  @ApiPropertyOptional()
  nextCursor?: string;

  @ApiProperty()
  totalCount!: number;
}

import { IsString, IsNumber, IsOptional, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DepositStatus } from '../enums/investment-status.enum';

export class CreateDepositDto {
  @ApiProperty({ description: 'Asset product symbol (e.g., BTC, ETH)' })
  @IsString()
  @MaxLength(20)
  productSymbol!: string;

  @ApiProperty({ description: 'Deposit amount in asset units' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ description: 'Transaction hash from blockchain' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  txHash?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ApproveDepositDto {
  @ApiPropertyOptional({ description: 'Transaction hash if not provided by customer' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  txHash?: string;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectDepositDto {
  @ApiProperty({ description: 'Reason for rejection' })
  @IsString()
  reason!: string;
}

export class DepositResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() walletId!: string;
  @ApiProperty() amount!: number;
  @ApiProperty() txHash?: string | null;
  @ApiProperty() network!: string;
  @ApiProperty({ enum: DepositStatus }) status!: DepositStatus;
  @ApiProperty() reference!: string;
  @ApiProperty() approvedBy?: string | null;
  @ApiProperty() approvedAt?: Date | null;
  @ApiProperty() rejectedBy?: string | null;
  @ApiProperty() rejectedAt?: Date | null;
  @ApiProperty() rejectionReason?: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
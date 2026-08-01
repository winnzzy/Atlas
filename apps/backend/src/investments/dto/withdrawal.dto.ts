import { IsString, IsNumber, IsOptional, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WithdrawalStatus } from '../enums/investment-status.enum';

export class CreateWithdrawalDto {
  @ApiProperty({ description: 'Asset product symbol (e.g., BTC, ETH)' })
  @IsString()
  @MaxLength(20)
  productSymbol!: string;

  @ApiProperty({ description: 'Withdrawal amount in asset units' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ description: 'Destination wallet address' })
  @IsString()
  @MaxLength(200)
  toAddress!: string;

  @ApiPropertyOptional({ description: 'Destination memo/tag' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  toMemo?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ApproveWithdrawalDto {
  @ApiPropertyOptional({ description: 'Blockchain transaction hash' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  txHash?: string;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectWithdrawalDto {
  @ApiProperty({ description: 'Reason for rejection' })
  @IsString()
  reason!: string;
}

export class WithdrawalResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() amount!: number;
  @ApiProperty() toAddress!: string;
  @ApiProperty() toMemo?: string | null;
  @ApiProperty() network!: string;
  @ApiProperty() fee!: number;
  @ApiProperty() netAmount!: number;
  @ApiProperty({ enum: WithdrawalStatus }) status!: WithdrawalStatus;
  @ApiProperty() reference!: string;
  @ApiProperty() txHash?: string | null;
  @ApiProperty() approvedBy?: string | null;
  @ApiProperty() approvedAt?: Date | null;
  @ApiProperty() rejectedBy?: string | null;
  @ApiProperty() rejectedAt?: Date | null;
  @ApiProperty() rejectionReason?: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum ReversalType {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
}

export class ReverseJournalDto {
  @ApiProperty({ description: 'Original transaction ID to reverse' })
  @IsUUID()
  @IsNotEmpty()
  transactionId!: string;

  @ApiProperty({ enum: ReversalType, description: 'Full or partial reversal' })
  @IsEnum(ReversalType)
  type!: ReversalType;

  @ApiProperty({ description: 'Reason for the reversal' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({
    description: 'Reason code (e.g. CUSTOMER_REQUEST, ERROR_CORRECTION, FRAUD)',
  })
  @IsOptional()
  @IsString()
  reasonCode?: string;

  @ApiPropertyOptional({ description: 'Amount for partial reversal (minor units/cents)' })
  @IsOptional()
  @IsString()
  reversalAmount?: string;
}

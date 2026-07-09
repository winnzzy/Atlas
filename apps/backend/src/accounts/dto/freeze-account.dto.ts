import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum FreezeReasonDto {
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  FRAUD_ALERT = 'FRAUD_ALERT',
  COURT_ORDER = 'COURT_ORDER',
  REGULATORY_HOLD = 'REGULATORY_HOLD',
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  INTERNAL_REVIEW = 'INTERNAL_REVIEW',
}

export class FreezeAccountDto {
  @ApiProperty({ enum: FreezeReasonDto, description: 'Reason for freezing the account' })
  @IsEnum(FreezeReasonDto)
  reason!: FreezeReasonDto;

  @ApiPropertyOptional({ description: 'Additional note about the freeze' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum ReconciliationType {
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
  MANUAL = 'MANUAL',
}

export enum ReconciliationStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  BALANCED = 'BALANCED',
  VARIANCE_DETECTED = 'VARIANCE_DETECTED',
  RESOLVED = 'RESOLVED',
}

export class CreateReconciliationDto {
  @ApiProperty({ description: 'Account ID to reconcile' })
  @IsUUID()
  @IsNotEmpty()
  accountId!: string;

  @ApiProperty({ enum: ReconciliationType })
  @IsEnum(ReconciliationType)
  type!: ReconciliationType;

  @ApiProperty({ description: 'Period start date (ISO string)' })
  @IsString()
  @IsNotEmpty()
  periodStart!: string;

  @ApiProperty({ description: 'Period end date (ISO string)' })
  @IsString()
  @IsNotEmpty()
  periodEnd!: string;

  @ApiPropertyOptional({ description: 'Expected balance (if external source)' })
  @IsOptional()
  @IsString()
  expectedBalance?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReconciliationResultDto {
  @ApiProperty() id!: string;
  @ApiProperty() accountId!: string;
  @ApiProperty() type!: string;
  @ApiProperty() status!: string;
  @ApiProperty() periodStart!: Date;
  @ApiProperty() periodEnd!: Date;
  @ApiProperty() expectedBalance!: string;
  @ApiProperty() actualBalance!: string;
  @ApiProperty() variance!: string;
  @ApiProperty() isBalanced!: boolean;
  @ApiProperty() postingCount!: number;
  @ApiProperty() notes!: string | null;
  @ApiProperty() createdAt!: Date;
}

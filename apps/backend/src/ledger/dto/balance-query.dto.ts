import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class BalanceQueryDto {
  @ApiProperty({ description: 'Account ID to get balance for' })
  @IsUUID()
  accountId!: string;

  @ApiPropertyOptional({ description: 'As-of date (ISO string). Defaults to now.' })
  @IsOptional()
  @IsString()
  asOfDate?: string;

  @ApiPropertyOptional({ description: 'Currency code filter' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class BalanceResultDto {
  @ApiProperty() accountId!: string;
  @ApiProperty() currentBalance!: string;
  @ApiProperty() availableBalance!: string;
  @ApiProperty() pendingBalance!: string;
  @ApiProperty() heldAmount!: string;
  @ApiProperty() currency!: string;
  @ApiProperty() asOfDate!: Date;
}

export class PostingLineResultDto {
  @ApiProperty() id!: string;
  @ApiProperty() transactionId!: string;
  @ApiProperty() accountId!: string;
  @ApiProperty() side!: string;
  @ApiProperty() amount!: string;
  @ApiProperty() currency!: string;
  @ApiProperty() description!: string | null;
  @ApiProperty() entryDate!: Date;
  @ApiProperty() postingType!: string;
  @ApiProperty() status!: string;
  @ApiProperty() createdAt!: Date;
}

export class HoldResultDto {
  @ApiProperty() id!: string;
  @ApiProperty() accountId!: string;
  @ApiProperty() amount!: string;
  @ApiProperty() currency!: string;
  @ApiProperty() reason!: string;
  @ApiProperty() status!: string;
  @ApiProperty() expiresAt!: Date | null;
  @ApiProperty() releasedAmount!: string | null;
  @ApiProperty() relatedTransactionId!: string | null;
  @ApiProperty() createdAt!: Date;
}

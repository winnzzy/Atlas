import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateHoldDto {
  @ApiProperty({ description: 'Account ID to place hold on' })
  @IsUUID()
  @IsNotEmpty()
  accountId!: string;

  @ApiProperty({ description: 'Amount to hold (in minor units/cents)' })
  @IsString()
  @IsNotEmpty()
  amount!: string;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Reason for the hold' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({ description: 'Expiration date (ISO string)' })
  @IsOptional()
  @IsString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Related transaction ID' })
  @IsOptional()
  @IsString()
  relatedTransactionId?: string;
}

export class ReleaseHoldDto {
  @ApiPropertyOptional({
    description:
      'Partial release amount (in minor units/cents). If omitted, releases the full hold.',
  })
  @IsOptional()
  @IsString()
  releaseAmount?: string;

  @ApiPropertyOptional({ description: 'Reason for release' })
  @IsOptional()
  @IsString()
  reason?: string;
}

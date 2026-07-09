import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class LockAccountDto {
  @ApiPropertyOptional({ description: 'Reason for locking the account' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UnlockAccountDto {
  @ApiPropertyOptional({ description: 'Note about the unlock' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

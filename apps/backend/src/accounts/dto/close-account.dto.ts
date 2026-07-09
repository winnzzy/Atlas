import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ClosureReasonDto {
  USER_REQUEST = 'USER_REQUEST',
  ADMIN_ACTION = 'ADMIN_ACTION',
  COMPLIANCE = 'COMPLIANCE',
  INACTIVITY = 'INACTIVITY',
  FRAUD = 'FRAUD',
  MERGED_ACCOUNT = 'MERGED_ACCOUNT',
}

export class CloseAccountDto {
  @ApiPropertyOptional({
    enum: ClosureReasonDto,
    description: 'Reason for closing the account',
    default: ClosureReasonDto.USER_REQUEST,
  })
  @IsOptional()
  @IsEnum(ClosureReasonDto)
  reason?: ClosureReasonDto;

  @ApiPropertyOptional({ description: 'Additional note about the closure' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

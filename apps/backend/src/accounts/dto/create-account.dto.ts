import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export enum AccountTypeDto {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  BUSINESS = 'BUSINESS',
  INVESTMENT_CASH = 'INVESTMENT_CASH',
}

export class CreateAccountDto {
  @ApiProperty({ enum: AccountTypeDto, description: 'Type of account to create' })
  @IsEnum(AccountTypeDto)
  accountType!: AccountTypeDto;

  @ApiProperty({ description: 'Display name for the account', example: 'Primary Checking' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD', example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Optional nickname for the account', example: 'My Checking' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;
}

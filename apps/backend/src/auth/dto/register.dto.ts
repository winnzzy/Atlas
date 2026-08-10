import { IsDateString, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'ava.simmons@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass!234' })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: 'Ava' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Simmons' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ format: 'date-time', required: false })
  @IsOptional()
  @IsDateString()
  termsAcceptedAt?: string;

  @ApiProperty({ format: 'date-time', required: false })
  @IsOptional()
  @IsDateString()
  privacyAcceptedAt?: string;
}

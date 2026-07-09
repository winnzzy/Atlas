import { IsBoolean, IsEmail, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'ava.simmons@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass!234' })
  @IsString()
  password!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{6}$/)
  otpCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ example: 'Atlas App on macOS' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

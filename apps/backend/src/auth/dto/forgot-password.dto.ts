import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'ava.simmons@example.com' })
  @IsEmail()
  email!: string;
}

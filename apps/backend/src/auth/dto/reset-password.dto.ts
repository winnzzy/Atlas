import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ example: 'AnotherStrongPass!456' })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  newPassword!: string;
}

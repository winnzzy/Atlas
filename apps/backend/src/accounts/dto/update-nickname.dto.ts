import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateNicknameDto {
  @ApiProperty({ description: 'New nickname for the account', example: 'My Savings' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  nickname!: string;
}

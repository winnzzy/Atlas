import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WalletStatus } from '../enums/investment-status.enum';

export class CreateWalletDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId!: string;

  @ApiProperty({ description: 'Blockchain network (e.g., ERC20, TRC20, Bitcoin)' })
  @IsString()
  @MaxLength(50)
  network!: string;

  @ApiProperty({ description: 'Wallet deposit address' })
  @IsString()
  @MaxLength(200)
  address!: string;

  @ApiPropertyOptional({ description: 'Memo/tag for networks that require it' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  memo?: string;

  @ApiPropertyOptional({ description: 'Label for the wallet' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;
}

export class UpdateWalletDto {
  @ApiPropertyOptional({ description: 'New deposit address' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ description: 'New memo/tag' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  memo?: string;

  @ApiPropertyOptional({ description: 'New label' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @ApiPropertyOptional({ enum: WalletStatus })
  @IsOptional()
  @IsEnum(WalletStatus)
  status?: WalletStatus;
}

export class WalletResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() network!: string;
  @ApiProperty() address!: string;
  @ApiProperty() memo?: string | null;
  @ApiProperty() label?: string | null;
  @ApiProperty({ enum: WalletStatus }) status!: WalletStatus;
  @ApiPropertyOptional() productSymbol?: string;
  @ApiPropertyOptional() productName?: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Public site contact / footer information. Every field is nullable — the
 * frontend renders a clearly-marked placeholder for any value that has not been
 * configured, so nothing is ever invented.
 */
export class PublicContactDto {
  @ApiPropertyOptional({ nullable: true }) supportEmail!: string | null;
  @ApiPropertyOptional({ nullable: true }) supportPhone!: string | null;
  @ApiPropertyOptional({ nullable: true }) businessAddress!: string | null;
  @ApiPropertyOptional({ nullable: true }) legalEntity!: string | null;
  @ApiPropertyOptional({ nullable: true }) licenseInfo!: string | null;
  @ApiPropertyOptional({ nullable: true }) depositInsuranceInfo!: string | null;
}

export class UpdatePublicContactDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) supportEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) supportPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) businessAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) legalEntity?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) licenseInfo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) depositInsuranceInfo?: string;
}

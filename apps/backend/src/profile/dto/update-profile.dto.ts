import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';

export class UpdatePersonalInformationDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/)
  ssnLast4?: string;
}

export class UpdateContactInformationDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(7, 20)
  phoneNumber?: string;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  line1?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  line2?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  state?: string;

  @IsOptional()
  @IsString()
  @Length(5, 10)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;
}

export class UpdateEmploymentDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  employerName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  jobTitle?: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  employmentStatus?: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  annualIncomeRange?: string;
}

export class UpdateTaxInformationDto {
  @IsOptional()
  @IsString()
  @Length(2, 2)
  taxResidencyCountry?: string;

  @IsOptional()
  @IsString()
  @Length(4, 20)
  taxIdMasked?: string;

  @IsOptional()
  @IsBoolean()
  w9OnFile?: boolean;
}

export class UpdateProfileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePersonalInformationDto)
  personalInformation?: UpdatePersonalInformationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateContactInformationDto)
  contactInformation?: UpdateContactInformationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  address?: UpdateAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateEmploymentDto)
  employment?: UpdateEmploymentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateTaxInformationDto)
  taxInformation?: UpdateTaxInformationDto;
}

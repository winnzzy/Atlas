import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, Length, ValidateNested } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  transactionAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  securityAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  loginAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  balanceAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  transferAlerts?: boolean;
}

export class UpdateAccessibilityPreferencesDto {
  @IsOptional()
  @IsBoolean()
  reducedMotion?: boolean;

  @IsOptional()
  @IsBoolean()
  highContrast?: boolean;

  @IsOptional()
  @IsBoolean()
  largeText?: boolean;

  @IsOptional()
  @IsBoolean()
  screenReaderOptimized?: boolean;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  @Length(3, 3)
  preferredCurrency?: string;

  @IsOptional()
  @IsIn(['en', 'es'])
  preferredLanguage?: 'en' | 'es';

  @IsOptional()
  @IsString()
  @Length(1, 50)
  timezone?: string;

  @IsOptional()
  @IsIn(['light', 'dark', 'system'])
  theme?: 'light' | 'dark' | 'system';

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateNotificationPreferencesDto)
  notificationPreferences?: UpdateNotificationPreferencesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAccessibilityPreferencesDto)
  accessibility?: UpdateAccessibilityPreferencesDto;
}

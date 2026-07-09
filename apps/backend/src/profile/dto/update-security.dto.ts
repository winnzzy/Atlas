import { IsBoolean, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class UpdateSecurityDto {
  @IsOptional()
  @IsBoolean()
  mfaEnabled?: boolean;

  @IsOptional()
  @IsString()
  @Length(3, 50)
  mfaMethod?: string;

  @IsOptional()
  @IsBoolean()
  biometricUnlockEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  loginAlertsEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(240)
  sessionTimeoutMinutes?: number;
}

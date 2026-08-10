import { ApiProperty } from '@nestjs/swagger';

export class ProfileDocumentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  uploadedAt!: string;

  @ApiProperty({ required: false })
  expiresAt?: string;
}

export class VerificationSummaryDto {
  @ApiProperty()
  kycStatus!: string;

  @ApiProperty()
  kycLevel!: string;

  @ApiProperty()
  overallStatus!: string;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty()
  phoneVerified!: boolean;
}

export class PersonalInformationDto {
  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  dateOfBirth!: string;

  @ApiProperty()
  ssnLast4!: string;
}

export class ContactInformationDto {
  @ApiProperty()
  email!: string;

  @ApiProperty()
  phoneNumber!: string;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty()
  phoneVerified!: boolean;
}

export class AddressInformationDto {
  @ApiProperty()
  line1!: string;

  @ApiProperty({ required: false })
  line2?: string;

  @ApiProperty()
  city!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty()
  postalCode!: string;

  @ApiProperty()
  country!: string;
}

export class EmploymentInformationDto {
  @ApiProperty()
  employerName!: string;

  @ApiProperty()
  jobTitle!: string;

  @ApiProperty()
  employmentStatus!: string;

  @ApiProperty()
  annualIncomeRange!: string;
}

export class TaxInformationDto {
  @ApiProperty()
  taxResidencyCountry!: string;

  @ApiProperty()
  taxIdMasked!: string;

  @ApiProperty()
  w9OnFile!: boolean;
}

export class ProfileResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  avatarInitials!: string;

  @ApiProperty({ type: () => PersonalInformationDto })
  personalInformation!: PersonalInformationDto;

  @ApiProperty({ type: () => ContactInformationDto })
  contactInformation!: ContactInformationDto;

  @ApiProperty({ type: () => AddressInformationDto })
  address!: AddressInformationDto;

  @ApiProperty({ type: () => EmploymentInformationDto })
  employment!: EmploymentInformationDto;

  @ApiProperty({ type: () => TaxInformationDto })
  taxInformation!: TaxInformationDto;

  @ApiProperty()
  preferredCurrency!: string;

  @ApiProperty()
  preferredLanguage!: string;

  @ApiProperty()
  timezone!: string;

  @ApiProperty({ type: () => VerificationSummaryDto })
  verification!: VerificationSummaryDto;

  @ApiProperty({ type: () => [ProfileDocumentDto] })
  documents!: ProfileDocumentDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class NotificationPreferencesDto {
  @ApiProperty()
  emailEnabled!: boolean;

  @ApiProperty()
  smsEnabled!: boolean;

  @ApiProperty()
  pushEnabled!: boolean;

  @ApiProperty()
  transactionAlerts!: boolean;

  @ApiProperty()
  securityAlerts!: boolean;

  @ApiProperty()
  marketingEmails!: boolean;

  @ApiProperty()
  loginAlerts!: boolean;

  @ApiProperty()
  balanceAlerts!: boolean;

  @ApiProperty()
  transferAlerts!: boolean;
}

export class AccessibilityPreferencesDto {
  @ApiProperty()
  reducedMotion!: boolean;

  @ApiProperty()
  highContrast!: boolean;

  @ApiProperty()
  largeText!: boolean;

  @ApiProperty()
  screenReaderOptimized!: boolean;
}

export class PreferencesResponseDto {
  @ApiProperty()
  preferredCurrency!: string;

  @ApiProperty()
  preferredLanguage!: string;

  @ApiProperty()
  timezone!: string;

  @ApiProperty()
  theme!: string;

  @ApiProperty({ type: () => NotificationPreferencesDto })
  notificationPreferences!: NotificationPreferencesDto;

  @ApiProperty({ type: () => AccessibilityPreferencesDto })
  accessibility!: AccessibilityPreferencesDto;
}

export class ConnectedDeviceDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  platform!: string;

  @ApiProperty()
  browser!: string;

  @ApiProperty()
  location!: string;

  @ApiProperty()
  ipAddress!: string;

  @ApiProperty()
  lastActiveAt!: string;

  @ApiProperty()
  isCurrent!: boolean;

  @ApiProperty()
  isTrusted!: boolean;
}

export class ActiveSessionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  deviceName!: string;

  @ApiProperty()
  ipAddress!: string;

  @ApiProperty()
  startedAt!: string;

  @ApiProperty()
  expiresAt!: string;

  @ApiProperty()
  isCurrent!: boolean;

  @ApiProperty()
  status!: string;
}

export class SecurityTimelineEventDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  severity!: string;

  @ApiProperty()
  occurredAt!: string;
}

export class SecurityResponseDto {
  @ApiProperty()
  mfaEnabled!: boolean;

  @ApiProperty({ required: false })
  mfaMethod?: string;

  @ApiProperty()
  biometricUnlockEnabled!: boolean;

  @ApiProperty()
  loginAlertsEnabled!: boolean;

  @ApiProperty()
  sessionTimeoutMinutes!: number;

  @ApiProperty({ required: false })
  lastPasswordChangedAt?: string;

  @ApiProperty({ required: false })
  lastLoginAt?: string;

  @ApiProperty({ type: () => [ConnectedDeviceDto] })
  connectedDevices!: ConnectedDeviceDto[];

  @ApiProperty({ type: () => [ActiveSessionDto] })
  activeSessions!: ActiveSessionDto[];

  @ApiProperty({ type: () => [SecurityTimelineEventDto] })
  recentEvents!: SecurityTimelineEventDto[];
}

export class ProfileActivityItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({ required: false })
  location?: string;

  @ApiProperty({ required: false })
  deviceName?: string;
}

export class ActivityResponseDto {
  @ApiProperty({ type: () => [ProfileActivityItemDto] })
  items!: ProfileActivityItemDto[];
}

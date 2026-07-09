export type VerificationState = 'verified' | 'pending' | 'under_review';

export type ProfileLanguage = 'en' | 'es';

export type ProfileTheme = 'light' | 'dark' | 'system';

export interface ProfileDocument {
  readonly id: string;
  readonly type: 'drivers_license' | 'passport' | 'state_id';
  readonly status: VerificationState;
  readonly uploadedAt: string;
  readonly expiresAt?: string;
}

export interface VerificationSummary {
  readonly kycStatus: string;
  readonly kycLevel: string;
  readonly overallStatus: VerificationState;
  readonly emailVerified: boolean;
  readonly phoneVerified: boolean;
}

export interface PersonalInformation {
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly dateOfBirth: string;
  readonly ssnLast4: string;
}

export interface ContactInformation {
  readonly email: string;
  readonly phoneNumber: string;
  readonly emailVerified: boolean;
  readonly phoneVerified: boolean;
}

export interface AddressInformation {
  readonly line1: string;
  readonly line2?: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
}

export interface EmploymentInformation {
  readonly employerName: string;
  readonly jobTitle: string;
  readonly employmentStatus: string;
  readonly annualIncomeRange: string;
}

export interface TaxInformation {
  readonly taxResidencyCountry: string;
  readonly taxIdMasked: string;
  readonly w9OnFile: boolean;
}

export interface CustomerProfile {
  readonly id: string;
  readonly avatarInitials: string;
  readonly personalInformation: PersonalInformation;
  readonly contactInformation: ContactInformation;
  readonly address: AddressInformation;
  readonly employment: EmploymentInformation;
  readonly taxInformation: TaxInformation;
  readonly preferredCurrency: string;
  readonly preferredLanguage: ProfileLanguage;
  readonly timezone: string;
  readonly verification: VerificationSummary;
  readonly documents: readonly ProfileDocument[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NotificationPreferences {
  readonly emailEnabled: boolean;
  readonly smsEnabled: boolean;
  readonly pushEnabled: boolean;
  readonly transactionAlerts: boolean;
  readonly securityAlerts: boolean;
  readonly marketingEmails: boolean;
  readonly loginAlerts: boolean;
  readonly balanceAlerts: boolean;
  readonly transferAlerts: boolean;
}

export interface AccessibilityPreferences {
  readonly reducedMotion: boolean;
  readonly highContrast: boolean;
  readonly largeText: boolean;
  readonly screenReaderOptimized: boolean;
}

export interface CustomerPreferences {
  readonly preferredCurrency: string;
  readonly preferredLanguage: ProfileLanguage;
  readonly timezone: string;
  readonly theme: ProfileTheme;
  readonly notificationPreferences: NotificationPreferences;
  readonly accessibility: AccessibilityPreferences;
}

export interface ConnectedDevice {
  readonly id: string;
  readonly name: string;
  readonly platform: string;
  readonly browser: string;
  readonly location: string;
  readonly ipAddress: string;
  readonly lastActiveAt: string;
  readonly isCurrent: boolean;
  readonly isTrusted: boolean;
}

export interface ActiveSession {
  readonly id: string;
  readonly deviceName: string;
  readonly ipAddress: string;
  readonly startedAt: string;
  readonly expiresAt: string;
  readonly isCurrent: boolean;
  readonly status: 'active' | 'expiring_soon';
}

export interface SecurityTimelineEvent {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly severity: 'info' | 'warning' | 'critical';
  readonly occurredAt: string;
}

export interface CustomerSecurity {
  readonly mfaEnabled: boolean;
  readonly mfaMethod?: string;
  readonly biometricUnlockEnabled: boolean;
  readonly loginAlertsEnabled: boolean;
  readonly sessionTimeoutMinutes: number;
  readonly lastPasswordChangedAt?: string;
  readonly lastLoginAt?: string;
  readonly connectedDevices: readonly ConnectedDevice[];
  readonly activeSessions: readonly ActiveSession[];
  readonly recentEvents: readonly SecurityTimelineEvent[];
}

export interface ProfileActivityItem {
  readonly id: string;
  readonly type: 'login' | 'security' | 'profile_update' | 'document' | 'preference';
  readonly title: string;
  readonly description: string;
  readonly timestamp: string;
  readonly location?: string;
  readonly deviceName?: string;
}

export interface CustomerProfileActivity {
  readonly items: readonly ProfileActivityItem[];
}

export interface UpdateCustomerProfileInput {
  readonly personalInformation?: Partial<
    Pick<PersonalInformation, 'firstName' | 'lastName' | 'dateOfBirth' | 'ssnLast4'>
  >;
  readonly contactInformation?: Partial<Pick<ContactInformation, 'email' | 'phoneNumber'>>;
  readonly address?: Partial<AddressInformation>;
  readonly employment?: Partial<EmploymentInformation>;
  readonly taxInformation?: Partial<TaxInformation>;
}

export interface UpdateCustomerPreferencesInput {
  readonly preferredCurrency?: string;
  readonly preferredLanguage?: ProfileLanguage;
  readonly timezone?: string;
  readonly theme?: ProfileTheme;
  readonly notificationPreferences?: Partial<NotificationPreferences>;
  readonly accessibility?: Partial<AccessibilityPreferences>;
}

export interface UpdateCustomerSecurityInput {
  readonly mfaEnabled?: boolean;
  readonly mfaMethod?: string;
  readonly biometricUnlockEnabled?: boolean;
  readonly loginAlertsEnabled?: boolean;
  readonly sessionTimeoutMinutes?: number;
}

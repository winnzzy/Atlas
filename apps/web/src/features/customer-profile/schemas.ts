import { z } from 'zod';
import type {
  CustomerPreferences,
  CustomerProfile,
  CustomerProfileActivity,
  CustomerSecurity,
} from '@atlas/types';

export const verificationStateSchema = z.enum(['verified', 'pending', 'under_review']);

export const profileDocumentSchema = z.object({
  id: z.string(),
  type: z.enum(['drivers_license', 'passport', 'state_id']),
  status: verificationStateSchema,
  uploadedAt: z.string(),
  expiresAt: z.string().optional(),
});

export const customerProfileSchema = z.object({
  id: z.string(),
  avatarInitials: z.string(),
  personalInformation: z.object({
    firstName: z.string(),
    lastName: z.string(),
    fullName: z.string(),
    dateOfBirth: z.string(),
    ssnLast4: z.string(),
  }),
  contactInformation: z.object({
    email: z.string().email(),
    phoneNumber: z.string(),
    emailVerified: z.boolean(),
    phoneVerified: z.boolean(),
  }),
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
  employment: z.object({
    employerName: z.string(),
    jobTitle: z.string(),
    employmentStatus: z.string(),
    annualIncomeRange: z.string(),
  }),
  taxInformation: z.object({
    taxResidencyCountry: z.string(),
    taxIdMasked: z.string(),
    w9OnFile: z.boolean(),
  }),
  preferredCurrency: z.string(),
  preferredLanguage: z.enum(['en', 'es']),
  timezone: z.string(),
  verification: z.object({
    kycStatus: z.string(),
    kycLevel: z.string(),
    overallStatus: verificationStateSchema,
    emailVerified: z.boolean(),
    phoneVerified: z.boolean(),
  }),
  documents: z.array(profileDocumentSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<CustomerProfile>;

export const customerPreferencesSchema = z.object({
  preferredCurrency: z.string(),
  preferredLanguage: z.enum(['en', 'es']),
  timezone: z.string(),
  theme: z.enum(['light', 'dark', 'system']),
  notificationPreferences: z.object({
    emailEnabled: z.boolean(),
    smsEnabled: z.boolean(),
    pushEnabled: z.boolean(),
    transactionAlerts: z.boolean(),
    securityAlerts: z.boolean(),
    marketingEmails: z.boolean(),
    loginAlerts: z.boolean(),
    balanceAlerts: z.boolean(),
    transferAlerts: z.boolean(),
  }),
  accessibility: z.object({
    reducedMotion: z.boolean(),
    highContrast: z.boolean(),
    largeText: z.boolean(),
    screenReaderOptimized: z.boolean(),
  }),
}) satisfies z.ZodType<CustomerPreferences>;

export const customerSecuritySchema = z.object({
  mfaEnabled: z.boolean(),
  mfaMethod: z.string().optional(),
  biometricUnlockEnabled: z.boolean(),
  loginAlertsEnabled: z.boolean(),
  sessionTimeoutMinutes: z.number().int(),
  lastPasswordChangedAt: z.string().optional(),
  lastLoginAt: z.string().optional(),
  connectedDevices: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      platform: z.string(),
      browser: z.string(),
      location: z.string(),
      ipAddress: z.string(),
      lastActiveAt: z.string(),
      isCurrent: z.boolean(),
      isTrusted: z.boolean(),
    }),
  ),
  activeSessions: z.array(
    z.object({
      id: z.string(),
      deviceName: z.string(),
      ipAddress: z.string(),
      startedAt: z.string(),
      expiresAt: z.string(),
      isCurrent: z.boolean(),
      status: z.enum(['active', 'expiring_soon']),
    }),
  ),
  recentEvents: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      severity: z.enum(['info', 'warning', 'critical']),
      occurredAt: z.string(),
    }),
  ),
}) satisfies z.ZodType<CustomerSecurity>;

export const customerProfileActivitySchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['login', 'security', 'profile_update', 'document', 'preference']),
      title: z.string(),
      description: z.string(),
      timestamp: z.string(),
      location: z.string().optional(),
      deviceName: z.string().optional(),
    }),
  ),
}) satisfies z.ZodType<CustomerProfileActivity>;

export const updateProfileSchema = customerProfileSchema
  .pick({
    personalInformation: true,
    contactInformation: true,
    address: true,
    employment: true,
    taxInformation: true,
  })
  .partial();

export const updatePreferencesSchema = customerPreferencesSchema.partial();

export const updateSecuritySchema = customerSecuritySchema
  .pick({
    mfaEnabled: true,
    mfaMethod: true,
    biometricUnlockEnabled: true,
    loginAlertsEnabled: true,
    sessionTimeoutMinutes: true,
  })
  .partial();

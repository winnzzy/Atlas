import type {
  AccessibilityPreferences,
  ActiveSession,
  ConnectedDevice,
  CustomerPreferences,
  CustomerProfile,
  CustomerProfileActivity,
  CustomerSecurity,
  NotificationPreferences,
  ProfileActivityItem,
  ProfileDocument,
  SecurityTimelineEvent,
} from '@atlas/types';

export const MOCK_CUSTOMER_ID = '00000000-0000-4000-8000-000000000001';

export const mockProfileDocuments: readonly ProfileDocument[] = [
  {
    id: 'doc_drivers_license',
    type: 'drivers_license',
    status: 'verified',
    uploadedAt: '2026-03-18T09:10:00.000Z',
    expiresAt: '2030-04-12',
  },
  {
    id: 'doc_w9',
    type: 'state_id',
    status: 'pending',
    uploadedAt: '2026-06-28T14:30:00.000Z',
  },
];

export const mockNotificationPreferences: NotificationPreferences = {
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: true,
  transactionAlerts: true,
  securityAlerts: true,
  marketingEmails: false,
  loginAlerts: true,
  balanceAlerts: true,
  transferAlerts: true,
};

export const mockAccessibilityPreferences: AccessibilityPreferences = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  screenReaderOptimized: true,
};

export const mockConnectedDevices: readonly ConnectedDevice[] = [
  {
    id: 'device_macbook_pro',
    name: 'Jordan Parker MacBook Pro',
    platform: 'macOS',
    browser: 'Chrome 137',
    location: 'Austin, TX',
    ipAddress: '73.211.44.102',
    lastActiveAt: '2026-07-09T12:45:00.000Z',
    isCurrent: true,
    isTrusted: true,
  },
  {
    id: 'device_iphone',
    name: 'Jordan Parker iPhone 15 Pro',
    platform: 'iOS',
    browser: 'Atlas iOS App WebView',
    location: 'Austin, TX',
    ipAddress: '107.77.201.188',
    lastActiveAt: '2026-07-09T07:20:00.000Z',
    isCurrent: false,
    isTrusted: true,
  },
];

export const mockActiveSessions: readonly ActiveSession[] = [
  {
    id: 'session_current_browser',
    deviceName: 'Jordan Parker MacBook Pro',
    ipAddress: '73.211.44.102',
    startedAt: '2026-07-09T11:52:00.000Z',
    expiresAt: '2026-07-09T20:52:00.000Z',
    isCurrent: true,
    status: 'active',
  },
  {
    id: 'session_mobile_app',
    deviceName: 'Jordan Parker iPhone 15 Pro',
    ipAddress: '107.77.201.188',
    startedAt: '2026-07-08T16:15:00.000Z',
    expiresAt: '2026-07-09T16:15:00.000Z',
    isCurrent: false,
    status: 'expiring_soon',
  },
];

export const mockSecurityEvents: readonly SecurityTimelineEvent[] = [
  {
    id: 'security_mfa_updated',
    title: 'Multi-factor settings reviewed',
    description: 'Authenticator app remains the default step-up method for high-risk actions.',
    severity: 'info',
    occurredAt: '2026-07-07T15:10:00.000Z',
  },
  {
    id: 'security_new_device',
    title: 'New trusted device added',
    description: 'A trusted iPhone session was approved from Austin, TX.',
    severity: 'warning',
    occurredAt: '2026-07-05T18:40:00.000Z',
  },
];

export const mockActivityItems: readonly ProfileActivityItem[] = [
  {
    id: 'activity_login',
    type: 'login',
    title: 'Successful sign in',
    description: 'Signed in from Chrome on macOS.',
    timestamp: '2026-07-09T12:45:00.000Z',
    location: 'Austin, TX',
    deviceName: 'Jordan Parker MacBook Pro',
  },
  {
    id: 'activity_profile',
    type: 'profile_update',
    title: 'Contact information updated',
    description: 'Preferred phone number was confirmed for transaction alerts.',
    timestamp: '2026-07-08T20:18:00.000Z',
  },
  {
    id: 'activity_document',
    type: 'document',
    title: 'Tax document uploaded',
    description: 'A W-9 replacement was submitted for review.',
    timestamp: '2026-06-28T14:30:00.000Z',
  },
  {
    id: 'activity_preference',
    type: 'preference',
    title: 'Notification preferences changed',
    description: 'Security alerts remain enabled across email and push.',
    timestamp: '2026-06-12T09:05:00.000Z',
  },
];

export const mockCustomerProfile: CustomerProfile = {
  id: MOCK_CUSTOMER_ID,
  avatarInitials: 'JP',
  personalInformation: {
    firstName: 'Jordan',
    lastName: 'Parker',
    fullName: 'Jordan Parker',
    dateOfBirth: '1988-04-12',
    ssnLast4: '4821',
  },
  contactInformation: {
    email: 'jordan.parker@atlasbank.com',
    phoneNumber: '+1 512-555-0142',
    emailVerified: true,
    phoneVerified: true,
  },
  address: {
    line1: '1201 West 6th Street',
    line2: 'Unit 410',
    city: 'Austin',
    state: 'TX',
    postalCode: '78703',
    country: 'US',
  },
  employment: {
    employerName: 'Northwind Health Systems',
    jobTitle: 'Director of Clinical Operations',
    employmentStatus: 'Full-time',
    annualIncomeRange: '$200,000 - $249,999',
  },
  taxInformation: {
    taxResidencyCountry: 'US',
    taxIdMasked: '***-**-4821',
    w9OnFile: true,
  },
  preferredCurrency: 'USD',
  preferredLanguage: 'en',
  timezone: 'America/Chicago',
  verification: {
    kycStatus: 'APPROVED',
    kycLevel: 'LEVEL_2',
    overallStatus: 'verified',
    emailVerified: true,
    phoneVerified: true,
  },
  documents: mockProfileDocuments,
  createdAt: '2024-11-08T15:22:00.000Z',
  updatedAt: '2026-07-09T12:45:00.000Z',
};

export const mockCustomerPreferences: CustomerPreferences = {
  preferredCurrency: 'USD',
  preferredLanguage: 'en',
  timezone: 'America/Chicago',
  theme: 'system',
  notificationPreferences: mockNotificationPreferences,
  accessibility: mockAccessibilityPreferences,
};

export const mockCustomerSecurity: CustomerSecurity = {
  mfaEnabled: true,
  mfaMethod: 'authenticator_app',
  biometricUnlockEnabled: false,
  loginAlertsEnabled: true,
  sessionTimeoutMinutes: 30,
  lastPasswordChangedAt: '2026-05-14T10:00:00.000Z',
  lastLoginAt: '2026-07-09T12:45:00.000Z',
  connectedDevices: mockConnectedDevices,
  activeSessions: mockActiveSessions,
  recentEvents: mockSecurityEvents,
};

export const mockCustomerActivity: CustomerProfileActivity = {
  items: mockActivityItems,
};

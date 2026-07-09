import React from 'react';
import {
  ActivityFeed,
  DeviceCard,
  EditableProfileCard,
  PreferenceCard,
  ProfileAvatar,
  ProgressBar,
  SecurityTimeline,
  SessionCard,
  SettingsGroup,
  VerificationBadge,
} from '@atlas/banking-ui';
import type { ActivityItem } from '@atlas/banking-ui';
import type {
  CustomerPreferences,
  CustomerProfile,
  CustomerProfileActivity,
  CustomerSecurity,
} from '@atlas/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  Separator,
} from '@atlas/ui';
import {
  Accessibility,
  FileBadge2,
  Globe2,
  Languages,
  MoonStar,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function DetailGrid({
  items,
}: {
  readonly items: ReadonlyArray<{ readonly label: string; readonly value: string }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            {item.label}
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function ProfileOverviewView({
  profile,
  security,
}: {
  readonly profile: CustomerProfile;
  readonly security: CustomerSecurity;
}) {
  const verificationProgress =
    profile.documents.length === 0
      ? 0
      : Math.round(
          (profile.documents.filter((document) => document.status === 'verified').length /
            profile.documents.length) *
            100,
        );

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Customer Profile"
        description="Identity, contact, compliance, and account standing for the mock authenticated customer."
        actions={
          <Button variant="outline" disabled>
            Audit Trail Placeholder
          </Button>
        }
      />
      <Card variant="elevated" className="overflow-hidden bg-[var(--color-bg-primary)]">
        <div
          className="h-2 bg-[linear-gradient(90deg,var(--color-primary-600),#0ea5e9)]"
          aria-hidden="true"
        />
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
          <div className="flex items-center gap-4">
            <ProfileAvatar
              name={profile.personalInformation.fullName}
              initials={profile.avatarInitials}
              status={profile.verification.overallStatus}
              size="lg"
            />
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                  {profile.personalInformation.fullName}
                </h1>
                <VerificationBadge status={profile.verification.overallStatus} />
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Customer since {formatDate(profile.createdAt)} • Last login{' '}
                {security.lastLoginAt ? formatDateTime(security.lastLoginAt) : 'Unavailable'}
              </p>
            </div>
          </div>
          <div className="w-full max-w-sm space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Verification progress</span>
              <span className="font-medium text-[var(--color-text-primary)]">
                {verificationProgress}%
              </span>
            </div>
            <ProgressBar value={verificationProgress} showPercentage color="success" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <SettingsGroup
            title="Personal and Contact Information"
            description="Primary identity and communication fields stored for banking operations."
          >
            <EditableProfileCard
              title="Personal Information"
              description="Core identity details used for account servicing and compliance review."
            >
              <DetailGrid
                items={[
                  { label: 'First Name', value: profile.personalInformation.firstName },
                  { label: 'Last Name', value: profile.personalInformation.lastName },
                  { label: 'Date of Birth', value: profile.personalInformation.dateOfBirth },
                  { label: 'SSN Last 4', value: profile.personalInformation.ssnLast4 },
                  { label: 'Email', value: profile.contactInformation.email },
                  { label: 'Phone', value: profile.contactInformation.phoneNumber },
                ]}
              />
            </EditableProfileCard>
            <EditableProfileCard
              title="Address"
              description="Residential mailing address currently associated with the customer account."
            >
              <DetailGrid
                items={[
                  { label: 'Street', value: profile.address.line1 },
                  { label: 'Unit', value: profile.address.line2 ?? 'Not provided' },
                  { label: 'City', value: profile.address.city },
                  { label: 'State', value: profile.address.state },
                  { label: 'Postal Code', value: profile.address.postalCode },
                  { label: 'Country', value: profile.address.country },
                ]}
              />
            </EditableProfileCard>
            <EditableProfileCard
              title="Employment and Tax Information"
              description="Financial profile data used for underwriting, compliance, and servicing."
            >
              <DetailGrid
                items={[
                  { label: 'Employer', value: profile.employment.employerName },
                  { label: 'Job Title', value: profile.employment.jobTitle },
                  { label: 'Employment Status', value: profile.employment.employmentStatus },
                  { label: 'Income Range', value: profile.employment.annualIncomeRange },
                  { label: 'Tax Residency', value: profile.taxInformation.taxResidencyCountry },
                  { label: 'Tax ID', value: profile.taxInformation.taxIdMasked },
                ]}
              />
            </EditableProfileCard>
          </SettingsGroup>
        </div>
        <div className="space-y-6">
          <Card variant="elevated" className="bg-[var(--color-bg-primary)]">
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription>Current KYC standing and verification indicators.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm">
                <span className="text-[var(--color-text-secondary)]">KYC Status</span>
                <Badge variant="success">{profile.verification.kycStatus}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm">
                <span className="text-[var(--color-text-secondary)]">KYC Level</span>
                <span className="font-medium text-[var(--color-text-primary)]">
                  {profile.verification.kycLevel}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm">
                <span className="text-[var(--color-text-secondary)]">Email Verification</span>
                <Badge variant={profile.verification.emailVerified ? 'success' : 'warning'}>
                  {profile.verification.emailVerified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm">
                <span className="text-[var(--color-text-secondary)]">Phone Verification</span>
                <Badge variant={profile.verification.phoneVerified ? 'success' : 'warning'}>
                  {profile.verification.phoneVerified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card variant="elevated" className="bg-[var(--color-bg-primary)]">
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Uploaded identity and tax verification records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.documents.map((document) => (
                <div
                  key={document.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium capitalize text-[var(--color-text-primary)]">
                        {document.type.replace(/_/g, ' ')}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                        Uploaded {formatDate(document.uploadedAt)}
                      </p>
                    </div>
                    <VerificationBadge status={document.status} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function ProfilePreferencesView({
  preferences,
}: {
  readonly preferences: CustomerPreferences;
}) {
  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Preferences"
        description="Language, currency, notifications, theme, and accessibility settings for the customer profile."
      />
      <SettingsGroup
        title="Profile Preferences"
        description="Foundational preferences that shape the Atlas experience across the platform."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <PreferenceCard
            title="Preferred Currency"
            description="Default currency used throughout balances and statements."
            value={preferences.preferredCurrency}
            icon={<WalletCards className="h-4 w-4" />}
          />
          <PreferenceCard
            title="Preferred Language"
            description="Primary interface language for customer-facing content."
            value={preferences.preferredLanguage.toUpperCase()}
            icon={<Languages className="h-4 w-4" />}
          />
          <PreferenceCard
            title="Timezone"
            description="Used for timestamps, activity logs, and statement generation."
            value={preferences.timezone}
            icon={<Globe2 className="h-4 w-4" />}
          />
          <PreferenceCard
            title="Theme"
            description="Current application theme preference."
            value={preferences.theme}
            icon={<MoonStar className="h-4 w-4" />}
          />
          <PreferenceCard
            title="Accessibility"
            description="Screen reader optimization and visual preferences."
            value={
              preferences.accessibility.screenReaderOptimized
                ? 'Screen Reader Optimized'
                : 'Standard'
            }
            icon={<Accessibility className="h-4 w-4" />}
          />
          <PreferenceCard
            title="Security Alerts"
            description="Critical sign-in and fraud-related customer alerts."
            value={preferences.notificationPreferences.securityAlerts ? 'Enabled' : 'Disabled'}
            icon={<ShieldCheck className="h-4 w-4" />}
          />
        </div>
      </SettingsGroup>
      <div className="grid gap-6 xl:grid-cols-2">
        <EditableProfileCard
          title="Notification Preferences"
          description="Delivery channels and alert categories relevant to banking operations."
        >
          <DetailGrid
            items={[
              {
                label: 'Email',
                value: preferences.notificationPreferences.emailEnabled ? 'Enabled' : 'Disabled',
              },
              {
                label: 'SMS',
                value: preferences.notificationPreferences.smsEnabled ? 'Enabled' : 'Disabled',
              },
              {
                label: 'Push',
                value: preferences.notificationPreferences.pushEnabled ? 'Enabled' : 'Disabled',
              },
              {
                label: 'Transaction Alerts',
                value: preferences.notificationPreferences.transactionAlerts
                  ? 'Enabled'
                  : 'Disabled',
              },
              {
                label: 'Login Alerts',
                value: preferences.notificationPreferences.loginAlerts ? 'Enabled' : 'Disabled',
              },
              {
                label: 'Marketing Emails',
                value: preferences.notificationPreferences.marketingEmails ? 'Enabled' : 'Disabled',
              },
            ]}
          />
        </EditableProfileCard>
        <EditableProfileCard
          title="Accessibility"
          description="Display and assistive preferences prepared for future persisted editing."
        >
          <DetailGrid
            items={[
              {
                label: 'Reduced Motion',
                value: preferences.accessibility.reducedMotion ? 'Enabled' : 'Disabled',
              },
              {
                label: 'High Contrast',
                value: preferences.accessibility.highContrast ? 'Enabled' : 'Disabled',
              },
              {
                label: 'Large Text',
                value: preferences.accessibility.largeText ? 'Enabled' : 'Disabled',
              },
              {
                label: 'Screen Reader Optimized',
                value: preferences.accessibility.screenReaderOptimized ? 'Enabled' : 'Disabled',
              },
            ]}
          />
        </EditableProfileCard>
      </div>
    </div>
  );
}

export function ProfileSecurityView({ security }: { readonly security: CustomerSecurity }) {
  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Security"
        description="Security settings, connected devices, session visibility, and recent security events."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,1fr)]">
        <div className="space-y-6">
          <EditableProfileCard
            title="Security Settings"
            description="Current controls for session hardening and customer protection."
          >
            <DetailGrid
              items={[
                {
                  label: 'MFA',
                  value: security.mfaEnabled
                    ? `Enabled • ${security.mfaMethod ?? 'Configured'}`
                    : 'Disabled',
                },
                {
                  label: 'Biometric Unlock',
                  value: security.biometricUnlockEnabled ? 'Enabled' : 'Disabled',
                },
                {
                  label: 'Login Alerts',
                  value: security.loginAlertsEnabled ? 'Enabled' : 'Disabled',
                },
                { label: 'Session Timeout', value: `${security.sessionTimeoutMinutes} minutes` },
                {
                  label: 'Last Password Change',
                  value: security.lastPasswordChangedAt
                    ? formatDate(security.lastPasswordChangedAt)
                    : 'Unavailable',
                },
                {
                  label: 'Last Login',
                  value: security.lastLoginAt
                    ? formatDateTime(security.lastLoginAt)
                    : 'Unavailable',
                },
              ]}
            />
          </EditableProfileCard>
          <SettingsGroup
            title="Connected Devices"
            description="Device inventory associated with recent sessions for the mock authenticated customer."
          >
            <div className="grid gap-4">
              {security.connectedDevices.map((device) => (
                <DeviceCard key={device.id} device={device} />
              ))}
            </div>
          </SettingsGroup>
          <SettingsGroup
            title="Sessions"
            description="Current and recently active customer sessions with expiry visibility."
          >
            <div className="grid gap-4">
              {security.activeSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </SettingsGroup>
        </div>
        <Card variant="elevated" className="bg-[var(--color-bg-primary)]">
          <CardHeader>
            <CardTitle>Security Timeline</CardTitle>
            <CardDescription>
              Recent security-sensitive activity and device posture changes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SecurityTimeline events={security.recentEvents} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function mapProfileActivityToBankingActivity(
  items: readonly CustomerProfileActivity['items'][number][],
): ActivityItem[] {
  return items.map((item) => ({
    id: item.id,
    action:
      item.type === 'login'
        ? 'login'
        : item.type === 'security'
          ? 'settings_changed'
          : item.type === 'document'
            ? 'kyc_verified'
            : item.type === 'preference'
              ? 'settings_changed'
              : 'settings_changed',
    description: item.description,
    timestamp: item.timestamp,
  }));
}

export function ProfileActivityView({
  activity,
  profile,
}: {
  readonly activity: CustomerProfileActivity;
  readonly profile: CustomerProfile;
}) {
  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Activity"
        description="Recent profile, security, and document-related events for the customer account."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <Card variant="elevated" className="bg-[var(--color-bg-primary)]">
          <CardHeader>
            <CardTitle>Recent Activity Feed</CardTitle>
            <CardDescription>
              Normalized account activity prepared for backend-driven timeline data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityFeed
              items={mapProfileActivityToBankingActivity(activity.items)}
              maxItems={12}
            />
          </CardContent>
        </Card>
        <Card variant="elevated" className="bg-[var(--color-bg-primary)]">
          <CardHeader>
            <CardTitle>Profile Snapshot</CardTitle>
            <CardDescription>
              Quick context while reviewing recent customer activity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <ProfileAvatar
                name={profile.personalInformation.fullName}
                initials={profile.avatarInitials}
                status={profile.verification.overallStatus}
                size="md"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {profile.personalInformation.fullName}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {profile.contactInformation.email}
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              {activity.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                        {item.description}
                      </p>
                    </div>
                    <FileBadge2 className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </div>
                  <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                    {formatDateTime(item.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

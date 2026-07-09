import type { Meta, StoryObj } from '@storybook/react';
import { Lock, Palette, Shield } from 'lucide-react';
import { DeviceCard } from './device-card';
import { EditableProfileCard } from './editable-profile-card';
import { PreferenceCard } from './preference-card';
import { ProfileAvatar } from './profile-avatar';
import { SecurityTimeline } from './security-timeline';
import { SessionCard } from './session-card';
import { SettingsGroup } from './settings-group';
import { VerificationBadge } from './verification-badge';

const meta: Meta = {
  title: 'Banking/Profile Components',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const mockSecurityEvent = {
  id: 'security_review',
  title: 'Authenticator app remains enabled',
  description: 'Your account still requires an authenticator code for sensitive changes.',
  severity: 'info' as const,
  occurredAt: '2026-07-09T12:30:00.000Z',
};

const mockDevice = {
  id: 'device_macbook',
  name: 'Jordan Parker MacBook Pro',
  platform: 'macOS',
  browser: 'Chrome 137',
  location: 'Austin, TX',
  ipAddress: '73.211.44.102',
  lastActiveAt: '2026-07-09T12:45:00.000Z',
  isCurrent: true,
  isTrusted: true,
};

const mockSession = {
  id: 'session_browser',
  deviceName: 'Jordan Parker MacBook Pro',
  ipAddress: '73.211.44.102',
  startedAt: '2026-07-09T11:52:00.000Z',
  expiresAt: '2026-07-09T20:52:00.000Z',
  isCurrent: true,
  status: 'active' as const,
};

export const Overview: Story = {
  render: () => (
    <div className="space-y-6 bg-slate-50 p-6">
      <div className="flex items-center gap-4">
        <ProfileAvatar name="Jordan Parker" initials="JP" status="verified" size="lg" />
        <VerificationBadge status="verified" />
      </div>
      <EditableProfileCard
        title="Personal Information"
        description="Production-ready card surface for editable customer data."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
            <p className="mt-1 text-sm font-medium text-foreground">jordan.parker@atlasbank.com</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
            <p className="mt-1 text-sm font-medium text-foreground">+1 512-555-0142</p>
          </div>
        </div>
      </EditableProfileCard>
      <SettingsGroup
        title="Preferences"
        description="Compact preference summaries for customer settings."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <PreferenceCard
            title="Theme"
            description="Current visual theme"
            value="System"
            icon={<Palette className="h-4 w-4" />}
          />
          <PreferenceCard
            title="Security Alerts"
            description="Critical alert delivery"
            value="Email + Push"
            icon={<Shield className="h-4 w-4" />}
          />
          <PreferenceCard
            title="Session Timeout"
            description="Automatic session expiration"
            value="30 minutes"
            icon={<Lock className="h-4 w-4" />}
          />
        </div>
      </SettingsGroup>
      <div className="grid gap-4 lg:grid-cols-2">
        <DeviceCard device={mockDevice} />
        <SessionCard session={mockSession} />
      </div>
      <SecurityTimeline events={[mockSecurityEvent]} />
    </div>
  ),
};

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@atlas/ui';
import { Settings, Shield, Bell, Globe, Database, Palette } from 'lucide-react';

const settingsSections = [
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Security Settings',
    description: '2FA enforcement, session management, IP allowlists',
    href: '#',
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: 'Notification Settings',
    description: 'Email templates, SMS configuration, push notification settings',
    href: '#',
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: 'Platform Settings',
    description: 'Supported currencies, regions, compliance rules',
    href: '#',
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: 'System Configuration',
    description: 'API rate limits, cache settings, maintenance mode',
    href: '#',
  },
  {
    icon: <Palette className="h-5 w-5" />,
    title: 'Branding',
    description: 'Logo, colors, email templates, white-label settings',
    href: '#',
  },
  {
    icon: <Settings className="h-5 w-5" />,
    title: 'Integrations',
    description: 'Third-party services, payment processors, KYC providers',
    href: '#',
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Platform configuration and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => (
          <button
            key={section.title}
            type="button"
            className="flex items-start gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left transition-all hover:border-[var(--color-primary)] hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              {section.icon}
            </div>
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">{section.title}</p>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                {section.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-[var(--color-border)] p-4">
              <p className="text-xs text-[var(--color-text-tertiary)]">Version</p>
              <p className="mt-1 font-mono text-sm font-medium text-[var(--color-text-primary)]">
                1.0.0-beta.1
              </p>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] p-4">
              <p className="text-xs text-[var(--color-text-tertiary)]">Environment</p>
              <p className="mt-1 font-mono text-sm font-medium text-[var(--color-text-primary)]">
                Production
              </p>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] p-4">
              <p className="text-xs text-[var(--color-text-tertiary)]">Last Deploy</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                Jul 9, 2026 08:30 AM
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

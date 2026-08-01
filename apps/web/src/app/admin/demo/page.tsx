'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@atlas/ui';
import { StatCard } from '@atlas/banking-ui';
import { Users, DollarSign, Activity, Layers } from 'lucide-react';

export default function DemoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Component Demo
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Preview of Atlas UI components and design system
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Stat Cards</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Balance"
            value="$1,284,500"
            trend="up"
            trendValue="12.4%"
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title="Active Users"
            value="8,420"
            trend="up"
            trendValue="5.2%"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Transactions"
            value="24,567"
            trend="up"
            trendValue="8.1%"
            icon={<Activity className="h-5 w-5" />}
          />
          <StatCard title="Products" value="6" icon={<Layers className="h-5 w-5" />} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Badges</h2>
        <Card>
          <CardContent className="flex flex-wrap gap-2 py-4">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              Active
            </Badge>
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
              Suspended
            </Badge>
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              Pending
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              Info
            </Badge>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Cards</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)]">
                <p className="text-sm text-[var(--color-text-tertiary)]">Chart placeholder</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)]">
                <p className="text-sm text-[var(--color-text-tertiary)]">Chart placeholder</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Color Tokens</h2>
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Primary', token: '--color-primary' },
                { label: 'Success', token: '--color-success' },
                { label: 'Error', token: '--color-error' },
                { label: 'Warning', token: '--color-warning' },
              ].map((c) => (
                <div key={c.token} className="space-y-2">
                  <div className="h-12 rounded-lg" style={{ backgroundColor: `var(${c.token})` }} />
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">{c.label}</p>
                  <p className="font-mono text-xs text-[var(--color-text-tertiary)]">{c.token}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

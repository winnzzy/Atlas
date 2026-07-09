'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@atlas/ui';
import { Avatar } from '@atlas/ui';
import { AmountDisplay } from '@atlas/banking-ui';
import {
  ArrowLeft,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  mockCustomers,
  mockAccounts,
  mockTransactions,
  mockActivityLog,
  mockAlerts,
} from '@/features/admin/fixtures';

const statusColor: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  frozen: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const kycColor: Record<string, string> = {
  verified: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  incomplete: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

type Tab = 'overview' | 'accounts' | 'transactions' | 'activity' | 'alerts' | 'support';

const tabs: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'activity', label: 'Activity Log' },
  { id: 'alerts', label: 'Alerts & Flags' },
  { id: 'support', label: 'Support Tickets' },
];

export default function CustomerDetailPage() {
  const pathname = usePathname();
  const customerId = pathname.split('/').pop() ?? '';
  const [activeTab, setActiveTab] = React.useState<Tab>('overview');

  const customer = mockCustomers.find((c) => c.id === customerId);
  if (!customer)
    return (
      <div className="p-8 text-center text-[var(--color-text-secondary)]">Customer not found.</div>
    );
  const accounts = mockAccounts;
  const transactions = mockTransactions;
  const activity = mockActivityLog;
  const alerts = mockAlerts;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Back */}
      <div className="flex items-center gap-3">
        <Link href="/admin/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Customers
          </Button>
        </Link>
      </div>

      {/* Customer Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar fallback={`${customer.firstName[0]}${customer.lastName[0]}`} size="lg" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {customer.firstName} {customer.lastName}
                </h1>
                <Badge className={statusColor[customer.status]}>{customer.status}</Badge>
                <Badge className={kycColor[customer.kycStatus]}>KYC: {customer.kycStatus}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--color-text-secondary)]">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {customer.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {customer.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {customer.city}, {customer.state}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(customer.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {customer.status === 'active' ? (
                <Button variant="outline" size="sm">
                  <Ban className="h-4 w-4 mr-1" />
                  Suspend
                </Button>
              ) : (
                <Button variant="outline" size="sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Reactivate
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-1" />
                KYC Review
              </Button>
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-1" />
                Audit Trail
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-[var(--color-border)]">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-[var(--color-text-secondary)]">Total Balance</p>
                <AmountDisplay money={{ amount: customer.totalBalance, currency: 'USD' }} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-[var(--color-text-secondary)]">Accounts</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {customer.accountCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-[var(--color-text-secondary)]">Last Active</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {new Date(customer.lastActiveAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-[var(--color-text-secondary)]">Risk Level</p>
                <Badge
                  className={
                    customer.riskLevel === 'critical'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : customer.riskLevel === 'high'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        : customer.riskLevel === 'medium'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                  }
                >
                  {customer.riskLevel}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Accounts Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Linked Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accounts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4"
                  >
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)]">
                        {a.type.charAt(0).toUpperCase() + a.type.slice(1)} &middot;{' '}
                        {a.accountNumber}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Opened {new Date(a.openedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <AmountDisplay money={{ amount: a.balance, currency: 'USD' }} />
                      <Badge className={statusColor[a.status]}>{a.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {t.description}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {new Date(t.createdAt).toLocaleDateString()} &middot; {t.counterparty}
                      </p>
                    </div>
                    <div className="text-right">
                      <AmountDisplay
                        money={{ amount: t.amount, currency: 'USD' }}
                        size="sm"
                        showSign
                        colorize
                      />
                      <Badge className={statusColor[t.status]}>{t.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          {alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Alerts & Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((a) => (
                    <div
                      key={a.id}
                      className={`rounded-lg border p-4 ${a.severity === 'critical' ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950' : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950'}`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-[var(--color-text-primary)]">{a.title}</p>
                        <Badge className={statusColor[a.status]}>{a.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {a.description}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                        Created {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="space-y-4">
          {accounts.map((a) => (
            <Card key={a.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                      {a.type.charAt(0).toUpperCase() + a.type.slice(1)} Account
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {a.accountNumber} &middot; Routing: {a.routingNumber}
                    </p>
                  </div>
                  <Badge className={statusColor[a.status]}>{a.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-sm text-[var(--color-text-secondary)]">Balance</p>
                    <AmountDisplay money={{ amount: a.balance, currency: 'USD' }} />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-text-secondary)]">Available</p>
                    <AmountDisplay money={{ amount: a.availableBalance, currency: 'USD' }} />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-text-secondary)]">Opened</p>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {new Date(a.openedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-text-secondary)]">Last Txn</p>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {new Date(a.lastTransactionAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'transactions' && (
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                      Date
                    </th>
                    <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                      Type
                    </th>
                    <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                      Description
                    </th>
                    <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                      Counterparty
                    </th>
                    <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                      Status
                    </th>
                    <th className="pb-3 text-right font-medium text-[var(--color-text-secondary)]">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-3 text-[var(--color-text-secondary)]">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <Badge variant="outline">{t.type}</Badge>
                      </td>
                      <td className="py-3 text-[var(--color-text-primary)]">{t.description}</td>
                      <td className="py-3 text-[var(--color-text-secondary)]">{t.counterparty}</td>
                      <td className="py-3">
                        <Badge className={statusColor[t.status]}>{t.status}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <AmountDisplay
                          money={{ amount: t.amount, currency: 'USD' }}
                          size="sm"
                          showSign
                          colorize
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-4 border-b border-[var(--color-border)] pb-4 last:border-0"
                >
                  <div className="mt-1 h-2 w-2 rounded-full bg-[var(--color-brand)]" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {a.action}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">{a.description}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                      {new Date(a.timestamp).toLocaleString()} &middot; {a.ipAddress} &middot;{' '}
                      {a.device}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-[var(--color-text-tertiary)]">
                No alerts for this customer.
              </CardContent>
            </Card>
          ) : (
            alerts.map((a) => (
              <Card key={a.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-[var(--color-text-primary)]">{a.title}</h3>
                    <div className="flex gap-2">
                      <Badge
                        className={
                          a.severity === 'critical'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                        }
                      >
                        {a.severity}
                      </Badge>
                      <Badge className={statusColor[a.status]}>{a.status}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">{a.description}</p>
                  <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                    Created {new Date(a.createdAt).toLocaleString()}{' '}
                    {a.resolvedAt
                      ? `&middot; Resolved ${new Date(a.resolvedAt).toLocaleString()}`
                      : ''}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'support' && (
        <Card>
          <CardContent className="pt-6 text-center text-[var(--color-text-tertiary)]">
            <p className="text-lg">No support tickets found.</p>
            <p className="mt-1 text-sm">Support ticket data will be available in Phase 3.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

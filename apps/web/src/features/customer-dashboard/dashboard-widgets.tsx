import React, { memo } from 'react';
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CreditCard,
  Landmark,
  Wallet,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Separator,
  PageHeader,
  cn,
} from '@atlas/ui';
import {
  formatCurrency,
  formatDateTime,
  formatLongDate,
  formatPercent,
  formatSignedCurrency,
  formatShortDate,
} from './formatters';
import type {
  AccountSnapshot,
  CardSummary,
  CryptoActivity,
  CustomerProfile,
  InvestmentSummary,
  LoanSummary,
  QuickAction,
  StatisticSnapshot,
} from './types';

function getTrendClassName(trend: StatisticSnapshot['trend']): string {
  if (trend === 'up') return 'text-[var(--color-success-700)]';
  if (trend === 'down') return 'text-[var(--color-danger-700)]';
  return 'text-[var(--color-text-secondary)]';
}

function getToneBadgeVariant(tone: StatisticSnapshot['tone']) {
  if (tone === 'crypto') return 'crypto';
  if (tone === 'investment') return 'investment';
  return 'secondary';
}

export interface WelcomeHeaderProps {
  readonly profile: CustomerProfile;
  readonly currentDate: Date;
}

export function WelcomeHeader({ profile, currentDate }: WelcomeHeaderProps) {
  return (
    <Card
      variant="elevated"
      className="overflow-hidden border-white/60 bg-[var(--color-bg-primary)]"
    >
      <div
        className="bg-[linear-gradient(135deg,var(--color-primary-600),var(--color-primary-700))] px-6 py-1.5"
        aria-hidden="true"
      />
      <CardContent className="space-y-5 p-6 lg:p-8">
        <PageHeader
          className="mb-0"
          title={`Welcome back, ${profile.firstName}`}
          description={`${formatLongDate(currentDate)} • Last login ${formatDateTime(profile.lastLoginAt)}`}
          actions={
            <div className="flex flex-wrap gap-2" aria-label="Primary dashboard actions">
              <Button size="sm" leftIcon={<ArrowRightLeft />} aria-label="Start a transfer">
                Transfer
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowDownLeft />}
                aria-label="Start a deposit"
              >
                Deposit
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowUpRight />}
                aria-label="Start a withdrawal"
              >
                Withdraw
              </Button>
            </div>
          }
        />
        <div className="grid gap-3 md:grid-cols-3" aria-label="Customer details">
          <MetricPill label="Customer" value={profile.fullName} />
          <MetricPill label="Segment" value={profile.segment} />
          <MetricPill label="Current Date" value={formatLongDate(currentDate)} />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricPill({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

export interface FinancialOverviewProps {
  readonly statistics: readonly StatisticSnapshot[];
}

export const FinancialOverview = memo(function FinancialOverview({
  statistics,
}: FinancialOverviewProps) {
  return (
    <section aria-labelledby="financial-overview-title" className="space-y-4">
      <div>
        <h2
          id="financial-overview-title"
          className="text-lg font-semibold text-[var(--color-text-primary)]"
        >
          Financial Overview
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          A real-time snapshot of cash, crypto, and household net worth.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statistics.map((statistic) => (
          <Card
            key={statistic.label}
            variant="elevated"
            className="border-white/50 bg-[var(--color-bg-primary)]"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardDescription>{statistic.label}</CardDescription>
                  <CardTitle className="mt-2 text-2xl">{formatCurrency(statistic.value)}</CardTitle>
                </div>
                <Badge variant={getToneBadgeVariant(statistic.tone)}>
                  {statistic.tone ?? 'cash'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className={cn('text-sm font-medium', getTrendClassName(statistic.trend))}>
                {statistic.deltaLabel}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
});

export interface QuickActionsWidgetProps {
  readonly actions: readonly QuickAction[];
}

const quickActionIcons = {
  transfer: ArrowRightLeft,
  deposit: ArrowDownLeft,
  withdraw: ArrowUpRight,
  statements: Landmark,
  cards: CreditCard,
  crypto: Wallet,
} as const;

export const QuickActionsWidget = memo(function QuickActionsWidget({
  actions,
}: QuickActionsWidgetProps) {
  return (
    <section aria-labelledby="quick-actions-title">
      <Card variant="elevated" className="h-full bg-[var(--color-bg-primary)]">
        <CardHeader>
          <CardTitle id="quick-actions-title">Quick Actions</CardTitle>
          <CardDescription>Most-used workflows for day-to-day banking operations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {actions.map((action) => {
              const Icon =
                quickActionIcons[action.id as keyof typeof quickActionIcons] ?? ArrowRightLeft;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto min-h-24 flex-col items-start justify-start gap-2 px-4 py-4 text-left"
                  aria-label={`${action.label}. ${action.description}`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icon />
                    {action.label}
                  </span>
                  <span className="whitespace-normal text-xs font-normal text-[var(--color-text-secondary)]">
                    {action.description}
                  </span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
});

export interface AccountsSummaryWidgetProps {
  readonly accounts: readonly AccountSnapshot[];
}

export const AccountsSummaryWidget = memo(function AccountsSummaryWidget({
  accounts,
}: AccountsSummaryWidgetProps) {
  return (
    <section aria-labelledby="accounts-summary-title">
      <Card variant="elevated" className="bg-[var(--color-bg-primary)]">
        <CardHeader>
          <CardTitle id="accounts-summary-title">Account Routing Details</CardTitle>
          <CardDescription>
            Realistic US payment rails for checking, savings, and crypto custody.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.map((account, index) => (
            <React.Fragment key={account.id}>
              {index > 0 ? <Separator /> : null}
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))]">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {account.name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {account.accountMask}
                  </p>
                </div>
                <MetadataCell label="Routing" value={account.routingNumber} />
                <MetadataCell label="ACH" value={account.achNumber} />
                <MetadataCell label="Wire" value={account.wireNumber} />
                <MetadataCell label="SWIFT" value={account.swiftCode ?? 'Not applicable'} />
              </div>
            </React.Fragment>
          ))}
        </CardContent>
      </Card>
    </section>
  );
});

function MetadataCell({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

export interface RecentCryptoWidgetProps {
  readonly activities: readonly CryptoActivity[];
}

export const RecentCryptoWidget = memo(function RecentCryptoWidget({
  activities,
}: RecentCryptoWidgetProps) {
  return (
    <section aria-labelledby="recent-crypto-title">
      <Card variant="elevated" className="bg-[var(--color-bg-primary)]">
        <CardHeader>
          <CardTitle id="recent-crypto-title">Recent Crypto</CardTitle>
          <CardDescription>Latest custody movements and settlement states.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">Recent crypto activity</caption>
              <thead>
                <tr className="border-b border-[var(--color-border-default)] text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                  <th className="px-0 py-3 font-medium">Asset</th>
                  <th className="px-3 py-3 font-medium">Network</th>
                  <th className="px-3 py-3 font-medium">Amount</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="border-b border-[var(--color-border-subtle)] last:border-b-0"
                  >
                    <td className="px-0 py-3 font-semibold text-[var(--color-text-primary)]">
                      {activity.asset}
                    </td>
                    <td className="px-3 py-3 text-[var(--color-text-secondary)]">
                      {activity.network}
                    </td>
                    <td className="px-3 py-3 text-[var(--color-text-primary)]">
                      {activity.amountLabel}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={activity.asset === 'BTC' ? 'crypto' : 'secondary'}>
                        {activity.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-[var(--color-text-secondary)]">
                      {formatDateTime(activity.time)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
});

export interface CardsSummaryWidgetProps {
  readonly cards: readonly CardSummary[];
}

export const CardsSummaryWidget = memo(function CardsSummaryWidget({
  cards,
}: CardsSummaryWidgetProps) {
  return (
    <section aria-labelledby="cards-summary-title">
      <Card variant="elevated" className="bg-[var(--color-bg-primary)]">
        <CardHeader>
          <CardTitle id="cards-summary-title">Cards Summary</CardTitle>
          <CardDescription>
            Current status, freeze controls, and revolving credit availability.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {card.label}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {card.maskedNumber}
                  </p>
                </div>
                <Badge variant={card.isFrozen ? 'warning' : 'success'}>
                  {card.isFrozen ? 'Frozen' : card.status}
                </Badge>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">Available Credit</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {formatCurrency(card.availableCredit)}
                  </span>
                </div>
                <Progress value={(card.availableCredit / card.creditLimit) * 100} />
                <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                  <span>{card.cardholder}</span>
                  <span>Limit {formatCurrency(card.creditLimit)}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
});

export interface InvestmentSummaryWidgetProps {
  readonly investment: InvestmentSummary;
}

export function InvestmentSummaryWidget({ investment }: InvestmentSummaryWidgetProps) {
  return (
    <section aria-labelledby="investment-summary-title">
      <Card variant="elevated" className="bg-[var(--color-bg-primary)]">
        <CardHeader>
          <CardTitle id="investment-summary-title">Investment Summary</CardTitle>
          <CardDescription>
            Portfolio value, daily performance, and lifetime return.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SummaryRow label="Portfolio Value" value={formatCurrency(investment.portfolioValue)} />
          <SummaryRow
            label="Daily Change"
            value={formatSignedCurrency(investment.dailyChange)}
            positive={investment.dailyChange >= 0}
          />
          <SummaryRow
            label="Total Return"
            value={formatSignedCurrency(investment.totalReturn)}
            positive={investment.totalReturn >= 0}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Allocation Progress</span>
              <span className="font-semibold text-[var(--color-text-primary)]">
                {formatPercent(investment.allocationProgress)}
              </span>
            </div>
            <Progress value={investment.allocationProgress} variant="success" />
            <p className="text-xs text-[var(--color-text-secondary)]">
              Top holding: {investment.topHolding}
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export interface LoanSummaryWidgetProps {
  readonly loan: LoanSummary;
}

export function LoanSummaryWidget({ loan }: LoanSummaryWidgetProps) {
  return (
    <section aria-labelledby="loan-summary-title">
      <Card variant="elevated" className="bg-[var(--color-bg-primary)]">
        <CardHeader>
          <CardTitle id="loan-summary-title">Loan Summary</CardTitle>
          <CardDescription>Outstanding debt and the next scheduled payment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SummaryRow label="Outstanding Balance" value={formatCurrency(loan.outstandingBalance)} />
          <SummaryRow
            label="Next Payment"
            value={`${formatCurrency(loan.nextPaymentAmount)} on ${formatShortDate(loan.nextPaymentDate)}`}
          />
          <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm">
            <span className="text-[var(--color-text-secondary)]">Status</span>
            <Badge variant="success">{loan.status}</Badge>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function SummaryRow({
  label,
  value,
  positive,
}: {
  readonly label: string;
  readonly value: string;
  readonly positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] px-3 py-2.5 text-sm">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span
        className={cn(
          'font-semibold text-[var(--color-text-primary)]',
          positive === undefined
            ? ''
            : positive
              ? 'text-[var(--color-success-700)]'
              : 'text-[var(--color-danger-700)]',
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function WidgetLoadingState({ title }: { readonly title: string }) {
  return (
    <Card variant="elevated" className="bg-[var(--color-bg-primary)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BriefcaseBusiness className="h-4 w-4" />
          {title}
        </CardTitle>
        <CardDescription>Loading widget content.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-4 py-10 text-center text-sm text-[var(--color-text-secondary)]">
          Fetching dashboard module...
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-4 py-10 text-center">
      <Bell className="h-5 w-5 text-[var(--color-text-muted)]" />
      <p className="mt-3 text-sm font-medium text-[var(--color-text-primary)]">Nothing new</p>
      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
        Notifications are clear for now.
      </p>
    </div>
  );
}

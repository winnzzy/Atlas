'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import {
  WidgetLoadingState,
  AccountsSummaryWidget,
  CardsSummaryWidget,
  FinancialOverview,
  InvestmentSummaryWidget,
  LoanSummaryWidget,
  QuickActionsWidget,
  RecentCryptoWidget,
  WelcomeHeader,
} from './dashboard-widgets';
import type { CustomerDashboardData } from './types';

const RecentTransactionsWidget = dynamic(() => import('./recent-transactions-widget'), {
  loading: () => <WidgetLoadingState title="Recent Transactions" />,
});

const NotificationWidget = dynamic(() => import('./notification-widget'), {
  loading: () => <WidgetLoadingState title="Notifications" />,
});

export interface CustomerDashboardPageProps {
  readonly data: CustomerDashboardData;
}

export function CustomerDashboardPage({ data }: CustomerDashboardPageProps) {
  const currentDate = React.useMemo(() => new Date('2026-07-09T09:30:00-05:00'), []);

  return (
    <div className="space-y-6 pb-8">
      <WelcomeHeader profile={data.profile} currentDate={currentDate} />
      <FinancialOverview statistics={data.financialOverview} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <QuickActionsWidget actions={data.quickActions} />
          <RecentTransactionsWidget transactions={data.transactions} />
          <AccountsSummaryWidget accounts={data.accounts} />
          <RecentCryptoWidget activities={data.cryptoActivities} />
        </div>
        <div className="space-y-6">
          <CardsSummaryWidget cards={data.cards} />
          <InvestmentSummaryWidget investment={data.investment} />
          <LoanSummaryWidget loan={data.loan} />
          <NotificationWidget notifications={data.notifications} />
        </div>
      </div>
    </div>
  );
}

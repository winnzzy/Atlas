import React from 'react';
import {
  AccountsSummaryWidget,
  CardsSummaryWidget,
  FinancialOverview,
  InvestmentSummaryWidget,
  LoanSummaryWidget,
  QuickActionsWidget,
  RecentCryptoWidget,
  WelcomeHeader,
} from './dashboard-widgets';
import { customerDashboardData } from './fixtures';

const meta = {
  title: 'Customer Dashboard/Widgets',
};

export default meta;

export const Overview = {
  render: () => (
    <div className="space-y-6 bg-[var(--color-bg-secondary)] p-6">
      <WelcomeHeader
        profile={customerDashboardData.profile}
        currentDate={new Date('2026-07-09T09:30:00-05:00')}
      />
      <FinancialOverview statistics={customerDashboardData.financialOverview} />
      <QuickActionsWidget actions={customerDashboardData.quickActions} />
      <AccountsSummaryWidget accounts={customerDashboardData.accounts} />
      <RecentCryptoWidget activities={customerDashboardData.cryptoActivities} />
      <CardsSummaryWidget cards={customerDashboardData.cards} />
      <InvestmentSummaryWidget investment={customerDashboardData.investment} />
      <LoanSummaryWidget loan={customerDashboardData.loan} />
    </div>
  ),
};

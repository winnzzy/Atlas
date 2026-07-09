export type DashboardTrend = 'up' | 'down' | 'neutral';

export type AccountType = 'checking' | 'savings' | 'crypto';

export interface CustomerProfile {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly email: string;
  readonly lastLoginAt: string;
  readonly segment: 'Premier Banking';
}

export interface AccountSnapshot {
  readonly id: string;
  readonly name: string;
  readonly type: AccountType;
  readonly accountMask: string;
  readonly routingNumber: string;
  readonly achNumber: string;
  readonly wireNumber: string;
  readonly swiftCode?: string;
  readonly availableBalance: number;
  readonly currentBalance: number;
}

export interface StatisticSnapshot {
  readonly label: string;
  readonly value: number;
  readonly deltaLabel: string;
  readonly trend: DashboardTrend;
  readonly tone?: 'default' | 'crypto' | 'investment';
}

export interface QuickAction {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

export interface TransactionRecord {
  readonly id: string;
  readonly bookedAt: string;
  readonly description: string;
  readonly category: string;
  readonly amount: number;
  readonly status: 'Posted' | 'Processing' | 'Completed' | 'Pending Review';
  readonly account: string;
}

export interface CryptoActivity {
  readonly id: string;
  readonly asset: string;
  readonly network: string;
  readonly amount: number;
  readonly amountLabel: string;
  readonly status: 'Settled' | 'Pending' | 'Completed';
  readonly time: string;
}

export interface CardSummary {
  readonly id: string;
  readonly label: 'Physical Card' | 'Virtual Card';
  readonly cardholder: string;
  readonly maskedNumber: string;
  readonly status: 'Active' | 'Provisioning';
  readonly availableCredit: number;
  readonly creditLimit: number;
  readonly isFrozen: boolean;
}

export interface InvestmentSummary {
  readonly portfolioValue: number;
  readonly dailyChange: number;
  readonly totalReturn: number;
  readonly allocationProgress: number;
  readonly topHolding: string;
}

export interface LoanSummary {
  readonly productName: string;
  readonly outstandingBalance: number;
  readonly nextPaymentAmount: number;
  readonly nextPaymentDate: string;
  readonly status: 'Current';
}

export interface DashboardNotification {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly createdAt: string;
  readonly unread: boolean;
}

export interface CustomerDashboardData {
  readonly profile: CustomerProfile;
  readonly financialOverview: readonly StatisticSnapshot[];
  readonly accounts: readonly AccountSnapshot[];
  readonly quickActions: readonly QuickAction[];
  readonly transactions: readonly TransactionRecord[];
  readonly cryptoActivities: readonly CryptoActivity[];
  readonly cards: readonly CardSummary[];
  readonly investment: InvestmentSummary;
  readonly loan: LoanSummary;
  readonly notifications: readonly DashboardNotification[];
}

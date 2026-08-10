import { getAccounts, getCards, getNotifications, getTransactions, getTransfers, getInvestments, getProfile } from '@/lib/api';

export type DashboardAccount = {
  id: string;
  name: string;
  type: string;
  balance: number;
  available: number;
};

export type DashboardTransaction = {
  id: string;
  reference: string;
  description: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Scheduled';
  date: string;
  type: 'Credit' | 'Debit';
};

export type DashboardTransfer = {
  id: string;
  reference: string;
  beneficiary: string;
  amount: number;
  type: 'Domestic' | 'International' | 'Same Day';
  status: 'Pending' | 'Completed' | 'Rejected';
  description: string;
  date: string;
};

export type DashboardCard = {
  id: string;
  name: string;
  maskedNumber: string;
  status: 'ACTIVE' | 'FROZEN' | 'CANCELLED';
  limit: number;
  available: number;
};

export type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type DashboardPortfolioItem = {
  name: string;
  weight: string;
  value: number;
};

export type DashboardProfile = {
  id: string;
  fullName: string;
  email: string;
};

type ApiAccount = {
  id?: string;
  name?: string;
  accountType?: string;
  type?: string;
  balance?: {
    current?: number | string;
    available?: number | string;
  };
  currentBalance?: number | string;
  availableBalance?: number | string;
  available?: number | string;
};

type ApiTransaction = {
  id?: string;
  reference?: string;
  description?: string;
  memo?: string;
  amount?: number | string;
  amountValue?: number | string;
  status?: string;
  date?: string;
  createdAt?: string;
  type?: string;
};

type ApiTransfer = {
  id?: string;
  reference?: string;
  beneficiary?: string;
  counterparty?: string;
  amount?: number | string;
  type?: string;
  status?: string;
  description?: string;
  date?: string;
  createdAt?: string;
};

type ApiCard = {
  id?: string;
  name?: string;
  cardholderName?: string;
  maskedNumber?: string;
  last4?: string;
  status?: string;
  limit?: number | string;
  creditLimit?: number | string;
  available?: number | string;
  availableCredit?: number | string;
};

type ApiNotification = {
  id?: string;
  title?: string;
  subject?: string;
  message?: string;
  body?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
};

type ApiInvestment = {
  name?: string;
  assetName?: string;
  weight?: string;
  allocation?: string;
  value?: number | string;
  marketValue?: number | string;
  balance?: number | string;
};

function parseBalance(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export async function loadDashboardData() {
  const [accountsResponse, transactionsResponse, transfersResponse, cardsResponse, notificationsResponse, investmentsResponse, profileResponse] = await Promise.all([
    getAccounts(),
    getTransactions(),
    getTransfers(),
    getCards(),
    getNotifications(),
    getInvestments(),
    getProfile(),
  ]);

  const accounts = Array.isArray(accountsResponse)
    ? accountsResponse.map((account: ApiAccount): DashboardAccount => ({
        id: account.id ?? 'account-unknown',
        name: account.name ?? 'Account',
        type: account.accountType ?? account.type ?? 'Checking',
        balance: parseBalance(account.balance?.current ?? account.currentBalance ?? account.balance),
        available: parseBalance(account.balance?.available ?? account.availableBalance ?? account.available),
      }))
    : [];

  const transactions = Array.isArray(transactionsResponse)
    ? transactionsResponse.map((transaction: ApiTransaction): DashboardTransaction => ({
        id: transaction.id ?? 'transaction-unknown',
        reference: transaction.reference ?? transaction.id ?? 'TXN',
        description: transaction.description ?? transaction.memo ?? 'Transaction',
        amount: parseBalance(transaction.amount ?? transaction.amountValue),
        status: (transaction.status === 'Completed' || transaction.status === 'Pending' || transaction.status === 'Scheduled' ? transaction.status : 'Pending') as 'Completed' | 'Pending' | 'Scheduled',
        date: transaction.date ?? transaction.createdAt ?? '',
        type: transaction.type === 'Credit' ? 'Credit' : 'Debit',
      }))
    : [];

  const transfers = Array.isArray(transfersResponse)
    ? transfersResponse.map((transfer: ApiTransfer): DashboardTransfer => ({
        id: transfer.id ?? 'transfer-unknown',
        reference: transfer.reference ?? transfer.id ?? 'TRF',
        beneficiary: transfer.beneficiary ?? transfer.counterparty ?? 'Transfer',
        amount: parseBalance(transfer.amount),
        type: (transfer.type === 'Domestic' || transfer.type === 'International' || transfer.type === 'Same Day' ? transfer.type : 'Domestic') as 'Domestic' | 'International' | 'Same Day',
        status: (transfer.status === 'Pending' || transfer.status === 'Completed' || transfer.status === 'Rejected' ? transfer.status : 'Pending') as 'Pending' | 'Completed' | 'Rejected',
        description: transfer.description ?? 'Transfer',
        date: transfer.date ?? transfer.createdAt ?? '',
      }))
    : [];

  const cards = Array.isArray(cardsResponse)
    ? cardsResponse.map((card: ApiCard): DashboardCard => ({
        id: card.id ?? 'card-unknown',
        name: card.name ?? card.cardholderName ?? 'Atlas Card',
        maskedNumber: card.maskedNumber ?? card.last4 ?? '•••• 0000',
        status: (card.status === 'ACTIVE' || card.status === 'FROZEN' || card.status === 'CANCELLED' ? card.status : 'ACTIVE') as 'ACTIVE' | 'FROZEN' | 'CANCELLED',
        limit: parseBalance(card.limit ?? card.creditLimit),
        available: parseBalance(card.available ?? card.availableCredit),
      }))
    : [];

  const notifications = Array.isArray(notificationsResponse)
    ? notificationsResponse.map((notification: ApiNotification): DashboardNotification => ({
        id: notification.id ?? 'notification-unknown',
        title: notification.title ?? notification.subject ?? 'Notification',
        message: notification.message ?? notification.body ?? '',
        read: Boolean(notification.read ?? notification.isRead),
        createdAt: notification.createdAt ?? '',
      }))
    : [];

  const portfolio = Array.isArray(investmentsResponse)
    ? investmentsResponse.map((item: ApiInvestment): DashboardPortfolioItem => ({
        name: item.name ?? item.assetName ?? 'Investment',
        weight: item.weight ?? item.allocation ?? '0%',
        value: parseBalance(item.value ?? item.marketValue ?? item.balance),
      }))
    : [];

  const profile = profileResponse ? {
    id: profileResponse.id ?? 'unknown',
    fullName: [profileResponse.personalInformation?.firstName, profileResponse.personalInformation?.lastName].filter(Boolean).join(' '),
    email: profileResponse.contactInformation?.email ?? '',
  } satisfies DashboardProfile : null;

  return {
    accounts,
    transactions,
    transfers,
    cards,
    notifications,
    portfolio,
    profile,
  };
}

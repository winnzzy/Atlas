import { getAccounts, getCards, getNotifications, getTransactions, getTransfers, getPortfolio, getProfile } from '@/lib/api';

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
  /** Raw backend card status, e.g. REQUESTED / ISSUED / ACTIVATED / FROZEN. */
  status: string;
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

type ApiHolding = {
  productId?: string;
  symbol?: string;
  name?: string;
  allocationPct?: number;
  currentValue?: number;
};

function parseBalance(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * The backend serialises statuses/types as UPPERCASE enum values (e.g. COMPLETED,
 * DEPOSIT). These map them to the Title-Case display buckets the dashboard renders.
 * Comparing the raw value against Title-Case literals (the previous behaviour) made
 * every posted transaction fall through to "Pending" and every credit to "Debit".
 */
function mapTransactionStatus(raw: unknown): DashboardTransaction['status'] {
  switch (String(raw ?? '').toUpperCase()) {
    case 'COMPLETED':
    case 'SETTLED':
    case 'POSTED':
      return 'Completed';
    case 'SCHEDULED':
    case 'QUEUED':
      return 'Scheduled';
    default:
      return 'Pending';
  }
}

function mapTransactionDirection(rawType: unknown): DashboardTransaction['type'] {
  return /DEPOSIT|CREDIT|INCOMING|INTEREST|REFUND/.test(String(rawType ?? '').toUpperCase())
    ? 'Credit'
    : 'Debit';
}

function mapTransferStatus(raw: unknown): DashboardTransfer['status'] {
  const status = String(raw ?? '').toUpperCase();
  if (status === 'COMPLETED') return 'Completed';
  if (status === 'REJECTED' || status === 'FAILED' || status === 'CANCELLED' || status === 'REVERSED') {
    return 'Rejected';
  }
  return 'Pending';
}

/** Resolves to null instead of rejecting, so one failing section cannot blank the dashboard. */
async function settle<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

export async function loadDashboardData() {
  const [accountsResponse, transactionsResponse, transfersResponse, cardsResponse, notificationsResponse, investmentsResponse, profileResponse] = await Promise.all([
    settle(getAccounts()),
    settle(getTransactions()),
    settle(getTransfers()),
    settle(getCards()),
    settle(getNotifications()),
    settle(getPortfolio()),
    settle(getProfile()),
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
        status: mapTransactionStatus(transaction.status),
        date: transaction.date ?? transaction.createdAt ?? '',
        type: mapTransactionDirection(transaction.type),
      }))
    : [];

  const transfers = Array.isArray(transfersResponse)
    ? transfersResponse.map((transfer: ApiTransfer): DashboardTransfer => ({
        id: transfer.id ?? 'transfer-unknown',
        reference: transfer.reference ?? transfer.id ?? 'TRF',
        beneficiary: transfer.beneficiary ?? transfer.counterparty ?? 'Transfer',
        amount: parseBalance(transfer.amount),
        type: (transfer.type === 'Domestic' || transfer.type === 'International' || transfer.type === 'Same Day' ? transfer.type : 'Domestic') as 'Domestic' | 'International' | 'Same Day',
        status: mapTransferStatus(transfer.status),
        description: transfer.description ?? 'Transfer',
        date: transfer.date ?? transfer.createdAt ?? '',
      }))
    : [];

  const cards = Array.isArray(cardsResponse)
    ? cardsResponse.map((card: ApiCard): DashboardCard => ({
        id: card.id ?? 'card-unknown',
        name: card.name ?? card.cardholderName ?? 'Atlas Card',
        maskedNumber: card.maskedNumber ?? card.last4 ?? '•••• 0000',
        status: card.status ?? 'UNKNOWN',
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

  const holdings = investmentsResponse?.holdings ?? [];
  const portfolio = holdings.map((item: ApiHolding): DashboardPortfolioItem => ({
    name: item.name ?? item.symbol ?? 'Investment',
    weight: `${(item.allocationPct ?? 0).toFixed(1)}%`,
    value: parseBalance(item.currentValue),
  }));

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

const STORAGE_KEY = 'atlas-auth-token';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type AuthSessionResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  sessionId: string;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: {
    traceId?: string;
    timestamp?: string;
  };
  error?: unknown;
};

export type AccountSummary = {
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

export type TransactionSummary = {
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

export type TransferSummary = {
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

export type CardSummary = {
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

export type NotificationSummary = {
  id?: string;
  title?: string;
  subject?: string;
  message?: string;
  body?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
};

export type InvestmentSummary = {
  name?: string;
  assetName?: string;
  weight?: string;
  allocation?: string;
  value?: number | string;
  marketValue?: number | string;
  balance?: number | string;
};

export type ProfileSummary = {
  id?: string;
  personalInformation?: {
    firstName?: string;
    lastName?: string;
  };
  contactInformation?: {
    email?: string;
  };
};

function getApiBaseUrl() {
  return API_BASE_URL.replace(/\/$/, '');
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export function getStoredAccessToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(STORAGE_KEY);
}

export function setStoredAccessToken(token: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!token) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, token);
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredAccessToken();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      const reason = payload?.message ?? payload?.error ?? payload?.detail;
      if (reason) {
        message = String(reason);
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return undefined as T;
  }

  const payload = await response.json();
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
}

export async function loginWithEmailPassword(email: string, password: string) {
  return requestJson<AuthSessionResponse>('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      deviceName: 'Atlas Web',
      deviceId: 'atlas-web',
    }),
  });
}

export async function registerWithEmailPassword(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  termsAcceptedAt: string;
  privacyAcceptedAt: string;
}) {
  return requestJson<AuthSessionResponse>('/api/v1/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function requestPasswordReset(email: string) {
  return requestJson<{ message: string }>('/api/v1/auth/password/forgot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
}

export async function completePasswordReset(token: string, newPassword: string) {
  return requestJson<{ message: string }>('/api/v1/auth/password/reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  });
}

export async function logoutSession() {
  await requestJson('/api/v1/auth/logout', {
    method: 'POST',
  });
}

export async function getProfile() {
  return requestJson<ProfileSummary>('/api/v1/profile');
}

export async function getAccounts() {
  return requestJson<AccountSummary[]>('/api/v1/accounts');
}

export async function getTransactions() {
  return requestJson<TransactionSummary[]>('/api/v1/transactions');
}

export async function getTransfers() {
  return requestJson<TransferSummary[]>('/api/v1/transfers');
}

export async function getCards() {
  return requestJson<CardSummary[]>('/api/v1/cards');
}

export async function getNotifications() {
  return requestJson<NotificationSummary[]>('/api/v1/notifications');
}

export async function getInvestments() {
  return requestJson<InvestmentSummary[]>('/api/v1/investments');
}

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

export type InvestmentHolding = {
  productId?: string;
  symbol?: string;
  name?: string;
  allocationPct?: number;
  currentValue?: number;
};

export type PortfolioSummary = {
  totalValueUsd?: number;
  totalProfitLossUsd?: number;
  totalProfitLossPct?: number;
  holdings?: InvestmentHolding[];
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

export type CustomerProfileResponse = {
  id?: string;
  avatarInitials?: string;
  personalInformation?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    dateOfBirth?: string;
    ssnLast4?: string;
  };
  contactInformation?: {
    email?: string;
    phoneNumber?: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
  };
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  verification?: {
    kycStatus?: string;
    kycLevel?: string;
    overallStatus?: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
  };
  preferredCurrency?: string;
  preferredLanguage?: string;
  timezone?: string;
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

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
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
      if (Array.isArray(reason)) {
        message = reason.join(', ');
      } else if (reason) {
        message = String(reason);
      }
    } catch {
      // Response body was not JSON; keep the status-derived message.
    }
    throw new ApiError(message, response.status);
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

/**
 * List endpoints return a paginated envelope (`{ items, totalCount }`), so the
 * rows have to be unwrapped before use. Reading them as a bare array silently
 * yields an empty list.
 */
function unwrapItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: T[] }).items;
  }
  return [];
}

export async function getAccounts() {
  const payload = await requestJson<unknown>('/api/v1/accounts');
  return unwrapItems<AccountSummary>(payload);
}

export async function getTransactions() {
  const payload = await requestJson<unknown>('/api/v1/transactions');
  return unwrapItems<TransactionSummary>(payload);
}

export async function getTransfers() {
  const payload = await requestJson<unknown>('/api/v1/transfers');
  return unwrapItems<TransferSummary>(payload);
}

export async function getCards() {
  const payload = await requestJson<unknown>('/api/v1/cards');
  return unwrapItems<CardSummary>(payload);
}

export async function getNotifications() {
  const payload = await requestJson<unknown>('/api/v1/notifications');
  return unwrapItems<NotificationSummary>(payload);
}

export async function markNotificationRead(id: string) {
  return requestJson<NotificationSummary>(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
}

export async function getPortfolio() {
  return requestJson<PortfolioSummary>('/api/v1/investments/portfolio');
}

function postJson<T>(path: string, body: unknown, method: 'POST' | 'PATCH' = 'POST') {
  return requestJson<T>(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── Customer mutations ────────────────────────────────────────────────────────

export type TransferType =
  | 'INTERNAL'
  | 'ACH_CREDIT'
  | 'SAME_DAY_ACH'
  | 'DOMESTIC_WIRE'
  | 'INTERNATIONAL_WIRE';

export type CreateTransferInput = {
  type: TransferType;
  sourceAccountId: string;
  amount: string;
  currency: string;
  destinationAccountId?: string;
  routingNumber?: string;
  bankName?: string;
  beneficiaryName?: string;
  description?: string;
  memo?: string;
  reference?: string;
  idempotencyKey?: string;
};

export async function createTransfer(input: CreateTransferInput) {
  return postJson<TransferSummary & { status?: string; statusMessage?: string }>('/api/v1/transfers', input);
}

export type CardApplicationInput = {
  accountId: string;
  type: string;
  nickname?: string;
  spendingCategory?: string;
};

export async function applyForCard(input: CardApplicationInput) {
  return postJson<CardSummary>('/api/v1/cards', input);
}

export async function freezeCard(cardId: string, reason?: string) {
  return postJson<CardSummary>(`/api/v1/cards/${cardId}/freeze`, { reason });
}

export async function unfreezeCard(cardId: string) {
  return postJson<CardSummary>(`/api/v1/cards/${cardId}/unfreeze`, {});
}

export async function getCustomerProfile() {
  return requestJson<CustomerProfileResponse>('/api/v1/profile');
}

export async function updateProfile(input: Record<string, unknown>) {
  return postJson<CustomerProfileResponse>('/api/v1/profile', input, 'PATCH');
}

export async function updatePreferences(input: Record<string, unknown>) {
  return postJson<Record<string, unknown>>('/api/v1/profile/preferences', input, 'PATCH');
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export type AdminIdentity = {
  adminId: string;
  role: 'SUPPORT' | 'OPERATIONS' | 'COMPLIANCE' | 'FINANCE' | 'ADMIN' | 'SUPER_ADMIN';
  permissions: string[];
};

/**
 * Resolves the caller's admin role from the server. Returns null when the user
 * holds no admin grant, so the client never decides this for itself.
 */
export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  try {
    return await requestJson<AdminIdentity>('/api/v1/admin/dashboard/me');
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    throw error;
  }
}

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

export type AdminPaged<T> = { items?: T[]; totalCount?: number; limit?: number };

export async function getAdminOverview() {
  return requestJson<Record<string, unknown>>('/api/v1/admin/dashboard/overview');
}

export async function getAdminAnalytics() {
  return requestJson<Record<string, unknown>>('/api/v1/admin/dashboard/analytics');
}

export async function getAdminCustomers(params: { q?: string; limit?: number } = {}) {
  return requestJson<AdminPaged<Record<string, unknown>>>(`/api/v1/admin/customers${query(params)}`);
}

export async function getAdminCustomerAccounts(userId: string) {
  return requestJson<Record<string, unknown>[]>(`/api/v1/admin/customers/${userId}/accounts`);
}

export async function getAdminCustomerCards(userId: string) {
  return requestJson<Record<string, unknown>[]>(`/api/v1/admin/customers/${userId}/cards`);
}

export async function getAdminTransfers(params: { limit?: number } = {}) {
  return requestJson<AdminPaged<Record<string, unknown>>>(`/api/v1/admin/transfers${query(params)}`);
}

export async function getAdminTransactions(params: { limit?: number } = {}) {
  return requestJson<AdminPaged<Record<string, unknown>>>(`/api/v1/admin/transactions${query(params)}`);
}

export async function getAdminAuditLogs(params: { limit?: number } = {}) {
  return requestJson<AdminPaged<Record<string, unknown>>>(`/api/v1/admin/audit/logs${query(params)}`);
}

export async function getAdminReports(params: { limit?: number } = {}) {
  return requestJson<Record<string, unknown>>(`/api/v1/admin/reports${query(params)}`);
}

export async function getAdminSettings() {
  return requestJson<Record<string, unknown>>('/api/v1/admin/settings');
}

export async function updateAdminSettings(input: Record<string, unknown>) {
  return postJson<Record<string, unknown>>('/api/v1/admin/settings', input, 'PATCH');
}

export type AdminAccountAction = {
  action: 'FREEZE' | 'UNFREEZE' | 'LOCK' | 'UNLOCK' | 'CLOSE' | 'ARCHIVE' | 'CREDIT' | 'DEBIT';
  reason?: string;
  amount?: string;
  reference?: string;
};

export async function applyAdminAccountAction(accountId: string, action: AdminAccountAction) {
  return postJson<Record<string, unknown>>(`/api/v1/admin/accounts/${accountId}`, action, 'PATCH');
}

export type AdminCardAction = {
  action: 'ISSUE' | 'APPROVE' | 'REJECT' | 'FREEZE' | 'UNFREEZE' | 'REPLACE' | 'CANCEL';
  reason?: string;
  accountId?: string;
  cardType?: string;
};

export async function applyAdminCardAction(cardId: string, action: AdminCardAction) {
  return postJson<Record<string, unknown>>(`/api/v1/admin/cards/${cardId}`, action, 'PATCH');
}

export async function applyAdminCustomerAction(
  userId: string,
  action: { action: 'SUSPEND' | 'REACTIVATE' | 'FREEZE'; reason?: string },
) {
  return postJson<Record<string, unknown>>(`/api/v1/admin/customers/${userId}/status`, action, 'PATCH');
}

// ── Admin customer detail / KYC / accounts / restrictions ───────────────────

export type AdminCustomerDetail = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  status: string;
  kycStatus: string;
  kycLevel?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  address?: Record<string, string> | null;
  employment?: Record<string, string> | null;
  createdAt?: string;
  updatedAt?: string;
  audit?: Array<Record<string, unknown>>;
};

export async function getAdminCustomerDetail(userId: string) {
  return requestJson<AdminCustomerDetail>(`/api/v1/admin/customers/${userId}/detail`);
}

export async function updateAdminCustomer(userId: string, input: Record<string, unknown>) {
  return postJson<Record<string, unknown>>(`/api/v1/admin/customers/${userId}`, input, 'PATCH');
}

export async function decideAdminKyc(
  userId: string,
  input: { decision: 'APPROVE' | 'REJECT'; reason?: string },
) {
  return postJson<Record<string, unknown>>(`/api/v1/admin/customers/${userId}/kyc`, input, 'PATCH');
}

export async function assignAdminAccount(
  userId: string,
  input: { accountType: string; currency?: string; nickname?: string },
) {
  return postJson<Record<string, unknown>>(`/api/v1/admin/customers/${userId}/accounts`, input, 'POST');
}

export async function getAdminCustomerAudit(userId: string) {
  return requestJson<Array<Record<string, unknown>>>(`/api/v1/admin/customers/${userId}/audit`);
}

export async function applyAdminAccountRestriction(
  accountId: string,
  input: { reason: string; restrictionType?: string; amount?: string; reference?: string },
) {
  return postJson<Record<string, unknown>>(`/api/v1/admin/accounts/${accountId}/restriction`, input, 'PATCH');
}

export async function releaseAdminAccountRestriction(accountId: string) {
  return requestJson<Record<string, unknown>>(`/api/v1/admin/accounts/${accountId}/restriction`, {
    method: 'DELETE',
  });
}

// ── Admin presentation activity generator ───────────────────────────────────

export type AdminPresentationStatus = {
  accountId: string;
  accountNumber: string;
  accountName: string;
  currency: string;
  status: string;
  currentBalance: string;
  availableBalance: string;
  transactionCount: number;
  presentationExists: boolean;
  presentationCount: number;
  presentationCredits: string;
  presentationDebits: string;
  presentationNet: string;
  presentationBatchId: string | null;
  generatedAt: string | null;
};

export type AdminPresentationResult = {
  accountId: string;
  batchId: string;
  transactionCount: number;
  openingBalance: string;
  finalBalance: string;
  totalCredits: string;
  totalDebits: string;
  periodStart: string;
  periodEnd: string;
  replaced: boolean;
};

export async function getAdminPresentationStatus(userId: string, accountId: string) {
  return requestJson<AdminPresentationStatus>(
    `/api/v1/admin/customers/${userId}/presentation${query({ accountId })}`,
  );
}

export async function generateAdminPresentation(
  userId: string,
  input: { accountId: string; targetBalance?: string; months?: number; replace?: boolean },
) {
  return postJson<AdminPresentationResult>(
    `/api/v1/admin/customers/${userId}/presentation`,
    input,
    'POST',
  );
}

// ── Bank directory (sandbox until a provider is connected) ──────────────────

export type BankDirectoryEntry = { id: string; name: string; routingNumber: string; sandbox: boolean };

export async function searchBanks(q?: string) {
  return requestJson<{ items: BankDirectoryEntry[]; sandbox: boolean }>(
    `/api/v1/transfers/banks${query({ q })}`,
  );
}

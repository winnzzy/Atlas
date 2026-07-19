import { HttpClient } from '@atlas/api-client';
import type {
  AccountAdminAction,
  AdminAnalytics,
  AdminAuditResponse,
  AdminDashboardOverview,
  AdminReport,
  AdminRole,
  AdminSearchResult,
  AdminSettings,
  CardAdminAction,
  CustomerAction,
  CustomerListResponse,
  NotificationQueueResponse,
  Pagination,
  TransactionSearchResult,
  TransferSearchResult,
} from './types';

const DEFAULT_API_BASE_URL = 'http://localhost:3001';

const getAdminRole = (): AdminRole => {
  const raw = process.env['NEXT_PUBLIC_ADMIN_ROLE'];
  if (
    raw === 'SUPPORT' ||
    raw === 'OPERATIONS' ||
    raw === 'COMPLIANCE' ||
    raw === 'FINANCE' ||
    raw === 'ADMIN' ||
    raw === 'SUPER_ADMIN'
  ) {
    return raw;
  }
  return 'SUPER_ADMIN';
};

const toSearchParams = (
  params: Record<string, string | number | undefined>,
): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      out[key] = String(value);
    }
  }
  return out;
};

export class AdminApi {
  private readonly http: HttpClient;

  constructor() {
    this.http = new HttpClient({
      baseUrl: process.env['NEXT_PUBLIC_API_BASE_URL'] ?? DEFAULT_API_BASE_URL,
      headers: {
        'x-admin-role': getAdminRole(),
      },
    });
  }

  getOverview(): Promise<AdminDashboardOverview> {
    return this.http.get('/api/v1/admin/dashboard/overview');
  }

  getAnalytics(): Promise<AdminAnalytics> {
    return this.http.get('/api/v1/admin/dashboard/analytics');
  }

  searchGlobal(q: string, pagination: Pagination): Promise<AdminSearchResult> {
    return this.http.get('/api/v1/admin/search', toSearchParams({ q, ...pagination }));
  }

  getCustomers(params: { q?: string } & Pagination): Promise<CustomerListResponse> {
    return this.http.get('/api/v1/admin/customers', toSearchParams(params));
  }

  getCustomerProfile(userId: string): Promise<Record<string, unknown>> {
    return this.http.get(`/api/v1/admin/customers/${userId}/profile`);
  }

  getCustomerAccounts(userId: string): Promise<Array<Record<string, unknown>>> {
    return this.http.get(`/api/v1/admin/customers/${userId}/accounts`);
  }

  getCustomerCards(userId: string): Promise<Array<Record<string, unknown>>> {
    return this.http.get(`/api/v1/admin/customers/${userId}/cards`);
  }

  getCustomerInvestments(userId: string): Promise<Array<Record<string, unknown>>> {
    return this.http.get(`/api/v1/admin/customers/${userId}/investments`);
  }

  getCustomerTransactions(userId: string): Promise<Array<Record<string, unknown>>> {
    return this.http.get(`/api/v1/admin/customers/${userId}/transactions`);
  }

  applyCustomerAction(
    userId: string,
    action: CustomerAction,
    reason?: string,
  ): Promise<Record<string, unknown>> {
    return this.http.patch(`/api/v1/admin/customers/${userId}/status`, { action, reason });
  }

  resetCustomerMfa(userId: string): Promise<Record<string, unknown>> {
    return this.http.post(`/api/v1/admin/customers/${userId}/reset-mfa`);
  }

  resetCustomerPassword(userId: string): Promise<Record<string, unknown>> {
    return this.http.post(`/api/v1/admin/customers/${userId}/reset-password`);
  }

  applyAccountAction(
    accountId: string,
    action: AccountAdminAction,
    reason?: string,
  ): Promise<Record<string, unknown>> {
    return this.http.patch(`/api/v1/admin/accounts/${accountId}`, { action, reason });
  }

  applyCardAction(
    cardId: string,
    action: CardAdminAction,
    reason?: string,
  ): Promise<Record<string, unknown>> {
    return this.http.patch(`/api/v1/admin/cards/${cardId}`, { action, reason });
  }

  getTransactions(
    params: Record<string, string | number | undefined>,
  ): Promise<TransactionSearchResult> {
    return this.http.get('/api/v1/admin/transactions', toSearchParams(params));
  }

  getTransactionByReference(reference: string): Promise<TransactionSearchResult> {
    return this.http.get(`/api/v1/admin/transactions/reference/${reference}`);
  }

  reverseTransaction(transactionId: string, reason: string): Promise<Record<string, unknown>> {
    return this.http.post(`/api/v1/admin/transactions/${transactionId}/reverse`, { reason });
  }

  getLedgerView(accountId: string): Promise<Array<Record<string, unknown>>> {
    return this.http.get(`/api/v1/admin/transactions/ledger/${accountId}`);
  }

  getTransfers(params: Record<string, string | number | undefined>): Promise<TransferSearchResult> {
    return this.http.get('/api/v1/admin/transfers', toSearchParams(params));
  }

  retryTransfer(transferId: string): Promise<Record<string, unknown>> {
    return this.http.post(`/api/v1/admin/transfers/${transferId}/retry`);
  }

  cancelTransfer(transferId: string, reason: string): Promise<Record<string, unknown>> {
    return this.http.post(`/api/v1/admin/transfers/${transferId}/cancel`, { reason });
  }

  getSettlementView(
    params: Record<string, string | number | undefined>,
  ): Promise<TransferSearchResult> {
    return this.http.get('/api/v1/admin/transfers/settlement/view', toSearchParams(params));
  }

  getPortfolio(userId: string): Promise<Record<string, unknown>> {
    return this.http.get(`/api/v1/admin/investments/portfolio/${userId}`);
  }

  listWallets(params: Record<string, string | undefined>): Promise<Array<Record<string, unknown>>> {
    return this.http.get('/api/v1/admin/investments/wallets', toSearchParams(params));
  }

  applyInvestmentAction(
    body: Record<string, string | number | undefined>,
  ): Promise<Record<string, unknown>> {
    return this.http.patch('/api/v1/admin/investments/actions', body);
  }

  getNotificationQueue(
    params: Record<string, string | number | undefined>,
  ): Promise<NotificationQueueResponse> {
    return this.http.get('/api/v1/admin/notifications/queue', toSearchParams(params));
  }

  retryNotification(notificationId: string): Promise<Record<string, unknown>> {
    return this.http.post(`/api/v1/admin/notifications/${notificationId}/retry`);
  }

  getNotificationTemplates(): Promise<Array<Record<string, unknown>>> {
    return this.http.get('/api/v1/notifications/templates/catalog');
  }

  getAuditLogs(params: Record<string, string | number | undefined>): Promise<AdminAuditResponse> {
    return this.http.get('/api/v1/admin/audit/logs', toSearchParams(params));
  }

  getSecurityEvents(
    params: Record<string, string | number | undefined>,
  ): Promise<AdminAuditResponse> {
    return this.http.get('/api/v1/admin/audit/security-events', toSearchParams(params));
  }

  getAdminActions(
    params: Record<string, string | number | undefined>,
  ): Promise<AdminAuditResponse> {
    return this.http.get('/api/v1/admin/audit/actions', toSearchParams(params));
  }

  getSettings(): Promise<AdminSettings> {
    return this.http.get('/api/v1/admin/settings');
  }

  updateSettings(payload: Partial<AdminSettings>): Promise<AdminSettings> {
    return this.http.patch('/api/v1/admin/settings', payload);
  }

  getReport(kind: string, from?: string, to?: string): Promise<AdminReport> {
    return this.http.get('/api/v1/admin/reports', toSearchParams({ kind, from, to }));
  }
}

export const adminApi = new AdminApi();

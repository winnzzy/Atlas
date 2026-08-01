import type {
  AccountAdminAction,
  AdminAnalytics,
  AdminAuditResponse,
  AdminDashboardOverview,
  AdminReport,
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
import { localDataProvider } from '@/features/mock/local-data-provider';

export class AdminApi {
  getOverview(): Promise<AdminDashboardOverview> {
    return Promise.resolve(localDataProvider.getOverview() as AdminDashboardOverview);
  }

  getAnalytics(): Promise<AdminAnalytics> {
    return Promise.resolve(localDataProvider.getAnalytics() as AdminAnalytics);
  }

  searchGlobal(q: string, pagination: Pagination): Promise<AdminSearchResult> {
    const customers = localDataProvider.getCustomers({ q, limit: pagination.limit, offset: pagination.offset }) as { items?: Array<Record<string, unknown>> };
    const items = (customers.items ?? []).map((customer) => ({
      id: String(customer['id']),
      kind: 'customer',
      primary: `${String(customer['firstName'] ?? '')} ${String(customer['lastName'] ?? '')}`.trim(),
      secondary: String(customer['email'] ?? ''),
    }));
    return Promise.resolve({ items, total: items.length } as AdminSearchResult);
  }

  getCustomers(params: { q?: string } & Pagination): Promise<CustomerListResponse> {
    return Promise.resolve(localDataProvider.getCustomers(params) as CustomerListResponse);
  }

  getCustomerProfile(_userId: string): Promise<Record<string, unknown>> {
    return Promise.resolve(localDataProvider.getCustomerProfile('cust-1001'));
  }

  getCustomerAccounts(_userId: string): Promise<Array<Record<string, unknown>>> {
    return Promise.resolve([]);
  }

  getCustomerCards(_userId: string): Promise<Array<Record<string, unknown>>> {
    return Promise.resolve([]);
  }

  getCustomerInvestments(_userId: string): Promise<Array<Record<string, unknown>>> {
    return Promise.resolve([]);
  }

  getCustomerTransactions(_userId: string): Promise<Array<Record<string, unknown>>> {
    return Promise.resolve([]);
  }

  applyCustomerAction(userId: string, action: CustomerAction, reason?: string): Promise<Record<string, unknown>> {
    return Promise.resolve({ userId, action, reason, status: 'APPLIED' });
  }

  resetCustomerMfa(userId: string): Promise<Record<string, unknown>> {
    return Promise.resolve({ userId, status: 'RESET' });
  }

  resetCustomerPassword(userId: string): Promise<Record<string, unknown>> {
    return Promise.resolve({ userId, status: 'RESET' });
  }

  applyAccountAction(accountId: string, action: AccountAdminAction, reason?: string): Promise<Record<string, unknown>> {
    return Promise.resolve({ accountId, action, reason, status: 'APPLIED' });
  }

  applyCardAction(cardId: string, action: CardAdminAction, reason?: string): Promise<Record<string, unknown>> {
    return Promise.resolve({ cardId, action, reason, status: 'APPLIED' });
  }

  getTransactions(_params: Record<string, string | number | undefined>): Promise<TransactionSearchResult> {
    return Promise.resolve(localDataProvider.getAdminTransactions() as TransactionSearchResult);
  }

  getTransactionByReference(reference: string): Promise<TransactionSearchResult> {
    const items = (localDataProvider.getAdminTransactions() as { items?: Array<Record<string, unknown>> }).items ?? [];
    const match = items.find((entry) => String(entry['reference']) === reference);
    return Promise.resolve({
      items: match ? [match] : [],
      total: match ? 1 : 0,
      totalCount: match ? 1 : 0,
      limit: 10,
    } as unknown as TransactionSearchResult);
  }

  reverseTransaction(transactionId: string, reason: string): Promise<Record<string, unknown>> {
    return Promise.resolve({ transactionId, reason, status: 'REVERSED' });
  }

  getLedgerView(_accountId: string): Promise<Array<Record<string, unknown>>> {
    return Promise.resolve([]);
  }

  getTransfers(_params: Record<string, string | number | undefined>): Promise<TransferSearchResult> {
    return Promise.resolve(localDataProvider.getAdminTransfers() as TransferSearchResult);
  }

  retryTransfer(transferId: string): Promise<Record<string, unknown>> {
    return Promise.resolve({ transferId, status: 'RETRIED' });
  }

  cancelTransfer(transferId: string, reason: string): Promise<Record<string, unknown>> {
    return Promise.resolve({ transferId, reason, status: 'CANCELLED' });
  }

  getSettlementView(_params: Record<string, string | number | undefined>): Promise<TransferSearchResult> {
    return Promise.resolve(localDataProvider.getAdminTransfers() as TransferSearchResult);
  }

  getPortfolio(_userId: string): Promise<Record<string, unknown>> {
    return Promise.resolve(localDataProvider.getPortfolio());
  }

  listWallets(_params: Record<string, string | undefined>): Promise<Array<Record<string, unknown>>> {
    return Promise.resolve([]);
  }

  applyInvestmentAction(body: Record<string, string | number | undefined>): Promise<Record<string, unknown>> {
    return Promise.resolve({ ...body, status: 'APPLIED' });
  }

  getNotificationQueue(_params: Record<string, string | number | undefined>): Promise<NotificationQueueResponse> {
    return Promise.resolve(localDataProvider.getNotificationQueue() as NotificationQueueResponse);
  }

  retryNotification(notificationId: string): Promise<Record<string, unknown>> {
    return Promise.resolve({ notificationId, status: 'RETRIED' });
  }

  getNotificationTemplates(): Promise<Array<Record<string, unknown>>> {
    return Promise.resolve(localDataProvider.getNotificationTemplates());
  }

  getAuditLogs(_params: Record<string, string | number | undefined>): Promise<AdminAuditResponse> {
    return Promise.resolve(localDataProvider.getAuditLogs({}) as AdminAuditResponse);
  }

  getSecurityEvents(_params: Record<string, string | number | undefined>): Promise<AdminAuditResponse> {
    return Promise.resolve(localDataProvider.getAuditLogs({}) as AdminAuditResponse);
  }

  getAdminActions(_params: Record<string, string | number | undefined>): Promise<AdminAuditResponse> {
    return Promise.resolve(localDataProvider.getAuditLogs({}) as AdminAuditResponse);
  }

  getSettings(): Promise<AdminSettings> {
    return Promise.resolve(localDataProvider.getSettings() as AdminSettings);
  }

  updateSettings(payload: Partial<AdminSettings>): Promise<AdminSettings> {
    return Promise.resolve(payload as AdminSettings);
  }

  getReport(kind: string, _from?: string, _to?: string): Promise<AdminReport> {
    return Promise.resolve(localDataProvider.getReport(kind) as AdminReport);
  }
}

export const adminApi = new AdminApi();

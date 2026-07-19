import { HttpClient, ProfileApiClient } from '@atlas/api-client';
import type {
  CustomerPreferences,
  CustomerProfile,
  CustomerProfileActivity,
  CustomerSecurity,
  UpdateCustomerPreferencesInput,
  UpdateCustomerProfileInput,
  UpdateCustomerSecurityInput,
} from '@atlas/types';

const DEFAULT_API_BASE_URL = 'http://localhost:3001';

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

export class CustomerApi {
  private readonly http: HttpClient;
  private readonly profile: ProfileApiClient;

  constructor() {
    this.http = new HttpClient({
      baseUrl: process.env['NEXT_PUBLIC_API_BASE_URL'] ?? DEFAULT_API_BASE_URL,
    });
    this.profile = new ProfileApiClient(this.http);
  }

  getAccounts(
    params: Record<string, string | number | undefined>,
  ): Promise<Record<string, unknown>> {
    return this.http.get('/api/v1/accounts', toSearchParams(params));
  }

  getAccount(id: string): Promise<Record<string, unknown>> {
    return this.http.get(`/api/v1/accounts/${id}`);
  }

  getAccountStatements(
    id: string,
    params: Record<string, string | number | undefined>,
  ): Promise<Record<string, unknown>> {
    return this.http.get(`/api/v1/accounts/${id}/statements`, toSearchParams(params));
  }

  getAccountHolds(id: string): Promise<Array<Record<string, unknown>>> {
    return this.http.get(`/api/v1/accounts/${id}/holds`);
  }

  getTransactions(
    params: Record<string, string | number | undefined>,
  ): Promise<Record<string, unknown>> {
    return this.http.get('/api/v1/transactions', toSearchParams(params));
  }

  getAccountTransactions(
    accountId: string,
    params: Record<string, string | number | undefined>,
  ): Promise<Record<string, unknown>> {
    return this.http.get(`/api/v1/transactions/account/${accountId}`, toSearchParams(params));
  }

  reverseTransaction(id: string, reason: string): Promise<Record<string, unknown>> {
    return this.http.put(`/api/v1/transactions/${id}/reverse`, { reason });
  }

  getTransfers(
    params: Record<string, string | number | undefined>,
  ): Promise<Record<string, unknown>> {
    return this.http.get('/api/v1/transfers', toSearchParams(params));
  }

  getTransfer(id: string): Promise<Record<string, unknown>> {
    return this.http.get(`/api/v1/transfers/${id}`);
  }

  createTransfer(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.http.post('/api/v1/transfers', payload);
  }

  cancelTransfer(id: string, reason: string): Promise<Record<string, unknown>> {
    return this.http.post(`/api/v1/transfers/${id}/cancel`, { reason });
  }

  getBeneficiaries(
    params: Record<string, string | number | undefined>,
  ): Promise<Record<string, unknown>> {
    return this.http.get('/api/v1/transfers/beneficiaries', toSearchParams(params));
  }

  getCards(params: Record<string, string | number | undefined>): Promise<Record<string, unknown>> {
    return this.http.get('/api/v1/cards', toSearchParams(params));
  }

  getCard(id: string): Promise<Record<string, unknown>> {
    return this.http.get(`/api/v1/cards/${id}`);
  }

  freezeCard(id: string, reason?: string): Promise<Record<string, unknown>> {
    return this.http.post(`/api/v1/cards/${id}/freeze`, reason ? { reason } : undefined);
  }

  unfreezeCard(id: string): Promise<Record<string, unknown>> {
    return this.http.post(`/api/v1/cards/${id}/unfreeze`);
  }

  getCardTransactions(
    id: string,
    params: Record<string, string | number | undefined>,
  ): Promise<Record<string, unknown>> {
    return this.http.get(`/api/v1/cards/${id}/transactions`, toSearchParams(params));
  }

  getPortfolio(): Promise<Record<string, unknown>> {
    return this.http.get('/api/v1/investments/portfolio');
  }

  getPortfolioTransactions(
    params: Record<string, string | number | undefined>,
  ): Promise<Array<Record<string, unknown>>> {
    return this.http.get('/api/v1/investments/portfolio/transactions', toSearchParams(params));
  }

  getAssets(): Promise<Array<Record<string, unknown>>> {
    return this.http.get('/api/v1/investments/assets');
  }

  getAssetWallets(assetId: string): Promise<Array<Record<string, unknown>>> {
    return this.http.get(`/api/v1/investments/assets/${assetId}/wallets`);
  }

  getDeposits(): Promise<Array<Record<string, unknown>>> {
    return this.http.get('/api/v1/investments/deposits');
  }

  getWithdrawals(): Promise<Array<Record<string, unknown>>> {
    return this.http.get('/api/v1/investments/withdrawals');
  }

  getNotifications(
    params: Record<string, string | number | undefined>,
  ): Promise<Record<string, unknown>> {
    return this.http.get('/api/v1/notifications', toSearchParams(params));
  }

  markNotificationRead(id: string): Promise<Record<string, unknown>> {
    return this.http.patch(`/api/v1/notifications/${id}/read`);
  }

  getProfile(): Promise<CustomerProfile> {
    return this.profile.getProfile();
  }

  updateProfile(payload: UpdateCustomerProfileInput): Promise<CustomerProfile> {
    return this.profile.updateProfile(payload);
  }

  getPreferences(): Promise<CustomerPreferences> {
    return this.profile.getPreferences();
  }

  updatePreferences(payload: UpdateCustomerPreferencesInput): Promise<CustomerPreferences> {
    return this.profile.updatePreferences(payload);
  }

  getSecurity(): Promise<CustomerSecurity> {
    return this.profile.getSecurity();
  }

  updateSecurity(payload: UpdateCustomerSecurityInput): Promise<CustomerSecurity> {
    return this.profile.updateSecurity(payload);
  }

  getActivity(): Promise<CustomerProfileActivity> {
    return this.profile.getActivity();
  }
}

export const customerApi = new CustomerApi();

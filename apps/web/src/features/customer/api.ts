import type {
  CustomerPreferences,
  CustomerProfile,
  CustomerProfileActivity,
  CustomerSecurity,
  UpdateCustomerPreferencesInput,
  UpdateCustomerProfileInput,
  UpdateCustomerSecurityInput,
} from '@atlas/types';
import { localDataProvider } from '@/features/mock/local-data-provider';

export class CustomerApi {
  getAccounts(_params: Record<string, string | number | undefined>): Promise<Record<string, unknown>> {
    return Promise.resolve(localDataProvider.getAccounts({}));
  }

  getAccount(_id: string): Promise<Record<string, unknown>> {
    return Promise.resolve(localDataProvider.getAccount('acct-1001'));
  }

  getAccountStatements(
    _id: string,
    _params: Record<string, string | number | undefined>,
  ): Promise<Record<string, unknown>> {
    return Promise.resolve(localDataProvider.getAccountStatements('acct-1001'));
  }

  getAccountHolds(_id: string): Promise<Array<Record<string, unknown>>> {
    return Promise.resolve([]);
  }

  getTransactions(_params: Record<string, string | number | undefined>): Promise<Record<string, unknown>> {
    return Promise.resolve(localDataProvider.getTransactions({}));
  }

  getAccountTransactions(
    accountId: string,
    params: Record<string, string | number | undefined>,
  ): Promise<Record<string, unknown>> {
    const result = localDataProvider.getTransactions(params) as { items?: Array<Record<string, unknown>> };
    const items = (result.items ?? []).filter((entry) => String(entry['accountId']) === accountId);
    return Promise.resolve({ items, total: items.length });
  }

  reverseTransaction(id: string, _reason: string): Promise<Record<string, unknown>> {
    return Promise.resolve({ id, status: 'REVERSED' });
  }

  getTransfers(_params: Record<string, string | number | undefined>): Promise<Record<string, unknown>> {
    return Promise.resolve(localDataProvider.getTransfers({}));
  }

  getTransfer(id: string): Promise<Record<string, unknown>> {
    const transfers = localDataProvider.getTransfers({}) as { items?: Array<Record<string, unknown>> };
    const transfer = (transfers.items ?? []).find((entry) => String(entry['id']) === id);
    return Promise.resolve(transfer ?? { id, status: 'NOT_FOUND' });
  }

  createTransfer(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return Promise.resolve(localDataProvider.createTransfer(payload));
  }

  cancelTransfer(id: string, _reason: string): Promise<Record<string, unknown>> {
    return Promise.resolve(localDataProvider.cancelTransfer(id));
  }

  getBeneficiaries(_params: Record<string, string | number | undefined>): Promise<Record<string, unknown>> {
    return Promise.resolve({ items: [], total: 0, page: 1, limit: 10 });
  }

  getCards(_params: Record<string, string | number | undefined>): Promise<Record<string, unknown>> {
    return Promise.resolve(localDataProvider.getCards({}));
  }

  getCard(id: string): Promise<Record<string, unknown>> {
    const cards = localDataProvider.getCards({}) as { items?: Array<Record<string, unknown>> };
    const card = (cards.items ?? []).find((entry) => String(entry['id']) === id);
    return Promise.resolve(card ?? { id, status: 'NOT_FOUND' });
  }

  freezeCard(id: string, _reason?: string): Promise<Record<string, unknown>> {
    return Promise.resolve(localDataProvider.freezeCard(id));
  }

  unfreezeCard(id: string): Promise<Record<string, unknown>> {
    return Promise.resolve(localDataProvider.unfreezeCard(id));
  }

  getCardTransactions(
    _id: string,
    _params: Record<string, string | number | undefined>,
  ): Promise<Record<string, unknown>> {
    return Promise.resolve({ items: [], total: 0, page: 1, limit: 10 });
  }

  getPortfolio(): Promise<Record<string, unknown>> {
    return Promise.resolve(localDataProvider.getPortfolio());
  }

  getPortfolioTransactions(_params: Record<string, string | number | undefined>): Promise<Array<Record<string, unknown>>> {
    return Promise.resolve(localDataProvider.getPortfolioTransactions());
  }

  getAssets(): Promise<Array<Record<string, unknown>>> {
    return Promise.resolve([]);
  }

  getAssetWallets(_assetId: string): Promise<Array<Record<string, unknown>>> {
    return Promise.resolve([]);
  }

  getDeposits(): Promise<Array<Record<string, unknown>>> {
    return Promise.resolve([]);
  }

  getWithdrawals(): Promise<Array<Record<string, unknown>>> {
    return Promise.resolve([]);
  }

  getNotifications(_params: Record<string, string | number | undefined>): Promise<Record<string, unknown>> {
    return Promise.resolve(localDataProvider.getNotifications({}));
  }

  markNotificationRead(id: string): Promise<Record<string, unknown>> {
    return Promise.resolve(localDataProvider.markNotificationRead(id));
  }

  getProfile(): Promise<CustomerProfile> {
    return Promise.resolve(localDataProvider.getProfile() as unknown as CustomerProfile);
  }

  updateProfile(payload: UpdateCustomerProfileInput): Promise<CustomerProfile> {
    return Promise.resolve({ ...(localDataProvider.getProfile() as unknown as CustomerProfile), ...payload } as unknown as CustomerProfile);
  }

  getPreferences(): Promise<CustomerPreferences> {
    return Promise.resolve({} as CustomerPreferences);
  }

  updatePreferences(payload: UpdateCustomerPreferencesInput): Promise<CustomerPreferences> {
    return Promise.resolve(payload as CustomerPreferences);
  }

  getSecurity(): Promise<CustomerSecurity> {
    return Promise.resolve(localDataProvider.getSecurity() as unknown as CustomerSecurity);
  }

  updateSecurity(payload: UpdateCustomerSecurityInput): Promise<CustomerSecurity> {
    return Promise.resolve(payload as unknown as CustomerSecurity);
  }

  getActivity(): Promise<CustomerProfileActivity> {
    return Promise.resolve({ items: [], total: 0 } as CustomerProfileActivity);
  }
}

export const customerApi = new CustomerApi();

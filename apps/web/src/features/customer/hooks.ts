import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerApi } from './api';

export const customerKeys = {
  accounts: (filters: string) => ['customer', 'accounts', filters] as const,
  account: (id: string) => ['customer', 'account', id] as const,
  accountTransactions: (id: string, filters: string) =>
    ['customer', 'account-transactions', id, filters] as const,
  accountStatements: (id: string, filters: string) =>
    ['customer', 'account-statements', id, filters] as const,
  accountHolds: (id: string) => ['customer', 'account-holds', id] as const,
  transactions: (filters: string) => ['customer', 'transactions', filters] as const,
  transfers: (filters: string) => ['customer', 'transfers', filters] as const,
  beneficiaries: (filters: string) => ['customer', 'beneficiaries', filters] as const,
  cards: (filters: string) => ['customer', 'cards', filters] as const,
  card: (id: string) => ['customer', 'card', id] as const,
  cardTransactions: (id: string, filters: string) =>
    ['customer', 'card-transactions', id, filters] as const,
  portfolio: ['customer', 'portfolio'] as const,
  portfolioTransactions: (filters: string) =>
    ['customer', 'portfolio-transactions', filters] as const,
  assets: ['customer', 'assets'] as const,
  assetWallets: (id: string) => ['customer', 'asset-wallets', id] as const,
  deposits: ['customer', 'deposits'] as const,
  withdrawals: ['customer', 'withdrawals'] as const,
  notifications: (filters: string) => ['customer', 'notifications', filters] as const,
  profile: ['customer', 'profile'] as const,
  preferences: ['customer', 'preferences'] as const,
  security: ['customer', 'security'] as const,
  activity: ['customer', 'activity'] as const,
};

export const useCustomerAccounts = (params: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: customerKeys.accounts(JSON.stringify(params)),
    queryFn: () => customerApi.getAccounts(params),
    retry: 2,
  });

export const useCustomerAccount = (id: string) =>
  useQuery({
    queryKey: customerKeys.account(id),
    queryFn: () => customerApi.getAccount(id),
    enabled: id.length > 0,
    retry: 2,
  });

export const useCustomerAccountTransactions = (
  id: string,
  params: Record<string, string | number | undefined>,
) =>
  useQuery({
    queryKey: customerKeys.accountTransactions(id, JSON.stringify(params)),
    queryFn: () => customerApi.getAccountTransactions(id, params),
    enabled: id.length > 0,
    retry: 2,
  });

export const useCustomerAccountStatements = (
  id: string,
  params: Record<string, string | number | undefined>,
) =>
  useQuery({
    queryKey: customerKeys.accountStatements(id, JSON.stringify(params)),
    queryFn: () => customerApi.getAccountStatements(id, params),
    enabled: id.length > 0,
    retry: 2,
  });

export const useCustomerAccountHolds = (id: string) =>
  useQuery({
    queryKey: customerKeys.accountHolds(id),
    queryFn: () => customerApi.getAccountHolds(id),
    enabled: id.length > 0,
    retry: 2,
  });

export const useCustomerTransactions = (params: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: customerKeys.transactions(JSON.stringify(params)),
    queryFn: () => customerApi.getTransactions(params),
    retry: 2,
  });

export const useCustomerTransfers = (params: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: customerKeys.transfers(JSON.stringify(params)),
    queryFn: () => customerApi.getTransfers(params),
    retry: 2,
  });

export const useCustomerBeneficiaries = (params: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: customerKeys.beneficiaries(JSON.stringify(params)),
    queryFn: () => customerApi.getBeneficiaries(params),
    retry: 2,
  });

export const useCustomerCards = (params: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: customerKeys.cards(JSON.stringify(params)),
    queryFn: () => customerApi.getCards(params),
    retry: 2,
  });

export const useCustomerCardTransactions = (
  cardId: string,
  params: Record<string, string | number | undefined>,
) =>
  useQuery({
    queryKey: customerKeys.cardTransactions(cardId, JSON.stringify(params)),
    queryFn: () => customerApi.getCardTransactions(cardId, params),
    enabled: cardId.length > 0,
    retry: 2,
  });

export const useCustomerPortfolio = () =>
  useQuery({
    queryKey: customerKeys.portfolio,
    queryFn: () => customerApi.getPortfolio(),
    retry: 2,
  });

export const useCustomerPortfolioTransactions = (
  params: Record<string, string | number | undefined>,
) =>
  useQuery({
    queryKey: customerKeys.portfolioTransactions(JSON.stringify(params)),
    queryFn: () => customerApi.getPortfolioTransactions(params),
    retry: 2,
  });

export const useCustomerAssets = () =>
  useQuery({
    queryKey: customerKeys.assets,
    queryFn: () => customerApi.getAssets(),
    retry: 2,
  });

export const useCustomerAssetWallets = (assetId: string | null) =>
  useQuery({
    queryKey: customerKeys.assetWallets(assetId ?? ''),
    queryFn: () => customerApi.getAssetWallets(assetId ?? ''),
    enabled: Boolean(assetId),
    retry: 2,
  });

export const useCustomerDeposits = () =>
  useQuery({
    queryKey: customerKeys.deposits,
    queryFn: () => customerApi.getDeposits(),
    retry: 2,
  });

export const useCustomerWithdrawals = () =>
  useQuery({
    queryKey: customerKeys.withdrawals,
    queryFn: () => customerApi.getWithdrawals(),
    retry: 2,
  });

export const useCustomerNotifications = (params: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: customerKeys.notifications(JSON.stringify(params)),
    queryFn: () => customerApi.getNotifications(params),
    retry: 2,
  });

export const useCustomerProfile = () =>
  useQuery({
    queryKey: customerKeys.profile,
    queryFn: () => customerApi.getProfile(),
    retry: 2,
  });

export const useCustomerPreferences = () =>
  useQuery({
    queryKey: customerKeys.preferences,
    queryFn: () => customerApi.getPreferences(),
    retry: 2,
  });

export const useCustomerSecurity = () =>
  useQuery({
    queryKey: customerKeys.security,
    queryFn: () => customerApi.getSecurity(),
    retry: 2,
  });

export const useCustomerActivity = () =>
  useQuery({
    queryKey: customerKeys.activity,
    queryFn: () => customerApi.getActivity(),
    retry: 2,
  });

export const useCustomerMutations = () => {
  const queryClient = useQueryClient();

  const markNotificationRead = useMutation({
    mutationFn: (id: string) => customerApi.markNotificationRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['customer', 'notifications'] });
      const previous = queryClient.getQueriesData<Record<string, unknown>>({
        queryKey: ['customer', 'notifications'],
      });

      queryClient.setQueriesData<Record<string, unknown>>(
        { queryKey: ['customer', 'notifications'] },
        (old) => {
          if (!old) return old;
          const items = Array.isArray(old['items'])
            ? (old['items'] as Array<Record<string, unknown>>)
            : [];
          return {
            ...old,
            items: items.map((item) => {
              if (String(item['id']) !== id) return item;
              return { ...item, status: 'READ' };
            }),
          };
        },
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous?.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer', 'notifications'] });
    },
  });

  const cancelTransfer = useMutation({
    mutationFn: (args: { id: string; reason: string }) =>
      customerApi.cancelTransfer(args.id, args.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer', 'transfers'] });
    },
  });

  const createTransfer = useMutation({
    mutationFn: (payload: Record<string, unknown>) => customerApi.createTransfer(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer', 'transfers'] });
    },
  });

  const freezeCard = useMutation({
    mutationFn: (args: { id: string; reason?: string }) =>
      customerApi.freezeCard(args.id, args.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer', 'cards'] });
    },
  });

  const unfreezeCard = useMutation({
    mutationFn: (id: string) => customerApi.unfreezeCard(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer', 'cards'] });
    },
  });

  return {
    markNotificationRead,
    createTransfer,
    cancelTransfer,
    freezeCard,
    unfreezeCard,
  };
};

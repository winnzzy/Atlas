import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from './api';
import type { AdminSettings } from './types';

export const adminKeys = {
  overview: ['admin', 'overview'] as const,
  analytics: ['admin', 'analytics'] as const,
  customers: (q: string, limit: number, offset: number) =>
    ['admin', 'customers', q, limit, offset] as const,
  customerProfile: (userId: string) => ['admin', 'customer-profile', userId] as const,
  transactions: (filters: string) => ['admin', 'transactions', filters] as const,
  transfers: (filters: string) => ['admin', 'transfers', filters] as const,
  settlement: (filters: string) => ['admin', 'settlement', filters] as const,
  notificationQueue: (filters: string) => ['admin', 'notification-queue', filters] as const,
  templates: ['admin', 'notification-templates'] as const,
  auditLogs: (filters: string) => ['admin', 'audit-logs', filters] as const,
  securityEvents: (filters: string) => ['admin', 'security-events', filters] as const,
  adminActions: (filters: string) => ['admin', 'admin-actions', filters] as const,
  settings: ['admin', 'settings'] as const,
  report: (kind: string, from?: string, to?: string) =>
    ['admin', 'report', kind, from ?? '', to ?? ''] as const,
};

export const useAdminOverview = () =>
  useQuery({ queryKey: adminKeys.overview, queryFn: () => adminApi.getOverview(), retry: 2 });

export const useAdminAnalytics = () =>
  useQuery({ queryKey: adminKeys.analytics, queryFn: () => adminApi.getAnalytics(), retry: 2 });

export const useAdminCustomers = (q: string, limit: number, offset: number) =>
  useQuery({
    queryKey: adminKeys.customers(q, limit, offset),
    queryFn: () => adminApi.getCustomers({ q, limit, offset }),
    retry: 2,
  });

export const useCustomerProfile = (userId: string | null) =>
  useQuery({
    queryKey: adminKeys.customerProfile(userId ?? ''),
    queryFn: () => adminApi.getCustomerProfile(userId ?? ''),
    enabled: Boolean(userId),
    retry: 2,
  });

export const useAdminTransactions = (params: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: adminKeys.transactions(JSON.stringify(params)),
    queryFn: () => adminApi.getTransactions(params),
    retry: 2,
  });

export const useAdminTransfers = (params: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: adminKeys.transfers(JSON.stringify(params)),
    queryFn: () => adminApi.getTransfers(params),
    retry: 2,
  });

export const useSettlementView = (params: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: adminKeys.settlement(JSON.stringify(params)),
    queryFn: () => adminApi.getSettlementView(params),
  });

export const useNotificationQueue = (params: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: adminKeys.notificationQueue(JSON.stringify(params)),
    queryFn: () => adminApi.getNotificationQueue(params),
    retry: 2,
  });

export const useNotificationTemplates = () =>
  useQuery({
    queryKey: adminKeys.templates,
    queryFn: () => adminApi.getNotificationTemplates(),
    retry: 2,
  });

export const useAuditLogs = (params: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: adminKeys.auditLogs(JSON.stringify(params)),
    queryFn: () => adminApi.getAuditLogs(params),
  });

export const useSecurityEvents = (params: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: adminKeys.securityEvents(JSON.stringify(params)),
    queryFn: () => adminApi.getSecurityEvents(params),
  });

export const useAdminActions = (params: Record<string, string | number | undefined>) =>
  useQuery({
    queryKey: adminKeys.adminActions(JSON.stringify(params)),
    queryFn: () => adminApi.getAdminActions(params),
  });

export const useAdminSettings = () =>
  useQuery({ queryKey: adminKeys.settings, queryFn: () => adminApi.getSettings(), retry: 2 });

export const useAdminReport = (kind: string, from?: string, to?: string) =>
  useQuery({
    queryKey: adminKeys.report(kind, from, to),
    queryFn: () => adminApi.getReport(kind, from, to),
  });

export const useAdminMutation = () => {
  const queryClient = useQueryClient();

  const invalidateCore = async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'transfers'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'notification-queue'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] }),
    ]);
  };

  const applyAccountAction = useMutation({
    mutationFn: (args: {
      accountId: string;
      action: 'FREEZE' | 'UNFREEZE' | 'LOCK' | 'UNLOCK' | 'CLOSE' | 'ARCHIVE';
      reason?: string;
    }) => adminApi.applyAccountAction(args.accountId, args.action, args.reason),
    onMutate: async ({ accountId, action }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'accounts-table'] });
      const previous = queryClient.getQueriesData<Array<Record<string, unknown>>>({
        queryKey: ['admin', 'accounts-table'],
      });

      queryClient.setQueriesData<Array<Record<string, unknown>>>(
        { queryKey: ['admin', 'accounts-table'] },
        (old) => {
          if (!old) return old;
          return old.map((row) => {
            if (String(row['id']) !== accountId) return row;

            const nextStatus =
              action === 'FREEZE'
                ? 'FROZEN'
                : action === 'UNFREEZE'
                  ? 'ACTIVE'
                  : action === 'LOCK'
                    ? 'LOCKED'
                    : action === 'UNLOCK'
                      ? 'ACTIVE'
                      : action === 'CLOSE'
                        ? 'CLOSED'
                        : 'ARCHIVED';

            return { ...row, status: nextStatus };
          });
        },
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous?.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSuccess: invalidateCore,
  });

  const applyCardAction = useMutation({
    mutationFn: (args: {
      cardId: string;
      action: 'ISSUE' | 'FREEZE' | 'UNFREEZE' | 'REPLACE' | 'CANCEL' | 'REVEAL_PAN';
      reason?: string;
    }) => adminApi.applyCardAction(args.cardId, args.action, args.reason),
    onMutate: async ({ cardId, action }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'cards-table'] });
      const previous = queryClient.getQueriesData<Array<Record<string, unknown>>>({
        queryKey: ['admin', 'cards-table'],
      });

      queryClient.setQueriesData<Array<Record<string, unknown>>>(
        { queryKey: ['admin', 'cards-table'] },
        (old) => {
          if (!old) return old;
          return old.map((row) => {
            if (String(row['id']) !== cardId) return row;

            const nextStatus =
              action === 'FREEZE'
                ? 'FROZEN'
                : action === 'UNFREEZE'
                  ? 'ACTIVE'
                  : action === 'CANCEL'
                    ? 'CANCELLED'
                    : action === 'REPLACE'
                      ? 'REPLACED'
                      : String(row['status'] ?? 'UNKNOWN');

            return { ...row, status: nextStatus };
          });
        },
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous?.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSuccess: invalidateCore,
  });

  const applyCustomerAction = useMutation({
    mutationFn: (args: {
      userId: string;
      action: 'SUSPEND' | 'REACTIVATE' | 'FREEZE';
      reason?: string;
    }) => adminApi.applyCustomerAction(args.userId, args.action, args.reason),
    onMutate: async ({ userId, action }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'customers'] });
      const previous = queryClient.getQueriesData<{
        items: Array<Record<string, unknown>>;
        total: number;
      }>({ queryKey: ['admin', 'customers'] });

      queryClient.setQueriesData<{ items: Array<Record<string, unknown>>; total: number }>(
        { queryKey: ['admin', 'customers'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => {
              if (String(item['id']) !== userId) return item;
              return {
                ...item,
                status: action === 'REACTIVATE' ? 'ACTIVE' : 'SUSPENDED',
              };
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
    onSuccess: invalidateCore,
  });

  const retryTransfer = useMutation({
    mutationFn: (transferId: string) => adminApi.retryTransfer(transferId),
    onMutate: async (transferId) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'transfers'] });
      const previous = queryClient.getQueriesData<{ items: Array<Record<string, unknown>> }>({
        queryKey: ['admin', 'transfers'],
      });

      queryClient.setQueriesData<{ items: Array<Record<string, unknown>> }>(
        { queryKey: ['admin', 'transfers'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              String(item['id']) === transferId ? { ...item, status: 'PROCESSING' } : item,
            ),
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
    onSuccess: invalidateCore,
  });

  const cancelTransfer = useMutation({
    mutationFn: (args: { transferId: string; reason: string }) =>
      adminApi.cancelTransfer(args.transferId, args.reason),
    onSuccess: invalidateCore,
  });

  const retryNotification = useMutation({
    mutationFn: (notificationId: string) => adminApi.retryNotification(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'notification-queue'] });
      const previous = queryClient.getQueriesData<{ items: Array<Record<string, unknown>> }>({
        queryKey: ['admin', 'notification-queue'],
      });

      queryClient.setQueriesData<{ items: Array<Record<string, unknown>> }>(
        { queryKey: ['admin', 'notification-queue'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              String(item['id']) === notificationId ? { ...item, status: 'PROCESSING' } : item,
            ),
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
    onSuccess: invalidateCore,
  });

  const reverseTransaction = useMutation({
    mutationFn: (args: { transactionId: string; reason: string }) =>
      adminApi.reverseTransaction(args.transactionId, args.reason),
    onSuccess: invalidateCore,
  });

  const updateSettings = useMutation({
    mutationFn: (payload: Partial<AdminSettings>) => adminApi.updateSettings(payload),
    onSuccess: invalidateCore,
  });

  return {
    applyAccountAction,
    applyCardAction,
    applyCustomerAction,
    retryTransfer,
    cancelTransfer,
    retryNotification,
    reverseTransaction,
    updateSettings,
  };
};

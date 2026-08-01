'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Input } from '@atlas/ui';
import { Search } from 'lucide-react';
import { adminApi } from '@/features/admin/api';
import { AdminPage } from '@/features/admin/components/admin-page';
import { DataTable, type DataTableColumn } from '@/features/admin/components/data-table';
import { DetailDrawer } from '@/features/admin/components/detail-drawer';
import { QueryState } from '@/features/admin/components/query-state';
import { useDebouncedValue } from '@/features/admin/hooks/use-debounced-value';

type InvestmentRow = {
  readonly customerId: string;
  readonly profileId: string;
  readonly riskLevel: string;
  readonly kycStatus: string;
  readonly portfolioValue: number;
  readonly positionsCount: number;
  readonly cashBalance: number;
  readonly currencies: string;
  readonly raw: {
    readonly profile: Record<string, unknown>;
    readonly portfolio: Record<string, unknown>;
    readonly wallets: Array<Record<string, unknown>>;
    readonly pricing: Record<string, unknown>;
    readonly approvals: Array<Record<string, unknown>>;
  };
};

export default function InvestmentsPage(): React.JSX.Element {
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState<InvestmentRow | null>(null);
  const debouncedSearch = useDebouncedValue(search, 350);

  const investmentsQuery = useQuery({
    queryKey: ['admin', 'investments-table', debouncedSearch],
    queryFn: async () => {
      const customers = await adminApi.getCustomers({ q: debouncedSearch, limit: 20, offset: 0 });
      const rows = await Promise.all(
        customers.items.map(async (customer) => {
          const [customerInvestments, portfolio, wallets] = await Promise.all([
            adminApi.getCustomerInvestments(customer.id),
            adminApi.getPortfolio(customer.id),
            adminApi.listWallets({ userId: customer.id }),
          ]);

          const investmentItems = Array.isArray(customerInvestments)
            ? (customerInvestments as Array<Record<string, unknown>>)
            : [];
          const profileData = (investmentItems[0] ?? {}) as Record<string, unknown>;
          const portfolioData = portfolio as Record<string, unknown>;
          const walletItems = Array.isArray(wallets)
            ? (wallets as Array<Record<string, unknown>>)
            : [];

          return {
            customerId: customer.id,
            profileId: String(profileData['id'] ?? customer.id),
            riskLevel: String(profileData['riskLevel'] ?? 'UNKNOWN'),
            kycStatus: String(profileData['kycStatus'] ?? 'UNKNOWN'),
            portfolioValue: Number(portfolioData['totalValue'] ?? 0),
            positionsCount: Array.isArray(portfolioData['positions'])
              ? portfolioData['positions'].length
              : 0,
            cashBalance: Number(portfolioData['cashBalance'] ?? 0),
            currencies: Array.from(
              new Set(
                walletItems.map((wallet) => String(wallet['currency'] ?? '')).filter(Boolean),
              ),
            ).join(', '),
            raw: {
              profile: profileData,
              portfolio: portfolioData,
              wallets: walletItems,
              pricing: {},
              approvals: investmentItems,
            },
          } satisfies InvestmentRow;
        }),
      );

      return rows;
    },
    retry: 2,
  });

  const columns: Array<DataTableColumn<InvestmentRow>> = [
    {
      id: 'customerId',
      label: 'Customer',
      sortable: true,
      accessor: (row) => row.customerId,
      render: (row) => (
        <button
          type="button"
          className="font-medium text-[var(--color-text-primary)]"
          onClick={() => setSelected(row)}
        >
          {row.customerId}
        </button>
      ),
    },
    {
      id: 'riskLevel',
      label: 'Risk',
      sortable: true,
      accessor: (row) => row.riskLevel,
      render: (row) => row.riskLevel,
    },
    {
      id: 'kycStatus',
      label: 'KYC',
      sortable: true,
      accessor: (row) => row.kycStatus,
      render: (row) => (
        <Badge variant={row.kycStatus === 'APPROVED' ? 'success' : 'warning'}>
          {row.kycStatus}
        </Badge>
      ),
    },
    {
      id: 'portfolioValue',
      label: 'Portfolio',
      sortable: true,
      accessor: (row) => row.portfolioValue,
      render: (row) => row.portfolioValue.toLocaleString(),
    },
    {
      id: 'positionsCount',
      label: 'Positions',
      sortable: true,
      accessor: (row) => row.positionsCount,
      render: (row) => String(row.positionsCount),
    },
    {
      id: 'cashBalance',
      label: 'Cash',
      sortable: true,
      accessor: (row) => row.cashBalance,
      render: (row) => row.cashBalance.toLocaleString(),
    },
    {
      id: 'currencies',
      label: 'Wallet Currencies',
      accessor: (row) => row.currencies,
      render: (row) => row.currencies || '-',
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            void adminApi.applyInvestmentAction({ customerId: row.customerId, action: 'APPROVE' });
          }}
        >
          Approve
        </Button>
      ),
    },
  ];

  return (
    <AdminPage
      title="Investments"
      description="Investment profile, portfolio, wallet, and approval operations"
      actions={
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 w-72 pl-8 text-xs"
            placeholder="Search by customer"
          />
        </div>
      }
    >
      <QueryState
        isLoading={investmentsQuery.isLoading}
        isError={investmentsQuery.isError}
        onRetry={() => void investmentsQuery.refetch()}
      >
        <DataTable rows={investmentsQuery.data ?? []} columns={columns} pageSize={20} />
      </QueryState>

      <DetailDrawer
        open={Boolean(selected)}
        title="Investment Details"
        onClose={() => setSelected(null)}
        sections={[
          { title: 'Profile', value: selected?.raw.profile ?? {} },
          { title: 'Portfolio', value: selected?.raw.portfolio ?? {} },
          { title: 'Wallets', value: selected?.raw.wallets ?? [] },
          { title: 'Approvals', value: selected?.raw.approvals ?? [] },
          { title: 'Pricing Catalog', value: selected?.raw.pricing ?? {} },
        ]}
      />
    </AdminPage>
  );
}

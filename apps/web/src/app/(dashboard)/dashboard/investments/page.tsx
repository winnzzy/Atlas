'use client';

import React from 'react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@atlas/ui';
import { QueryState } from '@/features/admin/components/query-state';
import { DataTable, type DataTableColumn } from '@/features/admin/components/data-table';
import { DetailDrawer } from '@/features/admin/components/detail-drawer';
import {
  useCustomerAssetWallets,
  useCustomerAssets,
  useCustomerDeposits,
  useCustomerPortfolio,
  useCustomerPortfolioTransactions,
  useCustomerWithdrawals,
} from '@/features/customer/hooks';

type GenericRow = Record<string, unknown>;

const pickItems = (value: unknown): Array<GenericRow> => {
  if (Array.isArray(value)) {
    return value.filter(
      (entry): entry is GenericRow => Boolean(entry) && typeof entry === 'object',
    );
  }
  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as Record<string, unknown>)['items'])
  ) {
    return ((value as Record<string, unknown>)['items'] as unknown[]).filter(
      (entry): entry is GenericRow => Boolean(entry) && typeof entry === 'object',
    );
  }
  return [];
};

export default function DashboardInvestmentsPage(): React.JSX.Element {
  const [selectedAssetId, setSelectedAssetId] = React.useState<string | null>(null);

  const portfolioQuery = useCustomerPortfolio();
  const portfolioTransactionsQuery = useCustomerPortfolioTransactions({ limit: 100 });
  const assetsQuery = useCustomerAssets();
  const walletsQuery = useCustomerAssetWallets(selectedAssetId);
  const depositsQuery = useCustomerDeposits();
  const withdrawalsQuery = useCustomerWithdrawals();

  const assetColumns: Array<DataTableColumn<GenericRow>> = [
    {
      id: 'id',
      label: 'Asset',
      accessor: (row) => String(row['id'] ?? ''),
      render: (row) => (
        <button
          type="button"
          className="font-mono text-[11px] text-[var(--color-text-primary)]"
          onClick={() => setSelectedAssetId(String(row['id'] ?? ''))}
        >
          {String(row['id'] ?? '-')}
        </button>
      ),
    },
    {
      id: 'symbol',
      label: 'Symbol',
      accessor: (row) => String(row['symbol'] ?? ''),
      render: (row) => String(row['symbol'] ?? '-'),
    },
    {
      id: 'name',
      label: 'Name',
      accessor: (row) => String(row['name'] ?? ''),
      render: (row) => String(row['name'] ?? '-'),
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (row) => String(row['status'] ?? ''),
      render: (row) => (
        <Badge variant={String(row['status']) === 'ACTIVE' ? 'success' : 'warning'}>
          {String(row['status'] ?? '-')}
        </Badge>
      ),
    },
  ];

  const txColumns: Array<DataTableColumn<GenericRow>> = [
    {
      id: 'id',
      label: 'ID',
      accessor: (row) => String(row['id'] ?? ''),
      render: (row) => String(row['id'] ?? '-'),
    },
    {
      id: 'type',
      label: 'Type',
      accessor: (row) => String(row['type'] ?? ''),
      render: (row) => String(row['type'] ?? '-'),
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (row) => String(row['status'] ?? ''),
      render: (row) => String(row['status'] ?? '-'),
    },
    {
      id: 'amount',
      label: 'Amount',
      align: 'right',
      accessor: (row) => Number(row['amount'] ?? 0),
      render: (row) => String(row['amount'] ?? '-'),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Investments</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Portfolio, holdings, wallets, deposits, withdrawals, and transaction visibility.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Portfolio Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryState
            isLoading={portfolioQuery.isLoading}
            isError={portfolioQuery.isError}
            onRetry={() => void portfolioQuery.refetch()}
          >
            <pre className="overflow-auto text-xs text-[var(--color-text-secondary)]">
              {JSON.stringify(portfolioQuery.data ?? {}, null, 2)}
            </pre>
          </QueryState>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryState
              isLoading={assetsQuery.isLoading}
              isError={assetsQuery.isError}
              onRetry={() => void assetsQuery.refetch()}
            >
              <DataTable rows={pickItems(assetsQuery.data)} columns={assetColumns} pageSize={10} />
            </QueryState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Portfolio Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryState
              isLoading={portfolioTransactionsQuery.isLoading}
              isError={portfolioTransactionsQuery.isError}
              onRetry={() => void portfolioTransactionsQuery.refetch()}
            >
              <DataTable
                rows={pickItems(portfolioTransactionsQuery.data)}
                columns={txColumns}
                pageSize={10}
              />
            </QueryState>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryState
              isLoading={depositsQuery.isLoading}
              isError={depositsQuery.isError}
              onRetry={() => void depositsQuery.refetch()}
            >
              <pre className="overflow-auto text-xs text-[var(--color-text-secondary)]">
                {JSON.stringify(pickItems(depositsQuery.data), null, 2)}
              </pre>
            </QueryState>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryState
              isLoading={withdrawalsQuery.isLoading}
              isError={withdrawalsQuery.isError}
              onRetry={() => void withdrawalsQuery.refetch()}
            >
              <pre className="overflow-auto text-xs text-[var(--color-text-secondary)]">
                {JSON.stringify(pickItems(withdrawalsQuery.data), null, 2)}
              </pre>
            </QueryState>
          </CardContent>
        </Card>
      </div>

      <DetailDrawer
        open={Boolean(selectedAssetId)}
        title="Asset Wallet Addresses"
        onClose={() => setSelectedAssetId(null)}
        sections={[
          { title: 'Asset ID', value: selectedAssetId ?? '' },
          { title: 'Wallet Addresses', value: pickItems(walletsQuery.data) },
        ]}
      />
    </div>
  );
}

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge, Button, Input } from '@atlas/ui';
import { QueryState } from '@/features/admin/components/query-state';
import { DataTable, type DataTableColumn } from '@/features/admin/components/data-table';
import { useDebouncedValue } from '@/features/admin/hooks/use-debounced-value';
import {
  useCustomerBeneficiaries,
  useCustomerMutations,
  useCustomerTransfers,
} from '@/features/customer/hooks';

const transferSchema = z.object({
  sourceAccountId: z.string().min(1, 'Source account is required'),
  beneficiaryId: z.string().min(1, 'Beneficiary is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  currency: z.string().min(3, 'Currency is required'),
  type: z.string().min(1, 'Type is required'),
  reference: z.string().min(1, 'Reference is required'),
});

type TransferForm = z.infer<typeof transferSchema>;
type TransferRow = Record<string, unknown>;

const pickItems = (value: unknown): Array<TransferRow> => {
  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as Record<string, unknown>)['items'])
  ) {
    return ((value as Record<string, unknown>)['items'] as unknown[]).filter(
      (entry): entry is TransferRow => Boolean(entry) && typeof entry === 'object',
    );
  }
  return [];
};

export default function DashboardTransfersPage(): React.JSX.Element {
  const [statusInput, setStatusInput] = React.useState('');
  const [typeInput, setTypeInput] = React.useState('');
  const status = useDebouncedValue(statusInput, 300);
  const type = useDebouncedValue(typeInput, 300);

  const transfersQuery = useCustomerTransfers({ status, type, limit: 100 });
  const beneficiariesQuery = useCustomerBeneficiaries({ limit: 50 });
  const { createTransfer, cancelTransfer } = useCustomerMutations();

  const form = useForm<TransferForm>({
    defaultValues: {
      sourceAccountId: '',
      beneficiaryId: '',
      amount: 0,
      currency: 'USD',
      type: 'INTERNAL',
      reference: '',
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    const parsed = transferSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === 'string') {
          form.setError(path as keyof TransferForm, { message: issue.message });
        }
      });
      return;
    }

    createTransfer.mutate({
      sourceAccountId: values.sourceAccountId,
      beneficiaryId: values.beneficiaryId,
      amount: values.amount,
      currency: values.currency,
      type: values.type,
      reference: values.reference,
    });
  });

  const columns: Array<DataTableColumn<TransferRow>> = [
    {
      id: 'reference',
      label: 'Reference',
      accessor: (row) => String(row['reference'] ?? row['id'] ?? ''),
      render: (row) => (
        <span className="font-mono text-[11px]">
          {String(row['reference'] ?? row['id'] ?? '-')}
        </span>
      ),
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
      render: (row) => (
        <Badge variant={String(row['status']) === 'COMPLETED' ? 'success' : 'warning'}>
          {String(row['status'] ?? '-')}
        </Badge>
      ),
    },
    {
      id: 'amount',
      label: 'Amount',
      align: 'right',
      accessor: (row) => Number(row['amount'] ?? 0),
      render: (row) => `${row['amount'] ?? '-'} ${row['currency'] ?? ''}`,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            cancelTransfer.mutate({ id: String(row['id'] ?? ''), reason: 'user cancellation' })
          }
        >
          Cancel
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Transfers</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Create and manage transfers with server-side filtering and retry-safe mutations.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="grid gap-2 rounded-lg border border-[var(--color-border-default)] p-3 md:grid-cols-6"
      >
        <Input
          aria-label="Source account"
          placeholder="Source Account"
          {...form.register('sourceAccountId')}
        />
        <Input
          aria-label="Beneficiary"
          placeholder="Beneficiary"
          {...form.register('beneficiaryId')}
        />
        <Input
          aria-label="Amount"
          type="number"
          step="0.01"
          placeholder="Amount"
          {...form.register('amount')}
        />
        <Input aria-label="Currency" placeholder="Currency" {...form.register('currency')} />
        <Input aria-label="Type" placeholder="Type" {...form.register('type')} />
        <div className="flex items-center gap-2">
          <Input aria-label="Reference" placeholder="Reference" {...form.register('reference')} />
          <Button type="submit" size="sm" disabled={createTransfer.isPending}>
            Create
          </Button>
        </div>
      </form>

      <div className="grid gap-1 text-xs text-[var(--color-danger-700)]">
        {Object.entries(form.formState.errors).map(([field, error]) => (
          <p key={field}>{error?.message}</p>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={typeInput}
          onChange={(event) => setTypeInput(event.target.value)}
          className="h-9 w-44 text-xs"
          placeholder="Type"
          aria-label="Filter transfer type"
        />
        <Input
          value={statusInput}
          onChange={(event) => setStatusInput(event.target.value)}
          className="h-9 w-44 text-xs"
          placeholder="Status"
          aria-label="Filter transfer status"
        />
        <span className="text-xs text-[var(--color-text-secondary)]">
          Beneficiaries: {pickItems(beneficiariesQuery.data).length}
        </span>
      </div>

      <QueryState
        isLoading={transfersQuery.isLoading}
        isError={transfersQuery.isError}
        onRetry={() => void transfersQuery.refetch()}
      >
        <DataTable rows={pickItems(transfersQuery.data)} columns={columns} pageSize={20} />
      </QueryState>
    </div>
  );
}

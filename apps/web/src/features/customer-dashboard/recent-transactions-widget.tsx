'use client';

import React, { startTransition, useDeferredValue, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@atlas/ui';
import { formatCurrency, formatDateTime } from './formatters';
import type { TransactionRecord } from './types';

const pageSize = 5;

function getStatusVariant(status: TransactionRecord['status']) {
  if (status === 'Posted' || status === 'Completed') return 'success';
  if (status === 'Processing') return 'warning';
  return 'info';
}

export interface RecentTransactionsWidgetProps {
  readonly transactions: readonly TransactionRecord[];
}

export default function RecentTransactionsWidget({ transactions }: RecentTransactionsWidgetProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = deferredSearchTerm.trim().toLowerCase();
    if (!normalizedQuery) return transactions;

    return transactions.filter((transaction) => {
      return [
        transaction.description,
        transaction.category,
        transaction.account,
        transaction.status,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [deferredSearchTerm, transactions]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const currentPageTransactions = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    return filteredTransactions.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredTransactions, totalPages]);

  const paginationLabel =
    filteredTransactions.length === transactions.length
      ? `Page ${currentPage} of ${totalPages}`
      : `Filtered results: ${filteredTransactions.length} transactions`;

  return (
    <section aria-labelledby="recent-transactions-title">
      <Card variant="elevated" className="bg-[var(--color-bg-primary)]">
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle id="recent-transactions-title">Recent Transactions</CardTitle>
            <CardDescription>
              Searchable ledger view with placeholder controls for filters and pagination.
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl">
            <Input
              aria-label="Search recent transactions"
              value={searchTerm}
              onChange={(event) => {
                const nextValue = event.currentTarget.value;
                startTransition(() => {
                  setSearchTerm(nextValue);
                  setCurrentPage(1);
                });
              }}
              placeholder="Search description, category, status, or account"
              leftAddon={<Search className="h-4 w-4" />}
            />
            <Button
              variant="outline"
              leftIcon={<Filter />}
              disabled
              aria-label="Filter transactions placeholder"
            >
              Filter Placeholder
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">Recent account transactions</caption>
              <thead>
                <tr className="border-b border-[var(--color-border-default)] text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                  <th className="px-0 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Description</th>
                  <th className="hidden px-3 py-3 font-medium md:table-cell">Category</th>
                  <th className="px-3 py-3 font-medium">Amount</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="hidden px-3 py-3 font-medium lg:table-cell">Account</th>
                </tr>
              </thead>
              <tbody>
                {currentPageTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-[var(--color-border-subtle)] last:border-b-0"
                  >
                    <td className="px-0 py-4 align-top text-[var(--color-text-secondary)]">
                      {formatDateTime(transaction.bookedAt)}
                    </td>
                    <td className="px-3 py-4 align-top">
                      <p className="font-semibold text-[var(--color-text-primary)]">
                        {transaction.description}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)] md:hidden">
                        {transaction.category}
                      </p>
                    </td>
                    <td className="hidden px-3 py-4 align-top text-[var(--color-text-secondary)] md:table-cell">
                      {transaction.category}
                    </td>
                    <td className="px-3 py-4 align-top font-semibold text-[var(--color-text-primary)]">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-3 py-4 align-top">
                      <Badge variant={getStatusVariant(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </td>
                    <td className="hidden px-3 py-4 align-top text-[var(--color-text-secondary)] lg:table-cell">
                      {transaction.account}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-[var(--color-border-default)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--color-text-secondary)]">{paginationLabel}</p>
            <div
              className="flex items-center gap-2"
              aria-label="Transactions pagination placeholder"
            >
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ChevronLeft />}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((previousPage) => Math.max(1, previousPage - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ChevronRight />}
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((previousPage) => Math.min(totalPages, previousPage + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

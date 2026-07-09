'use client';

import * as React from 'react';
import { cn } from '../lib/cn';
import { AmountDisplay } from './amount-display';
import { CategoryBadge } from './category-badge';
import { ArrowUpRight, ArrowDownLeft, Clock, XCircle, RotateCcw } from 'lucide-react';
import type { Transaction } from '../types/banking.types';

interface TransactionRowProps {
  readonly transaction: Transaction;
  readonly onClick?: (transaction: Transaction) => void;
  readonly className?: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; class: string }> = {
  pending: { icon: Clock, class: 'text-yellow-500' },
  failed: { icon: XCircle, class: 'text-red-500' },
  cancelled: { icon: XCircle, class: 'text-muted-foreground' },
  reversed: { icon: RotateCcw, class: 'text-blue-500' },
};

export function TransactionRow({ transaction, onClick, className }: TransactionRowProps) {
  const isCredit = transaction.direction === 'credit';
  const statusCfg = transaction.status !== 'completed' ? STATUS_CONFIG[transaction.status] : null;

  return (
    <button
      type="button"
      onClick={() => onClick?.(transaction)}
      className={cn(
        'flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left transition-colors hover:bg-muted/50',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          isCredit ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30',
        )}
      >
        {isCredit ? (
          <ArrowDownLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {transaction.merchantName ?? transaction.description}
          </p>
          {statusCfg && <statusCfg.icon className={cn('h-3.5 w-3.5', statusCfg.class)} />}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <CategoryBadge category={transaction.category} />
          <span className="text-xs text-muted-foreground">
            {new Date(transaction.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      <AmountDisplay money={transaction.money} size="sm" showSign colorize className="shrink-0" />
    </button>
  );
}

interface TransactionListProps {
  readonly transactions: Transaction[];
  readonly onTransactionClick?: (transaction: Transaction) => void;
  readonly emptyMessage?: string;
  readonly className?: string;
}

export function TransactionList({
  transactions,
  onTransactionClick,
  emptyMessage = 'No transactions found',
  className,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12 text-muted-foreground',
          className,
        )}
      >
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('divide-y divide-border', className)}>
      {transactions.map((tx) => (
        <TransactionRow key={tx.id} transaction={tx} onClick={onTransactionClick} />
      ))}
    </div>
  );
}

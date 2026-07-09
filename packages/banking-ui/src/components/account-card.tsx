'use client';

import * as React from 'react';
import { cn } from '../lib/cn';
import { AmountDisplay } from './amount-display';
import { maskAccountNumber } from '../utils/format';
import { CreditCard, Landmark, PiggyBank, TrendingUp, Check } from 'lucide-react';
import type { BankAccount, AccountType } from '../types/banking.types';

const ACCOUNT_ICONS: Record<AccountType, React.ElementType> = {
  checking: Landmark,
  savings: PiggyBank,
  investment: TrendingUp,
  crypto: CreditCard,
};

interface AccountCardProps {
  readonly account: BankAccount;
  readonly selected?: boolean;
  readonly onClick?: (account: BankAccount) => void;
  readonly className?: string;
}

export function AccountCard({ account, selected = false, onClick, className }: AccountCardProps) {
  const Icon = ACCOUNT_ICONS[account.type] ?? Landmark;

  return (
    <button
      type="button"
      onClick={() => onClick?.(account)}
      className={cn(
        'relative flex w-full items-start gap-4 rounded-xl border bg-card p-4 text-left shadow-sm transition-all',
        selected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50 hover:shadow-md',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {selected && (
        <div className="absolute right-3 top-3">
          <Check className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">{account.name}</p>
        <p className="text-xs text-muted-foreground">{maskAccountNumber(account.accountNumber)}</p>
        <div className="flex items-center gap-2 pt-1">
          <AmountDisplay money={account.balance} size="sm" />
          <span className="text-xs capitalize text-muted-foreground">· {account.type}</span>
        </div>
      </div>
    </button>
  );
}

interface AccountSelectorProps {
  readonly accounts: BankAccount[];
  readonly selectedId?: string;
  readonly onSelect: (account: BankAccount) => void;
  readonly className?: string;
}

export function AccountSelector({
  accounts,
  selectedId,
  onSelect,
  className,
}: AccountSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          selected={account.id === selectedId}
          onClick={onSelect}
        />
      ))}
    </div>
  );
}

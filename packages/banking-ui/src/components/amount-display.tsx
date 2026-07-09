'use client';

import { cn } from '../lib/cn';
import { formatMoney, formatCrypto, getAmountSizeClasses } from '../utils/format';
import type { Money, CryptoSymbol, AmountSize } from '../types/banking.types';

interface AmountDisplayProps {
  readonly money: Money;
  readonly size?: AmountSize;
  readonly showSign?: boolean;
  readonly compact?: boolean;
  readonly colorize?: boolean;
  readonly className?: string;
}

/**
 * Displays a fiat currency amount with proper formatting.
 * Optionally colorizes positive/negative values.
 */
export function AmountDisplay({
  money,
  size = 'md',
  showSign = false,
  compact = false,
  colorize = false,
  className,
}: AmountDisplayProps) {
  const formatted = formatMoney(money, { showSign, compact });

  const colorClass = colorize
    ? money.amount > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : money.amount < 0
        ? 'text-red-600 dark:text-red-400'
        : ''
    : '';

  return (
    <span
      className={cn('tabular-nums', getAmountSizeClasses(size), colorClass, className)}
      aria-label={`${money.amount} ${money.currency}`}
    >
      {formatted}
    </span>
  );
}

interface CryptoAmountDisplayProps {
  readonly amount: number;
  readonly symbol: CryptoSymbol;
  readonly usdValue?: Money;
  readonly size?: AmountSize;
  readonly className?: string;
}

/**
 * Displays a cryptocurrency amount with optional USD equivalent.
 */
export function CryptoAmountDisplay({
  amount,
  symbol,
  usdValue,
  size = 'md',
  className,
}: CryptoAmountDisplayProps) {
  return (
    <span className={cn('inline-flex flex-col', className)}>
      <span className={cn('tabular-nums', getAmountSizeClasses(size))}>
        {formatCrypto(amount, symbol)}
      </span>
      {usdValue && (
        <span className="text-xs text-muted-foreground tabular-nums">
          ≈ {formatMoney(usdValue)}
        </span>
      )}
    </span>
  );
}

import type { FiatCurrency, CryptoSymbol, Money, AmountSize } from '../types/banking.types';

const CURRENCY_SYMBOLS: Record<FiatCurrency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
};

const CRYPTO_DECIMALS: Record<CryptoSymbol, number> = {
  BTC: 8,
  ETH: 6,
  USDC: 2,
  USDT: 2,
  SOL: 4,
  ADA: 2,
};

/**
 * Format a fiat currency amount (e.g. $1,234.56)
 */
export function formatMoney(
  money: Money,
  options?: { showSign?: boolean; compact?: boolean },
): string {
  const { showSign = false, compact = false } = options ?? {};
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: money.currency,
    notation: compact ? 'compact' : 'standard',
    compactDisplay: 'short',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let formatted = formatter.format(Math.abs(money.amount));
  if (showSign && money.amount > 0) formatted = `+${formatted}`;
  if (money.amount < 0) formatted = `-${formatted}`;

  return formatted;
}

/**
 * Format a crypto amount with proper decimal precision (e.g. 0.00123456 BTC)
 */
export function formatCrypto(amount: number, symbol: CryptoSymbol): string {
  const decimals = CRYPTO_DECIMALS[symbol] ?? 4;
  return `${amount.toFixed(decimals)} ${symbol}`;
}

/**
 * Format a percentage (e.g. +2.45%)
 */
export function formatPercent(value: number, decimals = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Get the CSS class size mapping for AmountDisplay
 */
export function getAmountSizeClasses(size: AmountSize): string {
  const sizeMap: Record<AmountSize, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl font-semibold',
    xl: 'text-3xl font-bold',
  };
  return sizeMap[size];
}

/**
 * Get currency symbol for a fiat currency code
 */
export function getCurrencySymbol(currency: FiatCurrency): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

/**
 * Mask an account number showing only last 4 digits
 */
export function maskAccountNumber(accountNumber: string): string {
  const last4 = accountNumber.slice(-4);
  return `•••• ${last4}`;
}

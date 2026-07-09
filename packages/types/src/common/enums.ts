/**
 * Application-wide enums.
 */

export const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SUPPORT: 'SUPPORT',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AccountStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const Currency = {
  USD: 'USD',
  BTC: 'BTC',
  ETH: 'ETH',
  USDC: 'USDC',
  USDT: 'USDT',
} as const;

export type Currency = (typeof Currency)[keyof typeof Currency];

export const TransactionType = {
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  TRANSFER: 'TRANSFER',
  CRYPTO_PURCHASE: 'CRYPTO_PURCHASE',
  CRYPTO_SELL: 'CRYPTO_SELL',
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const TransactionStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const Environment = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

export type Environment = (typeof Environment)[keyof typeof Environment];

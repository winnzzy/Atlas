/**
 * Branded types for type-safe identifiers.
 */

declare const __brand: unique symbol;

type Brand<T, TBrand extends string> = T & {
  readonly [__brand]: TBrand;
};

export type UserId = Brand<string, 'UserId'>;
export type AccountId = Brand<string, 'AccountId'>;
export type TransactionId = Brand<string, 'TransactionId'>;
export type SessionId = Brand<string, 'SessionId'>;

/**
 * Utility to create branded IDs.
 */
export function createId<T extends string>(value: string): Brand<string, T> {
  return value as Brand<string, T>;
}

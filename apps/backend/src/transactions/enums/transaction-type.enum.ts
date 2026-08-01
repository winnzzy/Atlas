/**
 * All supported transaction types in the Atlas banking platform.
 * Each type maps to a specific business workflow and ledger posting strategy.
 */
export enum TransactionType {
  // Core Banking
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  INTERNAL_TRANSFER = 'INTERNAL_TRANSFER',

  // ACH
  ACH_CREDIT = 'ACH_CREDIT',
  ACH_DEBIT = 'ACH_DEBIT',

  // Wire
  WIRE_DOMESTIC = 'WIRE_DOMESTIC',
  WIRE_INTERNATIONAL = 'WIRE_INTERNATIONAL',

  // International
  SWIFT = 'SWIFT',

  // Card
  CARD_PURCHASE = 'CARD_PURCHASE',
  CARD_REFUND = 'CARD_REFUND',
  CARD_AUTHORIZATION = 'CARD_AUTHORIZATION',
  CARD_CAPTURE = 'CARD_CAPTURE',

  // Crypto
  CRYPTO_DEPOSIT = 'CRYPTO_DEPOSIT',
  CRYPTO_WITHDRAWAL = 'CRYPTO_WITHDRAWAL',

  // Payroll & Interest
  PAYROLL_DEPOSIT = 'PAYROLL_DEPOSIT',
  INTEREST_CREDIT = 'INTEREST_CREDIT',

  // Fees & Adjustments
  FEE = 'FEE',
  ADJUSTMENT = 'ADJUSTMENT',

  // Lending
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT',
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',

  // Investment
  INVESTMENT_PURCHASE = 'INVESTMENT_PURCHASE',
  INVESTMENT_SALE = 'INVESTMENT_SALE',

  // Reversal
  REVERSAL = 'REVERSAL',
}

/**
 * Transaction types that require a destination account (credit flows).
 */
export const CREDIT_TRANSACTION_TYPES = new Set<TransactionType>([
  TransactionType.DEPOSIT,
  TransactionType.ACH_CREDIT,
  TransactionType.PAYROLL_DEPOSIT,
  TransactionType.INTEREST_CREDIT,
  TransactionType.CARD_REFUND,
  TransactionType.CRYPTO_DEPOSIT,
  TransactionType.LOAN_DISBURSEMENT,
  TransactionType.INVESTMENT_SALE,
]);

/**
 * Transaction types that require a source account (debit flows).
 */
export const DEBIT_TRANSACTION_TYPES = new Set<TransactionType>([
  TransactionType.WITHDRAWAL,
  TransactionType.ACH_DEBIT,
  TransactionType.WIRE_DOMESTIC,
  TransactionType.WIRE_INTERNATIONAL,
  TransactionType.SWIFT,
  TransactionType.CARD_PURCHASE,
  TransactionType.CARD_AUTHORIZATION,
  TransactionType.CARD_CAPTURE,
  TransactionType.CRYPTO_WITHDRAWAL,
  TransactionType.FEE,
  TransactionType.LOAN_REPAYMENT,
  TransactionType.INVESTMENT_PURCHASE,
]);

/**
 * Transaction types that require both source and destination accounts.
 */
export const TRANSFER_TRANSACTION_TYPES = new Set<TransactionType>([
  TransactionType.INTERNAL_TRANSFER,
]);

/**
 * Maps transaction types to their corresponding ledger posting types.
 */
export const TRANSACTION_TYPE_TO_LEDGER_POSTING: Record<string, string> = {
  [TransactionType.DEPOSIT]: 'DEPOSIT',
  [TransactionType.WITHDRAWAL]: 'WITHDRAWAL',
  [TransactionType.INTERNAL_TRANSFER]: 'TRANSFER',
  [TransactionType.ACH_CREDIT]: 'ACH',
  [TransactionType.ACH_DEBIT]: 'ACH',
  [TransactionType.WIRE_DOMESTIC]: 'WIRE',
  [TransactionType.WIRE_INTERNATIONAL]: 'WIRE',
  [TransactionType.SWIFT]: 'SWIFT',
  [TransactionType.CARD_PURCHASE]: 'CARD_AUTHORIZATION',
  [TransactionType.CARD_REFUND]: 'CARD_REFUND',
  [TransactionType.CARD_AUTHORIZATION]: 'CARD_AUTHORIZATION',
  [TransactionType.CARD_CAPTURE]: 'CARD_CAPTURE',
  [TransactionType.CRYPTO_DEPOSIT]: 'CRYPTO_DEPOSIT',
  [TransactionType.CRYPTO_WITHDRAWAL]: 'CRYPTO_WITHDRAWAL',
  [TransactionType.PAYROLL_DEPOSIT]: 'DEPOSIT',
  [TransactionType.INTEREST_CREDIT]: 'INTEREST',
  [TransactionType.FEE]: 'FEE',
  [TransactionType.ADJUSTMENT]: 'ADJUSTMENT',
  [TransactionType.LOAN_DISBURSEMENT]: 'LOAN_DISBURSEMENT',
  [TransactionType.LOAN_REPAYMENT]: 'LOAN_REPAYMENT',
  [TransactionType.INVESTMENT_PURCHASE]: 'INVESTMENT_PURCHASE',
  [TransactionType.INVESTMENT_SALE]: 'INVESTMENT_SALE',
  [TransactionType.REVERSAL]: 'ADJUSTMENT',
};
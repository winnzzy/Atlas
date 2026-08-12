export enum TransferType {
  ACH_CREDIT = 'ACH_CREDIT',
  ACH_DEBIT = 'ACH_DEBIT',
  SAME_DAY_ACH = 'SAME_DAY_ACH',
  DOMESTIC_WIRE = 'DOMESTIC_WIRE',
  INTERNATIONAL_WIRE = 'INTERNATIONAL_WIRE',
  SWIFT = 'SWIFT',
  INTERNAL = 'INTERNAL',
  SCHEDULED = 'SCHEDULED',
  RECURRING = 'RECURRING',
  FUTURE_DATED = 'FUTURE_DATED',
  PAYROLL_BATCH = 'PAYROLL_BATCH',
}

// Maps an outbound customer transfer to the transaction posted on the SOURCE
// account. Customer-initiated ACH sends move money OUT, so they debit the source
// (ACH_DEBIT) — the transaction domain names types from the source account's view.
export const TRANSFER_TO_TRANSACTION_TYPE: Record<TransferType, string> = {
  [TransferType.ACH_CREDIT]: 'ACH_DEBIT',
  [TransferType.ACH_DEBIT]: 'ACH_DEBIT',
  [TransferType.SAME_DAY_ACH]: 'ACH_DEBIT',
  [TransferType.DOMESTIC_WIRE]: 'WIRE_DOMESTIC',
  [TransferType.INTERNATIONAL_WIRE]: 'WIRE_INTERNATIONAL',
  [TransferType.SWIFT]: 'SWIFT',
  [TransferType.INTERNAL]: 'INTERNAL_TRANSFER',
  [TransferType.SCHEDULED]: 'ACH_CREDIT',
  [TransferType.RECURRING]: 'ACH_CREDIT',
  [TransferType.FUTURE_DATED]: 'ACH_CREDIT',
  [TransferType.PAYROLL_BATCH]: 'PAYROLL_DEPOSIT',
};
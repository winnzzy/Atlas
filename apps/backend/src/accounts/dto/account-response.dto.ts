import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

// String literal types matching Prisma enums to avoid dependency on generated client
export type AccountStatusType =
  'PENDING' | 'ACTIVE' | 'RESTRICTED' | 'FROZEN' | 'LOCKED' | 'DORMANT' | 'CLOSED' | 'ARCHIVED';
export type AccountTypeType = 'CHECKING' | 'SAVINGS' | 'BUSINESS' | 'INVESTMENT_CASH';
export type FreezeReasonType =
  | 'SUSPICIOUS_ACTIVITY'
  | 'FRAUD_ALERT'
  | 'COURT_ORDER'
  | 'REGULATORY_HOLD'
  | 'CUSTOMER_REQUEST'
  | 'INTERNAL_REVIEW';
export type ClosureReasonType =
  'USER_REQUEST' | 'ADMIN_ACTION' | 'COMPLIANCE' | 'INACTIVITY' | 'FRAUD' | 'MERGED_ACCOUNT';

export class AccountBalanceDto {
  @ApiProperty({ description: 'Current balance (settled)', example: '1000.00' })
  current!: string;

  @ApiProperty({ description: 'Available balance (current - holds - minimum)', example: '950.00' })
  available!: string;

  @ApiProperty({ description: 'Pending balance (unsettled transactions)', example: '50.00' })
  pending!: string;

  @ApiProperty({ description: 'Held funds', example: '0.00' })
  held!: string;

  @ApiProperty({ description: 'Ledger balance (current + pending)', example: '1050.00' })
  ledger!: string;
}

export class AccountResponseDto {
  @ApiProperty({ description: 'Unique account identifier' })
  id!: string;

  @ApiProperty({ description: 'Account number (masked)', example: '****1234' })
  accountNumber!: string;

  @ApiProperty({ description: 'Routing number', example: '021000021' })
  routingNumber!: string;

  @ApiProperty({
    enum: ['CHECKING', 'SAVINGS', 'BUSINESS', 'INVESTMENT_CASH'],
    description: 'Type of account',
  })
  accountType!: AccountTypeType;

  @ApiProperty({
    enum: ['PENDING', 'ACTIVE', 'RESTRICTED', 'FROZEN', 'LOCKED', 'DORMANT', 'CLOSED', 'ARCHIVED'],
    description: 'Current account status',
  })
  status!: AccountStatusType;

  @ApiProperty({ description: 'Account name' })
  name!: string;

  @ApiPropertyOptional({ description: 'Account nickname' })
  nickname!: string | null;

  @ApiProperty({ description: 'Currency code' })
  currency!: string;

  @ApiProperty({ description: 'Balance information', type: AccountBalanceDto })
  balance!: AccountBalanceDto;

  @ApiProperty({ description: 'Overdraft limit', example: '0.00' })
  overdraftLimit!: string;

  @ApiProperty({ description: 'Daily transaction limit', example: '5000.00' })
  dailyLimit!: string;

  @ApiProperty({ description: 'Monthly transaction limit', example: '25000.00' })
  monthlyLimit!: string;

  @ApiPropertyOptional({ description: 'Interest rate' })
  interestRate!: string | null;

  @ApiPropertyOptional({
    enum: [
      'SUSPICIOUS_ACTIVITY',
      'FRAUD_ALERT',
      'COURT_ORDER',
      'REGULATORY_HOLD',
      'CUSTOMER_REQUEST',
      'INTERNAL_REVIEW',
    ],
    description: 'Freeze reason if frozen',
  })
  freezeReason!: FreezeReasonType | null;

  @ApiPropertyOptional({ description: 'Freeze note' })
  freezeNote!: string | null;

  @ApiProperty({ description: 'Account creation timestamp' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: string;

  @ApiPropertyOptional({ description: 'Closure timestamp' })
  closedAt!: string | null;

  @ApiPropertyOptional({
    enum: ['USER_REQUEST', 'ADMIN_ACTION', 'COMPLIANCE', 'INACTIVITY', 'FRAUD', 'MERGED_ACCOUNT'],
    description: 'Closure reason',
  })
  closureReason!: ClosureReasonType | null;


  static fromPrisma(
    account: {
      id: string;
      accountNumber: string;
      routingNumber: string;
      type: AccountTypeType;
      status: AccountStatusType;
      name: string;
      nickname: string | null;
      currency: string;
      currentBalance: Decimal;
      availableBalance: Decimal;
      pendingBalance: Decimal;
      holdAmount: Decimal;
      overdraftLimit: Decimal;
      dailyLimit: Decimal;
      monthlyLimit: Decimal;
      interestRate: Decimal | null;
      freezeReason: FreezeReasonType | null;
      freezeNote: string | null;
      closedAt: Date | null;
      closureReason: ClosureReasonType | null;
      createdAt: Date;
      updatedAt: Date;
    },
    maskAccountNumber = true,
  ): AccountResponseDto {
    const dto = new AccountResponseDto();
    dto.id = account.id;
    dto.accountNumber = maskAccountNumber
      ? `****${account.accountNumber.slice(-4)}`
      : account.accountNumber;
    dto.routingNumber = account.routingNumber;
    dto.accountType = account.type;
    dto.status = account.status;
    dto.name = account.name;
    dto.nickname = account.nickname;
    dto.currency = account.currency;
    dto.balance = {
      current: account.currentBalance.toString(),
      available: account.availableBalance.toString(),
      pending: account.pendingBalance.toString(),
      held: account.holdAmount.toString(),
      ledger: new Decimal(account.currentBalance).add(account.pendingBalance).toString(),
    };
    dto.overdraftLimit = account.overdraftLimit.toString();
    dto.dailyLimit = account.dailyLimit.toString();
    dto.monthlyLimit = account.monthlyLimit.toString();
    dto.interestRate = account.interestRate ? account.interestRate.toString() : null;
    dto.freezeReason = account.freezeReason;
    dto.freezeNote = account.freezeNote;
    dto.createdAt = account.createdAt.toISOString();
    dto.updatedAt = account.updatedAt.toISOString();
    dto.closedAt = account.closedAt ? account.closedAt.toISOString() : null;
    dto.closureReason = account.closureReason;
    return dto;
  }
}

export class AccountStatementDto {
  @ApiProperty({ description: 'Statement ID' })
  id!: string;

  @ApiProperty({ description: 'Account ID' })
  accountId!: string;

  @ApiProperty({ description: 'Period start date' })
  periodStart!: string;

  @ApiProperty({ description: 'Period end date' })
  periodEnd!: string;

  @ApiProperty({ description: 'Opening balance' })
  openingBalance!: string;

  @ApiProperty({ description: 'Closing balance' })
  closingBalance!: string;

  @ApiProperty({ description: 'Total credits' })
  totalCredits!: string;

  @ApiProperty({ description: 'Total debits' })
  totalDebits!: string;

  @ApiProperty({ description: 'Number of transactions' })
  transactionCount!: number;

  @ApiProperty({ description: 'Statement generation timestamp' })
  generatedAt!: string;
}

export class AccountHoldDto {
  @ApiProperty({ description: 'Hold ID' })
  id!: string;

  @ApiProperty({ description: 'Account ID' })
  accountId!: string;

  @ApiProperty({ description: 'Held amount' })
  amount!: string;

  @ApiProperty({ description: 'Hold reason' })
  reason!: string;

  @ApiProperty({ description: 'Hold start date' })
  startDate!: string;

  @ApiPropertyOptional({ description: 'Hold expiry date' })
  endDate!: string | null;

  @ApiProperty({ description: 'Whether hold is active' })
  isActive!: boolean;
}

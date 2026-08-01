import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

/**
 * Response DTO for a single transaction.
 */
export class TransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID', format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Unique reference number' })
  reference!: string;

  @ApiPropertyOptional({ description: 'Idempotency key' })
  idempotencyKey?: string;

  @ApiProperty({ enum: TransactionType })
  type!: string;

  @ApiProperty({ enum: TransactionStatus })
  status!: string;

  @ApiProperty({ description: 'Account ID', format: 'uuid' })
  accountId!: string;

  @ApiProperty({ description: 'Amount as string for precision' })
  amount!: string;

  @ApiProperty({ description: 'Currency code' })
  currency!: string;

  @ApiPropertyOptional({ description: 'Transaction description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Counterparty account ID' })
  counterpartyAccountId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Ledger journal ID' })
  journalId?: string;

  @ApiPropertyOptional({ description: 'Failure reason if failed' })
  failureReason?: string;

  @ApiPropertyOptional({ description: 'Failure code if failed' })
  failureCode?: string;

  @ApiPropertyOptional({ description: 'Reversal ID' })
  reversalId?: string;

  @ApiPropertyOptional({ description: 'ID of the transaction this reverses' })
  reversalOfId?: string;

  @ApiPropertyOptional({ description: 'Creator ID', format: 'uuid' })
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Authorizer ID' })
  authorizedBy?: string;

  @ApiPropertyOptional({ description: 'Poster ID' })
  postedBy?: string;

  @ApiPropertyOptional({ description: 'Settler ID' })
  settledBy?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Authorization timestamp' })
  authorizedAt?: Date;

  @ApiPropertyOptional({ description: 'Posting timestamp' })
  postedAt?: Date;

  @ApiPropertyOptional({ description: 'Settlement timestamp' })
  settledAt?: Date;

  @ApiPropertyOptional({ description: 'Completion timestamp' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Failure timestamp' })
  failedAt?: Date;

  @ApiPropertyOptional({ description: 'Cancellation timestamp' })
  cancelledAt?: Date;

  @ApiPropertyOptional({ description: 'Reversal timestamp' })
  reversedAt?: Date;

  @ApiPropertyOptional({ description: 'Expiration timestamp' })
  expiresAt?: Date;
}

/**
 * Paginated transaction search response.
 */
export class TransactionSearchResponseDto {
  @ApiProperty({ type: [TransactionResponseDto], description: 'Transaction list' })
  items!: TransactionResponseDto[];

  @ApiProperty({ description: 'Cursor for next page', nullable: true })
  nextCursor?: string;

  @ApiProperty({ description: 'Total count matching the query' })
  totalCount!: number;

  @ApiProperty({ description: 'Page limit used' })
  limit!: number;
}

/**
 * Statement entry within a statement response.
 */
export class StatementEntryDto {
  @ApiProperty({ description: 'Entry date' })
  date!: Date;

  @ApiProperty({ description: 'Transaction reference' })
  reference!: string;

  @ApiProperty({ description: 'Transaction type' })
  type!: string;

  @ApiProperty({ description: 'Description' })
  description!: string;

  @ApiProperty({ description: 'Amount' })
  amount!: string;

  @ApiProperty({ description: 'Currency' })
  currency!: string;

  @ApiProperty({ description: 'Whether this is a debit entry' })
  isDebit!: boolean;

  @ApiProperty({ description: 'Running balance after entry' })
  balance!: string;

  @ApiProperty({ description: 'Transaction status' })
  status!: string;
}

/**
 * Statement export response DTO.
 */
export class StatementResponseDto {
  @ApiProperty({ description: 'Account ID', format: 'uuid' })
  accountId!: string;

  @ApiProperty({ description: 'Statement period start' })
  fromDate!: string;

  @ApiProperty({ description: 'Statement period end' })
  toDate!: string;

  @ApiPropertyOptional({ description: 'Currency code' })
  currency?: string;

  @ApiProperty({ type: [StatementEntryDto], description: 'Statement entries' })
  entries!: StatementEntryDto[];

  @ApiProperty({ description: 'Total debits' })
  totalDebits!: string;

  @ApiProperty({ description: 'Total credits' })
  totalCredits!: string;

  @ApiProperty({ description: 'Closing balance' })
  closingBalance!: string;

  @ApiProperty({ description: 'Generated timestamp' })
  generatedAt!: Date;

  @ApiProperty({ description: 'Number of entries' })
  entryCount!: number;
}
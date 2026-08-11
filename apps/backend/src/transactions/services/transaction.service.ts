import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { PostingType, EntrySide } from '../../ledger/dto/post-journal.dto';
import { ReversalType } from '../../ledger/dto/reverse-journal.dto';
import { TransactionType, TRANSACTION_TYPE_TO_LEDGER_POSTING } from '../enums/transaction-type.enum';
import { TransactionStatus, validateStatusTransition } from '../enums/transaction-status.enum';
import type { CreateTransactionDto } from '../dto/create-transaction.dto';
import type { SearchTransactionsDto, StatementExportDto } from '../dto/search-transactions.dto';
import type {
  TransactionResponseDto,
  TransactionSearchResponseDto,
  StatementResponseDto,
} from '../dto/transaction-response.dto';
import {
  TransactionNotFoundException,
  TransactionValidationException,
  DuplicateReferenceException,
  AccountNotActiveException,
  TransactionPolicyViolationException,
  TransactionNotReversibleException,
} from '../exceptions/transaction-domain.exception';
import { type TransactionRecord, TransactionRepository } from '../repositories/transaction.repository';
import { TransactionPolicy } from '../policies/transaction.policy';
import { TransactionMapper } from '../mappers/transaction.mapper';
import {
  TransactionEventType,
  TransactionCreatedEvent,
  TransactionAuthorizedEvent,
  TransactionPostedEvent,
  TransactionSettledEvent,
  TransactionCompletedEvent,
  TransactionFailedEvent,
  TransactionCancelledEvent,
  TransactionReversedEvent,
} from '../events/transaction.events';
import { LedgerService } from '../../ledger/services/ledger.service';
import { AccountService } from '../../accounts/services/account.service';
import type { AuthenticatedUser } from '../../accounts/policies/account.policy';

interface AuditLogEntry {
  transactionId: string;
  action: string;
  timestamp: Date;
  performedBy?: string;
  details?: Record<string, string | undefined>;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  /**
   * In-memory audit log. In production this would be persisted to an audit table.
   */
  private readonly auditLog: AuditLogEntry[] = [];

  constructor(
    @Inject(TransactionRepository) private readonly repository: TransactionRepository,
    @Inject(TransactionPolicy) private readonly policy: TransactionPolicy,
    @Inject(TransactionMapper) private readonly mapper: TransactionMapper,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
    @Inject(LedgerService) private readonly ledgerService: LedgerService,
    @Inject(AccountService) private readonly accountService: AccountService,
  ) {}

  /**
   * Create a new transaction.
   * Flow: Incoming Request → Authorization → Policy Validation → Business Validation →
   *       Idempotency Check → Transaction Created → Ledger Posting → Account Snapshot Update →
   *       Audit → Events → Notification Hook → API Response
   */
  async createTransaction(dto: CreateTransactionDto): Promise<TransactionResponseDto> {
    // ─── Step 1: Idempotency Check ───
    if (dto.idempotencyKey) {
      const existing = await this.repository.findByIdempotencyKey(dto.idempotencyKey);
      if (existing) {
        this.logger.debug(`Idempotency hit for key: ${dto.idempotencyKey}`);
        return this.mapper.toResponseDto(existing);
      }
    }

    // ─── Step 2: Duplicate Reference Check ───
    if (dto.reference) {
      const existsByRef = await this.repository.existsByReference(dto.reference);
      if (existsByRef) {
        throw new DuplicateReferenceException(dto.reference);
      }
    }

    // ─── Step 3: Account Validation ───
    const account = await this.validateAccount(dto.accountId);
    if (dto.counterpartyAccountId) {
      await this.validateAccount(dto.counterpartyAccountId);
    }

    // ─── Step 4: Generate Reference Number ───
    const reference = dto.reference ?? this.generateReference(dto.type);

    // ─── Step 5: Authorization (Policy Check) ───
    const policyResult = await this.policy.authorize(
      {
        transactionType: dto.type as TransactionType,
        accountId: dto.accountId,
        amount: dto.amount,
        currency: dto.currency ?? 'USD',
        counterpartyAccountId: dto.counterpartyAccountId,
        userId: dto.createdBy,
        accountStatus: account?.status,
        accountCurrency: account?.currency,
        availableBalance: account?.availableBalance,
      },
      this.repository,
    );

    if (!policyResult.allowed) {
      throw new TransactionPolicyViolationException(policyResult.violations.join('; '));
    }

    // ─── Step 6: Create Transaction Record ───
    const now = new Date();
    const transaction: TransactionRecord = {
      id: this.generateId(),
      reference,
      idempotencyKey: dto.idempotencyKey,
      type: dto.type,
      status: TransactionStatus.CREATED,
      accountId: dto.accountId,
      amount: dto.amount,
      currency: dto.currency ?? 'USD',
      description: dto.description,
      counterpartyAccountId: dto.counterpartyAccountId,
      metadata: dto.metadata,
      createdBy: dto.createdBy,
      createdAt: now,
      updatedAt: now,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    };

    await this.repository.save(transaction);

    // ─── Step 7: Audit - Creation ───
    this.audit('CREATED', transaction, dto.createdBy, {
      type: dto.type,
      amount: dto.amount,
      currency: dto.currency ?? 'USD',
    });

    // ─── Step 8: Emit Event - TransactionCreated ───
    this.emitEvent(
      new TransactionCreatedEvent(transaction.id, transaction.accountId, {
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description,
        reference: transaction.reference,
        createdBy: transaction.createdBy,
      }),
      TransactionEventType.TRANSACTION_CREATED,
    );

    // ─── Step 9: Auto-advance through lifecycle ───
    // Automatically validate, authorize, post, settle, and complete for supported types
    return this.processTransactionLifecycle(transaction, dto.createdBy);
  }

  async createTransactionForUser(
    user: AuthenticatedUser,
    dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    await this.ensureAccountAccess(user, dto.accountId);
    return this.createTransaction({ ...dto, createdBy: user.id });
  }

  /**
   * Process the transaction through its lifecycle stages automatically.
   * For deposits and simple transactions, this completes the full cycle.
   */
  private async processTransactionLifecycle(
    transaction: TransactionRecord,
    performedBy?: string,
  ): Promise<TransactionResponseDto> {
    try {
      // ─── VALIDATED ───
      transaction = await this.transitionStatus(transaction, TransactionStatus.VALIDATED, performedBy);

      // ─── AUTHORIZED ───
      transaction = await this.transitionStatus(transaction, TransactionStatus.AUTHORIZED, performedBy);

      this.emitEvent(
        new TransactionAuthorizedEvent(transaction.id, transaction.accountId, {
          type: transaction.type,
          amount: transaction.amount,
          authorizedBy: performedBy ?? 'system',
        }),
        TransactionEventType.TRANSACTION_AUTHORIZED,
      );

      // ─── PENDING ───
      transaction = await this.transitionStatus(transaction, TransactionStatus.PENDING, performedBy);

      // ─── POSTED (Ledger Posting) ───
      transaction = await this.postToLedger(transaction, performedBy);

      // ─── SETTLED ───
      transaction = await this.transitionStatus(transaction, TransactionStatus.SETTLED, performedBy);

      this.emitEvent(
        new TransactionSettledEvent(transaction.id, transaction.accountId, {
          amount: transaction.amount,
          settledBy: performedBy ?? 'system',
        }),
        TransactionEventType.TRANSACTION_SETTLED,
      );

      // ─── COMPLETED ───
      transaction = await this.transitionStatus(transaction, TransactionStatus.COMPLETED, performedBy);

      this.emitEvent(
        new TransactionCompletedEvent(transaction.id, transaction.accountId, {
          type: transaction.type,
          amount: transaction.amount,
          status: TransactionStatus.COMPLETED,
        }),
        TransactionEventType.TRANSACTION_COMPLETED,
      );

      return this.mapper.toResponseDto(transaction);
    } catch (error) {
      // ─── FAIL the transaction on any error ───
      const reason = error instanceof Error ? error.message : 'Unknown error';
      transaction = await this.failTransaction(transaction, reason, undefined, performedBy);
      return this.mapper.toResponseDto(transaction);
    }
  }

  /**
   * Post the transaction to the Ledger Engine.
   * The Transaction module orchestrates - the Ledger does the accounting.
   */
  private async postToLedger(
    transaction: TransactionRecord,
    performedBy?: string,
  ): Promise<TransactionRecord> {
    const ledgerType = (TRANSACTION_TYPE_TO_LEDGER_POSTING[transaction.type] as PostingType | undefined) ?? PostingType.ADJUSTMENT;

    // Build ledger journal lines based on transaction type
    const lines = this.buildLedgerLines(transaction);

    try {
      const journal = await this.ledgerService.postJournal({
        lines,
        description: `${transaction.type}: ${transaction.description ?? transaction.reference}`,
        type: ledgerType,
        currency: transaction.currency,
        entryDate: new Date().toISOString(),
        idempotencyKey: `txn-${transaction.id}`,
      });

      transaction.journalId = journal.id.value;
      await this.repository.applyBalanceMutation(transaction);
      transaction = await this.transitionStatus(transaction, TransactionStatus.POSTED, performedBy);

      this.emitEvent(
        new TransactionPostedEvent(transaction.id, transaction.accountId, {
          type: transaction.type,
          amount: transaction.amount,
          journalId: journal.id.value,
          postedBy: performedBy ?? 'system',
        }),
        TransactionEventType.TRANSACTION_POSTED,
      );

      return transaction;
    } catch (error) {
      throw new TransactionValidationException(
        `Ledger posting failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Build ledger journal entry lines for the given transaction.
   * This defines the double-entry accounting pattern for each transaction type.
   * The actual accounting is delegated to the Ledger Engine.
   */
  private buildLedgerLines(
    transaction: TransactionRecord,
  ): Array<{ accountId: string; side: EntrySide; amount: string; description?: string }> {
    const amount = Math.round(parseFloat(transaction.amount) * 100).toString(); // Convert to minor units
    const lines: Array<{ accountId: string; side: EntrySide; amount: string; description?: string }> = [];

    switch (transaction.type) {
      case TransactionType.DEPOSIT:
        // Debit: Bank/Cash account (asset increases)
        // Credit: Customer account (liability increases)
        lines.push({
          accountId: transaction.accountId,
          side: EntrySide.DEBIT,
          amount,
          description: `Deposit to ${transaction.accountId}`,
        });
        lines.push({
          accountId: 'SYSTEM_CLEARING',
          side: EntrySide.CREDIT,
          amount,
          description: `Deposit clearing for ${transaction.accountId}`,
        });
        break;

      case TransactionType.WITHDRAWAL:
        // Debit: Customer account (liability decreases)
        // Credit: Bank/Cash account (asset decreases)
        lines.push({
          accountId: 'SYSTEM_CLEARING',
          side: EntrySide.DEBIT,
          amount,
          description: `Withdrawal clearing for ${transaction.accountId}`,
        });
        lines.push({
          accountId: transaction.accountId,
          side: EntrySide.CREDIT,
          amount,
          description: `Withdrawal from ${transaction.accountId}`,
        });
        break;

      case TransactionType.INTERNAL_TRANSFER:
        // Debit: Source account
        // Credit: Destination account
        if (!transaction.counterpartyAccountId) {
          throw new TransactionValidationException('Internal transfer requires a counterparty account');
        }
        lines.push({
          accountId: transaction.counterpartyAccountId,
          side: EntrySide.DEBIT,
          amount,
          description: `Transfer in from ${transaction.accountId}`,
        });
        lines.push({
          accountId: transaction.accountId,
          side: EntrySide.CREDIT,
          amount,
          description: `Transfer out to ${transaction.counterpartyAccountId}`,
        });
        break;

      case TransactionType.FEE:
        lines.push({
          accountId: 'SYSTEM_FEES',
          side: EntrySide.DEBIT,
          amount,
          description: `Fee revenue from ${transaction.accountId}`,
        });
        lines.push({
          accountId: transaction.accountId,
          side: EntrySide.CREDIT,
          amount,
          description: `Fee charged to ${transaction.accountId}`,
        });
        break;

      case TransactionType.INTEREST_CREDIT:
        lines.push({
          accountId: transaction.accountId,
          side: EntrySide.DEBIT,
          amount,
          description: `Interest credited to ${transaction.accountId}`,
        });
        lines.push({
          accountId: 'SYSTEM_INTEREST',
          side: EntrySide.CREDIT,
          amount,
          description: `Interest expense for ${transaction.accountId}`,
        });
        break;

      case TransactionType.LOAN_DISBURSEMENT:
        lines.push({
          accountId: transaction.accountId,
          side: EntrySide.DEBIT,
          amount,
          description: `Loan disbursement to ${transaction.accountId}`,
        });
        lines.push({
          accountId: 'SYSTEM_LOANS',
          side: EntrySide.CREDIT,
          amount,
          description: `Loan receivable for ${transaction.accountId}`,
        });
        break;

      case TransactionType.LOAN_REPAYMENT:
        lines.push({
          accountId: 'SYSTEM_LOANS',
          side: EntrySide.DEBIT,
          amount,
          description: `Loan repayment received for ${transaction.accountId}`,
        });
        lines.push({
          accountId: transaction.accountId,
          side: EntrySide.CREDIT,
          amount,
          description: `Loan repayment from ${transaction.accountId}`,
        });
        break;

      case TransactionType.CARD_REFUND:
        lines.push({
          accountId: transaction.accountId,
          side: EntrySide.DEBIT,
          amount,
          description: `Card refund to ${transaction.accountId}`,
        });
        lines.push({
          accountId: 'SYSTEM_CLEARING',
          side: EntrySide.CREDIT,
          amount,
          description: `Card refund clearing for ${transaction.accountId}`,
        });
        break;

      default:
        // Generic: debit customer, credit clearing
        lines.push({
          accountId: transaction.accountId,
          side: EntrySide.DEBIT,
          amount,
          description: `${transaction.type} for ${transaction.accountId}`,
        });
        lines.push({
          accountId: 'SYSTEM_CLEARING',
          side: EntrySide.CREDIT,
          amount,
          description: `${transaction.type} clearing`,
        });
        break;
    }

    return lines;
  }

  /**
   * Transition a transaction's status with validation and audit.
   */
  private async transitionStatus(
    transaction: TransactionRecord,
    newStatus: TransactionStatus,
    performedBy?: string,
  ): Promise<TransactionRecord> {
    validateStatusTransition(transaction.status as TransactionStatus, newStatus);

    transaction.status = newStatus;
    transaction.updatedAt = new Date();

    // Set status-specific timestamps
    switch (newStatus) {
      case TransactionStatus.AUTHORIZED:
        transaction.authorizedAt = new Date();
        transaction.authorizedBy = performedBy;
        break;
      case TransactionStatus.POSTED:
        transaction.postedAt = new Date();
        transaction.postedBy = performedBy;
        break;
      case TransactionStatus.SETTLED:
        transaction.settledAt = new Date();
        transaction.settledBy = performedBy;
        break;
      case TransactionStatus.COMPLETED:
        transaction.completedAt = new Date();
        break;
      case TransactionStatus.FAILED:
        transaction.failedAt = new Date();
        break;
      case TransactionStatus.CANCELLED:
        transaction.cancelledAt = new Date();
        break;
      case TransactionStatus.REVERSED:
        transaction.reversedAt = new Date();
        break;
    }

    await this.repository.update(transaction);

    this.audit(`STATUS_${newStatus}`, transaction, performedBy, { newStatus });

    return transaction;
  }

  /**
   * Fail a transaction with reason.
   */
  private async failTransaction(
    transaction: TransactionRecord,
    reason: string,
    failureCode?: string,
    performedBy?: string,
  ): Promise<TransactionRecord> {
    // Only fail if not already in a terminal state
    if (this.policy.canFail(transaction.status)) {
      transaction.status = TransactionStatus.FAILED;
      transaction.failureReason = reason;
      transaction.failureCode = failureCode;
      transaction.failedAt = new Date();
      transaction.updatedAt = new Date();

      await this.repository.update(transaction);

      this.audit('FAILED', transaction, performedBy, { reason, failureCode });

      this.emitEvent(
        new TransactionFailedEvent(transaction.id, transaction.accountId, {
          type: transaction.type,
          reason,
          failureCode,
        }),
        TransactionEventType.TRANSACTION_FAILED,
      );
    }

    return transaction;
  }

  // ─── Public API Methods ───

  /**
   * Get a transaction by ID.
   */
  async getTransaction(id: string): Promise<TransactionResponseDto> {
    const transaction = await this.repository.findById(id);
    if (!transaction) {
      throw new TransactionNotFoundException(id);
    }
    return this.mapper.toResponseDto(transaction);
  }

  async getTransactionForUser(user: AuthenticatedUser, id: string): Promise<TransactionResponseDto> {
    const transaction = await this.repository.findById(id);
    if (!transaction) {
      throw new TransactionNotFoundException(id);
    }
    await this.ensureAccountAccess(user, transaction.accountId);
    return this.mapper.toResponseDto(transaction);
  }

  /**
   * Search transactions with cursor-based pagination.
   */
  async searchTransactions(dto: SearchTransactionsDto): Promise<TransactionSearchResponseDto> {
    const result = await this.repository.search({
      reference: dto.reference,
      idempotencyKey: dto.idempotencyKey,
      type: dto.type,
      status: dto.status,
      accountId: dto.accountId,
      counterpartyAccountId: dto.counterpartyAccountId,
      currency: dto.currency,
      minAmount: dto.minAmount,
      maxAmount: dto.maxAmount,
      createdFrom: dto.createdFrom ? new Date(dto.createdFrom) : undefined,
      createdTo: dto.createdTo ? new Date(dto.createdTo) : undefined,
      createdBy: dto.createdBy,
      limit: dto.limit ?? 50,
      cursor: dto.cursor,
    });

    this.audit('SEARCH', undefined, undefined, {
      criteria: JSON.stringify(dto),
      resultCount: String(result.totalCount),
    });

    return {
      items: this.mapper.toResponseDtoArray(result.items),
      nextCursor: result.nextCursor,
      totalCount: result.totalCount,
      limit: dto.limit ?? 50,
    };
  }

  async searchTransactionsForUser(
    user: AuthenticatedUser,
    dto: SearchTransactionsDto,
  ): Promise<TransactionSearchResponseDto> {
    if (dto.accountId) {
      await this.ensureAccountAccess(user, dto.accountId);
      return this.searchTransactions(dto);
    }

    const accounts = await this.accountService.listAccounts(user, { limit: 100 });
    const results = await Promise.all(
      accounts.data.map((account) => this.repository.findByAccount(account.id, dto.limit ?? 50, dto.cursor)),
    );
    const items = results
      .flatMap((result) => result.items)
      .filter((item, index, rows) => rows.findIndex((row) => row.id === item.id) === index)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, dto.limit ?? 50);

    return {
      items: this.mapper.toResponseDtoArray(items),
      nextCursor: items.length === (dto.limit ?? 50) ? items.at(-1)?.id : undefined,
      totalCount: items.length,
      limit: dto.limit ?? 50,
    };
  }

  /**
   * Cancel a transaction.
   */
  async cancelTransaction(
    id: string,
    reason: string,
    cancelledBy?: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.repository.findById(id);
    if (!transaction) {
      throw new TransactionNotFoundException(id);
    }

    if (!this.policy.canCancel(transaction.status)) {
      throw new TransactionValidationException(
        `Cannot cancel transaction in status ${transaction.status}`,
      );
    }

    // If the transaction was already posted to ledger, reverse it
    if (transaction.journalId) {
      try {
        await this.ledgerService.reverseJournal({
          transactionId: transaction.journalId,
          type: ReversalType.FULL,
          reason: `Transaction cancelled: ${reason}`,
        });
      } catch (error) {
        this.logger.warn(
          `Failed to reverse ledger for cancelled transaction ${id}: ${error instanceof Error ? error.message : 'Unknown'}`,
        );
      }
    }

    transaction.status = TransactionStatus.CANCELLED;
    transaction.cancelledAt = new Date();
    transaction.failureReason = reason;
    transaction.updatedAt = new Date();

    await this.repository.update(transaction);

    this.audit('CANCELLED', transaction, cancelledBy, { reason });

    this.emitEvent(
      new TransactionCancelledEvent(transaction.id, transaction.accountId, {
        reason,
        cancelledBy: cancelledBy ?? 'system',
      }),
      TransactionEventType.TRANSACTION_CANCELLED,
    );

    return this.mapper.toResponseDto(transaction);
  }

  /**
   * Reverse a settled/completed transaction.
   */
  async reverseTransaction(
    id: string,
    reason: string,
    reversedBy?: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.repository.findById(id);
    if (!transaction) {
      throw new TransactionNotFoundException(id);
    }

    if (!this.policy.canReverse(transaction.status)) {
      throw new TransactionNotReversibleException(id, transaction.status);
    }

    if (!transaction.journalId) {
      throw new TransactionValidationException('Transaction has no ledger journal to reverse');
    }

    // Delegate reversal to the Ledger Engine
    try {
      await this.ledgerService.reverseJournal({
        transactionId: transaction.journalId,
          type: ReversalType.FULL,
        reason: `Transaction reversal: ${reason}`,
      });
    } catch (error) {
      throw new TransactionValidationException(
        `Ledger reversal failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    transaction.status = TransactionStatus.REVERSED;
    transaction.reversedAt = new Date();
    transaction.failureReason = reason;
    transaction.updatedAt = new Date();

    await this.repository.update(transaction);

    this.audit('REVERSED', transaction, reversedBy, { reason });

    this.emitEvent(
      new TransactionReversedEvent(transaction.id, transaction.accountId, {
        reason,
        reversedBy: reversedBy ?? 'system',
        reversalId: `rev-${transaction.id}`,
      }),
      TransactionEventType.TRANSACTION_REVERSED,
    );

    return this.mapper.toResponseDto(transaction);
  }

  /**
   * Get transactions for a specific account.
   */
  async getAccountTransactions(
    accountId: string,
    limit: number = 50,
    cursor?: string,
  ): Promise<TransactionSearchResponseDto> {
    const result = await this.repository.findByAccount(accountId, limit, cursor);
    return {
      items: this.mapper.toResponseDtoArray(result.items),
      nextCursor: result.nextCursor,
      totalCount: result.totalCount,
      limit,
    };
  }

  async getAccountTransactionsForUser(
    user: AuthenticatedUser,
    accountId: string,
    limit: number = 50,
    cursor?: string,
  ): Promise<TransactionSearchResponseDto> {
    await this.ensureAccountAccess(user, accountId);
    return this.getAccountTransactions(accountId, limit, cursor);
  }

  /**
   * Generate a statement for an account within a date range.
   * Export placeholder only - no PDF generation.
   */
  async generateStatement(dto: StatementExportDto): Promise<StatementResponseDto> {
    const from = new Date(dto.fromDate);
    const to = new Date(dto.toDate);

    const transactions = await this.repository.findByAccountAndDateRange(
      dto.accountId,
      from,
      to,
    );

    let runningBalance = 0;
    const entries = transactions.map((txn) => {
      const isDebit = [
        'WITHDRAWAL',
        'INTERNAL_TRANSFER',
        'FEE',
        'CARD_PURCHASE',
        'CARD_AUTHORIZATION',
        'CARD_CAPTURE',
        'ACH_DEBIT',
        'LOAN_REPAYMENT',
      ].includes(txn.type);
      const amount = parseFloat(txn.amount);
      runningBalance += isDebit ? -amount : amount;

      return {
        date: txn.createdAt,
        reference: txn.reference,
        type: txn.type,
        description: txn.description ?? txn.type,
        amount: txn.amount,
        currency: txn.currency,
        isDebit,
        balance: runningBalance.toFixed(2),
        status: txn.status,
      };
    });

    this.audit('STATEMENT_GENERATED', undefined, undefined, {
      accountId: dto.accountId,
      fromDate: dto.fromDate,
      toDate: dto.toDate,
      entryCount: String(entries.length),
    });

    return {
      accountId: dto.accountId,
      fromDate: dto.fromDate,
      toDate: dto.toDate,
      currency: dto.currency,
      entries,
      totalDebits: entries
        .filter((e) => e.isDebit)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0)
        .toFixed(2),
      totalCredits: entries
        .filter((e) => !e.isDebit)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0)
        .toFixed(2),
      closingBalance: runningBalance.toFixed(2),
      generatedAt: new Date(),
      entryCount: entries.length,
    };
  }

  // ─── Private Helpers ───

  /**
   * Validate that an account exists and is accessible.
   */
  private async validateAccount(
    accountId: string,
  ): Promise<{ id: string; status: string; currency: string; availableBalance?: string }> {
    try {
      const account = await this.accountService.findById(accountId);
      if (!account) {
        throw new AccountNotActiveException(accountId, 'NOT_FOUND');
      }
      return {
        id: accountId,
        status: account.status ?? 'ACTIVE',
        currency: account.currency ?? 'USD',
        availableBalance: account.availableBalance?.toString(),
      };
    } catch (error) {
      if (error instanceof AccountNotActiveException) {
        throw error;
      }
      throw error;
    }
  }

  private async ensureAccountAccess(user: AuthenticatedUser, accountId: string): Promise<void> {
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return;
    }

    const isHolder = await this.accountService.isAccountHolder(accountId, user.id);
    if (!isHolder) {
      throw new TransactionPolicyViolationException('You do not have permission to access this account');
    }
  }

  /**
   * Generate a unique reference number.
   */
  private generateReference(type: string): string {
    const prefix = type.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = randomUUID().substring(0, 8).toUpperCase();
    return `TXN-${prefix}-${timestamp}-${random}`;
  }

  /**
   * Generate a unique transaction ID.
   */
  private generateId(): string {
    return randomUUID();
  }

  /**
   * Record an audit log entry.
   */
  private audit(
    action: string,
    transaction?: TransactionRecord,
    performedBy?: string,
    details?: Record<string, string | undefined>,
  ): void {
    const entry: AuditLogEntry = {
      transactionId: transaction?.id ?? 'N/A',
      action,
      timestamp: new Date(),
      performedBy,
      details,
    };
    this.auditLog.push(entry);
    this.logger.debug(`Audit: ${action} - Transaction ${entry.transactionId}`);
  }

  /**
   * Emit a transaction event via EventEmitter2.
   */
  private emitEvent(event: unknown, eventType: TransactionEventType): void {
    this.eventEmitter.emit(eventType, event);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { TransactionType, CREDIT_TRANSACTION_TYPES, DEBIT_TRANSACTION_TYPES, TRANSFER_TRANSACTION_TYPES } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';
import type { TransactionRepository } from '../repositories/transaction.repository';
export type { AuthenticatedUser } from '../../accounts/policies/account.policy';

export interface PolicyCheckContext {
  transactionType: TransactionType;
  accountId: string;
  amount: string;
  currency: string;
  counterpartyAccountId?: string;
  userId?: string;
  accountStatus?: string;
  accountCurrency?: string;
  availableBalance?: string;
}

export type TransactionAuthorizationContext = PolicyCheckContext;

export interface PolicyResult {
  allowed: boolean;
  violations: string[];
}

@Injectable()
export class TransactionPolicy {
  private readonly logger = new Logger(TransactionPolicy.name);

  /**
   * Minimum transaction amounts.
   */
  private readonly minimumAmounts: Record<string, string> = {
    [TransactionType.DEPOSIT]: '0.01',
    [TransactionType.WITHDRAWAL]: '0.01',
    [TransactionType.INTERNAL_TRANSFER]: '0.01',
    [TransactionType.FEE]: '0.00',
  };

  /**
   * Maximum single transaction amounts.
   */
  private readonly maxSingleAmounts: Record<string, string> = {
    [TransactionType.DEPOSIT]: '1000000.00',
    [TransactionType.WITHDRAWAL]: '500000.00',
    [TransactionType.WIRE_DOMESTIC]: '1000000.00',
    [TransactionType.WIRE_INTERNATIONAL]: '500000.00',
  };

  /**
   * Set of transaction statuses that are considered terminal.
   */
  private readonly terminalStatuses = new Set<string>([
    TransactionStatus.COMPLETED,
    TransactionStatus.FAILED,
    TransactionStatus.CANCELLED,
    TransactionStatus.REVERSED,
    TransactionStatus.EXPIRED,
  ]);

  /**
   * Statuses from which reversal is allowed.
   */
  private readonly reversibleStatuses = new Set<string>([
    TransactionStatus.POSTED,
    TransactionStatus.SETTLED,
    TransactionStatus.COMPLETED,
  ]);

  /**
   * Full authorization check - validates the entire policy for a new transaction.
   */
  async authorize(ctx: PolicyCheckContext, _repo?: TransactionRepository): Promise<PolicyResult> {
    const violations: string[] = [];

    // 1. Account status check
    const accountCheck = this.checkAccountStatus(ctx);
    if (!accountCheck.allowed) violations.push(...accountCheck.violations);

    // 2. Currency check
    const currencyCheck = this.checkCurrency(ctx);
    if (!currencyCheck.allowed) violations.push(...currencyCheck.violations);

    // 3. Amount limits
    const amountCheck = this.checkAmountLimits(ctx);
    if (!amountCheck.allowed) violations.push(...amountCheck.violations);

    // 4. Balance check for debit transactions
    const balanceCheck = this.checkBalance(ctx);
    if (!balanceCheck.allowed) violations.push(...balanceCheck.violations);

    // 5. Transfer self-transfer check
    const selfTransferCheck = this.checkSelfTransfer(ctx);
    if (!selfTransferCheck.allowed) violations.push(...selfTransferCheck.violations);

    // 6. Compliance hooks (placeholder)
    const complianceCheck = this.checkCompliance(ctx);
    if (!complianceCheck.allowed) violations.push(...complianceCheck.violations);

    // 7. AML hooks (placeholder)
    const amlCheck = this.checkAML(ctx);
    if (!amlCheck.allowed) violations.push(...amlCheck.violations);

    // 8. Fraud hooks (placeholder)
    const fraudCheck = this.checkFraud(ctx);
    if (!fraudCheck.allowed) violations.push(...fraudCheck.violations);

    return { allowed: violations.length === 0, violations };
  }

  /**
   * Check if a transaction can be authorized (status transition).
   */
  canAuthorize(currentStatus: string): boolean {
    return currentStatus === TransactionStatus.VALIDATED;
  }

  /**
   * Check if a transaction can be posted.
   */
  canPost(currentStatus: string): boolean {
    return currentStatus === TransactionStatus.AUTHORIZED || currentStatus === TransactionStatus.PENDING;
  }

  /**
   * Check if a transaction can be settled.
   */
  canSettle(currentStatus: string): boolean {
    return currentStatus === TransactionStatus.POSTED;
  }

  /**
   * Check if a transaction can be completed.
   */
  canComplete(currentStatus: string): boolean {
    return currentStatus === TransactionStatus.SETTLED;
  }

  /**
   * Check if a transaction can be cancelled.
   */
  canCancel(currentStatus: string): boolean {
    return [
      TransactionStatus.CREATED,
      TransactionStatus.VALIDATED,
      TransactionStatus.AUTHORIZED,
      TransactionStatus.PENDING,
    ].includes(currentStatus as TransactionStatus);
  }

  /**
   * Check if a transaction can be reversed.
   */
  canReverse(currentStatus: string): boolean {
    return this.reversibleStatuses.has(currentStatus);
  }

  /**
   * Check if a transaction can be failed.
   */
  canFail(currentStatus: string): boolean {
    return !this.terminalStatuses.has(currentStatus);
  }

  /**
   * Check if a transaction is in a terminal state.
   */
  isTerminal(status: string): boolean {
    return this.terminalStatuses.has(status);
  }

  // ─── Private Policy Checks ───

  private checkAccountStatus(ctx: PolicyCheckContext): PolicyResult {
    const violations: string[] = [];

    if (ctx.accountStatus) {
      const pendingAllowed =
        ctx.accountStatus === 'PENDING' &&
        (CREDIT_TRANSACTION_TYPES.has(ctx.transactionType) || ctx.transactionType === TransactionType.INTEREST_CREDIT);

      if (ctx.accountStatus !== 'ACTIVE' && !pendingAllowed) {
        violations.push(`Account ${ctx.accountId} is not active (status: ${ctx.accountStatus})`);
      }
    }

    return { allowed: violations.length === 0, violations };
  }

  private checkCurrency(ctx: PolicyCheckContext): PolicyResult {
    const violations: string[] = [];

    if (ctx.accountCurrency && ctx.currency !== ctx.accountCurrency) {
      violations.push(
        `Currency mismatch: account currency is ${ctx.accountCurrency}, transaction currency is ${ctx.currency}`,
      );
    }

    return { allowed: violations.length === 0, violations };
  }

  private checkAmountLimits(ctx: PolicyCheckContext): PolicyResult {
    const violations: string[] = [];
    const amount = parseFloat(ctx.amount);

    // Minimum amount check
    const minAmount = this.minimumAmounts[ctx.transactionType];
    if (minAmount && amount < parseFloat(minAmount)) {
      violations.push(
        `Amount ${ctx.amount} is below minimum ${minAmount} for ${ctx.transactionType}`,
      );
    }

    // Maximum single transaction check
    const maxAmount = this.maxSingleAmounts[ctx.transactionType];
    if (maxAmount && amount > parseFloat(maxAmount)) {
      violations.push(
        `Amount ${ctx.amount} exceeds maximum single transaction limit ${maxAmount} for ${ctx.transactionType}`,
      );
    }

    return { allowed: violations.length === 0, violations };
  }

  private checkBalance(ctx: PolicyCheckContext): PolicyResult {
    const violations: string[] = [];

    // Only debit-type transactions require balance checks
    if (DEBIT_TRANSACTION_TYPES.has(ctx.transactionType) || TRANSFER_TRANSACTION_TYPES.has(ctx.transactionType)) {
      if (ctx.availableBalance !== undefined) {
        const available = parseFloat(ctx.availableBalance);
        const requested = parseFloat(ctx.amount);
        if (available < requested) {
          violations.push(
            `Insufficient funds: available ${ctx.availableBalance}, requested ${ctx.amount}`,
          );
        }
      }
    }

    return { allowed: violations.length === 0, violations };
  }

  private checkSelfTransfer(ctx: PolicyCheckContext): PolicyResult {
    const violations: string[] = [];

    if (
      TRANSFER_TRANSACTION_TYPES.has(ctx.transactionType) &&
      !ctx.counterpartyAccountId
    ) {
      violations.push('Transfer transactions require a counterparty account');
    }

    if (
      TRANSFER_TRANSACTION_TYPES.has(ctx.transactionType) &&
      ctx.counterpartyAccountId &&
      ctx.accountId === ctx.counterpartyAccountId
    ) {
      violations.push('Cannot transfer to the same account');
    }

    return { allowed: violations.length === 0, violations };
  }


  /**
   * Compliance hooks - placeholder for future compliance rules.
   * In production, this would integrate with compliance systems.
   */
  private checkCompliance(_ctx: PolicyCheckContext): PolicyResult {
    // Placeholder: compliance hooks will be integrated here
    return { allowed: true, violations: [] };
  }

  /**
   * AML (Anti-Money Laundering) hooks - placeholder.
   * In production, this would integrate with AML screening systems.
   */
  private checkAML(_ctx: PolicyCheckContext): PolicyResult {
    // Placeholder: AML hooks will be integrated here
    return { allowed: true, violations: [] };
  }

  /**
   * Fraud detection hooks - placeholder.
   * In production, this would integrate with fraud detection systems.
   */
  private checkFraud(_ctx: PolicyCheckContext): PolicyResult {
    // Placeholder: fraud detection hooks will be integrated here
    return { allowed: true, violations: [] };
  }
}
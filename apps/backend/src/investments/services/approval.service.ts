import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvestmentRepository } from '../repositories/investment.repository';
import { InvestmentMapper } from '../mappers/investment.mapper';
import { InvestmentPolicy } from '../policies/investment.policy';
import type { DepositResponseDto } from '../dto/deposit.dto';
import type { WithdrawalResponseDto } from '../dto/withdrawal.dto';
import {
  DepositStatus,
  WithdrawalStatus,
  PortfolioTransactionType,
} from '../enums/investment-status.enum';
import {
  InvestmentEventType,
  InvestmentDepositApprovedEvent,
  InvestmentDepositRejectedEvent,
  InvestmentWithdrawalApprovedEvent,
  InvestmentWithdrawalRejectedEvent,
  PortfolioUpdatedEvent,
} from '../events/investment.events';
import {
  DepositNotFoundException,
  WithdrawalNotFoundException,
  AssetNotFoundException,
  AssetDisabledException,
} from '../exceptions/investment-domain.exception';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AssetStatus } from '../enums/investment-status.enum';
import { AssetClass } from '../enums/asset-class.enum';
import { TransactionService } from '../../transactions/services/transaction.service';
import { TransactionType } from '../../transactions/enums/transaction-type.enum';
import { AccountRepository } from '../../accounts/repositories/account.repository';

/**
 * Admin balance adjustments (see {@link ApprovalService.adminAdjustBalance})
 * are always denominated in US Dollars — the admin never picks a currency
 * or crypto asset for this action. This is the symbol of the fixed cash
 * product those adjustments post against, auto-provisioned on first use.
 */
export const ADMIN_BALANCE_CURRENCY = 'USD';

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  constructor(
    private readonly repository: InvestmentRepository,
    private readonly mapper: InvestmentMapper,
    private readonly policy: InvestmentPolicy,
    private readonly eventEmitter: EventEmitter2,
    private readonly transactionService: TransactionService,
    private readonly accountRepository: AccountRepository,
  ) {}

  /**
   * Investment deposits/withdrawals post through the Transaction Engine the
   * same way an ordinary transaction does, which requires a real bank
   * account — never the raw user id. Resolves the customer's active
   * account to post against.
   */
  private async resolveLedgerAccountId(userId: string): Promise<string> {
    const { accounts } = await this.accountRepository.findByUserId(userId, { status: 'ACTIVE' });
    const account = accounts[0];
    if (!account) {
      throw new BadRequestException('Customer has no active account to post this transaction to');
    }
    return account.id;
  }

  /**
   * Admin approves a deposit. Creates transaction via Transaction Engine,
   * posts to ledger, and updates portfolio holdings.
   */
  async approveDeposit(
    depositId: string,
    approvedBy: string,
    _notes?: string,
  ): Promise<DepositResponseDto> {
    this.logger.log(`Approving deposit: ${depositId} by ${approvedBy}`);

    const deposit = await this.repository.findDepositById(depositId);
    if (!deposit) throw new DepositNotFoundException(depositId);
    if (deposit.status !== DepositStatus.PENDING) {
      throw new DepositNotFoundException(depositId);
    }

    const product = await this.repository.findProductById(deposit.productId);
    if (!product) throw new AssetNotFoundException(deposit.productId);

    const accountId = await this.resolveLedgerAccountId(deposit.userId);

    // Create transaction through Transaction Engine (no accounting in Investments)
    const transaction = await this.transactionService.createTransaction({
      type: TransactionType.CRYPTO_DEPOSIT,
      accountId,
      amount: String(deposit.amount),
      currency: 'USD',
      description: `Investment deposit: ${product.symbol} - ${deposit.reference}`,
      reference: deposit.reference,
      metadata: {
        investmentType: 'CRYPTO',
        productSymbol: product.symbol,
        productId: deposit.productId,
        depositId: deposit.id,
      },
      createdBy: approvedBy,
    });

    // Update deposit status
    const updatedDeposit = await this.repository.updateDeposit(depositId, {
      status: DepositStatus.APPROVED,
      approvedBy,
      approvedAt: new Date(),
    });

    // Update holdings via portfolio position
    const portfolio = await this.repository.findOrCreatePortfolio(deposit.userId);
    const existingPosition = await this.repository.findPosition(portfolio.id, deposit.productId);

    const quantity = Number(deposit.amount);
    const pricePerUnit = product.priceHistory?.[0] ? Number(product.priceHistory[0].price) : 0;
    const totalCost = quantity * pricePerUnit;

    if (existingPosition) {
      const newQuantity = Number(existingPosition.quantity) + quantity;
      const newTotalCost = Number(existingPosition.totalCost) + totalCost;
      const newAvgCost = newQuantity > 0 ? newTotalCost / newQuantity : 0;
      const currentValue = newQuantity * pricePerUnit;

      await this.repository.upsertPosition({
        portfolioId: portfolio.id,
        productId: deposit.productId,
        quantity: newQuantity,
        averageCost: newAvgCost,
        totalCost: newTotalCost,
        currentValue,
        profitLoss: currentValue - newTotalCost,
        profitLossPct: newTotalCost > 0 ? ((currentValue - newTotalCost) / newTotalCost) * 100 : 0,
      });
    } else {
      const currentValue = quantity * pricePerUnit;
      await this.repository.upsertPosition({
        portfolioId: portfolio.id,
        productId: deposit.productId,
        quantity,
        averageCost: pricePerUnit,
        totalCost,
        currentValue,
        profitLoss: currentValue - totalCost,
        profitLossPct: totalCost > 0 ? ((currentValue - totalCost) / totalCost) * 100 : 0,
      });
    }

    // Record portfolio entry
    await this.repository.createEntry({
      portfolioId: portfolio.id,
      productId: deposit.productId,
      type: PortfolioTransactionType.DEPOSIT,
      quantity,
      pricePerUnit,
      totalAmount: totalCost,
      reference: deposit.reference,
      description: `Deposit: ${product.symbol}`,
      createdBy: approvedBy,
    });

    // Update portfolio total value
    const positions = await this.repository.findPositionsByPortfolio(portfolio.id);
    const totalValue = positions.reduce(
      (sum: number, p: { currentValue: unknown }) => sum + Number(p.currentValue),
      0,
    );
    await this.repository.updatePortfolioValue(portfolio.id, totalValue);

    this.eventEmitter.emit(
      InvestmentEventType.DEPOSIT_APPROVED,
      new InvestmentDepositApprovedEvent(
        depositId,
        deposit.userId,
        deposit.productId,
        quantity,
        approvedBy,
      ),
    );

    this.eventEmitter.emit(
      InvestmentEventType.PORTFOLIO_UPDATED,
      new PortfolioUpdatedEvent(deposit.userId, deposit.productId, quantity, 'deposit', approvedBy),
    );

    this.logger.log(`Deposit approved: ${depositId}, transaction: ${transaction.id}`);
    return this.mapper.toDepositResponseDto(updatedDeposit);
  }

  /**
   * Admin rejects a deposit.
   */
  async rejectDeposit(
    depositId: string,
    rejectedBy: string,
    reason: string,
  ): Promise<DepositResponseDto> {
    this.logger.log(`Rejecting deposit: ${depositId} by ${rejectedBy}`);

    const deposit = await this.repository.findDepositById(depositId);
    if (!deposit) throw new DepositNotFoundException(depositId);
    if (deposit.status !== DepositStatus.PENDING) {
      throw new DepositNotFoundException(depositId);
    }

    const updatedDeposit = await this.repository.updateDeposit(depositId, {
      status: DepositStatus.REJECTED,
      rejectedBy,
      rejectedAt: new Date(),
      rejectionReason: reason,
    });

    this.eventEmitter.emit(
      InvestmentEventType.DEPOSIT_REJECTED,
      new InvestmentDepositRejectedEvent(
        depositId,
        deposit.userId,
        deposit.productId,
        reason,
        rejectedBy,
      ),
    );

    this.logger.log(`Deposit rejected: ${depositId}`);
    return this.mapper.toDepositResponseDto(updatedDeposit);
  }

  /**
   * Admin approves a withdrawal. Creates transaction via Transaction Engine,
   * posts to ledger, and updates portfolio holdings.
   */
  async approveWithdrawal(
    withdrawalId: string,
    approvedBy: string,
    _notes?: string,
  ): Promise<WithdrawalResponseDto> {
    this.logger.log(`Approving withdrawal: ${withdrawalId} by ${approvedBy}`);

    const withdrawal = await this.repository.findWithdrawalById(withdrawalId);
    if (!withdrawal) throw new WithdrawalNotFoundException(withdrawalId);
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new WithdrawalNotFoundException(withdrawalId);
    }

    const product = await this.repository.findProductById(withdrawal.productId);
    if (!product) throw new AssetNotFoundException(withdrawal.productId);

    const accountId = await this.resolveLedgerAccountId(withdrawal.userId);

    // Create transaction through Transaction Engine
    const transaction = await this.transactionService.createTransaction({
      type: TransactionType.CRYPTO_WITHDRAWAL,
      accountId,
      amount: String(withdrawal.amount),
      currency: 'USD',
      description: `Investment withdrawal: ${product.symbol} - ${withdrawal.reference}`,
      reference: withdrawal.reference,
      metadata: {
        investmentType: 'CRYPTO',
        productSymbol: product.symbol,
        productId: withdrawal.productId,
        withdrawalId: withdrawal.id,
        destinationAddress: withdrawal.toAddress,
        fee: String(withdrawal.fee),
      },
      createdBy: approvedBy,
    });

    // Update withdrawal status
    const updatedWithdrawal = await this.repository.updateWithdrawal(withdrawalId, {
      status: WithdrawalStatus.APPROVED,
      approvedBy,
      approvedAt: new Date(),
    });

    // Update holdings (reduce quantity)
    const portfolio = await this.repository.findOrCreatePortfolio(withdrawal.userId);
    const existingPosition = await this.repository.findPosition(portfolio.id, withdrawal.productId);

    const quantity = Number(withdrawal.amount);
    const pricePerUnit = product.priceHistory?.[0] ? Number(product.priceHistory[0].price) : 0;

    if (existingPosition) {
      const newQuantity = Number(existingPosition.quantity) - quantity;
      const newTotalCost = newQuantity * Number(existingPosition.averageCost);
      const currentValue = newQuantity * pricePerUnit;

      await this.repository.upsertPosition({
        portfolioId: portfolio.id,
        productId: withdrawal.productId,
        quantity: Math.max(0, newQuantity),
        averageCost: Number(existingPosition.averageCost),
        totalCost: Math.max(0, newTotalCost),
        currentValue,
        profitLoss: currentValue - Math.max(0, newTotalCost),
        profitLossPct: newTotalCost > 0 ? ((currentValue - newTotalCost) / newTotalCost) * 100 : 0,
      });
    }

    // Record portfolio entry
    await this.repository.createEntry({
      portfolioId: portfolio.id,
      productId: withdrawal.productId,
      type: PortfolioTransactionType.WITHDRAWAL,
      quantity,
      pricePerUnit,
      totalAmount: quantity * pricePerUnit,
      reference: withdrawal.reference,
      description: `Withdrawal: ${product.symbol}`,
      createdBy: approvedBy,
    });

    // Update portfolio total value
    const positions = await this.repository.findPositionsByPortfolio(portfolio.id);
    const totalValue = positions.reduce(
      (sum: number, p: { currentValue: unknown }) => sum + Number(p.currentValue),
      0,
    );
    await this.repository.updatePortfolioValue(portfolio.id, totalValue);

    this.eventEmitter.emit(
      InvestmentEventType.WITHDRAWAL_APPROVED,
      new InvestmentWithdrawalApprovedEvent(
        withdrawalId,
        withdrawal.userId,
        withdrawal.productId,
        quantity,
        approvedBy,
      ),
    );

    this.eventEmitter.emit(
      InvestmentEventType.PORTFOLIO_UPDATED,
      new PortfolioUpdatedEvent(
        withdrawal.userId,
        withdrawal.productId,
        quantity,
        'withdrawal',
        approvedBy,
      ),
    );

    this.logger.log(`Withdrawal approved: ${withdrawalId}, transaction: ${transaction.id}`);
    return this.mapper.toWithdrawalResponseDto(updatedWithdrawal);
  }

  /**
   * Admin rejects a withdrawal.
   */
  async rejectWithdrawal(
    withdrawalId: string,
    rejectedBy: string,
    reason: string,
  ): Promise<WithdrawalResponseDto> {
    this.logger.log(`Rejecting withdrawal: ${withdrawalId} by ${rejectedBy}`);

    const withdrawal = await this.repository.findWithdrawalById(withdrawalId);
    if (!withdrawal) throw new WithdrawalNotFoundException(withdrawalId);
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new WithdrawalNotFoundException(withdrawalId);
    }

    const updatedWithdrawal = await this.repository.updateWithdrawal(withdrawalId, {
      status: WithdrawalStatus.REJECTED,
      rejectedBy,
      rejectedAt: new Date(),
      rejectionReason: reason,
    });

    this.eventEmitter.emit(
      InvestmentEventType.WITHDRAWAL_REJECTED,
      new InvestmentWithdrawalRejectedEvent(
        withdrawalId,
        withdrawal.userId,
        withdrawal.productId,
        reason,
        rejectedBy,
      ),
    );

    this.logger.log(`Withdrawal rejected: ${withdrawalId}`);
    return this.mapper.toWithdrawalResponseDto(updatedWithdrawal);
  }

  /**
   * Finds the fixed USD cash product that admin balance adjustments post
   * against, creating it the first time it's needed. It carries a constant
   * $1 price so its position quantity reads directly as a dollar amount.
   */
  private async ensureCashProduct() {
    const created = await this.repository.createProduct({
      symbol: ADMIN_BALANCE_CURRENCY,
      name: 'US Dollar',
      assetClass: AssetClass.MONEY_MARKET,
      decimals: 2,
    });
    await this.repository.createPrice({
      productId: created.id,
      price: 1,
      currency: ADMIN_BALANCE_CURRENCY,
    });
    return this.repository.findProductBySymbol(ADMIN_BALANCE_CURRENCY);
  }

  /**
   * Admin-only direct adjustment of a customer's holding for one asset — no
   * pending deposit/withdrawal request required. It updates the position and
   * writes a portfolio entry and a Transaction Engine record the exact same
   * way {@link approveDeposit}/{@link approveWithdrawal} do, so from the
   * customer's side it reads as an ordinary deposit or withdrawal: same
   * holding movement, same portfolio transaction list entry, same transaction
   * history entry. The admin's real reason is written to the caller's audit
   * trail only (see AdminOrchestrationService) — nothing here is admin-labeled.
   */
  async adminAdjustBalance(
    userId: string,
    productSymbol: string,
    direction: 'CREDIT' | 'DEBIT',
    amount: number,
    performedBy: string,
    force = false,
  ): Promise<{
    userId: string;
    productSymbol: string;
    direction: 'CREDIT' | 'DEBIT';
    amount: number;
    newQuantity: number;
    reference: string;
    transactionId: string;
  }> {
    if (!(amount > 0)) {
      throw new BadRequestException('Amount must be a positive number');
    }

    let product = await this.repository.findProductBySymbol(productSymbol);
    if (!product && productSymbol === ADMIN_BALANCE_CURRENCY) {
      product = await this.ensureCashProduct();
    }
    if (!product) {
      throw new AssetNotFoundException(productSymbol);
    }
    if (product.status !== AssetStatus.ACTIVE) {
      throw new AssetDisabledException(productSymbol);
    }

    const portfolio = await this.repository.findOrCreatePortfolio(userId);
    const existingPosition = await this.repository.findPosition(portfolio.id, product.id);
    const pricePerUnit = product.priceHistory?.[0] ? Number(product.priceHistory[0].price) : 0;
    const existingQuantity = existingPosition ? Number(existingPosition.quantity) : 0;

    if (direction === 'DEBIT' && !force && amount > existingQuantity) {
      throw new BadRequestException(
        "Amount exceeds the customer's current holding for this asset. Pass force to override.",
      );
    }

    const reference = `${direction === 'CREDIT' ? 'DEP' : 'WD'}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const newQuantity =
      direction === 'CREDIT' ? existingQuantity + amount : Math.max(0, existingQuantity - amount);
    const totalCost =
      direction === 'CREDIT'
        ? Number(existingPosition?.totalCost ?? 0) + amount * pricePerUnit
        : newQuantity * Number(existingPosition?.averageCost ?? pricePerUnit);
    const averageCost = newQuantity > 0 ? totalCost / newQuantity : 0;
    const currentValue = newQuantity * pricePerUnit;

    await this.repository.upsertPosition({
      portfolioId: portfolio.id,
      productId: product.id,
      quantity: newQuantity,
      averageCost,
      totalCost,
      currentValue,
      profitLoss: currentValue - totalCost,
      profitLossPct: totalCost > 0 ? ((currentValue - totalCost) / totalCost) * 100 : 0,
    });

    await this.repository.createEntry({
      portfolioId: portfolio.id,
      productId: product.id,
      type:
        direction === 'CREDIT'
          ? PortfolioTransactionType.DEPOSIT
          : PortfolioTransactionType.WITHDRAWAL,
      quantity: amount,
      pricePerUnit,
      totalAmount: amount * pricePerUnit,
      reference,
      description:
        direction === 'CREDIT' ? `Deposit: ${product.symbol}` : `Withdrawal: ${product.symbol}`,
      createdBy: performedBy,
    });

    const positions = await this.repository.findPositionsByPortfolio(portfolio.id);
    const totalValue = positions.reduce(
      (sum: number, p: { currentValue: unknown }) => sum + Number(p.currentValue),
      0,
    );
    await this.repository.updatePortfolioValue(portfolio.id, totalValue);

    const accountId = await this.resolveLedgerAccountId(userId);

    const transaction = await this.transactionService.createTransaction({
      type:
        direction === 'CREDIT' ? TransactionType.CRYPTO_DEPOSIT : TransactionType.CRYPTO_WITHDRAWAL,
      accountId,
      amount: String(amount),
      currency: 'USD',
      description: `Investment ${direction === 'CREDIT' ? 'deposit' : 'withdrawal'}: ${product.symbol} - ${reference}`,
      reference,
      metadata: {
        investmentType: 'CRYPTO',
        productSymbol: product.symbol,
        productId: product.id,
      },
      createdBy: performedBy,
    });

    this.eventEmitter.emit(
      InvestmentEventType.PORTFOLIO_UPDATED,
      new PortfolioUpdatedEvent(
        userId,
        product.id,
        amount,
        direction === 'CREDIT' ? 'deposit' : 'withdrawal',
        performedBy,
      ),
    );

    this.logger.log(
      `Admin ${direction} of ${amount} ${product.symbol} for user ${userId}, transaction: ${transaction.id}`,
    );

    return {
      userId,
      productSymbol: product.symbol,
      direction,
      amount,
      newQuantity,
      reference,
      transactionId: transaction.id,
    };
  }
}

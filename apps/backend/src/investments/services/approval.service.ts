/* eslint-disable @typescript-eslint/consistent-type-imports */
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
} from '../exceptions/investment-domain.exception';
import { TransactionService } from '../../transactions/services/transaction.service';
import { TransactionType } from '../../transactions/enums/transaction-type.enum';

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  constructor(
    private readonly repository: InvestmentRepository,
    private readonly mapper: InvestmentMapper,
    private readonly policy: InvestmentPolicy,
    private readonly eventEmitter: EventEmitter2,
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * Admin approves a deposit. Creates transaction via Transaction Engine,
   * posts to ledger, and updates portfolio holdings.
   */
  async approveDeposit(depositId: string, approvedBy: string, _notes?: string): Promise<DepositResponseDto> {
    this.logger.log(`Approving deposit: ${depositId} by ${approvedBy}`);

    const deposit = await this.repository.findDepositById(depositId);
    if (!deposit) throw new DepositNotFoundException(depositId);
    if (deposit.status !== DepositStatus.PENDING) {
      throw new DepositNotFoundException(depositId);
    }

    const product = await this.repository.findProductById(deposit.productId);
    if (!product) throw new AssetNotFoundException(deposit.productId);

    // Create transaction through Transaction Engine (no accounting in Investments)
    const transaction = await this.transactionService.createTransaction({
      type: TransactionType.CRYPTO_DEPOSIT,
      accountId: deposit.userId,
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
    const totalValue = positions.reduce((sum: number, p: { currentValue: unknown }) => sum + Number(p.currentValue), 0);
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
  async rejectDeposit(depositId: string, rejectedBy: string, reason: string): Promise<DepositResponseDto> {
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
      new InvestmentDepositRejectedEvent(depositId, deposit.userId, deposit.productId, reason, rejectedBy),
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

    // Create transaction through Transaction Engine
    const transaction = await this.transactionService.createTransaction({
      type: TransactionType.CRYPTO_WITHDRAWAL,
      accountId: withdrawal.userId,
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
    const totalValue = positions.reduce((sum: number, p: { currentValue: unknown }) => sum + Number(p.currentValue), 0);
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
      new PortfolioUpdatedEvent(withdrawal.userId, withdrawal.productId, quantity, 'withdrawal', approvedBy),
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
      new InvestmentWithdrawalRejectedEvent(withdrawalId, withdrawal.userId, withdrawal.productId, reason, rejectedBy),
    );

    this.logger.log(`Withdrawal rejected: ${withdrawalId}`);
    return this.mapper.toWithdrawalResponseDto(updatedWithdrawal);
  }
}
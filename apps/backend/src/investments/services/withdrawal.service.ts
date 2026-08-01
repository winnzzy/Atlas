/* eslint-disable @typescript-eslint/consistent-type-imports */
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { InvestmentRepository } from '../repositories/investment.repository';
import { InvestmentMapper } from '../mappers/investment.mapper';
import { InvestmentPolicy } from '../policies/investment.policy';
import { InvestmentValidator } from '../validators/investment.validator';
import type { WithdrawalResponseDto, CreateWithdrawalDto } from '../dto/withdrawal.dto';
import type { AssetStatus } from '../enums/investment-status.enum';
import { WithdrawalStatus } from '../enums/investment-status.enum';
import {
  InvestmentEventType,
  InvestmentWithdrawalRequestedEvent,
} from '../events/investment.events';
import {
  AssetNotFoundException,
  WithdrawalNotFoundException,
  BelowMinWithdrawalException,
  InsufficientHoldingsException,
} from '../exceptions/investment-domain.exception';

@Injectable()
export class WithdrawalService {
  private readonly logger = new Logger(WithdrawalService.name);

  constructor(
    private readonly repository: InvestmentRepository,
    private readonly mapper: InvestmentMapper,
    private readonly policy: InvestmentPolicy,
    private readonly validator: InvestmentValidator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Customer requests a withdrawal. Creates a pending withdrawal record.
   * No money movement yet — that happens only on admin approval.
   */
  async requestWithdrawal(userId: string, dto: CreateWithdrawalDto): Promise<WithdrawalResponseDto> {
    this.logger.log(`Withdrawal request from user ${userId} for ${dto.amount} of product ${dto.productSymbol}`);

    this.validator.validateCreateWithdrawal(dto);

    // Look up product by symbol
    const product = await this.repository.findProductBySymbol(dto.productSymbol);
    if (!product) throw new AssetNotFoundException(dto.productSymbol);

    // Check minimum withdrawal
    if (product.minWithdrawal && dto.amount < Number(product.minWithdrawal)) {
      throw new BelowMinWithdrawalException(dto.amount, Number(product.minWithdrawal));
    }

    // Verify user has sufficient holdings
    const portfolio = await this.repository.findOrCreatePortfolio(userId);
    const holding = await this.repository.findHolding(portfolio.id, product.id);
    if (!holding || Number(holding.quantity) < dto.amount) {
      throw new InsufficientHoldingsException(
        dto.amount,
        holding ? Number(holding.quantity) : 0,
      );
    }

    // Calculate fee and net amount
    const fee = product.withdrawalFee ? Number(product.withdrawalFee) : 0;
    const netAmount = dto.amount - fee;

    if (netAmount <= 0) {
      throw new InsufficientHoldingsException(dto.amount, 0);
    }

    const userWithdrawals = await this.repository.findWithdrawalsByUser(userId);
    const pendingForProduct = userWithdrawals.find(
      (withdrawal) =>
        withdrawal.productId === product.id &&
        withdrawal.status === WithdrawalStatus.PENDING,
    );

    this.policy.assertCanWithdraw(
      product.status as AssetStatus,
      pendingForProduct ? WithdrawalStatus.PENDING : null,
      dto.amount,
      Number(holding.quantity),
      Number(product.minWithdrawal ?? 0),
      fee,
    );

    const reference = `WTH-${randomUUID().slice(0, 8).toUpperCase()}`;

    const withdrawal = await this.repository.createWithdrawal({
      userId,
      productId: product.id,
      amount: dto.amount,
      fee,
      netAmount,
      toAddress: dto.toAddress,
      toMemo: dto.toMemo,
      network: 'CRYPTO',
      reference,
    });

    this.eventEmitter.emit(
      InvestmentEventType.WITHDRAWAL_REQUESTED,
      new InvestmentWithdrawalRequestedEvent(withdrawal.id, userId, product.id, dto.amount, dto.toAddress),
    );

    this.logger.log(`Withdrawal created: ${withdrawal.id} (${reference})`);
    return this.mapper.toWithdrawalResponseDto(withdrawal);
  }

  /**
   * Get withdrawal by ID.
   */
  async getWithdrawal(withdrawalId: string): Promise<WithdrawalResponseDto> {
    const withdrawal = await this.repository.findWithdrawalById(withdrawalId);
    if (!withdrawal) throw new WithdrawalNotFoundException(withdrawalId);
    return this.mapper.toWithdrawalResponseDto(withdrawal);
  }

  /**
   * List withdrawals with optional filters.
   */
  async listWithdrawals(filters?: {
    userId?: string;
    productId?: string;
    status?: string;
    reference?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<WithdrawalResponseDto[]> {
    const withdrawals = filters?.userId
      ? await this.repository.findWithdrawalsByUser(filters.userId)
      : await this.repository.findWithdrawals();
    return withdrawals.map((w) => this.mapper.toWithdrawalResponseDto(w));
  }

  /**
   * Get withdrawals for a specific user.
   */
  async getUserWithdrawals(userId: string): Promise<WithdrawalResponseDto[]> {
    return this.listWithdrawals({ userId });
  }
}
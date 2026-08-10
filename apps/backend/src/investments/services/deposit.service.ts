/* eslint-disable @typescript-eslint/consistent-type-imports */
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { InvestmentRepository } from '../repositories/investment.repository';
import { InvestmentValidator } from '../validators/investment.validator';
import { InvestmentMapper } from '../mappers/investment.mapper';
import { InvestmentDepositRequestedEvent, InvestmentEventType } from '../events/investment.events';
import type { DepositStatus } from '../enums/investment-status.enum';
import { AssetStatus } from '../enums/investment-status.enum';
import { AssetDisabledException, DepositNotFoundException } from '../exceptions/investment-domain.exception';
import type { CreateDepositDto, DepositResponseDto } from '../dto/deposit.dto';
import type { SearchDepositsDto } from '../dto/search-investments.dto';

@Injectable()
export class DepositService {
  private readonly logger = new Logger(DepositService.name);

  constructor(
    private readonly repo: InvestmentRepository,
    private readonly validator: InvestmentValidator,
    private readonly mapper: InvestmentMapper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createDeposit(userId: string, dto: CreateDepositDto): Promise<DepositResponseDto> {
    this.validator.validateAmount(dto.amount);

    const product = await this.repo.findProductBySymbol(dto.productSymbol);
    if (!product) {
      throw new AssetDisabledException(dto.productSymbol);
    }
    if (product.status !== AssetStatus.ACTIVE) {
      throw new AssetDisabledException(dto.productSymbol);
    }

    const wallets = await this.repo.findWalletsByProduct(product.id);
    const activeWallet = wallets.find((w: { status: string }) => w.status === 'ACTIVE');
    if (!activeWallet) {
      throw new AssetDisabledException(`No active wallet for ${dto.productSymbol}`);
    }

    const reference = `DEP-${randomUUID().slice(0, 8).toUpperCase()}`;

    const deposit = await this.repo.createDeposit({
      userId,
      productId: product.id,
      walletId: activeWallet.id,
      amount: dto.amount,
      network: activeWallet.network,
      reference,
      txHash: dto.txHash,
    });

    this.eventEmitter.emit(
      InvestmentEventType.DEPOSIT_REQUESTED,
      new InvestmentDepositRequestedEvent(
        deposit.id,
        userId,
        product.id,
        dto.amount,
        reference,
      ),
    );

    return this.mapper.toDepositResponseDto(deposit);
  }

  async getDeposit(id: string): Promise<DepositResponseDto> {
    const deposit = await this.repo.findDepositById(id);
    if (!deposit) throw new DepositNotFoundException(id);
    return this.mapper.toDepositResponseDto(deposit);
  }

  async getDepositsByUser(userId: string): Promise<DepositResponseDto[]> {
    const deposits = await this.repo.findDepositsByUser(userId);
    return deposits.map((d: unknown) => this.mapper.toDepositResponseDto(d as never));
  }

  async requestDeposit(userId: string, dto: CreateDepositDto): Promise<DepositResponseDto> {
    return this.createDeposit(userId, dto);
  }

  async getUserDeposits(userId: string): Promise<DepositResponseDto[]> {
    return this.getDepositsByUser(userId);
  }

  async listDeposits(filters?: { userId?: string; productId?: string; status?: string }): Promise<DepositResponseDto[]> {
    if (filters?.productId || filters?.status) {
      const result = await this.repo.searchDeposits({
        userId: filters?.userId,
        productSymbol: filters?.productId,
        status: filters?.status as DepositStatus,
      });
      return result.data.map((d: unknown) => this.mapper.toDepositResponseDto(d as never));
    }
    const deposits = await this.repo.findDeposits(filters?.userId);
    return deposits.map((d: unknown) => this.mapper.toDepositResponseDto(d as never));
  }

  async searchDeposits(dto: SearchDepositsDto) {
    return this.repo.searchDeposits(dto);
  }
}
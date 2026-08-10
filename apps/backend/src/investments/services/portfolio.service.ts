import { Inject, Injectable, Logger } from '@nestjs/common';
import { InvestmentRepository } from '../repositories/investment.repository';
import { InvestmentMapper } from '../mappers/investment.mapper';
import type { PortfolioResponseDto, HoldingDto, PortfolioTransactionResponseDto } from '../dto/portfolio.dto';

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(
    @Inject(InvestmentRepository) private readonly repository: InvestmentRepository,
    @Inject(InvestmentMapper) private readonly mapper: InvestmentMapper,
  ) {}

  /**
   * Get the full portfolio for a user, including all holdings with current valuations.
   */
  async getPortfolio(userId: string): Promise<PortfolioResponseDto> {
    this.logger.log(`Building portfolio for user: ${userId}`);

    const portfolio = await this.repository.findOrCreatePortfolio(userId);
    const holdings = await this.repository.findHoldingsByUser(userId);
    const holdingDtos: HoldingDto[] = [];
    let totalRealizedPnl = 0;

    for (const holding of holdings) {
      if (Number(holding.quantity) <= 0) continue;

      const currentPrice = await this.repository.findLatestPrice(holding.productId);
      const price = currentPrice ? Number(currentPrice.price) : 0;

      totalRealizedPnl += Number(holding.profitLoss ?? 0);

      const holdingDto = this.mapper.toHoldingDto(
        {
          ...holding,
          product: {
            ...holding.product,
            priceHistory: currentPrice ? [currentPrice] : [],
          },
        } as never,
        price,
        0,
      );

      holdingDtos.push(holdingDto);
    }

    const totalValue = holdingDtos.reduce((sum, dto) => sum + dto.currentValue, 0);

    // Recalculate allocation percentages now that we know totalValue
    for (const dto of holdingDtos) {
      dto.allocationPct = totalValue > 0
        ? Number(((dto.currentValue / totalValue) * 100).toFixed(2))
        : 0;
    }

    return this.mapper.toPortfolioResponseDto(
      portfolio.id,
      userId,
      holdingDtos,
      totalRealizedPnl,
      portfolio.createdAt,
      portfolio.updatedAt,
    );
  }

  /**
   * Get a specific holding for a user and product.
   */
  async getHolding(userId: string, productId: string): Promise<HoldingDto | null> {
    const portfolio = await this.repository.findOrCreatePortfolio(userId);
    const holding = await this.repository.findHolding(portfolio.id, productId);
    if (!holding) return null;

    const currentPrice = await this.repository.findLatestPrice(holding.productId);
    const price = currentPrice ? Number(currentPrice.price) : 0;

    return this.mapper.toHoldingDto(
      {
        ...holding,
        product: {
          ...holding.product,
          priceHistory: currentPrice ? [currentPrice] : [],
        },
      } as never,
      price,
      0,
    );
  }

  async getPortfolioTransactions(
    userId: string,
    filters?: { productId?: string; type?: string },
  ): Promise<PortfolioTransactionResponseDto[]> {
    const entries = await this.repository.findPortfolioTransactions(userId);
    const filtered = entries.filter((entry: { productId?: string; type?: string }) => {
      if (filters?.productId && entry.productId !== filters.productId) {
        return false;
      }
      if (filters?.type && entry.type !== filters.type) {
        return false;
      }
      return true;
    });

    return filtered.map((entry: unknown) => this.mapper.toPortfolioTransactionResponseDto(entry as never));
  }
}

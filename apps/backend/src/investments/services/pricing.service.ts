import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvestmentRepository } from '../repositories/investment.repository';
import { InvestmentMapper } from '../mappers/investment.mapper';
import { InvestmentPolicy } from '../policies/investment.policy';
import type { PriceResponseDto, UpdatePriceDto } from '../dto/price.dto';
import { AssetStatus } from '../enums/investment-status.enum';
import { InvestmentEventType, AssetPriceUpdatedEvent } from '../events/investment.events';
import { InvestmentDomainException } from '../exceptions/investment-domain.exception';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    @Inject(InvestmentRepository) private readonly repository: InvestmentRepository,
    @Inject(InvestmentMapper) private readonly mapper: InvestmentMapper,
    @Inject(InvestmentPolicy) private readonly policy: InvestmentPolicy,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
  ) {}

  async updatePrice(dto: UpdatePriceDto, updatedBy: string): Promise<PriceResponseDto> {
    const product = await this.repository.findProductBySymbol(dto.productSymbol);
    if (!product) {
      throw InvestmentDomainException.assetNotFound(dto.productSymbol);
    }

    const productId = product.id;
    this.logger.log(`Updating price for product: ${productId} to ${dto.price}`);

    this.policy.assertCanUpdatePrice(product.status as AssetStatus);

    // Get previous price for change calculation
    const previousPrice = await this.repository.findLatestPrice(productId);
    const change24h = previousPrice ? dto.price - Number(previousPrice.price) : 0;
    const change24hPct = previousPrice && Number(previousPrice.price) > 0
      ? (change24h / Number(previousPrice.price)) * 100
      : 0;

    const price = await this.repository.createPrice({
      productId,
      price: dto.price,
      currency: 'USD',
      change24h,
      change24hPct,
      marketCap: dto.marketCap,
      volume24h: dto.volume24h,
      updatedBy,
    });

    this.eventEmitter.emit(
      InvestmentEventType.ASSET_PRICE_UPDATED,
      new AssetPriceUpdatedEvent(productId, product.symbol, dto.price, 'USD', updatedBy),
    );

    this.logger.log(`Price updated for ${product.symbol}: $${dto.price}`);
    return this.mapper.toPriceResponseDto(price);
  }

  async getCurrentPrice(productId: string): Promise<PriceResponseDto> {
    const product = await this.repository.findProductById(productId);
    if (!product) {
      throw InvestmentDomainException.assetNotFound(productId);
    }

    const price = await this.repository.findLatestPrice(productId);
    if (!price) {
      throw InvestmentDomainException.priceNotFound(product.symbol);
    }

    return this.mapper.toPriceResponseDto(price);
  }

  async getLatestPrice(productId: string): Promise<PriceResponseDto> {
    return this.getCurrentPrice(productId);
  }

  async getPriceBySymbol(symbol: string): Promise<PriceResponseDto> {
    const product = await this.repository.findProductBySymbol(symbol);
    if (!product) {
      throw InvestmentDomainException.assetNotFound(symbol);
    }

    const price = await this.repository.findLatestPrice(product.id);
    if (!price) {
      throw InvestmentDomainException.priceNotFound(symbol);
    }

    return this.mapper.toPriceResponseDto(price);
  }

  async getAllPrices(): Promise<PriceResponseDto[]> {
    const products = await this.repository.findProducts({ status: AssetStatus.ACTIVE });
    const prices: PriceResponseDto[] = [];

    for (const product of products) {
      const price = await this.repository.findLatestPrice(product.id);
      if (price) {
        prices.push(this.mapper.toPriceResponseDto(price));
      }
    }

    return prices;
  }

  async getPriceHistory(
    productId: string,
    _from?: Date,
    _to?: Date,
  ): Promise<PriceResponseDto[]> {
    const product = await this.repository.findProductById(productId);
    if (!product) {
      throw InvestmentDomainException.assetNotFound(productId);
    }

    const prices = await this.repository.findPriceHistory(productId);
    return prices.map((p: unknown) => this.mapper.toPriceResponseDto(p as never));
  }
}
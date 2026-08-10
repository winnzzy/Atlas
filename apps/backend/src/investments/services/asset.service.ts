import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvestmentRepository } from '../repositories/investment.repository';
import { InvestmentMapper } from '../mappers/investment.mapper';
import { InvestmentPolicy } from '../policies/investment.policy';
import { InvestmentValidator } from '../validators/investment.validator';
import type { AssetResponseDto, CreateAssetDto, UpdateAssetDto } from '../dto/create-asset.dto';
import { AssetStatus } from '../enums/investment-status.enum';
import { InvestmentEventType, AssetStatusChangedEvent } from '../events/investment.events';
import { InvestmentDomainException } from '../exceptions/investment-domain.exception';

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);

  constructor(
    @Inject(InvestmentRepository) private readonly repository: InvestmentRepository,
    @Inject(InvestmentMapper) private readonly mapper: InvestmentMapper,
    @Inject(InvestmentPolicy) private readonly policy: InvestmentPolicy,
    @Inject(InvestmentValidator) private readonly validator: InvestmentValidator,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
  ) {}

  async createAsset(dto: CreateAssetDto, createdBy: string): Promise<AssetResponseDto> {
    void createdBy;
    this.logger.log(`Creating asset: ${dto.symbol} (${dto.assetClass})`);
    this.validator.validateCreateAsset(dto);

    const existing = await this.repository.findProductBySymbol(dto.symbol);
    if (existing) {
      throw InvestmentDomainException.assetAlreadyExists(dto.symbol);
    }

    const product = await this.repository.createProduct({
      symbol: dto.symbol,
      name: dto.name,
      assetClass: dto.assetClass,
      description: dto.description,
      iconUrl: dto.iconUrl,
      decimals: dto.decimals ?? 8,
      minDeposit: dto.minDeposit,
      minWithdrawal: dto.minWithdrawal,
      withdrawalFee: dto.withdrawalFee,
    });

    this.logger.log(`Asset created: ${product.id} (${dto.symbol})`);
    return this.mapper.toAssetResponseDto(product);
  }

  async updateAsset(productId: string, dto: UpdateAssetDto, updatedBy: string): Promise<AssetResponseDto> {
    this.logger.log(`Updating asset: ${productId}`);

    const product = await this.repository.findProductById(productId);
    if (!product) {
      throw InvestmentDomainException.assetNotFound(productId);
    }

    const updated = await this.repository.updateProduct(productId, {
      name: dto.name,
      description: dto.description,
      iconUrl: dto.iconUrl,
      decimals: dto.decimals,
      minDeposit: dto.minDeposit,
      minWithdrawal: dto.minWithdrawal,
      withdrawalFee: dto.withdrawalFee,
    });

    void updatedBy;

    return this.mapper.toAssetResponseDto(updated);
  }

  async suspendAsset(productId: string, performedBy: string): Promise<AssetResponseDto> {
    const product = await this.repository.findProductById(productId);
    if (!product) throw InvestmentDomainException.assetNotFound(productId);

    this.policy.assertAssetCanSuspend(product.status as AssetStatus);

    const updated = await this.repository.updateProductStatus(productId, AssetStatus.SUSPENDED);

    this.eventEmitter.emit(InvestmentEventType.ASSET_STATUS_CHANGED, new AssetStatusChangedEvent(
      productId, product.symbol, product.status, AssetStatus.SUSPENDED, performedBy,
    ));

    return this.mapper.toAssetResponseDto(updated);
  }

  async activateAsset(productId: string, performedBy: string): Promise<AssetResponseDto> {
    const product = await this.repository.findProductById(productId);
    if (!product) throw InvestmentDomainException.assetNotFound(productId);

    this.policy.assertAssetCanActivate(product.status as AssetStatus);

    const updated = await this.repository.updateProductStatus(productId, AssetStatus.ACTIVE);

    this.eventEmitter.emit(InvestmentEventType.ASSET_STATUS_CHANGED, new AssetStatusChangedEvent(
      productId, product.symbol, product.status, AssetStatus.ACTIVE, performedBy,
    ));

    return this.mapper.toAssetResponseDto(updated);
  }

  async disableAsset(productId: string, performedBy: string): Promise<AssetResponseDto> {
    const product = await this.repository.findProductById(productId);
    if (!product) throw InvestmentDomainException.assetNotFound(productId);

    this.policy.assertAssetCanDisable(product.status as AssetStatus);

    const updated = await this.repository.updateProductStatus(productId, AssetStatus.DISABLED);

    this.eventEmitter.emit(InvestmentEventType.ASSET_STATUS_CHANGED, new AssetStatusChangedEvent(
      productId, product.symbol, product.status, AssetStatus.DISABLED, performedBy,
    ));

    return this.mapper.toAssetResponseDto(updated);
  }

  async getAsset(productId: string): Promise<AssetResponseDto> {
    const product = await this.repository.findProductById(productId);
    if (!product) throw InvestmentDomainException.assetNotFound(productId);
    return this.mapper.toAssetResponseDto(product);
  }

  async listAssets(filters?: { assetClass?: string; status?: string; symbol?: string }): Promise<AssetResponseDto[]> {
    const products = await this.repository.findProducts(filters);
    return products.map((p: unknown) => this.mapper.toAssetResponseDto(p as never));
  }

  async enableAsset(productId: string, performedBy: string): Promise<AssetResponseDto> {
    return this.activateAsset(productId, performedBy);
  }

  async freezeAsset(productId: string, performedBy: string): Promise<AssetResponseDto> {
    return this.suspendAsset(productId, performedBy);
  }

  async getAssetBySymbol(symbol: string): Promise<AssetResponseDto> {
    const product = await this.repository.findProductBySymbol(symbol);
    if (!product) throw InvestmentDomainException.assetNotFound(symbol);
    return this.mapper.toAssetResponseDto(product);
  }
}
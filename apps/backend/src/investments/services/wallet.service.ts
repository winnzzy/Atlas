import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvestmentRepository } from '../repositories/investment.repository';
import { InvestmentMapper } from '../mappers/investment.mapper';
import { InvestmentPolicy } from '../policies/investment.policy';
import { InvestmentValidator } from '../validators/investment.validator';
import type { WalletResponseDto, CreateWalletDto, UpdateWalletDto } from '../dto/wallet.dto';
import type { AssetStatus} from '../enums/investment-status.enum';
import { WalletStatus } from '../enums/investment-status.enum';
import { InvestmentEventType, WalletAddressChangedEvent } from '../events/investment.events';
import { InvestmentDomainException } from '../exceptions/investment-domain.exception';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @Inject(InvestmentRepository) private readonly repository: InvestmentRepository,
    @Inject(InvestmentMapper) private readonly mapper: InvestmentMapper,
    @Inject(InvestmentPolicy) private readonly policy: InvestmentPolicy,
    @Inject(InvestmentValidator) private readonly validator: InvestmentValidator,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
  ) {}

  async createWallet(dto: CreateWalletDto, createdBy: string): Promise<WalletResponseDto> {
    this.logger.log(`Creating wallet for product: ${dto.productId} on network: ${dto.network}`);

    const product = await this.repository.findProductById(dto.productId);
    if (!product) {
      throw InvestmentDomainException.assetNotFound(dto.productId);
    }

    this.policy.assertCanManageWallet(product.status as AssetStatus);
    this.validator.validateCreateWallet(dto);

    // Check for duplicate address on same network
    const existing = await this.repository.findWalletByAddress(dto.address, dto.network);
    if (existing) {
      throw InvestmentDomainException.walletAddressExists(dto.address, dto.network);
    }

    const wallet = await this.repository.createWallet({
      productId: dto.productId,
      network: dto.network,
      address: dto.address,
      memo: dto.memo ?? null,
      label: dto.label ?? null,
      status: WalletStatus.ACTIVE,
    });

    this.eventEmitter.emit(
      InvestmentEventType.WALLET_ADDRESS_CHANGED,
      new WalletAddressChangedEvent(wallet.id, dto.productId, dto.network, dto.address, 'created', createdBy),
    );

    this.logger.log(`Wallet created: ${wallet.id}`);
    return this.mapper.toWalletResponseDto(wallet);
  }

  async updateWallet(walletId: string, dto: UpdateWalletDto, updatedBy: string): Promise<WalletResponseDto> {
    const wallet = await this.repository.findWalletById(walletId);
    if (!wallet) {
      throw InvestmentDomainException.walletNotFound(walletId);
    }

    const updated = await this.repository.updateWallet(walletId, {
      address: dto.address,
      memo: dto.memo,
      label: dto.label,
    });

    if (dto.address) {
      this.eventEmitter.emit(
        InvestmentEventType.WALLET_ADDRESS_CHANGED,
        new WalletAddressChangedEvent(walletId, wallet.productId, wallet.network, dto.address, 'updated', updatedBy),
      );
    }

    return this.mapper.toWalletResponseDto(updated);
  }

  async activateWallet(walletId: string, _performedBy: string): Promise<WalletResponseDto> {
    const wallet = await this.repository.findWalletById(walletId);
    if (!wallet) throw InvestmentDomainException.walletNotFound(walletId);

    const updated = await this.repository.updateWalletStatus(walletId, WalletStatus.ACTIVE);
    return this.mapper.toWalletResponseDto(updated);
  }

  async deactivateWallet(walletId: string, _performedBy: string): Promise<WalletResponseDto> {
    const wallet = await this.repository.findWalletById(walletId);
    if (!wallet) throw InvestmentDomainException.walletNotFound(walletId);

    const updated = await this.repository.updateWalletStatus(walletId, WalletStatus.INACTIVE);
    return this.mapper.toWalletResponseDto(updated);
  }

  async deleteWallet(walletId: string, performedBy: string): Promise<void> {
    const wallet = await this.repository.findWalletById(walletId);
    if (!wallet) throw InvestmentDomainException.walletNotFound(walletId);

    this.policy.assertWalletCanBeDeleted();
    await this.repository.deleteWallet(walletId);

    this.logger.log(`Wallet deleted: ${walletId} by ${performedBy}`);
  }

  async getWallet(walletId: string): Promise<WalletResponseDto> {
    const wallet = await this.repository.findWalletById(walletId);
    if (!wallet) throw InvestmentDomainException.walletNotFound(walletId);
    return this.mapper.toWalletResponseDto(wallet);
  }

  async getWalletsByProduct(productId: string): Promise<WalletResponseDto[]> {
    const wallets = await this.repository.findWalletsByProduct(productId);
    return wallets.map((w: unknown) => this.mapper.toWalletResponseDto(w as never));
  }

  async getActiveWalletForProduct(productId: string, network?: string): Promise<WalletResponseDto> {
    const wallets = await this.repository.findWalletsByProduct(productId);
    // Prisma's generated enum is nominally distinct from the domain enum even
    // though the values match, so compare as strings.
    const active = wallets.find(
      (w: { status: string; network: string }) =>
        String(w.status) === String(WalletStatus.ACTIVE) && (!network || w.network === network),
    );
    if (!active) {
      throw InvestmentDomainException.walletNotFound(productId);
    }
    return this.mapper.toWalletResponseDto(active);
  }

  async listWallets(filters?: { productId?: string; status?: string; network?: string }): Promise<WalletResponseDto[]> {
    const wallets = await this.repository.findWallets(filters);
    return wallets.map((w: unknown) => this.mapper.toWalletResponseDto(w as never));
  }
}
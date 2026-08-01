import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AssetService } from '../asset.service';
import { InvestmentRepository } from '../../repositories/investment.repository';
import { InvestmentMapper } from '../../mappers/investment.mapper';
import { InvestmentPolicy } from '../../policies/investment.policy';
import { InvestmentValidator } from '../../validators/investment.validator';
import { AssetStatus } from '../../enums/investment-status.enum';
import { InvestmentEventType } from '../../events/investment.events';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('AssetService', () => {
  let service: AssetService;
  let repository: jest.Mocked<InvestmentRepository>;
  let mapper: jest.Mocked<InvestmentMapper>;
  let policy: jest.Mocked<InvestmentPolicy>;
  let validator: jest.Mocked<InvestmentValidator>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockProduct = {
    id: 'prod-1',
    symbol: 'BTC',
    name: 'Bitcoin',
    assetClass: 'CRYPTO',
    status: AssetStatus.ACTIVE,
    description: 'Bitcoin cryptocurrency',
    iconUrl: 'https://example.com/btc.png',
    decimals: 8,
    minDeposit: 0.0001,
    minWithdrawal: 0.001,
    withdrawalFee: 0.0005,
    priceHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateDto = {
    symbol: 'BTC',
    name: 'Bitcoin',
    assetClass: 'CRYPTO' as never,
    description: 'Bitcoin cryptocurrency',
    iconUrl: 'https://example.com/btc.png',
    decimals: 8,
    minDeposit: 0.0001,
    minWithdrawal: 0.001,
    withdrawalFee: 0.0005,
  };

  beforeEach(async () => {
    const mockRepository = {
      findProductBySymbol: jest.fn(),
      findProductById: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      updateProductStatus: jest.fn(),
      findProducts: jest.fn(),
    };

    const mockMapper = {
      toAssetResponseDto: jest.fn(),
    };

    const mockPolicy = {
      assertAssetCanSuspend: jest.fn(),
      assertAssetCanActivate: jest.fn(),
      assertAssetCanDisable: jest.fn(),
    };

    const mockValidator = {
      validateCreateAsset: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        { provide: InvestmentRepository, useValue: mockRepository },
        { provide: InvestmentMapper, useValue: mockMapper },
        { provide: InvestmentPolicy, useValue: mockPolicy },
        { provide: InvestmentValidator, useValue: mockValidator },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<AssetService>(AssetService);
    repository = module.get(InvestmentRepository);
    mapper = module.get(InvestmentMapper);
    policy = module.get(InvestmentPolicy);
    validator = module.get(InvestmentValidator);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAsset', () => {
    it('should create a new asset successfully', async () => {
      repository.findProductBySymbol.mockResolvedValue(null);
      repository.createProduct.mockResolvedValue(mockProduct as never);
      mapper.toAssetResponseDto.mockReturnValue({ id: 'prod-1', symbol: 'BTC' } as never);

      const result = await service.createAsset(mockCreateDto, 'admin-1');

      expect(result).toBeDefined();
      expect(validator.validateCreateAsset).toHaveBeenCalledWith(mockCreateDto);
      expect(repository.findProductBySymbol).toHaveBeenCalledWith('BTC');
      expect(repository.createProduct).toHaveBeenCalled();
      expect(mapper.toAssetResponseDto).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw ConflictException if asset with same symbol already exists', async () => {
      repository.findProductBySymbol.mockResolvedValue(mockProduct as never);

      await expect(service.createAsset(mockCreateDto, 'admin-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateAsset', () => {
    it('should update an existing asset', async () => {
      const updateDto = { name: 'Bitcoin Updated', description: 'Updated desc' };
      repository.findProductById.mockResolvedValue(mockProduct as never);
      repository.updateProduct.mockResolvedValue({ ...mockProduct, ...updateDto } as never);
      mapper.toAssetResponseDto.mockReturnValue({ id: 'prod-1' } as never);

      const result = await service.updateAsset('prod-1', updateDto as never, 'admin-1');

      expect(result).toBeDefined();
      expect(repository.findProductById).toHaveBeenCalledWith('prod-1');
      expect(repository.updateProduct).toHaveBeenCalledWith('prod-1', updateDto);
    });

    it('should throw NotFoundException if product not found', async () => {
      repository.findProductById.mockResolvedValue(null);

      await expect(
        service.updateAsset('nonexistent', {} as never, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('suspendAsset', () => {
    it('should suspend an active asset', async () => {
      repository.findProductById.mockResolvedValue(mockProduct as never);
      repository.updateProductStatus.mockResolvedValue({ ...mockProduct, status: AssetStatus.SUSPENDED } as never);
      mapper.toAssetResponseDto.mockReturnValue({ id: 'prod-1', status: 'SUSPENDED' } as never);

      const result = await service.suspendAsset('prod-1', 'admin-1');

      expect(result).toBeDefined();
      expect(policy.assertAssetCanSuspend).toHaveBeenCalledWith(AssetStatus.ACTIVE);
      expect(repository.updateProductStatus).toHaveBeenCalledWith('prod-1', AssetStatus.SUSPENDED);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        InvestmentEventType.ASSET_STATUS_CHANGED,
        expect.objectContaining({ oldStatus: AssetStatus.ACTIVE, newStatus: AssetStatus.SUSPENDED }),
      );
    });

    it('should throw NotFoundException if product not found', async () => {
      repository.findProductById.mockResolvedValue(null);

      await expect(service.suspendAsset('nonexistent', 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('activateAsset', () => {
    it('should activate a suspended asset', async () => {
      const suspendedProduct = { ...mockProduct, status: AssetStatus.SUSPENDED };
      repository.findProductById.mockResolvedValue(suspendedProduct as never);
      repository.updateProductStatus.mockResolvedValue({ ...mockProduct, status: AssetStatus.ACTIVE } as never);
      mapper.toAssetResponseDto.mockReturnValue({ id: 'prod-1', status: 'ACTIVE' } as never);

      const result = await service.activateAsset('prod-1', 'admin-1');

      expect(result).toBeDefined();
      expect(policy.assertAssetCanActivate).toHaveBeenCalledWith(AssetStatus.SUSPENDED);
      expect(repository.updateProductStatus).toHaveBeenCalledWith('prod-1', AssetStatus.ACTIVE);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        InvestmentEventType.ASSET_STATUS_CHANGED,
        expect.objectContaining({ oldStatus: AssetStatus.SUSPENDED, newStatus: AssetStatus.ACTIVE }),
      );
    });
  });

  describe('disableAsset', () => {
    it('should disable an asset', async () => {
      repository.findProductById.mockResolvedValue(mockProduct as never);
      repository.updateProductStatus.mockResolvedValue({ ...mockProduct, status: AssetStatus.DISABLED } as never);
      mapper.toAssetResponseDto.mockReturnValue({ id: 'prod-1', status: 'DISABLED' } as never);

      const result = await service.disableAsset('prod-1', 'admin-1');

      expect(result).toBeDefined();
      expect(policy.assertAssetCanDisable).toHaveBeenCalledWith(AssetStatus.ACTIVE);
      expect(repository.updateProductStatus).toHaveBeenCalledWith('prod-1', AssetStatus.DISABLED);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        InvestmentEventType.ASSET_STATUS_CHANGED,
        expect.objectContaining({ newStatus: AssetStatus.DISABLED }),
      );
    });
  });

  describe('getAsset', () => {
    it('should return an asset by id', async () => {
      repository.findProductById.mockResolvedValue(mockProduct as never);
      mapper.toAssetResponseDto.mockReturnValue({ id: 'prod-1', symbol: 'BTC' } as never);

      const result = await service.getAsset('prod-1');

      expect(result).toBeDefined();
      expect(repository.findProductById).toHaveBeenCalledWith('prod-1');
    });

    it('should throw NotFoundException if product not found', async () => {
      repository.findProductById.mockResolvedValue(null);

      await expect(service.getAsset('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAssetBySymbol', () => {
    it('should return an asset by symbol', async () => {
      repository.findProductBySymbol.mockResolvedValue(mockProduct as never);
      mapper.toAssetResponseDto.mockReturnValue({ id: 'prod-1', symbol: 'BTC' } as never);

      const result = await service.getAssetBySymbol('BTC');

      expect(result).toBeDefined();
      expect(repository.findProductBySymbol).toHaveBeenCalledWith('BTC');
    });

    it('should throw NotFoundException if product not found by symbol', async () => {
      repository.findProductBySymbol.mockResolvedValue(null);

      await expect(service.getAssetBySymbol('UNKNOWN')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listAssets', () => {
    it('should return list of assets', async () => {
      repository.findProducts.mockResolvedValue([mockProduct] as never);
      mapper.toAssetResponseDto.mockReturnValue({ id: 'prod-1', symbol: 'BTC' } as never);

      const result = await service.listAssets({ status: AssetStatus.ACTIVE });

      expect(result).toHaveLength(1);
      expect(repository.findProducts).toHaveBeenCalledWith({ status: AssetStatus.ACTIVE });
    });

    it('should return empty list when no products match', async () => {
      repository.findProducts.mockResolvedValue([]);

      const result = await service.listAssets();

      expect(result).toEqual([]);
    });
  });

  describe('enableAsset', () => {
    it('should delegate to activateAsset', async () => {
      const spy = jest.spyOn(service, 'activateAsset').mockResolvedValue({} as never);

      await service.enableAsset('prod-1', 'admin-1');

      expect(spy).toHaveBeenCalledWith('prod-1', 'admin-1');
    });
  });

  describe('freezeAsset', () => {
    it('should delegate to suspendAsset', async () => {
      const spy = jest.spyOn(service, 'suspendAsset').mockResolvedValue({} as never);

      await service.freezeAsset('prod-1', 'admin-1');

      expect(spy).toHaveBeenCalledWith('prod-1', 'admin-1');
    });
  });
});
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PricingService } from '../pricing.service';
import { InvestmentRepository } from '../../repositories/investment.repository';
import { InvestmentMapper } from '../../mappers/investment.mapper';
import { InvestmentPolicy } from '../../policies/investment.policy';
import { InvestmentEventType } from '../../events/investment.events';
import { AssetStatus } from '../../enums/investment-status.enum';
import { NotFoundException } from '@nestjs/common';

describe('PricingService', () => {
  let service: PricingService;
  let repository: jest.Mocked<InvestmentRepository>;
  let mapper: jest.Mocked<InvestmentMapper>;
  let policy: jest.Mocked<InvestmentPolicy>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockProduct = {
    id: 'prod-1',
    symbol: 'BTC',
    name: 'Bitcoin',
    status: AssetStatus.ACTIVE,
  };

  const mockPrice = {
    id: 'price-1',
    productId: 'prod-1',
    price: 50000,
    currency: 'USD',
    change24h: 1000,
    change24hPct: 2.0,
    marketCap: 1000000000,
    volume24h: 50000000,
    updatedBy: 'admin-1',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = {
      findProductBySymbol: jest.fn(),
      findProductById: jest.fn(),
      findLatestPrice: jest.fn(),
      createPrice: jest.fn(),
      findProducts: jest.fn(),
      findPriceHistory: jest.fn(),
    };

    const mockMapperObj = { toPriceResponseDto: jest.fn() };
    const mockPolicyObj = { assertCanUpdatePrice: jest.fn() };
    const mockEventEmitterObj = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: InvestmentRepository, useValue: mockRepo },
        { provide: InvestmentMapper, useValue: mockMapperObj },
        { provide: InvestmentPolicy, useValue: mockPolicyObj },
        { provide: EventEmitter2, useValue: mockEventEmitterObj },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
    repository = module.get(InvestmentRepository) as jest.Mocked<InvestmentRepository>;
    mapper = module.get(InvestmentMapper) as jest.Mocked<InvestmentMapper>;
    policy = module.get(InvestmentPolicy) as jest.Mocked<InvestmentPolicy>;
    eventEmitter = module.get(EventEmitter2) as jest.Mocked<EventEmitter2>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updatePrice', () => {
    const updateDto = {
      productSymbol: 'BTC',
      price: 51000,
      marketCap: 1100000000,
      volume24h: 60000000,
    };

    it('should update price successfully', async () => {
      repository.findProductBySymbol.mockResolvedValue(mockProduct as never);
      repository.findLatestPrice.mockResolvedValue(mockPrice as never);
      repository.createPrice.mockResolvedValue({ ...mockPrice, price: 51000 } as never);
      mapper.toPriceResponseDto.mockReturnValue({ id: 'price-1', price: 51000 } as never);

      const result = await service.updatePrice(updateDto as never, 'admin-1');

      expect(result).toBeDefined();
      expect(policy.assertCanUpdatePrice).toHaveBeenCalledWith(AssetStatus.ACTIVE);
      expect(repository.createPrice).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        InvestmentEventType.ASSET_PRICE_UPDATED,
        expect.objectContaining({ newPrice: 51000 }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
    });

    it('should throw if product not found', async () => {
      repository.findProductBySymbol.mockResolvedValue(null);

      await expect(service.updatePrice(updateDto as never, 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should calculate change when no previous price exists', async () => {
      repository.findProductBySymbol.mockResolvedValue(mockProduct as never);
      repository.findLatestPrice.mockResolvedValue(null);
      repository.createPrice.mockResolvedValue(mockPrice as never);
      mapper.toPriceResponseDto.mockReturnValue({ id: 'price-1' } as never);

      const result = await service.updatePrice(updateDto as never, 'admin-1');

      expect(result).toBeDefined();
    });
  });

  describe('getCurrentPrice', () => {
    it('should return current price', async () => {
      repository.findProductById.mockResolvedValue(mockProduct as never);
      repository.findLatestPrice.mockResolvedValue(mockPrice as never);
      mapper.toPriceResponseDto.mockReturnValue({ id: 'price-1', price: 50000 } as never);

      const result = await service.getCurrentPrice('prod-1');

      expect(result).toBeDefined();
      expect(repository.findProductById).toHaveBeenCalledWith('prod-1');
    });

    it('should throw if product not found', async () => {
      repository.findProductById.mockResolvedValue(null);

      await expect(service.getCurrentPrice('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw if no price available', async () => {
      repository.findProductById.mockResolvedValue(mockProduct as never);
      repository.findLatestPrice.mockResolvedValue(null);

      await expect(service.getCurrentPrice('prod-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLatestPrice', () => {
    it('should delegate to getCurrentPrice', async () => {
      const spy = jest.spyOn(service, 'getCurrentPrice').mockResolvedValue({ id: 'price-1' } as never);

      await service.getLatestPrice('prod-1');

      expect(spy).toHaveBeenCalledWith('prod-1');
    });
  });

  describe('getPriceBySymbol', () => {
    it('should return price by symbol', async () => {
      repository.findProductBySymbol.mockResolvedValue(mockProduct as never);
      repository.findLatestPrice.mockResolvedValue(mockPrice as never);
      mapper.toPriceResponseDto.mockReturnValue({ id: 'price-1' } as never);

      const result = await service.getPriceBySymbol('BTC');

      expect(result).toBeDefined();
    });

    it('should throw if product not found', async () => {
      repository.findProductBySymbol.mockResolvedValue(null);

      await expect(service.getPriceBySymbol('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllPrices', () => {
    it('should return all prices for active products', async () => {
      repository.findProducts.mockResolvedValue([mockProduct] as never);
      repository.findLatestPrice.mockResolvedValue(mockPrice as never);
      mapper.toPriceResponseDto.mockReturnValue({ id: 'price-1' } as never);

      const result = await service.getAllPrices();

      expect(result).toHaveLength(1);
      expect(repository.findProducts).toHaveBeenCalledWith({ status: AssetStatus.ACTIVE });
    });

    it('should skip products without prices', async () => {
      repository.findProducts.mockResolvedValue([mockProduct] as never);
      repository.findLatestPrice.mockResolvedValue(null);

      const result = await service.getAllPrices();

      expect(result).toHaveLength(0);
    });
  });

  describe('getPriceHistory', () => {
    it('should return price history', async () => {
      repository.findProductById.mockResolvedValue(mockProduct as never);
      repository.findPriceHistory.mockResolvedValue([mockPrice] as never);
      mapper.toPriceResponseDto.mockReturnValue({ id: 'price-1' } as never);

      const result = await service.getPriceHistory('prod-1');

      expect(result).toHaveLength(1);
    });

    it('should throw if product not found', async () => {
      repository.findProductById.mockResolvedValue(null);

      await expect(service.getPriceHistory('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
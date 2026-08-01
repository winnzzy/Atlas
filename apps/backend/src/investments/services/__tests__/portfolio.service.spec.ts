import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { PortfolioService } from '../portfolio.service';
import { InvestmentRepository } from '../../repositories/investment.repository';
import { InvestmentMapper } from '../../mappers/investment.mapper';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let repository: jest.Mocked<InvestmentRepository>;
  let mapper: jest.Mocked<InvestmentMapper>;

  const mockPortfolio = {
    id: 'portfolio-1',
    userId: 'user-123',
    totalValue: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPosition = {
    id: 'pos-1',
    portfolioId: 'portfolio-1',
    productId: 'prod-1',
    quantity: 1.5,
    averageCost: 40000,
    totalCost: 60000,
    currentValue: 75000,
    profitLoss: 15000,
    profitLossPct: 25,
    product: {
      id: 'prod-1',
      symbol: 'BTC',
      name: 'Bitcoin',
      priceHistory: [{ price: 50000 }],
    },
  };

  const mockPrice = {
    id: 'price-1',
    productId: 'prod-1',
    price: 50000,
    currency: 'USD',
  };

  beforeEach(async () => {
    const mockRepository = {
      findOrCreatePortfolio: jest.fn(),
      findHoldingsByUser: jest.fn(),
      findLatestPrice: jest.fn(),
      findHolding: jest.fn(),
      findPortfolioTransactions: jest.fn(),
    };

    const mockMapper = {
      toHoldingDto: jest.fn(),
      toPortfolioResponseDto: jest.fn(),
      toPortfolioTransactionResponseDto: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: InvestmentRepository, useValue: mockRepository },
        { provide: InvestmentMapper, useValue: mockMapper },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
    repository = module.get(InvestmentRepository);
    mapper = module.get(InvestmentMapper);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPortfolio', () => {
    it('should return portfolio with holdings for a user', async () => {
      repository.findOrCreatePortfolio.mockResolvedValue(mockPortfolio as never);
      repository.findHoldingsByUser.mockResolvedValue([mockPosition] as never);
      repository.findLatestPrice.mockResolvedValue(mockPrice as never);
      mapper.toHoldingDto.mockReturnValue({
        productId: 'prod-1',
        symbol: 'BTC',
        name: 'Bitcoin',
        quantity: 1.5,
        currentPrice: 50000,
        currentValue: 75000,
        totalCost: 60000,
        profitLoss: 15000,
        profitLossPct: 25,
        allocationPct: 100,
      } as never);
      mapper.toPortfolioResponseDto.mockReturnValue({
        id: 'portfolio-1',
        userId: 'user-123',
        holdings: [{ productId: 'prod-1' }],
      } as never);

      const result = await service.getPortfolio('user-123');

      expect(result).toBeDefined();
      expect(repository.findOrCreatePortfolio).toHaveBeenCalledWith('user-123');
      expect(repository.findHoldingsByUser).toHaveBeenCalledWith('user-123');
      expect(repository.findLatestPrice).toHaveBeenCalledWith('prod-1');
    });

    it('should return empty portfolio when no holdings exist', async () => {
      repository.findOrCreatePortfolio.mockResolvedValue(mockPortfolio as never);
      repository.findHoldingsByUser.mockResolvedValue([]);
      mapper.toPortfolioResponseDto.mockReturnValue({
        id: 'portfolio-1',
        userId: 'user-123',
        holdings: [],
        totalValue: 0,
        totalRealizedPnl: 0,
      } as never);

      const result = await service.getPortfolio('user-empty');

      expect(result).toBeDefined();
      expect(result.holdings).toEqual([]);
    });

    it('should skip holdings with zero quantity', async () => {
      const zeroPosition = { ...mockPosition, quantity: 0 };
      repository.findOrCreatePortfolio.mockResolvedValue(mockPortfolio as never);
      repository.findHoldingsByUser.mockResolvedValue([zeroPosition] as never);
      mapper.toPortfolioResponseDto.mockReturnValue({
        id: 'portfolio-1',
        userId: 'user-123',
        holdings: [],
        totalValue: 0,
      } as never);

      await service.getPortfolio('user-123');

      expect(mapper.toHoldingDto).not.toHaveBeenCalled();
    });

    it('should handle positions without current price', async () => {
      repository.findOrCreatePortfolio.mockResolvedValue(mockPortfolio as never);
      repository.findHoldingsByUser.mockResolvedValue([mockPosition] as never);
      repository.findLatestPrice.mockResolvedValue(null);
      mapper.toHoldingDto.mockReturnValue({
        productId: 'prod-1',
        quantity: 1.5,
        currentPrice: 0,
        currentValue: 0,
      } as never);
      mapper.toPortfolioResponseDto.mockReturnValue({
        id: 'portfolio-1',
        userId: 'user-123',
        holdings: [{ productId: 'prod-1' }],
      } as never);

      const result = await service.getPortfolio('user-123');

      expect(result).toBeDefined();
    });
  });

  describe('getHolding', () => {
    it('should return a specific holding for a user', async () => {
      repository.findOrCreatePortfolio.mockResolvedValue(mockPortfolio as never);
      repository.findHolding.mockResolvedValue(mockPosition as never);
      repository.findLatestPrice.mockResolvedValue(mockPrice as never);
      mapper.toHoldingDto.mockReturnValue({
        productId: 'prod-1',
        symbol: 'BTC',
        quantity: 1.5,
        currentPrice: 50000,
      } as never);

      const result = await service.getHolding('user-123', 'prod-1');

      expect(result).toBeDefined();
      expect(repository.findHolding).toHaveBeenCalledWith('portfolio-1', 'prod-1');
    });

    it('should return null when holding does not exist', async () => {
      repository.findOrCreatePortfolio.mockResolvedValue(mockPortfolio as never);
      repository.findHolding.mockResolvedValue(null);

      const result = await service.getHolding('user-123', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getPortfolioTransactions', () => {
    it('should return portfolio transactions', async () => {
      const mockEntries = [
        { id: 'entry-1', productId: 'prod-1', type: 'DEPOSIT', quantity: 1.5 },
        { id: 'entry-2', productId: 'prod-2', type: 'WITHDRAWAL', quantity: 0.5 },
      ];
      repository.findPortfolioTransactions.mockResolvedValue(mockEntries as never);
      mapper.toPortfolioTransactionResponseDto.mockReturnValue({} as never);

      const result = await service.getPortfolioTransactions('user-123');

      expect(result).toBeDefined();
      expect(repository.findPortfolioTransactions).toHaveBeenCalledWith('user-123');
    });

    it('should filter transactions by productId', async () => {
      const mockEntries = [
        { id: 'entry-1', productId: 'prod-1', type: 'DEPOSIT' },
        { id: 'entry-2', productId: 'prod-2', type: 'DEPOSIT' },
      ];
      repository.findPortfolioTransactions.mockResolvedValue(mockEntries as never);
      mapper.toPortfolioTransactionResponseDto.mockReturnValue({} as never);

      const result = await service.getPortfolioTransactions('user-123', { productId: 'prod-1' });

      expect(result).toHaveLength(1);
    });

    it('should filter transactions by type', async () => {
      const mockEntries = [
        { id: 'entry-1', productId: 'prod-1', type: 'DEPOSIT' },
        { id: 'entry-2', productId: 'prod-1', type: 'WITHDRAWAL' },
      ];
      repository.findPortfolioTransactions.mockResolvedValue(mockEntries as never);
      mapper.toPortfolioTransactionResponseDto.mockReturnValue({} as never);

      const result = await service.getPortfolioTransactions('user-123', { type: 'DEPOSIT' });

      expect(result).toHaveLength(1);
    });
  });
});
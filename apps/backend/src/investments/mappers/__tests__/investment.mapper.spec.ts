import { Decimal } from '@prisma/client/runtime/library';
import { InvestmentMapper } from '../investment.mapper';

describe('InvestmentMapper', () => {
  let mapper: InvestmentMapper;

  beforeEach(() => {
    mapper = new InvestmentMapper();
  });

  describe('toAssetResponseDto', () => {
    it('should map product to asset response DTO', () => {
      const product = {
        id: 'prod-1',
        symbol: 'BTC',
        name: 'Bitcoin',
        assetClass: 'CRYPTO',
        status: 'ACTIVE',
        description: 'Bitcoin cryptocurrency',
        iconUrl: 'https://example.com/btc.png',
        decimals: 8,
        minDeposit: new Decimal(0.001),
        minWithdrawal: new Decimal(0.0005),
        withdrawalFee: new Decimal(0.0001),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = mapper.toAssetResponseDto(product as never);

      expect(result.id).toBe('prod-1');
      expect(result.symbol).toBe('BTC');
      expect(result.name).toBe('Bitcoin');
      expect(result.assetClass).toBe('CRYPTO');
      expect(result.status).toBe('ACTIVE');
      expect(result.description).toBe('Bitcoin cryptocurrency');
      expect(result.minDeposit).toBe(0.001);
      expect(result.withdrawalFee).toBe(0.0001);
    });

    it('should handle null fields', () => {
      const product = {
        id: 'prod-1',
        symbol: 'BTC',
        name: 'Bitcoin',
        assetClass: 'CRYPTO',
        status: 'ACTIVE',
        description: null,
        iconUrl: null,
        decimals: 8,
        minDeposit: null,
        minWithdrawal: null,
        withdrawalFee: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = mapper.toAssetResponseDto(product as never);

      expect(result.description).toBeUndefined();
      expect(result.iconUrl).toBeUndefined();
      expect(result.minDeposit).toBeUndefined();
    });
  });

  describe('toWalletResponseDto', () => {
    it('should map wallet to wallet response DTO', () => {
      const wallet = {
        id: 'wallet-1',
        productId: 'prod-1',
        network: 'ERC20',
        address: '0xABC123',
        memo: null,
        label: 'My Wallet',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        product: { symbol: 'BTC', name: 'Bitcoin' },
      };

      const result = mapper.toWalletResponseDto(wallet as never);

      expect(result.id).toBe('wallet-1');
      expect(result.productId).toBe('prod-1');
      expect(result.network).toBe('ERC20');
      expect(result.address).toBe('0xABC123');
      expect(result.status).toBe('ACTIVE');
      expect(result.productSymbol).toBe('BTC');
      expect(result.productName).toBe('Bitcoin');
    });
  });

  describe('toDepositResponseDto', () => {
    it('should map deposit to deposit response DTO', () => {
      const deposit = {
        id: 'dep-1',
        userId: 'user-1',
        productId: 'prod-1',
        walletId: 'wallet-1',
        amount: new Decimal(1.5),
        txHash: '0xTX123',
        network: 'ERC20',
        status: 'PENDING',
        reference: 'DEP-ABC12345',
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = mapper.toDepositResponseDto(deposit as never);

      expect(result.id).toBe('dep-1');
      expect(result.userId).toBe('user-1');
      expect(result.amount).toBe(1.5);
      expect(result.status).toBe('PENDING');
      expect(result.reference).toBe('DEP-ABC12345');
    });
  });

  describe('toWithdrawalResponseDto', () => {
    it('should map withdrawal to withdrawal response DTO', () => {
      const withdrawal = {
        id: 'wth-1',
        userId: 'user-1',
        productId: 'prod-1',
        amount: new Decimal(1.0),
        toAddress: '0xABC',
        toMemo: null,
        network: 'ERC20',
        fee: new Decimal(0.001),
        netAmount: new Decimal(0.999),
        status: 'PENDING',
        reference: 'WTH-ABC12345',
        txHash: null,
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = mapper.toWithdrawalResponseDto(withdrawal as never);

      expect(result.id).toBe('wth-1');
      expect(result.amount).toBe(1.0);
      expect(result.fee).toBe(0.001);
      expect(result.netAmount).toBe(0.999);
      expect(result.status).toBe('PENDING');
    });
  });

  describe('toPriceResponseDto', () => {
    it('should map price to price response DTO', () => {
      const price = {
        id: 'price-1',
        productId: 'prod-1',
        price: new Decimal(50000),
        currency: 'USD',
        change24h: new Decimal(1000),
        change24hPct: new Decimal(2.05),
        marketCap: new Decimal(1000000000),
        volume24h: new Decimal(50000000),
        createdAt: new Date(),
        updatedBy: 'admin-1',
        product: { symbol: 'BTC' },
      };

      const result = mapper.toPriceResponseDto(price as never);

      expect(result.id).toBe('price-1');
      expect(result.symbol).toBe('BTC');
      expect(result.price).toBe(50000);
      expect(result.change24h).toBe(1000);
      expect(result.change24hPct).toBe(2.05);
      expect(result.marketCap).toBe(1000000000);
    });
  });

  describe('toHoldingDto', () => {
    it('should map position to holding DTO with calculated fields', () => {
      const position = {
        id: 'pos-1',
        portfolioId: 'portfolio-1',
        productId: 'prod-1',
        quantity: new Decimal(2.0),
        averageCost: new Decimal(40000),
        totalCost: new Decimal(80000),
        currentValue: new Decimal(100000),
        profitLoss: new Decimal(5000),
        profitLossPct: new Decimal(6.25),
        createdAt: new Date(),
        updatedAt: new Date(),
        product: {
          id: 'prod-1',
          symbol: 'BTC',
          name: 'Bitcoin',
          assetClass: 'CRYPTO',
          status: 'ACTIVE',
          description: null,
          iconUrl: null,
          decimals: 8,
          minDeposit: null,
          minWithdrawal: null,
          withdrawalFee: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const result = mapper.toHoldingDto(position as never, 50000, 200000);

      expect(result.productId).toBe('prod-1');
      expect(result.symbol).toBe('BTC');
      expect(result.quantity).toBe(2.0);
      expect(result.currentPrice).toBe(50000);
      expect(result.currentValue).toBe(100000);
      expect(result.totalCost).toBe(80000);
      expect(result.unrealizedPnl).toBe(20000);
      expect(result.realizedPnl).toBe(5000);
    });
  });

  describe('toPortfolioResponseDto', () => {
    it('should aggregate holdings into portfolio response', () => {
      const holdings = [
        {
          productId: 'prod-1',
          symbol: 'BTC',
          name: 'Bitcoin',
          assetClass: 'CRYPTO',
          quantity: 1.0,
          averageCost: 40000,
          currentPrice: 50000,
          currentValue: 50000,
          totalCost: 40000,
          unrealizedPnl: 10000,
          unrealizedPnlPct: 25,
          realizedPnl: 0,
          allocationPct: 100,
        },
      ];

      const result = mapper.toPortfolioResponseDto(
        'portfolio-1',
        'user-1',
        holdings as never,
        0,
        new Date(),
        new Date(),
      );

      expect(result.id).toBe('portfolio-1');
      expect(result.userId).toBe('user-1');
      expect(result.totalValueUsd).toBe(50000);
      expect(result.totalCostBasisUsd).toBe(40000);
      expect(result.totalProfitLossUsd).toBe(10000);
      expect(result.totalProfitLossPct).toBe(25);
      expect(result.holdings).toHaveLength(1);
    });

    it('should handle empty holdings', () => {
      const result = mapper.toPortfolioResponseDto('portfolio-1', 'user-1', [], 0);

      expect(result.totalValueUsd).toBe(0);
      expect(result.totalCostBasisUsd).toBe(0);
      expect(result.holdings).toHaveLength(0);
    });
  });

  describe('toPortfolioTransactionResponseDto', () => {
    it('should map portfolio entry to transaction response DTO', () => {
      const entry = {
        id: 'entry-1',
        portfolioId: 'portfolio-1',
        productId: 'prod-1',
        type: 'DEPOSIT',
        quantity: new Decimal(1.5),
        pricePerUnit: new Decimal(50000),
        totalAmount: new Decimal(75000),
        status: 'COMPLETED',
        description: 'BTC deposit',
        createdAt: new Date(),
        updatedAt: new Date(),
        product: { symbol: 'BTC', name: 'Bitcoin' },
      };

      const result = mapper.toPortfolioTransactionResponseDto(entry as never);

      expect(result.id).toBe('entry-1');
      expect(result.type).toBe('DEPOSIT');
      expect(result.quantity).toBe(1.5);
      expect(result.pricePerUnitUsd).toBe(50000);
      expect(result.totalAmountUsd).toBe(75000);
      expect(result.notes).toBe('BTC deposit');
    });
  });
});
import { InvestmentRepository } from '../investment.repository';
import { AssetStatus, DepositStatus, WithdrawalStatus } from '../../enums/investment-status.enum';

describe('InvestmentRepository', () => {
  const prisma = {
    investmentProduct: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    investmentCustodyWallet: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    investmentCustodyDeposit: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    investmentCustodyWithdrawal: {
      create: jest.fn(),
    },
    investmentPortfolio: {
      upsert: jest.fn(),
    },
    investmentEntry: {
      create: jest.fn(),
    },
  };

  let repository: InvestmentRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new InvestmentRepository(prisma as never);
  });

  it('creates a product with ACTIVE status and default decimals', async () => {
    prisma.investmentProduct.create.mockResolvedValue({ id: 'prod-1' });

    await repository.createProduct({
      symbol: 'BTC',
      name: 'Bitcoin',
      assetClass: 'CRYPTO' as never,
    });

    expect(prisma.investmentProduct.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          symbol: 'BTC',
          status: AssetStatus.ACTIVE,
          decimals: 8,
        }),
      }),
    );
  });

  it('finds wallets by product id ordered ascending', async () => {
    prisma.investmentCustodyWallet.findMany.mockResolvedValue([]);

    await repository.findWalletsByProduct('prod-1');

    expect(prisma.investmentCustodyWallet.findMany).toHaveBeenCalledWith({
      where: { productId: 'prod-1' },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('creates deposit as PENDING with optional tx hash', async () => {
    prisma.investmentCustodyDeposit.create.mockResolvedValue({ id: 'dep-1' });

    await repository.createDeposit({
      userId: 'user-1',
      productId: 'prod-1',
      walletId: 'wallet-1',
      amount: 1.25,
      network: 'ERC20',
      reference: 'DEP-123',
      txHash: '0xabc',
    });

    expect(prisma.investmentCustodyDeposit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          productId: 'prod-1',
          walletId: 'wallet-1',
          network: 'ERC20',
          reference: 'DEP-123',
          txHash: '0xabc',
          status: DepositStatus.PENDING,
        }),
      }),
    );
  });

  it('searches deposits with status, product symbol, and date range filters', async () => {
    prisma.investmentCustodyDeposit.findMany.mockResolvedValue([]);
    prisma.investmentCustodyDeposit.count.mockResolvedValue(0);

    await repository.searchDeposits({
      userId: 'user-1',
      status: DepositStatus.PENDING,
      productSymbol: 'BTC',
      fromDate: '2026-01-01T00:00:00.000Z',
      toDate: '2026-01-31T23:59:59.000Z',
      page: 2,
      limit: 10,
    });

    expect(prisma.investmentCustodyDeposit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          status: DepositStatus.PENDING,
          product: { symbol: 'BTC' },
        }),
        skip: 10,
        take: 10,
      }),
    );
  });

  it('creates withdrawal as PENDING', async () => {
    prisma.investmentCustodyWithdrawal.create.mockResolvedValue({ id: 'wth-1' });

    await repository.createWithdrawal({
      userId: 'user-1',
      productId: 'prod-1',
      amount: 0.5,
      network: 'CRYPTO',
      toAddress: '0xdef',
      fee: 0.01,
      netAmount: 0.49,
      reference: 'WTH-123',
    });

    expect(prisma.investmentCustodyWithdrawal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          productId: 'prod-1',
          network: 'CRYPTO',
          toAddress: '0xdef',
          reference: 'WTH-123',
          status: WithdrawalStatus.PENDING,
        }),
      }),
    );
  });

  it('creates portfolio transaction entry with PENDING status', async () => {
    prisma.investmentEntry.create.mockResolvedValue({ id: 'entry-1' });

    await repository.createEntry({
      portfolioId: 'portfolio-1',
      productId: 'prod-1',
      type: 'DEPOSIT',
      quantity: 1,
      pricePerUnit: 50000,
      totalAmount: 50000,
      reference: 'DEP-123',
      createdBy: 'admin-1',
    });

    expect(prisma.investmentEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          portfolioId: 'portfolio-1',
          productId: 'prod-1',
          type: 'DEPOSIT',
          status: 'PENDING',
          reference: 'DEP-123',
          createdBy: 'admin-1',
          currency: 'USD',
        }),
      }),
    );
  });
});

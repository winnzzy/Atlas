import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { InvestmentController } from '../investment.controller';
import { AssetService } from '../../services/asset.service';
import { PricingService } from '../../services/pricing.service';
import { WalletService } from '../../services/wallet.service';
import { DepositService } from '../../services/deposit.service';
import { WithdrawalService } from '../../services/withdrawal.service';
import { ApprovalService } from '../../services/approval.service';
import { PortfolioService } from '../../services/portfolio.service';
import { AssetStatus, DepositStatus, WithdrawalStatus, WalletStatus } from '../../enums/investment-status.enum';
import { ROLES_KEY } from '../../../auth/decorators/roles.decorator';

describe('InvestmentController', () => {
  let controller: InvestmentController;
  let assetService: jest.Mocked<AssetService>;
  let pricingService: jest.Mocked<PricingService>;
  let walletService: jest.Mocked<WalletService>;
  let depositService: jest.Mocked<DepositService>;
  let withdrawalService: jest.Mocked<WithdrawalService>;
  let approvalService: jest.Mocked<ApprovalService>;
  let portfolioService: jest.Mocked<PortfolioService>;

  const mockAsset: Record<string, unknown> = {
    id: 'prod-1',
    symbol: 'BTC',
    name: 'Bitcoin',
    assetClass: 'CRYPTO',
    status: AssetStatus.ACTIVE,
    description: 'Bitcoin cryptocurrency',
    iconUrl: 'https://example.com/btc.png',
    decimals: 8,
    minDeposit: 0.001,
    minWithdrawal: 0.0005,
    withdrawalFee: 0.0001,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWallet: Record<string, unknown> = {
    id: 'wallet-1',
    productId: 'prod-1',
    network: 'ERC20',
    address: '0xABC123',
    memo: null,
    label: 'BTC Wallet',
    status: WalletStatus.ACTIVE,
    productSymbol: 'BTC',
    productName: 'Bitcoin',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDeposit: Record<string, unknown> = {
    id: 'dep-1',
    userId: 'user-1',
    productId: 'prod-1',
    walletId: 'wallet-1',
    amount: 1.5,
    txHash: '0xTX123',
    network: 'ERC20',
    status: DepositStatus.PENDING,
    reference: 'DEP-ABC12345',
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWithdrawal: Record<string, unknown> = {
    id: 'wth-1',
    userId: 'user-1',
    productId: 'prod-1',
    amount: 1.0,
    toAddress: '0xABC',
    toMemo: null,
    network: 'ERC20',
    fee: 0.001,
    netAmount: 0.999,
    status: WithdrawalStatus.PENDING,
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

  const mockPrice: Record<string, unknown> = {
    id: 'price-1',
    productId: 'prod-1',
    symbol: 'BTC',
    price: 50000,
    currency: 'USD',
    change24h: 1000,
    change24hPct: 2.05,
    marketCap: 1000000000,
    volume24h: 50000000,
    updatedBy: 'admin-1',
    createdAt: new Date(),
  };

  const mockPortfolio: Record<string, unknown> = {
    id: 'portfolio-1',
    userId: 'user-1',
    totalValueUsd: 50000,
    totalCostBasisUsd: 40000,
    totalProfitLossUsd: 10000,
    totalProfitLossPct: 25,
    totalRealizedPnl: 0,
    holdings: [],
    currency: 'USD',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockAssetService = {
      createAsset: jest.fn().mockResolvedValue(mockAsset),
      listAssets: jest.fn().mockResolvedValue([mockAsset]),
      getAsset: jest.fn().mockResolvedValue(mockAsset),
      enableAsset: jest.fn().mockResolvedValue(mockAsset),
      disableAsset: jest.fn().mockResolvedValue(mockAsset),
      suspendAsset: jest.fn().mockResolvedValue(mockAsset),
      freezeAsset: jest.fn().mockResolvedValue(mockAsset),
    };
    const mockPricingService = {
      updatePrice: jest.fn().mockResolvedValue(mockPrice),
      getLatestPrice: jest.fn().mockResolvedValue(mockPrice),
      getAllPrices: jest.fn().mockResolvedValue([mockPrice]),
    };
    const mockWalletService = {
      createWallet: jest.fn().mockResolvedValue(mockWallet),
      listWallets: jest.fn().mockResolvedValue([mockWallet]),
      getWallet: jest.fn().mockResolvedValue(mockWallet),
      updateWallet: jest.fn().mockResolvedValue(mockWallet),
      activateWallet: jest.fn().mockResolvedValue(mockWallet),
      deactivateWallet: jest.fn().mockResolvedValue(mockWallet),
      getWalletsByProduct: jest.fn().mockResolvedValue([mockWallet]),
    };
    const mockDepositService = {
      requestDeposit: jest.fn().mockResolvedValue(mockDeposit),
      getUserDeposits: jest.fn().mockResolvedValue([mockDeposit]),
      getDeposit: jest.fn().mockResolvedValue(mockDeposit),
      listDeposits: jest.fn().mockResolvedValue([mockDeposit]),
    };
    const mockWithdrawalService = {
      requestWithdrawal: jest.fn().mockResolvedValue(mockWithdrawal),
      getUserWithdrawals: jest.fn().mockResolvedValue([mockWithdrawal]),
      getWithdrawal: jest.fn().mockResolvedValue(mockWithdrawal),
      listWithdrawals: jest.fn().mockResolvedValue([mockWithdrawal]),
    };
    const mockApprovalService = {
      approveDeposit: jest.fn().mockResolvedValue(mockDeposit),
      rejectDeposit: jest.fn().mockResolvedValue(mockDeposit),
      approveWithdrawal: jest.fn().mockResolvedValue(mockWithdrawal),
      rejectWithdrawal: jest.fn().mockResolvedValue(mockWithdrawal),
    };
    const mockPortfolioService = {
      getPortfolio: jest.fn().mockResolvedValue(mockPortfolio),
      getHolding: jest.fn().mockResolvedValue(null),
      getPortfolioTransactions: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvestmentController],
      providers: [
        { provide: AssetService, useValue: mockAssetService },
        { provide: PricingService, useValue: mockPricingService },
        { provide: WalletService, useValue: mockWalletService },
        { provide: DepositService, useValue: mockDepositService },
        { provide: WithdrawalService, useValue: mockWithdrawalService },
        { provide: ApprovalService, useValue: mockApprovalService },
        { provide: PortfolioService, useValue: mockPortfolioService },
      ],
    }).compile();

    controller = module.get(InvestmentController);
    assetService = module.get(AssetService) as jest.Mocked<AssetService>;
    pricingService = module.get(PricingService) as jest.Mocked<PricingService>;
    walletService = module.get(WalletService) as jest.Mocked<WalletService>;
    depositService = module.get(DepositService) as jest.Mocked<DepositService>;
    withdrawalService = module.get(WithdrawalService) as jest.Mocked<WithdrawalService>;
    approvalService = module.get(ApprovalService) as jest.Mocked<ApprovalService>;
    portfolioService = module.get(PortfolioService) as jest.Mocked<PortfolioService>;
  });

  // ─── Portfolio ──────────────────────────────────────────────
  describe('getMyPortfolio', () => {
    it('should return user portfolio', async () => {
      const result = await controller.getMyPortfolio('user-1');
      expect(result).toEqual(mockPortfolio);
      expect(portfolioService.getPortfolio).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getHolding', () => {
    it('should return specific holding', async () => {
      const result = await controller.getHolding('user-1', 'prod-1');
      expect(result).toBeNull();
      expect(portfolioService.getHolding).toHaveBeenCalledWith('user-1', 'prod-1');
    });
  });

  describe('getPortfolioTransactions', () => {
    it('should return portfolio transactions', async () => {
      const result = await controller.getPortfolioTransactions('user-1', undefined, undefined);
      expect(result).toEqual([]);
      expect(portfolioService.getPortfolioTransactions).toHaveBeenCalledWith('user-1', { productId: undefined, type: undefined });
    });
  });

  // ─── Deposits (Customer) ────────────────────────────────────
  describe('requestDeposit', () => {
    it('should create a deposit request', async () => {
      const dto = { productId: 'prod-1', walletId: 'wallet-1', amount: 1.5, network: 'ERC20' };
      const result = await controller.requestDeposit('user-1', dto as never);
      expect(result).toEqual(mockDeposit);
      expect(depositService.requestDeposit).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('getMyDeposits', () => {
    it('should return user deposits', async () => {
      const result = await controller.getMyDeposits('user-1');
      expect(result).toEqual([mockDeposit]);
      expect(depositService.getUserDeposits).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getDeposit', () => {
    it('should return a specific deposit', async () => {
      const result = await controller.getDeposit('dep-1');
      expect(result).toEqual(mockDeposit);
      expect(depositService.getDeposit).toHaveBeenCalledWith('dep-1');
    });
  });

  // ─── Withdrawals (Customer) ─────────────────────────────────
  describe('requestWithdrawal', () => {
    it('should create a withdrawal request', async () => {
      const dto = { productId: 'prod-1', amount: 1.0, toAddress: '0xABC', network: 'ERC20' };
      const result = await controller.requestWithdrawal('user-1', dto as never);
      expect(result).toEqual(mockWithdrawal);
      expect(withdrawalService.requestWithdrawal).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('getMyWithdrawals', () => {
    it('should return user withdrawals', async () => {
      const result = await controller.getMyWithdrawals('user-1');
      expect(result).toEqual([mockWithdrawal]);
      expect(withdrawalService.getUserWithdrawals).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getWithdrawal', () => {
    it('should return a specific withdrawal', async () => {
      const result = await controller.getWithdrawal('wth-1');
      expect(result).toEqual(mockWithdrawal);
      expect(withdrawalService.getWithdrawal).toHaveBeenCalledWith('wth-1');
    });
  });

  // ─── Assets (Admin) ─────────────────────────────────────────
  describe('createAsset', () => {
    it('should create an asset', async () => {
      const dto = { symbol: 'BTC', name: 'Bitcoin', assetClass: 'CRYPTO' };
      const result = await controller.createAsset('admin-1', dto as never);
      expect(result).toEqual(mockAsset);
      expect(assetService.createAsset).toHaveBeenCalledWith(dto, 'admin-1');
    });
  });

  describe('listAssets', () => {
    it('should list assets with filters', async () => {
      const result = await controller.listAssets('CRYPTO', 'ACTIVE');
      expect(result).toEqual([mockAsset]);
      expect(assetService.listAssets).toHaveBeenCalledWith({ assetClass: 'CRYPTO', status: 'ACTIVE' });
    });
  });

  describe('getAsset', () => {
    it('should get asset by id', async () => {
      const result = await controller.getAsset('prod-1');
      expect(result).toEqual(mockAsset);
      expect(assetService.getAsset).toHaveBeenCalledWith('prod-1');
    });
  });

  describe('enableAsset', () => {
    it('should enable an asset', async () => {
      const result = await controller.enableAsset('prod-1');
      expect(result).toEqual(mockAsset);
      expect(assetService.enableAsset).toHaveBeenCalledWith('prod-1', 'admin');
    });
  });

  describe('disableAsset', () => {
    it('should disable an asset', async () => {
      const result = await controller.disableAsset('prod-1');
      expect(result).toEqual(mockAsset);
      expect(assetService.disableAsset).toHaveBeenCalledWith('prod-1', 'admin');
    });
  });

  describe('suspendAsset', () => {
    it('should suspend an asset', async () => {
      const result = await controller.suspendAsset('prod-1');
      expect(result).toEqual(mockAsset);
      expect(assetService.suspendAsset).toHaveBeenCalledWith('prod-1', 'admin');
    });
  });

  describe('freezeAsset', () => {
    it('should freeze an asset', async () => {
      const result = await controller.freezeAsset('prod-1');
      expect(result).toEqual(mockAsset);
      expect(assetService.freezeAsset).toHaveBeenCalledWith('prod-1', 'admin');
    });
  });

  // ─── Wallets (Admin) ────────────────────────────────────────
  describe('createWallet', () => {
    it('should create a wallet', async () => {
      const dto = { productId: 'prod-1', network: 'ERC20', address: '0xABC123' };
      const result = await controller.createWallet(dto as never);
      expect(result).toEqual(mockWallet);
      expect(walletService.createWallet).toHaveBeenCalledWith(dto, 'admin');
    });
  });

  describe('listWallets', () => {
    it('should list wallets with filters', async () => {
      const result = await controller.listWallets('prod-1', 'ACTIVE', 'ERC20');
      expect(result).toEqual([mockWallet]);
      expect(walletService.listWallets).toHaveBeenCalledWith({ productId: 'prod-1', status: 'ACTIVE', network: 'ERC20' });
    });
  });

  describe('getWallet', () => {
    it('should get wallet by id', async () => {
      const result = await controller.getWallet('wallet-1');
      expect(result).toEqual(mockWallet);
      expect(walletService.getWallet).toHaveBeenCalledWith('wallet-1');
    });
  });

  describe('updateWallet', () => {
    it('should update a wallet', async () => {
      const dto = { label: 'Updated Wallet' };
      const result = await controller.updateWallet('wallet-1', dto as never);
      expect(result).toEqual(mockWallet);
      expect(walletService.updateWallet).toHaveBeenCalledWith('wallet-1', dto, 'admin');
    });
  });

  describe('activateWallet', () => {
    it('should activate a wallet', async () => {
      const result = await controller.activateWallet('wallet-1');
      expect(result).toEqual(mockWallet);
      expect(walletService.activateWallet).toHaveBeenCalledWith('wallet-1', 'admin');
    });
  });

  describe('deactivateWallet', () => {
    it('should deactivate a wallet', async () => {
      const result = await controller.deactivateWallet('wallet-1');
      expect(result).toEqual(mockWallet);
      expect(walletService.deactivateWallet).toHaveBeenCalledWith('wallet-1', 'admin');
    });
  });

  // ─── Pricing (Admin) ────────────────────────────────────────
  describe('updatePrice', () => {
    it('should update asset price', async () => {
      const dto = { productId: 'prod-1', price: 50000, currency: 'USD' };
      const result = await controller.updatePrice(dto as never);
      expect(result).toEqual(mockPrice);
      expect(pricingService.updatePrice).toHaveBeenCalledWith(dto, 'admin');
    });
  });

  describe('getLatestPrice', () => {
    it('should get latest price for a product', async () => {
      const result = await controller.getLatestPrice('prod-1');
      expect(result).toEqual(mockPrice);
      expect(pricingService.getLatestPrice).toHaveBeenCalledWith('prod-1');
    });
  });

  describe('getAllPrices', () => {
    it('should get all current prices', async () => {
      const result = await controller.getAllPrices();
      expect(result).toEqual([mockPrice]);
      expect(pricingService.getAllPrices).toHaveBeenCalled();
    });
  });

  // ─── Approvals (Admin) ──────────────────────────────────────
  describe('approveDeposit', () => {
    it('should approve a deposit', async () => {
      const result = await controller.approveDeposit('dep-1', 'Looks good');
      expect(result).toEqual(mockDeposit);
      expect(approvalService.approveDeposit).toHaveBeenCalledWith('dep-1', 'admin', 'Looks good');
    });
  });

  describe('rejectDeposit', () => {
    it('should reject a deposit', async () => {
      const result = await controller.rejectDeposit('dep-1', 'Invalid tx hash');
      expect(result).toEqual(mockDeposit);
      expect(approvalService.rejectDeposit).toHaveBeenCalledWith('dep-1', 'admin', 'Invalid tx hash');
    });
  });

  describe('approveWithdrawal', () => {
    it('should approve a withdrawal', async () => {
      const result = await controller.approveWithdrawal('wth-1', 'Verified');
      expect(result).toEqual(mockWithdrawal);
      expect(approvalService.approveWithdrawal).toHaveBeenCalledWith('wth-1', 'admin', 'Verified');
    });
  });

  describe('rejectWithdrawal', () => {
    it('should reject a withdrawal', async () => {
      const result = await controller.rejectWithdrawal('wth-1', 'Suspicious address');
      expect(result).toEqual(mockWithdrawal);
      expect(approvalService.rejectWithdrawal).toHaveBeenCalledWith('wth-1', 'admin', 'Suspicious address');
    });
  });

  describe('listAllDeposits', () => {
    it('should list all deposits with filters', async () => {
      const result = await controller.listAllDeposits('user-1', 'prod-1', 'PENDING');
      expect(result).toEqual([mockDeposit]);
      expect(depositService.listDeposits).toHaveBeenCalledWith({ userId: 'user-1', productId: 'prod-1', status: 'PENDING' });
    });
  });

  describe('listAllWithdrawals', () => {
    it('should list all withdrawals with filters', async () => {
      const result = await controller.listAllWithdrawals('user-1', 'prod-1', 'PENDING');
      expect(result).toEqual([mockWithdrawal]);
      expect(withdrawalService.listWithdrawals).toHaveBeenCalledWith({ userId: 'user-1', productId: 'prod-1', status: 'PENDING' });
    });
  });

  // ─── Customer Asset Discovery ───────────────────────────────
  describe('getAvailableAssets', () => {
    it('should list active assets for customers', async () => {
      const result = await controller.getAvailableAssets();
      expect(result).toEqual([mockAsset]);
      expect(assetService.listAssets).toHaveBeenCalledWith({ status: 'ACTIVE' });
    });
  });

  describe('getAssetDetails', () => {
    it('should get asset details for customers', async () => {
      const result = await controller.getAssetDetails('prod-1');
      expect(result).toEqual(mockAsset);
      expect(assetService.getAsset).toHaveBeenCalledWith('prod-1');
    });
  });

  describe('getAssetWallets', () => {
    it('should get active deposit wallets for an asset', async () => {
      const result = await controller.getAssetWallets('prod-1');
      expect(result).toEqual([mockWallet]);
      expect(walletService.getWalletsByProduct).toHaveBeenCalledWith('prod-1');
    });
  });

  describe('authorization metadata', () => {
    it('applies admin roles to admin endpoints', () => {
      expect(Reflect.getMetadata(ROLES_KEY, controller.createAsset)).toEqual(['ADMIN', 'SUPER_ADMIN']);
      expect(Reflect.getMetadata(ROLES_KEY, controller.approveDeposit)).toEqual(['ADMIN', 'SUPER_ADMIN']);
      expect(Reflect.getMetadata(ROLES_KEY, controller.updatePrice)).toEqual(['ADMIN', 'SUPER_ADMIN']);
    });

    it('does not apply admin roles to customer endpoints', () => {
      expect(Reflect.getMetadata(ROLES_KEY, controller.getMyPortfolio)).toBeUndefined();
      expect(Reflect.getMetadata(ROLES_KEY, controller.requestDeposit)).toBeUndefined();
    });
  });
});
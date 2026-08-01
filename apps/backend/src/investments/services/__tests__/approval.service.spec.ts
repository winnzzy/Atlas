import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApprovalService } from '../approval.service';
import { InvestmentRepository } from '../../repositories/investment.repository';
import { InvestmentMapper } from '../../mappers/investment.mapper';
import { InvestmentPolicy } from '../../policies/investment.policy';
import { InvestmentEventType } from '../../events/investment.events';
import {
  DepositNotFoundException,
  WithdrawalNotFoundException,
  AssetNotFoundException,
} from '../../exceptions/investment-domain.exception';
import { DepositStatus, WithdrawalStatus } from '../../enums/investment-status.enum';
import { TransactionService } from '../../../transactions/services/transaction.service';

describe('ApprovalService', () => {
  let service: ApprovalService;
  let repository: jest.Mocked<InvestmentRepository>;
  let mapper: jest.Mocked<InvestmentMapper>;
  let _policy: jest.Mocked<InvestmentPolicy>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let transactionService: jest.Mocked<TransactionService>;

  const mockProduct = {
    id: 'prod-1',
    symbol: 'BTC',
    name: 'Bitcoin',
    priceHistory: [{ price: 50000 }],
  };

  const mockPendingDeposit = {
    id: 'dep-1',
    userId: 'user-1',
    productId: 'prod-1',
    amount: 1.5,
    status: DepositStatus.PENDING,
    reference: 'DEP-ABC12345',
  };

  const mockPendingWithdrawal = {
    id: 'wth-1',
    userId: 'user-1',
    productId: 'prod-1',
    amount: 1.0,
    fee: 0.0005,
    toAddress: '0xABC',
    status: WithdrawalStatus.PENDING,
    reference: 'WTH-ABC12345',
  };

  const mockPortfolio = { id: 'portfolio-1', userId: 'user-1' };

  beforeEach(async () => {
    const mockRepo = {
      findDepositById: jest.fn(),
      findWithdrawalById: jest.fn(),
      findProductById: jest.fn(),
      updateDeposit: jest.fn(),
      updateWithdrawal: jest.fn(),
      findOrCreatePortfolio: jest.fn(),
      findPosition: jest.fn(),
      upsertPosition: jest.fn(),
      createEntry: jest.fn(),
      findPositionsByPortfolio: jest.fn(),
      updatePortfolioValue: jest.fn(),
    };

    const mockMapperObj = {
      toDepositResponseDto: jest.fn(),
      toWithdrawalResponseDto: jest.fn(),
    };
    const mockPolicyObj = {};
    const mockEventEmitterObj = { emit: jest.fn() };
    const mockTransactionServiceObj = {
      createTransaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalService,
        { provide: InvestmentRepository, useValue: mockRepo },
        { provide: InvestmentMapper, useValue: mockMapperObj },
        { provide: InvestmentPolicy, useValue: mockPolicyObj },
        { provide: EventEmitter2, useValue: mockEventEmitterObj },
        { provide: TransactionService, useValue: mockTransactionServiceObj },
      ],
    }).compile();

    service = module.get<ApprovalService>(ApprovalService);
    repository = module.get(InvestmentRepository) as jest.Mocked<InvestmentRepository>;
    mapper = module.get(InvestmentMapper) as jest.Mocked<InvestmentMapper>;
    _policy = module.get(InvestmentPolicy) as jest.Mocked<InvestmentPolicy>;
    eventEmitter = module.get(EventEmitter2) as jest.Mocked<EventEmitter2>;
    transactionService = module.get(TransactionService) as jest.Mocked<TransactionService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('approveDeposit', () => {
    it('should approve a deposit successfully', async () => {
      repository.findDepositById.mockResolvedValue(mockPendingDeposit as never);
      repository.findProductById.mockResolvedValue(mockProduct as never);
      transactionService.createTransaction.mockResolvedValue({ id: 'tx-1' } as never);
      repository.updateDeposit.mockResolvedValue({ ...mockPendingDeposit, status: DepositStatus.APPROVED } as never);
      repository.findOrCreatePortfolio.mockResolvedValue(mockPortfolio as never);
      repository.findPosition.mockResolvedValue(null);
      repository.upsertPosition.mockResolvedValue({} as never);
      repository.createEntry.mockResolvedValue({} as never);
      repository.findPositionsByPortfolio.mockResolvedValue([{ currentValue: 75000 }] as never);
      repository.updatePortfolioValue.mockResolvedValue({} as never);
      mapper.toDepositResponseDto.mockReturnValue({ id: 'dep-1', status: 'APPROVED' } as never);

      await service.approveDeposit('dep-1', 'admin-1');

      expect(transactionService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CRYPTO_DEPOSIT',
          accountId: 'user-1',
          reference: 'DEP-ABC12345',
          metadata: expect.objectContaining({
            depositId: 'dep-1',
            productId: 'prod-1',
          }),
        }),
      );
      expect(repository.updateDeposit).toHaveBeenCalledWith('dep-1', expect.objectContaining({ status: DepositStatus.APPROVED }));
      expect(eventEmitter.emit).toHaveBeenCalledWith(InvestmentEventType.DEPOSIT_APPROVED, expect.anything());
      expect(eventEmitter.emit).toHaveBeenCalledWith(InvestmentEventType.PORTFOLIO_UPDATED, expect.anything());

      const depositApprovedEvents = eventEmitter.emit.mock.calls.filter(
        (call) => call[0] === InvestmentEventType.DEPOSIT_APPROVED,
      );
      const portfolioUpdatedEvents = eventEmitter.emit.mock.calls.filter(
        (call) => call[0] === InvestmentEventType.PORTFOLIO_UPDATED,
      );

      expect(depositApprovedEvents).toHaveLength(1);
      expect(portfolioUpdatedEvents).toHaveLength(1);
    });

    it('should throw if deposit not found', async () => {
      repository.findDepositById.mockResolvedValue(null);

      await expect(service.approveDeposit('nonexistent', 'admin-1')).rejects.toThrow(DepositNotFoundException);
    });

    it('should throw if deposit not pending', async () => {
      repository.findDepositById.mockResolvedValue({ ...mockPendingDeposit, status: DepositStatus.APPROVED } as never);

      await expect(service.approveDeposit('dep-1', 'admin-1')).rejects.toThrow(DepositNotFoundException);
    });

    it('should throw if product not found', async () => {
      repository.findDepositById.mockResolvedValue(mockPendingDeposit as never);
      repository.findProductById.mockResolvedValue(null);

      await expect(service.approveDeposit('dep-1', 'admin-1')).rejects.toThrow(AssetNotFoundException);
    });

    it('should update existing position on approve', async () => {
      repository.findDepositById.mockResolvedValue(mockPendingDeposit as never);
      repository.findProductById.mockResolvedValue(mockProduct as never);
      transactionService.createTransaction.mockResolvedValue({ id: 'tx-1' } as never);
      repository.updateDeposit.mockResolvedValue({ ...mockPendingDeposit, status: DepositStatus.APPROVED } as never);
      repository.findOrCreatePortfolio.mockResolvedValue(mockPortfolio as never);
      repository.findPosition.mockResolvedValue({ quantity: 2.0, totalCost: 100000, averageCost: 50000 } as never);
      repository.upsertPosition.mockResolvedValue({} as never);
      repository.createEntry.mockResolvedValue({} as never);
      repository.findPositionsByPortfolio.mockResolvedValue([{ currentValue: 150000 }] as never);
      repository.updatePortfolioValue.mockResolvedValue({} as never);
      mapper.toDepositResponseDto.mockReturnValue({ id: 'dep-1' } as never);

      await service.approveDeposit('dep-1', 'admin-1');

      expect(repository.upsertPosition).toHaveBeenCalledWith(expect.objectContaining({ quantity: 3.5 }));
    });
  });

  describe('rejectDeposit', () => {
    it('should reject a deposit successfully', async () => {
      repository.findDepositById.mockResolvedValue(mockPendingDeposit as never);
      repository.updateDeposit.mockResolvedValue({ ...mockPendingDeposit, status: DepositStatus.REJECTED } as never);
      mapper.toDepositResponseDto.mockReturnValue({ id: 'dep-1', status: 'REJECTED' } as never);

      const result = await service.rejectDeposit('dep-1', 'admin-1', 'Invalid transaction');

      expect(result).toBeDefined();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        InvestmentEventType.DEPOSIT_REJECTED,
        expect.anything(),
      );
    });

    it('should throw if deposit not found', async () => {
      repository.findDepositById.mockResolvedValue(null);

      await expect(service.rejectDeposit('nonexistent', 'admin-1', 'reason')).rejects.toThrow(DepositNotFoundException);
    });
  });

  describe('approveWithdrawal', () => {
    it('should approve a withdrawal successfully', async () => {
      repository.findWithdrawalById.mockResolvedValue(mockPendingWithdrawal as never);
      repository.findProductById.mockResolvedValue(mockProduct as never);
      transactionService.createTransaction.mockResolvedValue({ id: 'tx-2' } as never);
      repository.updateWithdrawal.mockResolvedValue({ ...mockPendingWithdrawal, status: WithdrawalStatus.APPROVED } as never);
      repository.findOrCreatePortfolio.mockResolvedValue(mockPortfolio as never);
      repository.findPosition.mockResolvedValue({ quantity: 5.0, averageCost: 50000 } as never);
      repository.upsertPosition.mockResolvedValue({} as never);
      repository.createEntry.mockResolvedValue({} as never);
      repository.findPositionsByPortfolio.mockResolvedValue([{ currentValue: 200000 }] as never);
      repository.updatePortfolioValue.mockResolvedValue({} as never);
      mapper.toWithdrawalResponseDto.mockReturnValue({ id: 'wth-1', status: 'APPROVED' } as never);

      await service.approveWithdrawal('wth-1', 'admin-1');
      expect(transactionService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CRYPTO_WITHDRAWAL',
          accountId: 'user-1',
          reference: 'WTH-ABC12345',
          metadata: expect.objectContaining({
            withdrawalId: 'wth-1',
            productId: 'prod-1',
            destinationAddress: '0xABC',
          }),
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(InvestmentEventType.WITHDRAWAL_APPROVED, expect.anything());
      expect(eventEmitter.emit).toHaveBeenCalledWith(InvestmentEventType.PORTFOLIO_UPDATED, expect.anything());

      const withdrawalApprovedEvents = eventEmitter.emit.mock.calls.filter(
        (call) => call[0] === InvestmentEventType.WITHDRAWAL_APPROVED,
      );
      const portfolioUpdatedEvents = eventEmitter.emit.mock.calls.filter(
        (call) => call[0] === InvestmentEventType.PORTFOLIO_UPDATED,
      );

      expect(withdrawalApprovedEvents).toHaveLength(1);
      expect(portfolioUpdatedEvents).toHaveLength(1);
    });

    it('should throw if withdrawal not found', async () => {
      repository.findWithdrawalById.mockResolvedValue(null);

      await expect(service.approveWithdrawal('nonexistent', 'admin-1')).rejects.toThrow(WithdrawalNotFoundException);
    });

    it('should throw if withdrawal not pending', async () => {
      repository.findWithdrawalById.mockResolvedValue({ ...mockPendingWithdrawal, status: WithdrawalStatus.APPROVED } as never);

      await expect(service.approveWithdrawal('wth-1', 'admin-1')).rejects.toThrow(WithdrawalNotFoundException);
    });
  });

  describe('rejectWithdrawal', () => {
    it('should reject a withdrawal successfully', async () => {
      repository.findWithdrawalById.mockResolvedValue(mockPendingWithdrawal as never);
      repository.updateWithdrawal.mockResolvedValue({ ...mockPendingWithdrawal, status: WithdrawalStatus.REJECTED } as never);
      mapper.toWithdrawalResponseDto.mockReturnValue({ id: 'wth-1', status: 'REJECTED' } as never);

      const result = await service.rejectWithdrawal('wth-1', 'admin-1', 'Suspicious activity');

      expect(result).toBeDefined();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        InvestmentEventType.WITHDRAWAL_REJECTED,
        expect.anything(),
      );
    });

    it('should throw if withdrawal not found', async () => {
      repository.findWithdrawalById.mockResolvedValue(null);

      await expect(service.rejectWithdrawal('nonexistent', 'admin-1', 'reason')).rejects.toThrow(
        WithdrawalNotFoundException,
      );
    });
  });
});
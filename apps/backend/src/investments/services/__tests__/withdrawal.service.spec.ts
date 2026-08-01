import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WithdrawalService } from '../withdrawal.service';
import { InvestmentRepository } from '../../repositories/investment.repository';
import { InvestmentMapper } from '../../mappers/investment.mapper';
import { InvestmentPolicy } from '../../policies/investment.policy';
import { InvestmentValidator } from '../../validators/investment.validator';
import { InvestmentEventType } from '../../events/investment.events';
import {
  AssetNotFoundException,
  WithdrawalNotFoundException,
  BelowMinWithdrawalException,
  InsufficientHoldingsException,
} from '../../exceptions/investment-domain.exception';
import { AssetStatus } from '../../enums/investment-status.enum';

describe('WithdrawalService', () => {
  let service: WithdrawalService;
  let repository: jest.Mocked<InvestmentRepository>;
  let mapper: jest.Mocked<InvestmentMapper>;
  let _policy: jest.Mocked<InvestmentPolicy>;
  let validator: jest.Mocked<InvestmentValidator>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockProduct = {
    id: 'prod-1',
    symbol: 'BTC',
    name: 'Bitcoin',
    status: AssetStatus.ACTIVE,
    minWithdrawal: 0.001,
    withdrawalFee: 0.0005,
  };

  const mockPortfolio = { id: 'portfolio-1', userId: 'user-1' };

  const mockHolding = {
    id: 'holding-1',
    portfolioId: 'portfolio-1',
    productId: 'prod-1',
    quantity: 2.0,
  };

  const mockWithdrawal = {
    id: 'wth-1',
    userId: 'user-1',
    productId: 'prod-1',
    amount: 1.0,
    fee: 0.0005,
    netAmount: 0.9995,
    toAddress: '0xABC',
    toMemo: null,
    network: 'CRYPTO',
    reference: 'WTH-ABC12345',
    status: 'PENDING',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = {
      findProductBySymbol: jest.fn(),
      findOrCreatePortfolio: jest.fn(),
      findHolding: jest.fn(),
      findWithdrawalsByUser: jest.fn(),
      createWithdrawal: jest.fn(),
      findWithdrawalById: jest.fn(),
      findWithdrawals: jest.fn(),
    };

    const mockMapperObj = { toWithdrawalResponseDto: jest.fn() };
    const mockPolicyObj = { assertCanWithdraw: jest.fn() };
    const mockValidatorObj = { validateCreateWithdrawal: jest.fn() };
    const mockEventEmitterObj = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WithdrawalService,
        { provide: InvestmentRepository, useValue: mockRepo },
        { provide: InvestmentMapper, useValue: mockMapperObj },
        { provide: InvestmentPolicy, useValue: mockPolicyObj },
        { provide: InvestmentValidator, useValue: mockValidatorObj },
        { provide: EventEmitter2, useValue: mockEventEmitterObj },
      ],
    }).compile();

    service = module.get<WithdrawalService>(WithdrawalService);
    repository = module.get(InvestmentRepository) as jest.Mocked<InvestmentRepository>;
    mapper = module.get(InvestmentMapper) as jest.Mocked<InvestmentMapper>;
    _policy = module.get(InvestmentPolicy) as jest.Mocked<InvestmentPolicy>;
    validator = module.get(InvestmentValidator) as jest.Mocked<InvestmentValidator>;
    eventEmitter = module.get(EventEmitter2) as jest.Mocked<EventEmitter2>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestWithdrawal', () => {
    const createDto = {
      productSymbol: 'BTC',
      amount: 1.0,
      toAddress: '0xABC',
    };

    it('should create a withdrawal request successfully', async () => {
      repository.findProductBySymbol.mockResolvedValue(mockProduct as never);
      repository.findOrCreatePortfolio.mockResolvedValue(mockPortfolio as never);
      repository.findHolding.mockResolvedValue(mockHolding as never);
      repository.findWithdrawalsByUser.mockResolvedValue([]);
      repository.createWithdrawal.mockResolvedValue(mockWithdrawal as never);
      mapper.toWithdrawalResponseDto.mockReturnValue({ id: 'wth-1' } as never);

      const result = await service.requestWithdrawal('user-1', createDto as never);

      expect(result).toBeDefined();
      expect(validator.validateCreateWithdrawal).toHaveBeenCalledWith(createDto);
      expect(repository.findProductBySymbol).toHaveBeenCalledWith('BTC');
      expect(repository.createWithdrawal).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        InvestmentEventType.WITHDRAWAL_REQUESTED,
        expect.objectContaining({ userId: 'user-1', amount: 1.0 }),
      );
    });

    it('should throw if product not found', async () => {
      repository.findProductBySymbol.mockResolvedValue(null);

      await expect(service.requestWithdrawal('user-1', createDto as never)).rejects.toThrow(
        AssetNotFoundException,
      );
    });

    it('should throw if amount below minimum withdrawal', async () => {
      repository.findProductBySymbol.mockResolvedValue({ ...mockProduct, minWithdrawal: 5.0 } as never);

      await expect(
        service.requestWithdrawal('user-1', { ...createDto, amount: 1.0 } as never),
      ).rejects.toThrow(BelowMinWithdrawalException);
    });

    it('should throw if insufficient holdings', async () => {
      repository.findProductBySymbol.mockResolvedValue(mockProduct as never);
      repository.findOrCreatePortfolio.mockResolvedValue(mockPortfolio as never);
      repository.findHolding.mockResolvedValue({ ...mockHolding, quantity: 0.1 } as never);

      await expect(
        service.requestWithdrawal('user-1', createDto as never),
      ).rejects.toThrow(InsufficientHoldingsException);
    });

    it('should throw if no holdings exist', async () => {
      repository.findProductBySymbol.mockResolvedValue(mockProduct as never);
      repository.findOrCreatePortfolio.mockResolvedValue(mockPortfolio as never);
      repository.findHolding.mockResolvedValue(null);

      await expect(
        service.requestWithdrawal('user-1', createDto as never),
      ).rejects.toThrow(InsufficientHoldingsException);
    });
  });

  describe('getWithdrawal', () => {
    it('should return a withdrawal by id', async () => {
      repository.findWithdrawalById.mockResolvedValue(mockWithdrawal as never);
      mapper.toWithdrawalResponseDto.mockReturnValue({ id: 'wth-1' } as never);

      const result = await service.getWithdrawal('wth-1');

      expect(result).toBeDefined();
      expect(repository.findWithdrawalById).toHaveBeenCalledWith('wth-1');
    });

    it('should throw if withdrawal not found', async () => {
      repository.findWithdrawalById.mockResolvedValue(null);

      await expect(service.getWithdrawal('nonexistent')).rejects.toThrow(WithdrawalNotFoundException);
    });
  });

  describe('listWithdrawals', () => {
    it('should list withdrawals by user', async () => {
      repository.findWithdrawalsByUser.mockResolvedValue([mockWithdrawal] as never);
      mapper.toWithdrawalResponseDto.mockReturnValue({ id: 'wth-1' } as never);

      const result = await service.listWithdrawals({ userId: 'user-1' });

      expect(result).toHaveLength(1);
      expect(repository.findWithdrawalsByUser).toHaveBeenCalledWith('user-1');
    });

    it('should list all withdrawals without user filter', async () => {
      repository.findWithdrawals.mockResolvedValue([mockWithdrawal] as never);
      mapper.toWithdrawalResponseDto.mockReturnValue({ id: 'wth-1' } as never);

      const result = await service.listWithdrawals();

      expect(result).toHaveLength(1);
      expect(repository.findWithdrawals).toHaveBeenCalled();
    });
  });

  describe('getUserWithdrawals', () => {
    it('should delegate to listWithdrawals with userId', async () => {
      const spy = jest.spyOn(service, 'listWithdrawals').mockResolvedValue([]);

      await service.getUserWithdrawals('user-1');

      expect(spy).toHaveBeenCalledWith({ userId: 'user-1' });
    });
  });
});
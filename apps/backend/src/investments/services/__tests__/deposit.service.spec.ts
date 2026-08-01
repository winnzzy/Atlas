import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DepositService } from '../deposit.service';
import { InvestmentRepository } from '../../repositories/investment.repository';
import { InvestmentMapper } from '../../mappers/investment.mapper';
import { InvestmentValidator } from '../../validators/investment.validator';
import { InvestmentEventType } from '../../events/investment.events';
import { AssetDisabledException, DepositNotFoundException } from '../../exceptions/investment-domain.exception';
import { AssetStatus } from '../../enums/investment-status.enum';

describe('DepositService', () => {
  let service: DepositService;
  let repository: jest.Mocked<InvestmentRepository>;
  let mapper: jest.Mocked<InvestmentMapper>;
  let validator: jest.Mocked<InvestmentValidator>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockProduct = {
    id: 'prod-1',
    symbol: 'BTC',
    name: 'Bitcoin',
    status: AssetStatus.ACTIVE,
  };

  const mockWallet = {
    id: 'wallet-1',
    productId: 'prod-1',
    network: 'ERC20',
    address: '0xABC123',
    status: 'ACTIVE',
  };

  const mockDeposit = {
    id: 'dep-1',
    userId: 'user-1',
    productId: 'prod-1',
    walletId: 'wallet-1',
    amount: 1.5,
    network: 'ERC20',
    reference: 'DEP-ABC12345',
    txHash: '0xTX123',
    status: 'PENDING',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = {
      findProductBySymbol: jest.fn(),
      findWalletsByProduct: jest.fn(),
      createDeposit: jest.fn(),
      findDepositById: jest.fn(),
      findDepositsByUser: jest.fn(),
      findDeposits: jest.fn(),
      searchDeposits: jest.fn(),
    };

    const mockMapperObj = {
      toDepositResponseDto: jest.fn(),
    };

    const mockValidatorObj = {
      validateAmount: jest.fn(),
    };

    const mockEventEmitterObj = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepositService,
        { provide: InvestmentRepository, useValue: mockRepo },
        { provide: InvestmentMapper, useValue: mockMapperObj },
        { provide: InvestmentValidator, useValue: mockValidatorObj },
        { provide: EventEmitter2, useValue: mockEventEmitterObj },
      ],
    }).compile();

    service = module.get<DepositService>(DepositService);
    repository = module.get(InvestmentRepository) as jest.Mocked<InvestmentRepository>;
    mapper = module.get(InvestmentMapper) as jest.Mocked<InvestmentMapper>;
    validator = module.get(InvestmentValidator) as jest.Mocked<InvestmentValidator>;
    eventEmitter = module.get(EventEmitter2) as jest.Mocked<EventEmitter2>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDeposit', () => {
    const createDto = { productSymbol: 'BTC', amount: 1.5, txHash: '0xTX123' };

    it('should create a deposit successfully', async () => {
      repository.findProductBySymbol.mockResolvedValue(mockProduct as never);
      repository.findWalletsByProduct.mockResolvedValue([mockWallet] as never);
      repository.createDeposit.mockResolvedValue(mockDeposit as never);
      mapper.toDepositResponseDto.mockReturnValue({ id: 'dep-1' } as never);

      const result = await service.createDeposit('user-1', createDto as never);

      expect(result).toBeDefined();
      expect(validator.validateAmount).toHaveBeenCalledWith(1.5);
      expect(repository.findProductBySymbol).toHaveBeenCalledWith('BTC');
      expect(repository.createDeposit).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        InvestmentEventType.DEPOSIT_REQUESTED,
        expect.objectContaining({ userId: 'user-1', amount: 1.5 }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
    });

    it('should throw if product not found', async () => {
      repository.findProductBySymbol.mockResolvedValue(null);

      await expect(service.createDeposit('user-1', createDto as never)).rejects.toThrow(
        AssetDisabledException,
      );
    });

    it('should throw if product is not active', async () => {
      repository.findProductBySymbol.mockResolvedValue({ ...mockProduct, status: 'SUSPENDED' } as never);

      await expect(service.createDeposit('user-1', createDto as never)).rejects.toThrow(
        AssetDisabledException,
      );
    });

    it('should throw if no active wallet found', async () => {
      repository.findProductBySymbol.mockResolvedValue(mockProduct as never);
      repository.findWalletsByProduct.mockResolvedValue([]);

      await expect(service.createDeposit('user-1', createDto as never)).rejects.toThrow(
        AssetDisabledException,
      );
    });
  });

  describe('getDeposit', () => {
    it('should return a deposit by id', async () => {
      repository.findDepositById.mockResolvedValue(mockDeposit as never);
      mapper.toDepositResponseDto.mockReturnValue({ id: 'dep-1' } as never);

      const result = await service.getDeposit('dep-1');

      expect(result).toBeDefined();
      expect(repository.findDepositById).toHaveBeenCalledWith('dep-1');
    });

    it('should throw if deposit not found', async () => {
      repository.findDepositById.mockResolvedValue(null);

      await expect(service.getDeposit('nonexistent')).rejects.toThrow(DepositNotFoundException);
    });
  });

  describe('getDepositsByUser', () => {
    it('should return deposits for a user', async () => {
      repository.findDepositsByUser.mockResolvedValue([mockDeposit] as never);
      mapper.toDepositResponseDto.mockReturnValue({ id: 'dep-1' } as never);

      const result = await service.getDepositsByUser('user-1');

      expect(result).toHaveLength(1);
      expect(repository.findDepositsByUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('requestDeposit', () => {
    it('should delegate to createDeposit', async () => {
      const spy = jest.spyOn(service, 'createDeposit').mockResolvedValue({ id: 'dep-1' } as never);

      await service.requestDeposit('user-1', { productSymbol: 'BTC', amount: 1 } as never);

      expect(spy).toHaveBeenCalledWith('user-1', { productSymbol: 'BTC', amount: 1 });
    });
  });

  describe('getUserDeposits', () => {
    it('should delegate to getDepositsByUser', async () => {
      const spy = jest.spyOn(service, 'getDepositsByUser').mockResolvedValue([]);

      await service.getUserDeposits('user-1');

      expect(spy).toHaveBeenCalledWith('user-1');
    });
  });

  describe('listDeposits', () => {
    it('should list deposits without filters', async () => {
      repository.findDeposits.mockResolvedValue([mockDeposit] as never);
      mapper.toDepositResponseDto.mockReturnValue({ id: 'dep-1' } as never);

      const result = await service.listDeposits();

      expect(result).toHaveLength(1);
      expect(repository.findDeposits).toHaveBeenCalled();
    });

    it('should list deposits with search when productId or status provided', async () => {
      repository.searchDeposits.mockResolvedValue({ data: [mockDeposit], total: 1 } as never);
      mapper.toDepositResponseDto.mockReturnValue({ id: 'dep-1' } as never);

      const result = await service.listDeposits({ status: 'PENDING' });

      expect(result).toHaveLength(1);
      expect(repository.searchDeposits).toHaveBeenCalled();
    });
  });
});
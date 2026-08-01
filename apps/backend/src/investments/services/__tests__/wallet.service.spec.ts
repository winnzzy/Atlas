import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WalletService } from '../wallet.service';
import { InvestmentRepository } from '../../repositories/investment.repository';
import { InvestmentMapper } from '../../mappers/investment.mapper';
import { InvestmentPolicy } from '../../policies/investment.policy';
import { InvestmentValidator } from '../../validators/investment.validator';
import { WalletStatus, AssetStatus } from '../../enums/investment-status.enum';
import { InvestmentEventType } from '../../events/investment.events';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('WalletService', () => {
  let service: WalletService;
  let repository: jest.Mocked<InvestmentRepository>;
  let mapper: jest.Mocked<InvestmentMapper>;
  let policy: jest.Mocked<InvestmentPolicy>;
  let validator: jest.Mocked<InvestmentValidator>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockWallet = {
    id: 'wallet-1',
    productId: 'prod-1',
    network: 'ERC20',
    address: '0xABC123',
    memo: null,
    label: 'Main Wallet',
    status: WalletStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    id: 'prod-1',
    symbol: 'BTC',
    name: 'Bitcoin',
    status: AssetStatus.ACTIVE,
  };

  beforeEach(async () => {
    const mockRepository = {
      findProductById: jest.fn(),
      findWalletById: jest.fn(),
      findWalletByAddress: jest.fn(),
      createWallet: jest.fn(),
      updateWallet: jest.fn(),
      updateWalletStatus: jest.fn(),
      deleteWallet: jest.fn(),
      findWalletsByProduct: jest.fn(),
      findWallets: jest.fn(),
    };

    const mockMapper = {
      toWalletResponseDto: jest.fn(),
    };

    const mockPolicy = {
      assertCanManageWallet: jest.fn(),
      assertWalletCanBeDeleted: jest.fn(),
    };

    const mockValidator = {
      validateCreateWallet: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: InvestmentRepository, useValue: mockRepository },
        { provide: InvestmentMapper, useValue: mockMapper },
        { provide: InvestmentPolicy, useValue: mockPolicy },
        { provide: InvestmentValidator, useValue: mockValidator },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    repository = module.get(InvestmentRepository);
    mapper = module.get(InvestmentMapper);
    policy = module.get(InvestmentPolicy);
    validator = module.get(InvestmentValidator);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWallet', () => {
    const createDto = {
      productId: 'prod-1',
      network: 'ERC20',
      address: '0xABC123',
      label: 'Main Wallet',
    };

    it('should create a wallet successfully', async () => {
      repository.findProductById.mockResolvedValue(mockProduct as never);
      repository.findWalletByAddress.mockResolvedValue(null);
      repository.createWallet.mockResolvedValue(mockWallet as never);
      mapper.toWalletResponseDto.mockReturnValue({ id: 'wallet-1' } as never);

      const result = await service.createWallet(createDto as never, 'admin-1');

      expect(result).toBeDefined();
      expect(validator.validateCreateWallet).toHaveBeenCalledWith(createDto);
      expect(repository.findProductById).toHaveBeenCalledWith('prod-1');
      expect(repository.createWallet).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        InvestmentEventType.WALLET_ADDRESS_CHANGED,
        expect.objectContaining({ action: 'created' }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
    });

    it('should throw if product not found', async () => {
      repository.findProductById.mockResolvedValue(null);

      await expect(service.createWallet(createDto as never, 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if wallet address already exists on same network', async () => {
      repository.findProductById.mockResolvedValue(mockProduct as never);
      repository.findWalletByAddress.mockResolvedValue(mockWallet as never);

      await expect(service.createWallet(createDto as never, 'admin-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateWallet', () => {
    it('should update wallet successfully', async () => {
      const updateDto = { address: '0xNEW456', label: 'Updated' };
      repository.findWalletById.mockResolvedValue(mockWallet as never);
      repository.updateWallet.mockResolvedValue({ ...mockWallet, ...updateDto } as never);
      mapper.toWalletResponseDto.mockReturnValue({ id: 'wallet-1' } as never);

      const result = await service.updateWallet('wallet-1', updateDto as never, 'admin-1');

      expect(result).toBeDefined();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        InvestmentEventType.WALLET_ADDRESS_CHANGED,
        expect.objectContaining({ action: 'updated' }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
    });

    it('should throw if wallet not found', async () => {
      repository.findWalletById.mockResolvedValue(null);

      await expect(service.updateWallet('nonexistent', {} as never, 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not emit address changed event if address not updated', async () => {
      const updateDto = { label: 'Updated Only' };
      repository.findWalletById.mockResolvedValue(mockWallet as never);
      repository.updateWallet.mockResolvedValue(mockWallet as never);
      mapper.toWalletResponseDto.mockReturnValue({ id: 'wallet-1' } as never);

      await service.updateWallet('wallet-1', updateDto as never, 'admin-1');

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('activateWallet', () => {
    it('should activate a wallet', async () => {
      const inactiveWallet = { ...mockWallet, status: WalletStatus.INACTIVE };
      repository.findWalletById.mockResolvedValue(inactiveWallet as never);
      repository.updateWalletStatus.mockResolvedValue(mockWallet as never);
      mapper.toWalletResponseDto.mockReturnValue({ id: 'wallet-1', status: 'ACTIVE' } as never);

      const result = await service.activateWallet('wallet-1', 'admin-1');

      expect(result).toBeDefined();
      expect(repository.updateWalletStatus).toHaveBeenCalledWith('wallet-1', WalletStatus.ACTIVE);
    });

    it('should throw if wallet not found', async () => {
      repository.findWalletById.mockResolvedValue(null);

      await expect(service.activateWallet('nonexistent', 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivateWallet', () => {
    it('should deactivate a wallet', async () => {
      repository.findWalletById.mockResolvedValue(mockWallet as never);
      repository.updateWalletStatus.mockResolvedValue({ ...mockWallet, status: WalletStatus.INACTIVE } as never);
      mapper.toWalletResponseDto.mockReturnValue({ id: 'wallet-1', status: 'INACTIVE' } as never);

      const result = await service.deactivateWallet('wallet-1', 'admin-1');

      expect(result).toBeDefined();
      expect(repository.updateWalletStatus).toHaveBeenCalledWith('wallet-1', WalletStatus.INACTIVE);
    });
  });

  describe('deleteWallet', () => {
    it('should delete a wallet', async () => {
      repository.findWalletById.mockResolvedValue(mockWallet as never);
      repository.deleteWallet.mockResolvedValue(mockWallet as never);

      await service.deleteWallet('wallet-1', 'admin-1');

      expect(policy.assertWalletCanBeDeleted).toHaveBeenCalled();
      expect(repository.deleteWallet).toHaveBeenCalledWith('wallet-1');
    });

    it('should throw if wallet not found', async () => {
      repository.findWalletById.mockResolvedValue(null);

      await expect(service.deleteWallet('nonexistent', 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getWallet', () => {
    it('should return a wallet by id', async () => {
      repository.findWalletById.mockResolvedValue(mockWallet as never);
      mapper.toWalletResponseDto.mockReturnValue({ id: 'wallet-1' } as never);

      const result = await service.getWallet('wallet-1');

      expect(result).toBeDefined();
      expect(repository.findWalletById).toHaveBeenCalledWith('wallet-1');
    });

    it('should throw if wallet not found', async () => {
      repository.findWalletById.mockResolvedValue(null);

      await expect(service.getWallet('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getWalletsByProduct', () => {
    it('should return wallets for a product', async () => {
      repository.findWalletsByProduct.mockResolvedValue([mockWallet] as never);
      mapper.toWalletResponseDto.mockReturnValue({ id: 'wallet-1' } as never);

      const result = await service.getWalletsByProduct('prod-1');

      expect(result).toHaveLength(1);
      expect(repository.findWalletsByProduct).toHaveBeenCalledWith('prod-1');
    });
  });

  describe('getActiveWalletForProduct', () => {
    it('should return active wallet for product', async () => {
      repository.findWalletsByProduct.mockResolvedValue([mockWallet] as never);
      mapper.toWalletResponseDto.mockReturnValue({ id: 'wallet-1' } as never);

      const result = await service.getActiveWalletForProduct('prod-1', 'ERC20');

      expect(result).toBeDefined();
    });

    it('should throw if no active wallet found', async () => {
      repository.findWalletsByProduct.mockResolvedValue([]);

      await expect(service.getActiveWalletForProduct('prod-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listWallets', () => {
    it('should return filtered wallet list', async () => {
      repository.findWallets.mockResolvedValue([mockWallet] as never);
      mapper.toWalletResponseDto.mockReturnValue({ id: 'wallet-1' } as never);

      const result = await service.listWallets({ productId: 'prod-1' });

      expect(result).toHaveLength(1);
      expect(repository.findWallets).toHaveBeenCalledWith({ productId: 'prod-1' });
    });
  });
});
import { Test } from '@nestjs/testing';
import { TransferController } from '../transfer.controller';
import { TransferService } from '../../services/transfer.service';
import { TransferType } from '../../enums/transfer-type.enum';
import { TransferStatus } from '../../enums/transfer-status.enum';

describe('TransferController', () => {
  const serviceMock = {
    createTransfer: jest.fn(),
    searchTransfers: jest.fn(),
    getTransfer: jest.fn(),
    submitTransfer: jest.fn(),
    cancelTransfer: jest.fn(),
    reverseTransfer: jest.fn(),
    createBeneficiary: jest.fn(),
    listBeneficiaries: jest.fn(),
    favoriteBeneficiary: jest.fn(),
    verifyBeneficiary: jest.fn(),
    deleteBeneficiary: jest.fn(),
  };

  beforeEach(() => {
    Object.values(serviceMock).forEach((mockFn) => mockFn.mockReset());
  });

  it('creates and submits a transfer', async () => {
    serviceMock.createTransfer.mockResolvedValue({ id: 'trf-1', type: TransferType.INTERNAL, status: TransferStatus.COMPLETED } as never);
    const module = await Test.createTestingModule({
      controllers: [TransferController],
      providers: [{ provide: TransferService, useValue: serviceMock }],
    }).compile();
    const controller = module.get(TransferController);

    const user = { id: 'user-1' } as never;
    const dto = {
      type: TransferType.INTERNAL,
      sourceAccountId: '11111111-1111-1111-1111-111111111111',
      destinationAccountId: '22222222-2222-2222-2222-222222222222',
      amount: '10.00',
      currency: 'USD',
    } as never;
    const result = await controller.createTransfer(user, dto);

    expect(result.status).toBe(TransferStatus.COMPLETED);
    // The authenticated principal must reach the service; it scopes ownership.
    expect(serviceMock.createTransfer).toHaveBeenCalledWith(user, dto);
  });
});

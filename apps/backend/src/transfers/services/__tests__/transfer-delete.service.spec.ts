import { TransferService } from '../transfer.service';
import type { TransferRecord } from '../../repositories/transfer.repository';
import { TransferStatus } from '../../enums/transfer-status.enum';
import { TransferType } from '../../enums/transfer-type.enum';
import { TransferNotFoundException } from '../../exceptions/transfer-domain.exception';

type RepoDouble = {
  findById: jest.Mock;
  softDelete: jest.Mock;
  softDeleteMany: jest.Mock;
  findIdsByAccount: jest.Mock;
};

function buildService(record: unknown, extra: Partial<RepoDouble> = {}) {
  const repository: RepoDouble = {
    findById: jest.fn().mockResolvedValue(record),
    softDelete: jest.fn().mockResolvedValue(undefined),
    softDeleteMany: jest.fn().mockResolvedValue(undefined),
    findIdsByAccount: jest.fn().mockResolvedValue([]),
    ...extra,
  };
  const transactionService = {
    adminDeleteTransactionByReference: jest.fn().mockResolvedValue({ id: 'txn-1', deleted: true }),
  };
  const service = new TransferService(
    {} as never,
    transactionService as never,
    repository as never,
    {} as never,
    {} as never,
    { toTransferResponse: jest.fn() } as never,
    { emit: jest.fn() } as never,
    {} as never,
  );
  return { service, repository, transactionService };
}

function makeTransfer(overrides: Partial<TransferRecord> = {}): TransferRecord {
  return {
    id: 'trf-1',
    reference: 'TRF-1',
    type: TransferType.INTERNAL,
    status: TransferStatus.COMPLETED,
    sourceAccountId: 'acc-1',
    amount: '10.00',
    currency: 'USD',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('TransferService.adminDeleteTransfer', () => {
  it('soft-deletes a transfer and its linked transaction (matched by settlement reference)', async () => {
    const transfer = makeTransfer({ settlementReference: 'TRF-1' });
    const { service, repository, transactionService } = buildService(transfer);

    const result = await service.adminDeleteTransfer('trf-1', 'admin-1');

    expect(result).toEqual({ id: 'trf-1', deleted: true });
    expect(repository.softDelete).toHaveBeenCalledWith('trf-1');
    expect(transactionService.adminDeleteTransactionByReference).toHaveBeenCalledWith(
      'TRF-1',
      'admin-1',
    );
  });

  it('does not attempt to delete a linked transaction when the transfer never settled', async () => {
    const transfer = makeTransfer({ status: TransferStatus.PENDING_APPROVAL });
    const { service, repository, transactionService } = buildService(transfer);

    const result = await service.adminDeleteTransfer('trf-1', 'admin-1');

    expect(result).toEqual({ id: 'trf-1', deleted: true });
    expect(repository.softDelete).toHaveBeenCalledWith('trf-1');
    expect(transactionService.adminDeleteTransactionByReference).not.toHaveBeenCalled();
  });

  it('throws when the transfer does not exist', async () => {
    const { service, repository } = buildService(null);

    await expect(service.adminDeleteTransfer('missing')).rejects.toBeInstanceOf(
      TransferNotFoundException,
    );
    expect(repository.softDelete).not.toHaveBeenCalled();
  });
});

describe('TransferService.adminBulkDeleteTransfers', () => {
  it('soft-deletes every found transfer, deletes their linked transactions, and skips unknown ids', async () => {
    const records: Record<string, TransferRecord> = {
      'trf-a': makeTransfer({ id: 'trf-a', reference: 'TRF-A', settlementReference: 'TRF-A' }),
      'trf-b': makeTransfer({ id: 'trf-b', reference: 'TRF-B', settlementReference: undefined }),
    };
    const { service, repository, transactionService } = buildService(null, {
      findById: jest.fn().mockImplementation((id: string) => Promise.resolve(records[id] ?? null)),
    });

    const result = await service.adminBulkDeleteTransfers(
      ['trf-a', 'trf-b', 'trf-missing'],
      'admin-1',
    );

    expect(result).toEqual({ requested: 3, deleted: 2 });
    expect(repository.softDeleteMany).toHaveBeenCalledWith(['trf-a', 'trf-b']);
    expect(transactionService.adminDeleteTransactionByReference).toHaveBeenCalledTimes(1);
    expect(transactionService.adminDeleteTransactionByReference).toHaveBeenCalledWith(
      'TRF-A',
      'admin-1',
    );
  });

  it('does nothing for an empty id list', async () => {
    const { service, repository } = buildService(null);
    const result = await service.adminBulkDeleteTransfers([], 'admin-1');
    expect(result).toEqual({ requested: 0, deleted: 0 });
    expect(repository.softDeleteMany).not.toHaveBeenCalled();
  });
});

describe('TransferService.adminClearAccountTransferHistory', () => {
  it('soft-deletes every transfer the account initiated and clears their linked transactions', async () => {
    const records: Record<string, TransferRecord> = {
      'trf-1': makeTransfer({ id: 'trf-1', reference: 'TRF-1', settlementReference: 'TRF-1' }),
      'trf-2': makeTransfer({ id: 'trf-2', reference: 'TRF-2', settlementReference: 'TRF-2' }),
    };
    const { service, repository, transactionService } = buildService(null, {
      findIdsByAccount: jest.fn().mockResolvedValue(['trf-1', 'trf-2']),
      findById: jest.fn().mockImplementation((id: string) => Promise.resolve(records[id] ?? null)),
    });

    const result = await service.adminClearAccountTransferHistory('acc-1', 'admin-1');

    expect(result).toEqual({ accountId: 'acc-1', deleted: 2 });
    expect(repository.softDeleteMany).toHaveBeenCalledWith(['trf-1', 'trf-2']);
    expect(transactionService.adminDeleteTransactionByReference).toHaveBeenCalledTimes(2);
  });

  it('does nothing when the account has no transfers', async () => {
    const { service, repository } = buildService(null);
    const result = await service.adminClearAccountTransferHistory('acc-1', 'admin-1');
    expect(result).toEqual({ accountId: 'acc-1', deleted: 0 });
    expect(repository.softDeleteMany).not.toHaveBeenCalled();
  });
});

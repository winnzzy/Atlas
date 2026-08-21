import { TransactionService } from '../transaction.service';
import { TransactionStatus } from '../../enums/transaction-status.enum';
import {
  TransactionNotFoundException,
  TransactionValidationException,
} from '../../exceptions/transaction-domain.exception';

type RepoDouble = {
  findById: jest.Mock;
  softDelete: jest.Mock;
  softDeleteMany: jest.Mock;
  findIdsByAccount: jest.Mock;
  applyBalanceMutation: jest.Mock;
};

function buildService(record: unknown, extra: Partial<RepoDouble> = {}) {
  const repository: RepoDouble = {
    findById: jest.fn().mockResolvedValue(record),
    softDelete: jest.fn().mockResolvedValue(undefined),
    softDeleteMany: jest.fn().mockResolvedValue(undefined),
    findIdsByAccount: jest.fn().mockResolvedValue([]),
    applyBalanceMutation: jest.fn(),
    ...extra,
  };
  const ledgerService = { postJournal: jest.fn(), reverseJournal: jest.fn() };
  const service = new TransactionService(
    repository as never,
    {} as never,
    {} as never,
    { emit: jest.fn() } as never,
    ledgerService as never,
    {} as never,
  );
  return { service, repository, ledgerService };
}

describe('TransactionService.deleteFailedTransaction', () => {
  it('soft-deletes a FAILED transaction without touching the ledger or balances', async () => {
    const { service, repository, ledgerService } = buildService({
      id: 'txn-1',
      reference: 'TXN-1',
      status: TransactionStatus.FAILED,
    });

    const result = await service.deleteFailedTransaction('txn-1', 'admin-1');

    expect(result).toEqual({ id: 'txn-1', deleted: true });
    expect(repository.softDelete).toHaveBeenCalledWith('txn-1', 'admin-1');
    // Deleting a failed transaction moves no money.
    expect(repository.applyBalanceMutation).not.toHaveBeenCalled();
    expect(ledgerService.reverseJournal).not.toHaveBeenCalled();
  });

  it('refuses to delete a COMPLETED transaction', async () => {
    const { service, repository } = buildService({
      id: 'txn-2',
      reference: 'TXN-2',
      status: TransactionStatus.COMPLETED,
    });

    await expect(service.deleteFailedTransaction('txn-2')).rejects.toBeInstanceOf(
      TransactionValidationException,
    );
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('refuses to delete a PENDING transaction', async () => {
    const { service, repository } = buildService({
      id: 'txn-3',
      reference: 'TXN-3',
      status: TransactionStatus.PENDING,
    });

    await expect(service.deleteFailedTransaction('txn-3')).rejects.toBeInstanceOf(
      TransactionValidationException,
    );
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('throws when the transaction does not exist', async () => {
    const { service, repository } = buildService(null);

    await expect(service.deleteFailedTransaction('missing')).rejects.toBeInstanceOf(
      TransactionNotFoundException,
    );
    expect(repository.softDelete).not.toHaveBeenCalled();
  });
});

describe('TransactionService.adminDeleteTransaction', () => {
  it('soft-deletes a COMPLETED transaction (admin-only, bypasses the FAILED-only rule)', async () => {
    const { service, repository, ledgerService } = buildService({
      id: 'txn-9',
      reference: 'TXN-9',
      status: TransactionStatus.COMPLETED,
    });

    const result = await service.adminDeleteTransaction('txn-9', 'admin-1');

    expect(result).toEqual({ id: 'txn-9', deleted: true });
    expect(repository.softDelete).toHaveBeenCalledWith('txn-9', 'admin-1');
    // Deleting from history never reverses the ledger or moves balances.
    expect(repository.applyBalanceMutation).not.toHaveBeenCalled();
    expect(ledgerService.reverseJournal).not.toHaveBeenCalled();
  });

  it('throws when the transaction does not exist', async () => {
    const { service, repository } = buildService(null);

    await expect(service.adminDeleteTransaction('missing')).rejects.toBeInstanceOf(
      TransactionNotFoundException,
    );
    expect(repository.softDelete).not.toHaveBeenCalled();
  });
});

describe('TransactionService.adminBulkDeleteTransactions', () => {
  it('soft-deletes every found transaction and skips unknown ids', async () => {
    const records: Record<string, { id: string; reference: string; status: string }> = {
      'txn-a': { id: 'txn-a', reference: 'TXN-A', status: TransactionStatus.COMPLETED },
      'txn-b': { id: 'txn-b', reference: 'TXN-B', status: TransactionStatus.FAILED },
    };
    const repository = {
      findById: jest.fn().mockImplementation((id: string) => Promise.resolve(records[id] ?? null)),
      softDelete: jest.fn(),
      softDeleteMany: jest.fn().mockResolvedValue(undefined),
      findIdsByAccount: jest.fn(),
      applyBalanceMutation: jest.fn(),
    };
    const service = new TransactionService(
      repository as never,
      {} as never,
      {} as never,
      { emit: jest.fn() } as never,
      { postJournal: jest.fn(), reverseJournal: jest.fn() } as never,
      {} as never,
    );

    const result = await service.adminBulkDeleteTransactions(
      ['txn-a', 'txn-b', 'txn-missing'],
      'admin-1',
    );

    expect(result).toEqual({ requested: 3, deleted: 2 });
    expect(repository.softDeleteMany).toHaveBeenCalledWith(['txn-a', 'txn-b'], 'admin-1');
  });

  it('does nothing for an empty id list', async () => {
    const { service, repository } = buildService(null);
    const result = await service.adminBulkDeleteTransactions([], 'admin-1');
    expect(result).toEqual({ requested: 0, deleted: 0 });
    expect(repository.softDeleteMany).not.toHaveBeenCalled();
  });
});

describe('TransactionService.adminClearAccountHistory', () => {
  it('soft-deletes every non-deleted transaction owned by the account', async () => {
    const { service, repository } = buildService(null, {
      findIdsByAccount: jest.fn().mockResolvedValue(['txn-1', 'txn-2', 'txn-3']),
    });

    const result = await service.adminClearAccountHistory('acc-1', 'admin-1');

    expect(result).toEqual({ accountId: 'acc-1', deleted: 3 });
    expect(repository.softDeleteMany).toHaveBeenCalledWith(['txn-1', 'txn-2', 'txn-3'], 'admin-1');
  });
});

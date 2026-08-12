import { TransactionService } from '../transaction.service';
import { TransactionStatus } from '../../enums/transaction-status.enum';
import {
  TransactionNotFoundException,
  TransactionValidationException,
} from '../../exceptions/transaction-domain.exception';

type RepoDouble = {
  findById: jest.Mock;
  softDelete: jest.Mock;
  applyBalanceMutation: jest.Mock;
};

function buildService(record: unknown) {
  const repository: RepoDouble = {
    findById: jest.fn().mockResolvedValue(record),
    softDelete: jest.fn().mockResolvedValue(undefined),
    applyBalanceMutation: jest.fn(),
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

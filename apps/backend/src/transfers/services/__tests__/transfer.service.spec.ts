import { Test } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TransferService } from '../transfer.service';
import { TransferRepository } from '../../repositories/transfer.repository';
import { TransferPolicy } from '../../policies/transfer.policy';
import { TransferValidator } from '../../validators/transfer.validator';
import { TransferMapper } from '../../mappers/transfer.mapper';
import { AccountService } from '../../../accounts/services/account.service';
import { TransactionService } from '../../../transactions/services/transaction.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransferType } from '../../enums/transfer-type.enum';
import { TransferPolicyViolationException, TransferValidationException } from '../../exceptions/transfer-domain.exception';

type Overrides = {
  account?: { status?: string; availableBalance?: string };
  kycStatus?: string;
  isHolder?: boolean;
};

function buildModule(overrides: Overrides = {}) {
  const transfers = new Map<string, Parameters<TransferRepository['saveTransfer']>[0]>();
  const accountService = {
    findById: jest.fn().mockResolvedValue({
      status: overrides.account?.status ?? 'ACTIVE',
      availableBalance: overrides.account?.availableBalance ?? '100.00',
    }),
    isAccountHolder: jest.fn().mockResolvedValue(overrides.isHolder ?? true),
  };
  const transactionService = {
    createTransaction: jest.fn().mockResolvedValue({ id: 'txn-1', reference: 'TXN-1' }),
  };
  const transferRepository = {
    findByIdempotencyKey: jest.fn().mockResolvedValue(null),
    existsByReference: jest.fn().mockResolvedValue(false),
    findBeneficiaryById: jest.fn().mockResolvedValue(null),
    saveTransfer: jest.fn(async (record) => {
      transfers.set(record.id, { ...record });
      return record;
    }),
    updateTransfer: jest.fn(async (record) => {
      transfers.set(record.id, { ...record });
      return record;
    }),
    findById: jest.fn(async (id) => transfers.get(id) ?? null),
  };
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ kycStatus: overrides.kycStatus ?? 'APPROVED' }),
    },
  };

  return Test.createTestingModule({
    providers: [
      TransferService,
      { provide: TransferRepository, useValue: transferRepository },
      TransferPolicy,
      TransferValidator,
      TransferMapper,
      { provide: AccountService, useValue: accountService },
      { provide: TransactionService, useValue: transactionService },
      { provide: PrismaService, useValue: prisma },
      { provide: EventEmitter2, useValue: { emit: jest.fn() } },
    ],
  }).compile();
}

const INTERNAL_DTO = {
  type: TransferType.INTERNAL,
  sourceAccountId: '11111111-1111-1111-1111-111111111111',
  destinationAccountId: '22222222-2222-2222-2222-222222222222',
  amount: '10.00',
  currency: 'USD',
};

describe('TransferService', () => {
  it('creates an immediate internal transfer for a KYC-approved customer', async () => {
    const module = await buildModule({ kycStatus: 'APPROVED' });
    const transactionService = module.get(TransactionService) as unknown as {
      createTransaction: jest.Mock;
    };

    const result = await module
      .get(TransferService)
      .createTransfer({ id: 'user-1' } as never, INTERNAL_DTO as never);

    expect(result.status).toBe('COMPLETED');
    expect(transactionService.createTransaction).toHaveBeenCalledTimes(1);
  });

  it('blocks a transfer when the customer KYC is not approved', async () => {
    const module = await buildModule({ kycStatus: 'PENDING' });
    const transactionService = module.get(TransactionService) as unknown as {
      createTransaction: jest.Mock;
    };

    await expect(
      module.get(TransferService).createTransfer({ id: 'user-1' } as never, INTERNAL_DTO as never),
    ).rejects.toBeInstanceOf(TransferPolicyViolationException);
    // No money movement was attempted.
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
  });

  it('parks a restricted-account transfer as pending without debiting (support message)', async () => {
    const module = await buildModule({ kycStatus: 'APPROVED', account: { status: 'RESTRICTED' } });
    const transactionService = module.get(TransactionService) as unknown as {
      createTransaction: jest.Mock;
    };

    const result = await module
      .get(TransferService)
      .createTransfer({ id: 'user-1' } as never, INTERNAL_DTO as never);

    // Accepted but NOT settled: pending, with the neutral support message.
    expect(result.status).toBe('PENDING_APPROVAL');
    expect(result.statusMessage).toBe(
      'Transfer pending. Please contact customer support to complete this transaction.',
    );
    // The internal restriction reason is never disclosed to the customer.
    expect(JSON.stringify(result)).not.toMatch(/restricted/i);
    // No money moved: no transaction was created, so no balance was debited.
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
  });

  it('parks a frozen-account transfer as pending without debiting', async () => {
    const module = await buildModule({ kycStatus: 'APPROVED', account: { status: 'FROZEN' } });
    const transactionService = module.get(TransactionService) as unknown as {
      createTransaction: jest.Mock;
    };

    const result = await module
      .get(TransferService)
      .createTransfer({ id: 'user-1' } as never, INTERNAL_DTO as never);

    expect(result.status).toBe('PENDING_APPROVAL');
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
  });

  it('parks a locked-account transfer as pending without debiting', async () => {
    const module = await buildModule({ kycStatus: 'APPROVED', account: { status: 'LOCKED' } });
    const transactionService = module.get(TransactionService) as unknown as {
      createTransaction: jest.Mock;
    };

    const result = await module
      .get(TransferService)
      .createTransfer({ id: 'user-1' } as never, INTERNAL_DTO as never);

    expect(result.status).toBe('PENDING_APPROVAL');
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
  });

  it('rejects a transfer that exceeds the available balance', async () => {
    const module = await buildModule({ kycStatus: 'APPROVED', account: { availableBalance: '5.00' } });
    const transactionService = module.get(TransactionService) as unknown as {
      createTransaction: jest.Mock;
    };

    await expect(
      module.get(TransferService).createTransfer({ id: 'user-1' } as never, INTERNAL_DTO as never),
    ).rejects.toBeInstanceOf(TransferPolicyViolationException);
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
  });

  it('rejects a transfer when the caller does not own the source account', async () => {
    const module = await buildModule({ kycStatus: 'APPROVED', isHolder: false });
    await expect(
      module.get(TransferService).createTransfer({ id: 'user-1' } as never, INTERNAL_DTO as never),
    ).rejects.toBeInstanceOf(TransferPolicyViolationException);
  });

  const EXTERNAL_DTO = {
    type: TransferType.ACH_CREDIT,
    sourceAccountId: '11111111-1111-1111-1111-111111111111',
    amount: '25.00',
    currency: 'USD',
    beneficiaryName: 'Jane Roe',
    bankName: 'First National Bank',
    routingNumber: '123456789',
    destinationAccountNumber: '12345678',
    destinationAccountType: 'CHECKING',
  };

  it('completes a valid external transfer with inline destination and settles via the ledger', async () => {
    const module = await buildModule({ kycStatus: 'APPROVED' });
    const transactionService = module.get(TransactionService) as unknown as { createTransaction: jest.Mock };

    const result = await module
      .get(TransferService)
      .createTransfer({ id: 'user-1' } as never, EXTERNAL_DTO as never);

    // The inline external destination satisfies the policy — no false
    // "requires a destination account or beneficiary" violation — and the
    // transfer settles through the existing transaction/ledger engine.
    expect(result.status).toBe('COMPLETED');
    expect(transactionService.createTransaction).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['fewer than 9 digits', '12345678'],
    ['more than 9 digits', '1234567890'],
    ['letters', '12345678A'],
  ])('rejects an external transfer whose routing number has %s', async (_label, routingNumber) => {
    const module = await buildModule({ kycStatus: 'APPROVED' });
    const transactionService = module.get(TransactionService) as unknown as { createTransaction: jest.Mock };

    await expect(
      module
        .get(TransferService)
        .createTransfer({ id: 'user-1' } as never, { ...EXTERNAL_DTO, routingNumber } as never),
    ).rejects.toBeInstanceOf(TransferValidationException);
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
  });

  it.each([
    ['fewer than 4 digits', '123'],
    ['more than 17 digits', '123456789012345678'],
    ['letters', '1234ABCD'],
  ])('rejects an external transfer whose account number has %s', async (_label, destinationAccountNumber) => {
    const module = await buildModule({ kycStatus: 'APPROVED' });
    const transactionService = module.get(TransactionService) as unknown as { createTransaction: jest.Mock };

    await expect(
      module
        .get(TransferService)
        .createTransfer({ id: 'user-1' } as never, { ...EXTERNAL_DTO, destinationAccountNumber } as never),
    ).rejects.toBeInstanceOf(TransferValidationException);
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
  });

  it('accepts an external account number at the 17-digit upper bound', async () => {
    const module = await buildModule({ kycStatus: 'APPROVED' });
    const result = await module
      .get(TransferService)
      .createTransfer({ id: 'user-1' } as never, {
        ...EXTERNAL_DTO,
        destinationAccountNumber: '12345678901234567',
      } as never);
    expect(result.status).toBe('COMPLETED');
  });

  it('parks a restricted-account external transfer as pending without debiting', async () => {
    const module = await buildModule({ kycStatus: 'APPROVED', account: { status: 'RESTRICTED' } });
    const transactionService = module.get(TransactionService) as unknown as { createTransaction: jest.Mock };

    const result = await module
      .get(TransferService)
      .createTransfer({ id: 'user-1' } as never, EXTERNAL_DTO as never);

    expect(result.status).toBe('PENDING_APPROVAL');
    expect(result.statusMessage).toBe(
      'Transfer pending. Please contact customer support to complete this transaction.',
    );
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
  });
});

import { TransferPolicy } from '../transfer.policy';
import { TransferStatus } from '../../enums/transfer-status.enum';
import { TransferType } from '../../enums/transfer-type.enum';
import { TransferValidator } from '../../validators/transfer.validator';

describe('TransferPolicy', () => {
  const policy = new TransferPolicy(new TransferValidator());

  it('allows a valid internal transfer', () => {
    const result = policy.authorize({
      transferType: TransferType.INTERNAL,
      sourceAccountId: 'source',
      destinationAccountId: 'dest',
      amount: '10.00',
      currency: 'USD',
      availableBalance: '20.00',
    });
    expect(result.allowed).toBe(true);
  });

  it('rejects missing destination for internal transfer', () => {
    const result = policy.authorize({
      transferType: TransferType.INTERNAL,
      sourceAccountId: 'source',
      amount: '10.00',
      currency: 'USD',
    });
    expect(result.allowed).toBe(false);
  });

  it('limits cancellation to active workflows', () => {
    expect(policy.canCancel(TransferStatus.COMPLETED)).toBe(false);
  });
});

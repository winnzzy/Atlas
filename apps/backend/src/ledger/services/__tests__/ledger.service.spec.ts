import { randomUUID } from 'crypto';
import { LedgerService } from '../ledger.service';
import { EntrySide, PostingType } from '../../dto/post-journal.dto';

/**
 * Regression guard for the production settlement failure:
 *
 *   "Ledger posting failed: Money amount cannot be negative"
 *
 * Every settlement journal has a credit leg (e.g. SYSTEM_CLEARING for an ACH
 * withdrawal, or the source account for an internal transfer). The in-memory
 * ledger tracks a signed running balance (debits − credits), so a freshly-seen
 * credited account legitimately goes negative. The Money value object forbids
 * negative amounts through its default constructor, so the balance arithmetic
 * MUST use signed money — otherwise postJournal throws and the whole transaction
 * (and its transfer) fails with no funds moved.
 */
describe('LedgerService.postJournal — signed running balances', () => {
  function buildService(): LedgerService {
    return new LedgerService({ emit: () => undefined } as never);
  }

  const CUSTOMER = randomUUID();
  const CLEARING = randomUUID();

  it('posts a journal whose credit leg drives a fresh account negative (no "Money amount cannot be negative")', async () => {
    const ledger = buildService();

    const journal = await ledger.postJournal({
      type: PostingType.ACH,
      entryDate: new Date().toISOString(),
      currency: 'USD',
      description: 'ACH withdrawal',
      idempotencyKey: `txn-${randomUUID()}`,
      lines: [
        { accountId: CUSTOMER, side: EntrySide.DEBIT, amount: '1000000', currency: 'USD' },
        { accountId: CLEARING, side: EntrySide.CREDIT, amount: '1000000', currency: 'USD' },
      ],
    });

    expect(journal).toBeDefined();

    // The credited clearing account is legitimately net-negative and must be stored
    // as a signed balance rather than throwing.
    const clearingBalance = await ledger.getBalance({ accountId: CLEARING, currency: 'USD' });
    expect(clearingBalance.currentBalance).toBe('-10000.00');

    const customerBalance = await ledger.getBalance({ accountId: CUSTOMER, currency: 'USD' });
    expect(customerBalance.currentBalance).toBe('10000.00');
  });

  it('repeats a credit posting so the balance goes further negative without throwing', async () => {
    const ledger = buildService();
    const post = () =>
      ledger.postJournal({
        type: PostingType.ACH,
        entryDate: new Date().toISOString(),
        currency: 'USD',
        idempotencyKey: `txn-${randomUUID()}`,
        lines: [
          { accountId: CUSTOMER, side: EntrySide.DEBIT, amount: '500000', currency: 'USD' },
          { accountId: CLEARING, side: EntrySide.CREDIT, amount: '500000', currency: 'USD' },
        ],
      });

    await expect(post()).resolves.toBeDefined();
    await expect(post()).resolves.toBeDefined();

    const clearingBalance = await ledger.getBalance({ accountId: CLEARING, currency: 'USD' });
    expect(clearingBalance.currentBalance).toBe('-10000.00');
  });
});

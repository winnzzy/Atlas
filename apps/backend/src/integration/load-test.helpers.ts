import { Journal, JournalEntry, LedgerAccountId, Money, PostingType } from '@atlas/domain';

export function buildLedgerPostingJournals(count: number): Journal[] {
  const journals: Journal[] = [];
  for (let index = 0; index < count; index += 1) {
    const accountA = LedgerAccountId.from(`acct-${index}-a`);
    const accountB = LedgerAccountId.from(`acct-${index}-b`);
    journals.push(
      Journal.create({
        description: `Load test journal ${index}`,
        postingType: PostingType.TRANSFER,
        entries: [
          JournalEntry.debit(accountA, Money.fromMinorUnits(10000n, 'USD')),
          JournalEntry.credit(accountB, Money.fromMinorUnits(10000n, 'USD')),
        ],
      }),
    );
  }
  return journals;
}

export function buildConcurrentDepositRequests(count: number): Array<{ accountId: string; amount: string; currency: string }> {
  return Array.from({ length: count }, (_, index) => ({
    accountId: `acct-deposit-${index}`,
    amount: '10000',
    currency: 'USD',
  }));
}

export function buildConcurrentWithdrawalRequests(count: number): Array<{ accountId: string; amount: string; currency: string }> {
  return Array.from({ length: count }, (_, index) => ({
    accountId: `acct-withdraw-${index}`,
    amount: '5000',
    currency: 'USD',
  }));
}

export function buildReconciliationBatchSize(count: number): Array<{ accountId: string; expectedBalance: string }> {
  return Array.from({ length: count }, (_, index) => ({
    accountId: `acct-recon-${index}`,
    expectedBalance: '0',
  }));
}
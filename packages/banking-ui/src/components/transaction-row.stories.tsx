import type { Meta, StoryObj } from '@storybook/react';
import { TransactionRow, TransactionList } from './transaction-row';
import type { Transaction } from '../types/banking.types';

const meta: Meta<typeof TransactionRow> = {
  title: 'Banking/TransactionRow',
  component: TransactionRow,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TransactionRow>;

const mockDebit: Transaction = {
  id: 'txn-001',
  description: 'Coffee at Starbucks',
  direction: 'debit',
  money: { amount: 5.75, currency: 'USD' },
  status: 'completed',
  category: 'food',
  date: '2024-01-15T10:30:00Z',
  merchantName: 'Starbucks',
};

const mockCredit: Transaction = {
  id: 'txn-002',
  description: 'Salary deposit',
  direction: 'credit',
  money: { amount: 4500.0, currency: 'USD' },
  status: 'completed',
  category: 'income',
  date: '2024-01-14T09:00:00Z',
};

const mockPending: Transaction = {
  id: 'txn-003',
  description: 'Wire transfer to Savings',
  direction: 'debit',
  money: { amount: 1000.0, currency: 'USD' },
  status: 'pending',
  category: 'transfer',
  date: '2024-01-15T14:00:00Z',
};

export const Debit: Story = {
  args: { transaction: mockDebit },
};

export const Credit: Story = {
  args: { transaction: mockCredit },
};

export const Pending: Story = {
  args: { transaction: mockPending },
};

export const List: Story = {
  render: () => (
    <div className="w-full max-w-lg">
      <TransactionList transactions={[mockCredit, mockDebit, mockPending]} />
    </div>
  ),
};

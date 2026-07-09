import type { Meta, StoryObj } from '@storybook/react';
import { AccountCard, AccountSelector } from './account-card';
import type { BankAccount } from '../types/banking.types';

const meta: Meta<typeof AccountCard> = {
  title: 'Banking/AccountCard',
  component: AccountCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AccountCard>;

const checking: BankAccount = {
  id: 'acc-001',
  name: 'Primary Checking',
  type: 'checking',
  status: 'active',
  balance: { amount: 12450.5, currency: 'USD' },
  availableBalance: { amount: 12200.5, currency: 'USD' },
  accountNumber: '1234567890',
  routingNumber: '021000021',
  currency: 'USD',
};

const savings: BankAccount = {
  id: 'acc-002',
  name: 'High Yield Savings',
  type: 'savings',
  status: 'active',
  balance: { amount: 89432.15, currency: 'USD' },
  availableBalance: { amount: 89432.15, currency: 'USD' },
  accountNumber: '0987654321',
  currency: 'USD',
};

export const Default: Story = {
  args: { account: checking },
};

export const Selected: Story = {
  args: { account: checking, selected: true },
};

export const Selector: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <AccountSelector accounts={[checking, savings]} selectedId="acc-001" onSelect={() => {}} />
    </div>
  ),
};

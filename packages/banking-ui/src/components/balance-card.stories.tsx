import type { Meta, StoryObj } from '@storybook/react';
import { BalanceCard } from './balance-card';
import { Wallet, PiggyBank, CreditCard } from 'lucide-react';

const meta: Meta<typeof BalanceCard> = {
  title: 'Banking/BalanceCard',
  component: BalanceCard,
  tags: ['autodocs'],
  argTypes: {
    trend: { control: 'select', options: ['up', 'down', 'flat'] },
  },
};

export default meta;
type Story = StoryObj<typeof BalanceCard>;

export const Default: Story = {
  args: {
    title: 'Total Balance',
    balance: { amount: 45231.89, currency: 'USD' },
    trend: 'up',
    trendValue: '+12.5%',
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Available Balance',
    balance: { amount: 12500.0, currency: 'USD' },
    icon: <Wallet className="h-5 w-5" />,
  },
};

export const DownTrend: Story = {
  args: {
    title: 'Savings Account',
    balance: { amount: 89432.15, currency: 'USD' },
    trend: 'down',
    trendValue: '-$2,400',
    icon: <PiggyBank className="h-5 w-5" />,
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'Credit Card',
    balance: { amount: 3200.0, currency: 'USD' },
    subtitle: 'Payment due in 5 days',
    icon: <CreditCard className="h-5 w-5" />,
    trend: 'flat',
    trendValue: 'No change',
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import { AmountDisplay, CryptoAmountDisplay } from './amount-display';

const meta: Meta<typeof AmountDisplay> = {
  title: 'Banking/AmountDisplay',
  component: AmountDisplay,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    showSign: { control: 'boolean' },
    colorize: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof AmountDisplay>;

export const Default: Story = {
  args: {
    money: { amount: 12345.67, currency: 'USD' },
  },
};

export const WithSign: Story = {
  args: {
    money: { amount: -250.0, currency: 'USD' },
    showSign: true,
    colorize: true,
  },
};

export const Large: Story = {
  args: {
    money: { amount: 1250000.0, currency: 'USD' },
    size: 'xl',
  },
};

export const Euro: Story = {
  args: {
    money: { amount: 8900.5, currency: 'EUR' },
  },
};

export const Crypto: Story = {
  render: () => (
    <CryptoAmountDisplay
      amount={0.5432}
      symbol="BTC"
      usdValue={{ amount: 32650.25, currency: 'USD' }}
      size="lg"
    />
  ),
};

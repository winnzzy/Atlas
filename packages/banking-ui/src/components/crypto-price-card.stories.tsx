import type { Meta, StoryObj } from '@storybook/react';
import { CryptoPriceCard, CryptoAssetList } from './crypto-price-card';
import type { CryptoAsset } from '../types/banking.types';

const meta: Meta<typeof CryptoPriceCard> = {
  title: 'Banking/CryptoPriceCard',
  component: CryptoPriceCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CryptoPriceCard>;

const btc: CryptoAsset = {
  symbol: 'BTC',
  name: 'Bitcoin',
  balance: { amount: 0.5, symbol: 'BTC', usdValue: 21500 },
  price: { amount: 43000, currency: 'USD' },
  priceChange24h: 1200,
  priceChangePercent24h: 2.87,
};

const eth: CryptoAsset = {
  symbol: 'ETH',
  name: 'Ethereum',
  balance: { amount: 4.2, symbol: 'ETH', usdValue: 10080 },
  price: { amount: 2400, currency: 'USD' },
  priceChange24h: -85,
  priceChangePercent24h: -3.42,
};

export const Default: Story = {
  args: { asset: btc },
};

export const NegativeChange: Story = {
  args: { asset: eth },
};

export const List: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <CryptoAssetList assets={[btc, eth]} />
    </div>
  ),
};

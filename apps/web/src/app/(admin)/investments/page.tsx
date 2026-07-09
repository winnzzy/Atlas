'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@atlas/ui';
import { StatCard } from '@atlas/banking-ui';
import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Users } from 'lucide-react';

const mockInvestments = [
  {
    id: '1',
    asset: 'S&P 500 ETF',
    ticker: 'VOO',
    type: 'etf',
    totalHeld: 125000,
    totalValueUsd: 56250000,
    holders: 3420,
    change24h: 1.2,
  },
  {
    id: '2',
    asset: 'NASDAQ 100',
    ticker: 'QQQ',
    type: 'etf',
    totalHeld: 89000,
    totalValueUsd: 42720000,
    holders: 2180,
    change24h: 1.8,
  },
  {
    id: '3',
    asset: 'US Treasury Bond',
    ticker: 'TLT',
    type: 'bond',
    totalHeld: 200000,
    totalValueUsd: 18400000,
    holders: 1560,
    change24h: -0.3,
  },
  {
    id: '4',
    asset: 'Apple Inc',
    ticker: 'AAPL',
    type: 'stock',
    totalHeld: 45000,
    totalValueUsd: 8505000,
    holders: 4210,
    change24h: 2.1,
  },
  {
    id: '5',
    asset: 'Microsoft',
    ticker: 'MSFT',
    type: 'stock',
    totalHeld: 32000,
    totalValueUsd: 13440000,
    holders: 3890,
    change24h: 0.9,
  },
  {
    id: '6',
    asset: 'Vanguard Bond',
    ticker: 'BND',
    type: 'bond',
    totalHeld: 180000,
    totalValueUsd: 13860000,
    holders: 980,
    change24h: 0.1,
  },
];

const typeColor: Record<string, string> = {
  etf: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  stock: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  bond: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function InvestmentsPage() {
  const totalAum = mockInvestments.reduce((sum, i) => sum + i.totalValueUsd, 0);
  const totalHolders = mockInvestments.reduce((sum, i) => sum + i.holders, 0);
  const etfs = mockInvestments.filter((i) => i.type === 'etf').length;
  const stocks = mockInvestments.filter((i) => i.type === 'stock').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Investment Management
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Monitor investment products and holdings
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total AUM"
          value={`$${(totalAum / 1_000_000).toFixed(1)}M`}
          trend="up"
          trendValue="12.4%"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Total Investors"
          value={totalHolders.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard title="ETFs" value={etfs.toString()} icon={<PieChart className="h-5 w-5" />} />
        <StatCard
          title="Stocks"
          value={stocks.toString()}
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investment Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Asset
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Ticker
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Type
                  </th>
                  <th className="pb-3 text-right font-medium text-[var(--color-text-secondary)]">
                    24h Change
                  </th>
                  <th className="pb-3 text-right font-medium text-[var(--color-text-secondary)]">
                    Total Value
                  </th>
                  <th className="pb-3 text-right font-medium text-[var(--color-text-secondary)]">
                    Holders
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockInvestments.map((inv) => (
                  <tr key={inv.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="py-3 font-medium text-[var(--color-text-primary)]">
                      {inv.asset}
                    </td>
                    <td className="py-3">
                      <Badge variant="outline">{inv.ticker}</Badge>
                    </td>
                    <td className="py-3">
                      <Badge className={typeColor[inv.type]}>{inv.type}</Badge>
                    </td>
                    <td
                      className={`py-3 text-right font-medium ${inv.change24h >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {inv.change24h >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {inv.change24h >= 0 ? '+' : ''}
                        {inv.change24h}%
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium text-[var(--color-text-primary)]">
                      ${(inv.totalValueUsd / 1_000_000).toFixed(1)}M
                    </td>
                    <td className="py-3 text-right text-[var(--color-text-primary)]">
                      {inv.holders.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

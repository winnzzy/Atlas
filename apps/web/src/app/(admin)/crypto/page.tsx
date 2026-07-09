'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@atlas/ui';
import { StatCard } from '@atlas/banking-ui';
import { Bitcoin, TrendingUp, TrendingDown, Users, ArrowDownUp } from 'lucide-react';
import { mockCryptoAssets } from '@/features/admin/fixtures';

export default function CryptoPage() {
  const totalAum = mockCryptoAssets.reduce((sum, a) => sum + a.totalValueUsd, 0);
  const totalHolders = mockCryptoAssets.reduce((sum, a) => sum + a.holders, 0);
  const pendingOps = mockCryptoAssets.reduce(
    (sum, a) => sum + a.pendingDeposits + a.pendingWithdrawals,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Crypto Operations
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Monitor cryptocurrency assets and operations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total AUM"
          value={`$${(totalAum / 1_000_000).toFixed(1)}M`}
          trend="up"
          trendValue="18.5%"
          icon={<Bitcoin className="h-5 w-5" />}
        />
        <StatCard
          title="Total Holders"
          value={totalHolders.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Assets"
          value={mockCryptoAssets.length.toString()}
          icon={<Bitcoin className="h-5 w-5" />}
        />
        <StatCard
          title="Pending Operations"
          value={pendingOps.toString()}
          icon={<ArrowDownUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockCryptoAssets.map((asset) => {
          const isPositive = asset.change24h >= 0;
          return (
            <Card key={asset.symbol}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] text-sm font-bold">
                      {asset.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)]">{asset.name}</p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {asset.symbol} · {asset.network}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {isPositive ? '+' : ''}
                    {asset.change24h}%
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--color-text-tertiary)]">Price</p>
                    <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                      ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-tertiary)]">Total Value</p>
                    <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                      ${(asset.totalValueUsd / 1_000_000).toFixed(2)}M
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[var(--color-text-tertiary)]">Held:</span>{' '}
                    <span className="text-[var(--color-text-primary)]">
                      {asset.totalHeld.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-tertiary)]">Holders:</span>{' '}
                    <span className="text-[var(--color-text-primary)]">{asset.holders}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-tertiary)]">Pending:</span>{' '}
                    <span className="text-[var(--color-text-primary)]">
                      {asset.pendingDeposits + asset.pendingWithdrawals}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Operations</CardTitle>
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
                    Network
                  </th>
                  <th className="pb-3 text-right font-medium text-[var(--color-text-secondary)]">
                    Pending Deposits
                  </th>
                  <th className="pb-3 text-right font-medium text-[var(--color-text-secondary)]">
                    Pending Withdrawals
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockCryptoAssets.map((a) => (
                  <tr
                    key={a.symbol}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="py-3 font-medium text-[var(--color-text-primary)]">
                      {a.name} ({a.symbol})
                    </td>
                    <td className="py-3">
                      <Badge variant="outline">{a.network}</Badge>
                    </td>
                    <td className="py-3 text-right text-[var(--color-text-primary)]">
                      {a.pendingDeposits}
                    </td>
                    <td className="py-3 text-right text-[var(--color-text-primary)]">
                      {a.pendingWithdrawals}
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

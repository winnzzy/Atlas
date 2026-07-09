'use client';

import { cn } from '../lib/cn';
import { formatMoney, formatCrypto, formatPercent } from '../utils/format';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { CryptoAsset } from '../types/banking.types';

interface CryptoPriceCardProps {
  readonly asset: CryptoAsset;
  readonly onClick?: (asset: CryptoAsset) => void;
  readonly className?: string;
}

export function CryptoPriceCard({ asset, onClick, className }: CryptoPriceCardProps) {
  const isPositive = asset.priceChangePercent24h >= 0;

  return (
    <button
      type="button"
      onClick={() => onClick?.(asset)}
      className={cn(
        'flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
        {asset.symbol.slice(0, 2)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{asset.name}</p>
        <p className="text-xs text-muted-foreground">{asset.symbol}</p>
      </div>

      <div className="text-right">
        <p className="text-sm font-medium tabular-nums text-foreground">
          {formatMoney(asset.price)}
        </p>
        <div className="flex items-center justify-end gap-1">
          {isPositive ? (
            <ArrowUpRight className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-red-600 dark:text-red-400" />
          )}
          <span
            className={cn(
              'text-xs font-medium tabular-nums',
              isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400',
            )}
          >
            {formatPercent(asset.priceChangePercent24h)}
          </span>
        </div>
      </div>

      <div className="text-right">
        <p className="text-sm tabular-nums text-foreground">
          {formatCrypto(asset.balance.amount, asset.symbol)}
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">
          ≈ {formatMoney({ amount: asset.balance.usdValue, currency: 'USD' })}
        </p>
      </div>
    </button>
  );
}

interface CryptoAssetListProps {
  readonly assets: CryptoAsset[];
  readonly onAssetClick?: (asset: CryptoAsset) => void;
  readonly className?: string;
}

export function CryptoAssetList({ assets, onAssetClick, className }: CryptoAssetListProps) {
  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">No crypto assets</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {assets.map((asset) => (
        <CryptoPriceCard key={asset.symbol} asset={asset} onClick={onAssetClick} />
      ))}
    </div>
  );
}

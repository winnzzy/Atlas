'use client';

import { useEffect, useMemo, useState } from 'react';
import { LineChart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { loadDashboardData, type DashboardPortfolioItem } from '@/lib/api-data';
import { formatCurrency } from '@/lib/utils';

export default function InvestmentsPage() {
  const [portfolio, setPortfolio] = useState<DashboardPortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadDashboardData()
      .then(({ portfolio }) => setPortfolio(portfolio))
      .finally(() => setLoading(false));
  }, []);

  const total = useMemo(() => portfolio.reduce((sum, item) => sum + item.value, 0), [portfolio]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Wealth"
        title="Investments"
        description="A consolidated view of your holdings and their current value."
        actions={
          portfolio.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total value</p>
              <p className="text-lg font-semibold tabular-nums text-slate-900">{formatCurrency(total)}</p>
            </div>
          ) : null
        }
      />

      {loading ? (
        <Card variant="elevated">
          <CardContent>
            <p className="py-8 text-center text-sm text-slate-500">Loading portfolio…</p>
          </CardContent>
        </Card>
      ) : portfolio.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="rounded-2xl bg-[#f4f8fc] p-3 text-[#0b345a]">
              <LineChart className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-slate-900">No investments yet.</p>
            <p className="max-w-sm text-sm text-slate-600">
              When holdings are added to your portfolio, they&apos;ll appear here with their
              allocation and value.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {portfolio.map((item) => (
            <Card key={item.name} variant="elevated" className="atlas-lift">
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <span className="rounded-full bg-[#f0f5fb] px-2.5 py-1 text-xs font-semibold text-[#0b345a]">
                    {item.weight}
                  </span>
                </div>
                <p className="mt-6 text-xs uppercase tracking-[0.2em] text-slate-500">Value</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                  {formatCurrency(item.value)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

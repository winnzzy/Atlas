'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { loadDashboardData, type DashboardPortfolioItem } from '@/lib/api-data';

export default function InvestmentsPage() {
  const [portfolio, setPortfolio] = useState<DashboardPortfolioItem[]>([]);

  useEffect(() => {
    void loadDashboardData().then(({ portfolio }) => setPortfolio(portfolio));
  }, []);

  return (
    <DashboardLayout>
      <div className="grid gap-6 md:grid-cols-2">
        {portfolio.map((item) => (
          <Card key={item.name}>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Allocation</p>
              <p className="text-2xl font-semibold text-slate-900">{item.weight}</p>
              <p className="mt-3 text-lg font-semibold text-slate-900">
                ${item.value.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

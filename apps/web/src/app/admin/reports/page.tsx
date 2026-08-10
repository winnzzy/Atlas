'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDemoState } from '@/lib/demo-store';

export default function AdminReportsPage() {
  const [state] = useState(getDemoState());

  return (
    <DashboardLayout>
      <div className="grid gap-6 md:grid-cols-2">
        {state.adminReports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle>{report.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="success">{report.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}

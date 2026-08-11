'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { AdminState, useAdminResource } from '@/components/admin/admin-panel';
import { formatCurrency, loadAdminTransfers } from '@/lib/admin-data';

function statusVariant(status: string) {
  if (status === 'COMPLETED') return 'success' as const;
  if (status === 'FAILED' || status === 'CANCELLED' || status === 'REJECTED') return 'danger' as const;
  return 'warning' as const;
}

export default function AdminTransfersPage() {
  const { data, loading, error } = useAdminResource(loadAdminTransfers);
  const transfers = data ?? [];

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>Transfer operations</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminState
            loading={loading}
            error={error}
            empty={transfers.length === 0}
            emptyMessage="No transfers yet."
          >
            <Table>
              <Thead>
                <Tr>
                  <Th>Reference</Th>
                  <Th>Counterparty</Th>
                  <Th>Type</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {transfers.map((transfer) => (
                  <Tr key={transfer.id}>
                    <Td>{transfer.reference}</Td>
                    <Td>{transfer.counterparty}</Td>
                    <Td>{transfer.type}</Td>
                    <Td>{formatCurrency(transfer.amount)}</Td>
                    <Td>
                      <Badge variant={statusVariant(transfer.status)}>{transfer.status}</Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </AdminState>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

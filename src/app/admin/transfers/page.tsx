'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { getDemoState } from '@/lib/demo-store';

export default function AdminTransfersPage() {
  const [state, setState] = useState(getDemoState());

  const updateStatus = (transferId: string, nextStatus: string) => {
    setState((current) => ({
      ...current,
      adminTransfers: current.adminTransfers.map((transfer) =>
        transfer.id === transferId ? { ...transfer, status: nextStatus } : transfer,
      ),
    }));
  };

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>Transfer operations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <Thead>
              <Tr>
                <Th>Reference</Th>
                <Th>Customer</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {state.adminTransfers.map((transfer) => (
                <Tr key={transfer.id}>
                  <Td>{transfer.reference}</Td>
                  <Td>{transfer.customer}</Td>
                  <Td>${transfer.amount.toLocaleString()}</Td>
                  <Td>
                    <Badge variant={transfer.status === 'Pending' ? 'warning' : 'success'}>
                      {transfer.status}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => updateStatus(transfer.id, 'Approved')}
                      >
                        Approve
                      </Button>
                      <Button variant="ghost" onClick={() => updateStatus(transfer.id, 'Rejected')}>
                        Reject
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

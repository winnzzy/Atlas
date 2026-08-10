'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { getDemoState } from '@/lib/demo-store';

export default function AdminAuditPage() {
  const [state] = useState(getDemoState());

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>Audit trail</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <Thead>
              <Tr>
                <Th>Event</Th>
                <Th>Detail</Th>
                <Th>Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {state.adminAuditEvents.map((event) => (
                <Tr key={event.id}>
                  <Td>{event.title}</Td>
                  <Td>{event.detail}</Td>
                  <Td>{event.date}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

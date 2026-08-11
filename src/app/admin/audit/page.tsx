'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { AdminState, useAdminResource } from '@/components/admin/admin-panel';
import { loadAdminAudit } from '@/lib/admin-data';

function severityVariant(severity: string) {
  if (severity === 'CRITICAL') return 'danger' as const;
  if (severity === 'WARNING') return 'warning' as const;
  return 'default' as const;
}

function formatDate(value: string) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export default function AdminAuditPage() {
  const { data, loading, error } = useAdminResource(loadAdminAudit);
  const events = data ?? [];

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>Audit trail</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminState
            loading={loading}
            error={error}
            empty={events.length === 0}
            emptyMessage="No audit events recorded yet."
          >
            <Table>
              <Thead>
                <Tr>
                  <Th>Action</Th>
                  <Th>Resource</Th>
                  <Th>Detail</Th>
                  <Th>Severity</Th>
                  <Th>Date</Th>
                </Tr>
              </Thead>
              <Tbody>
                {events.map((event) => (
                  <Tr key={event.id}>
                    <Td>{event.action}</Td>
                    <Td>{event.resourceType}</Td>
                    <Td>{event.description}</Td>
                    <Td>
                      <Badge variant={severityVariant(event.severity)}>{event.severity}</Badge>
                    </Td>
                    <Td>{formatDate(event.createdAt)}</Td>
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

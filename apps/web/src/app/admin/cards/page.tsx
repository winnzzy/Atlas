'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { getDemoState } from '@/lib/demo-store';

export default function AdminCardsPage() {
  const [state, setState] = useState(getDemoState());

  const updateStatus = (cardId: string, nextStatus: string) => {
    setState((current) => ({
      ...current,
      adminCards: current.adminCards.map((card) =>
        card.id === cardId ? { ...card, status: nextStatus } : card,
      ),
    }));
  };

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>Card operations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <Thead>
              <Tr>
                <Th>Card</Th>
                <Th>Customer</Th>
                <Th>Masked number</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {state.adminCards.map((card) => (
                <Tr key={card.id}>
                  <Td>{card.id}</Td>
                  <Td>{card.customer}</Td>
                  <Td>{card.maskedNumber}</Td>
                  <Td>
                    <Badge variant={card.status === 'ACTIVE' ? 'success' : 'warning'}>
                      {card.status}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => updateStatus(card.id, 'FROZEN')}>
                        Freeze
                      </Button>
                      <Button variant="ghost" onClick={() => updateStatus(card.id, 'ACTIVE')}>
                        Unfreeze
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

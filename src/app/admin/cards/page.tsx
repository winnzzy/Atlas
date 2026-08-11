'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { AdminState, useAdminResource } from '@/components/admin/admin-panel';
import { loadAdminCustomers, type AdminCustomer } from '@/lib/admin-data';
import { applyAdminCardAction, getAdminCustomerCards, type AdminCardAction } from '@/lib/api';

type AdminCardRow = {
  id: string;
  maskedNumber: string;
  type: string;
  status: string;
  cardholderName: string;
};

/** Statuses that mean the customer applied and is waiting on a decision. */
const AWAITING_REVIEW = new Set(['REQUESTED', 'PENDING_VERIFICATION']);

function toCards(rows: Record<string, unknown>[]): AdminCardRow[] {
  return rows.map((row) => ({
    id: String(row.id ?? ''),
    maskedNumber: String(row.maskedNumber ?? '••••'),
    type: String(row.type ?? '—'),
    status: String(row.status ?? 'UNKNOWN'),
    cardholderName: String(row.cardholderName ?? '—'),
  }));
}

function statusVariant(status: string) {
  if (status === 'ACTIVATED' || status === 'ISSUED') return 'success' as const;
  if (status === 'CANCELLED' || status === 'EXPIRED') return 'danger' as const;
  return 'warning' as const;
}

export default function AdminCardsPage() {
  const { data: customerData, loading: customersLoading, error: customersError } =
    useAdminResource(() => loadAdminCustomers());
  const customers: AdminCustomer[] = customerData?.customers ?? [];

  const [selectedUserId, setSelectedUserId] = useState('');
  const [cards, setCards] = useState<AdminCardRow[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedUserId && customers[0]) {
      setSelectedUserId(customers[0].id);
    }
  }, [customers, selectedUserId]);

  const loadCards = async (userId: string) => {
    if (!userId) return;
    setCardsLoading(true);
    setCardsError(null);
    try {
      const rows = await getAdminCustomerCards(userId);
      setCards(toCards(Array.isArray(rows) ? rows : []));
    } catch (cause) {
      setCardsError(cause instanceof Error ? cause.message : 'Unable to load cards');
      setCards([]);
    } finally {
      setCardsLoading(false);
    }
  };

  useEffect(() => {
    void loadCards(selectedUserId);
  }, [selectedUserId]);

  const runAction = async (cardId: string, action: AdminCardAction) => {
    setBusy(true);
    setNotice(null);
    setCardsError(null);
    try {
      await applyAdminCardAction(cardId, action);
      setNotice(`${action.action} applied successfully.`);
      await loadCards(selectedUserId);
    } catch (cause) {
      setCardsError(cause instanceof Error ? cause.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Card operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdminState
            loading={customersLoading}
            error={customersError}
            empty={customers.length === 0}
            emptyMessage="No customers yet."
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Customer</label>
              <Select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} — {customer.email}
                  </option>
                ))}
              </Select>
            </div>
          </AdminState>

          {notice ? (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
              {notice}
            </p>
          ) : null}

          <AdminState
            loading={cardsLoading}
            error={cardsError}
            empty={cards.length === 0}
            emptyMessage="This customer has not applied for a card."
          >
            <Table>
              <Thead>
                <Tr>
                  <Th>Masked number</Th>
                  <Th>Cardholder</Th>
                  <Th>Type</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {cards.map((card) => (
                  <Tr key={card.id}>
                    <Td>{card.maskedNumber}</Td>
                    <Td>{card.cardholderName}</Td>
                    <Td>{card.type}</Td>
                    <Td>
                      <Badge variant={statusVariant(card.status)}>{card.status}</Badge>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        {AWAITING_REVIEW.has(card.status) ? (
                          <>
                            <Button
                              variant="secondary"
                              disabled={busy}
                              onClick={() => void runAction(card.id, { action: 'APPROVE' })}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              disabled={busy}
                              onClick={() =>
                                void runAction(card.id, {
                                  action: 'REJECT',
                                  reason: 'Application rejected by admin',
                                })
                              }
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="secondary"
                              disabled={busy}
                              onClick={() =>
                                void runAction(card.id, {
                                  action: 'FREEZE',
                                  reason: 'Frozen from admin console',
                                })
                              }
                            >
                              Freeze
                            </Button>
                            <Button
                              variant="ghost"
                              disabled={busy}
                              onClick={() => void runAction(card.id, { action: 'UNFREEZE' })}
                            >
                              Unfreeze
                            </Button>
                          </>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </AdminState>
        </CardContent>
      </Card>
    </>
  );
}

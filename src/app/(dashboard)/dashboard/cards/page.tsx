'use client';

import { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { loadDashboardData, type DashboardAccount, type DashboardCard } from '@/lib/api-data';
import { applyForCard, freezeCard, unfreezeCard } from '@/lib/api';

const CARD_TYPES = [
  { value: 'VIRTUAL_DEBIT', label: 'Virtual debit card' },
  { value: 'PHYSICAL_DEBIT', label: 'Physical debit card' },
] as const;

/** Statuses where the application is still with the reviewer. */
const PENDING_REVIEW = new Set(['REQUESTED', 'PENDING_VERIFICATION']);
const USABLE = new Set(['ISSUED', 'ACTIVATED']);

function statusLabel(status: string) {
  if (PENDING_REVIEW.has(status)) return 'Awaiting review';
  if (status === 'ACTIVATED') return 'Active';
  if (status === 'ISSUED') return 'Issued — activate to use';
  if (status === 'FROZEN') return 'Frozen';
  if (status === 'CANCELLED') return 'Declined or cancelled';
  return status;
}

function statusVariant(status: string) {
  if (status === 'ACTIVATED' || status === 'ISSUED') return 'success' as const;
  if (status === 'CANCELLED' || status === 'EXPIRED') return 'danger' as const;
  return 'warning' as const;
}

export default function CardsPage() {
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [accounts, setAccounts] = useState<DashboardAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [accountId, setAccountId] = useState('');
  const [cardType, setCardType] = useState<string>('VIRTUAL_DEBIT');
  const [nickname, setNickname] = useState('');

  const refresh = async () => {
    const data = await loadDashboardData();
    setCards(data.cards);
    setAccounts(data.accounts);
    if (!accountId && data.accounts[0]) {
      setAccountId(data.accounts[0].id);
    }
  };

  useEffect(() => {
    void refresh()
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load cards'))
      .finally(() => setLoading(false));
  }, []);

  const submitApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await applyForCard({
        accountId,
        type: cardType,
        ...(nickname ? { nickname } : {}),
      });
      setNotice('Application submitted. An administrator will review it shortly.');
      setShowForm(false);
      setNickname('');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit application');
    } finally {
      setBusy(false);
    }
  };

  const toggleFreeze = async (card: DashboardCard) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (card.status === 'FROZEN') {
        await unfreezeCard(card.id);
      } else {
        await freezeCard(card.id, 'Frozen by cardholder');
      }
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update card');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
            {notice}
          </p>
        ) : null}

        {loading ? (
          <Card>
            <CardContent>
              <p className="py-6 text-sm text-slate-500">Loading your cards…</p>
            </CardContent>
          </Card>
        ) : cards.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Cards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-start gap-3 rounded-[24px] border border-dashed border-slate-300 bg-slate-50/60 px-5 py-8">
                <div className="rounded-2xl bg-white p-3 text-[#0f4c81] shadow-sm">
                  <CreditCard className="h-5 w-5" />
                </div>
                <p className="text-base font-semibold text-slate-900">You don&apos;t have a card yet</p>
                <p className="max-w-md text-sm text-slate-600">
                  Apply for a debit card and an administrator will review your application. You can
                  track the status here.
                </p>
                {accounts.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    You need an open account before you can apply for a card.
                  </p>
                ) : (
                  <Button onClick={() => setShowForm((value) => !value)}>
                    {showForm ? 'Cancel' : 'Apply for a debit card'}
                  </Button>
                )}
              </div>

              {showForm ? (
                <form className="grid gap-4 md:grid-cols-2" onSubmit={submitApplication}>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Account</label>
                    <Select value={accountId} onChange={(event) => setAccountId(event.target.value)} required>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Card type</label>
                    <Select value={cardType} onChange={(event) => setCardType(event.target.value)}>
                      {CARD_TYPES.map((entry) => (
                        <option key={entry.value} value={entry.value}>
                          {entry.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Nickname (optional)
                    </label>
                    <Input
                      value={nickname}
                      onChange={(event) => setNickname(event.target.value)}
                      placeholder="Everyday spending"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" disabled={busy || !accountId}>
                      {busy ? 'Submitting…' : 'Submit application'}
                    </Button>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          cards.map((card) => (
            <Card key={card.id}>
              <CardHeader>
                <CardTitle>{card.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Masked number</p>
                  <p className="text-lg font-semibold text-slate-900">{card.maskedNumber}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={statusVariant(card.status)}>{statusLabel(card.status)}</Badge>
                    {card.limit > 0 ? (
                      <Badge variant="default">Limit ${card.limit.toLocaleString()}</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  {PENDING_REVIEW.has(card.status) ? (
                    <p className="text-sm text-slate-600">
                      Your application is with an administrator for review.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-slate-500">Available</p>
                      <p className="text-lg font-semibold text-slate-900">
                        ${card.available.toLocaleString()}
                      </p>
                      {USABLE.has(card.status) || card.status === 'FROZEN' ? (
                        <Button
                          className="mt-3"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => void toggleFreeze(card)}
                        >
                          {card.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'}
                        </Button>
                      ) : null}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}

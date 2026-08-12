'use client';

import { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { AtlasCard } from '@/components/dashboard/atlas-card';
import {
  loadDashboardData,
  type DashboardAccount,
  type DashboardCard,
  type DashboardProfile,
} from '@/lib/api-data';
import { applyForCard, freezeCard, unfreezeCard } from '@/lib/api';

const CARD_TYPES = [
  { value: 'VIRTUAL_DEBIT', label: 'Virtual debit card' },
  { value: 'PHYSICAL_DEBIT', label: 'Physical debit card' },
] as const;

export default function CardsPage() {
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [accounts, setAccounts] = useState<DashboardAccount[]>([]);
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
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
    setProfile(data.profile);
    if (!accountId && data.accounts[0]) {
      setAccountId(data.accounts[0].id);
    }
  };

  /** Spendable balance for a card comes from its linked bank account. */
  const availableFor = (card: DashboardCard) => {
    const linked = accounts.find((account) => account.id === card.accountId);
    return linked?.available ?? card.available;
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
    <>
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
          <div className="grid gap-8 sm:grid-cols-2">
            {cards.map((card, index) => (
              <AtlasCard
                key={card.id}
                card={card}
                index={index}
                holderName={profile?.fullName ?? ''}
                availableBalance={availableFor(card)}
                busy={busy}
                onToggleFreeze={() => void toggleFreeze(card)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { loadDashboardData, type DashboardAccount, type DashboardTransfer } from '@/lib/api-data';
import { createTransfer, type TransferType } from '@/lib/api';

const TRANSFER_TYPES: { value: TransferType; label: string; external: boolean }[] = [
  { value: 'INTERNAL', label: 'Between my accounts', external: false },
  { value: 'ACH_CREDIT', label: 'ACH (1–3 business days)', external: true },
  { value: 'SAME_DAY_ACH', label: 'Same day ACH', external: true },
  { value: 'DOMESTIC_WIRE', label: 'Domestic wire', external: true },
];

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<DashboardTransfer[]>([]);
  const [accounts, setAccounts] = useState<DashboardAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [type, setType] = useState<TransferType>('INTERNAL');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  const isExternal = TRANSFER_TYPES.find((entry) => entry.value === type)?.external ?? false;

  const refresh = async () => {
    const data = await loadDashboardData();
    setTransfers(data.transfers);
    setAccounts(data.accounts);
    if (!sourceAccountId && data.accounts[0]) {
      setSourceAccountId(data.accounts[0].id);
    }
    return data;
  };

  useEffect(() => {
    void refresh()
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load transfers'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const created = await createTransfer({
        type,
        sourceAccountId,
        amount,
        currency: 'USD',
        ...(isExternal
          ? {
              beneficiaryName,
              routingNumber,
              bankName,
              reference: accountNumber ? `ACCT-${accountNumber.slice(-4)}` : undefined,
            }
          : { destinationAccountId }),
        ...(memo ? { memo } : {}),
        idempotencyKey: `web-${crypto.randomUUID()}`,
      });

      // Report the status the backend actually assigned. External rails are not
      // connected, so those transfers stay pending until they are settled.
      const status = String(created?.status ?? 'PENDING');
      setSuccess(
        status === 'COMPLETED'
          ? 'Transfer completed and posted to your account.'
          : `Transfer submitted. Current status: ${status.toLowerCase()}.`,
      );
      setAmount('');
      setMemo('');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create transfer</CardTitle>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 && !loading ? (
              <p className="text-sm text-slate-600">
                You need an open account before you can send a transfer.
              </p>
            ) : (
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Transfer type</label>
                  <Select value={type} onChange={(event) => setType(event.target.value as TransferType)}>
                    {TRANSFER_TYPES.map((entry) => (
                      <option key={entry.value} value={entry.value}>
                        {entry.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">From account</label>
                  <Select
                    value={sourceAccountId}
                    onChange={(event) => setSourceAccountId(event.target.value)}
                    required
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} — {formatCurrency(account.available)} available
                      </option>
                    ))}
                  </Select>
                </div>

                {isExternal ? (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Beneficiary name</label>
                      <Input
                        value={beneficiaryName}
                        onChange={(event) => setBeneficiaryName(event.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Account number</label>
                      <Input
                        value={accountNumber}
                        onChange={(event) => setAccountNumber(event.target.value)}
                        inputMode="numeric"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Routing number</label>
                      <Input
                        value={routingNumber}
                        onChange={(event) => setRoutingNumber(event.target.value)}
                        inputMode="numeric"
                        maxLength={9}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Bank name</label>
                      <Input value={bankName} onChange={(event) => setBankName(event.target.value)} />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">To account</label>
                    <Select
                      value={destinationAccountId}
                      onChange={(event) => setDestinationAccountId(event.target.value)}
                      required
                    >
                      <option value="">Select an account</option>
                      {accounts
                        .filter((account) => account.id !== sourceAccountId)
                        .map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                    </Select>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
                  <Input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Memo</label>
                  <Input value={memo} onChange={(event) => setMemo(event.target.value)} maxLength={140} />
                </div>

                <div className="md:col-span-2 space-y-3">
                  {error ? (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                      {error}
                    </p>
                  ) : null}
                  {success ? (
                    <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
                      {success}
                    </p>
                  ) : null}
                  <Button type="submit" disabled={submitting || !sourceAccountId}>
                    {submitting ? 'Submitting…' : 'Submit transfer'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-600">Loading transfers…</p>
            ) : transfers.length === 0 ? (
              <p className="text-sm text-slate-600">No transfers yet.</p>
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Reference</Th>
                    <Th>Beneficiary</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {transfers.map((transfer) => (
                    <Tr key={transfer.id}>
                      <Td>{transfer.reference}</Td>
                      <Td>{transfer.beneficiary}</Td>
                      <Td>{formatCurrency(transfer.amount)}</Td>
                      <Td>{transfer.status}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

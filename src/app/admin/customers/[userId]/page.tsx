'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import {
  applyAdminAccountRestriction,
  assignAdminAccount,
  decideAdminKyc,
  generateAdminPresentation,
  getAdminCustomerAccounts,
  getAdminCustomerDetail,
  getAdminPresentationStatus,
  releaseAdminAccountRestriction,
  updateAdminCustomer,
  type AdminCustomerDetail,
  type AdminPresentationStatus,
} from '@/lib/api';

const DEFAULT_PRESENTATION_TARGET = '4700000.00';

function formatCurrency(value: string | number | undefined): string {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '0'));
  if (!Number.isFinite(parsed)) return String(value ?? '—');
  return parsed.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

type AccountRow = Record<string, unknown>;

function kycVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  return 'warning';
}

export default function AdminCustomerDetailPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;

  const [detail, setDetail] = useState<AdminCustomerDetail | null>(null);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Editable profile form
  const [form, setForm] = useState<Record<string, string>>({});

  // Modals
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignType, setAssignType] = useState('CHECKING');
  const [restrictFor, setRestrictFor] = useState<string | null>(null);
  const [restrictReason, setRestrictReason] = useState('');

  // Presentation activity generator
  const [presAccountId, setPresAccountId] = useState('');
  const [presTarget, setPresTarget] = useState(DEFAULT_PRESENTATION_TARGET);
  const [presStatus, setPresStatus] = useState<AdminPresentationStatus | null>(null);
  const [presConfirmOpen, setPresConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, a] = await Promise.all([
        getAdminCustomerDetail(userId),
        getAdminCustomerAccounts(userId).catch(() => [] as AccountRow[]),
      ]);
      setDetail(d);
      setAccounts(Array.isArray(a) ? a : []);
      setForm({
        firstName: d.firstName ?? '',
        lastName: d.lastName ?? '',
        email: d.email ?? '',
        phoneNumber: d.phoneNumber ?? '',
        line1: d.address?.line1 ?? '',
        city: d.address?.city ?? '',
        state: d.address?.state ?? '',
        postalCode: d.address?.postalCode ?? '',
        country: d.address?.country ?? '',
        employer: d.employment?.employer ?? '',
        jobTitle: d.employment?.jobTitle ?? '',
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load customer');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Default the presentation account to the customer's first account.
  useEffect(() => {
    if (!presAccountId && accounts.length > 0) {
      setPresAccountId(String(accounts[0]?.id ?? ''));
    }
  }, [accounts, presAccountId]);

  const loadPresStatus = useCallback(
    async (accountId: string) => {
      if (!accountId) {
        setPresStatus(null);
        return;
      }
      try {
        setPresStatus(await getAdminPresentationStatus(userId, accountId));
      } catch {
        setPresStatus(null);
      }
    },
    [userId],
  );

  useEffect(() => {
    void loadPresStatus(presAccountId);
  }, [presAccountId, loadPresStatus]);

  const runGenerate = (replace: boolean) => {
    setPresConfirmOpen(false);
    void run(
      async () => {
        await generateAdminPresentation(userId, {
          accountId: presAccountId,
          targetBalance: presTarget,
          replace,
        });
        await loadPresStatus(presAccountId);
      },
      replace ? 'Presentation activity replaced.' : 'Presentation activity generated.',
    );
  };

  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(message);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = () =>
    run(
      () =>
        updateAdminCustomer(userId, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phoneNumber: form.phoneNumber,
          address: {
            line1: form.line1,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            country: form.country,
          },
          employment: { employer: form.employer, jobTitle: form.jobTitle },
        }),
      'Customer profile updated.',
    );

  if (loading) {
    return <p className="text-sm text-slate-600">Loading customer…</p>;
  }
  if (error && !detail) {
    return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  }
  if (!detail) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/customers" className="text-sm text-slate-500 hover:underline">
            ← Back to customers
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            {detail.firstName} {detail.lastName}
          </h1>
          <p className="text-sm text-slate-500">{detail.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={detail.status === 'ACTIVE' ? 'success' : 'warning'}>{detail.status}</Badge>
          <Badge variant={kycVariant(detail.kycStatus)}>KYC: {detail.kycStatus}</Badge>
        </div>
      </div>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
      {notice ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">{notice}</p> : null}

      {/* Customer information */}
      <Card>
        <CardHeader>
          <CardTitle>Customer information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                ['firstName', 'First name'],
                ['lastName', 'Last name'],
                ['email', 'Email'],
                ['phoneNumber', 'Phone'],
                ['line1', 'Address'],
                ['city', 'City'],
                ['state', 'State'],
                ['postalCode', 'Postal code'],
                ['country', 'Country'],
                ['employer', 'Employer'],
                ['jobTitle', 'Job title'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
                <Input
                  value={form[key] ?? ''}
                  onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button onClick={() => void saveProfile()} disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KYC */}
      <Card>
        <CardHeader>
          <CardTitle>KYC verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            Current status: <span className="font-medium">{detail.kycStatus}</span> · Level{' '}
            {detail.kycLevel ?? '—'}
          </p>
          <div className="flex gap-2">
            <Button
              disabled={busy || detail.kycStatus === 'APPROVED'}
              onClick={() =>
                run(() => decideAdminKyc(userId, { decision: 'APPROVE' }), 'KYC approved.')
              }
            >
              Approve KYC
            </Button>
            <Button
              variant="secondary"
              disabled={busy || detail.kycStatus === 'REJECTED'}
              onClick={() => setRejectOpen(true)}
            >
              Reject KYC
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accounts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Accounts</CardTitle>
            <Button variant="secondary" onClick={() => setAssignOpen(true)}>
              Create / assign account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-sm text-slate-600">No account yet.</p>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Account #</Th>
                  <Th>Type</Th>
                  <Th>Status</Th>
                  <Th>Available</Th>
                  <Th>Restrictions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {accounts.map((acc) => {
                  const id = String(acc.id ?? '');
                  const status = String(acc.status ?? '');
                  const restricted = status === 'RESTRICTED';
                  return (
                    <Tr key={id}>
                      <Td>••{String(acc.accountNumber ?? '').slice(-4)}</Td>
                      <Td>{String(acc.type ?? '—')}</Td>
                      <Td>
                        <Badge variant={status === 'ACTIVE' ? 'success' : 'warning'}>{status}</Badge>
                      </Td>
                      <Td>{String(acc.availableBalance ?? acc.currentBalance ?? '0')}</Td>
                      <Td>
                        {restricted ? (
                          <Button
                            variant="secondary"
                            disabled={busy}
                            onClick={() =>
                              run(
                                () => releaseAdminAccountRestriction(id),
                                'Restriction released.',
                              )
                            }
                          >
                            Release
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            disabled={busy}
                            onClick={() => {
                              setRestrictFor(id);
                              setRestrictReason('');
                            }}
                          >
                            Restrict
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Presentation activity generator */}
      <Card>
        <CardHeader>
          <CardTitle>Presentation activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Generate a realistic six-month account history for this customer. Records are written
            through the live transaction ledger, so the balance and history appear naturally across
            the customer&apos;s dashboard, accounts and transactions.
          </p>

          {accounts.length === 0 ? (
            <p className="text-sm text-slate-600">Create an account first to generate activity.</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Target account</label>
                  <Select value={presAccountId} onChange={(event) => setPresAccountId(event.target.value)}>
                    {accounts.map((acc) => {
                      const id = String(acc.id ?? '');
                      return (
                        <option key={id} value={id}>
                          ••{String(acc.accountNumber ?? '').slice(-4)} · {String(acc.type ?? '—')}
                        </option>
                      );
                    })}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Final balance</label>
                  <Input value={presTarget} onChange={(event) => setPresTarget(event.target.value)} />
                </div>
              </div>

              {presStatus ? (
                <div className="grid gap-3 rounded-md bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Current balance</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(presStatus.currentBalance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Transactions</p>
                    <p className="text-sm font-semibold text-slate-900">{presStatus.transactionCount}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Generated credits</p>
                    <p className="text-sm font-semibold text-emerald-700">
                      {formatCurrency(presStatus.presentationCredits)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Generated debits</p>
                    <p className="text-sm font-semibold text-rose-700">
                      {formatCurrency(presStatus.presentationDebits)}
                    </p>
                  </div>
                </div>
              ) : null}

              {presStatus?.presentationExists ? (
                <div className="space-y-2">
                  <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Presentation activity already exists for this account
                    {presStatus.generatedAt
                      ? ` (generated ${new Date(presStatus.generatedAt).toLocaleDateString()})`
                      : ''}
                    . Regenerating will replace only the generated records.
                  </p>
                  <Button variant="secondary" disabled={busy} onClick={() => setPresConfirmOpen(true)}>
                    Replace presentation activity
                  </Button>
                </div>
              ) : (
                <Button disabled={busy || !presAccountId} onClick={() => setPresConfirmOpen(true)}>
                  Generate account activity
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Audit */}
      <Card>
        <CardHeader>
          <CardTitle>Audit activity</CardTitle>
        </CardHeader>
        <CardContent>
          {!detail.audit || detail.audit.length === 0 ? (
            <p className="text-sm text-slate-600">No admin activity recorded yet.</p>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Action</Th>
                  <Th>Resource</Th>
                  <Th>By</Th>
                  <Th>When</Th>
                </Tr>
              </Thead>
              <Tbody>
                {detail.audit.map((row) => (
                  <Tr key={String(row.id)}>
                    <Td>{String(row.action)}</Td>
                    <Td>{String(row.resourceType)}</Td>
                    <Td>{String(row.performedBy ?? '—')}</Td>
                    <Td>{String(row.createdAt ?? '')}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reject KYC modal */}
      <Modal open={rejectOpen} title="Reject KYC" onClose={() => setRejectOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Provide a reason. The customer will be notified.</p>
          <Input
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Reason for rejection"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy || !rejectReason.trim()}
              onClick={() => {
                setRejectOpen(false);
                void run(
                  () => decideAdminKyc(userId, { decision: 'REJECT', reason: rejectReason.trim() }),
                  'KYC rejected.',
                );
              }}
            >
              Confirm rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign account modal */}
      <Modal open={assignOpen} title="Create / assign account" onClose={() => setAssignOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            A new account will be opened with a server-generated number and a zero balance. Fund it
            afterwards using the admin credit action.
          </p>
          <Select value={assignType} onChange={(event) => setAssignType(event.target.value)}>
            <option value="CHECKING">Checking</option>
            <option value="SAVINGS">Savings</option>
            <option value="BUSINESS">Business</option>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                setAssignOpen(false);
                void run(
                  () => assignAdminAccount(userId, { accountType: assignType }),
                  'Account created.',
                );
              }}
            >
              Create account
            </Button>
          </div>
        </div>
      </Modal>

      {/* Generate presentation activity confirmation */}
      <Modal
        open={presConfirmOpen}
        title={
          presStatus?.presentationExists
            ? 'Replace presentation activity'
            : 'Generate presentation activity'
        }
        onClose={() => setPresConfirmOpen(false)}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Generate six months of account activity for this customer?
          </p>
          <dl className="space-y-2 rounded-md bg-slate-50 p-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Customer</dt>
              <dd className="font-medium text-slate-900">
                {detail.firstName} {detail.lastName}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Account</dt>
              <dd className="font-medium text-slate-900">
                {presStatus
                  ? `••${presStatus.accountNumber.slice(-4)} · ${presStatus.accountName}`
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Final balance</dt>
              <dd className="font-medium text-slate-900">{formatCurrency(presTarget)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">History period</dt>
              <dd className="font-medium text-slate-900">6 months ending today</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Transactions</dt>
              <dd className="font-medium text-slate-900">approximately 40–70</dd>
            </div>
          </dl>
          {presStatus?.presentationExists ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Existing generated records will be removed and regenerated atomically. Genuine records
              are never deleted.
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPresConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy || !presAccountId}
              onClick={() => runGenerate(Boolean(presStatus?.presentationExists))}
            >
              {presStatus?.presentationExists ? 'Confirm replace' : 'Confirm generate'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Restrict account modal */}
      <Modal open={Boolean(restrictFor)} title="Restrict account" onClose={() => setRestrictFor(null)}>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            The customer keeps read access but cannot initiate transfers while restricted.
          </p>
          <Input
            value={restrictReason}
            onChange={(event) => setRestrictReason(event.target.value)}
            placeholder="Reason for restriction"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRestrictFor(null)}>
              Cancel
            </Button>
            <Button
              disabled={busy || !restrictReason.trim()}
              onClick={() => {
                const id = restrictFor;
                setRestrictFor(null);
                if (id) {
                  void run(
                    () => applyAdminAccountRestriction(id, { reason: restrictReason.trim() }),
                    'Restriction applied.',
                  );
                }
              }}
            >
              Apply restriction
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import {
  getAdminAuditLogs,
  getAdminCustomers,
  getAdminOverview,
  getAdminSettings,
  getAdminTransactions,
  getAdminTransfers,
} from '@/lib/api';

export type AdminOverview = {
  totalCustomers: number;
  activeAccounts: number;
  totalDeposits: number;
  totalTransfers: number;
  totalInvestments: number;
  pendingApprovals: number;
  pendingNotifications: number;
  dailyVolume: number;
  monthlyVolume: number;
  revenue: number;
  systemHealth: Record<string, string | number>;
};

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  status: string;
  kycStatus: string;
};

export type AdminTransferRow = {
  id: string;
  reference: string;
  counterparty: string;
  amount: number;
  status: string;
  type: string;
  createdAt: string;
};

export type AdminTransactionRow = {
  id: string;
  reference: string;
  description: string;
  amount: number;
  status: string;
  type: string;
  createdAt: string;
};

export type AdminAuditRow = {
  id: string;
  action: string;
  resourceType: string;
  description: string;
  severity: string;
  createdAt: string;
};

export type AdminSettings = {
  supportedAssets: string[];
  currencies: string[];
  limits: Record<string, number>;
  featureFlags: Record<string, boolean>;
  maintenanceMode: boolean;
};

function num(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value ? value : fallback;
}

export function toOverview(raw: Record<string, unknown> | null): AdminOverview | null {
  if (!raw) return null;
  return {
    totalCustomers: num(raw.totalCustomers),
    activeAccounts: num(raw.activeAccounts),
    totalDeposits: num(raw.totalDeposits),
    totalTransfers: num(raw.totalTransfers),
    totalInvestments: num(raw.totalInvestments),
    pendingApprovals: num(raw.pendingApprovals),
    pendingNotifications: num(raw.pendingNotifications),
    dailyVolume: num(raw.dailyVolume),
    monthlyVolume: num(raw.monthlyVolume),
    revenue: num(raw.revenue),
    systemHealth: (raw.systemHealth as Record<string, string | number>) ?? {},
  };
}

export function toCustomers(rows: Record<string, unknown>[]): AdminCustomer[] {
  return rows.map((row) => ({
    id: str(row.id),
    name: [str(row.firstName), str(row.lastName)].filter(Boolean).join(' ') || str(row.email, 'Customer'),
    email: str(row.email),
    status: str(row.status, 'UNKNOWN'),
    kycStatus: str(row.kycStatus, 'UNKNOWN'),
  }));
}

export function toTransfers(rows: Record<string, unknown>[]): AdminTransferRow[] {
  return rows.map((row) => ({
    id: str(row.id),
    reference: str(row.reference, str(row.id)),
    counterparty: str(row.beneficiaryName, str(row.counterparty, '—')),
    amount: num(row.amount),
    status: str(row.status, 'PENDING'),
    type: str(row.type, '—'),
    createdAt: str(row.createdAt),
  }));
}

export function toTransactions(rows: Record<string, unknown>[]): AdminTransactionRow[] {
  return rows.map((row) => ({
    id: str(row.id),
    reference: str(row.reference, str(row.id)),
    description: str(row.description, '—'),
    amount: num(row.amount),
    status: str(row.status, 'PENDING'),
    type: str(row.type, '—'),
    createdAt: str(row.createdAt),
  }));
}

export function toAuditRows(rows: Record<string, unknown>[]): AdminAuditRow[] {
  return rows.map((row) => ({
    id: str(row.id),
    action: str(row.action, '—'),
    resourceType: str(row.resourceType, '—'),
    description: str(row.description, '—'),
    severity: str(row.severity, 'INFO'),
    createdAt: str(row.createdAt),
  }));
}

/** Resolves to null instead of rejecting, so one failing panel cannot blank the page. */
async function settle<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

export async function loadAdminDashboard() {
  const [overview, customers, transfers, audit] = await Promise.all([
    settle(getAdminOverview()),
    settle(getAdminCustomers({ limit: 8 })),
    settle(getAdminTransfers({ limit: 8 })),
    settle(getAdminAuditLogs({ limit: 6 })),
  ]);

  return {
    overview: toOverview(overview),
    customers: toCustomers(customers?.items ?? []),
    transfers: toTransfers(transfers?.items ?? []),
    audit: toAuditRows(audit?.items ?? []),
  };
}

export async function loadAdminCustomers(search?: string) {
  const response = await getAdminCustomers({ q: search, limit: 50 });
  return { customers: toCustomers(response.items ?? []), total: response.totalCount ?? 0 };
}

export async function loadAdminTransfers() {
  const response = await getAdminTransfers({ limit: 50 });
  return toTransfers(response.items ?? []);
}

export async function loadAdminTransactions() {
  const response = await getAdminTransactions({ limit: 50 });
  return toTransactions(response.items ?? []);
}

export async function loadAdminAudit() {
  const response = await getAdminAuditLogs({ limit: 50 });
  return toAuditRows(response.items ?? []);
}

export async function loadAdminSettings(): Promise<AdminSettings> {
  const raw = await getAdminSettings();
  return {
    supportedAssets: (raw.supportedAssets as string[]) ?? [],
    currencies: (raw.currencies as string[]) ?? [],
    limits: (raw.limits as Record<string, number>) ?? {},
    featureFlags: (raw.featureFlags as Record<string, boolean>) ?? {},
    maintenanceMode: Boolean(raw.maintenanceMode),
  };
}

export function formatCurrency(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function formatCount(value: number) {
  return value.toLocaleString('en-US');
}

export type UserRole = 'CUSTOMER' | 'SUPER_ADMIN';

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  available: number;
  currency: string;
};

export type Transaction = {
  id: string;
  reference: string;
  description: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Scheduled';
  date: string;
  type: 'Credit' | 'Debit';
};

export type Transfer = {
  id: string;
  reference: string;
  beneficiary: string;
  amount: number;
  type: 'Domestic' | 'International' | 'Same Day';
  status: 'Pending' | 'Completed' | 'Rejected';
  description: string;
  date: string;
};

export type Card = {
  id: string;
  name: string;
  maskedNumber: string;
  status: 'ACTIVE' | 'FROZEN' | 'CANCELLED';
  limit: number;
  available: number;
};

export type PortfolioItem = {
  name: string;
  weight: string;
  value: number;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type Profile = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
};

export type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Suspended';
  accounts: number;
  balance: number;
  lastLogin: string;
};

export type AdminSettings = {
  emailNotifications: boolean;
  securityAlerts: boolean;
  maintenanceMode: boolean;
  transactionAlerts: boolean;
};

export const demoUsers: User[] = [
  {
    id: 'jordan',
    name: 'Jordan Parker',
    email: 'jordan.parker@atlasbank.com',
    password: 'AtlasBank!2026',
    role: 'CUSTOMER',
  },
  {
    id: 'sarah',
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@atlasbank.com',
    password: 'AtlasAdmin!2026',
    role: 'SUPER_ADMIN',
  },
];

export const demoAccounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Primary Operating',
    type: 'Checking',
    balance: 184250,
    available: 124500,
    currency: 'USD',
  },
  {
    id: 'acc-2',
    name: 'Treasury Reserve',
    type: 'Savings',
    balance: 520000,
    available: 500000,
    currency: 'USD',
  },
];

export const demoTransactions: Transaction[] = [
  {
    id: 'txn-1',
    reference: 'TXN-20481',
    description: 'CloudVault subscription',
    amount: -128.4,
    status: 'Completed',
    date: '2026-08-09',
    type: 'Debit',
  },
  {
    id: 'txn-2',
    reference: 'TXN-20482',
    description: 'Payroll deposit',
    amount: 8400,
    status: 'Completed',
    date: '2026-08-08',
    type: 'Credit',
  },
  {
    id: 'txn-3',
    reference: 'TXN-20483',
    description: 'Transfer to Reserve',
    amount: -5000,
    status: 'Pending',
    date: '2026-08-07',
    type: 'Debit',
  },
];

export const demoTransfers: Transfer[] = [
  {
    id: 'trf-1',
    reference: 'TRF-10021',
    beneficiary: 'Northwind Capital',
    amount: 2500,
    type: 'Domestic',
    status: 'Pending',
    description: 'Quarterly invoice',
    date: '2026-08-09',
  },
  {
    id: 'trf-2',
    reference: 'TRF-10022',
    beneficiary: 'Apex Labs',
    amount: 15000,
    type: 'Same Day',
    status: 'Completed',
    description: 'Equipment vendor',
    date: '2026-08-08',
  },
];

export const demoCards: Card[] = [
  {
    id: 'card-1',
    name: 'Atlas Black',
    maskedNumber: '•••• 4821',
    status: 'ACTIVE',
    limit: 18000,
    available: 9400,
  },
  {
    id: 'card-2',
    name: 'Atlas Executive',
    maskedNumber: '•••• 9024',
    status: 'ACTIVE',
    limit: 50000,
    available: 37250,
  },
];

export const demoPortfolio: PortfolioItem[] = [
  { name: 'Cash', weight: '28%', value: 142000 },
  { name: 'Equities', weight: '41%', value: 208000 },
  { name: 'Fixed Income', weight: '31%', value: 157000 },
];

export const demoNotifications: Notification[] = [
  {
    id: 'note-1',
    title: 'Transfer scheduled',
    message: 'Your transfer to Northwind Capital is due today.',
    read: false,
    createdAt: '2026-08-09',
  },
  {
    id: 'note-2',
    title: 'Card limit update',
    message: 'Your Atlas Executive card limit was increased.',
    read: true,
    createdAt: '2026-08-08',
  },
];

export const demoProfile: Profile = {
  fullName: 'Jordan Parker',
  email: 'jordan.parker@atlasbank.com',
  phone: '+1 (415) 555-0148',
  address: '504 Pine Street',
  city: 'San Francisco',
  state: 'CA',
};

export const demoActivity = [
  'New transfer request submitted',
  'Card freeze request approved',
  'Portfolio rebalance completed',
];

export const adminCustomers: CustomerSummary[] = [
  {
    id: 'cust-1',
    name: 'Jordan Parker',
    email: 'jordan.parker@atlasbank.com',
    status: 'Active',
    accounts: 2,
    balance: 704250,
    lastLogin: '2h ago',
  },
  {
    id: 'cust-2',
    name: 'Mina Alvarez',
    email: 'mina.alvarez@atlasbank.com',
    status: 'Active',
    accounts: 1,
    balance: 198450,
    lastLogin: '4h ago',
  },
];

export const adminTransactions = [
  {
    id: 'adm-txn-1',
    reference: 'TXN-30110',
    customer: 'Jordan Parker',
    amount: 12500,
    type: 'Transfer',
    status: 'Pending',
  },
  {
    id: 'adm-txn-2',
    reference: 'TXN-30111',
    customer: 'Mina Alvarez',
    amount: 3450,
    type: 'Card Purchase',
    status: 'Completed',
  },
];

export const adminTransfers = [
  {
    id: 'adm-trf-1',
    reference: 'TRF-20401',
    customer: 'Jordan Parker',
    amount: 2500,
    type: 'Domestic',
    status: 'Pending',
    date: '2026-08-09',
  },
  {
    id: 'adm-trf-2',
    reference: 'TRF-20402',
    customer: 'Mina Alvarez',
    amount: 6000,
    type: 'International',
    status: 'Approved',
    date: '2026-08-08',
  },
];

export const adminCards = [
  {
    id: 'adm-card-1',
    customer: 'Jordan Parker',
    maskedNumber: '•••• 4821',
    status: 'ACTIVE',
    limit: 18000,
    available: 9400,
  },
  {
    id: 'adm-card-2',
    customer: 'Mina Alvarez',
    maskedNumber: '•••• 9012',
    status: 'FROZEN',
    limit: 12000,
    available: 4800,
  },
];

export const adminAuditEvents = [
  {
    id: 'audit-1',
    title: 'Transfer approved',
    detail: 'TRF-20401 approved by Sarah Mitchell',
    date: '2026-08-09',
  },
  {
    id: 'audit-2',
    title: 'Card frozen',
    detail: 'Card 9012 was frozen by operations',
    date: '2026-08-08',
  },
];

export const adminReports = [
  { id: 'report-1', name: 'Daily Liquidity', status: 'Ready' },
  { id: 'report-2', name: 'Fraud Watch', status: 'Review' },
];

export const adminHealth = {
  uptime: '99.98%',
  latency: '42ms',
  fraudScore: 'Low',
};

export const initialSettings: AdminSettings = {
  emailNotifications: true,
  securityAlerts: true,
  maintenanceMode: false,
  transactionAlerts: true,
};

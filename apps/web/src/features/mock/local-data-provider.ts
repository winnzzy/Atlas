type UserRole = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';

export type LocalUser = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone: string;
  createdAt: string;
  lastLoginAt: string;
  status: 'ACTIVE' | 'SUSPENDED';
  segment: string;
  timezone: string;
  locale: string;
  mfaEnabled: boolean;
  hasPasswordReset: boolean;
};

export type AuthEnvelope<T> = {
  success: boolean;
  data: T | null;
  meta: { requestId: string; timestamp: string };
  error: { code: string; message: string } | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  sessionId: string;
};

export type LoggedInUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  initials: string;
  role: UserRole;
  phone: string;
  status: 'ACTIVE' | 'SUSPENDED';
};

const STORAGE_KEY = 'atlas-local-auth-store';

const createRequestId = () => `req-${Math.random().toString(36).slice(2, 10)}`;

const buildEnvelope = <T>(data: T | null, error: { code: string; message: string } | null = null): AuthEnvelope<T> => ({
  success: !error,
  data,
  meta: { requestId: createRequestId(), timestamp: new Date().toISOString() },
  error,
});

const seedUsers: LocalUser[] = [
  {
    id: 'cust-1001',
    email: 'jordan.parker@atlasbank.com',
    password: 'AtlasBank!2026',
    firstName: 'Jordan',
    lastName: 'Parker',
    role: 'CUSTOMER',
    phone: '+1 (415) 555-0147',
    createdAt: '2024-01-12T09:00:00.000Z',
    lastLoginAt: '2026-07-09T09:30:00.000Z',
    status: 'ACTIVE',
    segment: 'Premium Business',
    timezone: 'America/Chicago',
    locale: 'en-US',
    mfaEnabled: true,
    hasPasswordReset: false,
  },
  {
    id: 'admin-1001',
    email: 'sarah.mitchell@atlasbank.com',
    password: 'AtlasAdmin!2026',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    role: 'SUPER_ADMIN',
    phone: '+1 (212) 555-0188',
    createdAt: '2023-09-21T07:15:00.000Z',
    lastLoginAt: '2026-07-15T11:40:00.000Z',
    status: 'ACTIVE',
    segment: 'Operations',
    timezone: 'America/New_York',
    locale: 'en-US',
    mfaEnabled: true,
    hasPasswordReset: false,
  },
];

const seedAccounts = [
  {
    id: 'acct-1001',
    customerId: 'cust-1001',
    name: 'Primary Operating',
    type: 'CHECKING',
    status: 'ACTIVE',
    currentBalance: 184250.42,
    availableBalance: 184250.42,
    currency: 'USD',
    accountMask: '•••4512',
    routingNumber: '021000021',
    achNumber: 'ACH-4812',
    wireNumber: 'WIRE-7441',
    swiftCode: 'BOFAUS3N',
    interestRate: 0.01,
    lastActivity: '2026-07-09T08:45:00.000Z',
  },
  {
    id: 'acct-1002',
    customerId: 'cust-1001',
    name: 'Treasury Reserve',
    type: 'SAVINGS',
    status: 'ACTIVE',
    currentBalance: 925000.0,
    availableBalance: 925000.0,
    currency: 'USD',
    accountMask: '•••9931',
    routingNumber: '021000021',
    achNumber: 'ACH-0804',
    wireNumber: 'WIRE-9921',
    swiftCode: 'BOFAUS3N',
    interestRate: 0.035,
    lastActivity: '2026-07-08T05:12:00.000Z',
  },
];

const seedTransactions = [
  { id: 'txn-1001', accountId: 'acct-1001', reference: 'TRF-80192', type: 'TRANSFER', amount: 12500, currency: 'USD', status: 'COMPLETED', description: 'Payroll deposit', createdAt: '2026-07-09T08:45:00.000Z' },
  { id: 'txn-1002', accountId: 'acct-1001', reference: 'TRF-80193', type: 'CARD', amount: -482.31, currency: 'USD', status: 'COMPLETED', description: 'Cloud infrastructure', createdAt: '2026-07-08T19:24:00.000Z' },
  { id: 'txn-1003', accountId: 'acct-1002', reference: 'TRF-80194', type: 'TRANSFER', amount: 25000, currency: 'USD', status: 'PENDING', description: 'Treasury sweep', createdAt: '2026-07-08T16:00:00.000Z' },
];

const seedCards = [
  { id: 'card-1001', customerId: 'cust-1001', label: 'Atlas Black', maskedNumber: '•••• 4412', status: 'ACTIVE', isFrozen: false, availableCredit: 15420.5, creditLimit: 25000, cardholder: 'Jordan Parker', network: 'Visa' },
  { id: 'card-1002', customerId: 'cust-1001', label: 'Atlas Executive', maskedNumber: '•••• 0188', status: 'ACTIVE', isFrozen: false, availableCredit: 8675.25, creditLimit: 10000, cardholder: 'Jordan Parker', network: 'Visa' },
];

const seedNotifications = [
  { id: 'notif-1001', title: 'Card activity verified', message: 'A $4,825.00 charge cleared successfully.', status: 'UNREAD', createdAt: '2026-07-09T08:53:00.000Z' },
  { id: 'notif-1002', title: 'Treasury transfer queued', message: 'Your transfer to Northwind Capital is processing.', status: 'READ', createdAt: '2026-07-08T17:18:00.000Z' },
];

const seedPortfolio = {
  totalValue: 1485000,
  cashBalance: 245000,
  positions: [
    { symbol: 'AAPL', shares: 220, costBasis: 14320, marketValue: 17350 },
    { symbol: 'NVDA', shares: 110, costBasis: 16750, marketValue: 20150 },
  ],
  allocations: [{ name: 'Equities', value: 62 }, { name: 'Cash', value: 24 }, { name: 'Alternatives', value: 14 }],
};

const seedAuditLogs = [
  { id: 'audit-1001', action: 'TRANSFER_APPROVED', severity: 'INFO', description: 'Treasury transfer approved by operations', createdAt: '2026-07-09T08:43:00.000Z', actor: 'Sarah Mitchell' },
  { id: 'audit-1002', action: 'CARD_FROZEN', severity: 'WARNING', description: 'Card freeze request executed for suspect activity', createdAt: '2026-07-08T21:55:00.000Z', actor: 'Jordan Parker' },
];

const seedTransfers = [
  { id: 'transfer-1001', reference: 'TRF-90011', amount: 12500, currency: 'USD', status: 'COMPLETED', type: 'ACH', beneficiary: 'Northwind Capital', createdAt: '2026-07-09T08:30:00.000Z' },
  { id: 'transfer-1002', reference: 'TRF-90012', amount: 8200, currency: 'USD', status: 'PENDING', type: 'WIRE', beneficiary: 'Morrow Labs', createdAt: '2026-07-08T17:10:00.000Z' },
];

const seedStatements = [
  { id: 'stmt-1001', accountId: 'acct-1001', period: 'June 2026', openingBalance: 161250.42, closingBalance: 184250.42, generatedAt: '2026-07-01T00:00:00.000Z' },
  { id: 'stmt-1002', accountId: 'acct-1002', period: 'June 2026', openingBalance: 880000, closingBalance: 925000, generatedAt: '2026-07-01T00:00:00.000Z' },
];

export type LocalDataStore = {
  users: LocalUser[];
  accounts: typeof seedAccounts;
  transactions: typeof seedTransactions;
  cards: typeof seedCards;
  notifications: typeof seedNotifications;
  portfolio: typeof seedPortfolio;
  auditLogs: typeof seedAuditLogs;
  transfers: typeof seedTransfers;
  statements: typeof seedStatements;
  resetTokens: Record<string, string>;
  currentUserId: string | null;
};

const loadStore = (): LocalDataStore => {
  if (typeof window === 'undefined') {
    return {
      users: seedUsers,
      accounts: seedAccounts,
      transactions: seedTransactions,
      cards: seedCards,
      notifications: seedNotifications,
      portfolio: seedPortfolio,
      auditLogs: seedAuditLogs,
      transfers: seedTransfers,
      statements: seedStatements,
      resetTokens: {},
      currentUserId: null,
    };
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    const initial = {
      users: seedUsers,
      accounts: seedAccounts,
      transactions: seedTransactions,
      cards: seedCards,
      notifications: seedNotifications,
      portfolio: seedPortfolio,
      auditLogs: seedAuditLogs,
      transfers: seedTransfers,
      statements: seedStatements,
      resetTokens: {},
      currentUserId: null,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  return JSON.parse(saved) as LocalDataStore;
};

const persistStore = (store: LocalDataStore) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }
};

const getStore = (): LocalDataStore => loadStore();

export const localDataProvider = {
  authenticate(email: string, password: string): AuthEnvelope<{ user: LoggedInUser; session: AuthSession }> {
    const store = getStore();
    const user = store.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password);
    if (!user) {
      return buildEnvelope<{ user: LoggedInUser; session: AuthSession }>(null, { code: 'INVALID_CREDENTIALS', message: 'We could not validate the provided credentials.' });
    }
    if (user.status !== 'ACTIVE') {
      return buildEnvelope<{ user: LoggedInUser; session: AuthSession }>(null, { code: 'ACCOUNT_DISABLED', message: 'This account has been disabled.' });
    }
    const nextStore = { ...store, currentUserId: user.id };
    persistStore(nextStore);
    return buildEnvelope({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        initials: `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`,
        role: user.role,
        phone: user.phone,
        status: user.status,
      },
      session: {
        accessToken: `access-${user.id}`,
        refreshToken: `refresh-${user.id}`,
        tokenType: 'Bearer',
        expiresIn: 3600,
        sessionId: `session-${user.id}`,
      },
    });
  },

  signUp(input: { email: string; password: string; firstName: string; lastName: string; termsAcceptedAt: string; privacyAcceptedAt: string }): AuthEnvelope<{ user: LoggedInUser; session: AuthSession }> {
    const store = getStore();
    const existing = store.users.find((entry) => entry.email.toLowerCase() === input.email.toLowerCase());
    if (existing) {
      return buildEnvelope<{ user: LoggedInUser; session: AuthSession }>(null, { code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' });
    }
    const newUser: LocalUser = {
      id: `cust-${Date.now()}`,
      email: input.email,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
      role: 'CUSTOMER',
      phone: '+1 (650) 555-0100',
      createdAt: input.termsAcceptedAt,
      lastLoginAt: new Date().toISOString(),
      status: 'ACTIVE',
      segment: 'Growth',
      timezone: 'America/Los_Angeles',
      locale: 'en-US',
      mfaEnabled: false,
      hasPasswordReset: false,
    };
    const nextStore = {
      ...store,
      users: [...store.users, newUser],
      accounts: [
        ...store.accounts,
        {
          id: `acct-${Date.now()}`,
          customerId: newUser.id,
          name: 'Personal Checking',
          type: 'CHECKING',
          status: 'ACTIVE',
          currentBalance: 3250.5,
          availableBalance: 3250.5,
          currency: 'USD',
          accountMask: '•••6294',
          routingNumber: '021000021',
          achNumber: 'ACH-2104',
          wireNumber: 'WIRE-2201',
          swiftCode: 'BOFAUS3N',
          interestRate: 0.0,
          lastActivity: new Date().toISOString(),
        },
      ],
      transactions: [
        ...store.transactions,
        {
          id: `txn-${Date.now()}`,
          accountId: `acct-${Date.now()}`,
          reference: `TRF-${Date.now().toString().slice(-4)}`,
          type: 'TRANSFER',
          amount: 3250.5,
          currency: 'USD',
          status: 'COMPLETED',
          description: 'Initial funding deposit',
          createdAt: new Date().toISOString(),
        },
      ],
      cards: [
        ...store.cards,
        {
          id: `card-${Date.now()}`,
          customerId: newUser.id,
          label: 'Atlas Consumer',
          maskedNumber: '•••• 5201',
          status: 'ACTIVE',
          isFrozen: false,
          availableCredit: 4925.5,
          creditLimit: 6500,
          cardholder: `${newUser.firstName} ${newUser.lastName}`,
          network: 'Visa',
        },
      ],
      notifications: [
        ...store.notifications,
        {
          id: `notif-${Date.now()}`,
          title: 'Welcome to Atlas',
          message: 'Your new account is ready and your digital banking workspace is active.',
          status: 'UNREAD',
          createdAt: new Date().toISOString(),
        },
      ],
      currentUserId: newUser.id,
    };
    persistStore(nextStore);
    return buildEnvelope({
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        initials: `${newUser.firstName[0] ?? ''}${newUser.lastName[0] ?? ''}`,
        role: newUser.role,
        phone: newUser.phone,
        status: newUser.status,
      },
      session: {
        accessToken: `access-${newUser.id}`,
        refreshToken: `refresh-${newUser.id}`,
        tokenType: 'Bearer',
        expiresIn: 3600,
        sessionId: `session-${newUser.id}`,
      },
    });
  },

  forgotPassword(email: string): AuthEnvelope<{ message: string }> {
    const store = getStore();
    const user = store.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return buildEnvelope<{ message: string }>(null, { code: 'USER_NOT_FOUND', message: 'No account matches that email address.' });
    }
    const token = `reset-${user.id}-${Date.now()}`;
    const nextStore = { ...store, resetTokens: { ...store.resetTokens, [token]: user.id } };
    persistStore(nextStore);
    return buildEnvelope({ message: 'If an account exists, a secure reset link has been sent to your email inbox.' });
  },

  resetPassword(token: string, password: string): AuthEnvelope<{ message: string }> {
    const store = getStore();
    const userId = store.resetTokens[token];
    if (!userId) {
      return buildEnvelope<{ message: string }>(null, { code: 'INVALID_TOKEN', message: 'The reset token is invalid or has expired.' });
    }
    const users = store.users.map((user) => (user.id === userId ? { ...user, password, hasPasswordReset: true } : user));
    const nextStore = { ...store, users, resetTokens: { ...store.resetTokens, [token]: '' } };
    persistStore(nextStore);
    return buildEnvelope({ message: 'Your password has been reset successfully.' });
  },

  logout(): AuthEnvelope<{ message: string }> {
    const store = getStore();
    const nextStore = { ...store, currentUserId: null };
    persistStore(nextStore);
    return buildEnvelope({ message: 'You have been signed out.' });
  },

  getCurrentUser(): LoggedInUser | null {
    const store = getStore();
    if (!store.currentUserId) return null;
    const user = store.users.find((entry) => entry.id === store.currentUserId);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      initials: `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`,
      role: user.role,
      phone: user.phone,
      status: user.status,
    };
  },

  getProfile(userId?: string): Record<string, unknown> {
    const store = getStore();
    const currentUserId = userId ?? store.currentUserId;
    const user = store.users.find((entry) => entry.id === currentUserId) ?? store.users[0];
    if (!user) {
      return {
        id: 'cust-1001',
        email: 'jordan.parker@atlasbank.com',
        firstName: 'Jordan',
        lastName: 'Parker',
        fullName: 'Jordan Parker',
        phone: '+1 (415) 555-0147',
        segment: 'Premium Business',
        status: 'ACTIVE',
        lastLoginAt: '2026-07-09T09:30:00.000Z',
        createdAt: '2024-01-12T09:00:00.000Z',
        mfaEnabled: true,
        address: '153 Market Street, Suite 600, San Francisco, CA 94105',
        primaryAccountId: 'acct-1001',
      };
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      phone: user.phone,
      segment: user.segment,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      mfaEnabled: user.mfaEnabled,
      address: '153 Market Street, Suite 600, San Francisco, CA 94105',
      primaryAccountId: store.accounts.find((account) => account.customerId === user.id)?.id ?? 'acct-1001',
    };
  },

  getSecurity(userId?: string): Record<string, unknown> {
    const store = getStore();
    const currentUserId = userId ?? store.currentUserId;
    const user = store.users.find((entry) => entry.id === currentUserId) ?? store.users[0];
    if (!user) {
      return {
        id: 'cust-1001',
        mfaEnabled: true,
        passwordLastChanged: '2026-06-17T10:24:00.000Z',
        deviceCount: 3,
        trustedDevices: ['MacBook Pro', 'iPhone 15', 'Windows Surface'],
        status: 'ACTIVE',
      };
    }
    return {
      id: user.id,
      mfaEnabled: user.mfaEnabled,
      passwordLastChanged: '2026-06-17T10:24:00.000Z',
      deviceCount: 3,
      trustedDevices: ['MacBook Pro', 'iPhone 15', 'Windows Surface'],
      status: 'ACTIVE',
    };
  },

  getAccounts(params?: Record<string, string | number | undefined>): Record<string, unknown> {
    const store = getStore();
    const customerId = store.currentUserId ?? store.users[0]?.id;
    const items = store.accounts.filter((account) => account.customerId === customerId);
    return { items, total: items.length, page: Number(params?.page ?? 1), limit: Number(params?.limit ?? items.length) };
  },

  getAccount(id: string): Record<string, unknown> {
    const store = getStore();
    const account = store.accounts.find((entry) => entry.id === id) ?? store.accounts[0];
    return account ?? {
      id: 'acct-1001',
      customerId: 'cust-1001',
      name: 'Primary Operating',
      type: 'CHECKING',
      status: 'ACTIVE',
      currentBalance: 184250.42,
      availableBalance: 184250.42,
      currency: 'USD',
      accountMask: '•••4512',
      routingNumber: '021000021',
      achNumber: 'ACH-4812',
      wireNumber: 'WIRE-7441',
      swiftCode: 'BOFAUS3N',
      interestRate: 0.01,
      lastActivity: '2026-07-09T08:45:00.000Z',
    };
  },

  getAccountStatements(id: string): Record<string, unknown> {
    const store = getStore();
    const items = store.statements.filter((statement) => statement.accountId === id);
    return { items, total: items.length };
  },

  getTransactions(params?: Record<string, string | number | undefined>): Record<string, unknown> {
    const store = getStore();
    const items = store.transactions.slice(0, Number(params?.limit ?? 10));
    return { items, total: store.transactions.length };
  },

  getTransfers(params?: Record<string, string | number | undefined>): Record<string, unknown> {
    const store = getStore();
    const items = store.transfers.slice(0, Number(params?.limit ?? 10));
    return { items, total: store.transfers.length };
  },

  getCards(params?: Record<string, string | number | undefined>): Record<string, unknown> {
    const store = getStore();
    const customerId = store.currentUserId ?? store.users[0]?.id;
    const items = store.cards.filter((card) => card.customerId === customerId).slice(0, Number(params?.limit ?? 10));
    return { items, total: items.length };
  },

  getPortfolio(): Record<string, unknown> {
    const store = getStore();
    return { ...store.portfolio, totalValue: store.portfolio.totalValue };
  },

  getPortfolioTransactions(): Array<Record<string, unknown>> {
    return [
      { id: 'port-1001', symbol: 'AAPL', side: 'BUY', amount: 220, price: 78.9, createdAt: '2026-07-09T08:20:00.000Z' },
      { id: 'port-1002', symbol: 'NVDA', side: 'BUY', amount: 110, price: 183.2, createdAt: '2026-07-08T14:00:00.000Z' },
    ];
  },

  getNotifications(params?: Record<string, string | number | undefined>): Record<string, unknown> {
    const store = getStore();
    const items = store.notifications.slice(0, Number(params?.limit ?? 10));
    return { items, total: store.notifications.length };
  },

  markNotificationRead(id: string): Record<string, unknown> {
    const store = getStore();
    const notifications = store.notifications.map((notification) => (notification.id === id ? { ...notification, status: 'READ' } : notification));
    persistStore({ ...store, notifications });
    return { id, status: 'READ' };
  },

  createTransfer(payload: Record<string, unknown>): Record<string, unknown> {
    const store = getStore();
    const transfer = {
      id: `transfer-${Date.now()}`,
      reference: `TRF-${Date.now().toString().slice(-4)}`,
      amount: Number(payload.amount ?? 0),
      currency: String(payload.currency ?? 'USD'),
      status: 'PENDING',
      type: String(payload.type ?? 'ACH'),
      beneficiary: String(payload.beneficiary ?? 'External beneficiary'),
      createdAt: new Date().toISOString(),
    };
    const nextStore = { ...store, transfers: [transfer, ...store.transfers] };
    persistStore(nextStore);
    return transfer;
  },

  cancelTransfer(id: string): Record<string, unknown> {
    const store = getStore();
    const transfers = store.transfers.map((transfer) => (transfer.id === id ? { ...transfer, status: 'CANCELLED' } : transfer));
    persistStore({ ...store, transfers });
    return { id, status: 'CANCELLED' };
  },

  freezeCard(id: string): Record<string, unknown> {
    const store = getStore();
    const cards = store.cards.map((card) => (card.id === id ? { ...card, status: 'FROZEN', isFrozen: true } : card));
    persistStore({ ...store, cards });
    return { id, status: 'FROZEN' };
  },

  unfreezeCard(id: string): Record<string, unknown> {
    const store = getStore();
    const cards = store.cards.map((card) => (card.id === id ? { ...card, status: 'ACTIVE', isFrozen: false } : card));
    persistStore({ ...store, cards });
    return { id, status: 'ACTIVE' };
  },

  getOverview(): Record<string, unknown> {
    const store = getStore();
    return {
      totalCustomers: store.users.filter((user) => user.role === 'CUSTOMER').length,
      activeAccounts: store.accounts.filter((account) => account.status === 'ACTIVE').length,
      dailyVolume: 2487600,
      totalTransfers: store.transfers.length,
      totalCardTransactions: 3812,
      totalInvestments: 16,
      pendingNotifications: store.notifications.filter((notification) => notification.status === 'UNREAD').length,
      monthlyVolume: 11280000,
      revenue: 684520,
      pendingApprovals: 3,
      systemHealth: { core: 'Operational', payments: 'Stable', fraud: 'Monitored' },
      totalRevenue: 684520,
    };
  },

  getAnalytics(): Record<string, unknown> {
    return {
      dailyKpis: { transactionCount: 182, approvalCount: 7, cardVolume: 84500, transferCount: 48 },
      trend: 'up',
      nextReviewAt: '2026-07-10T09:00:00.000Z',
    };
  },

  getCustomers(params?: { q?: string; limit?: number; offset?: number }): Record<string, unknown> {
    const store = getStore();
    const customers = store.users.filter((user) => user.role === 'CUSTOMER');
    const q = String(params?.q ?? '').toLowerCase();
    const filtered = q ? customers.filter((customer) => `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(q) || customer.email.toLowerCase().includes(q)) : customers;
    return { items: filtered.slice(0, Number(params?.limit ?? 10)), total: filtered.length };
  },

  getCustomerProfile(userId: string): Record<string, unknown> {
    const store = getStore();
    const user = store.users.find((entry) => entry.id === userId) ?? store.users[0];
    return this.getProfile(user?.id ?? 'cust-1001');
  },

  getAuditLogs(params?: Record<string, string | number | undefined>): Record<string, unknown> {
    const store = getStore();
    const items = store.auditLogs.slice(0, Number(params?.limit ?? 10));
    return { items, total: store.auditLogs.length };
  },

  getAdminTransactions(): Record<string, unknown> {
    return { items: seedTransactions.map((transaction) => ({ ...transaction, customerId: 'cust-1001' })), total: seedTransactions.length };
  },

  getAdminTransfers(): Record<string, unknown> {
    return { items: seedTransfers, total: seedTransfers.length };
  },

  getNotificationQueue(): Record<string, unknown> {
    return { items: seedNotifications, total: seedNotifications.length };
  },

  getNotificationTemplates(): Array<Record<string, unknown>> {
    return [
      { id: 'template-1', name: 'Transfer completed', channel: 'EMAIL' },
      { id: 'template-2', name: 'Card freeze', channel: 'SMS' },
    ];
  },

  getSettings(): Record<string, unknown> {
    return { transferDaily: 750000, transferMonthly: 1800000, cardDaily: 250000, cardMonthly: 6000000 };
  },

  getReport(kind: string): Record<string, unknown> {
    return { kind, total: 1240, period: 'MTD', generatedAt: new Date().toISOString() };
  },
};

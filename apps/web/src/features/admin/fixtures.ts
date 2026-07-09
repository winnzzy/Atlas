// ─── Operations Center Fixture Data ─────────────────────
// Realistic US banking data for the admin portal demo

export interface AdminCustomer {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly avatar?: string;
  readonly status: 'active' | 'suspended' | 'pending' | 'closed';
  readonly kycStatus: 'verified' | 'pending' | 'rejected' | 'incomplete';
  readonly riskLevel: 'low' | 'medium' | 'high' | 'critical';
  readonly joinedAt: string;
  readonly lastActiveAt: string;
  readonly accountCount: number;
  readonly totalBalance: number;
  readonly state: string;
  readonly city: string;
}

export interface AdminAccount {
  readonly id: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly type: 'checking' | 'savings' | 'business' | 'investment';
  readonly accountNumber: string;
  readonly routingNumber: string;
  readonly balance: number;
  readonly availableBalance: number;
  readonly status: 'active' | 'frozen' | 'closed' | 'pending';
  readonly currency: string;
  readonly openedAt: string;
  readonly lastTransactionAt: string;
}

export interface AdminTransaction {
  readonly id: string;
  readonly accountId: string;
  readonly customerName: string;
  readonly type:
    | 'ach_deposit'
    | 'ach_withdrawal'
    | 'wire_incoming'
    | 'wire_outgoing'
    | 'swift'
    | 'internal_transfer'
    | 'crypto_deposit'
    | 'crypto_withdrawal'
    | 'card_purchase'
    | 'fee';
  readonly status: 'completed' | 'pending' | 'failed' | 'reversed' | 'processing';
  readonly amount: number;
  readonly currency: string;
  readonly description: string;
  readonly reference: string;
  readonly counterparty: string;
  readonly createdAt: string;
  readonly settledAt?: string;
  readonly network?: string;
}

export interface AdminCard {
  readonly id: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly last4: string;
  readonly brand: 'visa' | 'mastercard' | 'amex';
  readonly type: 'physical' | 'virtual';
  readonly status: 'active' | 'frozen' | 'expired' | 'cancelled';
  readonly limit: number;
  readonly spent: number;
  readonly currency: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly lastUsedAt?: string;
}

export interface AdminCryptoAsset {
  readonly symbol: string;
  readonly name: string;
  readonly price: number;
  readonly change24h: number;
  readonly totalHeld: number;
  readonly totalValueUsd: number;
  readonly holders: number;
  readonly pendingDeposits: number;
  readonly pendingWithdrawals: number;
  readonly network: string;
}

export interface AdminInvestment {
  readonly id: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly asset: string;
  readonly ticker: string;
  readonly shares: number;
  readonly avgCost: number;
  readonly currentPrice: number;
  readonly value: number;
  readonly gainLoss: number;
  readonly gainLossPercent: number;
  readonly status: 'active' | 'sold' | 'pending';
}

export interface AdminLoan {
  readonly id: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly type: 'personal' | 'auto' | 'mortgage' | 'business';
  readonly amount: number;
  readonly outstanding: number;
  readonly interestRate: number;
  readonly term: number;
  readonly monthlyPayment: number;
  readonly status: 'pending' | 'active' | 'paid_off' | 'defaulted' | 'rejected';
  readonly riskGrade: 'A' | 'B' | 'C' | 'D' | 'E';
  readonly originatedAt: string;
  readonly nextPaymentAt: string;
}

export interface AdminNotification {
  readonly id: string;
  readonly type: 'transaction' | 'security' | 'system' | 'marketing' | 'compliance';
  readonly channel: 'email' | 'sms' | 'push' | 'in_app';
  readonly recipient: string;
  readonly subject: string;
  readonly status: 'sent' | 'delivered' | 'opened' | 'failed' | 'pending';
  readonly sentAt: string;
  readonly deliveredAt?: string;
  readonly openedAt?: string;
}

export interface AdminAuditEntry {
  readonly id: string;
  readonly actor: string;
  readonly actorRole: string;
  readonly action: string;
  readonly resource: string;
  readonly resourceId: string;
  readonly details: string;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly timestamp: string;
  readonly severity: 'info' | 'warning' | 'critical';
}

export interface AdminDashboardMetrics {
  readonly totalRevenue: number;
  readonly revenueChange: number;
  readonly totalDeposits: number;
  readonly depositsChange: number;
  readonly totalWithdrawals: number;
  readonly withdrawalsChange: number;
  readonly totalUsers: number;
  readonly usersChange: number;
  readonly transactionVolume: number;
  readonly transactionVolumeChange: number;
  readonly cryptoAssetsUnderManagement: number;
  readonly cryptoChange: number;
  readonly loanPortfolio: number;
  readonly loanChange: number;
  readonly activeCards: number;
  readonly cardsChange: number;
}

export interface SystemHealth {
  readonly api: 'operational' | 'degraded' | 'down';
  readonly database: 'operational' | 'degraded' | 'down';
  readonly redis: 'operational' | 'degraded' | 'down';
  readonly paymentProcessor: 'operational' | 'degraded' | 'down';
  readonly cryptoNode: 'operational' | 'degraded' | 'down';
  readonly emailService: 'operational' | 'degraded' | 'down';
  readonly uptime: number;
  readonly responseTime: number;
  readonly errorRate: number;
}

export interface SystemAlert {
  readonly id: string;
  readonly severity: 'info' | 'warning' | 'critical';
  readonly message: string;
  readonly source: string;
  readonly timestamp: string;
  readonly resolved: boolean;
}

// ─── Mock Data ──────────────────────────────────────────

export const mockCustomers: readonly AdminCustomer[] = [
  {
    id: 'cust_001',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@gmail.com',
    phone: '+1 (415) 555-0142',
    status: 'active',
    kycStatus: 'verified',
    riskLevel: 'low',
    joinedAt: '2024-03-15T10:00:00Z',
    lastActiveAt: '2025-07-08T14:22:00Z',
    accountCount: 3,
    totalBalance: 284750.5,
    state: 'CA',
    city: 'San Francisco',
  },
  {
    id: 'cust_002',
    firstName: 'Sarah',
    lastName: 'Williams',
    email: 'sarah.w@outlook.com',
    phone: '+1 (212) 555-0198',
    status: 'active',
    kycStatus: 'verified',
    riskLevel: 'low',
    joinedAt: '2024-01-22T08:30:00Z',
    lastActiveAt: '2025-07-09T09:15:00Z',
    accountCount: 2,
    totalBalance: 156230.75,
    state: 'NY',
    city: 'New York',
  },
  {
    id: 'cust_003',
    firstName: 'James',
    lastName: 'Rodriguez',
    email: 'j.rodriguez@proton.me',
    phone: '+1 (305) 555-0267',
    status: 'active',
    kycStatus: 'verified',
    riskLevel: 'medium',
    joinedAt: '2024-06-10T12:00:00Z',
    lastActiveAt: '2025-07-07T18:45:00Z',
    accountCount: 2,
    totalBalance: 89420.0,
    state: 'FL',
    city: 'Miami',
  },
  {
    id: 'cust_004',
    firstName: 'Emily',
    lastName: 'Nakamura',
    email: 'emily.n@gmail.com',
    phone: '+1 (312) 555-0334',
    status: 'pending',
    kycStatus: 'pending',
    riskLevel: 'medium',
    joinedAt: '2025-07-01T14:00:00Z',
    lastActiveAt: '2025-07-09T08:00:00Z',
    accountCount: 1,
    totalBalance: 12500.0,
    state: 'IL',
    city: 'Chicago',
  },
  {
    id: 'cust_005',
    firstName: 'David',
    lastName: 'Thompson',
    email: 'dthompson@yahoo.com',
    phone: '+1 (512) 555-0411',
    status: 'active',
    kycStatus: 'verified',
    riskLevel: 'low',
    joinedAt: '2023-11-05T09:00:00Z',
    lastActiveAt: '2025-07-08T21:30:00Z',
    accountCount: 4,
    totalBalance: 542180.25,
    state: 'TX',
    city: 'Austin',
  },
  {
    id: 'cust_006',
    firstName: 'Amanda',
    lastName: 'Foster',
    email: 'amanda.foster@icloud.com',
    phone: '+1 (206) 555-0578',
    status: 'suspended',
    kycStatus: 'verified',
    riskLevel: 'high',
    joinedAt: '2024-02-18T11:00:00Z',
    lastActiveAt: '2025-06-15T10:00:00Z',
    accountCount: 2,
    totalBalance: 34890.0,
    state: 'WA',
    city: 'Seattle',
  },
  {
    id: 'cust_007',
    firstName: 'Robert',
    lastName: 'Kim',
    email: 'r.kim@gmail.com',
    phone: '+1 (404) 555-0645',
    status: 'active',
    kycStatus: 'verified',
    riskLevel: 'low',
    joinedAt: '2024-09-20T16:00:00Z',
    lastActiveAt: '2025-07-09T07:12:00Z',
    accountCount: 2,
    totalBalance: 178650.0,
    state: 'GA',
    city: 'Atlanta',
  },
  {
    id: 'cust_008',
    firstName: 'Lisa',
    lastName: 'Martinez',
    email: 'lisa.martinez@hotmail.com',
    phone: '+1 (702) 555-0712',
    status: 'active',
    kycStatus: 'incomplete',
    riskLevel: 'medium',
    joinedAt: '2025-06-28T13:00:00Z',
    lastActiveAt: '2025-07-08T16:50:00Z',
    accountCount: 1,
    totalBalance: 8750.5,
    state: 'NV',
    city: 'Las Vegas',
  },
  {
    id: 'cust_009',
    firstName: 'Christopher',
    lastName: 'Patel',
    email: 'c.patel@gmail.com',
    phone: '+1 (617) 555-0889',
    status: 'active',
    kycStatus: 'verified',
    riskLevel: 'low',
    joinedAt: '2023-08-12T10:00:00Z',
    lastActiveAt: '2025-07-09T11:05:00Z',
    accountCount: 3,
    totalBalance: 312400.0,
    state: 'MA',
    city: 'Boston',
  },
  {
    id: 'cust_010',
    firstName: 'Jennifer',
    lastName: "O'Brien",
    email: 'jen.obrien@outlook.com',
    phone: '+1 (303) 555-0956',
    status: 'active',
    kycStatus: 'verified',
    riskLevel: 'low',
    joinedAt: '2024-05-03T08:00:00Z',
    lastActiveAt: '2025-07-07T19:22:00Z',
    accountCount: 2,
    totalBalance: 95340.0,
    state: 'CO',
    city: 'Denver',
  },
];

export const mockAccounts: readonly AdminAccount[] = [
  {
    id: 'acct_001',
    customerId: 'cust_001',
    customerName: 'Michael Chen',
    type: 'checking',
    accountNumber: '****4521',
    routingNumber: '021000021',
    balance: 45230.5,
    availableBalance: 44980.5,
    status: 'active',
    currency: 'USD',
    openedAt: '2024-03-15',
    lastTransactionAt: '2025-07-08T14:22:00Z',
  },
  {
    id: 'acct_002',
    customerId: 'cust_001',
    customerName: 'Michael Chen',
    type: 'savings',
    accountNumber: '****7834',
    routingNumber: '021000021',
    balance: 189520.0,
    availableBalance: 189520.0,
    status: 'active',
    currency: 'USD',
    openedAt: '2024-03-15',
    lastTransactionAt: '2025-07-05T09:00:00Z',
  },
  {
    id: 'acct_003',
    customerId: 'cust_002',
    customerName: 'Sarah Williams',
    type: 'checking',
    accountNumber: '****9102',
    routingNumber: '021000021',
    balance: 67890.75,
    availableBalance: 67640.75,
    status: 'active',
    currency: 'USD',
    openedAt: '2024-01-22',
    lastTransactionAt: '2025-07-09T09:15:00Z',
  },
  {
    id: 'acct_004',
    customerId: 'cust_002',
    customerName: 'Sarah Williams',
    type: 'investment',
    accountNumber: '****3356',
    routingNumber: '021000021',
    balance: 88340.0,
    availableBalance: 88340.0,
    status: 'active',
    currency: 'USD',
    openedAt: '2024-04-10',
    lastTransactionAt: '2025-07-07T16:30:00Z',
  },
  {
    id: 'acct_005',
    customerId: 'cust_005',
    customerName: 'David Thompson',
    type: 'business',
    accountNumber: '****6678',
    routingNumber: '111000025',
    balance: 312450.25,
    availableBalance: 311950.25,
    status: 'active',
    currency: 'USD',
    openedAt: '2023-11-05',
    lastTransactionAt: '2025-07-08T21:30:00Z',
  },
  {
    id: 'acct_006',
    customerId: 'cust_006',
    customerName: 'Amanda Foster',
    type: 'checking',
    accountNumber: '****2245',
    routingNumber: '325070760',
    balance: 34890.0,
    availableBalance: 0.0,
    status: 'frozen',
    currency: 'USD',
    openedAt: '2024-02-18',
    lastTransactionAt: '2025-06-15T10:00:00Z',
  },
  {
    id: 'acct_007',
    customerId: 'cust_007',
    customerName: 'Robert Kim',
    type: 'checking',
    accountNumber: '****8891',
    routingNumber: '061000052',
    balance: 78650.0,
    availableBalance: 78400.0,
    status: 'active',
    currency: 'USD',
    openedAt: '2024-09-20',
    lastTransactionAt: '2025-07-09T07:12:00Z',
  },
  {
    id: 'acct_008',
    customerId: 'cust_009',
    customerName: 'Christopher Patel',
    type: 'savings',
    accountNumber: '****5567',
    routingNumber: '011000015',
    balance: 212400.0,
    availableBalance: 212400.0,
    status: 'active',
    currency: 'USD',
    openedAt: '2023-08-12',
    lastTransactionAt: '2025-07-09T11:05:00Z',
  },
];

export const mockTransactions: readonly AdminTransaction[] = [
  {
    id: 'txn_001',
    accountId: 'acct_001',
    customerName: 'Michael Chen',
    type: 'ach_deposit',
    status: 'completed',
    amount: 5200.0,
    currency: 'USD',
    description: 'Direct Deposit - Acme Corp Payroll',
    reference: 'ACH-2025-07-001',
    counterparty: 'Acme Corp',
    createdAt: '2025-07-09T09:00:00Z',
    settledAt: '2025-07-09T12:00:00Z',
  },
  {
    id: 'txn_002',
    accountId: 'acct_003',
    customerName: 'Sarah Williams',
    type: 'wire_outgoing',
    status: 'completed',
    amount: 12500.0,
    currency: 'USD',
    description: 'Wire Transfer to Chase',
    reference: 'WIR-2025-07-002',
    counterparty: 'Chase Bank ****4455',
    createdAt: '2025-07-09T08:30:00Z',
    settledAt: '2025-07-09T10:15:00Z',
  },
  {
    id: 'txn_003',
    accountId: 'acct_005',
    customerName: 'David Thompson',
    type: 'ach_withdrawal',
    status: 'pending',
    amount: 8750.0,
    currency: 'USD',
    description: 'ACH Payment to Vendor Solutions LLC',
    reference: 'ACH-2025-07-003',
    counterparty: 'Vendor Solutions LLC',
    createdAt: '2025-07-09T11:00:00Z',
  },
  {
    id: 'txn_004',
    accountId: 'acct_001',
    customerName: 'Michael Chen',
    type: 'crypto_deposit',
    status: 'completed',
    amount: 2500.0,
    currency: 'USD',
    description: 'Bitcoin Deposit (0.0235 BTC)',
    reference: 'CRY-2025-07-004',
    counterparty: 'Bitcoin Network',
    createdAt: '2025-07-08T22:15:00Z',
    settledAt: '2025-07-08T22:45:00Z',
    network: 'Bitcoin',
  },
  {
    id: 'txn_005',
    accountId: 'acct_007',
    customerName: 'Robert Kim',
    type: 'card_purchase',
    status: 'completed',
    amount: 156.78,
    currency: 'USD',
    description: 'Whole Foods Market #10234',
    reference: 'CRD-2025-07-005',
    counterparty: 'Whole Foods Market',
    createdAt: '2025-07-09T07:12:00Z',
    settledAt: '2025-07-09T07:12:00Z',
  },
  {
    id: 'txn_006',
    accountId: 'acct_003',
    customerName: 'Sarah Williams',
    type: 'swift',
    status: 'processing',
    amount: 25000.0,
    currency: 'USD',
    description: 'SWIFT Transfer to Barclays London',
    reference: 'SWF-2025-07-006',
    counterparty: 'Barclays Bank PLC',
    createdAt: '2025-07-09T06:00:00Z',
    network: 'SWIFT',
  },
  {
    id: 'txn_007',
    accountId: 'acct_008',
    customerName: 'Christopher Patel',
    type: 'internal_transfer',
    status: 'completed',
    amount: 10000.0,
    currency: 'USD',
    description: 'Transfer from Savings to Checking',
    reference: 'INT-2025-07-007',
    counterparty: 'Self Transfer',
    createdAt: '2025-07-08T16:30:00Z',
    settledAt: '2025-07-08T16:30:00Z',
  },
  {
    id: 'txn_008',
    accountId: 'acct_002',
    customerName: 'Michael Chen',
    type: 'fee',
    status: 'completed',
    amount: -12.0,
    currency: 'USD',
    description: 'Monthly Maintenance Fee',
    reference: 'FEE-2025-07-008',
    counterparty: 'Atlas Bank',
    createdAt: '2025-07-01T00:00:00Z',
    settledAt: '2025-07-01T00:00:00Z',
  },
  {
    id: 'txn_009',
    accountId: 'acct_005',
    customerName: 'David Thompson',
    type: 'crypto_withdrawal',
    status: 'failed',
    amount: 3200.0,
    currency: 'USD',
    description: 'Ethereum Withdrawal (1.2 ETH)',
    reference: 'CRY-2025-07-009',
    counterparty: 'Ethereum Network',
    createdAt: '2025-07-08T19:00:00Z',
    network: 'Ethereum',
  },
  {
    id: 'txn_010',
    accountId: 'acct_006',
    customerName: 'Amanda Foster',
    type: 'wire_incoming',
    status: 'reversed',
    amount: 15000.0,
    currency: 'USD',
    description: 'Wire from Wells Fargo - Reversed',
    reference: 'WIR-2025-07-010',
    counterparty: 'Wells Fargo ****7789',
    createdAt: '2025-06-14T10:00:00Z',
    settledAt: '2025-06-16T14:00:00Z',
  },
];

export const mockCards: readonly AdminCard[] = [
  {
    id: 'card_001',
    customerId: 'cust_001',
    customerName: 'Michael Chen',
    last4: '4521',
    brand: 'visa',
    type: 'physical',
    status: 'active',
    limit: 10000,
    spent: 3240.5,
    currency: 'USD',
    issuedAt: '2024-04-01',
    expiresAt: '2028-04-01',
    lastUsedAt: '2025-07-09T07:12:00Z',
  },
  {
    id: 'card_002',
    customerId: 'cust_002',
    customerName: 'Sarah Williams',
    last4: '9102',
    brand: 'mastercard',
    type: 'virtual',
    status: 'active',
    limit: 5000,
    spent: 1890.25,
    currency: 'USD',
    issuedAt: '2024-05-15',
    expiresAt: '2027-05-15',
    lastUsedAt: '2025-07-08T22:00:00Z',
  },
  {
    id: 'card_003',
    customerId: 'cust_005',
    customerName: 'David Thompson',
    last4: '6678',
    brand: 'visa',
    type: 'physical',
    status: 'active',
    limit: 25000,
    spent: 8750.0,
    currency: 'USD',
    issuedAt: '2023-12-01',
    expiresAt: '2027-12-01',
    lastUsedAt: '2025-07-08T21:30:00Z',
  },
  {
    id: 'card_004',
    customerId: 'cust_006',
    customerName: 'Amanda Foster',
    last4: '2245',
    brand: 'visa',
    type: 'physical',
    status: 'frozen',
    limit: 5000,
    spent: 4890.0,
    currency: 'USD',
    issuedAt: '2024-03-01',
    expiresAt: '2028-03-01',
    lastUsedAt: '2025-06-15T10:00:00Z',
  },
  {
    id: 'card_005',
    customerId: 'cust_007',
    customerName: 'Robert Kim',
    last4: '8891',
    brand: 'mastercard',
    type: 'physical',
    status: 'active',
    limit: 15000,
    spent: 5120.75,
    currency: 'USD',
    issuedAt: '2024-10-01',
    expiresAt: '2028-10-01',
    lastUsedAt: '2025-07-09T07:12:00Z',
  },
  {
    id: 'card_006',
    customerId: 'cust_009',
    customerName: 'Christopher Patel',
    last4: '5567',
    brand: 'amex',
    type: 'virtual',
    status: 'active',
    limit: 20000,
    spent: 2340.0,
    currency: 'USD',
    issuedAt: '2024-01-15',
    expiresAt: '2027-01-15',
    lastUsedAt: '2025-07-07T14:00:00Z',
  },
];

export const mockCryptoAssets: readonly AdminCryptoAsset[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 108420.5,
    change24h: 2.34,
    totalHeld: 12.45,
    totalValueUsd: 1349834.23,
    holders: 847,
    pendingDeposits: 3,
    pendingWithdrawals: 1,
    network: 'Bitcoin',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2680.75,
    change24h: -1.12,
    totalHeld: 156.89,
    totalValueUsd: 420574.7,
    holders: 623,
    pendingDeposits: 5,
    pendingWithdrawals: 2,
    network: 'Ethereum',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    price: 1.0,
    change24h: 0.01,
    totalHeld: 2450000,
    totalValueUsd: 2450000.0,
    holders: 1245,
    pendingDeposits: 12,
    pendingWithdrawals: 8,
    network: 'Ethereum',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price: 168.42,
    change24h: 5.67,
    totalHeld: 8920,
    totalValueUsd: 1502326.4,
    holders: 342,
    pendingDeposits: 1,
    pendingWithdrawals: 0,
    network: 'Solana',
  },
  {
    symbol: 'XRP',
    name: 'Ripple',
    price: 2.34,
    change24h: -0.45,
    totalHeld: 542000,
    totalValueUsd: 1268280.0,
    holders: 289,
    pendingDeposits: 0,
    pendingWithdrawals: 1,
    network: 'XRP Ledger',
  },
];

export const mockInvestments: readonly AdminInvestment[] = [
  {
    id: 'inv_001',
    customerId: 'cust_002',
    customerName: 'Sarah Williams',
    asset: 'Apple Inc.',
    ticker: 'AAPL',
    shares: 150,
    avgCost: 178.5,
    currentPrice: 214.8,
    value: 32220.0,
    gainLoss: 5445.0,
    gainLossPercent: 20.32,
    status: 'active',
  },
  {
    id: 'inv_002',
    customerId: 'cust_005',
    customerName: 'David Thompson',
    asset: 'NVIDIA Corp.',
    ticker: 'NVDA',
    shares: 50,
    avgCost: 485.0,
    currentPrice: 1340.5,
    value: 67025.0,
    gainLoss: 42775.0,
    gainLossPercent: 176.39,
    status: 'active',
  },
  {
    id: 'inv_003',
    customerId: 'cust_005',
    customerName: 'David Thompson',
    asset: 'Vanguard S&P 500 ETF',
    ticker: 'VOO',
    shares: 200,
    avgCost: 395.0,
    currentPrice: 512.3,
    value: 102460.0,
    gainLoss: 23460.0,
    gainLossPercent: 29.7,
    status: 'active',
  },
  {
    id: 'inv_004',
    customerId: 'cust_009',
    customerName: 'Christopher Patel',
    asset: 'Microsoft Corp.',
    ticker: 'MSFT',
    shares: 80,
    avgCost: 320.0,
    currentPrice: 468.5,
    value: 37480.0,
    gainLoss: 11880.0,
    gainLossPercent: 46.41,
    status: 'active',
  },
  {
    id: 'inv_005',
    customerId: 'cust_001',
    customerName: 'Michael Chen',
    asset: 'Tesla Inc.',
    ticker: 'TSLA',
    shares: 25,
    avgCost: 245.0,
    currentPrice: 268.4,
    value: 6710.0,
    gainLoss: 585.0,
    gainLossPercent: 9.55,
    status: 'active',
  },
];

export const mockLoans: readonly AdminLoan[] = [
  {
    id: 'loan_001',
    customerId: 'cust_005',
    customerName: 'David Thompson',
    type: 'business',
    amount: 250000,
    outstanding: 187500,
    interestRate: 6.75,
    term: 60,
    monthlyPayment: 4925.3,
    status: 'active',
    riskGrade: 'A',
    originatedAt: '2024-01-15',
    nextPaymentAt: '2025-08-01',
  },
  {
    id: 'loan_002',
    customerId: 'cust_001',
    customerName: 'Michael Chen',
    type: 'auto',
    amount: 45000,
    outstanding: 32100,
    interestRate: 5.25,
    term: 48,
    monthlyPayment: 1042.5,
    status: 'active',
    riskGrade: 'A',
    originatedAt: '2024-06-01',
    nextPaymentAt: '2025-08-01',
  },
  {
    id: 'loan_003',
    customerId: 'cust_003',
    customerName: 'James Rodriguez',
    type: 'personal',
    amount: 25000,
    outstanding: 18750,
    interestRate: 8.99,
    term: 36,
    monthlyPayment: 794.2,
    status: 'active',
    riskGrade: 'B',
    originatedAt: '2024-09-01',
    nextPaymentAt: '2025-08-01',
  },
  {
    id: 'loan_004',
    customerId: 'cust_004',
    customerName: 'Emily Nakamura',
    type: 'personal',
    amount: 15000,
    outstanding: 15000,
    interestRate: 9.5,
    term: 24,
    monthlyPayment: 687.5,
    status: 'pending',
    riskGrade: 'C',
    originatedAt: '2025-07-05',
    nextPaymentAt: '2025-09-01',
  },
  {
    id: 'loan_005',
    customerId: 'cust_007',
    customerName: 'Robert Kim',
    type: 'mortgage',
    amount: 450000,
    outstanding: 428000,
    interestRate: 6.25,
    term: 360,
    monthlyPayment: 2772.0,
    status: 'active',
    riskGrade: 'A',
    originatedAt: '2023-06-01',
    nextPaymentAt: '2025-08-01',
  },
];

export const mockNotifications: readonly AdminNotification[] = [
  {
    id: 'notif_001',
    type: 'transaction',
    channel: 'email',
    recipient: 'michael.chen@gmail.com',
    subject: 'Deposit Confirmed: $5,200.00 from Acme Corp',
    status: 'opened',
    sentAt: '2025-07-09T09:05:00Z',
    deliveredAt: '2025-07-09T09:05:12Z',
    openedAt: '2025-07-09T09:12:00Z',
  },
  {
    id: 'notif_002',
    type: 'security',
    channel: 'sms',
    recipient: '+1 (212) 555-0198',
    subject: 'Wire transfer of $12,500.00 initiated',
    status: 'delivered',
    sentAt: '2025-07-09T08:31:00Z',
    deliveredAt: '2025-07-09T08:31:45Z',
  },
  {
    id: 'notif_003',
    type: 'compliance',
    channel: 'email',
    recipient: 'amanda.foster@icloud.com',
    subject: 'Account Suspended - Action Required',
    status: 'delivered',
    sentAt: '2025-06-15T10:05:00Z',
    deliveredAt: '2025-06-15T10:05:30Z',
  },
  {
    id: 'notif_004',
    type: 'system',
    channel: 'push',
    recipient: 'dthompson@yahoo.com',
    subject: 'Crypto withdrawal failed: ETH network congestion',
    status: 'sent',
    sentAt: '2025-07-08T19:05:00Z',
  },
  {
    id: 'notif_005',
    type: 'transaction',
    channel: 'email',
    recipient: 'r.kim@gmail.com',
    subject: 'Card Purchase: $156.78 at Whole Foods Market',
    status: 'opened',
    sentAt: '2025-07-09T07:15:00Z',
    deliveredAt: '2025-07-09T07:15:18Z',
    openedAt: '2025-07-09T07:20:00Z',
  },
  {
    id: 'notif_006',
    type: 'marketing',
    channel: 'email',
    recipient: 'jen.obrien@outlook.com',
    subject: 'New: Earn up to 4.5% APY on your savings',
    status: 'opened',
    sentAt: '2025-07-07T12:00:00Z',
    deliveredAt: '2025-07-07T12:00:45Z',
    openedAt: '2025-07-07T14:30:00Z',
  },
];

export const mockAuditLog: readonly AdminAuditEntry[] = [
  {
    id: 'audit_001',
    actor: 'Sarah Mitchell',
    actorRole: 'Compliance Officer',
    action: 'account.freeze',
    resource: 'account',
    resourceId: 'acct_006',
    details: 'Frozen account for Amanda Foster due to suspicious wire activity',
    ipAddress: '10.0.1.45',
    userAgent: 'Mozilla/5.0 Chrome/126',
    timestamp: '2025-06-15T09:58:00Z',
    severity: 'critical',
  },
  {
    id: 'audit_002',
    actor: 'System',
    actorRole: 'Automated',
    action: 'transaction.reverse',
    resource: 'transaction',
    resourceId: 'txn_010',
    details: 'Auto-reversed incoming wire due to source compliance flag',
    ipAddress: '10.0.0.1',
    userAgent: 'Atlas-Engine/1.0',
    timestamp: '2025-06-16T14:00:00Z',
    severity: 'critical',
  },
  {
    id: 'audit_003',
    actor: 'James Cooper',
    actorRole: 'Support Agent',
    action: 'customer.update',
    resource: 'customer',
    resourceId: 'cust_004',
    details: 'Updated KYC documents for Emily Nakamura - passport submitted',
    ipAddress: '10.0.1.22',
    userAgent: 'Mozilla/5.0 Firefox/128',
    timestamp: '2025-07-01T14:30:00Z',
    severity: 'info',
  },
  {
    id: 'audit_004',
    actor: 'System',
    actorRole: 'Automated',
    action: 'kyc.reject',
    resource: 'customer',
    resourceId: 'cust_008',
    details: 'KYC verification failed for Lisa Martinez - blurry document image',
    ipAddress: '10.0.0.1',
    userAgent: 'Atlas-Engine/1.0',
    timestamp: '2025-06-29T08:00:00Z',
    severity: 'warning',
  },
  {
    id: 'audit_005',
    actor: 'Admin Root',
    actorRole: 'Super Admin',
    action: 'user.login',
    resource: 'session',
    resourceId: 'sess_445',
    details: 'Admin login from new device (MacBook Pro, San Francisco)',
    ipAddress: '72.14.203.10',
    userAgent: 'Mozilla/5.0 Safari/18',
    timestamp: '2025-07-09T08:00:00Z',
    severity: 'info',
  },
  {
    id: 'audit_006',
    actor: 'Sarah Mitchell',
    actorRole: 'Compliance Officer',
    action: 'card.freeze',
    resource: 'card',
    resourceId: 'card_004',
    details: 'Froze card ending 2245 for Amanda Foster',
    ipAddress: '10.0.1.45',
    userAgent: 'Mozilla/5.0 Chrome/126',
    timestamp: '2025-06-15T10:02:00Z',
    severity: 'warning',
  },
  {
    id: 'audit_007',
    actor: 'System',
    actorRole: 'Automated',
    action: 'loan.approve',
    resource: 'loan',
    resourceId: 'loan_004',
    details: 'Loan application for Emily Nakamura moved to pending review ($15,000)',
    ipAddress: '10.0.0.1',
    userAgent: 'Atlas-Engine/1.0',
    timestamp: '2025-07-05T14:00:00Z',
    severity: 'info',
  },
  {
    id: 'audit_008',
    actor: 'James Cooper',
    actorRole: 'Support Agent',
    action: 'customer.note',
    resource: 'customer',
    resourceId: 'cust_003',
    details: 'Added internal note: Customer requested wire limit increase to $50k',
    ipAddress: '10.0.1.22',
    userAgent: 'Mozilla/5.0 Firefox/128',
    timestamp: '2025-07-08T11:30:00Z',
    severity: 'info',
  },
];

export const mockDashboardMetrics: AdminDashboardMetrics = {
  totalRevenue: 2847500,
  revenueChange: 12.4,
  totalDeposits: 18450000,
  depositsChange: 8.7,
  totalWithdrawals: 12340000,
  withdrawalsChange: 5.2,
  totalUsers: 12847,
  usersChange: 15.3,
  transactionVolume: 45230000,
  transactionVolumeChange: 22.1,
  cryptoAssetsUnderManagement: 6991195,
  cryptoChange: 18.5,
  loanPortfolio: 4580000,
  loanChange: -3.2,
  activeCards: 8432,
  cardsChange: 11.8,
};

export const mockSystemHealth: SystemHealth = {
  api: 'operational',
  database: 'operational',
  redis: 'operational',
  paymentProcessor: 'operational',
  cryptoNode: 'degraded',
  emailService: 'operational',
  uptime: 99.97,
  responseTime: 45,
  errorRate: 0.02,
};

export interface ActivityEntry {
  readonly id: string;
  readonly action: string;
  readonly description: string;
  readonly timestamp: string;
  readonly ipAddress: string;
  readonly device: string;
}

export interface CustomerAlert {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly severity: 'info' | 'warning' | 'critical';
  readonly status: 'active' | 'resolved' | 'acknowledged';
  readonly createdAt: string;
  readonly resolvedAt?: string;
}

export const mockActivityLog: readonly ActivityEntry[] = [
  {
    id: 'act-1',
    action: 'Login',
    description: 'Successful login from Chrome on Windows',
    timestamp: '2026-07-08T14:30:00Z',
    ipAddress: '192.168.1.100',
    device: 'Chrome / Windows',
  },
  {
    id: 'act-2',
    action: 'Transfer Initiated',
    description: 'ACH transfer of $2,500 to external account',
    timestamp: '2026-07-08T13:15:00Z',
    ipAddress: '192.168.1.100',
    device: 'Chrome / Windows',
  },
  {
    id: 'act-3',
    action: 'Password Changed',
    description: 'Password updated successfully',
    timestamp: '2026-07-07T10:00:00Z',
    ipAddress: '192.168.1.100',
    device: 'Chrome / Windows',
  },
  {
    id: 'act-4',
    action: 'Card Activated',
    description: 'Virtual card ending in 4829 activated',
    timestamp: '2026-07-06T16:45:00Z',
    ipAddress: '10.0.0.55',
    device: 'Safari / iOS',
  },
  {
    id: 'act-5',
    action: 'KYC Document Uploaded',
    description: 'Government-issued ID submitted for verification',
    timestamp: '2026-07-05T09:20:00Z',
    ipAddress: '192.168.1.100',
    device: 'Chrome / Windows',
  },
];

export const mockAlerts: readonly CustomerAlert[] = [
  {
    id: 'cust-alert-1',
    title: 'Unusual Login Location',
    description: 'Login detected from new IP address in a different state',
    severity: 'warning',
    status: 'active',
    createdAt: '2026-07-08T14:30:00Z',
  },
  {
    id: 'cust-alert-2',
    title: 'Large Transaction Flag',
    description: 'Single transaction exceeding $10,000 threshold triggered review',
    severity: 'critical',
    status: 'acknowledged',
    createdAt: '2026-07-07T11:00:00Z',
  },
  {
    id: 'cust-alert-3',
    title: 'Multiple Failed Logins',
    description: '5 failed login attempts detected within 10 minutes',
    severity: 'warning',
    status: 'resolved',
    createdAt: '2026-07-01T08:00:00Z',
    resolvedAt: '2026-07-01T08:15:00Z',
  },
];

export const mockSystemAlerts: readonly SystemAlert[] = [
  {
    id: 'alert_001',
    severity: 'warning',
    message: 'Solana RPC node experiencing intermittent timeouts',
    source: 'crypto-node-sol',
    timestamp: '2025-07-09T08:30:00Z',
    resolved: false,
  },
  {
    id: 'alert_002',
    severity: 'info',
    message: 'Scheduled maintenance: Database vacuum at 02:00 UTC',
    source: 'postgres-primary',
    timestamp: '2025-07-09T06:00:00Z',
    resolved: false,
  },
  {
    id: 'alert_003',
    severity: 'critical',
    message: 'Failed crypto withdrawal batch (3 transactions) - ETH network congestion',
    source: 'payment-processor',
    timestamp: '2025-07-08T19:00:00Z',
    resolved: true,
  },
  {
    id: 'alert_004',
    severity: 'info',
    message: 'Daily reconciliation completed successfully',
    source: 'reconciliation-engine',
    timestamp: '2025-07-09T00:05:00Z',
    resolved: true,
  },
];

// ─── Chart Data ─────────────────────────────────────────

export const revenueChartData = [
  { month: 'Jan', revenue: 212000, deposits: 1450000 },
  { month: 'Feb', revenue: 198000, deposits: 1380000 },
  { month: 'Mar', revenue: 234000, deposits: 1520000 },
  { month: 'Apr', revenue: 245000, deposits: 1610000 },
  { month: 'May', revenue: 258000, deposits: 1690000 },
  { month: 'Jun', revenue: 271000, deposits: 1750000 },
  { month: 'Jul', revenue: 284000, deposits: 1845000 },
];

export const transactionVolumeData = [
  { day: 'Mon', count: 1245, volume: 4200000 },
  { day: 'Tue', count: 1389, volume: 5100000 },
  { day: 'Wed', count: 1456, volume: 5800000 },
  { day: 'Thu', count: 1523, volume: 6200000 },
  { day: 'Fri', count: 1687, volume: 7400000 },
  { day: 'Sat', count: 845, volume: 2800000 },
  { day: 'Sun', count: 623, volume: 1900000 },
];

export const transactionTypeDistribution = [
  { type: 'ACH Deposits', count: 4521, percentage: 35 },
  { type: 'ACH Withdrawals', count: 3210, percentage: 25 },
  { type: 'Wire Transfers', count: 1928, percentage: 15 },
  { type: 'Card Purchases', count: 2571, percentage: 20 },
  { type: 'Crypto', count: 643, percentage: 5 },
];

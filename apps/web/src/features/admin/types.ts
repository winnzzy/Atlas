export type AdminRole =
  'SUPPORT' | 'OPERATIONS' | 'COMPLIANCE' | 'FINANCE' | 'ADMIN' | 'SUPER_ADMIN';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
export type NotificationType =
  | 'ACCOUNT'
  | 'TRANSACTION'
  | 'TRANSFER'
  | 'CARD'
  | 'INVESTMENT'
  | 'SECURITY'
  | 'SYSTEM'
  | 'MARKETING';

export type Pagination = {
  readonly limit?: number;
  readonly offset?: number;
};

export type AdminDashboardOverview = {
  readonly totalCustomers: number;
  readonly activeAccounts: number;
  readonly totalDeposits: number;
  readonly totalTransfers: number;
  readonly totalCardTransactions: number;
  readonly totalInvestments: number;
  readonly pendingApprovals: number;
  readonly pendingNotifications: number;
  readonly dailyVolume: number;
  readonly monthlyVolume: number;
  readonly revenue: number;
  readonly systemHealth: Record<string, string | number>;
};

export type AdminAnalytics = {
  readonly dailyKpis: Record<string, number>;
  readonly monthlyKpis: Record<string, number>;
  readonly growth: Record<string, number>;
  readonly volume: Record<string, number>;
  readonly assetsUnderManagement: number;
  readonly activeUsers: number;
};

export type AdminSearchItem = {
  readonly kind: string;
  readonly id: string;
  readonly primary: string;
  readonly secondary?: string;
  readonly metadata?: Record<string, string | number | boolean | null>;
};

export type AdminSearchResult = {
  readonly items: AdminSearchItem[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
};

export type CustomerListItem = {
  readonly id: string;
  readonly email: string;
  readonly phone?: string | null;
  readonly firstName: string;
  readonly lastName: string;
  readonly status: string;
  readonly kycStatus?: string;
};

export type CustomerListResponse = {
  readonly items: CustomerListItem[];
  readonly total: number;
};

export type AccountAdminAction = 'FREEZE' | 'UNFREEZE' | 'LOCK' | 'UNLOCK' | 'CLOSE' | 'ARCHIVE';
export type CardAdminAction = 'ISSUE' | 'FREEZE' | 'UNFREEZE' | 'REPLACE' | 'CANCEL' | 'REVEAL_PAN';
export type CustomerAction = 'SUSPEND' | 'REACTIVATE' | 'FREEZE';

export type TransactionSearchResult = {
  readonly items: Array<{
    readonly id: string;
    readonly reference: string;
    readonly type: string;
    readonly status: string;
    readonly accountId: string;
    readonly amount: string;
    readonly currency: string;
    readonly description?: string;
    readonly createdAt: string;
  }>;
  readonly totalCount: number;
  readonly limit: number;
  readonly nextCursor?: string;
};

export type TransferSearchResult = {
  readonly items: Array<{
    readonly id: string;
    readonly reference?: string;
    readonly type: string;
    readonly status: string;
    readonly sourceAccountId: string;
    readonly amount: string;
    readonly currency: string;
    readonly beneficiaryName?: string;
    readonly swiftCode?: string;
    readonly createdAt: string;
  }>;
  readonly totalCount: number;
  readonly limit: number;
  readonly nextCursor?: string;
};

export type NotificationQueueItem = {
  readonly id: string;
  readonly recipientId: string;
  readonly type: NotificationType;
  readonly status: string;
  readonly channel: NotificationChannel;
  readonly createdAt: string;
};

export type NotificationQueueResponse = {
  readonly items: NotificationQueueItem[];
  readonly total: number;
};

export type AdminAuditResponse = {
  readonly items: Array<Record<string, unknown>>;
  readonly total: number;
};

export type AdminSettings = {
  readonly supportedAssets: string[];
  readonly currencies: string[];
  readonly networks: string[];
  readonly limits: Record<string, number>;
  readonly featureFlags: Record<string, boolean>;
  readonly environment: Record<string, string | boolean>;
  readonly maintenanceMode: boolean;
};

export type AdminReport = {
  readonly kind: string;
  readonly generatedAt: string;
  readonly rows: Array<Record<string, string | number | boolean | null>>;
};

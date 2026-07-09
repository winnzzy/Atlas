/** Supported fiat currencies */
export type FiatCurrency = 'USD' | 'EUR' | 'GBP' | 'CAD';

/** Supported cryptocurrency symbols */
export type CryptoSymbol = 'BTC' | 'ETH' | 'USDC' | 'USDT' | 'SOL' | 'ADA';

/** Transaction direction */
export type TransactionDirection = 'credit' | 'debit';

/** Transaction status */
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'reversed';

/** Account type */
export type AccountType = 'checking' | 'savings' | 'investment' | 'crypto';

/** Account status */
export type AccountStatus = 'active' | 'frozen' | 'closed';

/** Activity action type */
export type ActivityAction =
  | 'login'
  | 'transfer_sent'
  | 'transfer_received'
  | 'card_created'
  | 'card_locked'
  | 'settings_changed'
  | 'password_changed'
  | 'kyc_verified';

// ─── Core Data Shapes ──────────────────────────────────

export interface Money {
  readonly amount: number;
  readonly currency: FiatCurrency;
}

export interface CryptoAmount {
  readonly amount: number;
  readonly symbol: CryptoSymbol;
  readonly usdValue: number;
}

export interface Transaction {
  readonly id: string;
  readonly description: string;
  readonly direction: TransactionDirection;
  readonly money: Money;
  readonly status: TransactionStatus;
  readonly category: string;
  readonly date: string;
  readonly merchantName?: string;
  readonly merchantLogo?: string;
  readonly reference?: string;
}

export interface BankAccount {
  readonly id: string;
  readonly name: string;
  readonly type: AccountType;
  readonly status: AccountStatus;
  readonly balance: Money;
  readonly availableBalance: Money;
  readonly accountNumber: string;
  readonly routingNumber?: string;
  readonly currency: FiatCurrency;
}

export interface CryptoAsset {
  readonly symbol: CryptoSymbol;
  readonly name: string;
  readonly balance: CryptoAmount;
  readonly price: Money;
  readonly priceChange24h: number;
  readonly priceChangePercent24h: number;
  readonly iconUrl?: string;
}

export interface ActivityItem {
  readonly id: string;
  readonly action: ActivityAction;
  readonly description: string;
  readonly timestamp: string;
  readonly actor?: string;
  readonly metadata?: Record<string, string>;
}

export interface DateRange {
  readonly from: Date;
  readonly to: Date;
}

export interface StatDataPoint {
  readonly label: string;
  readonly value: number;
}

// ─── Component Prop Types ──────────────────────────────

export type AmountSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type TrendDirection = 'up' | 'down' | 'flat';

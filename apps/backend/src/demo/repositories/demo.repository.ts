import { Injectable } from '@nestjs/common';
import type { DemoScenarioId } from '../dto';

interface DemoCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'ACTIVE' | 'SUSPENDED';
  scenarioId: DemoScenarioId;
}

interface DemoAccount {
  id: string;
  customerId: string;
  accountNumber: string;
  status: 'ACTIVE' | 'FROZEN';
  balance: number;
  scenarioId: DemoScenarioId;
}

interface DemoCard {
  id: string;
  customerId: string;
  accountId: string;
  last4: string;
  status: 'ACTIVE' | 'FROZEN' | 'CANCELLED' | 'REPLACED';
  scenarioId: DemoScenarioId;
}

interface DemoTransaction {
  id: string;
  accountId: string;
  type: string;
  amount: number;
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
  scenarioId: DemoScenarioId;
}

interface DemoTransfer {
  id: string;
  accountId: string;
  network: 'ACH' | 'WIRE' | 'SWIFT';
  amount: number;
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
  scenarioId: DemoScenarioId;
}

interface DemoInvestment {
  id: string;
  customerId: string;
  symbol: string;
  quantity: number;
  price: number;
  scenarioId: DemoScenarioId;
}

interface DemoNotification {
  id: string;
  customerId: string;
  type: string;
  status: 'QUEUED' | 'DELIVERED' | 'FAILED';
  scenarioId: DemoScenarioId;
}

interface DemoAdminUser {
  id: string;
  email: string;
  role: 'SUPPORT' | 'OPERATIONS' | 'COMPLIANCE' | 'FINANCE' | 'ADMIN' | 'SUPER_ADMIN';
}

export interface DemoState {
  customers: DemoCustomer[];
  accounts: DemoAccount[];
  cards: DemoCard[];
  transactions: DemoTransaction[];
  transfers: DemoTransfer[];
  investments: DemoInvestment[];
  notifications: DemoNotification[];
  adminUsers: DemoAdminUser[];
  generatedAt: string;
}

@Injectable()
export class DemoRepository {
  private state: DemoState = this.emptyState();

  reset(): DemoState {
    this.state = this.emptyState();
    return this.snapshot();
  }

  loadScenario(scenarioId: DemoScenarioId): DemoState {
    const seed = this.seedForScenario(scenarioId);
    this.state.customers.push(...seed.customers);
    this.state.accounts.push(...seed.accounts);
    this.state.cards.push(...seed.cards);
    this.state.transactions.push(...seed.transactions);
    this.state.transfers.push(...seed.transfers);
    this.state.investments.push(...seed.investments);
    this.state.notifications.push(...seed.notifications);

    if (this.state.adminUsers.length === 0) {
      this.state.adminUsers = this.defaultAdminUsers();
    }

    this.state.generatedAt = new Date().toISOString();
    return this.snapshot();
  }

  getState(): DemoState {
    return this.snapshot();
  }

  updateState(mutator: (state: DemoState) => void): DemoState {
    mutator(this.state);
    this.state.generatedAt = new Date().toISOString();
    return this.snapshot();
  }

  private emptyState(): DemoState {
    return {
      customers: [],
      accounts: [],
      cards: [],
      transactions: [],
      transfers: [],
      investments: [],
      notifications: [],
      adminUsers: this.defaultAdminUsers(),
      generatedAt: new Date().toISOString(),
    };
  }

  private defaultAdminUsers(): DemoAdminUser[] {
    return [
      { id: 'demo-admin-support', email: 'support@atlas.demo', role: 'SUPPORT' },
      { id: 'demo-admin-ops', email: 'operations@atlas.demo', role: 'OPERATIONS' },
      { id: 'demo-admin-compliance', email: 'compliance@atlas.demo', role: 'COMPLIANCE' },
      { id: 'demo-admin-finance', email: 'finance@atlas.demo', role: 'FINANCE' },
      { id: 'demo-admin-admin', email: 'admin@atlas.demo', role: 'ADMIN' },
      { id: 'demo-admin-super', email: 'super@atlas.demo', role: 'SUPER_ADMIN' },
    ];
  }

  private seedForScenario(scenarioId: DemoScenarioId): Omit<DemoState, 'adminUsers' | 'generatedAt'> {
    const idSuffix = scenarioId.slice(-2);
    const customerId = `demo-customer-${idSuffix}`;
    const accountId = `demo-account-${idSuffix}`;
    const cardId = `demo-card-${idSuffix}`;

    const scenarioMap: Record<DemoScenarioId, { name: string; accountStatus: 'ACTIVE' | 'FROZEN'; transferNetwork: 'ACH' | 'WIRE' | 'SWIFT'; txAmount: number; symbol: string }> = {
      SCENARIO_1_NEW_CUSTOMER: { name: 'New Customer', accountStatus: 'ACTIVE', transferNetwork: 'ACH', txAmount: 250, symbol: 'BTC' },
      SCENARIO_2_HIGH_NET_WORTH: { name: 'High Net Worth Customer', accountStatus: 'ACTIVE', transferNetwork: 'WIRE', txAmount: 150000, symbol: 'ETH' },
      SCENARIO_3_BUSINESS_CUSTOMER: { name: 'Business Customer', accountStatus: 'ACTIVE', transferNetwork: 'ACH', txAmount: 12000, symbol: 'USDC' },
      SCENARIO_4_CRYPTO_INVESTOR: { name: 'Crypto Investor', accountStatus: 'ACTIVE', transferNetwork: 'WIRE', txAmount: 42000, symbol: 'SOL' },
      SCENARIO_5_FROZEN_ACCOUNT: { name: 'Frozen Account', accountStatus: 'FROZEN', transferNetwork: 'ACH', txAmount: 700, symbol: 'BTC' },
      SCENARIO_6_FRAUD_INVESTIGATION: { name: 'Fraud Investigation', accountStatus: 'FROZEN', transferNetwork: 'SWIFT', txAmount: 98000, symbol: 'ETH' },
      SCENARIO_7_CARD_REPLACEMENT: { name: 'Card Replacement', accountStatus: 'ACTIVE', transferNetwork: 'ACH', txAmount: 320, symbol: 'USDT' },
      SCENARIO_8_LARGE_WIRE_TRANSFER: { name: 'Large Wire Transfer', accountStatus: 'ACTIVE', transferNetwork: 'WIRE', txAmount: 500000, symbol: 'BTC' },
    };

    const config = scenarioMap[scenarioId];

    return {
      customers: [
        {
          id: customerId,
          email: `${customerId}@atlas.demo`,
          firstName: config.name.split(' ')[0] ?? 'Demo',
          lastName: config.name.split(' ').slice(1).join(' ') || 'Customer',
          status: config.accountStatus === 'FROZEN' ? 'SUSPENDED' : 'ACTIVE',
          scenarioId,
        },
      ],
      accounts: [
        {
          id: accountId,
          customerId,
          accountNumber: `10000000${idSuffix}`,
          status: config.accountStatus,
          balance: config.txAmount * 2,
          scenarioId,
        },
      ],
      cards: [
        {
          id: cardId,
          customerId,
          accountId,
          last4: `${1000 + Number(idSuffix)}`,
          status: scenarioId === 'SCENARIO_7_CARD_REPLACEMENT' ? 'REPLACED' : 'ACTIVE',
          scenarioId,
        },
      ],
      transactions: [
        {
          id: `demo-tx-${idSuffix}`,
          accountId,
          type: 'DEPOSIT',
          amount: config.txAmount,
          status: 'COMPLETED',
          scenarioId,
        },
      ],
      transfers: [
        {
          id: `demo-transfer-${idSuffix}`,
          accountId,
          network: config.transferNetwork,
          amount: config.txAmount,
          status: scenarioId === 'SCENARIO_6_FRAUD_INVESTIGATION' ? 'FAILED' : 'COMPLETED',
          scenarioId,
        },
      ],
      investments: [
        {
          id: `demo-investment-${idSuffix}`,
          customerId,
          symbol: config.symbol,
          quantity: 10 + Number(idSuffix),
          price: config.txAmount / 10,
          scenarioId,
        },
      ],
      notifications: [
        {
          id: `demo-notification-${idSuffix}`,
          customerId,
          type: 'SYSTEM',
          status: 'DELIVERED',
          scenarioId,
        },
      ],
    };
  }

  private snapshot(): DemoState {
    return structuredClone(this.state);
  }
}

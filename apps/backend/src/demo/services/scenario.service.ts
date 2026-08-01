import { Injectable } from '@nestjs/common';
import type { DemoDashboardDto, DemoEntityCountDto } from '../dto';
import type { DemoRepository } from '../repositories/demo.repository';

@Injectable()
export class ScenarioService {
  constructor(private readonly repository: DemoRepository) {}

  getCounts(): DemoEntityCountDto {
    const state = this.repository.getState();
    return {
      customers: state.customers.length,
      accounts: state.accounts.length,
      cards: state.cards.length,
      transactions: state.transactions.length,
      transfers: state.transfers.length,
      investments: state.investments.length,
      notifications: state.notifications.length,
      adminUsers: state.adminUsers.length,
    };
  }

  getDashboard(): DemoDashboardDto {
    const state = this.repository.getState();
    const txVolume = state.transactions.reduce((sum, item) => sum + item.amount, 0);
    const aum = state.investments.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const customerGrowth = state.customers.length * 7;

    return {
      investorKpis: {
        customers: state.customers.length,
        activeAccounts: state.accounts.filter((x) => x.status === 'ACTIVE').length,
        transactions: state.transactions.length,
        transfers: state.transfers.length,
      },
      growthCharts: [
        { label: 'M-2', value: customerGrowth * 0.7 },
        { label: 'M-1', value: customerGrowth * 0.85 },
        { label: 'M', value: customerGrowth },
      ],
      aum,
      revenue: Number((txVolume * 0.001).toFixed(2)),
      customerGrowth,
      transactionVolume: txVolume,
      portfolioAllocation: this.portfolioAllocation(state.investments),
      systemHealth: {
        api: 'ok',
        simulators: 'ok',
        resetEngine: 'ok',
        loadedScenarios: state.customers.length,
      },
    };
  }

  private portfolioAllocation(
    investments: Array<{ symbol: string; quantity: number; price: number }>,
  ): Array<Record<string, number | string>> {
    const total = investments.reduce((sum, inv) => sum + inv.quantity * inv.price, 0);
    if (total <= 0) {
      return [];
    }

    const grouped = new Map<string, number>();
    for (const investment of investments) {
      grouped.set(investment.symbol, (grouped.get(investment.symbol) ?? 0) + investment.quantity * investment.price);
    }

    return Array.from(grouped.entries()).map(([symbol, value]) => ({
      symbol,
      value,
      percentage: Number(((value / total) * 100).toFixed(2)),
    }));
  }
}

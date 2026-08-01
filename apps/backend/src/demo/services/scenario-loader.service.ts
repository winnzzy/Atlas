import { Injectable } from '@nestjs/common';
import type { DemoEntityCountDto, DemoScenarioId } from '../dto';
import type { DemoRepository } from '../repositories/demo.repository';

@Injectable()
export class ScenarioLoaderService {
  constructor(private readonly repository: DemoRepository) {}

  loadScenario(scenarioId: DemoScenarioId): DemoEntityCountDto {
    const state = this.repository.loadScenario(scenarioId);
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
}

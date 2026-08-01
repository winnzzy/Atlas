import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  DemoControlActionDto,
  DemoEntityCountDto,
  DemoPriceMovementDto,
  DemoSimulatorActionDto,
} from '../dto';
import type { DemoRepository } from '../repositories/demo.repository';
import type { ScenarioService } from './scenario.service';

@Injectable()
export class DemoService {
  constructor(
    private readonly repository: DemoRepository,
    private readonly scenarioService: ScenarioService,
  ) {}

  getSnapshot() {
    return this.repository.getState();
  }

  getCounts(): DemoEntityCountDto {
    return this.scenarioService.getCounts();
  }

  getDashboard() {
    return this.scenarioService.getDashboard();
  }

  executeControl(action: DemoControlActionDto) {
    return this.repository.updateState((state) => {
      if (action.action === 'CREATE_CUSTOMER') {
        const id = `demo-customer-${randomUUID().slice(0, 8)}`;
        state.customers.push({
          id,
          email: `${id}@atlas.demo`,
          firstName: 'Investor',
          lastName: 'Prospect',
          status: 'ACTIVE',
          scenarioId: 'SCENARIO_1_NEW_CUSTOMER',
        });
        return;
      }

      const firstAccount = state.accounts[0];
      const firstCustomer = state.customers[0];

      if (!firstAccount || !firstCustomer) {
        throw new NotFoundException('No demo accounts are loaded');
      }

      if (action.action === 'FREEZE_ACCOUNT') {
        firstAccount.status = 'FROZEN';
        return;
      }

      if (action.action === 'ISSUE_CARD') {
        state.cards.push({
          id: `demo-card-${randomUUID().slice(0, 8)}`,
          customerId: firstCustomer.id,
          accountId: firstAccount.id,
          last4: `${Math.floor(Math.random() * 9000) + 1000}`,
          status: 'ACTIVE',
          scenarioId: firstCustomer.scenarioId,
        });
        return;
      }

      if (action.action === 'CANCEL_CARD') {
        const card = state.cards[0];
        if (!card) {
          throw new NotFoundException('No demo cards are available');
        }
        card.status = 'CANCELLED';
        return;
      }

      if (action.action === 'GENERATE_TRANSFER') {
        state.transfers.push({
          id: `demo-transfer-${randomUUID().slice(0, 8)}`,
          accountId: firstAccount.id,
          network: 'ACH',
          amount: Number(action.payload?.['amount'] ?? 500),
          status: 'COMPLETED',
          scenarioId: firstCustomer.scenarioId,
        });
        return;
      }

      if (action.action === 'GENERATE_TRANSACTION') {
        state.transactions.push({
          id: `demo-transaction-${randomUUID().slice(0, 8)}`,
          accountId: firstAccount.id,
          type: 'CARD_PURCHASE',
          amount: Number(action.payload?.['amount'] ?? 125),
          status: 'COMPLETED',
          scenarioId: firstCustomer.scenarioId,
        });
        return;
      }

      if (action.action === 'GENERATE_NOTIFICATION') {
        state.notifications.push({
          id: `demo-notification-${randomUUID().slice(0, 8)}`,
          customerId: firstCustomer.id,
          type: String(action.payload?.['type'] ?? 'SYSTEM'),
          status: 'QUEUED',
          scenarioId: firstCustomer.scenarioId,
        });
        return;
      }

      if (action.action === 'APPROVE_DEPOSIT') {
        state.transactions.push({
          id: `demo-transaction-${randomUUID().slice(0, 8)}`,
          accountId: firstAccount.id,
          type: 'INVESTMENT_DEPOSIT_APPROVED',
          amount: Number(action.payload?.['amount'] ?? 2000),
          status: 'COMPLETED',
          scenarioId: firstCustomer.scenarioId,
        });
        firstAccount.balance += Number(action.payload?.['amount'] ?? 2000);
        return;
      }

      if (action.action === 'APPROVE_WITHDRAWAL') {
        state.transactions.push({
          id: `demo-transaction-${randomUUID().slice(0, 8)}`,
          accountId: firstAccount.id,
          type: 'INVESTMENT_WITHDRAWAL_APPROVED',
          amount: Number(action.payload?.['amount'] ?? 1500),
          status: 'COMPLETED',
          scenarioId: firstCustomer.scenarioId,
        });
        firstAccount.balance -= Number(action.payload?.['amount'] ?? 1500);
        return;
      }

      if (action.action === 'CHANGE_ASSET_PRICE') {
        const symbol = String(action.payload?.['symbol'] ?? 'BTC');
        const nextPrice = Number(action.payload?.['price'] ?? 45000);
        const position = state.investments.find((x) => x.symbol === symbol) ?? state.investments[0];
        if (!position) {
          throw new NotFoundException('No demo investments are available');
        }
        position.price = nextPrice;
      }
    });
  }

  executeSimulator(action: DemoSimulatorActionDto) {
    return this.repository.updateState((state) => {
      const account = state.accounts[0];
      const customer = state.customers[0];
      if (!account || !customer) {
        throw new NotFoundException('No demo customer state loaded');
      }

      if (action.action === 'SIM_INCOMING_ACH') {
        state.transfers.push({ id: `sim-ach-${randomUUID().slice(0, 8)}`, accountId: account.id, network: 'ACH', amount: Number(action.payload?.['amount'] ?? 850), status: 'COMPLETED', scenarioId: customer.scenarioId });
        account.balance += Number(action.payload?.['amount'] ?? 850);
        return;
      }

      if (action.action === 'SIM_INCOMING_WIRE') {
        state.transfers.push({ id: `sim-wire-${randomUUID().slice(0, 8)}`, accountId: account.id, network: 'WIRE', amount: Number(action.payload?.['amount'] ?? 12000), status: 'COMPLETED', scenarioId: customer.scenarioId });
        account.balance += Number(action.payload?.['amount'] ?? 12000);
        return;
      }

      if (action.action === 'SIM_INVESTMENT_DEPOSIT') {
        state.transactions.push({ id: `sim-invest-dep-${randomUUID().slice(0, 8)}`, accountId: account.id, type: 'INVESTMENT_DEPOSIT', amount: Number(action.payload?.['amount'] ?? 2000), status: 'COMPLETED', scenarioId: customer.scenarioId });
        return;
      }

      if (action.action === 'SIM_INVESTMENT_WITHDRAWAL') {
        state.transactions.push({ id: `sim-invest-wd-${randomUUID().slice(0, 8)}`, accountId: account.id, type: 'INVESTMENT_WITHDRAWAL', amount: Number(action.payload?.['amount'] ?? 1250), status: 'COMPLETED', scenarioId: customer.scenarioId });
        return;
      }

      if (action.action === 'SIM_CARD_PURCHASE') {
        state.transactions.push({ id: `sim-card-buy-${randomUUID().slice(0, 8)}`, accountId: account.id, type: 'CARD_PURCHASE', amount: Number(action.payload?.['amount'] ?? 89), status: 'COMPLETED', scenarioId: customer.scenarioId });
        account.balance -= Number(action.payload?.['amount'] ?? 89);
        return;
      }

      if (action.action === 'SIM_CARD_REFUND') {
        state.transactions.push({ id: `sim-card-ref-${randomUUID().slice(0, 8)}`, accountId: account.id, type: 'CARD_REFUND', amount: Number(action.payload?.['amount'] ?? 42), status: 'COMPLETED', scenarioId: customer.scenarioId });
        account.balance += Number(action.payload?.['amount'] ?? 42);
        return;
      }

      if (action.action === 'SIM_PRICE_MOVEMENT') {
        const body = action.payload as unknown as DemoPriceMovementDto;
        const symbol = body?.symbol ?? 'BTC';
        const price = body?.price ?? 48000;
        const investment = state.investments.find((x) => x.symbol === symbol);
        if (investment) {
          investment.price = price;
        }
        return;
      }

      if (action.action === 'SIM_NOTIFICATION_DELIVERY') {
        const notification = state.notifications.find((x) => x.status === 'QUEUED') ?? state.notifications[0];
        if (notification) {
          notification.status = 'DELIVERED';
        }
      }
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import type { NotificationChannel, NotificationType} from '@prisma/client';
import { UserStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../accounts/policies/account.policy';
import { AccountService } from '../../accounts/services/account.service';
import { CardService } from '../../cards/services/card.service';
import type { CreateCardDto } from '../../cards/dto/cards.dto';
import { ApprovalService } from '../../investments/services/approval.service';
import { AssetService } from '../../investments/services/asset.service';
import { PortfolioService } from '../../investments/services/portfolio.service';
import { PricingService } from '../../investments/services/pricing.service';
import { WalletService } from '../../investments/services/wallet.service';
import type { CreateWalletDto } from '../../investments/dto/wallet.dto';
import { NotificationService } from '../../notifications/services/notification.service';
import { NotificationTemplateService } from '../../notifications/services/notification-template.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { TransactionType } from '../../transactions/enums/transaction-type.enum';
import type { SearchTransactionsDto } from '../../transactions/dto/search-transactions.dto';
import { TransferService } from '../../transfers/services/transfer.service';
import type { SearchTransfersDto } from '../../transfers/dto/search-transfers.dto';
import type {
  AccountAdminActionDto,
  CardAdminActionDto,
  CustomerQueryDto,
  CustomerStatusActionDto,
  InvestmentAdminActionDto,
  NotificationQueueQueryDto,
} from '../dto';
import { AdminRepository } from '../repositories/admin.repository';

const ADMIN_ACTOR: AuthenticatedUser = {
  id: 'admin-system',
  email: 'admin@atlas.internal',
  role: 'ADMIN',
};

@Injectable()
export class AdminOrchestrationService {
  constructor(
    private readonly repository: AdminRepository,
    private readonly accountService: AccountService,
    private readonly cardService: CardService,
    private readonly transactionService: TransactionService,
    private readonly transferService: TransferService,
    private readonly assetService: AssetService,
    private readonly walletService: WalletService,
    private readonly approvalService: ApprovalService,
    private readonly pricingService: PricingService,
    private readonly portfolioService: PortfolioService,
    private readonly notificationService: NotificationService,
    private readonly notificationTemplateService: NotificationTemplateService,
  ) {}

  getCustomers(query: CustomerQueryDto) {
    return this.repository.getCustomers(query);
  }

  getCustomerProfile(userId: string) {
    return this.repository.getCustomerGraph(userId);
  }

  getCustomerAccounts(userId: string) {
    return this.repository.getCustomerGraph(userId).then((x) => x['accounts']);
  }

  getCustomerCards(userId: string) {
    return this.repository.getCustomerGraph(userId).then((x) => x['cards']);
  }

  getCustomerInvestments(userId: string) {
    return this.repository.getCustomerGraph(userId).then((x) => x['investments']);
  }

  getCustomerTransfers(userId: string) {
    return this.repository.getCustomerGraph(userId).then((x) => x['transfers']);
  }

  getCustomerTransactions(userId: string) {
    return this.repository.getCustomerGraph(userId).then((x) => x['transactions']);
  }

  getCustomerNotifications(userId: string) {
    return this.repository.getCustomerGraph(userId).then((x) => x['notifications']);
  }

  async applyCustomerAction(userId: string, action: CustomerStatusActionDto): Promise<{ userId: string; status: string }> {
    if (action.action === 'SUSPEND') {
      await this.repository.setCustomerStatus(userId, UserStatus.SUSPENDED, action.reason);
      return { userId, status: UserStatus.SUSPENDED };
    }

    if (action.action === 'REACTIVATE') {
      await this.repository.setCustomerStatus(userId, UserStatus.ACTIVE, action.reason);
      return { userId, status: UserStatus.ACTIVE };
    }

    await this.repository.setCustomerStatus(userId, UserStatus.SUSPENDED, action.reason ?? 'frozen by admin');
    return { userId, status: UserStatus.SUSPENDED };
  }

  async resetCustomerMfa(userId: string): Promise<{ userId: string; mfaEnabled: boolean }> {
    await this.repository.resetMfa(userId);
    return { userId, mfaEnabled: false };
  }

  async resetCustomerPassword(userId: string): Promise<{ userId: string; passwordReset: boolean }> {
    await this.repository.resetPassword(userId);
    return { userId, passwordReset: true };
  }

  async applyAccountAction(accountId: string, action: AccountAdminActionDto): Promise<unknown> {
    if (action.action === 'CREDIT' || action.action === 'DEBIT') {
      if (!action.amount || !action.reason || !action.reference) {
        throw new NotFoundException('amount, reason, and reference are required for admin money operations');
      }

      return this.transactionService.createTransaction({
        accountId,
        type: action.action === 'CREDIT' ? TransactionType.DEPOSIT : TransactionType.WITHDRAWAL,
        amount: action.amount,
        currency: 'USD',
        description: `Admin ${action.action.toLowerCase()}: ${action.reason}`,
        reference: action.reference,
        metadata: {
          adminReason: action.reason,
          adminAction: action.action,
        },
      });
    }

    if (action.action === 'FREEZE') {
      return this.accountService.freezeAccount(ADMIN_ACTOR, accountId, 'FRAUD_ALERT', action.reason);
    }
    if (action.action === 'UNFREEZE') {
      return this.accountService.unfreezeAccount(ADMIN_ACTOR, accountId);
    }
    if (action.action === 'LOCK') {
      return this.accountService.lockAccount(ADMIN_ACTOR, accountId, action.reason ?? 'manual lock');
    }
    if (action.action === 'UNLOCK') {
      return this.accountService.unlockAccount(ADMIN_ACTOR, accountId);
    }
    if (action.action === 'CLOSE') {
      return this.accountService.closeAccount(ADMIN_ACTOR, accountId, 'ADMIN_ACTION');
    }

    return this.accountService.archiveAccount(ADMIN_ACTOR, accountId);
  }

  getAccountHolds(accountId: string) {
    return this.accountService.getHolds(ADMIN_ACTOR, accountId);
  }

  getAccountStatements(accountId: string, startDate?: string, endDate?: string) {
    return this.accountService.getStatements(ADMIN_ACTOR, accountId, {
      startDate,
      endDate,
    });
  }

  async applyCardAction(cardId: string, action: CardAdminActionDto): Promise<unknown> {
    if (action.action === 'ISSUE') {
      if (!action.accountId || !action.cardType) {
        throw new NotFoundException('accountId and cardType are required for card issuance');
      }

      const dto: CreateCardDto = {
        accountId: action.accountId,
        type: action.cardType as CreateCardDto['type'],
      };

      return this.cardService.issueCard(ADMIN_ACTOR, dto);
    }

    const ownerId = await this.repository.findCardOwner(cardId);
    if (!ownerId) {
      throw new NotFoundException('Card not found');
    }

    const ownerContext: AuthenticatedUser = { id: ownerId, email: `${ownerId}@atlas.local` };

    if (action.action === 'FREEZE') {
      return this.cardService.freezeCard(ownerContext, cardId, action.reason);
    }
    if (action.action === 'UNFREEZE') {
      return this.cardService.unfreezeCard(ownerContext, cardId);
    }
    if (action.action === 'REPLACE') {
      return this.cardService.replaceCard(ownerContext, cardId);
    }
    if (action.action === 'CANCEL') {
      return this.cardService.cancelCard(ownerContext, cardId, action.reason);
    }

    return this.cardService.revealCard(ownerContext, cardId);
  }

  listTransfers(query: SearchTransfersDto) {
    return this.transferService.searchTransfers(query);
  }

  async retryFailedTransfer(transferId: string): Promise<unknown> {
    return this.transferService.submitTransfer(ADMIN_ACTOR, transferId);
  }

  async cancelPendingTransfer(transferId: string, reason: string): Promise<unknown> {
    return this.transferService.cancelTransfer(ADMIN_ACTOR, transferId, reason);
  }

  async getSettlementView(query: SearchTransfersDto): Promise<unknown> {
    const result = await this.transferService.searchTransfers(query);
    return {
      ...result,
      items: result.items.filter((item) => ['COMPLETED', 'PROCESSING', 'PENDING'].includes(item.status)),
    };
  }

  searchTransactions(query: SearchTransactionsDto) {
    return this.transactionService.searchTransactions(query);
  }

  getTransactionByReference(reference: string) {
    return this.transactionService.searchTransactions({ reference, limit: 1 });
  }

  reverseTransaction(transactionId: string, reason: string) {
    return this.transactionService.reverseTransaction(transactionId, reason);
  }

  async getLedgerView(accountId: string): Promise<unknown> {
    return this.transactionService.getAccountTransactions(accountId, 100);
  }

  async getJournalView(accountId: string): Promise<unknown> {
    return this.transactionService.getAccountTransactions(accountId, 100);
  }

  async applyInvestmentAction(action: InvestmentAdminActionDto): Promise<unknown> {
    if (action.action === 'APPROVE_DEPOSIT') {
      if (!action.id) {
        throw new NotFoundException('deposit id is required');
      }
      return this.approvalService.approveDeposit(action.id, ADMIN_ACTOR.id);
    }

    if (action.action === 'APPROVE_WITHDRAWAL') {
      if (!action.id) {
        throw new NotFoundException('withdrawal id is required');
      }
      return this.approvalService.approveWithdrawal(action.id, ADMIN_ACTOR.id);
    }

    if (action.action === 'UPDATE_PRICE') {
      if (!action.symbol || action.price === undefined) {
        throw new NotFoundException('symbol and price are required');
      }
      return this.pricingService.updatePrice({ productSymbol: action.symbol, price: action.price }, ADMIN_ACTOR.id);
    }

    if (!action.id) {
      throw new NotFoundException('asset id is required');
    }

    if (action.action === 'ENABLE_ASSET') {
      return this.assetService.enableAsset(action.id, ADMIN_ACTOR.id);
    }

    if (action.action === 'DISABLE_ASSET') {
      return this.assetService.disableAsset(action.id, ADMIN_ACTOR.id);
    }

    return this.assetService.suspendAsset(action.id, ADMIN_ACTOR.id);
  }

  listWallets(productId?: string, status?: string, network?: string) {
    return this.walletService.listWallets({ productId, status, network });
  }

  createWallet(dto: CreateWalletDto) {
    return this.walletService.createWallet(dto, ADMIN_ACTOR.id);
  }

  getPortfolio(userId: string) {
    return this.portfolioService.getPortfolio(userId);
  }

  getNotificationQueue(query: NotificationQueueQueryDto) {
    return this.repository.getNotificationQueue(query);
  }

  retryNotification(notificationId: string) {
    return this.notificationService.markRead(notificationId);
  }

  previewNotificationTemplate(code: string, channel: NotificationChannel, language: string, variables: Record<string, string | number | boolean | null>) {
    return this.notificationTemplateService.preview({ code, channel, language, variables });
  }

  sendBroadcast(_type: NotificationType, _title: string, _body: string): { accepted: boolean } {
    return { accepted: true };
  }
}

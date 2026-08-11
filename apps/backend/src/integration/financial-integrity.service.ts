import { ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Decimal } from '@prisma/client/runtime/library';
import type { Request } from 'express';
import { AccountService } from '../accounts/services/account.service';
import { AccountRepository } from '../accounts/repositories/account.repository';
import type { AuthenticatedUser } from '../accounts/policies/account.policy';
import { LedgerService } from '../ledger/services/ledger.service';
import type { Journal, Posting, Hold, Reversal} from '@atlas/domain';
import { IdempotencyService } from './idempotency.service';
import { FinancialAuditService } from './financial-audit.service';
import { RequestContextService } from '../common/request-context.service';
import { PrismaService } from '../prisma/prisma.service';
import type { PostJournalDto } from '../ledger/dto/post-journal.dto';
import type { CreateHoldDto, ReleaseHoldDto } from '../ledger/dto/hold.dto';
import type { ReverseJournalDto } from '../ledger/dto/reverse-journal.dto';
import type { CreateReconciliationDto } from '../ledger/dto/reconciliation.dto';
import type { ReconciliationResultDto } from '../ledger/dto/reconciliation.dto';

type FinancialResponse<T> = { statusCode: number; body: T };

@Injectable()
export class FinancialIntegrityService {
  constructor(
    private readonly accountService: AccountService,
    private readonly accountRepository: AccountRepository,
    private readonly ledgerService: LedgerService,
    private readonly idempotencyService: IdempotencyService,
    private readonly financialAuditService: FinancialAuditService,
    private readonly requestContext: RequestContextService,
    private readonly prisma: PrismaService,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
  ) {}

  async createAccount(user: AuthenticatedUser, dto: { accountType: string; name: string; nickname?: string; currency?: string; }, request?: Request): Promise<FinancialResponse<unknown>> {
    const key = this.requestContext.get()?.idempotencyKey ?? request?.headers['idempotency-key'] as string | undefined;
    const fingerprint = this.idempotencyService.fingerprintFrom({
      method: 'POST',
      path: '/accounts',
      userId: user.id,
      body: dto,
    });

    return this.executeWithIdempotency(key, fingerprint, async () => {
      const account = await this.accountService.createAccount(user, dto as never);
      await this.financialAuditService.log({
        code: 'financial.account.created',
        name: 'Account created',
        action: 'account.created',
        resourceType: 'account',
        resourceId: account.id,
        description: `Account ${account.id} created`,
        userId: user.id,
        metadata: { accountType: dto.accountType, currency: dto.currency ?? 'USD' },
      });
      return account;
    });
  }

  async postJournal(user: AuthenticatedUser, dto: PostJournalDto, request?: Request): Promise<FinancialResponse<Journal>> {
    const key = this.requestContext.get()?.idempotencyKey ?? request?.headers['idempotency-key'] as string | undefined;
    const fingerprint = this.idempotencyService.fingerprintFrom({
      method: 'POST',
      path: '/ledger/journals',
      userId: user.id,
      body: dto,
    });

    return this.executeWithIdempotency(key, fingerprint, async () => {
      const snapshot = this.ledgerService.createSnapshot();
      try {
        await this.ensureAccountsAccessible(user, dto.lines.map((line) => line.accountId));
        const journal = await this.ledgerService.postJournal(dto);
        const postings = await this.ledgerService.findPostingsByJournalId(journal.id);
        await this.prisma.$transaction(async () => {
          await this.syncAccountBalances(postings);
          await this.financialAuditService.log({
            code: 'financial.ledger.posted',
            name: 'Ledger journal posted',
            action: 'ledger.posted',
            resourceType: 'journal',
            resourceId: journal.id.value,
            description: `Posted journal ${journal.id.value}`,
            userId: user.id,
            metadata: {
              requestId: this.requestContext.get()?.requestId,
              correlationId: this.requestContext.get()?.correlationId,
              postingCount: postings.length,
            },
          });
        });

        this.requestContext.setFinancialTransactionId(journal.id.value);
        this.eventEmitter.emit('notifications.financial', {
          type: 'ledger.posted',
          transactionId: journal.id.value,
          userId: user.id,
        });

        return journal;
      } catch (error) {
        this.ledgerService.restoreSnapshot(snapshot);
        throw error;
      }
    });
  }

  async createHold(user: AuthenticatedUser, dto: CreateHoldDto, request?: Request): Promise<FinancialResponse<Hold>> {
    const key = this.requestContext.get()?.idempotencyKey ?? request?.headers['idempotency-key'] as string | undefined;
    const fingerprint = this.idempotencyService.fingerprintFrom({
      method: 'POST',
      path: '/ledger/holds',
      userId: user.id,
      body: dto,
    });

    return this.executeWithIdempotency(key, fingerprint, async () => {
      const snapshot = this.ledgerService.createSnapshot();
      try {
        await this.ensureAccountsAccessible(user, [dto.accountId]);
        const hold = await this.ledgerService.createHold(dto);
        await this.prisma.$transaction(async () => {
          await this.applyHoldBalanceChange(dto.accountId, dto.amount, 'CREATE');
          await this.financialAuditService.log({
            code: 'financial.hold.created',
            name: 'Hold created',
            action: 'hold.created',
            resourceType: 'hold',
            resourceId: hold.id,
            description: `Hold ${hold.id} created`,
            userId: user.id,
            metadata: { accountId: dto.accountId, amount: dto.amount, currency: dto.currency ?? 'USD' },
          });
        });

        this.requestContext.setFinancialTransactionId(hold.id);
        this.eventEmitter.emit('notifications.financial', {
          type: 'hold.created',
          transactionId: hold.id,
          userId: user.id,
        });

        return hold;
      } catch (error) {
        this.ledgerService.restoreSnapshot(snapshot);
        throw error;
      }
    });
  }

  async releaseHold(user: AuthenticatedUser, holdId: string, dto: ReleaseHoldDto, request?: Request): Promise<FinancialResponse<Hold>> {
    const key = this.requestContext.get()?.idempotencyKey ?? request?.headers['idempotency-key'] as string | undefined;
    const fingerprint = this.idempotencyService.fingerprintFrom({
      method: 'PATCH',
      path: `/ledger/holds/${holdId}/release`,
      userId: user.id,
      body: dto,
    });

    return this.executeWithIdempotency(key, fingerprint, async () => {
      const snapshot = this.ledgerService.createSnapshot();
      try {
        const hold = await this.ledgerService.releaseHold(holdId, dto.releaseAmount ? { releaseAmount: dto.releaseAmount } : {});
        await this.prisma.$transaction(async () => {
          await this.applyHoldBalanceChange(hold.accountId.value, hold.releasedAmount.toDecimal(), 'RELEASE');
          await this.financialAuditService.log({
            code: 'financial.hold.released',
            name: 'Hold released',
            action: 'hold.released',
            resourceType: 'hold',
            resourceId: hold.id,
            description: `Hold ${hold.id} released`,
            userId: user.id,
            metadata: { accountId: hold.accountId.value, releasedAmount: hold.releasedAmount.toDecimal() },
          });
        });

        this.requestContext.setFinancialTransactionId(hold.id);
        this.eventEmitter.emit('notifications.financial', {
          type: 'hold.released',
          transactionId: hold.id,
          userId: user.id,
        });

        return hold;
      } catch (error) {
        this.ledgerService.restoreSnapshot(snapshot);
        throw error;
      }
    });
  }

  async reverseJournal(user: AuthenticatedUser, dto: ReverseJournalDto, request?: Request): Promise<FinancialResponse<Reversal>> {
    const key = this.requestContext.get()?.idempotencyKey ?? request?.headers['idempotency-key'] as string | undefined;
    const fingerprint = this.idempotencyService.fingerprintFrom({
      method: 'POST',
      path: `/ledger/journals/${dto.transactionId}/reverse`,
      userId: user.id,
      body: dto,
    });

    return this.executeWithIdempotency(key, fingerprint, async () => {
      const snapshot = this.ledgerService.createSnapshot();
      try {
        const reversal = await this.ledgerService.reverseJournal(dto);
        const reversalJournalId = reversal.reversalJournalId ?? reversal.originalJournalId;
        const postings = await this.ledgerService.findPostingsByJournalId(reversalJournalId);
        await this.prisma.$transaction(async () => {
          await this.syncAccountBalances(postings);
          await this.financialAuditService.log({
            code: 'financial.ledger.reversed',
            name: 'Ledger journal reversed',
            action: 'ledger.reversed',
            resourceType: 'journal',
            resourceId: reversalJournalId.value,
            description: `Reversed journal ${dto.transactionId}`,
            userId: user.id,
            metadata: {
              originalJournalId: dto.transactionId,
              reversalJournalId: reversalJournalId.value,
            },
          });
        });

        this.requestContext.setFinancialTransactionId(reversalJournalId.value);
        this.eventEmitter.emit('notifications.financial', {
          type: 'ledger.reversed',
          transactionId: reversalJournalId.value,
          userId: user.id,
        });

        return reversal;
      } catch (error) {
        this.ledgerService.restoreSnapshot(snapshot);
        throw error;
      }
    });
  }

  async reconcile(user: AuthenticatedUser, dto: CreateReconciliationDto): Promise<FinancialResponse<ReconciliationResultDto>> {
    const key = this.requestContext.get()?.idempotencyKey ?? undefined;
    const fingerprint = this.idempotencyService.fingerprintFrom({
      method: 'POST',
      path: '/ledger/reconciliation',
      userId: user.id,
      body: dto,
    });

    return this.executeWithIdempotency(key, fingerprint, async () => {
      const result = await this.ledgerService.reconcile(dto);
      await this.financialAuditService.log({
        code: 'financial.ledger.reconciled',
        name: 'Ledger reconciliation completed',
        action: 'ledger.reconciled',
        resourceType: 'reconciliation',
        resourceId: result.id,
        description: `Reconciliation ${result.id} completed`,
        userId: user.id,
        metadata: { accountId: dto.accountId, isBalanced: result.isBalanced, variance: result.variance },
      });

      return result;
    });
  }

  private async executeWithIdempotency<T>(
    key: string | undefined,
    fingerprint: string,
    handler: () => Promise<T>,
  ): Promise<FinancialResponse<T>> {
    const execution = await this.idempotencyService.execute({
      key,
      fingerprint,
      handler: async () => ({
        statusCode: 200,
        body: await handler(),
      }),
    });

    return execution.response;
  }

  private async ensureAccountsAccessible(user: AuthenticatedUser, accountIds: string[]): Promise<void> {
    for (const accountId of accountIds) {
      const account = await this.accountRepository.findByIdAndUser(accountId, user.id);
      if (!account) {
        throw new ForbiddenException(`Account ${accountId} is not accessible to user ${user.id}`);
      }

      if (account.status !== 'ACTIVE' && account.status !== 'FROZEN' && account.status !== 'LOCKED') {
        throw new ConflictException(`Account ${accountId} is not open for financial operations`);
      }
    }
  }

  private async syncAccountBalances(postings: Posting[]): Promise<void> {
    for (const posting of postings) {
      const account = await this.prisma.bankAccount.findUnique({ where: { id: posting.accountId.value } });
      if (!account) {
        throw new ConflictException(`Account ${posting.accountId.value} not found during balance sync`);
      }

      const delta = new Decimal(posting.amount.toDecimal());
      const signedDelta = posting.isDebit ? delta : delta.neg();
      const current = new Decimal(account.currentBalance.toString()).add(signedDelta);
      const available = new Decimal(account.availableBalance.toString()).add(signedDelta);

      if (current.lt(new Decimal(0)) && current.abs().gt(new Decimal(account.overdraftLimit.toString()))) {
        throw new ConflictException(`Account ${account.id} would exceed overdraft limit`);
      }

      await this.prisma.bankAccount.update({
        where: { id: account.id },
        data: {
          currentBalance: current,
          availableBalance: available,
        },
      });
    }
  }

  private async applyHoldBalanceChange(accountId: string, amountMinorUnits: string, direction: 'CREATE' | 'RELEASE'): Promise<void> {
    const account = await this.prisma.bankAccount.findUnique({ where: { id: accountId } });
    if (!account) {
      throw new ConflictException(`Account ${accountId} not found during hold sync`);
    }

    const delta = new Decimal(amountMinorUnits).div(100);
    const currentHold = new Decimal(account.holdAmount.toString());
    const currentAvailable = new Decimal(account.availableBalance.toString());

    const nextHold = direction === 'CREATE' ? currentHold.add(delta) : currentHold.sub(delta);
    const nextAvailable = direction === 'CREATE' ? currentAvailable.sub(delta) : currentAvailable.add(delta);

    await this.prisma.bankAccount.update({
      where: { id: account.id },
      data: {
        holdAmount: nextHold,
        availableBalance: nextAvailable,
      },
    });
  }
}

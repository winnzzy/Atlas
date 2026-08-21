import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, TransactionType as PrismaTransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

type TxClient = Prisma.TransactionClient;

export interface GenerateHistoryInput {
  months?: number;
  totalAmount?: string;
  transactionCount?: number;
}

interface HistoryPlanEntry {
  date: Date;
  direction: 'CREDIT' | 'DEBIT';
  type: PrismaTransactionType;
  amountCents: number;
  description: string;
  counterparty: string;
  kind: string;
}

/**
 * Backfills additional realistic transaction history for an already-open
 * account, without changing the account's current live balance. Every
 * generated batch is built so its own credits exactly equal its own debits
 * (net zero), and the account row (`currentBalance` / `availableBalance`) is
 * never written by this service — the balance genuinely cannot move, which is
 * a stronger guarantee than recomputing and reasserting the same number.
 *
 * This is deliberately a separate capability from `AdminPresentationService`
 * (which seeds an account to close at a specific target balance for initial
 * setup). This one is for backfilling additional generated transaction
 * history — call it exactly that in code, logs, and UI copy.
 */
@Injectable()
export class AdminHistoryGeneratorService {
  private readonly logger = new Logger(AdminHistoryGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  private centsToDecimal(cents: number): Decimal {
    return new Decimal(cents).div(100);
  }

  private decimalToCents(value: Decimal | string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return new Decimal(value).mul(100).toDecimalPlaces(0).toNumber();
  }

  private makeRng(seed: number): () => number {
    let state = seed >>> 0 || 1;
    return () => {
      state = (state * 1_664_525 + 1_013_904_223) >>> 0;
      return state / 0xffffffff;
    };
  }

  private async requireAccountForCustomer(client: TxClient, userId: string, accountId: string) {
    const user = await client.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    const account = await client.bankAccount.findFirst({
      where: { id: accountId, deletedAt: null },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const holder = await client.accountHolder.findFirst({ where: { accountId, userId } });
    if (!holder) {
      throw new ForbiddenException('Account does not belong to the selected customer');
    }

    return { user, account };
  }

  async generateHistory(
    userId: string,
    accountId: string,
    dto: GenerateHistoryInput,
  ): Promise<{
    accountId: string;
    batchId: string;
    transactionCount: number;
    totalCredits: string;
    totalDebits: string;
    periodStart: string;
    periodEnd: string;
  }> {
    const months = dto.months && dto.months >= 1 && dto.months <= 12 ? Math.floor(dto.months) : 6;
    const targetVolumeCents = dto.totalAmount ? this.decimalToCents(dto.totalAmount) : undefined;
    if (
      targetVolumeCents !== undefined &&
      (!Number.isFinite(targetVolumeCents) || targetVolumeCents <= 0)
    ) {
      throw new BadRequestException('totalAmount must be a positive amount');
    }
    const targetCount =
      dto.transactionCount && dto.transactionCount >= 1
        ? Math.floor(dto.transactionCount)
        : undefined;

    const batchId = randomUUID();
    const generatedAt = new Date();
    const periodEnd = new Date(generatedAt);
    const periodStart = new Date(generatedAt);
    periodStart.setMonth(periodStart.getMonth() - months);

    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          const { account } = await this.requireAccountForCustomer(tx, userId, accountId);

          const plan = this.buildPlan(
            months,
            periodStart,
            periodEnd,
            batchId,
            targetVolumeCents,
            targetCount,
          );
          if (plan.length === 0) {
            throw new BadRequestException(
              'Unable to build a history plan for the requested parameters',
            );
          }

          // The plan nets to exactly zero, so the running balance is only used to
          // produce plausible per-entry snapshots — it starts from the account's
          // current balance and, by construction, returns to it exactly.
          let runningCents = this.decimalToCents(account.currentBalance);
          let creditCents = 0;
          let debitCents = 0;
          let index = 0;

          for (const entry of plan) {
            const deltaCents =
              entry.direction === 'CREDIT' ? entry.amountCents : -entry.amountCents;
            const previous = runningCents;
            runningCents += deltaCents;
            if (deltaCents >= 0) creditCents += deltaCents;
            else debitCents += Math.abs(deltaCents);

            const transactionId = randomUUID();
            const amount = this.centsToDecimal(entry.amountCents);

            await tx.transaction.create({
              data: {
                id: transactionId,
                accountId: account.id,
                type: entry.type,
                status: 'COMPLETED',
                amount,
                currency: account.currency,
                description: entry.description,
                reference: `HIST-${batchId.slice(0, 8).toUpperCase()}-${String(index + 1).padStart(4, '0')}`,
                counterparty: entry.counterparty,
                category: entry.kind,
                settledAt: entry.date,
                createdAt: entry.date,
                updatedAt: entry.date,
                metadata: {
                  generatedHistory: true,
                  generatedHistoryMeta: {
                    batchId,
                    generatedAt: generatedAt.toISOString(),
                    kind: entry.kind,
                  },
                } as Prisma.InputJsonValue,
              },
            });

            await tx.transactionLine.create({
              data: {
                transactionId,
                entryType: entry.direction,
                accountCode: account.accountNumber,
                accountName: account.name,
                amount,
                currency: account.currency,
                description: entry.description,
              },
            });

            await tx.balanceSnapshot.create({
              data: {
                accountId: account.id,
                transactionId,
                previousBalance: this.centsToDecimal(previous),
                newBalance: this.centsToDecimal(runningCents),
                changeAmount: this.centsToDecimal(deltaCents),
              },
            });

            index += 1;
          }

          // Reconciliation: the batch must net to exactly zero, or roll back —
          // the live balance must never move as a side effect of this call.
          if (runningCents !== this.decimalToCents(account.currentBalance)) {
            throw new Error(
              `Reconciliation failed: generated history did not net to zero (drift ${runningCents - this.decimalToCents(account.currentBalance)} cents)`,
            );
          }

          return {
            accountId: account.id,
            batchId,
            transactionCount: plan.length,
            totalCredits: this.centsToDecimal(creditCents).toFixed(2),
            totalDebits: this.centsToDecimal(debitCents).toFixed(2),
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
          };
        },
        { maxWait: 20_000, timeout: 60_000 },
      );

      this.logger.log(
        `Generated additional history ${result.batchId} for account ${result.accountId}: ${result.transactionCount} txns, net-zero balance impact`,
      );
      return result;
    } catch (error) {
      const err = error as { code?: string; meta?: unknown; message?: string; stack?: string };
      this.logger.error(
        `History generation failed user=${userId} account=${accountId} code=${err?.code ?? 'n/a'} ` +
          `meta=${JSON.stringify(err?.meta ?? null)} message=${err?.message ?? String(error)}`,
        err?.stack,
      );
      throw error;
    }
  }

  /**
   * Realistic, net-zero activity spread across the period. `targetVolumeCents`
   * (when given) scales the amounts so total credits + total debits land near
   * that figure; `targetCount` (when given) scales the number of entries. A
   * single balancing entry at the end absorbs whatever remainder is needed so
   * the batch nets to exactly zero.
   */
  private buildPlan(
    months: number,
    start: Date,
    end: Date,
    batchId: string,
    targetVolumeCents: number | undefined,
    targetCount: number | undefined,
  ): HistoryPlanEntry[] {
    const seed = Number.parseInt(batchId.replace(/[^0-9a-f]/g, '').slice(0, 8), 16) || 1;
    const rng = this.makeRng(seed);
    const rand = (min: number, max: number) => Math.floor(min + rng() * (max - min + 1));

    const entries: HistoryPlanEntry[] = [];
    const windowMs = end.getTime() - start.getTime();
    const at = (fraction: number, jitterHours = 0) => {
      const base = start.getTime() + Math.max(0, Math.min(1, fraction)) * windowMs;
      const jitter = jitterHours ? (rng() - 0.5) * jitterHours * 60 * 60 * 1000 : 0;
      return new Date(base + jitter);
    };

    const cardMerchants = [
      'Grocery Market',
      'Coffee House',
      'Online Retailer',
      'Fuel Station',
      'Restaurant',
      'Pharmacy',
    ];
    const billers = [
      'Utility Provider',
      'Internet Service',
      'Mobile Carrier',
      'Insurance Premium',
      'Streaming Service',
    ];
    const pick = (list: string[]): string => list[rand(0, list.length - 1)] ?? list[0] ?? '';

    let creditTotal = 0;
    let debitTotal = 0;

    const pushCredit = (
      date: Date,
      type: PrismaTransactionType,
      amountCents: number,
      description: string,
      counterparty: string,
      kind: string,
    ) => {
      entries.push({
        date,
        direction: 'CREDIT',
        type,
        amountCents,
        description,
        counterparty,
        kind,
      });
      creditTotal += amountCents;
    };
    const pushDebit = (
      date: Date,
      type: PrismaTransactionType,
      amountCents: number,
      description: string,
      counterparty: string,
      kind: string,
    ) => {
      entries.push({
        date,
        direction: 'DEBIT',
        type,
        amountCents,
        description,
        counterparty,
        kind,
      });
      debitTotal += amountCents;
    };

    // Base entry count derived from the period, then nudged toward targetCount.
    const baseEntriesPerMonth = 6;
    const desiredEntries = targetCount ?? baseEntriesPerMonth * months;

    for (let m = 0; m < months; m += 1) {
      const monthFrac = (m + 0.5) / months;
      const perMonthTarget = Math.max(1, Math.round(desiredEntries / months));

      let created = 0;
      // Card purchases make up the bulk of a realistic month; generate enough
      // to approach the requested per-month count.
      while (created < perMonthTarget - 1 && entries.length < 490) {
        pushDebit(
          at(m / months + (0.05 + created * 0.08) / months, 8),
          'CARD_PURCHASE',
          rand(1200, 42000),
          'Card purchase',
          pick(cardMerchants),
          'card',
        );
        created += 1;
      }

      pushDebit(
        at(m / months + 0.4 / months, 5),
        'ACH_WITHDRAWAL',
        rand(4000, 26000),
        'Online bill payment',
        pick(billers),
        'bill',
      );
      pushCredit(
        at(monthFrac, 6),
        'ACH_DEPOSIT',
        rand(50000, 180000),
        'Transfer received',
        'Inbound Transfer',
        'inbound',
      );
    }

    // Scale amounts toward the requested total volume, if one was given.
    if (targetVolumeCents !== undefined) {
      const currentVolume = creditTotal + debitTotal;
      if (currentVolume > 0) {
        const scale = targetVolumeCents / currentVolume;
        for (const entry of entries) {
          entry.amountCents = Math.max(1, Math.round(entry.amountCents * scale));
        }
        creditTotal = entries
          .filter((e) => e.direction === 'CREDIT')
          .reduce((sum, e) => sum + e.amountCents, 0);
        debitTotal = entries
          .filter((e) => e.direction === 'DEBIT')
          .reduce((sum, e) => sum + e.amountCents, 0);
      }
    }

    // Balancing entry so the batch nets to exactly zero.
    const netDiff = creditTotal - debitTotal;
    if (netDiff > 0) {
      entries.push({
        date: at(0.98, 4),
        direction: 'DEBIT',
        type: 'TRANSFER_OUT',
        amountCents: netDiff,
        description: 'Outbound transfer',
        counterparty: 'External Account',
        kind: 'balancing',
      });
    } else if (netDiff < 0) {
      entries.push({
        date: at(0.98, 4),
        direction: 'CREDIT',
        type: 'ACH_DEPOSIT',
        amountCents: -netDiff,
        description: 'ACH credit',
        counterparty: 'Client Settlement',
        kind: 'balancing',
      });
    }

    entries.sort((a, b) => a.date.getTime() - b.date.getTime());
    for (let i = 1; i < entries.length; i += 1) {
      const current = entries[i];
      const previous = entries[i - 1];
      if (current && previous && current.date.getTime() <= previous.date.getTime()) {
        current.date = new Date(previous.date.getTime() + 60_000);
      }
    }

    return entries;
  }
}

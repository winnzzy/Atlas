import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma, TransactionType as PrismaTransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

type TxClient = Prisma.TransactionClient;

/** Default presentation target: $4,700,000.00 expressed in integer cents. */
const DEFAULT_TARGET_CENTS = 470_000_000;
const MAX_TARGET_CENTS = 10_000_000_000; // $100M ceiling — keeps generated data plausible.

export interface GeneratePresentationDto {
  accountId: string;
  targetBalance?: string;
  months?: number;
  replace?: boolean;
}

export interface PresentationPlanEntry {
  date: Date;
  direction: 'CREDIT' | 'DEBIT';
  type: PrismaTransactionType;
  amountCents: number;
  description: string;
  counterparty: string;
  kind: string;
}

export interface PresentationStatus {
  accountId: string;
  accountNumber: string;
  accountName: string;
  currency: string;
  status: string;
  currentBalance: string;
  availableBalance: string;
  transactionCount: number;
  presentationExists: boolean;
  presentationCount: number;
  presentationCredits: string;
  presentationDebits: string;
  presentationNet: string;
  presentationBatchId: string | null;
  generatedAt: string | null;
}

/**
 * Generates presentation-quality banking history for a customer's account, on
 * demand, from the admin portal. Everything flows through the real transaction /
 * ledger tables (Transaction + TransactionLine + BalanceSnapshot + BankAccount
 * balances) — the balance is never hard-set to a magic number, it is the exact
 * accumulation of the generated legitimate credits and debits.
 *
 * Guarantees:
 *  - the whole generation runs inside a single DB transaction (atomic; any
 *    failure rolls everything back — no partial history),
 *  - the closing account balance reconciles exactly to opening + credits − debits
 *    and to the sum of the balance snapshots,
 *  - generated rows are marked internally (metadata.presentation) so the admin can
 *    always distinguish them, but the marker never surfaces in customer-facing UI,
 *  - genuine, non-generated financial records for the customer are never deleted.
 */
@Injectable()
export class AdminPresentationService {
  private readonly logger = new Logger(AdminPresentationService.name);

  constructor(private readonly prisma: PrismaService) {}

  private centsToDecimal(cents: number): Decimal {
    return new Decimal(cents).div(100);
  }

  private decimalToCents(value: Decimal | null | undefined): number {
    if (!value) return 0;
    return new Decimal(value).mul(100).toDecimalPlaces(0).toNumber();
  }

  /** Deterministic-per-call PRNG so amounts vary but a run is reproducible. */
  private makeRng(seed: number): () => number {
    let state = seed >>> 0 || 1;
    return () => {
      state = (state * 1_664_525 + 1_013_904_223) >>> 0;
      return state / 0xffffffff;
    };
  }

  private async requireAccountForCustomer(
    client: TxClient,
    userId: string,
    accountId: string,
  ) {
    const user = await client.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    const account = await client.bankAccount.findFirst({ where: { id: accountId, deletedAt: null } });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Never trust a customer/account relationship supplied by the caller: verify
    // ownership against the account_holders table on the server.
    const holder = await client.accountHolder.findFirst({ where: { accountId, userId } });
    if (!holder) {
      throw new ForbiddenException('Account does not belong to the selected customer');
    }

    return { user, account };
  }

  /** Read-only status for the admin view (§18) and idempotency check (§7). */
  async getStatus(userId: string, accountId: string): Promise<PresentationStatus> {
    const { account } = await this.requireAccountForCustomer(this.prisma, userId, accountId);

    const [transactionCount, presentationRows] = await Promise.all([
      this.prisma.transaction.count({ where: { accountId, deletedAt: null } }),
      this.prisma.transaction.findMany({
        where: { accountId, deletedAt: null, metadata: { path: ['presentation'], equals: true } },
        select: { id: true, amount: true, type: true, metadata: true, createdAt: true },
      }),
    ]);

    const presentationIds = presentationRows.map((row) => row.id);
    const netAgg = presentationIds.length
      ? await this.prisma.balanceSnapshot.aggregate({
          _sum: { changeAmount: true },
          where: { accountId, transactionId: { in: presentationIds } },
        })
      : { _sum: { changeAmount: null } };

    let creditCents = 0;
    let debitCents = 0;
    for (const row of presentationRows) {
      const snap = await this.prisma.balanceSnapshot.findFirst({
        where: { accountId, transactionId: row.id },
        select: { changeAmount: true },
      });
      const cents = this.decimalToCents(snap?.changeAmount ?? null);
      if (cents >= 0) creditCents += cents;
      else debitCents += Math.abs(cents);
    }

    const marker = presentationRows
      .map((row) => this.readMarker(row.metadata))
      .find((entry) => entry?.batchId);

    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      accountName: account.name,
      currency: account.currency,
      status: account.status,
      currentBalance: new Decimal(account.currentBalance).toFixed(2),
      availableBalance: new Decimal(account.availableBalance).toFixed(2),
      transactionCount,
      presentationExists: presentationRows.length > 0,
      presentationCount: presentationRows.length,
      presentationCredits: this.centsToDecimal(creditCents).toFixed(2),
      presentationDebits: this.centsToDecimal(debitCents).toFixed(2),
      presentationNet: new Decimal(netAgg._sum.changeAmount ?? 0).toFixed(2),
      presentationBatchId: marker?.batchId ?? null,
      generatedAt: marker?.generatedAt ?? null,
    };
  }

  private readMarker(metadata: unknown): { batchId?: string; generatedAt?: string } | null {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
    const presentation = (metadata as Record<string, unknown>).presentationMeta;
    if (!presentation || typeof presentation !== 'object') return null;
    const meta = presentation as Record<string, unknown>;
    return {
      batchId: typeof meta.batchId === 'string' ? meta.batchId : undefined,
      generatedAt: typeof meta.generatedAt === 'string' ? meta.generatedAt : undefined,
    };
  }

  /**
   * Generate (or replace) six months of activity that closes at the target
   * balance. Returns the reconciliation summary. The caller (admin service) is
   * responsible for authorization and audit; ownership is re-verified here too.
   */
  async generate(
    userId: string,
    dto: GeneratePresentationDto,
  ): Promise<{
    accountId: string;
    batchId: string;
    transactionCount: number;
    openingBalance: string;
    finalBalance: string;
    totalCredits: string;
    totalDebits: string;
    periodStart: string;
    periodEnd: string;
    replaced: boolean;
  }> {
    const targetCents = dto.targetBalance
      ? this.decimalToCents(new Decimal(dto.targetBalance))
      : DEFAULT_TARGET_CENTS;
    if (!Number.isFinite(targetCents) || targetCents <= 0) {
      throw new BadRequestException('Target balance must be a positive amount');
    }
    if (targetCents > MAX_TARGET_CENTS) {
      throw new BadRequestException('Target balance exceeds the presentation ceiling');
    }

    const months = dto.months && dto.months >= 1 && dto.months <= 12 ? Math.floor(dto.months) : 6;
    const batchId = randomUUID();
    const generatedAt = new Date();
    const periodEnd = new Date(generatedAt);
    const periodStart = new Date(generatedAt);
    periodStart.setMonth(periodStart.getMonth() - months);

    const result = await this.prisma.$transaction(async (tx) => {
      const { account } = await this.requireAccountForCustomer(tx, userId, dto.accountId);

      // Determine whether presentation activity already exists.
      const existing = await tx.transaction.findMany({
        where: { accountId: account.id, metadata: { path: ['presentation'], equals: true } },
        select: { id: true },
      });

      if (existing.length > 0 && !dto.replace) {
        throw new BadRequestException(
          'Presentation activity already exists for this account. Use replace to regenerate.',
        );
      }

      // Genuine (non-generated) balance = current balance minus the net effect of
      // any previously generated presentation activity we are about to remove.
      let genuineCents = this.decimalToCents(account.currentBalance);
      let replaced = false;
      if (existing.length > 0) {
        const ids = existing.map((row) => row.id);
        const priorNet = await tx.balanceSnapshot.aggregate({
          _sum: { changeAmount: true },
          where: { accountId: account.id, transactionId: { in: ids } },
        });
        genuineCents -= this.decimalToCents(priorNet._sum.changeAmount ?? null);
        // Delete ONLY generated presentation rows. TransactionLine + BalanceSnapshot
        // cascade on the transaction FK, so genuine history is untouched.
        await tx.transaction.deleteMany({ where: { id: { in: ids } } });
        replaced = true;
      }

      const openingCents = genuineCents;
      const netNeeded = targetCents - openingCents;

      const plan = this.buildPlan(netNeeded, months, periodStart, periodEnd, batchId);
      if (plan.length === 0) {
        throw new BadRequestException('Unable to build a plan for the requested target balance');
      }

      // Apply the plan sequentially so each snapshot carries a true running balance.
      let runningCents = openingCents;
      let creditCents = 0;
      let debitCents = 0;
      let snapshotSumCents = 0;
      let index = 0;

      for (const entry of plan) {
        const deltaCents = entry.direction === 'CREDIT' ? entry.amountCents : -entry.amountCents;
        const previous = runningCents;
        runningCents += deltaCents;
        if (runningCents < 0) {
          // Should never happen — the plan front-loads inflow — but never allow a
          // generated history to imply an impossible negative balance.
          throw new BadRequestException('Generated plan would produce a negative running balance');
        }
        snapshotSumCents += deltaCents;
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
            reference: `PRES-${batchId.slice(0, 8).toUpperCase()}-${String(index + 1).padStart(4, '0')}`,
            counterparty: entry.counterparty,
            category: entry.kind,
            settledAt: entry.date,
            createdAt: entry.date,
            updatedAt: entry.date,
            metadata: {
              presentation: true,
              presentationMeta: { batchId, generatedAt: generatedAt.toISOString(), kind: entry.kind },
            } as Prisma.InputJsonValue,
          },
        });

        await tx.transactionLine.create({
          data: {
            transactionId,
            entryType: entry.direction,
            accountCode: account.id,
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

      // ── Reconciliation (§6): must be exact or the whole thing rolls back. ──
      const finalCents = runningCents;
      if (finalCents !== targetCents) {
        throw new Error(
          `Reconciliation failed: computed ${finalCents} cents, expected ${targetCents} cents`,
        );
      }
      if (openingCents + snapshotSumCents !== targetCents) {
        throw new Error('Reconciliation failed: snapshot sum does not match target');
      }

      const holdAmount = new Decimal(account.holdAmount ?? 0);
      const finalBalance = this.centsToDecimal(finalCents);
      const updated = await tx.bankAccount.update({
        where: { id: account.id },
        data: {
          currentBalance: finalBalance,
          availableBalance: finalBalance.minus(holdAmount),
        },
      });

      // Guard against the ledger and the account row diverging.
      if (this.decimalToCents(updated.currentBalance) !== targetCents) {
        throw new Error('Reconciliation failed: account balance does not match ledger');
      }

      return {
        accountId: account.id,
        batchId,
        transactionCount: plan.length,
        openingBalance: this.centsToDecimal(openingCents).toFixed(2),
        finalBalance: finalBalance.toFixed(2),
        totalCredits: this.centsToDecimal(creditCents).toFixed(2),
        totalDebits: this.centsToDecimal(debitCents).toFixed(2),
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        replaced,
      };
    });

    this.logger.log(
      `Generated presentation activity ${result.batchId} for account ${result.accountId}: ` +
        `${result.transactionCount} txns, closing ${result.finalBalance}`,
    );
    return result;
  }

  /**
   * Build a realistic six-month plan whose net (credits − debits) equals
   * `netNeeded` cents exactly. Inflow is front-loaded so the running balance
   * never dips negative, and a final balancing credit absorbs the remainder so
   * the reconciliation is exact.
   */
  private buildPlan(
    netNeeded: number,
    months: number,
    start: Date,
    end: Date,
    batchId: string,
  ): PresentationPlanEntry[] {
    const seed = Number.parseInt(batchId.replace(/[^0-9a-f]/g, '').slice(0, 8), 16) || 1;
    const rng = this.makeRng(seed);
    const rand = (min: number, max: number) => Math.floor(min + rng() * (max - min + 1));

    const entries: PresentationPlanEntry[] = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const windowMs = end.getTime() - start.getTime();
    const at = (fraction: number, jitterHours = 0) => {
      const base = start.getTime() + Math.max(0, Math.min(1, fraction)) * windowMs;
      const jitter = jitterHours ? (rng() - 0.5) * jitterHours * 60 * 60 * 1000 : 0;
      return new Date(base + jitter);
    };

    const cardMerchants = ['Grocery Market', 'Coffee House', 'Online Retailer', 'Fuel Station', 'Restaurant', 'Pharmacy'];
    const billers = ['Utility Provider', 'Internet Service', 'Mobile Carrier', 'Insurance Premium', 'Streaming Service'];
    const pick = (list: string[]): string => list[rand(0, list.length - 1)] ?? list[0] ?? '';

    let recurringCredits = 0;
    let recurringDebits = 0;

    const pushCredit = (date: Date, type: PrismaTransactionType, amountCents: number, description: string, counterparty: string, kind: string) => {
      entries.push({ date, direction: 'CREDIT', type, amountCents, description, counterparty, kind });
      recurringCredits += amountCents;
    };
    const pushDebit = (date: Date, type: PrismaTransactionType, amountCents: number, description: string, counterparty: string, kind: string) => {
      entries.push({ date, direction: 'DEBIT', type, amountCents, description, counterparty, kind });
      recurringDebits += amountCents;
    };

    // Recurring realistic activity spread across the whole window.
    for (let m = 0; m < months; m += 1) {
      const monthFrac = (m + 0.5) / months;

      // Semi-monthly payroll credits (varied amounts).
      pushCredit(at(m / months + 0.02, 6), 'DEPOSIT', rand(600000, 950000), 'Payroll deposit', 'Employer Payroll', 'salary');
      pushCredit(at(m / months + 0.5 / months, 6), 'DEPOSIT', rand(600000, 950000), 'Payroll deposit', 'Employer Payroll', 'salary');

      // A couple of monthly bill payments.
      for (let b = 0; b < rand(2, 4); b += 1) {
        pushDebit(
          at(m / months + (0.2 + b * 0.15) / months, 5),
          'ACH_WITHDRAWAL',
          rand(4000, 260000),
          'Online bill payment',
          pick(billers),
          'bill',
        );
      }

      // Several card purchases.
      for (let c = 0; c < rand(3, 6); c += 1) {
        pushDebit(
          at(m / months + (0.1 + c * 0.12) / months, 8),
          'CARD_PURCHASE',
          rand(1200, 42000),
          'Card purchase',
          pick(cardMerchants),
          'card',
        );
      }

      // An ATM withdrawal most months.
      if (rng() > 0.3) {
        pushDebit(at(monthFrac, 6), 'ATM_WITHDRAWAL', rand(4000, 30000) * 1, 'ATM withdrawal', 'ATM', 'atm');
      }

      // Occasional smaller inbound transfer.
      if (rng() > 0.6) {
        pushCredit(at(monthFrac, 6), 'ACH_DEPOSIT', rand(25000, 180000), 'Transfer received', 'Inbound Transfer', 'inbound');
      }

      // Occasional outbound transfer.
      if (rng() > 0.7) {
        pushDebit(at(monthFrac, 6), 'TRANSFER_OUT', rand(50000, 300000), 'Outbound transfer', 'External Account', 'transfer-out');
      }
    }

    // K = the total large inflow that must be split between an opening credit and a
    // final balancing credit so the net equals exactly `netNeeded`.
    const K = netNeeded - recurringCredits + recurringDebits;
    if (K <= 0) {
      throw new BadRequestException('Target balance is too low for a realistic six-month history');
    }

    // Opening inflow: a large, "nice" wire near the start covers all later debits.
    const openingCents = Math.max(1, Math.floor((K * 0.85) / 100_000) * 100_000);
    const balancingCents = K - openingCents; // exact remainder, always >= 0
    entries.push({
      date: at(0.01, 4),
      direction: 'CREDIT',
      type: 'WIRE_INCOMING',
      amountCents: openingCents,
      description: 'Incoming wire transfer',
      counterparty: 'Wire Transfer Received',
      kind: 'opening',
    });
    if (balancingCents > 0) {
      entries.push({
        date: at(0.97, 4),
        direction: 'CREDIT',
        type: 'ACH_DEPOSIT',
        amountCents: balancingCents,
        description: 'ACH credit',
        counterparty: 'Client Settlement',
        kind: 'settlement',
      });
    }

    // Deterministic chronological order; nudge any exact-collision timestamps.
    entries.sort((a, b) => a.date.getTime() - b.date.getTime());
    for (let i = 1; i < entries.length; i += 1) {
      const current = entries[i];
      const previous = entries[i - 1];
      if (current && previous && current.date.getTime() <= previous.date.getTime()) {
        current.date = new Date(previous.date.getTime() + Math.max(1, Math.floor(dayMs / 12)));
      }
    }

    return entries;
  }
}

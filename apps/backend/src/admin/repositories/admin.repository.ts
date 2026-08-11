import { Inject, Injectable } from '@nestjs/common';
import type { Prisma} from '@prisma/client';
import { DeliveryStatus, NotificationChannel, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AdminAuditQueryDto,
  AdminDashboardOverviewDto,
  AdminSearchResultItemDto,
  AdminSettingsDto,
  CustomerQueryDto,
  NotificationQueueQueryDto,
  UpdateAdminSettingsDto,
} from '../dto';

interface AdminSettingsState {
  limits: Record<string, number>;
  featureFlags: Record<string, boolean>;
  maintenanceMode: boolean;
}

@Injectable()
export class AdminRepository {
  private readonly settingsState: AdminSettingsState = {
    limits: {
      transferDaily: 100000,
      transferMonthly: 1000000,
      cardDaily: 20000,
    },
    featureFlags: {
      notificationsEnabled: true,
      investmentsEnabled: true,
      cardsEnabled: true,
      transfersEnabled: true,
      adminAdvancedReports: true,
    },
    maintenanceMode: false,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService & Record<string, any>) {}

  async getDashboardOverview(): Promise<AdminDashboardOverviewDto> {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCustomers,
      activeAccounts,
      depositAggregate,
      transferCount,
      cardTransactionCount,
      investmentsCount,
      pendingApprovals,
      pendingNotifications,
      dailyVolumeAggregate,
      monthlyVolumeAggregate,
      revenueAggregate,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.bankAccount.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.transaction.aggregate({
        where: { deletedAt: null, type: { in: ['DEPOSIT', 'ACH_DEPOSIT', 'WIRE_INCOMING'] } },
        _sum: { amount: true },
      }),
      this.prisma.achTransfer.count({ where: { deletedAt: null } }).then(async (ach) => {
        const wire = await this.prisma.wireTransfer.count({ where: { deletedAt: null } });
        return ach + wire;
      }),
      this.prisma.cardTransaction.count(),
      this.prisma.investmentPortfolio?.count?.() ?? Promise.resolve(0),
      this.prisma.investmentCustodyDeposit?.count?.({ where: { status: 'PENDING' } }).then(async (d: number) => {
        const w = await this.prisma.investmentCustodyWithdrawal?.count?.({ where: { status: 'PENDING' } }) ?? 0;
        return d + w;
      }),
      this.prisma.notification.count({ where: { status: { in: [DeliveryStatus.QUEUED, DeliveryStatus.PROCESSING] } } }),
      this.prisma.transaction.aggregate({
        where: { deletedAt: null, createdAt: { gte: dayStart } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { deletedAt: null, createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { deletedAt: null, type: 'FEE' },
        _sum: { amount: true },
      }),
    ]);

    let dbStatus = 'ok';
    try {
      await this.prisma.user.count({ where: { id: { not: undefined } } });
    } catch {
      dbStatus = 'degraded';
    }

    return {
      totalCustomers,
      activeAccounts,
      totalDeposits: Number(depositAggregate._sum.amount ?? 0),
      totalTransfers: transferCount,
      totalCardTransactions: cardTransactionCount,
      totalInvestments: investmentsCount,
      pendingApprovals,
      pendingNotifications,
      dailyVolume: Number(dailyVolumeAggregate._sum.amount ?? 0),
      monthlyVolume: Number(monthlyVolumeAggregate._sum.amount ?? 0),
      revenue: Number(revenueAggregate._sum.amount ?? 0),
      systemHealth: {
        api: 'ok',
        database: dbStatus,
        notifications: 'ok',
        updatedAt: now.toISOString(),
      },
    };
  }

  async getAnalytics(): Promise<{
    dailyKpis: Record<string, number>;
    monthlyKpis: Record<string, number>;
    growth: Record<string, number>;
    volume: Record<string, number>;
    assetsUnderManagement: number;
    activeUsers: number;
  }> {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [dailyTx, monthlyTx, previousMonthlyTx, activeUsers, aum] = await Promise.all([
      this.prisma.transaction.aggregate({ where: { createdAt: { gte: dayStart }, deletedAt: null }, _sum: { amount: true }, _count: { id: true } }),
      this.prisma.transaction.aggregate({ where: { createdAt: { gte: monthStart }, deletedAt: null }, _sum: { amount: true }, _count: { id: true } }),
      this.prisma.transaction.aggregate({ where: { createdAt: { gte: previousMonthStart, lt: monthStart }, deletedAt: null }, _sum: { amount: true }, _count: { id: true } }),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE, deletedAt: null } }),
      this.prisma.investmentPortfolio?.aggregate?.({ _sum: { totalValue: true } }) ?? Promise.resolve({ _sum: { totalValue: null } }),
    ]);

    const monthCurrent = Number(monthlyTx._sum.amount ?? 0);
    const monthPrevious = Number(previousMonthlyTx._sum.amount ?? 0);
    const growthPct = monthPrevious > 0 ? ((monthCurrent - monthPrevious) / monthPrevious) * 100 : 0;

    return {
      dailyKpis: {
        transactionCount: dailyTx._count.id,
        transactionVolume: Number(dailyTx._sum.amount ?? 0),
      },
      monthlyKpis: {
        transactionCount: monthlyTx._count.id,
        transactionVolume: monthCurrent,
      },
      growth: {
        monthlyTransactionVolumePct: Number(growthPct.toFixed(2)),
      },
      volume: {
        daily: Number(dailyTx._sum.amount ?? 0),
        monthly: monthCurrent,
      },
      assetsUnderManagement: Number(aum._sum.totalValue ?? 0),
      activeUsers,
    };
  }

  async globalSearch(query: string, limit: number, offset: number): Promise<{ items: AdminSearchResultItemDto[]; total: number }> {
    const q = query.trim();
    const [users, accounts, cards, transactions, achTransfers, wireTransfers, investments] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { phoneNumber: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
        take: limit,
      }),
      this.prisma.bankAccount.findMany({
        where: {
          OR: [
            { accountNumber: { contains: q, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
        take: limit,
      }),
      this.prisma.card.findMany({
        where: {
          OR: [
            { lastFour: { contains: q } },
            { cardNumber: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
      }),
      this.prisma.transaction.findMany({
        where: {
          OR: [
            { reference: { contains: q, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
        take: limit,
      }),
      this.prisma.achTransfer.findMany({
        where: {
          OR: [
            { reference: { contains: q, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
        take: limit,
      }),
      this.prisma.wireTransfer.findMany({
        where: {
          OR: [
            { reference: { contains: q, mode: 'insensitive' } },
            { swiftCode: { contains: q, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
        take: limit,
      }),
      this.prisma.investmentProduct?.findMany?.({
        where: {
          OR: [
            { symbol: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
      }),
    ]);

    const items: AdminSearchResultItemDto[] = [
      ...users.map((u: { id: string; firstName: string; lastName: string; email: string; phoneNumber?: string | null; status: unknown }) => ({
        kind: 'customer',
        id: u.id,
        primary: `${u.firstName} ${u.lastName}`,
        secondary: u.email,
        metadata: { phone: u.phoneNumber ?? null, status: u.status },
      })),
      ...accounts.map((a: { id: string; accountNumber: string; type: string; status: string; currency: string }) => ({
        kind: 'account',
        id: a.id,
        primary: a.accountNumber,
        secondary: a.type,
        metadata: { status: a.status, currency: a.currency },
      })),
      ...cards.map((c: { id: string; lastFour: string; status: string; type: string; network: string }) => ({
        kind: 'card',
        id: c.id,
        primary: `****${c.lastFour}`,
        secondary: c.status,
        metadata: { type: c.type, network: c.network },
      })),
      ...transactions.map((t: { id: string; reference?: string | null; type: string; status: string; amount: { toString(): string } | number | null }) => ({
        kind: 'transaction',
        id: t.id,
        primary: t.reference ?? t.id,
        secondary: t.type,
        metadata: { status: t.status, amount: Number(t.amount) },
      })),
      ...achTransfers.map((t: { id: string; reference?: string | null; status: string; amount: { toString(): string } | number | null }) => ({
        kind: 'transfer',
        id: t.id,
        primary: t.reference ?? t.id,
        secondary: 'ACH',
        metadata: { status: t.status, amount: Number(t.amount) },
      })),
      ...wireTransfers.map((t: { id: string; reference?: string | null; status: string; amount: { toString(): string } | number | null }) => ({
        kind: 'transfer',
        id: t.id,
        primary: t.reference ?? t.id,
        secondary: 'WIRE',
        metadata: { status: t.status, amount: Number(t.amount) },
      })),
      ...investments.map((i: { id: string; symbol: string; name: string; status: string }) => ({
        kind: 'investment',
        id: i.id,
        primary: i.symbol,
        secondary: i.name,
        metadata: { status: i.status },
      })),
    ];

    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
    };
  }

  async getAuditLogs(query: AdminAuditQueryDto): Promise<{ items: Array<Record<string, unknown>>; total: number }> {
    const where: Prisma.AuditLogWhereInput = {
      action: query.action ? { contains: query.action, mode: 'insensitive' } : undefined,
      resourceType: query.resourceType ? { contains: query.resourceType, mode: 'insensitive' } : undefined,
      severity: query.severity,
      createdAt: query.from || query.to ? { gte: query.from ? new Date(query.from) : undefined, lte: query.to ? new Date(query.to) : undefined } : undefined,
    };

    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { event: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        action: item.action,
        resourceType: item.resourceType,
        resourceId: item.resourceId,
        description: item.description,
        severity: item.severity,
        createdAt: item.createdAt.toISOString(),
        eventCode: item.event.code,
      })),
      total,
    };
  }

  async getSecurityEvents(limit: number, offset: number): Promise<{ items: Array<Record<string, unknown>>; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.securityEvent.findMany({ orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
      this.prisma.securityEvent.count(),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        eventType: item.eventType,
        description: item.description,
        riskScore: item.riskScore,
        isResolved: item.isResolved,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
    };
  }

  async getAdminActions(limit: number, offset: number): Promise<{ items: Array<Record<string, unknown>>; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.adminAction.findMany({ orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
      this.prisma.adminAction.count(),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        action: item.action,
        resourceType: item.resourceType,
        resourceId: item.resourceId,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
    };
  }

  async getNotificationQueue(query: NotificationQueueQueryDto): Promise<{ items: Array<Record<string, unknown>>; total: number }> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const where: Prisma.NotificationWhereInput = {
      type: query.type,
      deliveries: query.channel ? { some: { channel: query.channel } } : undefined,
      status: { in: [DeliveryStatus.QUEUED, DeliveryStatus.PROCESSING, DeliveryStatus.FAILED] },
      deletedAt: null,
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          deliveries: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        recipientId: item.userId,
        type: item.type,
        status: item.status,
        channel: item.deliveries[0]?.channel ?? NotificationChannel.IN_APP,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
    };
  }

  async getCustomers(query: CustomerQueryDto): Promise<{ items: Array<Record<string, unknown>>; total: number }> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      OR: query.q
        ? [
            { email: { contains: query.q, mode: 'insensitive' } },
            { phoneNumber: { contains: query.q, mode: 'insensitive' } },
            { firstName: { contains: query.q, mode: 'insensitive' } },
            { lastName: { contains: query.q, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        email: item.email,
        phone: item.phoneNumber,
        firstName: item.firstName,
        lastName: item.lastName,
        status: item.status,
        kycStatus: item.kycStatus,
      })),
      total,
    };
  }

  async setCustomerStatus(userId: string, status: UserStatus, reason?: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status,
        metadata: {
          adminStatusReason: reason ?? null,
          adminStatusUpdatedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });
  }

  async resetMfa(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { mfaEnabled: false, mfaMethod: null } }),
      this.prisma.mfaSetting.deleteMany({ where: { userId } }),
    ]);
  }

  async resetPassword(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: `reset-required-${userId}`,
        passwordChangedAt: new Date(),
      },
    });
  }

  async getCustomerGraph(userId: string): Promise<Record<string, unknown>> {
    const [profile, accounts, cards, transfersAch, transfersWire, txs, investments, notifications] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.accountHolder.findMany({ where: { userId }, include: { account: true } }),
      this.prisma.cardHolder.findMany({ where: { userId }, include: { card: true } }),
      this.prisma.achTransfer.findMany({ where: { fromAccount: { accountHolders: { some: { userId } } }, deletedAt: null }, take: 100 }),
      this.prisma.wireTransfer.findMany({ where: { account: { accountHolders: { some: { userId } } }, deletedAt: null }, take: 100 }),
      this.prisma.transaction.findMany({ where: { account: { accountHolders: { some: { userId } } }, deletedAt: null }, take: 100 }),
      this.prisma.investmentPortfolio.findMany({ where: { userId }, include: { positions: true } }),
      this.prisma.notification.findMany({ where: { userId }, take: 100, orderBy: { createdAt: 'desc' } }),
    ]);

    return {
      profile,
      accounts: accounts.map((x: { account: unknown }) => x.account),
      cards: cards.map((x: { card: unknown }) => x.card),
      investments,
      transfers: [...transfersAch, ...transfersWire],
      transactions: txs,
      notifications,
    };
  }

  async getSettings(): Promise<AdminSettingsDto> {
    const [assetSymbols, accountCurrencies, transactionCurrencies, networks] = await Promise.all([
      this.prisma.investmentProduct?.findMany?.({ select: { symbol: true }, orderBy: { symbol: 'asc' } }) ?? [],
      this.prisma.bankAccount.findMany({ select: { currency: true }, distinct: ['currency'] }),
      this.prisma.transaction.findMany({ select: { currency: true }, distinct: ['currency'] }),
      this.prisma.investmentCustodyWallet?.findMany?.({ select: { network: true }, distinct: ['network'] }) ?? [],
    ]);

    const currencies = Array.from(new Set([...accountCurrencies.map((x: { currency: string }) => x.currency), ...transactionCurrencies.map((x: { currency: string }) => x.currency)])).sort();

    return {
      supportedAssets: assetSymbols.map((x: { symbol: string }) => x.symbol),
      currencies,
      networks: networks.map((x: { network: string }) => x.network).sort(),
      limits: this.settingsState.limits,
      featureFlags: this.settingsState.featureFlags,
      environment: {
        nodeEnv: process.env['NODE_ENV'] ?? 'development',
        region: process.env['ATLAS_REGION'] ?? 'us-east-1',
      },
      maintenanceMode: this.settingsState.maintenanceMode,
    };
  }

  async updateSettings(update: UpdateAdminSettingsDto): Promise<AdminSettingsDto> {
    if (update.limits) {
      this.settingsState.limits = { ...this.settingsState.limits, ...update.limits };
    }

    if (update.featureFlags) {
      this.settingsState.featureFlags = { ...this.settingsState.featureFlags, ...update.featureFlags };
    }

    if (update.maintenanceMode !== undefined) {
      this.settingsState.maintenanceMode = update.maintenanceMode;
    }

    return this.getSettings();
  }

  async getReportRows(kind: string, from?: Date, to?: Date): Promise<Array<Record<string, string | number | boolean | null>>> {
    if (kind === 'AUM') {
      const portfolios = await this.prisma.investmentPortfolio?.findMany?.({ select: { id: true, userId: true, totalValue: true } }) ?? [];
      return portfolios.map((p: { id: string; userId: string; totalValue: unknown }) => ({ portfolioId: p.id, userId: p.userId, totalValue: Number(p.totalValue) }));
    }

    if (kind === 'ACTIVE_USERS') {
      const users = await this.prisma.user.findMany({ where: { status: UserStatus.ACTIVE, deletedAt: null }, select: { id: true, email: true, createdAt: true } });
      return users.map((u) => ({ userId: u.id, email: u.email, createdAt: u.createdAt.toISOString() }));
    }

    const filter = from || to ? { gte: from, lte: to } : undefined;
    const transactions = await this.prisma.transaction.findMany({
      where: { deletedAt: null, createdAt: filter },
      select: { id: true, reference: true, amount: true, type: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    return transactions.map((t) => ({
      transactionId: t.id,
      reference: t.reference,
      amount: Number(t.amount),
      type: t.type,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async findCardOwner(cardId: string): Promise<string | null> {
    const holder = await this.prisma.cardHolder.findFirst({ where: { cardId }, orderBy: { createdAt: 'asc' } });
    return holder?.userId ?? null;
  }
}

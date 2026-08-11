import { Inject, Injectable, Logger } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import type { AccountStatusType, AccountTypeType } from '../dto/account-response.dto';

type PrismaAccount = {
  id: string;
  accountNumber: string;
  routingNumber: string;
  type: string;
  status: string;
  name: string;
  nickname: string | null;
  currency: string;
  currentBalance: Decimal;
  availableBalance: Decimal;
  pendingBalance: Decimal;
  holdAmount: Decimal;
  overdraftLimit: Decimal;
  dailyLimit: Decimal;
  monthlyLimit: Decimal;
  interestRate: Decimal | null;
  freezeReason: string | null;
  freezeNote: string | null;
  closedAt: Date | null;
  closureReason: string | null;
  isDemo: boolean;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
};

@Injectable()
export class AccountRepository {
  private readonly logger = new Logger(AccountRepository.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    accountNumber: string;
    routingNumber: string;
    type: AccountTypeType;
    name: string;
    nickname?: string;
    currency?: string;
    isDemo?: boolean;
  }): Promise<PrismaAccount> {
    const account = await this.prisma.$transaction(async (tx) => {
      const created = await tx.bankAccount.create({
        data: {
          accountNumber: data.accountNumber,
          routingNumber: data.routingNumber,
          type: data.type as never,
          status: 'PENDING' as never,
          name: data.name,
          nickname: data.nickname ?? null,
          currency: data.currency ?? 'USD',
          currentBalance: new Decimal(0),
          availableBalance: new Decimal(0),
          pendingBalance: new Decimal(0),
          holdAmount: new Decimal(0),
          overdraftLimit: new Decimal(0),
          dailyLimit: new Decimal(5000),
          monthlyLimit: new Decimal(25000),
          isDemo: data.isDemo ?? false,
          createdBy: data.userId,
        },
      });

      await tx.accountHolder.create({
        data: {
          userId: data.userId,
          accountId: created.id,
          role: 'OWNER',
        },
      });

      return created;
    });

    return account as unknown as PrismaAccount;
  }

  async findById(id: string): Promise<PrismaAccount | null> {
    const account = await this.prisma.bankAccount.findUnique({ where: { id } });
    return account as unknown as PrismaAccount | null;
  }

  async findByIdAndUser(id: string, userId: string): Promise<PrismaAccount | null> {
    const holder = await this.prisma.accountHolder.findFirst({
      where: { accountId: id, userId },
      include: { account: true },
    });
    if (!holder || holder.account.deletedAt) return null;
    return holder.account as unknown as PrismaAccount;
  }

  async findByUserId(
    userId: string,
    options?: { status?: AccountStatusType; type?: AccountTypeType; skip?: number; take?: number },
  ): Promise<{ accounts: PrismaAccount[]; total: number }> {
    const accountWhere: Record<string, unknown> = { deletedAt: null };
    if (options?.status) accountWhere.status = options.status;
    if (options?.type) accountWhere.type = options.type;

    const holdersWhere = { userId, account: accountWhere };

    const skip = options?.skip ?? 0;
    const take = options?.take ?? 20;

    const [holders, total] = await Promise.all([
      this.prisma.accountHolder.findMany({
        where: holdersWhere,
        include: { account: true },
        orderBy: { account: { createdAt: 'desc' } },
        skip,
        take,
      }),
      this.prisma.accountHolder.count({ where: holdersWhere }),
    ]);

    return {
      accounts: holders.map((h: { account: unknown }) => h.account) as unknown as PrismaAccount[],
      total,
    };
  }

  async findByAccountNumber(accountNumber: string): Promise<PrismaAccount | null> {
    const account = await this.prisma.bankAccount.findUnique({ where: { accountNumber } });
    return account as unknown as PrismaAccount | null;
  }

  async updateStatus(
    id: string,
    status: AccountStatusType,
    data?: { freezeReason?: string; freezeNote?: string; closureReason?: string },
  ): Promise<PrismaAccount> {
    const updateData: Record<string, unknown> = { status };

    if (status === 'FROZEN' || status === 'RESTRICTED' || status === 'LOCKED') {
      if (data?.freezeReason !== undefined) updateData.freezeReason = data.freezeReason;
      if (data?.freezeNote !== undefined) updateData.freezeNote = data.freezeNote;
    }
    if (status === 'ACTIVE' && data?.freezeReason) {
      updateData.freezeReason = null;
      updateData.freezeNote = null;
    }
    if (status === 'CLOSED') {
      updateData.closedAt = new Date();
      updateData.closureReason = data?.closureReason;
    }

    const account = await this.prisma.bankAccount.update({
      where: { id },
      data: updateData,
    });
    return account as unknown as PrismaAccount;
  }

  async updateNickname(id: string, nickname: string): Promise<PrismaAccount> {
    const account = await this.prisma.bankAccount.update({
      where: { id },
      data: { nickname },
    });
    return account as unknown as PrismaAccount;
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.bankAccount.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' as never },
    });
  }

  async updateBalance(
    id: string,
    data: {
      currentBalance?: Decimal;
      availableBalance?: Decimal;
      pendingBalance?: Decimal;
      holdAmount?: Decimal;
    },
  ): Promise<PrismaAccount> {
    const updateData: Record<string, unknown> = {};
    if (data.currentBalance !== undefined) updateData.currentBalance = data.currentBalance;
    if (data.availableBalance !== undefined) updateData.availableBalance = data.availableBalance;
    if (data.pendingBalance !== undefined) updateData.pendingBalance = data.pendingBalance;
    if (data.holdAmount !== undefined) updateData.holdAmount = data.holdAmount;

    const account = await this.prisma.bankAccount.update({
      where: { id },
      data: updateData,
    });
    return account as unknown as PrismaAccount;
  }

  async isAccountHolder(accountId: string, userId: string): Promise<boolean> {
    const holder = await this.prisma.accountHolder.findFirst({
      where: { accountId, userId },
    });
    return holder !== null;
  }

  async getAccountHolders(accountId: string): Promise<Array<{ userId: string; role: string }>> {
    const holders = await this.prisma.accountHolder.findMany({
      where: { accountId },
      select: { userId: true, role: true },
    });
    return holders;
  }
}

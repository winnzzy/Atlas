import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { TransferStatus as PrismaTransferStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import type { TransferStatus } from '../enums/transfer-status.enum';
import { TransferStatus as DomainTransferStatus } from '../enums/transfer-status.enum';
import type { TransferType } from '../enums/transfer-type.enum';
import { TransferType as DomainTransferType } from '../enums/transfer-type.enum';

export interface TransferRecord {
  id: string;
  reference?: string;
  idempotencyKey?: string;
  type: TransferType;
  status: TransferStatus;
  sourceAccountId: string;
  destinationAccountId?: string;
  beneficiaryId?: string;
  amount: string;
  currency: string;
  description?: string;
  memo?: string;
  feeAmount?: string;
  feeType?: string;
  feeSharing?: string;
  beneficiaryName?: string;
  beneficiaryBank?: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  settlementReference?: string;
  submittedAt?: Date;
  sentAt?: Date;
  settlementAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  cancelledAt?: Date;
  returnedAt?: Date;
  reversedAt?: Date;
  expiresAt?: Date;
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, string>;
  failureReason?: string;
  failureCode?: string;
  returnCode?: string;
  reversalTransactionId?: string;
}

export interface BeneficiaryRecord {
  id: string;
  userId: string;
  name: string;
  type: 'DOMESTIC' | 'INTERNATIONAL' | 'SWIFT';
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  bankName?: string;
  accountNumber?: string;
  branchName?: string;
  country: string;
  currency: string;
  favorite?: boolean;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  metadata?: Record<string, string>;
}

export interface TransferSearchParams {
  reference?: string;
  status?: TransferStatus;
  type?: TransferType;
  beneficiaryId?: string;
  accountId?: string;
  currency?: string;
  minAmount?: string;
  maxAmount?: string;
  fromDate?: Date;
  toDate?: Date;
  cursor?: string;
  limit: number;
}

type TransferMetadata = Record<string, unknown> & {
  domainType?: string;
  domainStatus?: string;
  idempotencyKey?: string;
  beneficiaryId?: string;
  memo?: string;
  feeType?: string;
  feeSharing?: string;
  settlementReference?: string;
  submittedAt?: string;
  sentAt?: string;
  settlementAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  reversedAt?: string;
  scheduledAt?: string;
  reversalTransactionId?: string;
};
type AchTransferRow = Prisma.AchTransferGetPayload<Record<string, never>>;
type WireTransferRow = Prisma.WireTransferGetPayload<Record<string, never>>;
type BeneficiaryRow = Prisma.BeneficiaryGetPayload<Record<string, never>>;

@Injectable()
export class TransferRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async saveTransfer(record: TransferRecord): Promise<TransferRecord> {
    if (this.isWire(record.type)) {
      await this.prisma.wireTransfer.create({
        data: {
          id: record.id,
          accountId: record.sourceAccountId,
          type: record.type,
          amount: new Decimal(record.amount),
          currency: record.currency,
          beneficiaryName: record.beneficiaryName ?? 'External beneficiary',
          beneficiaryBank: record.beneficiaryBank ?? 'External bank',
          beneficiaryAccount: record.iban ?? record.destinationAccountId ?? 'external',
          routingNumber: record.routingNumber,
          swiftCode: record.swiftCode,
          reference: record.reference,
          status: this.toPrismaStatus(record.status),
          feeAmount: record.feeAmount ? new Decimal(record.feeAmount) : new Decimal(0),
          description: record.description ?? record.memo,
          failureReason: record.failureReason,
          metadata: this.toMetadata(record) as Prisma.InputJsonValue,
          completedAt: record.completedAt,
        },
      });
      return record;
    }

    await this.prisma.achTransfer.create({
      data: {
        id: record.id,
        fromAccountId: record.sourceAccountId,
        toAccountId: record.destinationAccountId,
        externalRouting: record.routingNumber,
        externalAccount: record.iban,
        externalName: record.beneficiaryName,
        amount: new Decimal(record.amount),
        currency: record.currency,
        status: this.toPrismaStatus(record.status),
        description: record.description ?? record.memo,
        failureReason: record.failureReason,
        failureCode: record.failureCode,
        reference: record.reference,
        metadata: this.toMetadata(record) as Prisma.InputJsonValue,
        completedAt: record.completedAt,
        returnedAt: record.returnedAt,
        returnCode: record.returnCode,
      },
    });
    return record;
  }

  async updateTransfer(record: TransferRecord): Promise<TransferRecord> {
    if (this.isWire(record.type)) {
      await this.prisma.wireTransfer.update({
        where: { id: record.id },
        data: {
          status: this.toPrismaStatus(record.status),
          failureReason: record.failureReason,
          completedAt: record.completedAt,
          metadata: this.toMetadata(record) as Prisma.InputJsonValue,
        },
      });
      return record;
    }

    await this.prisma.achTransfer.update({
      where: { id: record.id },
      data: {
        status: this.toPrismaStatus(record.status),
        failureReason: record.failureReason,
        failureCode: record.failureCode,
        completedAt: record.completedAt,
        returnedAt: record.returnedAt,
        returnCode: record.returnCode,
        metadata: this.toMetadata(record) as Prisma.InputJsonValue,
      },
    });
    return record;
  }

  async findById(id: string): Promise<TransferRecord | null> {
    const ach = await this.prisma.achTransfer.findFirst({ where: { id, deletedAt: null } });
    if (ach) return this.fromAch(ach);
    const wire = await this.prisma.wireTransfer.findFirst({ where: { id, deletedAt: null } });
    return wire ? this.fromWire(wire) : null;
  }

  async findByReference(reference: string): Promise<TransferRecord | null> {
    const ach = await this.prisma.achTransfer.findFirst({ where: { reference, deletedAt: null } });
    if (ach) return this.fromAch(ach);
    const wire = await this.prisma.wireTransfer.findFirst({
      where: { reference, deletedAt: null },
    });
    return wire ? this.fromWire(wire) : null;
  }

  async findByIdempotencyKey(key: string): Promise<TransferRecord | null> {
    const result = await this.search({ limit: 500 });
    return result.items.find((item) => item.idempotencyKey === key) ?? null;
  }

  async search(
    params: TransferSearchParams,
  ): Promise<{ items: TransferRecord[]; nextCursor?: string; totalCount: number }> {
    const [achRows, wireRows] = await Promise.all([
      this.prisma.achTransfer.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.wireTransfer.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    let items = [
      ...achRows.map((row) => this.fromAch(row)),
      ...wireRows.map((row) => this.fromWire(row)),
    ];

    if (params.reference) items = items.filter((item) => item.reference === params.reference);
    if (params.status) items = items.filter((item) => item.status === params.status);
    if (params.type) items = items.filter((item) => item.type === params.type);
    if (params.beneficiaryId)
      items = items.filter((item) => item.beneficiaryId === params.beneficiaryId);
    if (params.accountId)
      items = items.filter(
        (item) =>
          item.sourceAccountId === params.accountId ||
          item.destinationAccountId === params.accountId,
      );
    if (params.currency) items = items.filter((item) => item.currency === params.currency);
    if (params.minAmount)
      items = items.filter((item) => Number(item.amount) >= Number(params.minAmount));
    if (params.maxAmount)
      items = items.filter((item) => Number(item.amount) <= Number(params.maxAmount));
    const { fromDate, toDate } = params;
    if (fromDate) items = items.filter((item) => item.createdAt >= fromDate);
    if (toDate) items = items.filter((item) => item.createdAt <= toDate);

    items.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    const totalCount = items.length;
    if (params.cursor) {
      const cursorIndex = items.findIndex((item) => item.id === params.cursor);
      if (cursorIndex >= 0) items = items.slice(cursorIndex + 1);
    }
    const page = items.slice(0, params.limit);
    const lastItem = page.at(-1);
    return {
      items: page,
      nextCursor: page.length === params.limit && lastItem ? lastItem.id : undefined,
      totalCount,
    };
  }

  async saveBeneficiary(record: BeneficiaryRecord): Promise<BeneficiaryRecord> {
    await this.prisma.beneficiary.create({
      data: {
        id: record.id,
        userId: record.userId,
        nickname: record.name,
        bankName: record.bankName ?? 'External bank',
        accountNumber: record.accountNumber ?? record.iban ?? record.id,
        routingNumber: record.routingNumber,
        swiftCode: record.swiftCode,
        accountType: record.type,
        beneficiaryName: record.name,
        country: record.country,
      },
    });
    return record;
  }

  async updateBeneficiary(record: BeneficiaryRecord): Promise<BeneficiaryRecord> {
    await this.prisma.beneficiary.update({
      where: { id: record.id },
      data: {
        nickname: record.name,
        bankName: record.bankName,
        accountNumber: record.accountNumber ?? record.iban ?? record.id,
        routingNumber: record.routingNumber,
        swiftCode: record.swiftCode,
        accountType: record.type,
        beneficiaryName: record.name,
        country: record.country,
        isActive: !record.deletedAt,
        deletedAt: record.deletedAt,
      },
    });
    return record;
  }

  async findBeneficiaryById(id: string): Promise<BeneficiaryRecord | null> {
    const row = await this.prisma.beneficiary.findFirst({ where: { id, deletedAt: null } });
    return row ? this.fromBeneficiary(row) : null;
  }

  async searchBeneficiaries(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ items: BeneficiaryRecord[]; nextCursor?: string; totalCount: number }> {
    const [rows, totalCount] = await Promise.all([
      this.prisma.beneficiary.findMany({
        where: { userId, deletedAt: null, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
      }),
      this.prisma.beneficiary.count({ where: { userId, deletedAt: null, isActive: true } }),
    ]);
    const items = rows.map((row) => this.fromBeneficiary(row));
    const lastItem = items.at(-1);
    return {
      items,
      nextCursor: items.length === limit && lastItem ? lastItem.id : undefined,
      totalCount,
    };
  }

  async existsByReference(reference: string): Promise<boolean> {
    return (await this.findByReference(reference)) !== null;
  }

  async existsByIdempotencyKey(key: string): Promise<boolean> {
    return (await this.findByIdempotencyKey(key)) !== null;
  }

  /**
   * Soft-delete a transfer so it disappears from every admin/customer view
   * (all reads filter `deletedAt: null`). ACH and wire transfers live in
   * separate tables, so — mirroring {@link findById} — this checks ACH first
   * and falls back to wire. Never touches balances or the ledger.
   */
  async softDelete(id: string): Promise<void> {
    const ach = await this.prisma.achTransfer.findFirst({ where: { id, deletedAt: null } });
    if (ach) {
      await this.prisma.achTransfer.update({ where: { id }, data: { deletedAt: new Date() } });
      return;
    }
    const wire = await this.prisma.wireTransfer.findFirst({ where: { id, deletedAt: null } });
    if (wire) {
      await this.prisma.wireTransfer.update({ where: { id }, data: { deletedAt: new Date() } });
    }
  }

  /** Soft-delete several transfers, spanning both ACH and wire tables, in one round trip. */
  async softDeleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await Promise.all([
      this.prisma.achTransfer.updateMany({
        where: { id: { in: ids }, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      this.prisma.wireTransfer.updateMany({
        where: { id: { in: ids }, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
    ]);
  }

  /**
   * IDs of every non-deleted transfer this account itself initiated (the
   * account's own outgoing history) — not transfers where it is only the
   * destination. This mirrors `TransactionRepository#findIdsByAccount`, which
   * clears only the initiating side's rows for the same reason: a transfer
   * record is shared with its counterparty, so clearing "my history" must not
   * reach into money movement that also belongs to another customer's account.
   */
  async findIdsByAccount(accountId: string): Promise<string[]> {
    const [achRows, wireRows] = await Promise.all([
      this.prisma.achTransfer.findMany({
        where: { fromAccountId: accountId, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.wireTransfer.findMany({
        where: { accountId, deletedAt: null },
        select: { id: true },
      }),
    ]);
    return [...achRows.map((row) => row.id), ...wireRows.map((row) => row.id)];
  }

  private fromAch(row: AchTransferRow): TransferRecord {
    const metadata = this.metadata(row.metadata);
    return {
      id: row.id,
      reference: row.reference ?? undefined,
      idempotencyKey: this.asString(metadata.idempotencyKey),
      type: (this.asString(metadata.domainType) ??
        (row.toAccountId
          ? DomainTransferType.INTERNAL
          : DomainTransferType.ACH_CREDIT)) as TransferType,
      status: (this.asString(metadata.domainStatus) ??
        this.fromPrismaStatus(row.status)) as TransferStatus,
      sourceAccountId: row.fromAccountId,
      destinationAccountId: row.toAccountId ?? undefined,
      beneficiaryId: this.asString(metadata.beneficiaryId),
      amount: new Decimal(row.amount).toFixed(2),
      currency: row.currency,
      description: row.description ?? undefined,
      memo: this.asString(metadata.memo),
      beneficiaryName: row.externalName ?? undefined,
      routingNumber: row.externalRouting ?? undefined,
      iban: row.externalAccount ?? undefined,
      settlementReference: this.asString(metadata.settlementReference),
      submittedAt: this.asDate(metadata.submittedAt),
      sentAt: this.asDate(metadata.sentAt),
      settlementAt: this.asDate(metadata.settlementAt),
      completedAt: row.completedAt ?? undefined,
      failedAt: this.asDate(metadata.failedAt),
      cancelledAt: this.asDate(metadata.cancelledAt),
      returnedAt: row.returnedAt ?? undefined,
      reversedAt: this.asDate(metadata.reversedAt),
      scheduledAt: this.asDate(metadata.scheduledAt),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      failureReason: row.failureReason ?? undefined,
      failureCode: row.failureCode ?? undefined,
      returnCode: row.returnCode ?? undefined,
      reversalTransactionId: this.asString(metadata.reversalTransactionId),
    };
  }

  private fromWire(row: WireTransferRow): TransferRecord {
    const metadata = this.metadata(row.metadata);
    return {
      id: row.id,
      reference: row.reference ?? undefined,
      idempotencyKey: this.asString(metadata.idempotencyKey),
      type: (this.asString(metadata.domainType) ?? row.type) as TransferType,
      status: (this.asString(metadata.domainStatus) ??
        this.fromPrismaStatus(row.status)) as TransferStatus,
      sourceAccountId: row.accountId,
      amount: new Decimal(row.amount).toFixed(2),
      currency: row.currency,
      description: row.description ?? undefined,
      feeAmount: new Decimal(row.feeAmount ?? 0).toFixed(2),
      beneficiaryName: row.beneficiaryName,
      beneficiaryBank: row.beneficiaryBank,
      routingNumber: row.routingNumber ?? undefined,
      swiftCode: row.swiftCode ?? undefined,
      iban: row.beneficiaryAccount ?? undefined,
      settlementReference: this.asString(metadata.settlementReference),
      submittedAt: this.asDate(metadata.submittedAt),
      sentAt: this.asDate(metadata.sentAt),
      settlementAt: this.asDate(metadata.settlementAt),
      completedAt: row.completedAt ?? undefined,
      failedAt: this.asDate(metadata.failedAt),
      cancelledAt: this.asDate(metadata.cancelledAt),
      reversedAt: this.asDate(metadata.reversedAt),
      scheduledAt: this.asDate(metadata.scheduledAt),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      failureReason: row.failureReason ?? undefined,
      reversalTransactionId: this.asString(metadata.reversalTransactionId),
    };
  }

  private fromBeneficiary(row: BeneficiaryRow): BeneficiaryRecord {
    return {
      id: row.id,
      userId: row.userId,
      name: row.beneficiaryName ?? row.nickname,
      type: row.accountType as BeneficiaryRecord['type'],
      routingNumber: row.routingNumber ?? undefined,
      swiftCode: row.swiftCode ?? undefined,
      bankName: row.bankName,
      accountNumber: row.accountNumber,
      country: row.country,
      currency: 'USD',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? undefined,
    };
  }

  private toMetadata(record: TransferRecord): TransferMetadata {
    return {
      ...(record.metadata ?? {}),
      domainType: record.type,
      domainStatus: record.status,
      idempotencyKey: record.idempotencyKey,
      beneficiaryId: record.beneficiaryId,
      memo: record.memo,
      feeType: record.feeType,
      feeSharing: record.feeSharing,
      settlementReference: record.settlementReference,
      submittedAt: record.submittedAt?.toISOString(),
      sentAt: record.sentAt?.toISOString(),
      settlementAt: record.settlementAt?.toISOString(),
      failedAt: record.failedAt?.toISOString(),
      cancelledAt: record.cancelledAt?.toISOString(),
      reversedAt: record.reversedAt?.toISOString(),
      scheduledAt: record.scheduledAt?.toISOString(),
      reversalTransactionId: record.reversalTransactionId,
    };
  }

  private toPrismaStatus(status: TransferStatus): PrismaTransferStatus {
    if (status === DomainTransferStatus.COMPLETED || status === DomainTransferStatus.SETTLED)
      return PrismaTransferStatus.COMPLETED;
    if (status === DomainTransferStatus.FAILED) return PrismaTransferStatus.FAILED;
    if (status === DomainTransferStatus.CANCELLED) return PrismaTransferStatus.CANCELLED;
    if (status === DomainTransferStatus.RETURNED) return PrismaTransferStatus.RETURNED;
    if (
      status === DomainTransferStatus.PROCESSING ||
      status === DomainTransferStatus.SENT ||
      status === DomainTransferStatus.PENDING_SETTLEMENT
    )
      return PrismaTransferStatus.PROCESSING;
    return PrismaTransferStatus.PENDING;
  }

  private fromPrismaStatus(status: PrismaTransferStatus): TransferStatus {
    if (status === PrismaTransferStatus.COMPLETED) return DomainTransferStatus.COMPLETED;
    if (status === PrismaTransferStatus.FAILED) return DomainTransferStatus.FAILED;
    if (status === PrismaTransferStatus.CANCELLED) return DomainTransferStatus.CANCELLED;
    if (status === PrismaTransferStatus.RETURNED) return DomainTransferStatus.RETURNED;
    if (status === PrismaTransferStatus.PROCESSING) return DomainTransferStatus.PROCESSING;
    return DomainTransferStatus.CREATED;
  }

  private isWire(type: TransferType): boolean {
    return [
      DomainTransferType.DOMESTIC_WIRE,
      DomainTransferType.INTERNATIONAL_WIRE,
      DomainTransferType.SWIFT,
    ].includes(type);
  }

  private metadata(value: unknown): TransferMetadata {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as TransferMetadata)
      : {};
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private asDate(value: unknown): Date | undefined {
    return typeof value === 'string' ? new Date(value) : undefined;
  }
}

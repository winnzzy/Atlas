import { Injectable } from '@nestjs/common';
import type { TransferStatus } from '../enums/transfer-status.enum';
import type { TransferType } from '../enums/transfer-type.enum';

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

@Injectable()
export class TransferRepository {
  private readonly transfers = new Map<string, TransferRecord>();
  private readonly beneficiaries = new Map<string, BeneficiaryRecord>();
  private readonly referenceIndex = new Map<string, string>();
  private readonly idempotencyIndex = new Map<string, string>();

  async saveTransfer(record: TransferRecord): Promise<TransferRecord> {
    this.transfers.set(record.id, { ...record });
    if (record.reference) this.referenceIndex.set(record.reference, record.id);
    if (record.idempotencyKey) this.idempotencyIndex.set(record.idempotencyKey, record.id);
    return record;
  }

  async updateTransfer(record: TransferRecord): Promise<TransferRecord> {
    if (!this.transfers.has(record.id)) {
      throw new Error(`Transfer ${record.id} not found for update`);
    }
    const updated = { ...record, updatedAt: new Date() };
    this.transfers.set(record.id, updated);
    return updated;
  }

  async findById(id: string): Promise<TransferRecord | null> {
    return this.transfers.get(id) ?? null;
  }

  async findByReference(reference: string): Promise<TransferRecord | null> {
    const transferId = this.referenceIndex.get(reference);
    return transferId ? this.transfers.get(transferId) ?? null : null;
  }

  async findByIdempotencyKey(key: string): Promise<TransferRecord | null> {
    const transferId = this.idempotencyIndex.get(key);
    return transferId ? this.transfers.get(transferId) ?? null : null;
  }

  async search(params: TransferSearchParams): Promise<{ items: TransferRecord[]; nextCursor?: string; totalCount: number }> {
    let items = Array.from(this.transfers.values());

    if (params.reference) items = items.filter((item) => item.reference === params.reference);
    if (params.status) items = items.filter((item) => item.status === params.status);
    if (params.type) items = items.filter((item) => item.type === params.type);
    if (params.beneficiaryId) items = items.filter((item) => item.beneficiaryId === params.beneficiaryId);
    if (params.accountId) items = items.filter((item) => item.sourceAccountId === params.accountId || item.destinationAccountId === params.accountId);
    if (params.currency) items = items.filter((item) => item.currency === params.currency);
    if (params.minAmount) {
      const minAmount = params.minAmount;
      items = items.filter((item) => parseFloat(item.amount) >= parseFloat(minAmount));
    }
    if (params.maxAmount) {
      const maxAmount = params.maxAmount;
      items = items.filter((item) => parseFloat(item.amount) <= parseFloat(maxAmount));
    }
    if (params.fromDate) {
      const fromDate = params.fromDate;
      items = items.filter((item) => item.createdAt >= fromDate);
    }
    if (params.toDate) {
      const toDate = params.toDate;
      items = items.filter((item) => item.createdAt <= toDate);
    }

    items.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

    const totalCount = items.length;
    if (params.cursor) {
      const cursorIndex = items.findIndex((item) => item.id === params.cursor);
      if (cursorIndex >= 0) items = items.slice(cursorIndex + 1);
    }

    const page = items.slice(0, params.limit);
    const lastItem = page.at(-1);
    return { items: page, nextCursor: page.length === params.limit && lastItem ? lastItem.id : undefined, totalCount };
  }

  async saveBeneficiary(record: BeneficiaryRecord): Promise<BeneficiaryRecord> {
    this.beneficiaries.set(record.id, { ...record });
    return record;
  }

  async updateBeneficiary(record: BeneficiaryRecord): Promise<BeneficiaryRecord> {
    if (!this.beneficiaries.has(record.id)) {
      throw new Error(`Beneficiary ${record.id} not found for update`);
    }
    const updated = { ...record, updatedAt: new Date() };
    this.beneficiaries.set(record.id, updated);
    return updated;
  }

  async findBeneficiaryById(id: string): Promise<BeneficiaryRecord | null> {
    return this.beneficiaries.get(id) ?? null;
  }

  async searchBeneficiaries(userId: string, limit: number, cursor?: string): Promise<{ items: BeneficiaryRecord[]; nextCursor?: string; totalCount: number }> {
    let items = Array.from(this.beneficiaries.values()).filter((item) => item.userId === userId && !item.deletedAt);
    items.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    const totalCount = items.length;
    if (cursor) {
      const cursorIndex = items.findIndex((item) => item.id === cursor);
      if (cursorIndex >= 0) items = items.slice(cursorIndex + 1);
    }
    const page = items.slice(0, limit);
    const lastItem = page.at(-1);
    return { items: page, nextCursor: page.length === limit && lastItem ? lastItem.id : undefined, totalCount };
  }

  async existsByReference(reference: string): Promise<boolean> {
    return this.referenceIndex.has(reference);
  }

  async existsByIdempotencyKey(key: string): Promise<boolean> {
    return this.idempotencyIndex.has(key);
  }
}

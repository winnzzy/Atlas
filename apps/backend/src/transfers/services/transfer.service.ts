import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { AccountService } from '../../accounts/services/account.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { TransactionType } from '../../transactions/enums/transaction-type.enum';
import type { CreateTransactionDto } from '../../transactions/dto/create-transaction.dto';
import { TransferMapper } from '../mappers/transfer.mapper';
import { TransferPolicy } from '../policies/transfer.policy';
import { TransferRepository, type TransferRecord, type BeneficiaryRecord } from '../repositories/transfer.repository';
import { TransferValidator } from '../validators/transfer.validator';
import type { CreateBeneficiaryDto, CreateTransferDto } from '../dto/create-transfer.dto';
import type { SearchTransfersDto } from '../dto/search-transfers.dto';
import type { BeneficiaryResponseDto, TransferResponseDto, TransferSearchResponseDto, BeneficiarySearchResponseDto } from '../dto/transfer-response.dto';
import { TransferStatus } from '../enums/transfer-status.enum';
import { TransferType, TRANSFER_TO_TRANSACTION_TYPE } from '../enums/transfer-type.enum';
import {
  BeneficiaryCreatedEvent,
  BeneficiaryVerifiedEvent,
  TransferCancelledEvent,
  TransferCompletedEvent,
  TransferCreatedEvent,
  TransferEventType,
  TransferReversedEvent,
  TransferSentEvent,
  TransferSettledEvent,
  TransferSubmittedEvent,
} from '../events/transfer.events';
import {
  BeneficiaryNotFoundException,
  DuplicateTransferReferenceException,
  TransferNotFoundException,
  TransferPolicyViolationException,
  TransferValidationException,
} from '../exceptions/transfer-domain.exception';
import type { AuthenticatedUser } from '../../accounts/policies/account.policy';

interface TransferAuditEntry {
  transferId: string;
  action: string;
  performedBy: string;
  timestamp: Date;
  details?: Record<string, string>;
}

@Injectable()
export class TransferService {
  private readonly logger = new Logger(TransferService.name);
  private readonly auditLog: TransferAuditEntry[] = [];

  constructor(
    @Inject(AccountService) private readonly accountService: AccountService,
    @Inject(TransactionService) private readonly transactionService: TransactionService,
    @Inject(TransferRepository) private readonly repository: TransferRepository,
    @Inject(TransferPolicy) private readonly policy: TransferPolicy,
    @Inject(TransferValidator) private readonly validator: TransferValidator,
    @Inject(TransferMapper) private readonly mapper: TransferMapper,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
  ) {}

  async createTransfer(user: AuthenticatedUser, dto: CreateTransferDto): Promise<TransferResponseDto> {
    const isHolder = await this.accountService.isAccountHolder(dto.sourceAccountId, user.id);
    if (!isHolder && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new TransferPolicyViolationException('You do not have permission to transfer from this account');
    }

    if (dto.idempotencyKey) {
      const existing = await this.repository.findByIdempotencyKey(dto.idempotencyKey);
      if (existing) {
        return this.mapper.toTransferResponse(existing);
      }
    }

    if (dto.reference && (await this.repository.existsByReference(dto.reference))) {
      throw new DuplicateTransferReferenceException(dto.reference);
    }

    const sourceAccount = await this.accountService.findById(dto.sourceAccountId);
    if (!sourceAccount) {
      throw new TransferValidationException(`Source account ${dto.sourceAccountId} not found`);
    }

    const beneficiary = dto.beneficiaryId ? await this.repository.findBeneficiaryById(dto.beneficiaryId) : null;
    const destinationAccount = dto.destinationAccountId ? await this.accountService.findById(dto.destinationAccountId) : null;
    if (dto.type === TransferType.INTERNAL && !destinationAccount) {
      throw new TransferValidationException('Internal transfers require a valid destination Atlas account');
    }

    const policyResult = this.policy.authorize({
      transferType: dto.type,
      sourceAccountId: dto.sourceAccountId,
      amount: dto.amount,
      currency: dto.currency,
      beneficiaryId: dto.beneficiaryId,
      destinationAccountId: dto.destinationAccountId,
      accountStatus: sourceAccount.status,
      availableBalance: sourceAccount.availableBalance?.toString?.() ?? undefined,
      reference: dto.reference,
    });

    if (!policyResult.allowed) {
      throw new TransferPolicyViolationException(policyResult.violations.join('; '));
    }

    if (dto.type !== TransferType.INTERNAL && !beneficiary && !destinationAccount) {
      throw new TransferValidationException('Non-internal transfers require a beneficiary or destination account');
    }

    if (dto.routingNumber && !this.validator.validateRoutingNumber(dto.routingNumber)) {
      throw new TransferValidationException('Routing number must be 9 digits');
    }

    if (dto.swiftCode && !this.validator.validateSwiftCode(dto.swiftCode)) {
      throw new TransferValidationException('SWIFT/BIC code is invalid');
    }

    if (dto.destinationCountry === 'US' && dto.routingNumber === undefined && (dto.type === TransferType.DOMESTIC_WIRE || dto.type === TransferType.SAME_DAY_ACH)) {
      throw new TransferValidationException('Domestic transfers require a routing number');
    }

    const now = new Date();
    const transferId = randomUUID();
    const record: TransferRecord = {
      id: transferId,
      reference: dto.reference ?? this.generateReference(dto.type),
      idempotencyKey: dto.idempotencyKey,
      type: dto.type,
      status: dto.scheduledAt ? TransferStatus.QUEUED : TransferStatus.CREATED,
      sourceAccountId: dto.sourceAccountId,
      destinationAccountId: dto.destinationAccountId,
      beneficiaryId: dto.beneficiaryId,
      amount: dto.amount,
      currency: dto.currency,
      description: dto.description,
      memo: dto.memo,
      feeAmount: dto.fee?.amount,
      feeType: dto.fee?.feeType,
      feeSharing: dto.fee?.sharing,
      beneficiaryName: dto.beneficiaryName ?? beneficiary?.name,
      beneficiaryBank: dto.bankName ?? beneficiary?.bankName,
      routingNumber: dto.routingNumber ?? beneficiary?.routingNumber,
      swiftCode: dto.swiftCode ?? beneficiary?.swiftCode,
      iban: beneficiary?.iban,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      createdAt: now,
      updatedAt: now,
      metadata: dto.metadata,
    };

    await this.repository.saveTransfer(record);
    this.audit('CREATED', record, user.id, { type: dto.type, amount: dto.amount, currency: dto.currency });

    this.emit(new TransferCreatedEvent(record.id, record.sourceAccountId, {
      type: record.type,
      amount: record.amount,
      currency: record.currency,
      reference: record.reference,
    }), TransferEventType.TRANSFER_CREATED);

    if (!dto.scheduledAt) {
      return this.submitTransfer(user, record.id);
    }

    return this.mapper.toTransferResponse(record);
  }

  async submitTransfer(user: AuthenticatedUser, transferId: string): Promise<TransferResponseDto> {
    const transfer = await this.requireTransfer(transferId);
    if (this.policy.isTerminal(transfer.status)) {
      return this.mapper.toTransferResponse(transfer);
    }

    const policyResult = this.policy.authorize({
      transferType: transfer.type,
      sourceAccountId: transfer.sourceAccountId,
      amount: transfer.amount,
      currency: transfer.currency,
      destinationAccountId: transfer.destinationAccountId,
      beneficiaryId: transfer.beneficiaryId,
    });
    if (!policyResult.allowed) {
      throw new TransferPolicyViolationException(policyResult.violations.join('; '));
    }

    transfer.status = TransferStatus.SUBMITTED;
    transfer.submittedAt = new Date();
    await this.repository.updateTransfer(transfer);
    this.audit('SUBMITTED', transfer, user.id, {});
    this.emit(new TransferSubmittedEvent(transfer.id, transfer.sourceAccountId, { reference: transfer.reference }), TransferEventType.TRANSFER_SUBMITTED);

    if (transfer.type !== TransferType.INTERNAL) {
      transfer.status = TransferStatus.PROCESSING;
      transfer.sentAt = new Date();
      transfer.failureReason = 'External settlement rail is not configured';
      await this.repository.updateTransfer(transfer);
      this.audit('EXTERNAL_PROCESSING', transfer, user.id, { reason: transfer.failureReason });
      this.emit(new TransferSentEvent(transfer.id, transfer.sourceAccountId, { settlementReference: transfer.reference }), TransferEventType.TRANSFER_SENT);
      return this.mapper.toTransferResponse(transfer);
    }

    const transaction = await this.transactionService.createTransaction({ ...this.toTransactionCreateDto(transfer), createdBy: user.id });
    transfer.settlementReference = transaction.reference;
    transfer.status = TransferStatus.PROCESSING;
    transfer.sentAt = new Date();
    await this.repository.updateTransfer(transfer);
    this.emit(new TransferSentEvent(transfer.id, transfer.sourceAccountId, { settlementReference: transaction.reference }), TransferEventType.TRANSFER_SENT);

    transfer.status = TransferStatus.PENDING_SETTLEMENT;
    transfer.settlementAt = new Date();
    await this.repository.updateTransfer(transfer);
    this.emit(new TransferSettledEvent(transfer.id, transfer.sourceAccountId, { settlementReference: transaction.reference }), TransferEventType.TRANSFER_SETTLED);

    transfer.status = TransferStatus.COMPLETED;
    transfer.completedAt = new Date();
    await this.repository.updateTransfer(transfer);
    this.audit('COMPLETED', transfer, user.id, { settlementReference: transaction.reference });
    this.emit(new TransferCompletedEvent(transfer.id, transfer.sourceAccountId, { status: transfer.status }), TransferEventType.TRANSFER_COMPLETED);

    return this.mapper.toTransferResponse(transfer);
  }

  async getTransfer(transferId: string): Promise<TransferResponseDto> {
    return this.mapper.toTransferResponse(await this.requireTransfer(transferId));
  }

  async getTransferForUser(user: AuthenticatedUser, transferId: string): Promise<TransferResponseDto> {
    const transfer = await this.requireTransfer(transferId);
    await this.ensureTransferAccess(user, transfer);
    return this.mapper.toTransferResponse(transfer);
  }

  async searchTransfers(dto: SearchTransfersDto): Promise<TransferSearchResponseDto> {
    const result = await this.repository.search({
      reference: dto.reference,
      status: dto.status,
      type: dto.type,
      beneficiaryId: dto.beneficiaryId,
      accountId: dto.accountId,
      currency: dto.currency,
      minAmount: dto.minAmount,
      maxAmount: dto.maxAmount,
      fromDate: dto.fromDate ? new Date(dto.fromDate) : undefined,
      toDate: dto.toDate ? new Date(dto.toDate) : undefined,
      cursor: dto.cursor,
      limit: dto.limit ?? 50,
    });

    return {
      items: this.mapper.toTransferResponseArray(result.items),
      nextCursor: result.nextCursor,
      totalCount: result.totalCount,
      limit: dto.limit ?? 50,
    };
  }

  async searchTransfersForUser(
    user: AuthenticatedUser,
    dto: SearchTransfersDto,
  ): Promise<TransferSearchResponseDto> {
    if (dto.accountId) {
      const isHolder = await this.accountService.isAccountHolder(dto.accountId, user.id);
      if (!isHolder && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new TransferPolicyViolationException('You do not have permission to view transfers for this account');
      }
      return this.searchTransfers(dto);
    }

    const accounts = await this.accountService.listAccounts(user, { limit: 100 });
    const results = await Promise.all(
      accounts.data.map((account) =>
        this.repository.search({
          reference: dto.reference,
          status: dto.status,
          type: dto.type,
          beneficiaryId: dto.beneficiaryId,
          accountId: account.id,
          currency: dto.currency,
          minAmount: dto.minAmount,
          maxAmount: dto.maxAmount,
          fromDate: dto.fromDate ? new Date(dto.fromDate) : undefined,
          toDate: dto.toDate ? new Date(dto.toDate) : undefined,
          cursor: dto.cursor,
          limit: dto.limit ?? 50,
        }),
      ),
    );
    const items = results
      .flatMap((result) => result.items)
      .filter((item, index, rows) => rows.findIndex((row) => row.id === item.id) === index)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, dto.limit ?? 50);

    return {
      items: this.mapper.toTransferResponseArray(items),
      nextCursor: items.length === (dto.limit ?? 50) ? items.at(-1)?.id : undefined,
      totalCount: items.length,
      limit: dto.limit ?? 50,
    };
  }

  async cancelTransfer(user: AuthenticatedUser, transferId: string, reason: string): Promise<TransferResponseDto> {
    const transfer = await this.requireTransfer(transferId);
    if (!this.policy.canCancel(transfer.status)) {
      throw new TransferValidationException(`Cannot cancel transfer in status ${transfer.status}`);
    }

    transfer.status = TransferStatus.CANCELLED;
    transfer.cancelledAt = new Date();
    transfer.failureReason = reason;
    await this.repository.updateTransfer(transfer);
    this.audit('CANCELLED', transfer, user.id, { reason });
    this.emit(new TransferCancelledEvent(transfer.id, transfer.sourceAccountId, { reason }), TransferEventType.TRANSFER_CANCELLED);
    return this.mapper.toTransferResponse(transfer);
  }

  async reverseTransfer(user: AuthenticatedUser, transferId: string, reason: string): Promise<TransferResponseDto> {
    const transfer = await this.requireTransfer(transferId);
    if (!this.policy.canReverse(transfer.status)) {
      throw new TransferValidationException(`Cannot reverse transfer in status ${transfer.status}`);
    }

    const reversalTransaction = await this.transactionService.createTransaction(this.toReversalTransactionCreateDto(transfer, reason));
    transfer.status = TransferStatus.REVERSED;
    transfer.reversedAt = new Date();
    transfer.reversalTransactionId = reversalTransaction.id;
    await this.repository.updateTransfer(transfer);
    this.audit('REVERSED', transfer, user.id, { reason, reversalTransactionId: reversalTransaction.id });
    this.emit(new TransferReversedEvent(transfer.id, transfer.sourceAccountId, { reason, reversalTransactionId: reversalTransaction.id }), TransferEventType.TRANSFER_REVERSED);
    return this.mapper.toTransferResponse(transfer);
  }

  async createBeneficiary(user: AuthenticatedUser, dto: CreateBeneficiaryDto): Promise<BeneficiaryResponseDto> {
    const beneficiary: BeneficiaryRecord = {
      id: randomUUID(),
      userId: user.id,
      name: dto.name,
      type: dto.type,
      routingNumber: dto.routingNumber,
      swiftCode: dto.swiftCode,
      iban: dto.iban,
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      country: dto.country,
      currency: dto.currency,
      favorite: dto.favorite ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.repository.saveBeneficiary(beneficiary);
    this.audit('BENEFICIARY_CREATED', undefined as never, user.id, { beneficiaryId: beneficiary.id, name: beneficiary.name });
    this.emit(new BeneficiaryCreatedEvent(beneficiary.id, user.id), TransferEventType.BENEFICIARY_CREATED);
    return this.mapper.toBeneficiaryResponse(beneficiary);
  }

  async updateBeneficiary(user: AuthenticatedUser, beneficiaryId: string, dto: CreateBeneficiaryDto): Promise<BeneficiaryResponseDto> {
    const beneficiary = await this.requireBeneficiary(beneficiaryId);
    const updated = await this.repository.updateBeneficiary({
      ...beneficiary,
      name: dto.name,
      type: dto.type,
      routingNumber: dto.routingNumber,
      swiftCode: dto.swiftCode,
      iban: dto.iban,
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      country: dto.country,
      currency: dto.currency,
      favorite: dto.favorite ?? beneficiary.favorite,
    });
    this.audit('BENEFICIARY_UPDATED', undefined as never, user.id, { beneficiaryId });
    return this.mapper.toBeneficiaryResponse(updated);
  }

  async deleteBeneficiary(user: AuthenticatedUser, beneficiaryId: string): Promise<void> {
    const beneficiary = await this.requireBeneficiary(beneficiaryId);
    await this.repository.updateBeneficiary({ ...beneficiary, deletedAt: new Date() });
    this.audit('BENEFICIARY_DELETED', undefined as never, user.id, { beneficiaryId });
  }

  async verifyBeneficiary(user: AuthenticatedUser, beneficiaryId: string): Promise<BeneficiaryResponseDto> {
    const beneficiary = await this.requireBeneficiary(beneficiaryId);
    const updated = await this.repository.updateBeneficiary({ ...beneficiary, verifiedAt: new Date() });
    this.emit(new BeneficiaryVerifiedEvent(beneficiary.id, user.id), TransferEventType.BENEFICIARY_VERIFIED);
    return this.mapper.toBeneficiaryResponse(updated);
  }

  async listBeneficiaries(user: AuthenticatedUser, limit = 20, cursor?: string): Promise<BeneficiarySearchResponseDto> {
    const result = await this.repository.searchBeneficiaries(user.id, limit, cursor);
    return {
      items: this.mapper.toBeneficiaryResponseArray(result.items),
      nextCursor: result.nextCursor,
      totalCount: result.totalCount,
    };
  }

  async favoriteBeneficiary(user: AuthenticatedUser, beneficiaryId: string, favorite: boolean): Promise<BeneficiaryResponseDto> {
    const beneficiary = await this.requireBeneficiary(beneficiaryId);
    const updated = await this.repository.updateBeneficiary({ ...beneficiary, favorite });
    return this.mapper.toBeneficiaryResponse(updated);
  }

  async executeQueuedTransfers(user: AuthenticatedUser): Promise<TransferResponseDto[]> {
    const queued = await this.repository.search({ limit: 100, status: TransferStatus.QUEUED });
    const executed: TransferResponseDto[] = [];
    for (const transfer of queued.items) {
      executed.push(await this.submitTransfer(user, transfer.id));
    }
    return executed;
  }

  private toTransactionCreateDto(transfer: TransferRecord): CreateTransactionDto {
    const transactionType = this.mapTransferToTransactionType(transfer.type);
    return {
      type: transactionType,
      accountId: transfer.sourceAccountId,
      counterpartyAccountId: transfer.destinationAccountId,
      amount: transfer.amount,
      currency: transfer.currency,
      description: transfer.description ?? transfer.memo ?? transfer.reference,
      idempotencyKey: transfer.idempotencyKey,
      reference: transfer.reference,
      metadata: transfer.metadata,
      createdBy: undefined,
      scheduledAt: transfer.scheduledAt?.toISOString(),
      counterparty: transfer.beneficiaryName,
      beneficiaryName: transfer.beneficiaryName,
      beneficiaryBank: transfer.beneficiaryBank,
      routingNumber: transfer.routingNumber,
      swiftCode: transfer.swiftCode,
    } as never;
  }

  private toReversalTransactionCreateDto(transfer: TransferRecord, reason: string): CreateTransactionDto {
    return {
      type: TransactionType.REVERSAL,
      accountId: transfer.sourceAccountId,
      counterpartyAccountId: transfer.destinationAccountId,
      amount: transfer.amount,
      currency: transfer.currency,
      description: `Reversal of ${transfer.reference ?? transfer.id}: ${reason}`,
      idempotencyKey: `${transfer.id}-reversal`,
      reference: `${transfer.reference ?? transfer.id}-REV`,
      metadata: transfer.metadata,
    } as never;
  }

  private mapTransferToTransactionType(type: TransferType): TransactionType {
    return TRANSFER_TO_TRANSACTION_TYPE[type] as TransactionType;
  }

  private generateReference(type: TransferType): string {
    return `TRF-${type.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private async requireTransfer(transferId: string): Promise<TransferRecord> {
    const transfer = await this.repository.findById(transferId);
    if (!transfer) throw new TransferNotFoundException(transferId);
    return transfer;
  }

  private async ensureTransferAccess(user: AuthenticatedUser, transfer: TransferRecord): Promise<void> {
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return;
    }
    const sourceHolder = await this.accountService.isAccountHolder(transfer.sourceAccountId, user.id);
    const destinationHolder = transfer.destinationAccountId
      ? await this.accountService.isAccountHolder(transfer.destinationAccountId, user.id)
      : false;
    if (!sourceHolder && !destinationHolder) {
      throw new TransferPolicyViolationException('You do not have permission to view this transfer');
    }
  }

  private async requireBeneficiary(beneficiaryId: string): Promise<BeneficiaryRecord> {
    const beneficiary = await this.repository.findBeneficiaryById(beneficiaryId);
    if (!beneficiary) throw new BeneficiaryNotFoundException(beneficiaryId);
    return beneficiary;
  }

  private audit(action: string, transfer: TransferRecord | undefined, performedBy: string, details?: Record<string, string>): void {
    this.auditLog.push({
      transferId: transfer?.id ?? 'N/A',
      action,
      performedBy,
      timestamp: new Date(),
      details,
    });
  }

  private emit(event: unknown, eventType: TransferEventType): void {
    this.eventEmitter.emit(eventType, event);
  }
}

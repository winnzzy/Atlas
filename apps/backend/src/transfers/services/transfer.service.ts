import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountService } from '../../accounts/services/account.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { TransactionType } from '../../transactions/enums/transaction-type.enum';
import { TransactionStatus } from '../../transactions/enums/transaction-status.enum';
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
  TransferFailedEvent,
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
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  /**
   * Enforce transfer eligibility on the BACKEND, in a predictable order, before
   * any money moves. The frontend never decides this — hiding a button is not a
   * control. Order (spec §14): authentication → account ownership → KYC →
   * account status/restriction → (available balance is enforced by the policy).
   *
   * Admin-initiated flows (retry/cancel) run as an ADMIN actor and are exempt
   * from the customer KYC gate; they still respect account status via the policy.
   */
  private async assertTransferEligibility(
    user: AuthenticatedUser,
    sourceAccount: { status: string },
  ): Promise<{ restricted: boolean }> {
    const isAdminActor = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    // ── KYC gate ──────────────────────────────────────────────────────────
    if (!isAdminActor) {
      const owner = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { kycStatus: true },
      });
      if (!owner || owner.kycStatus !== 'APPROVED') {
        throw new TransferPolicyViolationException(
          'Identity verification (KYC) must be approved before you can initiate transfers. Please complete verification and try again.',
        );
      }
    }

    // ── Account status / restriction gate ────────────────────────────────
    // A restricted / frozen / locked account MAY submit the request, but it must
    // NOT settle and must NOT debit any balance: it is parked in a pending state
    // and the customer is told to contact support (see createRestrictedPendingTransfer).
    // We never leak the internal administrative reason to the customer.
    const status = sourceAccount.status;
    if (status === 'RESTRICTED' || status === 'FROZEN' || status === 'LOCKED') {
      return { restricted: true };
    }
    // Any other non-transactable status (closed, archived, dormant, …) is a hard reject.
    if (status !== 'ACTIVE' && status !== 'PENDING') {
      throw new TransferPolicyViolationException(
        `This account is not currently eligible for transfers (status: ${status}).`,
      );
    }
    return { restricted: false };
  }

  /**
   * A restricted/frozen/locked source account parks the transfer in a pending
   * state instead of settling it. Critically, NO transaction is created and NO
   * balance is debited — the money never moves. The customer receives a neutral
   * "contact support" message; the real restriction reason stays internal
   * (persisted on the record for admins, never mapped into the customer DTO).
   */
  private async createRestrictedPendingTransfer(
    user: AuthenticatedUser,
    dto: CreateTransferDto,
    sourceAccount: { status: string },
  ): Promise<TransferResponseDto> {
    const now = new Date();
    const record: TransferRecord = {
      id: randomUUID(),
      reference: dto.reference ?? this.generateReference(dto.type),
      idempotencyKey: dto.idempotencyKey,
      type: dto.type,
      status: TransferStatus.PENDING_APPROVAL,
      sourceAccountId: dto.sourceAccountId,
      destinationAccountId: dto.destinationAccountId,
      beneficiaryId: dto.beneficiaryId,
      amount: dto.amount,
      currency: dto.currency,
      description: dto.description,
      memo: dto.memo,
      beneficiaryName: dto.beneficiaryName,
      // Internal, admin-only note. The mapper never copies failureReason into the
      // customer response, so this restriction detail is not disclosed to the customer.
      failureReason: `Source account restricted (status: ${sourceAccount.status})`,
      createdAt: now,
      updatedAt: now,
      metadata: dto.metadata,
    };

    await this.repository.saveTransfer(record);
    this.audit('CREATED_PENDING_RESTRICTED', record, user.id, { status: sourceAccount.status });
    this.emit(
      new TransferCreatedEvent(record.id, record.sourceAccountId, {
        type: record.type,
        amount: record.amount,
        currency: record.currency,
        reference: record.reference,
      }),
      TransferEventType.TRANSFER_CREATED,
    );

    const response = this.mapper.toTransferResponse(record);
    response.statusMessage =
      'Transfer pending. Please contact customer support to complete this transaction.';
    return response;
  }

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

    // KYC + account-restriction gating happens here, server-side, before any
    // money moves and before the balance/policy checks below.
    const { restricted } = await this.assertTransferEligibility(user, sourceAccount);

    // Restricted/frozen/locked accounts never settle: park the request as pending
    // and return the support message without touching the ledger or balance.
    if (restricted) {
      return this.createRestrictedPendingTransfer(user, dto, sourceAccount);
    }

    const beneficiary = dto.beneficiaryId ? await this.repository.findBeneficiaryById(dto.beneficiaryId) : null;
    const destinationAccount = dto.destinationAccountId ? await this.accountService.findById(dto.destinationAccountId) : null;
    if (dto.type === TransferType.INTERNAL && !destinationAccount) {
      throw new TransferValidationException('Internal transfers require a valid destination Atlas account');
    }

    // Inline external destination: the customer typed the recipient bank details
    // directly (no saved beneficiary, no internal destination account).
    const isExternal = dto.type !== TransferType.INTERNAL;
    const hasExternalDestination = isExternal && !beneficiary && !destinationAccount
      ? Boolean(dto.beneficiaryName) && Boolean(dto.destinationAccountNumber)
      : false;

    // Validate the supplied US banking details with clear, field-level messages
    // before the policy runs, so the customer sees the precise problem.
    if (hasExternalDestination) {
      if (!this.validator.validateRoutingNumber(dto.routingNumber)) {
        throw new TransferValidationException('Routing number must be exactly 9 digits.');
      }
      if (!this.validator.validateAccountNumber(dto.destinationAccountNumber)) {
        throw new TransferValidationException('Account number must contain 4–17 digits.');
      }
    }

    const policyResult = this.policy.authorize({
      transferType: dto.type,
      sourceAccountId: dto.sourceAccountId,
      amount: dto.amount,
      currency: dto.currency,
      beneficiaryId: dto.beneficiaryId,
      destinationAccountId: dto.destinationAccountId,
      hasExternalDestination,
      accountStatus: sourceAccount.status,
      availableBalance: sourceAccount.availableBalance?.toString?.() ?? undefined,
      reference: dto.reference,
    });

    if (!policyResult.allowed) {
      throw new TransferPolicyViolationException(policyResult.violations.join('; '));
    }

    if (isExternal && !beneficiary && !destinationAccount && !hasExternalDestination) {
      throw new TransferValidationException('Non-internal transfers require a beneficiary or destination account');
    }

    if (dto.routingNumber && !this.validator.validateRoutingNumber(dto.routingNumber)) {
      throw new TransferValidationException('Routing number must be exactly 9 digits.');
    }

    if (dto.destinationAccountNumber && !this.validator.validateAccountNumber(dto.destinationAccountNumber)) {
      throw new TransferValidationException('Account number must contain 4–17 digits.');
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
      metadata: this.buildTransferMetadata(dto),
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
      // The transfer already passed full validation at creation; an external
      // transfer carries its destination inline (recipient name persisted).
      hasExternalDestination: transfer.type !== TransferType.INTERNAL && Boolean(transfer.beneficiaryName),
    });
    if (!policyResult.allowed) {
      throw new TransferPolicyViolationException(policyResult.violations.join('; '));
    }

    transfer.status = TransferStatus.SUBMITTED;
    transfer.submittedAt = new Date();
    await this.repository.updateTransfer(transfer);
    this.audit('SUBMITTED', transfer, user.id, {});
    this.emit(new TransferSubmittedEvent(transfer.id, transfer.sourceAccountId, { reference: transfer.reference }), TransferEventType.TRANSFER_SUBMITTED);

    // Both internal and external transfers settle through the existing ledger
    // architecture (external rails are simulated — no real ACH/wire is sent). The
    // transaction type debits the source account so the balance decreases; there
    // is no direct balance mutation here.
    const transaction = await this.transactionService.createTransaction({ ...this.toTransactionCreateDto(transfer), createdBy: user.id });
    transfer.settlementReference = transaction.reference;

    // The transaction is the AUTHORITATIVE settlement engine. The transfer's
    // terminal state must mirror it — we never blindly report success. If
    // settlement failed (e.g. a ledger/balance error), the transfer fails too:
    // no fake "COMPLETED", and no split-brain where the customer sees success
    // while admin/ledger show a failed, un-debited transaction.
    if (this.isFailedSettlement(transaction.status)) {
      return this.failTransferFromSettlement(user, transfer, transaction);
    }

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

  /** A settlement is failed when the authoritative transaction reached a failure terminal state. */
  private isFailedSettlement(status: string | undefined): boolean {
    const value = String(status ?? TransactionStatus.COMPLETED).toUpperCase();
    return (
      value === TransactionStatus.FAILED ||
      value === TransactionStatus.CANCELLED ||
      value === TransactionStatus.REVERSED ||
      value === TransactionStatus.EXPIRED
    );
  }

  /**
   * Settlement failed: mark the transfer FAILED so every surface agrees. No
   * balance moved (the transaction rolled back its own ledger/balance work), so
   * there is nothing to reverse here. The customer is told the transfer could not
   * be completed — never a false success — without leaking internal detail.
   */
  private async failTransferFromSettlement(
    user: AuthenticatedUser,
    transfer: TransferRecord,
    transaction: { reference?: string; status?: string; failureReason?: string },
  ): Promise<TransferResponseDto> {
    const reason = transaction.failureReason ?? `Settlement ${String(transaction.status ?? 'FAILED').toLowerCase()}`;
    transfer.status = TransferStatus.FAILED;
    transfer.failedAt = new Date();
    transfer.failureReason = reason;
    await this.repository.updateTransfer(transfer);
    this.audit('FAILED', transfer, user.id, { settlementReference: transaction.reference ?? '', reason });
    this.emit(
      new TransferFailedEvent(transfer.id, transfer.sourceAccountId, { reason }),
      TransferEventType.TRANSFER_FAILED,
    );

    const response = this.mapper.toTransferResponse(transfer);
    response.statusMessage =
      'Transfer could not be completed and no funds were moved. Please try again or contact customer support.';
    return response;
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

  // Persist external destination context for admins. The full external account
  // number is never stored — only the last four digits — and no customer-facing
  // response echoes it back.
  private buildTransferMetadata(dto: CreateTransferDto): Record<string, string> | undefined {
    const meta: Record<string, string> = { ...(dto.metadata ?? {}) };
    if (dto.destinationAccountNumber) {
      meta.destinationAccountLast4 = dto.destinationAccountNumber.slice(-4);
    }
    if (dto.destinationAccountType) {
      meta.destinationAccountType = dto.destinationAccountType;
    }
    return Object.keys(meta).length > 0 ? meta : undefined;
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

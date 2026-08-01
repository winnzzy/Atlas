import { Inject, Injectable } from '@nestjs/common';
import { TransferStatus, TERMINAL_TRANSFER_STATUSES } from '../enums/transfer-status.enum';
import { TransferType } from '../enums/transfer-type.enum';
import { TransferValidator } from '../validators/transfer.validator';

export interface TransferAuthorizationContext {
  transferType: TransferType;
  sourceAccountId: string;
  amount: string;
  currency: string;
  beneficiaryId?: string;
  destinationAccountId?: string;
  accountStatus?: string;
  availableBalance?: string;
  reference?: string;
}

export interface TransferPolicyResult {
  allowed: boolean;
  violations: string[];
}

@Injectable()
export class TransferPolicy {
  constructor(@Inject(TransferValidator) private readonly validator: TransferValidator) {}

  authorize(ctx: TransferAuthorizationContext): TransferPolicyResult {
    const violations: string[] = [];

    if (!this.validator.validateAmount(ctx.amount)) {
      violations.push('Transfer amount must be positive');
    }

    if (!ctx.currency) {
      violations.push('Transfer currency is required');
    }

    if (!this.validator.validateTransferType(ctx.transferType, Boolean(ctx.destinationAccountId), Boolean(ctx.beneficiaryId))) {
      violations.push('Transfer type requires a destination account or beneficiary');
    }

    if (ctx.accountStatus && ctx.accountStatus !== 'ACTIVE' && ctx.accountStatus !== 'PENDING') {
      violations.push(`Source account ${ctx.sourceAccountId} is not open for transfers (status: ${ctx.accountStatus})`);
    }

    if ((ctx.transferType === TransferType.INTERNAL || ctx.transferType === TransferType.ACH_DEBIT || ctx.transferType === TransferType.DOMESTIC_WIRE || ctx.transferType === TransferType.INTERNATIONAL_WIRE || ctx.transferType === TransferType.SWIFT) && ctx.availableBalance) {
      if (Number(ctx.availableBalance) < Number(ctx.amount)) {
        violations.push('Insufficient available balance for transfer');
      }
    }

    if (ctx.transferType === TransferType.INTERNAL && !ctx.destinationAccountId) {
      violations.push('Internal transfers require a destination account');
    }

    return { allowed: violations.length === 0, violations };
  }

  canCancel(currentStatus: TransferStatus): boolean {
    return [TransferStatus.CREATED, TransferStatus.VALIDATED, TransferStatus.PENDING_APPROVAL, TransferStatus.QUEUED, TransferStatus.SUBMITTED, TransferStatus.PROCESSING].includes(currentStatus);
  }

  canReverse(currentStatus: TransferStatus): boolean {
    return [TransferStatus.SETTLED, TransferStatus.COMPLETED, TransferStatus.SENT].includes(currentStatus);
  }

  canFail(currentStatus: TransferStatus): boolean {
    return !TERMINAL_TRANSFER_STATUSES.has(currentStatus);
  }

  isTerminal(status: TransferStatus): boolean {
    return TERMINAL_TRANSFER_STATUSES.has(status);
  }
}

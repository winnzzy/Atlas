import { Injectable } from '@nestjs/common';
import { TransferType } from '../enums/transfer-type.enum';

@Injectable()
export class TransferValidator {
  validateRoutingNumber(routingNumber?: string): boolean {
    if (!routingNumber) return true;
    return /^\d{9}$/.test(routingNumber);
  }

  validateSwiftCode(swiftCode?: string): boolean {
    if (!swiftCode) return true;
    return /^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(swiftCode.toUpperCase());
  }

  validateIban(iban?: string): boolean {
    if (!iban) return true;
    return /^[A-Z0-9]{15,34}$/.test(iban.toUpperCase());
  }

  validateAmount(amount: string): boolean {
    const parsed = Number(amount);
    return Number.isFinite(parsed) && parsed > 0;
  }

  validateTransferType(type: TransferType, hasDestinationAccount: boolean, hasBeneficiary: boolean): boolean {
    if (type === TransferType.INTERNAL) {
      return hasDestinationAccount;
    }

    if (type === TransferType.PAYROLL_BATCH) {
      return hasBeneficiary;
    }

    return hasDestinationAccount || hasBeneficiary;
  }
}

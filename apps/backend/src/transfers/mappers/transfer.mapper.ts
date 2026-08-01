import { Injectable } from '@nestjs/common';
import type { TransferRecord, BeneficiaryRecord } from '../repositories/transfer.repository';
import type { TransferResponseDto, BeneficiaryResponseDto } from '../dto/transfer-response.dto';

@Injectable()
export class TransferMapper {
  toTransferResponse(record: TransferRecord): TransferResponseDto {
    return {
      id: record.id,
      reference: record.reference,
      type: record.type,
      status: record.status,
      sourceAccountId: record.sourceAccountId,
      destinationAccountId: record.destinationAccountId,
      beneficiaryId: record.beneficiaryId,
      amount: record.amount,
      currency: record.currency,
      description: record.description,
      memo: record.memo,
      idempotencyKey: record.idempotencyKey,
      feeAmount: record.feeAmount,
      feeType: record.feeType,
      feeSharing: record.feeSharing,
      beneficiaryName: record.beneficiaryName,
      beneficiaryBank: record.beneficiaryBank,
      routingNumber: record.routingNumber,
      swiftCode: record.swiftCode,
      iban: record.iban,
      settlementReference: record.settlementReference,
      submittedAt: record.submittedAt,
      sentAt: record.sentAt,
      settlementAt: record.settlementAt,
      completedAt: record.completedAt,
      failedAt: record.failedAt,
      cancelledAt: record.cancelledAt,
      returnedAt: record.returnedAt,
      reversedAt: record.reversedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      metadata: record.metadata,
    };
  }

  toTransferResponseArray(records: TransferRecord[]): TransferResponseDto[] {
    return records.map((record) => this.toTransferResponse(record));
  }

  toBeneficiaryResponse(record: BeneficiaryRecord): BeneficiaryResponseDto {
    return {
      id: record.id,
      name: record.name,
      type: record.type,
      currency: record.currency,
      routingNumber: record.routingNumber,
      swiftCode: record.swiftCode,
      iban: record.iban,
      bankName: record.bankName,
      accountNumber: record.accountNumber,
      country: record.country,
      favorite: record.favorite,
      verifiedAt: record.verifiedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  toBeneficiaryResponseArray(records: BeneficiaryRecord[]): BeneficiaryResponseDto[] {
    return records.map((record) => this.toBeneficiaryResponse(record));
  }
}

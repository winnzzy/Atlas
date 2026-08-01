import { Injectable } from '@nestjs/common';
import type { TransactionRecord } from '../repositories/transaction.repository';
import type { TransactionResponseDto } from '../dto/transaction-response.dto';

@Injectable()
export class TransactionMapper {
  /**
   * Map a TransactionRecord to a TransactionResponseDto.
   */
  toResponseDto(record: TransactionRecord): TransactionResponseDto {
    return {
      id: record.id,
      reference: record.reference,
      idempotencyKey: record.idempotencyKey,
      type: record.type,
      status: record.status,
      accountId: record.accountId,
      amount: record.amount,
      currency: record.currency,
      description: record.description,
      counterpartyAccountId: record.counterpartyAccountId,
      metadata: record.metadata,
      journalId: record.journalId,
      failureReason: record.failureReason,
      failureCode: record.failureCode,
      reversalId: record.reversalId,
      reversalOfId: record.reversalOfId,
      createdBy: record.createdBy,
      authorizedBy: record.authorizedBy,
      postedBy: record.postedBy,
      settledBy: record.settledBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      authorizedAt: record.authorizedAt,
      postedAt: record.postedAt,
      settledAt: record.settledAt,
      completedAt: record.completedAt,
      failedAt: record.failedAt,
      cancelledAt: record.cancelledAt,
      reversedAt: record.reversedAt,
      expiresAt: record.expiresAt,
    };
  }

  /**
   * Map multiple TransactionRecords to TransactionResponseDto array.
   */
  toResponseDtoArray(records: TransactionRecord[]): TransactionResponseDto[] {
    return records.map((record) => this.toResponseDto(record));
  }
}
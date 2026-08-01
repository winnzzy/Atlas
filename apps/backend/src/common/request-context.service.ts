import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';

export interface RequestContext {
  requestId: string;
  correlationId: string;
  idempotencyKey?: string;
  financialTransactionId?: string;
  userId?: string;
  method: string;
  path: string;
  startedAt: number;
}

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  runFromRequest(request: Request, callback: () => void): void {
    const requestId = this.readHeader(request, 'x-request-id') ?? randomUUID();
    const correlationId = this.readHeader(request, 'x-correlation-id') ?? requestId;
    const idempotencyKey = this.readHeader(request, 'idempotency-key') ?? undefined;

    this.storage.run(
      {
        requestId,
        correlationId,
        idempotencyKey,
        method: request.method,
        path: request.originalUrl ?? request.url,
        startedAt: Date.now(),
      },
      callback,
    );
  }

  get(): RequestContext | undefined {
    return this.storage.getStore();
  }

  setUser(userId: string): void {
    const context = this.storage.getStore();
    if (context) {
      context.userId = userId;
    }
  }

  setFinancialTransactionId(transactionId: string): void {
    const context = this.storage.getStore();
    if (context) {
      context.financialTransactionId = transactionId;
    }
  }

  private readHeader(request: Request, headerName: string): string | undefined {
    const value = request.headers[headerName];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    return undefined;
  }
}
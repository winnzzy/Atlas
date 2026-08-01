import { ConflictException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

export interface IdempotencyResponse<T> {
  statusCode: number;
  body: T;
}

interface IdempotencyRecord<T> {
  fingerprint: string;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'completed';
  response?: IdempotencyResponse<T>;
  promise?: Promise<IdempotencyResponse<T>>;
}

export interface IdempotencyExecution<T> {
  replayed: boolean;
  response: IdempotencyResponse<T>;
}

@Injectable()
export class IdempotencyService {
  private readonly records = new Map<string, IdempotencyRecord<unknown>>();
  private readonly defaultTtlMs = 1000 * 60 * 60 * 24;

  async execute<T>(params: {
    key?: string;
    fingerprint: string;
    ttlMs?: number;
    handler: () => Promise<IdempotencyResponse<T>>;
  }): Promise<IdempotencyExecution<T>> {
    if (!params.key) {
      return { replayed: false, response: await params.handler() };
    }

    this.cleanupExpired();

    const existing = this.records.get(params.key) as IdempotencyRecord<T> | undefined;
    if (existing) {
      if (existing.fingerprint !== params.fingerprint) {
        throw new ConflictException('Idempotency key was reused with a different request fingerprint');
      }

      if (existing.status === 'completed' && existing.response) {
        return { replayed: true, response: existing.response };
      }

      if (existing.promise) {
        const response = await existing.promise;
        return { replayed: true, response };
      }
    }

    let resolvePromise!: (response: IdempotencyResponse<T>) => void;
    let rejectPromise!: (error: unknown) => void;
    const promise = new Promise<IdempotencyResponse<T>>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    this.records.set(params.key, {
      fingerprint: params.fingerprint,
      createdAt: Date.now(),
      expiresAt: Date.now() + (params.ttlMs ?? this.defaultTtlMs),
      status: 'pending',
      promise,
    });

    try {
      const response = await params.handler();
      this.records.set(params.key, {
        fingerprint: params.fingerprint,
        createdAt: Date.now(),
        expiresAt: Date.now() + (params.ttlMs ?? this.defaultTtlMs),
        status: 'completed',
        response,
      });
      resolvePromise(response);
      return { replayed: false, response };
    } catch (error) {
      this.records.delete(params.key);
      rejectPromise(error);
      throw error;
    }
  }

  fingerprintFrom(input: {
    method: string;
    path: string;
    userId?: string;
    body?: unknown;
  }): string {
    const stableBody = this.stableStringify(input.body ?? null);
    const payload = [input.method.toUpperCase(), input.path, input.userId ?? '', stableBody].join('|');
    return createHash('sha256').update(payload).digest('hex');
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (record.expiresAt <= now) {
        this.records.delete(key);
      }
    }
  }

  private stableStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
    }

    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${this.stableStringify(item)}`);

    return `{${entries.join(',')}}`;
  }
}
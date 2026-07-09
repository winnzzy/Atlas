import { Injectable } from '@nestjs/common';

export type HealthCheckResult = {
  readonly status: string;
  readonly timestamp: string;
  readonly uptime: number;
  readonly version: string;
};

@Injectable()
export class HealthService {
  check(): HealthCheckResult {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '0.1.0',
    };
  }
}

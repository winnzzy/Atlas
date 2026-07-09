import type { Environment } from '@atlas/types';

export type AppConfig = {
  readonly nodeEnv: Environment;
  readonly port: number;
  readonly apiPrefix: string;
  readonly corsOrigin: string;
};

export function getAppConfig(): AppConfig {
  return {
    nodeEnv: (process.env['NODE_ENV'] ?? 'development') as Environment,
    port: parseInt(process.env['PORT'] ?? '3000', 10),
    apiPrefix: process.env['API_PREFIX'] ?? 'api',
    corsOrigin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
  };
}

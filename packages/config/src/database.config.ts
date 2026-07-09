export type DatabaseConfig = {
  readonly url: string;
};

export function getDatabaseConfig(): DatabaseConfig {
  return {
    url:
      process.env['DATABASE_URL'] ?? 'postgresql://atlas:atlas@localhost:5432/atlas?schema=public',
  };
}

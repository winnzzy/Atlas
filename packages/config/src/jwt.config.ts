export type JwtConfig = {
  readonly secret: string;
  readonly expiration: string;
  readonly refreshExpiration: string;
};

export function getJwtConfig(): JwtConfig {
  return {
    secret: process.env['JWT_SECRET'] ?? 'default-secret-change-in-production',
    expiration: process.env['JWT_EXPIRATION'] ?? '15m',
    refreshExpiration: process.env['JWT_REFRESH_EXPIRATION'] ?? '7d',
  };
}

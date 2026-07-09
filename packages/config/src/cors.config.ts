export type CorsConfig = {
  readonly origin: string | readonly string[];
  readonly credentials: boolean;
};

export function getCorsConfig(): CorsConfig {
  const origin = process.env['CORS_ORIGIN'] ?? 'http://localhost:3000';
  return {
    origin: origin.split(',').map((o: string) => o.trim()),
    credentials: true,
  };
}

/**
 * API client configuration types.
 */

export type ApiClientConfig = {
  readonly baseUrl: string;
  readonly timeout?: number;
  readonly headers?: Record<string, string>;
};

export type RequestOptions = {
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly path: string;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  readonly params?: Record<string, string>;
};

export type RequestInterceptor = (config: RequestOptions) => RequestOptions;
export type ResponseInterceptor = (response: unknown) => unknown;

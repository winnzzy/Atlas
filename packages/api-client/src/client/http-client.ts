import type { ApiClientConfig, RequestOptions } from '../types/client.types';
import { ApiClientError } from './api-error';

/**
 * HTTP client for making API requests.
 */
export class HttpClient {
  private readonly config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      ...config,
    };
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'GET', path, params });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: 'POST', path, body });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: 'PUT', path, body });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: 'PATCH', path, body });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', path });
  }

  private async request<T>(options: RequestOptions): Promise<T> {
    const url = new URL(options.path, this.config.baseUrl);

    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url.searchParams.set(key, value);
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...options.headers,
    };

    const fetchOptions: RequestInit = {
      method: options.method,
      headers,
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url.toString(), fetchOptions);

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as Record<
          string,
          unknown
        > | null;
        throw new ApiClientError(
          response.status,
          (errorBody?.['code'] as string) ?? 'UNKNOWN_ERROR',
          (errorBody?.['message'] as string) ?? response.statusText,
          errorBody?.['details'] as Record<string, string>[] | undefined,
        );
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError(
        0,
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Unknown network error',
      );
    }
  }
}

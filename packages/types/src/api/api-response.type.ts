/**
 * Standard API response wrapper.
 */
export type ApiResponse<T> = {
  readonly success: boolean;
  readonly data: T;
  readonly message?: string;
  readonly timestamp: string;
};

/**
 * API error response.
 */
export type ApiError = {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: readonly Record<string, string>[];
  };
  readonly timestamp: string;
};

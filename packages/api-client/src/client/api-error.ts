/**
 * API client error class.
 */

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: readonly Record<string, string>[];

  constructor(
    statusCode: number,
    errorCode: string,
    message: string,
    details?: readonly Record<string, string>[],
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

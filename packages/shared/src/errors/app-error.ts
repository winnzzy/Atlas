/**
 * Application error types and classes.
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST'
  | 'RATE_LIMITED';

export type ErrorDetails = {
  readonly field?: string;
  readonly message: string;
};

/**
 * Base application error class.
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: readonly ErrorDetails[];

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: readonly ErrorDetails[],
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }

  static badRequest(message: string, details?: readonly ErrorDetails[]): AppError {
    return new AppError('BAD_REQUEST', message, 400, details);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError('UNAUTHORIZED', message, 401);
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError('FORBIDDEN', message, 403);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError('NOT_FOUND', message, 404);
  }

  static conflict(message: string): AppError {
    return new AppError('CONFLICT', message, 409);
  }

  static validation(message: string, details?: readonly ErrorDetails[]): AppError {
    return new AppError('VALIDATION_ERROR', message, 422, details);
  }

  static rateLimited(message = 'Too many requests'): AppError {
    return new AppError('RATE_LIMITED', message, 429);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError('INTERNAL_ERROR', message, 500);
  }
}

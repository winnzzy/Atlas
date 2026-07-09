/**
 * Pagination request parameters.
 */
export type PaginationParams = {
  readonly page: number;
  readonly limit: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
};

/**
 * Paginated response metadata.
 */
export type PaginatedMeta = {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
};

/**
 * Paginated API response.
 */
export type PaginatedResponse<T> = {
  readonly data: readonly T[];
  readonly meta: PaginatedMeta;
};

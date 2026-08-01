import { BadRequestException, Injectable } from '@nestjs/common';
import type { PaginationDto } from '../dto';

@Injectable()
export class AdminValidator {
  normalizePagination(input: PaginationDto): { limit: number; offset: number } {
    const limit = input.limit ?? 50;
    const offset = input.offset ?? 0;

    if (limit < 1 || limit > 200) {
      throw new BadRequestException('limit must be between 1 and 200');
    }

    if (offset < 0) {
      throw new BadRequestException('offset must be greater than or equal to 0');
    }

    return { limit, offset };
  }

  requireQuery(query: string): void {
    if (!query.trim()) {
      throw new BadRequestException('query must not be empty');
    }
  }
}

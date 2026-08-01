import { Injectable } from '@nestjs/common';
import type { AdminSearchQueryDto, AdminSearchResultDto } from '../dto';
import type { AdminMapper } from '../mappers/admin.mapper';
import type { AdminRepository } from '../repositories/admin.repository';
import type { AdminValidator } from '../validators/admin.validator';

@Injectable()
export class AdminSearchService {
  constructor(
    private readonly repository: AdminRepository,
    private readonly validator: AdminValidator,
    private readonly mapper: AdminMapper,
  ) {}

  async search(query: AdminSearchQueryDto): Promise<AdminSearchResultDto> {
    this.validator.requireQuery(query.q);
    const { limit, offset } = this.validator.normalizePagination(query);
    const result = await this.repository.globalSearch(query.q, limit, offset);
    return this.mapper.toSearch(result.items, result.total, limit, offset);
  }
}

import { Injectable } from '@nestjs/common';
import type { AdminAuditLogDto, AdminAuditQueryDto, PaginationDto } from '../dto';
import { AdminMapper } from '../mappers/admin.mapper';
import { AdminRepository } from '../repositories/admin.repository';
import { AdminValidator } from '../validators/admin.validator';

@Injectable()
export class AdminAuditService {
  constructor(
    private readonly repository: AdminRepository,
    private readonly validator: AdminValidator,
    private readonly mapper: AdminMapper,
  ) {}

  async listAuditLogs(query: AdminAuditQueryDto): Promise<{ items: AdminAuditLogDto[]; total: number; limit: number; offset: number }> {
    const { limit, offset } = this.validator.normalizePagination(query);
    const result = await this.repository.getAuditLogs({ ...query, limit, offset });

    return {
      items: result.items.map((item) =>
        this.mapper.toAuditLog({
          id: String(item['id']),
          action: String(item['action']),
          resourceType: String(item['resourceType']),
          resourceId: String(item['resourceId']),
          description: String(item['description']),
          severity: String(item['severity']),
          createdAt: String(item['createdAt']),
        }),
      ),
      total: result.total,
      limit,
      offset,
    };
  }

  async listSecurityEvents(query: PaginationDto): Promise<{ items: Array<Record<string, unknown>>; total: number; limit: number; offset: number }> {
    const { limit, offset } = this.validator.normalizePagination(query);
    const result = await this.repository.getSecurityEvents(limit, offset);
    return { ...result, limit, offset };
  }

  async listAdminActions(query: PaginationDto): Promise<{ items: Array<Record<string, unknown>>; total: number; limit: number; offset: number }> {
    const { limit, offset } = this.validator.normalizePagination(query);
    const result = await this.repository.getAdminActions(limit, offset);
    return { ...result, limit, offset };
  }
}

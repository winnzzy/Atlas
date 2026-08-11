import { Injectable } from '@nestjs/common';
import type { AdminSettingsDto, UpdateAdminSettingsDto } from '../dto';
import { AdminMapper } from '../mappers/admin.mapper';
import { AdminRepository } from '../repositories/admin.repository';

@Injectable()
export class AdminSettingsService {
  constructor(
    private readonly repository: AdminRepository,
    private readonly mapper: AdminMapper,
  ) {}

  async getSettings(): Promise<AdminSettingsDto> {
    const settings = await this.repository.getSettings();
    return this.mapper.toSettings(settings);
  }

  async updateSettings(update: UpdateAdminSettingsDto): Promise<AdminSettingsDto> {
    const settings = await this.repository.updateSettings(update);
    return this.mapper.toSettings(settings);
  }
}

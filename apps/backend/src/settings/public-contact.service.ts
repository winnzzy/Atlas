import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PublicContactDto, UpdatePublicContactDto } from './dto/public-contact.dto';

const PUBLIC_CONTACT_KEY = 'public_contact';

const CONTACT_FIELDS = [
  'supportEmail',
  'supportPhone',
  'businessAddress',
  'legalEntity',
  'licenseInfo',
  'depositInsuranceInfo',
] as const;

/**
 * Persistent, admin-managed public contact/footer information.
 *
 * Backed by the generic `SystemSetting` key/value table so it survives
 * restarts and is served to the public site. Nothing is hardcoded: unset
 * fields resolve to `null`, and the frontend shows a safe placeholder for them.
 */
@Injectable()
export class PublicContactService {
  constructor(private readonly prisma: PrismaService) {}

  async getContact(): Promise<PublicContactDto> {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key: PUBLIC_CONTACT_KEY },
    });
    return this.normalize(row?.value);
  }

  async updateContact(update: UpdatePublicContactDto, updatedBy?: string): Promise<PublicContactDto> {
    const next = await this.getContact();
    for (const field of CONTACT_FIELDS) {
      const value = update[field];
      if (value !== undefined) {
        const trimmed = value.trim();
        next[field] = trimmed.length > 0 ? trimmed : null;
      }
    }

    await this.prisma.systemSetting.upsert({
      where: { key: PUBLIC_CONTACT_KEY },
      create: {
        key: PUBLIC_CONTACT_KEY,
        value: next as unknown as Prisma.InputJsonValue,
        updatedBy: updatedBy ?? null,
      },
      update: {
        value: next as unknown as Prisma.InputJsonValue,
        updatedBy: updatedBy ?? null,
      },
    });

    return next;
  }

  private normalize(value: unknown): PublicContactDto {
    const record =
      value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};

    const result = {} as PublicContactDto;
    for (const field of CONTACT_FIELDS) {
      const raw = record[field];
      result[field] = typeof raw === 'string' && raw.trim().length > 0 ? raw : null;
    }
    return result;
  }
}

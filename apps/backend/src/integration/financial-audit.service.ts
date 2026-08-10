import { Inject, Injectable } from '@nestjs/common';
import { AuditSeverity, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface FinancialAuditInput {
  code: string;
  name: string;
  action: string;
  resourceType: string;
  resourceId: string;
  description: string;
  userId?: string;
  adminUserId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  severity?: AuditSeverity;
}

@Injectable()
export class FinancialAuditService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async log(input: FinancialAuditInput): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const event = await tx.auditEvent.upsert({
        where: { code: input.code },
        update: {
          name: input.name,
          category: 'financial',
          description: input.description,
          severity: input.severity ?? AuditSeverity.INFO,
        },
        create: {
          code: input.code,
          name: input.name,
          category: 'financial',
          description: input.description,
          severity: input.severity ?? AuditSeverity.INFO,
        },
      });

      await tx.auditLog.create({
        data: {
          eventId: event.id,
          userId: input.userId,
          adminUserId: input.adminUserId,
          resourceType: input.resourceType,
          resourceId: randomUUID(),
          action: input.action,
          description: input.description,
          oldValues: (input.oldValues ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          newValues: (input.newValues ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          sessionId: input.sessionId ?? null,
          metadata: (input.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          severity: input.severity ?? AuditSeverity.INFO,
        },
      });
    });
  }
}
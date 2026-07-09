import { Injectable, Logger } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGOUT_ALL'
  | 'TOKEN_REFRESH'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_COMPLETE'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'SESSION_REVOKED'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'MFA_VERIFIED';

export type AuditStatus = 'SUCCESS' | 'FAILURE' | 'PENDING';

export interface CreateAuditLogDto {
  userId?: string;
  action: AuditAction;
  status: AuditStatus;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
  failureReason?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    if (!dto.userId) {
      return;
    }

    try {
      await this.prisma.loginHistory.create({
        data: {
          userId: dto.userId,
          loginMethod: dto.action,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          deviceInfo: (dto.metadata ?? {}) as any,
          isSuccessful: dto.status === 'SUCCESS',
          failureReason: dto.failureReason,
        },
      });
    } catch (error) {
      // Audit logging should never break the main flow
      this.logger.error(
        `Failed to create audit log: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async logLoginSuccess(userId: string, ip: string, userAgent: string): Promise<void> {
    await this.log({
      userId,
      action: 'LOGIN',
      status: 'SUCCESS',
      ipAddress: ip,
      userAgent,
    });
  }

  async logLoginFailure(
    email: string,
    ip: string,
    userAgent: string,
    reason: string,
  ): Promise<void> {
    await this.log({
      action: 'LOGIN',
      status: 'FAILURE',
      ipAddress: ip,
      userAgent,
      metadata: { email },
      failureReason: reason,
    });
  }

  async logLogout(userId: string, ip: string, userAgent: string): Promise<void> {
    await this.log({
      userId,
      action: 'LOGOUT',
      status: 'SUCCESS',
      ipAddress: ip,
      userAgent,
    });
  }

  async logTokenRefresh(userId: string, ip: string, userAgent: string): Promise<void> {
    await this.log({
      userId,
      action: 'TOKEN_REFRESH',
      status: 'SUCCESS',
      ipAddress: ip,
      userAgent,
    });
  }

  async logPasswordChange(userId: string, ip: string, userAgent: string): Promise<void> {
    await this.log({
      userId,
      action: 'PASSWORD_CHANGE',
      status: 'SUCCESS',
      ipAddress: ip,
      userAgent,
    });
  }

  async logPasswordResetRequest(ip: string, userAgent: string, email: string): Promise<void> {
    await this.log({
      action: 'PASSWORD_RESET_REQUEST',
      status: 'PENDING',
      ipAddress: ip,
      userAgent,
      metadata: { email },
    });
  }

  async logPasswordResetComplete(userId: string, ip: string, userAgent: string): Promise<void> {
    await this.log({
      userId,
      action: 'PASSWORD_RESET_COMPLETE',
      status: 'SUCCESS',
      ipAddress: ip,
      userAgent,
    });
  }

  async logAccountLocked(userId: string, ip: string, userAgent: string): Promise<void> {
    await this.log({
      userId,
      action: 'ACCOUNT_LOCKED',
      status: 'SUCCESS',
      ipAddress: ip,
      userAgent,
    });
  }
}

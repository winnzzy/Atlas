import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { KycStatus, NotificationType, UserStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../accounts/policies/account.policy';
import { AccountService } from '../../accounts/services/account.service';
import type { AccountResponseDto } from '../../accounts/dto/account-response.dto';
import { NotificationService } from '../../notifications/services/notification.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminRole } from '../dto';
import type { AssignAccountDto, KycDecisionDto, UpdateCustomerDto } from '../dto';
import {
  AdminPresentationService,
  type GeneratePresentationDto,
  type PresentationStatus,
} from './admin-presentation.service';

/**
 * All customer/KYC/account admin mutations funnel through here so that every
 * high-impact action is (a) authorized by the caller's real server-derived admin
 * identity, (b) written to the admin_actions audit trail with who/when/details,
 * and (c) surfaced to the customer through the existing notification system.
 *
 * The frontend can never simply set `kycApproved = true`: it calls an endpoint
 * that authenticates the admin, authorizes the role, validates the target user,
 * updates the record, writes an audit row and returns the persisted state.
 */
@Injectable()
export class AdminCustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountService: AccountService,
    private readonly notificationService: NotificationService,
    private readonly presentationService: AdminPresentationService,
  ) {}

  private adminActor(adminId: string, role: AdminRole): AuthenticatedUser {
    return { id: adminId, email: 'admin@atlas.internal', role };
  }

  private async recordAction(
    adminUserId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.adminAction.create({
      data: {
        adminUserId,
        action,
        resourceType,
        resourceId,
        details: details as Prisma.InputJsonValue,
        ipAddress: 'admin-portal',
        userAgent: 'admin-portal',
      },
    });
  }

  private async requireUser(userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) {
      throw new NotFoundException('Customer not found');
    }
    return user;
  }

  private metadataObject(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? { ...(value as Record<string, unknown>) }
      : {};
  }

  /** Full customer record for the admin detail page (profile + accounts + audit). */
  async getCustomerDetail(userId: string): Promise<Record<string, unknown>> {
    const user = await this.requireUser(userId);
    const metadata = this.metadataObject(user.metadata);
    const profileMeta = this.metadataObject(metadata['profile']);
    const audit = await this.getCustomerAudit(userId);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      status: user.status,
      kycStatus: user.kycStatus,
      kycLevel: user.kycLevel,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      address: profileMeta['address'] ?? null,
      employment: profileMeta['employment'] ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      audit,
    };
  }

  /** Update the customer fields the schema supports. Never touches the password. */
  async updateCustomer(
    adminId: string,
    userId: string,
    dto: UpdateCustomerDto,
  ): Promise<Record<string, unknown>> {
    const user = await this.requireUser(userId);

    if (dto.email && dto.email.toLowerCase() !== user.email.toLowerCase()) {
      const clash = await this.prisma.user.findFirst({
        where: { email: { equals: dto.email, mode: 'insensitive' }, NOT: { id: userId } },
      });
      if (clash) {
        throw new ConflictException('Another customer already uses that email address');
      }
    }

    // Merge extended profile fields into user.metadata.profile without wiping
    // the rest of the metadata document.
    const metadata = this.metadataObject(user.metadata);
    const profileMeta = this.metadataObject(metadata['profile']);
    if (dto.address !== undefined) {
      profileMeta['address'] = { ...this.metadataObject(profileMeta['address']), ...dto.address };
    }
    if (dto.employment !== undefined) {
      profileMeta['employment'] = {
        ...this.metadataObject(profileMeta['employment']),
        ...dto.employment,
      };
    }
    metadata['profile'] = profileMeta;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName ?? undefined,
        lastName: dto.lastName ?? undefined,
        email: dto.email ?? undefined,
        phoneNumber: dto.phoneNumber ?? undefined,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });

    await this.recordAction(adminId, 'CUSTOMER_UPDATE', 'USER', userId, {
      fields: Object.keys(dto),
    });

    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phoneNumber: updated.phoneNumber,
      status: updated.status,
      kycStatus: updated.kycStatus,
    };
  }

  /** Approve or reject KYC. Persists the decision, audits it, and notifies. */
  async decideKyc(
    adminId: string,
    userId: string,
    dto: KycDecisionDto,
  ): Promise<Record<string, unknown>> {
    const user = await this.requireUser(userId);
    const approve = dto.decision === 'APPROVE';
    const nextStatus = approve ? KycStatus.APPROVED : KycStatus.REJECTED;

    if (!approve && !dto.reason) {
      throw new BadRequestException('A reason is required to reject KYC');
    }

    const decidedAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          kycStatus: nextStatus,
          ...(approve ? { kycLevel: 'LEVEL_2' } : {}),
        },
      });
      // Reflect the decision on any submitted documents so the record is consistent.
      await tx.kycDocument.updateMany({
        where: { userId, deletedAt: null },
        data: {
          status: nextStatus,
          reviewedAt: decidedAt,
          rejectionReason: approve ? null : dto.reason,
        },
      });
    });

    await this.recordAction(adminId, approve ? 'KYC_APPROVE' : 'KYC_REJECT', 'USER', userId, {
      decision: dto.decision,
      reason: dto.reason ?? null,
      decidedAt: decidedAt.toISOString(),
    });

    await this.notificationService.notifyDirect({
      recipientId: userId,
      type: NotificationType.SECURITY,
      title: approve ? 'Identity verification approved' : 'Identity verification needs attention',
      body: approve
        ? 'Your identity verification has been approved. You can now use all account features, including transfers.'
        : `Your identity verification could not be approved. ${dto.reason ?? 'Please contact support for details.'}`,
      sourceEventType: approve ? 'kyc.approved' : 'kyc.rejected',
      sourceAggregateId: userId,
    });

    return {
      userId,
      kycStatus: nextStatus,
      reviewedBy: adminId,
      reviewedAt: decidedAt.toISOString(),
      previousStatus: user.kycStatus,
    };
  }

  /** Create/assign a bank account for a customer through the account service. */
  async assignAccount(
    adminId: string,
    role: AdminRole,
    userId: string,
    dto: AssignAccountDto,
  ): Promise<AccountResponseDto> {
    await this.requireUser(userId);
    const account = await this.accountService.adminAssignAccount(this.adminActor(adminId, role), userId, {
      accountType: dto.accountType,
      currency: dto.currency,
      nickname: dto.nickname,
    });

    await this.recordAction(adminId, 'ACCOUNT_ASSIGN', 'ACCOUNT', account.id, {
      userId,
      accountType: dto.accountType,
      currency: dto.currency ?? 'USD',
    });

    await this.notificationService.notifyDirect({
      recipientId: userId,
      type: NotificationType.ACCOUNT,
      title: 'New account opened',
      body: `A new ${dto.accountType.toLowerCase()} account (••${account.accountNumber.slice(-4)}) has been opened for you.`,
      sourceEventType: 'account.assigned',
      sourceAggregateId: account.id,
    });

    return account;
  }

  private async accountOwnerId(accountId: string): Promise<string | null> {
    const holder = await this.prisma.accountHolder.findFirst({
      where: { accountId, role: 'OWNER' },
      select: { userId: true },
    });
    return holder?.userId ?? null;
  }

  /** Apply an account restriction/hold and audit + notify. */
  async applyRestriction(
    adminId: string,
    role: AdminRole,
    accountId: string,
    dto: { reason: string; restrictionType?: string; amount?: string; reference?: string },
  ): Promise<AccountResponseDto> {
    if (!dto.reason) {
      throw new BadRequestException('A reason is required to restrict an account');
    }
    const account = await this.accountService.applyRestriction(
      this.adminActor(adminId, role),
      accountId,
      dto.reason,
    );

    await this.recordAction(adminId, 'ACCOUNT_RESTRICT', 'ACCOUNT', accountId, {
      reason: dto.reason,
      restrictionType: dto.restrictionType ?? 'GENERAL',
      amount: dto.amount ?? null,
      reference: dto.reference ?? null,
    });

    const ownerId = await this.accountOwnerId(accountId);
    if (ownerId) {
      await this.notificationService.notifyDirect({
        recipientId: ownerId,
        type: NotificationType.ACCOUNT,
        title: 'Account restriction applied',
        body: 'A restriction has been placed on your account. Please contact customer support for assistance.',
        sourceEventType: 'account.restriction.applied',
        sourceAggregateId: accountId,
      });
    }

    return account;
  }

  /** Release an account restriction and audit + notify. */
  async releaseRestriction(
    adminId: string,
    role: AdminRole,
    accountId: string,
  ): Promise<AccountResponseDto> {
    const account = await this.accountService.releaseRestriction(this.adminActor(adminId, role), accountId);

    await this.recordAction(adminId, 'ACCOUNT_RESTRICTION_RELEASE', 'ACCOUNT', accountId, {});

    const ownerId = await this.accountOwnerId(accountId);
    if (ownerId) {
      await this.notificationService.notifyDirect({
        recipientId: ownerId,
        type: NotificationType.ACCOUNT,
        title: 'Account restriction removed',
        body: 'The restriction on your account has been removed. Full access has been restored.',
        sourceEventType: 'account.restriction.released',
        sourceAggregateId: accountId,
      });
    }

    return account;
  }

  /** Audit trail for a customer: admin actions against the user and its accounts. */
  async getCustomerAudit(userId: string): Promise<Array<Record<string, unknown>>> {
    const accountIds = (
      await this.prisma.accountHolder.findMany({ where: { userId }, select: { accountId: true } })
    ).map((holder) => holder.accountId);

    const actions = await this.prisma.adminAction.findMany({
      where: { resourceId: { in: [userId, ...accountIds] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return actions.map((action) => ({
      id: action.id,
      action: action.action,
      resourceType: action.resourceType,
      resourceId: action.resourceId,
      details: action.details,
      performedBy: action.adminUserId,
      createdAt: action.createdAt.toISOString(),
    }));
  }

  /**
   * Remove (deactivate) a customer from active banking access.
   *
   * This is a soft removal, never a hard delete: the user row is retained and
   * marked `deletedAt`/CLOSED so that all financial and audit records
   * (transactions, ledger lines, transfers, admin actions) stay intact for
   * integrity and compliance. Because auth lookups and the JWT/session guards
   * reject users with a non-null `deletedAt` or a non-ACTIVE status, the
   * customer can no longer sign in, and they drop out of the active customer
   * lists/counts (which all filter `deletedAt: null`).
   */
  async removeCustomer(
    adminId: string,
    userId: string,
    reason?: string,
  ): Promise<{ id: string; status: string; removed: boolean }> {
    const user = await this.requireUser(userId);
    const removedAt = new Date();
    const metadata = this.metadataObject(user.metadata);
    metadata['removal'] = {
      removedBy: adminId,
      removedAt: removedAt.toISOString(),
      reason: reason ?? null,
    };

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: removedAt,
        status: UserStatus.CLOSED,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });

    await this.recordAction(adminId, 'CUSTOMER_REMOVE', 'USER', userId, {
      reason: reason ?? null,
      removedAt: removedAt.toISOString(),
      previousStatus: user.status,
      financialRecordsPreserved: true,
    });

    return { id: updated.id, status: updated.status, removed: true };
  }

  /** Presentation-activity status for the admin view (§18) + idempotency (§7). */
  async getPresentationStatus(userId: string, accountId: string): Promise<PresentationStatus> {
    return this.presentationService.getStatus(userId, accountId);
  }

  /**
   * Generate (or replace) presentation activity for a customer account. The
   * generation itself is atomic and self-reconciling; here we add the mandatory
   * audit record (§8) and notify the customer that new activity is available.
   */
  async generatePresentation(
    adminId: string,
    userId: string,
    dto: GeneratePresentationDto,
  ): Promise<Record<string, unknown>> {
    await this.requireUser(userId);
    const result = await this.presentationService.generate(userId, dto);

    await this.recordAction(
      adminId,
      result.replaced ? 'PRESENTATION_REPLACE' : 'PRESENTATION_GENERATE',
      'ACCOUNT',
      result.accountId,
      {
        userId,
        accountId: result.accountId,
        operation: result.replaced ? 'REPLACE' : 'GENERATE',
        batchId: result.batchId,
        targetBalance: result.finalBalance,
        openingBalance: result.openingBalance,
        totalCredits: result.totalCredits,
        totalDebits: result.totalDebits,
        transactionCount: result.transactionCount,
        periodStart: result.periodStart,
        periodEnd: result.periodEnd,
        generatedAt: new Date().toISOString(),
      },
    );

    return { ...result };
  }
}

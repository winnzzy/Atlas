import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthRepository {
  private readonly passwordResetStore = new Map<
    string,
    {
      tokenHash: string;
      expiresAt: string;
      usedAt: string | null;
    }
  >();

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
      },
    });
  }

  findUserById(id: string) {
    return this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  createUser(input: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    termsAcceptedAt?: Date | string | null;
    privacyAcceptedAt?: Date | string | null;
  }) {
    const termsAcceptedAt = this.normalizeDate(input.termsAcceptedAt);
    const privacyAcceptedAt = this.normalizeDate(input.privacyAcceptedAt);

    return this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        status: 'ACTIVE',
        termsAcceptedAt,
        privacyAcceptedAt,
        emailVerified: false,
      },
    });
  }

  private normalizeDate(value: Date | string | null | undefined): Date {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? new Date() : value;
    }

    if (typeof value === 'string') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    }

    return new Date();
  }

  updateSuccessfulLogin(userId: string, ipAddress: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
  }

  incrementFailedLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: { increment: 1 },
      },
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
      },
    });
  }

  async storePasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    this.passwordResetStore.set(userId, {
      tokenHash,
      expiresAt: expiresAt.toISOString(),
      usedAt: null,
    });
  }

  async readPasswordResetMetadata(userId: string): Promise<{
    tokenHash?: string;
    expiresAt?: string;
    usedAt?: string | null;
  }> {
    return this.passwordResetStore.get(userId) ?? {};
  }

  async markPasswordResetTokenUsed(userId: string): Promise<void> {
    const token = this.passwordResetStore.get(userId);
    if (!token) {
      return;
    }

    this.passwordResetStore.set(userId, {
      ...token,
      usedAt: new Date().toISOString(),
    });
  }
}

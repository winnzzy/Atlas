import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';
import type { SessionDto } from './dto/auth-response.dto';
import type { SessionListQueryDto } from './dto/session-list-query.dto';

export interface DeviceInfo {
  userAgent: string;
  ipAddress: string;
  deviceId?: string;
  deviceName?: string;
}

@Injectable()
export class SessionService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TokenService) private readonly tokenService: TokenService,
  ) {}

  async createSession(
    userId: string,
    accessToken: string,
    refreshToken: string,
    deviceInfo: DeviceInfo,
  ): Promise<string> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.tokenService.getRefreshTokenTtlDays());

    const session = await this.prisma.userSession.create({
      data: {
        userId,
        accessToken: this.tokenService.hashToken(accessToken),
        refreshToken: this.tokenService.hashToken(refreshToken),
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        deviceId: deviceInfo.deviceId ?? deviceInfo.deviceName,
        isActive: true,
        expiresAt,
      },
    });

    return session.id;
  }

  async revokeAllSessionsForUser(userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  async revokeSessionById(sessionId: string, userId: string): Promise<void> {
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, userId, deletedAt: null },
    });

    if (!session || !session.isActive) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }

  async revokeSessionByAccessToken(accessToken: string, userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        accessToken: this.tokenService.hashToken(accessToken),
        isActive: true,
        deletedAt: null,
      },
      data: {
        isActive: false,
      },
    });
  }

  async findSessionByRefreshToken(refreshToken: string, sessionId?: string) {
    const tokenHash = this.tokenService.hashToken(refreshToken);
    const session = await this.prisma.userSession.findFirst({
      where: {
        refreshToken: tokenHash,
        isActive: true,
        deletedAt: null,
        expiresAt: { gt: new Date() },
        ...(sessionId ? { id: sessionId } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!session || session.user.deletedAt) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return session;
  }

  async rotateSessionTokens(
    sessionId: string,
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.tokenService.getRefreshTokenTtlDays());

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        accessToken: this.tokenService.hashToken(accessToken),
        refreshToken: this.tokenService.hashToken(refreshToken),
        expiresAt,
        isActive: true,
      },
    });
  }

  async listSessions(
    userId: string,
    query: SessionListQueryDto,
    currentSessionId?: string,
  ): Promise<{
    items: SessionDto[];
    total: number;
  }> {
    const sortField = this.resolveSortField(query.sort);
    const direction = query.order;

    const where = {
      userId,
      isActive: true,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { userAgent: { contains: query.search, mode: 'insensitive' as const } },
              { ipAddress: { contains: query.search, mode: 'insensitive' as const } },
              { deviceId: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const items = await this.prisma.userSession.findMany({
      where,
      skip: query.offset,
      take: query.limit,
      orderBy: { [sortField]: direction },
    });

    const total = await this.prisma.userSession.count({ where });

    return {
      items: items.map(
        (item: {
          id: string;
          deviceId: string | null;
          ipAddress: string;
          userAgent: string;
          createdAt: Date;
          expiresAt: Date;
        }) => ({
          id: item.id,
          device: item.deviceId ?? 'Unknown Device',
          ipAddress: item.ipAddress,
          userAgent: item.userAgent,
          createdAt: item.createdAt.toISOString(),
          expiresAt: item.expiresAt.toISOString(),
          isCurrent: currentSessionId ? item.id === currentSessionId : false,
        }),
      ),
      total,
    };
  }

  private resolveSortField(field?: string): 'createdAt' | 'expiresAt' {
    if (field === 'expiresAt') {
      return 'expiresAt';
    }

    return 'createdAt';
  }
}

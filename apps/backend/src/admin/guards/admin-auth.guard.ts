import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import type { AdminRole } from '../dto';

const ROLE_RANK: Record<AdminRole, number> = {
  SUPPORT: 1,
  OPERATIONS: 2,
  COMPLIANCE: 3,
  FINANCE: 4,
  ADMIN: 5,
  SUPER_ADMIN: 6,
};

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Admin authorization token is required');
    }

    const payload = await this.verifyToken(token);
    const adminUser = await this.prisma.adminUser.findFirst({
      where: {
        userId: payload.sub,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        adminRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!adminUser) {
      throw new ForbiddenException('Admin access is required');
    }

    const role = this.highestRole(adminUser.adminRoles.map((entry) => entry.role.name));
    if (!role) {
      throw new ForbiddenException('Admin role assignment is required');
    }

    request.headers['x-admin-role'] = role;
    request.headers['x-admin-id'] = adminUser.id;
    return true;
  }

  private async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET', 'local-dev-secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid admin authorization token');
    }
  }

  private highestRole(roleNames: string[]): AdminRole | null {
    return roleNames.reduce<AdminRole | null>((highest, roleName) => {
      if (!this.isAdminRole(roleName)) {
        return highest;
      }

      if (!highest || ROLE_RANK[roleName] > ROLE_RANK[highest]) {
        return roleName;
      }

      return highest;
    }, null);
  }

  private isAdminRole(roleName: string): roleName is AdminRole {
    return roleName in ROLE_RANK;
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return null;
    }

    return header.slice('Bearer '.length).trim();
  }
}

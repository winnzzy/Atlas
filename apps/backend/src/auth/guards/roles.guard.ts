import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Enforces `@Roles(...)`.
 *
 * The role is read from the `admin_users` table rather than the JWT: access
 * tokens carry no role claim, and a client-supplied one must never grant
 * privilege. Run this after JwtAuthGuard so `request.user` is populated.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user?.id) {
      throw new UnauthorizedException('Authentication is required');
    }

    const adminUser = await this.prisma.adminUser.findFirst({
      where: { userId: user.id, status: 'ACTIVE', deletedAt: null },
      include: { adminRoles: { include: { role: true } } },
    });

    if (!adminUser) {
      throw new ForbiddenException('Administrator access is required');
    }

    const heldRoles = adminUser.adminRoles.map((entry) => entry.role.name);
    if (!heldRoles.some((role) => requiredRoles.includes(role))) {
      throw new ForbiddenException(`One of these roles is required: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}

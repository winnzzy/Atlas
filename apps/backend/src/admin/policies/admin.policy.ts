import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AdminRole } from '../dto';

const ROLE_RANK: Record<AdminRole, number> = {
  SUPPORT: 1,
  OPERATIONS: 2,
  COMPLIANCE: 3,
  FINANCE: 4,
  ADMIN: 5,
  SUPER_ADMIN: 6,
};

const ACTION_MIN_ROLE: Record<string, AdminRole> = {
  'dashboard.read': 'SUPPORT',
  'analytics.read': 'OPERATIONS',
  'search.read': 'SUPPORT',
  'audit.read': 'COMPLIANCE',
  'report.read': 'FINANCE',
  'settings.read': 'ADMIN',
  'settings.write': 'SUPER_ADMIN',
  'customer.manage': 'OPERATIONS',
  'account.manage': 'OPERATIONS',
  'card.manage': 'OPERATIONS',
  'investment.manage': 'OPERATIONS',
  'transfer.manage': 'OPERATIONS',
  'transaction.manage': 'FINANCE',
  'notification.manage': 'SUPPORT',
};

@Injectable()
export class AdminPolicy {
  /** Actions the role may perform, so clients can hide what would 403. */
  permittedActions(role: AdminRole): string[] {
    return Object.keys(ACTION_MIN_ROLE).filter(
      (action) => ROLE_RANK[role] >= ROLE_RANK[ACTION_MIN_ROLE[action] as AdminRole],
    );
  }

  assertAllowed(role: AdminRole, action: string): void {
    const minRole = ACTION_MIN_ROLE[action];
    if (!minRole) {
      throw new ForbiddenException(`Unknown admin action: ${action}`);
    }

    if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
      throw new ForbiddenException(`Role ${role} is not permitted to execute ${action}`);
    }
  }
}

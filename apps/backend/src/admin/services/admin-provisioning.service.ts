import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  provisionAdmin,
  resolveBootstrapConfig,
  type AdminRoleName,
  type ProvisionResult,
} from './admin-provisioning.core';

/**
 * Runs the environment-driven admin bootstrap once on application startup.
 *
 * This exists so an operator can provision the first admin on a platform (such
 * as Render's shell-less plan) where the CLI script cannot be run. It shares the
 * exact provisioning logic used by the CLI (see admin-provisioning.core), so
 * there is only one implementation. It exposes no HTTP surface, trusts no
 * request header or frontend flag, and never sets a password.
 */
@Injectable()
export class AdminProvisioningService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminProvisioningService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.runStartupBootstrap(process.env);
  }

  /**
   * Reads the ADMIN_BOOTSTRAP_* variables and, only when explicitly enabled,
   * provisions the named user. A failure here is logged but never rethrown, so a
   * misconfigured bootstrap can never prevent the API from starting.
   */
  async runStartupBootstrap(env: Record<string, string | undefined>): Promise<void> {
    const resolved = resolveBootstrapConfig(env);

    if (!resolved.ok) {
      this.logger.warn(`Admin bootstrap skipped: ${resolved.error}`);
      return;
    }

    if (!resolved.config.enabled) {
      // ADMIN_BOOTSTRAP_ENABLED is not "true" — do nothing, silently.
      return;
    }

    const { email, roleName } = resolved.config;

    try {
      const result = await this.provision({ email, roleName });

      if (result.status === 'user_not_found') {
        this.logger.warn(
          `Admin bootstrap: no registered user found for ${email}. ` +
            'Have that person register at /signup first, then restart the service.',
        );
        return;
      }

      this.logger.log(`Admin bootstrap successfully provisioned ${result.email}`);
    } catch (error) {
      this.logger.error(
        `Admin bootstrap failed for ${email}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  provision(input: { email: string; roleName: AdminRoleName }): Promise<ProvisionResult> {
    return provisionAdmin(this.prisma, input);
  }
}

import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { randomBytes } from 'crypto';
import { AccountRepository } from '../repositories/account.repository';  
import { AccountPolicy } from '../policies/account.policy';  
import { type AuthenticatedUser } from '../policies/account.policy';
import { AccountStateMachine } from '../domain/account-state.machine';
import {
  AccountEventBus,
  AccountCreatedEvent,
  AccountFrozenEvent,
  AccountUnfrozenEvent,
  AccountClosedEvent,
  AccountNicknameChangedEvent,
  BalanceViewedEvent,
  StatementRequestedEvent,
  AccountLockedEvent,
  AccountUnlockedEvent,
  AccountArchivedEvent,
} from '../events/account.events';
import type {
  AccountStatusType,
  AccountTypeType,
  ClosureReasonType,
  FreezeReasonType,
} from '../dto/account-response.dto';
import { AccountResponseDto } from '../dto/account-response.dto';
import type { CreateAccountDto } from '../dto/create-account.dto';
import type { UpdateNicknameDto } from '../dto/update-nickname.dto';

const DEFAULT_ROUTING_NUMBER = '021000021';
const MAX_ACCOUNTS_PER_USER = 10;

/**
 * The routing number is a configured value, never a fabricated bank identity.
 * Operators set ATLAS_ROUTING_NUMBER to the institution's real ABA (or an
 * explicit sandbox value); the historical default is kept only as a fallback so
 * existing environments do not regress.
 */
function resolveRoutingNumber(): string {
  const configured = (process.env['ATLAS_ROUTING_NUMBER'] ?? '').trim();
  return /^\d{9}$/.test(configured) ? configured : DEFAULT_ROUTING_NUMBER;
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);
  private readonly eventBus = new AccountEventBus();

  constructor(
    @Inject(AccountRepository) private readonly accountRepository: AccountRepository,
    @Inject(AccountPolicy) private readonly accountPolicy: AccountPolicy,
  ) {}

  getEventBus(): AccountEventBus {
    return this.eventBus;
  }

  /**
   * Create a new account.
   */
  async createAccount(user: AuthenticatedUser, dto: CreateAccountDto): Promise<AccountResponseDto> {
    this.accountPolicy.canCreateAccount(user);

    // Check max accounts per user
    const { total } = await this.accountRepository.findByUserId(user.id, { status: 'ACTIVE' });
    if (total >= MAX_ACCOUNTS_PER_USER) {
      throw new ConflictException(`Maximum of ${MAX_ACCOUNTS_PER_USER} active accounts reached`);
    }

    // Check duplicate nickname
    if (dto.nickname) {
      const { accounts } = await this.accountRepository.findByUserId(user.id);
      const duplicateNickname = accounts.find(
        (acc) =>
          acc.nickname?.toLowerCase() === (dto.nickname ?? '').toLowerCase() &&
          acc.status !== 'CLOSED' &&
          acc.status !== 'ARCHIVED',
      );
      if (duplicateNickname) {
        throw new ConflictException('An account with this nickname already exists');
      }
    }

    const accountNumber = await this.generateUniqueAccountNumber();
    const accountName = this.buildAccountName(dto.accountType, dto.name);

    const account = await this.accountRepository.create({
      userId: user.id,
      accountNumber,
      routingNumber: resolveRoutingNumber(),
      type: dto.accountType as AccountTypeType,
      name: accountName,
      nickname: dto.nickname,
      currency: dto.currency ?? 'USD',
      isDemo: false,
    });

    // Auto-activate PENDING accounts
    const activated = await this.accountRepository.updateStatus(account.id, 'ACTIVE');

    const response = this.toResponseDto(activated);

    this.eventBus.publish(
      new AccountCreatedEvent(account.id, {
        userId: user.id,
        accountType: dto.accountType,
        currency: account.currency,
        name: accountName,
      }),
    );

    this.logger.log(`Account created: ${account.id} for user ${user.id}`);
    return response;
  }

  /**
   * Admin-driven account assignment for a specific customer.
   *
   * The account number is generated and validated for uniqueness SERVER-SIDE
   * (never supplied by any client), the routing number comes from configuration,
   * and the account opens with a zero balance. Funding must go through the
   * existing admin credit / transaction engine — this method never fabricates
   * money. Authorization is the caller's responsibility (the admin guard);
   * `admin` is only used for audit context by the caller.
   */
  async adminAssignAccount(
    admin: AuthenticatedUser,
    targetUserId: string,
    dto: { accountType: string; currency?: string; nickname?: string; name?: string },
  ): Promise<AccountResponseDto> {
    this.accountPolicy.requireAdmin(admin);

    const { total } = await this.accountRepository.findByUserId(targetUserId, { status: 'ACTIVE' });
    if (total >= MAX_ACCOUNTS_PER_USER) {
      throw new ConflictException(`Customer already has the maximum of ${MAX_ACCOUNTS_PER_USER} active accounts`);
    }

    const accountNumber = await this.generateUniqueAccountNumber();
    const account = await this.accountRepository.create({
      userId: targetUserId,
      accountNumber,
      routingNumber: resolveRoutingNumber(),
      type: dto.accountType as AccountTypeType,
      name: this.buildAccountName(dto.accountType, dto.name),
      nickname: dto.nickname,
      currency: dto.currency ?? 'USD',
      isDemo: false,
    });

    const activated = await this.accountRepository.updateStatus(account.id, 'ACTIVE');

    this.eventBus.publish(
      new AccountCreatedEvent(account.id, {
        userId: targetUserId,
        accountType: dto.accountType,
        currency: account.currency,
        name: account.name,
      }),
    );

    this.logger.log(`Account ${account.id} assigned to user ${targetUserId} by admin ${admin.id}`);
    return this.toResponseDto(activated);
  }

  async findById(accountId: string): Promise<{
    id: string;
    status: string;
    currency: string;
    currentBalance: Decimal | null;
    availableBalance: Decimal | null;
    accountNumber?: string;
    routingNumber?: string;
    type?: string;
    name?: string;
    nickname?: string | null;
  } | null> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      return null;
    }

    return {
      id: account.id,
      status: account.status,
      currency: account.currency,
      currentBalance: account.currentBalance,
      availableBalance: account.availableBalance,
      accountNumber: account.accountNumber,
      routingNumber: account.routingNumber,
      type: account.type,
      name: account.name,
      nickname: account.nickname,
    };
  }

  async isAccountHolder(accountId: string, userId: string): Promise<boolean> {
    return this.accountRepository.isAccountHolder(accountId, userId);
  }

  /**
   * Get a single account by ID with ownership validation.
   */
  async getAccount(user: AuthenticatedUser, accountId: string): Promise<AccountResponseDto> {
    const account = await this.findAccountOrThrow(accountId);
    const userId = await this.resolveUserId(accountId, user);
    this.accountPolicy.canViewAccount(user, userId);
    return this.toResponseDto(account);
  }

  /**
   * List accounts for a user.
   */
  async listAccounts(
    user: AuthenticatedUser,
    options?: { status?: AccountStatusType; type?: AccountTypeType; page?: number; limit?: number },
  ): Promise<{ data: AccountResponseDto[]; total: number; page: number; limit: number }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const { accounts, total } = await this.accountRepository.findByUserId(user.id, {
      status: options?.status,
      type: options?.type,
      skip,
      take: limit,
    });

    const validAccounts = (accounts ?? []).filter(
      (acc): acc is NonNullable<typeof acc> => acc != null,
    );

    return {
      data: validAccounts.map((acc) => this.toResponseDto(acc)),
      total,
      page,
      limit,
    };
  }

  /**
   * Update account nickname.
   */
  async updateNickname(
    user: AuthenticatedUser,
    accountId: string,
    dto: UpdateNicknameDto,
  ): Promise<AccountResponseDto> {
    const account = await this.findAccountOrThrow(accountId);
    const userId = await this.resolveUserId(accountId, user);
    this.accountPolicy.canModifyAccount(user, userId, account.status as AccountStatusType);

    // Check duplicate nickname among active accounts
    const { accounts } = await this.accountRepository.findByUserId(userId);
    const duplicate = accounts.find(
      (acc) =>
        acc.id !== accountId &&
        acc.nickname?.toLowerCase() === dto.nickname.toLowerCase() &&
        acc.status !== 'CLOSED' &&
        acc.status !== 'ARCHIVED',
    );
    if (duplicate) {
      throw new ConflictException('An account with this nickname already exists');
    }

    const updated = await this.accountRepository.updateNickname(accountId, dto.nickname);

    this.eventBus.publish(
      new AccountNicknameChangedEvent(accountId, {
        oldNickname: account.nickname,
        newNickname: dto.nickname,
        changedBy: user.id,
      }),
    );

    this.logger.log(`Nickname updated for account ${accountId}`);
    return this.toResponseDto(updated);
  }

  /**
   * Freeze an account (admin only).
   */
  async freezeAccount(
    user: AuthenticatedUser,
    accountId: string,
    freezeReason: FreezeReasonType,
    freezeNote?: string,
  ): Promise<AccountResponseDto> {
    this.accountPolicy.requireAdmin(user);
    const account = await this.findAccountOrThrow(accountId);

    AccountStateMachine.validateTransition(account.status as AccountStatusType, 'FROZEN');

    const updated = await this.accountRepository.updateStatus(accountId, 'FROZEN', {
      freezeReason,
      freezeNote,
    });

    this.eventBus.publish(
      new AccountFrozenEvent(accountId, {
        reason: freezeReason,
        note: freezeNote,
        frozenBy: user.id,
      }),
    );

    this.logger.log(`Account ${accountId} frozen by admin ${user.id}: ${freezeReason}`);
    return this.toResponseDto(updated);
  }

  /**
   * Unfreeze an account (admin only).
   */
  async unfreezeAccount(user: AuthenticatedUser, accountId: string): Promise<AccountResponseDto> {
    this.accountPolicy.requireAdmin(user);
    const account = await this.findAccountOrThrow(accountId);

    if (account.status !== 'FROZEN') {
      throw new BadRequestException('Account is not frozen');
    }

    AccountStateMachine.validateTransition(account.status as AccountStatusType, 'ACTIVE');

    const updated = await this.accountRepository.updateStatus(accountId, 'ACTIVE', {
      freezeReason: 'UNFREEZE',
    });

    this.eventBus.publish(
      new AccountUnfrozenEvent(accountId, {
        unfrozenBy: user.id,
      }),
    );

    this.logger.log(`Account ${accountId} unfrozen by admin ${user.id}`);
    return this.toResponseDto(updated);
  }

  /**
   * Apply an administrative restriction (lien/hold) to an account. The account
   * remains visible to the customer, but the transfer-eligibility gate blocks
   * originating transfers while it is RESTRICTED. Persisted on the account row.
   */
  async applyRestriction(
    admin: AuthenticatedUser,
    accountId: string,
    reason: string,
  ): Promise<AccountResponseDto> {
    this.accountPolicy.requireAdmin(admin);
    await this.findAccountOrThrow(accountId);
    const updated = await this.accountRepository.updateStatus(accountId, 'RESTRICTED', {
      freezeReason: 'REGULATORY',
      freezeNote: reason,
    });
    this.logger.warn(`Account ${accountId} RESTRICTED by admin ${admin.id}: ${reason}`);
    return this.toResponseDto(updated);
  }

  /**
   * Release a previously applied restriction, returning the account to ACTIVE.
   */
  async releaseRestriction(admin: AuthenticatedUser, accountId: string): Promise<AccountResponseDto> {
    this.accountPolicy.requireAdmin(admin);
    const account = await this.findAccountOrThrow(accountId);
    if (account.status !== 'RESTRICTED') {
      throw new BadRequestException('Account is not restricted');
    }
    const updated = await this.accountRepository.updateStatus(accountId, 'ACTIVE', {
      freezeReason: 'UNRESTRICT',
    });
    this.logger.log(`Account ${accountId} restriction released by admin ${admin.id}`);
    return this.toResponseDto(updated);
  }

  /**
   * Close an account.
   */
  async closeAccount(
    user: AuthenticatedUser,
    accountId: string,
    reason: ClosureReasonType,
  ): Promise<AccountResponseDto> {
    const account = await this.findAccountOrThrow(accountId);
    const userId = await this.resolveUserId(accountId, user);
    this.accountPolicy.canCloseAccount(user, userId);

    AccountStateMachine.validateTransition(account.status as AccountStatusType, 'CLOSED');

    // Cannot close account with non-zero balance
    if (new Decimal(account.currentBalance).gt(0)) {
      throw new ConflictException(
        'Cannot close account with a positive balance. Please transfer funds first.',
      );
    }

    if (new Decimal(account.currentBalance).lt(0)) {
      throw new ConflictException(
        'Cannot close account with a negative balance. Please settle overdraft first.',
      );
    }

    const updated = await this.accountRepository.updateStatus(accountId, 'CLOSED', {
      closureReason: reason,
    });

    this.eventBus.publish(
      new AccountClosedEvent(accountId, {
        reason,
        closedBy: user.id,
      }),
    );

    this.logger.log(`Account ${accountId} closed: ${reason}`);
    return this.toResponseDto(updated);
  }

  /**
   * Lock an account (admin only - security action).
   */
  async lockAccount(
    user: AuthenticatedUser,
    accountId: string,
    reason?: string,
  ): Promise<AccountResponseDto> {
    this.accountPolicy.requireAdmin(user);
    const account = await this.findAccountOrThrow(accountId);

    AccountStateMachine.validateTransition(account.status as AccountStatusType, 'LOCKED');

    const updated = await this.accountRepository.updateStatus(accountId, 'LOCKED', {
      freezeNote: reason,
    });

    this.eventBus.publish(
      new AccountLockedEvent(accountId, {
        reason: reason ?? 'Locked by administrator',
        lockedBy: user.id,
      }),
    );

    this.logger.warn(`Account ${accountId} LOCKED by admin ${user.id}: ${reason}`);
    return this.toResponseDto(updated);
  }

  /**
   * Unlock an account (admin only).
   */
  async unlockAccount(user: AuthenticatedUser, accountId: string): Promise<AccountResponseDto> {
    this.accountPolicy.requireAdmin(user);
    const account = await this.findAccountOrThrow(accountId);

    if (account.status !== 'LOCKED') {
      throw new BadRequestException('Account is not locked');
    }

    const updated = await this.accountRepository.updateStatus(accountId, 'ACTIVE');

    this.eventBus.publish(
      new AccountUnlockedEvent(accountId, {
        unlockedBy: user.id,
      }),
    );

    this.logger.log(`Account ${accountId} unlocked by admin ${user.id}`);
    return this.toResponseDto(updated);
  }

  /**
   * Archive an account (admin only).
   */
  async archiveAccount(user: AuthenticatedUser, accountId: string): Promise<AccountResponseDto> {
    this.accountPolicy.requireAdmin(user);
    const account = await this.findAccountOrThrow(accountId);

    AccountStateMachine.validateTransition(account.status as AccountStatusType, 'ARCHIVED');

    await this.accountRepository.softDelete(accountId);
    const archived = await this.accountRepository.findById(accountId);
    if (!archived) {
      throw new NotFoundException(`Account ${accountId} not found after archival`);
    }

    this.eventBus.publish(
      new AccountArchivedEvent(accountId, {
        archivedBy: user.id,
      }),
    );

    this.logger.log(`Account ${accountId} archived by admin ${user.id}`);
    return this.toResponseDto(archived);
  }

  /**
   * Get balance information.
   */
  async getBalance(
    user: AuthenticatedUser,
    accountId: string,
  ): Promise<{
    current: string;
    available: string;
    pending: string;
    held: string;
    ledger: string;
    currency: string;
  }> {
    const account = await this.findAccountOrThrow(accountId);
    const userId = await this.resolveUserId(accountId, user);
    this.accountPolicy.canViewBalance(user, userId);

    this.eventBus.publish(
      new BalanceViewedEvent(accountId, {
        viewedBy: user.id,
        balanceType: 'current',
      }),
    );

    return {
      current: account.currentBalance.toString(),
      available: account.availableBalance.toString(),
      pending: account.pendingBalance.toString(),
      held: account.holdAmount.toString(),
      ledger: new Decimal(account.currentBalance).add(account.pendingBalance).toString(),
      currency: account.currency,
    };
  }

  /**
   * Get available balance only.
   */
  async getAvailableBalance(
    user: AuthenticatedUser,
    accountId: string,
  ): Promise<{ available: string; currency: string }> {
    const account = await this.findAccountOrThrow(accountId);
    const userId = await this.resolveUserId(accountId, user);
    this.accountPolicy.canViewBalance(user, userId);

    this.eventBus.publish(
      new BalanceViewedEvent(accountId, {
        viewedBy: user.id,
        balanceType: 'available',
      }),
    );

    return {
      available: account.availableBalance.toString(),
      currency: account.currency,
    };
  }

  /**
   * Get current balance only.
   */
  async getCurrentBalance(
    user: AuthenticatedUser,
    accountId: string,
  ): Promise<{ current: string; currency: string }> {
    const account = await this.findAccountOrThrow(accountId);
    const userId = await this.resolveUserId(accountId, user);
    this.accountPolicy.canViewBalance(user, userId);

    this.eventBus.publish(
      new BalanceViewedEvent(accountId, {
        viewedBy: user.id,
        balanceType: 'current',
      }),
    );

    return {
      current: account.currentBalance.toString(),
      currency: account.currency,
    };
  }

  /**
   * Get account statements (placeholder - will integrate with transactions module).
   */
  async getStatements(
    user: AuthenticatedUser,
    accountId: string,
    options?: { startDate?: string; endDate?: string; page?: number; limit?: number },
  ): Promise<{
    accountId: string;
    statements: Array<{
      id: string;
      accountId: string;
      periodStart: string;
      periodEnd: string;
      openingBalance: string;
      closingBalance: string;
      totalCredits: string;
      totalDebits: string;
      transactionCount: number;
      generatedAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const account = await this.findAccountOrThrow(accountId);
    const userId = await this.resolveUserId(accountId, user);
    this.accountPolicy.canViewStatements(user, userId);

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 12;

    const startDate = options?.startDate ? new Date(options.startDate) : account.createdAt;
    const endDate = options?.endDate ? new Date(options.endDate) : new Date();

    const statements = this.generateStatementPeriods(account, startDate, endDate);

    this.eventBus.publish(
      new StatementRequestedEvent(accountId, {
        requestedBy: user.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    );

    return {
      accountId,
      statements: statements.slice((page - 1) * limit, page * limit),
      total: statements.length,
      page,
      limit,
    };
  }

  /**
   * Get holds on an account.
   */
  async getHolds(
    user: AuthenticatedUser,
    accountId: string,
  ): Promise<{
    accountId: string;
    totalHeldAmount: string;
    holds: Array<{
      id: string;
      accountId: string;
      amount: string;
      reason: string;
      startDate: string;
      endDate: string | null;
      isActive: boolean;
    }>;
  }> {
    const account = await this.findAccountOrThrow(accountId);
    const userId = await this.resolveUserId(accountId, user);
    this.accountPolicy.canViewHolds(user, userId);

    const holds: Array<{
      id: string;
      accountId: string;
      amount: string;
      reason: string;
      startDate: string;
      endDate: string | null;
      isActive: boolean;
    }> = [];

    if (new Decimal(account.holdAmount).gt(0)) {
      holds.push({
        id: `hold-${account.id}-aggregate`,
        accountId: account.id,
        amount: account.holdAmount.toString(),
        reason: 'Pending holds (transaction details available in Transactions module)',
        startDate: account.updatedAt.toISOString(),
        endDate: null,
        isActive: true,
      });
    }

    return {
      accountId: account.id,
      totalHeldAmount: account.holdAmount.toString(),
      holds,
    };
  }

  // ─── Private helpers ────────────────────────────────────────────────

  private async findAccountOrThrow(accountId: string) {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }
    return account;
  }

  /**
   * Resolve the owner userId for an account.
   * If the authenticated user is an admin, we still need to find the owner for policy checks.
   * Non-admin non-holders are rejected immediately.
   */
  private async resolveUserId(accountId: string, user: AuthenticatedUser): Promise<string> {
    // First check if the authenticated user is an account holder
    const isHolder = await this.accountRepository.isAccountHolder(accountId, user.id);
    if (isHolder) return user.id;

    // If admin, find the owner from account holders
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      const holders = await this.accountRepository.getAccountHolders(accountId);
      const owner = holders.find((h) => h.role === 'OWNER');
      return owner?.userId ?? user.id;
    }

    // Non-holder non-admin: deny access immediately
    throw new ForbiddenException('You do not have permission to access this account');
  }

  private generateAccountNumber(): string {
    const bytes = randomBytes(5);
    const num = bytes.readUInt32BE(0) % 10_000_000_000;
    return num.toString().padStart(10, '0');
  }

  /**
   * Generate a server-side account number and confirm it is not already in use.
   * Retries a bounded number of times to eliminate the (already tiny) collision
   * risk before persisting. Numbers are never reused or client-supplied.
   */
  private async generateUniqueAccountNumber(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = this.generateAccountNumber();
      const existing = await this.accountRepository.findByAccountNumber(candidate);
      if (!existing) {
        return candidate;
      }
    }
    throw new ConflictException('Unable to allocate a unique account number, please retry');
  }

  private buildAccountName(type: string, customName?: string): string {
    if (customName) return customName;
    const typeNames: Record<string, string> = {
      CHECKING: 'Checking Account',
      SAVINGS: 'Savings Account',
      BUSINESS: 'Business Account',
      INVESTMENT_CASH: 'Investment Cash Account',
    };
    return typeNames[type] ?? 'Account';
  }

  private toResponseDto(account: {
    id: string;
    accountNumber: string;
    routingNumber: string;
    type: string;
    status: string;
    name: string;
    nickname: string | null;
    currency: string;
    currentBalance: Decimal;
    availableBalance: Decimal;
    pendingBalance: Decimal;
    holdAmount: Decimal;
    overdraftLimit: Decimal;
    dailyLimit: Decimal;
    monthlyLimit: Decimal;
    interestRate: Decimal | null;
    freezeReason: string | null;
    freezeNote: string | null;
    closedAt: Date | null;
    closureReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): AccountResponseDto {
    return AccountResponseDto.fromPrisma({
      id: account.id,
      accountNumber: account.accountNumber,
      routingNumber: account.routingNumber,
      type: account.type as AccountTypeType,
      status: account.status as AccountStatusType,
      name: account.name,
      nickname: account.nickname,
      currency: account.currency,
      currentBalance: account.currentBalance,
      availableBalance: account.availableBalance,
      pendingBalance: account.pendingBalance,
      holdAmount: account.holdAmount,
      overdraftLimit: account.overdraftLimit,
      dailyLimit: account.dailyLimit,
      monthlyLimit: account.monthlyLimit,
      interestRate: account.interestRate,
      freezeReason: account.freezeReason as FreezeReasonType | null,
      freezeNote: account.freezeNote,
      closedAt: account.closedAt,
      closureReason: account.closureReason as ClosureReasonType | null,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    });
  }

  private generateStatementPeriods(
    account: { id: string; createdAt: Date; currentBalance: Decimal; currency: string },
    startDate: Date,
    endDate: Date,
  ): Array<{
    id: string;
    accountId: string;
    periodStart: string;
    periodEnd: string;
    openingBalance: string;
    closingBalance: string;
    totalCredits: string;
    totalDebits: string;
    transactionCount: number;
    generatedAt: string;
  }> {
    const periods: Array<{
      id: string;
      accountId: string;
      periodStart: string;
      periodEnd: string;
      openingBalance: string;
      closingBalance: string;
      totalCredits: string;
      totalDebits: string;
      transactionCount: number;
      generatedAt: string;
    }> = [];

    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate);

    while (current <= end) {
      const periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      periods.push({
        id: `stmt-${account.id}-${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}`,
        accountId: account.id,
        periodStart: current.toISOString().slice(0, 10),
        periodEnd: (periodEnd > end ? end : periodEnd).toISOString().slice(0, 10),
        openingBalance: '0.00',
        closingBalance: account.currentBalance.toString(),
        totalCredits: '0.00',
        totalDebits: '0.00',
        transactionCount: 0,
        generatedAt: new Date().toISOString(),
      });
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    return periods;
  }
}

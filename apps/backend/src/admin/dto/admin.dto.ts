import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { NotificationChannel, NotificationType } from '@prisma/client';

export type AdminRole =
  'SUPPORT' | 'OPERATIONS' | 'COMPLIANCE' | 'FINANCE' | 'ADMIN' | 'SUPER_ADMIN';

export class AdminContextDto {
  @ApiProperty({ enum: ['SUPPORT', 'OPERATIONS', 'COMPLIANCE', 'FINANCE', 'ADMIN', 'SUPER_ADMIN'] })
  @IsString()
  role!: AdminRole;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  actorId!: string;
}

export class PaginationDto {
  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  offset?: number;
}

export class AdminDashboardOverviewDto {
  @ApiProperty() totalCustomers!: number;
  @ApiProperty() activeAccounts!: number;
  @ApiProperty() totalDeposits!: number;
  @ApiProperty() totalTransfers!: number;
  @ApiProperty() totalCardTransactions!: number;
  @ApiProperty() totalInvestments!: number;
  @ApiProperty() pendingApprovals!: number;
  @ApiProperty() pendingNotifications!: number;
  @ApiProperty() dailyVolume!: number;
  @ApiProperty() monthlyVolume!: number;
  @ApiProperty() revenue!: number;
  @ApiProperty({ type: Object }) systemHealth!: Record<string, string | number>;
}

export class AdminAnalyticsDto {
  @ApiProperty() dailyKpis!: Record<string, number>;
  @ApiProperty() monthlyKpis!: Record<string, number>;
  @ApiProperty() growth!: Record<string, number>;
  @ApiProperty() volume!: Record<string, number>;
  @ApiProperty() assetsUnderManagement!: number;
  @ApiProperty() activeUsers!: number;
}

export class AdminSearchQueryDto extends PaginationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  q!: string;
}

export class AdminSearchResultItemDto {
  @ApiProperty() kind!: string;
  @ApiProperty() id!: string;
  @ApiProperty() primary!: string;
  @ApiPropertyOptional() secondary?: string;
  @ApiPropertyOptional() metadata?: Record<string, string | number | boolean | null>;
}

export class AdminSearchResultDto {
  @ApiProperty({ type: [AdminSearchResultItemDto] }) items!: AdminSearchResultItemDto[];
  @ApiProperty() total!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() offset!: number;
}

export class AdminAuditQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({ enum: ['INFO', 'WARNING', 'CRITICAL'] })
  @IsOptional()
  @IsString()
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class AdminAuditLogDto {
  @ApiProperty() id!: string;
  @ApiProperty() action!: string;
  @ApiProperty() resourceType!: string;
  @ApiProperty() resourceId!: string;
  @ApiProperty() description!: string;
  @ApiProperty() severity!: string;
  @ApiProperty() createdAt!: string;
}

export class AdminSettingsDto {
  @ApiProperty({ type: [String] }) supportedAssets!: string[];
  @ApiProperty({ type: [String] }) currencies!: string[];
  @ApiProperty({ type: [String] }) networks!: string[];
  @ApiProperty({ type: Object }) limits!: Record<string, number>;
  @ApiProperty({ type: Object }) featureFlags!: Record<string, boolean>;
  @ApiProperty({ type: Object }) environment!: Record<string, string | boolean>;
  @ApiProperty() maintenanceMode!: boolean;
}

export class UpdateAdminSettingsDto {
  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  limits?: Record<string, number>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  featureFlags?: Record<string, boolean>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;
}

export class CustomerQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;
}

export class CustomerStatusActionDto {
  @ApiProperty({ enum: ['SUSPEND', 'REACTIVATE', 'FREEZE'] })
  @IsString()
  action!: 'SUSPEND' | 'REACTIVATE' | 'FREEZE';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AccountAdminActionDto {
  @ApiProperty({
    enum: ['FREEZE', 'UNFREEZE', 'LOCK', 'UNLOCK', 'CLOSE', 'ARCHIVE', 'CREDIT', 'DEBIT'],
  })
  @IsString()
  action!: 'FREEZE' | 'UNFREEZE' | 'LOCK' | 'UNLOCK' | 'CLOSE' | 'ARCHIVE' | 'CREDIT' | 'DEBIT';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Amount for CREDIT/DEBIT actions' })
  @IsOptional()
  @IsString()
  amount?: string;

  @ApiPropertyOptional({ description: 'Unique reference for CREDIT/DEBIT actions' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({
    description: 'Allow a DEBIT to push the account below zero available balance',
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export class BulkDeleteTransactionsDto {
  @ApiPropertyOptional({ type: [String], description: 'Specific transaction ids to delete' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  transactionIds?: string[];

  @ApiPropertyOptional({
    description: 'Account whose entire transaction history should be cleared',
  })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Must be true together with accountId to clear all history' })
  @IsOptional()
  @IsBoolean()
  all?: boolean;
}

export class GenerateHistoryDto {
  @ApiPropertyOptional({ description: 'History length in months (1-12), defaults to 6' })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(12)
  months?: number;

  @ApiPropertyOptional({
    description: 'Approximate total volume (sum of generated amounts) to spread across the period',
  })
  @IsOptional()
  @IsString()
  totalAmount?: string;

  @ApiPropertyOptional({ description: 'Approximate number of transactions to generate (1-500)' })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(500)
  transactionCount?: number;
}

export class CardAdminActionDto {
  @ApiProperty({ enum: ['ISSUE', 'APPROVE', 'REJECT', 'FREEZE', 'UNFREEZE', 'REPLACE', 'CANCEL'] })
  @IsString()
  action!: 'ISSUE' | 'APPROVE' | 'REJECT' | 'FREEZE' | 'UNFREEZE' | 'REPLACE' | 'CANCEL';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cardType?: string;
}

export class InvestmentAdminActionDto {
  @ApiProperty({
    enum: [
      'APPROVE_DEPOSIT',
      'APPROVE_WITHDRAWAL',
      'UPDATE_PRICE',
      'ENABLE_ASSET',
      'DISABLE_ASSET',
      'SUSPEND_ASSET',
      'ADMIN_CREDIT',
      'ADMIN_DEBIT',
    ],
  })
  @IsString()
  action!:
    | 'APPROVE_DEPOSIT'
    | 'APPROVE_WITHDRAWAL'
    | 'UPDATE_PRICE'
    | 'ENABLE_ASSET'
    | 'DISABLE_ASSET'
    | 'SUSPEND_ASSET'
    | 'ADMIN_CREDIT'
    | 'ADMIN_DEBIT';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({
    description:
      'Asset symbol, required for UPDATE_PRICE. Ignored for ADMIN_CREDIT/ADMIN_DEBIT, which are always posted in USD.',
  })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  price?: number;

  @ApiPropertyOptional({ description: 'Target customer, required for ADMIN_CREDIT/ADMIN_DEBIT' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Asset-unit amount, required for ADMIN_CREDIT/ADMIN_DEBIT' })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  amount?: number;

  @ApiPropertyOptional({
    description: 'Reason for the balance adjustment (audit only, never shown to the customer)',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Allow an ADMIN_DEBIT to exceed the current holding quantity',
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export class NotificationQueueQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationChannel })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;
}

export class AdminReportQueryDto {
  @ApiPropertyOptional({ enum: ['DAILY_VOLUME', 'MONTHLY_VOLUME', 'AUM', 'ACTIVE_USERS'] })
  @IsOptional()
  @IsString()
  kind?: 'DAILY_VOLUME' | 'MONTHLY_VOLUME' | 'AUM' | 'ACTIVE_USERS';

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class AdminReportDto {
  @ApiProperty() kind!: string;
  @ApiProperty() generatedAt!: string;
  @ApiProperty({ type: [Object] }) rows!: Array<Record<string, string | number | boolean | null>>;
}

export class AdminBulkIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}

class CustomerAddressDto {
  @ApiPropertyOptional() @IsOptional() @IsString() line1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() line2?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postalCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
}

class CustomerEmploymentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() employer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jobTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() annualIncome?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional() @IsOptional() @IsString() firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phoneNumber?: string;

  @ApiPropertyOptional({ type: CustomerAddressDto })
  @IsOptional()
  @IsObject()
  address?: CustomerAddressDto;

  @ApiPropertyOptional({ type: CustomerEmploymentDto })
  @IsOptional()
  @IsObject()
  employment?: CustomerEmploymentDto;
}

export class KycDecisionDto {
  @ApiProperty({ enum: ['APPROVE', 'REJECT'] })
  @IsString()
  decision!: 'APPROVE' | 'REJECT';

  @ApiPropertyOptional({ description: 'Required when rejecting' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AssignAccountDto {
  @ApiProperty({ enum: ['CHECKING', 'SAVINGS', 'BUSINESS', 'INVESTMENT_CASH'] })
  @IsString()
  accountType!: 'CHECKING' | 'SAVINGS' | 'BUSINESS' | 'INVESTMENT_CASH';

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nickname?: string;
}

export class GeneratePresentationDto {
  @ApiProperty({ description: 'Target account to generate activity for' })
  @IsUUID()
  accountId!: string;

  @ApiPropertyOptional({ description: 'Closing balance, defaults to 4700000.00' })
  @IsOptional()
  @IsString()
  targetBalance?: string;

  @ApiPropertyOptional({ description: 'History length in months (1-12), defaults to 6' })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(12)
  months?: number;

  @ApiPropertyOptional({ description: 'Replace existing presentation activity atomically' })
  @IsOptional()
  @IsBoolean()
  replace?: boolean;
}

export class AccountRestrictionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({ description: 'Restriction/lien category' })
  @IsOptional()
  @IsString()
  restrictionType?: string;

  @ApiPropertyOptional({ description: 'Amount for a partial lien, if applicable' })
  @IsOptional()
  @IsString()
  amount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;
}

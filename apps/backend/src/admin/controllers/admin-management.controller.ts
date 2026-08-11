import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { NotificationChannel, NotificationType } from '@prisma/client';
import { SearchTransactionsDto } from '../../transactions/dto/search-transactions.dto';
import { SearchTransfersDto } from '../../transfers/dto/search-transfers.dto';
import { AccountAdminActionDto, AccountRestrictionDto, AssignAccountDto, CardAdminActionDto, CustomerQueryDto, CustomerStatusActionDto, InvestmentAdminActionDto, KycDecisionDto, NotificationQueueQueryDto, UpdateCustomerDto } from '../dto';
import type { AdminRole } from '../dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { AdminPolicy } from '../policies/admin.policy';
import { AdminCustomerService } from '../services/admin-customer.service';
import { AdminOrchestrationService } from '../services/admin-orchestration.service';

@ApiTags('Admin Management')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin')
export class AdminManagementController {
  constructor(
    private readonly orchestrationService: AdminOrchestrationService,
    private readonly customerService: AdminCustomerService,
    private readonly policy: AdminPolicy,
  ) {}

  @Get('customers')
  @ApiOperation({ summary: 'Search customers' })
  getCustomers(@Headers('x-admin-role') role: AdminRole, @Query() query: CustomerQueryDto) {
    this.policy.assertAllowed(role, 'customer.manage');
    return this.orchestrationService.getCustomers(query);
  }

  @Get('customers/:userId/profile')
  @ApiOperation({ summary: 'View customer profile graph' })
  getCustomerProfile(@Headers('x-admin-role') role: AdminRole, @Param('userId') userId: string) {
    this.policy.assertAllowed(role, 'customer.manage');
    return this.orchestrationService.getCustomerProfile(userId);
  }

  @Get('customers/:userId/accounts')
  getCustomerAccounts(@Headers('x-admin-role') role: AdminRole, @Param('userId') userId: string) {
    this.policy.assertAllowed(role, 'customer.manage');
    return this.orchestrationService.getCustomerAccounts(userId);
  }

  @Get('customers/:userId/cards')
  getCustomerCards(@Headers('x-admin-role') role: AdminRole, @Param('userId') userId: string) {
    this.policy.assertAllowed(role, 'customer.manage');
    return this.orchestrationService.getCustomerCards(userId);
  }

  @Get('customers/:userId/investments')
  getCustomerInvestments(@Headers('x-admin-role') role: AdminRole, @Param('userId') userId: string) {
    this.policy.assertAllowed(role, 'customer.manage');
    return this.orchestrationService.getCustomerInvestments(userId);
  }

  @Get('customers/:userId/transfers')
  getCustomerTransfers(@Headers('x-admin-role') role: AdminRole, @Param('userId') userId: string) {
    this.policy.assertAllowed(role, 'customer.manage');
    return this.orchestrationService.getCustomerTransfers(userId);
  }

  @Get('customers/:userId/transactions')
  getCustomerTransactions(@Headers('x-admin-role') role: AdminRole, @Param('userId') userId: string) {
    this.policy.assertAllowed(role, 'customer.manage');
    return this.orchestrationService.getCustomerTransactions(userId);
  }

  @Get('customers/:userId/notifications')
  getCustomerNotifications(@Headers('x-admin-role') role: AdminRole, @Param('userId') userId: string) {
    this.policy.assertAllowed(role, 'customer.manage');
    return this.orchestrationService.getCustomerNotifications(userId);
  }

  @Patch('customers/:userId/status')
  applyCustomerAction(
    @Headers('x-admin-role') role: AdminRole,
    @Param('userId') userId: string,
    @Body() body: CustomerStatusActionDto,
  ) {
    this.policy.assertAllowed(role, 'customer.manage');
    return this.orchestrationService.applyCustomerAction(userId, body);
  }

  @Post('customers/:userId/reset-mfa')
  resetMfa(@Headers('x-admin-role') role: AdminRole, @Param('userId') userId: string) {
    this.policy.assertAllowed(role, 'customer.manage');
    return this.orchestrationService.resetCustomerMfa(userId);
  }

  @Post('customers/:userId/reset-password')
  resetPassword(@Headers('x-admin-role') role: AdminRole, @Param('userId') userId: string) {
    this.policy.assertAllowed(role, 'customer.manage');
    return this.orchestrationService.resetCustomerPassword(userId);
  }

  @Get('customers/:userId/detail')
  @ApiOperation({ summary: 'Full customer record for the admin detail page' })
  getCustomerDetail(@Headers('x-admin-role') role: AdminRole, @Param('userId') userId: string) {
    this.policy.assertAllowed(role, 'customer.manage');
    return this.customerService.getCustomerDetail(userId);
  }

  @Patch('customers/:userId')
  @ApiOperation({ summary: 'Update customer profile fields' })
  updateCustomer(
    @Headers('x-admin-role') role: AdminRole,
    @Headers('x-admin-id') adminId: string,
    @Param('userId') userId: string,
    @Body() body: UpdateCustomerDto,
  ) {
    this.policy.assertAllowed(role, 'customer.manage');
    return this.customerService.updateCustomer(adminId, userId, body);
  }

  @Patch('customers/:userId/kyc')
  @ApiOperation({ summary: 'Approve or reject KYC (audited)' })
  decideKyc(
    @Headers('x-admin-role') role: AdminRole,
    @Headers('x-admin-id') adminId: string,
    @Param('userId') userId: string,
    @Body() body: KycDecisionDto,
  ) {
    this.policy.assertAllowed(role, 'customer.manage');
    return this.customerService.decideKyc(adminId, userId, body);
  }

  @Post('customers/:userId/accounts')
  @ApiOperation({ summary: 'Create/assign an account for a customer' })
  assignAccount(
    @Headers('x-admin-role') role: AdminRole,
    @Headers('x-admin-id') adminId: string,
    @Param('userId') userId: string,
    @Body() body: AssignAccountDto,
  ) {
    this.policy.assertAllowed(role, 'account.manage');
    return this.customerService.assignAccount(adminId, role, userId, body);
  }

  @Get('customers/:userId/audit')
  @ApiOperation({ summary: 'Admin audit trail for a customer' })
  getCustomerAudit(@Headers('x-admin-role') role: AdminRole, @Param('userId') userId: string) {
    this.policy.assertAllowed(role, 'customer.manage');
    return this.customerService.getCustomerAudit(userId);
  }

  @Patch('accounts/:accountId/restriction')
  @ApiOperation({ summary: 'Apply an account restriction/hold (audited)' })
  applyAccountRestriction(
    @Headers('x-admin-role') role: AdminRole,
    @Headers('x-admin-id') adminId: string,
    @Param('accountId') accountId: string,
    @Body() body: AccountRestrictionDto,
  ) {
    this.policy.assertAllowed(role, 'account.manage');
    return this.customerService.applyRestriction(adminId, role, accountId, body);
  }

  @Delete('accounts/:accountId/restriction')
  @ApiOperation({ summary: 'Release an account restriction (audited)' })
  releaseAccountRestriction(
    @Headers('x-admin-role') role: AdminRole,
    @Headers('x-admin-id') adminId: string,
    @Param('accountId') accountId: string,
  ) {
    this.policy.assertAllowed(role, 'account.manage');
    return this.customerService.releaseRestriction(adminId, role, accountId);
  }

  @Patch('accounts/:accountId')
  applyAccountAction(
    @Headers('x-admin-role') role: AdminRole,
    @Param('accountId') accountId: string,
    @Body() body: AccountAdminActionDto,
  ) {
    this.policy.assertAllowed(role, 'account.manage');
    return this.orchestrationService.applyAccountAction(accountId, body);
  }

  @Get('accounts/:accountId/statements')
  getAccountStatements(
    @Headers('x-admin-role') role: AdminRole,
    @Param('accountId') accountId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.policy.assertAllowed(role, 'account.manage');
    return this.orchestrationService.getAccountStatements(accountId, startDate, endDate);
  }

  @Get('accounts/:accountId/holds')
  getAccountHolds(@Headers('x-admin-role') role: AdminRole, @Param('accountId') accountId: string) {
    this.policy.assertAllowed(role, 'account.manage');
    return this.orchestrationService.getAccountHolds(accountId);
  }

  @Patch('cards/:cardId')
  applyCardAction(
    @Headers('x-admin-role') role: AdminRole,
    @Param('cardId') cardId: string,
    @Body() body: CardAdminActionDto,
  ) {
    this.policy.assertAllowed(role, 'card.manage');
    return this.orchestrationService.applyCardAction(cardId, body);
  }

  @Get('investments/portfolio/:userId')
  getPortfolio(@Headers('x-admin-role') role: AdminRole, @Param('userId') userId: string) {
    this.policy.assertAllowed(role, 'investment.manage');
    return this.orchestrationService.getPortfolio(userId);
  }

  @Get('investments/wallets')
  listWallets(
    @Headers('x-admin-role') role: AdminRole,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('network') network?: string,
  ) {
    this.policy.assertAllowed(role, 'investment.manage');
    return this.orchestrationService.listWallets(productId, status, network);
  }

  @Post('investments/wallets')
  createWallet(@Headers('x-admin-role') role: AdminRole, @Body() body: Record<string, unknown>) {
    this.policy.assertAllowed(role, 'investment.manage');
    return this.orchestrationService.createWallet(body as never);
  }

  @Patch('investments/actions')
  applyInvestmentAction(@Headers('x-admin-role') role: AdminRole, @Body() body: InvestmentAdminActionDto) {
    this.policy.assertAllowed(role, 'investment.manage');
    return this.orchestrationService.applyInvestmentAction(body);
  }

  @Get('transfers')
  listTransfers(@Headers('x-admin-role') role: AdminRole, @Query() query: SearchTransfersDto) {
    this.policy.assertAllowed(role, 'transfer.manage');
    return this.orchestrationService.listTransfers(query);
  }

  @Post('transfers/:transferId/retry')
  retryTransfer(@Headers('x-admin-role') role: AdminRole, @Param('transferId') transferId: string) {
    this.policy.assertAllowed(role, 'transfer.manage');
    return this.orchestrationService.retryFailedTransfer(transferId);
  }

  @Post('transfers/:transferId/cancel')
  cancelTransfer(
    @Headers('x-admin-role') role: AdminRole,
    @Param('transferId') transferId: string,
    @Body('reason') reason: string,
  ) {
    this.policy.assertAllowed(role, 'transfer.manage');
    return this.orchestrationService.cancelPendingTransfer(transferId, reason ?? 'admin cancellation');
  }

  @Get('transfers/settlement/view')
  getSettlementView(@Headers('x-admin-role') role: AdminRole, @Query() query: SearchTransfersDto) {
    this.policy.assertAllowed(role, 'transfer.manage');
    return this.orchestrationService.getSettlementView(query);
  }

  @Get('transactions')
  searchTransactions(@Headers('x-admin-role') role: AdminRole, @Query() query: SearchTransactionsDto) {
    this.policy.assertAllowed(role, 'transaction.manage');
    return this.orchestrationService.searchTransactions(query);
  }

  @Get('transactions/reference/:reference')
  getTransactionByReference(@Headers('x-admin-role') role: AdminRole, @Param('reference') reference: string) {
    this.policy.assertAllowed(role, 'transaction.manage');
    return this.orchestrationService.getTransactionByReference(reference);
  }

  @Post('transactions/:transactionId/reverse')
  reverseTransaction(
    @Headers('x-admin-role') role: AdminRole,
    @Param('transactionId') transactionId: string,
    @Body('reason') reason: string,
  ) {
    this.policy.assertAllowed(role, 'transaction.manage');
    return this.orchestrationService.reverseTransaction(transactionId, reason ?? 'admin reversal');
  }

  @Get('transactions/ledger/:accountId')
  ledgerView(@Headers('x-admin-role') role: AdminRole, @Param('accountId') accountId: string) {
    this.policy.assertAllowed(role, 'transaction.manage');
    return this.orchestrationService.getLedgerView(accountId);
  }

  @Get('transactions/journal/:accountId')
  journalView(@Headers('x-admin-role') role: AdminRole, @Param('accountId') accountId: string) {
    this.policy.assertAllowed(role, 'transaction.manage');
    return this.orchestrationService.getJournalView(accountId);
  }

  @Get('notifications/queue')
  @ApiResponse({ status: 200, type: Object })
  getNotificationQueue(@Headers('x-admin-role') role: AdminRole, @Query() query: NotificationQueueQueryDto) {
    this.policy.assertAllowed(role, 'notification.manage');
    return this.orchestrationService.getNotificationQueue(query);
  }

  @Post('notifications/:notificationId/retry')
  retryNotification(@Headers('x-admin-role') role: AdminRole, @Param('notificationId') notificationId: string) {
    this.policy.assertAllowed(role, 'notification.manage');
    return this.orchestrationService.retryNotification(notificationId);
  }

  @Post('notifications/templates/preview')
  previewTemplate(
    @Headers('x-admin-role') role: AdminRole,
    @Body('code') code: string,
    @Body('channel') channel: NotificationChannel,
    @Body('language') language = 'en',
    @Body('variables') variables: Record<string, string | number | boolean | null> = {},
  ) {
    this.policy.assertAllowed(role, 'notification.manage');
    return this.orchestrationService.previewNotificationTemplate(code, channel, language, variables);
  }

  @Post('notifications/broadcast')
  @ApiParam({ name: 'type', required: false })
  sendBroadcast(
    @Headers('x-admin-role') role: AdminRole,
    @Body('type') type: NotificationType,
    @Body('title') title: string,
    @Body('body') body: string,
  ) {
    this.policy.assertAllowed(role, 'notification.manage');
    return this.orchestrationService.sendBroadcast(type, title, body);
  }
}

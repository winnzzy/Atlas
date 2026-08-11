import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AccountService } from '../services/account.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateNicknameDto } from '../dto/update-nickname.dto';
import { FreezeAccountDto } from '../dto/freeze-account.dto';
import { CloseAccountDto } from '../dto/close-account.dto';
import { LockAccountDto, UnlockAccountDto } from '../dto/lock-account.dto';
import { AccountResponseDto } from '../dto/account-response.dto';
import type { AccountStatusType, AccountTypeType } from '../dto/account-response.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../policies/account.policy';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountController {
  constructor(@Inject(AccountService) private readonly accountService: AccountService) {}

  // ─── Account CRUD ──────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully',
    type: AccountResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Account limit reached or duplicate nickname' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountService.createAccount(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List accounts for the authenticated user' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by account type' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Paginated list of accounts' })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: AccountStatusType,
    @Query('type') type?: AccountTypeType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.accountService.listAccounts(user, {
      status,
      type,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account details', type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AccountResponseDto> {
    return this.accountService.getAccount(user, id);
  }

  // ─── Nickname ──────────────────────────────────────────────────────

  @Patch(':id/nickname')
  @ApiOperation({ summary: 'Update account nickname' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Nickname updated', type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 409, description: 'Duplicate nickname' })
  async updateNickname(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNicknameDto,
  ): Promise<AccountResponseDto> {
    return this.accountService.updateNickname(user, id, dto);
  }

  // ─── Freeze / Unfreeze ────────────────────────────────────────────

  @Post(':id/freeze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Freeze an account (admin only)' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account frozen', type: AccountResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async freeze(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FreezeAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountService.freezeAccount(user, id, dto.reason, dto.note);
  }

  @Post(':id/unfreeze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfreeze an account (admin only)' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account unfrozen', type: AccountResponseDto })
  @ApiResponse({ status: 400, description: 'Account is not frozen' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async unfreeze(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AccountResponseDto> {
    return this.accountService.unfreezeAccount(user, id);
  }

  // ─── Close ─────────────────────────────────────────────────────────

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close an account' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account closed', type: AccountResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot close with non-zero balance' })
  @ApiResponse({ status: 409, description: 'Account has outstanding balance' })
  async close(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountService.closeAccount(user, id, dto.reason ?? 'USER_REQUEST');
  }

  // ─── Lock / Unlock ────────────────────────────────────────────────

  @Post(':id/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lock an account (admin only)' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account locked', type: AccountResponseDto })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async lock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LockAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountService.lockAccount(user, id, dto.reason);
  }

  @Post(':id/unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlock an account (admin only)' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account unlocked', type: AccountResponseDto })
  @ApiResponse({ status: 400, description: 'Account is not locked' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async unlock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _dto: UnlockAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountService.unlockAccount(user, id);
  }

  // ─── Archive ──────────────────────────────────────────────────────

  @Delete(':id/archive')
  @ApiOperation({ summary: 'Archive an account (admin only)' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account archived', type: AccountResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AccountResponseDto> {
    return this.accountService.archiveAccount(user, id);
  }

  // ─── Balance ──────────────────────────────────────────────────────

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get full balance breakdown' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Balance information' })
  async getBalance(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.accountService.getBalance(user, id);
  }

  @Get(':id/balance/available')
  @ApiOperation({ summary: 'Get available balance' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Available balance' })
  async getAvailableBalance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.accountService.getAvailableBalance(user, id);
  }

  @Get(':id/balance/current')
  @ApiOperation({ summary: 'Get current balance' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Current balance' })
  async getCurrentBalance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.accountService.getCurrentBalance(user, id);
  }

  // ─── Statements ───────────────────────────────────────────────────

  @Get(':id/statements')
  @ApiOperation({ summary: 'Get account statements' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO 8601)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Account statements' })
  async getStatements(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.accountService.getStatements(user, id, {
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  // ─── Holds ────────────────────────────────────────────────────────

  @Get(':id/holds')
  @ApiOperation({ summary: 'Get holds on an account' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account holds' })
  async getHolds(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.accountService.getHolds(user, id);
  }
}

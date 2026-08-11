import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  Inject,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TransactionService } from '../services/transaction.service';
import type { CreateTransactionDto } from '../dto/create-transaction.dto';
import type { SearchTransactionsDto, StatementExportDto } from '../dto/search-transactions.dto';
import { TransactionResponseDto, TransactionSearchResponseDto, StatementResponseDto } from '../dto/transaction-response.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../accounts/policies/account.policy';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);

  constructor(@Inject(TransactionService) private readonly transactionService: TransactionService) {}

  /**
   * Create a new transaction.
   * Orchestrates: Authorization → Policy Validation → Business Validation →
   *               Idempotency Check → Ledger Posting → Audit → Events
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new transaction',
    description:
      'Creates a new financial transaction. The transaction will be validated, authorized, posted to the ledger, settled, and completed automatically. All accounting is delegated to the Ledger Engine.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Transaction created and processed successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Duplicate reference or idempotency key' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Policy violation' })
  async createTransaction(
    @CurrentUser() userOrDto: AuthenticatedUser | CreateTransactionDto,
    @Body() dto?: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    if (!dto) {
      return this.transactionService.createTransaction(userOrDto as CreateTransactionDto);
    }
    const user = userOrDto as AuthenticatedUser;
    return this.transactionService.createTransactionForUser(user, dto);
  }

  /**
   * Search transactions with cursor-based pagination.
   */
  @Get()
  @ApiOperation({
    summary: 'Search transactions',
    description:
      'Search transactions by reference, date range, amount, status, type, account, customer, or currency. Supports cursor-based pagination for efficient large dataset handling.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction search results',
    type: TransactionSearchResponseDto,
  })
  async searchTransactions(
    @CurrentUser() userOrDto: AuthenticatedUser | SearchTransactionsDto,
    @Query() dto?: SearchTransactionsDto,
  ): Promise<TransactionSearchResponseDto> {
    if (!dto) {
      return this.transactionService.searchTransactions(userOrDto as SearchTransactionsDto);
    }
    const user = userOrDto as AuthenticatedUser;
    return this.transactionService.searchTransactionsForUser(user, dto);
  }

  /**
   * Get a transaction by ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get transaction by ID',
    description: 'Retrieve a single transaction by its unique identifier.',
  })
  @ApiParam({ name: 'id', description: 'Transaction ID (UUID)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction found',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Transaction not found' })
  async getTransaction(
    @CurrentUser() userOrId: AuthenticatedUser | string,
    @Param('id') id?: string,
  ): Promise<TransactionResponseDto> {
    if (!id) {
      return this.transactionService.getTransaction(userOrId as string);
    }
    const user = userOrId as AuthenticatedUser;
    return this.transactionService.getTransactionForUser(user, id);
  }

  /**
   * Cancel a transaction.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel a transaction',
    description:
      'Cancel a transaction that has not yet reached a terminal state. If the transaction was already posted to the ledger, the journal will be reversed.',
  })
  @ApiParam({ name: 'id', description: 'Transaction ID (UUID)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction cancelled',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Transaction not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Transaction cannot be cancelled in current status' })
  async cancelTransaction(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.cancelTransaction(id, reason);
  }

  /**
   * Reverse a settled/completed transaction.
   */
  @Put(':id/reverse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reverse a transaction',
    description:
      'Reverse a posted, settled, or completed transaction. Creates a reversing journal entry in the Ledger Engine.',
  })
  @ApiParam({ name: 'id', description: 'Transaction ID (UUID)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction reversed',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Transaction not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Transaction is not reversible' })
  async reverseTransaction(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.reverseTransaction(id, reason);
  }

  /**
   * Get transactions for a specific account.
   */
  @Get('account/:accountId')
  @ApiOperation({
    summary: 'Get account transactions',
    description: 'Retrieve all transactions for a specific account with cursor-based pagination.',
  })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results per page (max 200)' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Cursor for pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account transactions',
    type: TransactionSearchResponseDto,
  })
  async getAccountTransactions(
    @CurrentUser() userOrAccountId: AuthenticatedUser | string,
    @Param('accountId') accountIdOrLimit?: string | number,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ): Promise<TransactionSearchResponseDto> {
    if (typeof userOrAccountId === 'string') {
      return this.transactionService.getAccountTransactions(userOrAccountId, Number(accountIdOrLimit ?? limit ?? 50), cursor);
    }
    return this.transactionService.getAccountTransactionsForUser(userOrAccountId, accountIdOrLimit as string, limit, cursor);
  }

  /**
   * Generate an account statement.
   * Export placeholder only - no PDF generation.
   */
  @Post('statement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate account statement',
    description:
      'Generate a transaction statement for an account within a date range. Returns structured data for export (PDF generation is not included).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statement generated',
    type: StatementResponseDto,
  })
  async generateStatement(@Body() dto: StatementExportDto): Promise<StatementResponseDto> {
    return this.transactionService.generateStatement(dto);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { LedgerService } from '../services/ledger.service';
import type { PostJournalDto } from '../dto/post-journal.dto';
import type { CreateHoldDto, ReleaseHoldDto } from '../dto/hold.dto';
import type { ReverseJournalDto } from '../dto/reverse-journal.dto';
import type { BalanceQueryDto } from '../dto/balance-query.dto';
import type { CreateReconciliationDto } from '../dto/reconciliation.dto';

@ApiTags('Ledger')
@ApiBearerAuth()
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post('journals')
  @ApiOperation({ summary: 'Post a new journal (double-entry)' })
  @ApiResponse({ status: 201, description: 'Journal posted successfully' })
  @ApiResponse({ status: 400, description: 'Unbalanced or invalid journal' })
  @ApiResponse({ status: 409, description: 'Duplicate idempotency key' })
  async postJournal(@Body() dto: PostJournalDto) {
    const journal = await this.ledgerService.postJournal(dto);
    return journal.toJSON();
  }

  @Post('journals/:id/reverse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reverse a journal (full or partial)' })
  @ApiParam({ name: 'id', description: 'Original journal ID' })
  @ApiResponse({ status: 200, description: 'Journal reversed successfully' })
  @ApiResponse({ status: 400, description: 'Reversal not allowed' })
  @ApiResponse({ status: 404, description: 'Journal not found' })
  async reverseJournal(
    @Param('id') id: string,
    @Body() dto: ReverseJournalDto,
  ) {
    const reversal = await this.ledgerService.reverseJournal({
      ...dto,
      transactionId: id,
    });
    return reversal.toJSON();
  }

  @Post('holds')
  @ApiOperation({ summary: 'Create a hold on an account' })
  @ApiResponse({ status: 201, description: 'Hold created successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or invalid hold' })
  async createHold(@Body() dto: CreateHoldDto) {
    const hold = await this.ledgerService.createHold(dto);
    return hold.toJSON();
  }

  @Patch('holds/:id/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release a hold (full or partial)' })
  @ApiParam({ name: 'id', description: 'Hold ID' })
  @ApiResponse({ status: 200, description: 'Hold released' })
  @ApiResponse({ status: 404, description: 'Hold not found' })
  async releaseHold(
    @Param('id') id: string,
    @Body() dto: ReleaseHoldDto,
  ) {
    const hold = await this.ledgerService.releaseHold(id, dto);
    return hold.toJSON();
  }

  @Get('balances')
  @ApiOperation({ summary: 'Get account balance breakdown' })
  @ApiResponse({ status: 200, description: 'Balance information' })
  async getBalance(@Query() query: BalanceQueryDto) {
    return this.ledgerService.getBalance(query);
  }

  @Get('accounts/:accountId/postings')
  @ApiOperation({ summary: 'Get all postings for an account' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'List of postings' })
  async getAccountPostings(@Param('accountId') accountId: string) {
    return this.ledgerService.getAccountPostings(accountId);
  }

  @Get('accounts/:accountId/holds')
  @ApiOperation({ summary: 'Get all holds for an account' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'List of holds' })
  async getAccountHolds(@Param('accountId') accountId: string) {
    return this.ledgerService.getAccountHolds(accountId);
  }

  @Post('reconciliation')
  @ApiOperation({ summary: 'Run reconciliation for an account' })
  @ApiResponse({ status: 201, description: 'Reconciliation completed' })
  async reconcile(@Body() dto: CreateReconciliationDto) {
    return this.ledgerService.reconcile(dto);
  }
}
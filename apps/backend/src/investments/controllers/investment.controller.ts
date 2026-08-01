import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AssetService } from '../services/asset.service';
import { PricingService } from '../services/pricing.service';
import { WalletService } from '../services/wallet.service';
import { DepositService } from '../services/deposit.service';
import { WithdrawalService } from '../services/withdrawal.service';
import { ApprovalService } from '../services/approval.service';
import { PortfolioService } from '../services/portfolio.service';
import type { CreateAssetDto} from '../dto/create-asset.dto';
import { AssetResponseDto } from '../dto/create-asset.dto';
import type { CreateWalletDto, UpdateWalletDto} from '../dto/wallet.dto';
import { WalletResponseDto } from '../dto/wallet.dto';
import type { CreateDepositDto} from '../dto/deposit.dto';
import { DepositResponseDto } from '../dto/deposit.dto';
import type { CreateWithdrawalDto} from '../dto/withdrawal.dto';
import { WithdrawalResponseDto } from '../dto/withdrawal.dto';
import type { UpdatePriceDto} from '../dto/price.dto';
import { PriceResponseDto } from '../dto/price.dto';
import { PortfolioResponseDto, HoldingResponseDto, PortfolioTransactionResponseDto } from '../dto/portfolio.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Investments')
@ApiBearerAuth()
@Controller('investments')
export class InvestmentController {
  constructor(
    @Inject(AssetService) private readonly assetService: AssetService,
    @Inject(PricingService) private readonly pricingService: PricingService,
    @Inject(WalletService) private readonly walletService: WalletService,
    @Inject(DepositService) private readonly depositService: DepositService,
    @Inject(WithdrawalService) private readonly withdrawalService: WithdrawalService,
    @Inject(ApprovalService) private readonly approvalService: ApprovalService,
    @Inject(PortfolioService) private readonly portfolioService: PortfolioService,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // PORTFOLIO (Customer)
  // ═══════════════════════════════════════════════════════════════

  @Get('portfolio')
  @ApiOperation({ summary: 'Get current user portfolio' })
  @ApiResponse({ status: 200, description: 'Portfolio retrieved', type: PortfolioResponseDto })
  async getMyPortfolio(@CurrentUser('id') userId: string): Promise<PortfolioResponseDto> {
    return this.portfolioService.getPortfolio(userId);
  }

  @Get('portfolio/holdings/:productId')
  @ApiOperation({ summary: 'Get specific holding' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Holding retrieved', type: HoldingResponseDto })
  async getHolding(
    @CurrentUser('id') userId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<HoldingResponseDto | null> {
    return this.portfolioService.getHolding(userId, productId);
  }

  @Get('portfolio/transactions')
  @ApiOperation({ summary: 'Get portfolio transactions' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiResponse({ status: 200, description: 'Portfolio transactions retrieved', type: PortfolioTransactionResponseDto, isArray: true })
  async getPortfolioTransactions(
    @CurrentUser('id') userId: string,
    @Query('productId') productId?: string,
    @Query('type') type?: string,
  ): Promise<PortfolioTransactionResponseDto[]> {
    return this.portfolioService.getPortfolioTransactions(userId, { productId, type });
  }

  // ═══════════════════════════════════════════════════════════════
  // DEPOSITS (Customer)
  // ═══════════════════════════════════════════════════════════════

  @Post('deposits')
  @ApiOperation({ summary: 'Request a deposit' })
  @ApiResponse({ status: 201, description: 'Deposit requested', type: DepositResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async requestDeposit(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDepositDto,
  ): Promise<DepositResponseDto> {
    return this.depositService.requestDeposit(userId, dto);
  }

  @Get('deposits')
  @ApiOperation({ summary: 'Get my deposits' })
  @ApiResponse({ status: 200, description: 'Deposits retrieved', type: DepositResponseDto, isArray: true })
  async getMyDeposits(@CurrentUser('id') userId: string): Promise<DepositResponseDto[]> {
    return this.depositService.getUserDeposits(userId);
  }

  @Get('deposits/:id')
  @ApiOperation({ summary: 'Get deposit by ID' })
  @ApiParam({ name: 'id', description: 'Deposit ID' })
  @ApiResponse({ status: 200, description: 'Deposit retrieved', type: DepositResponseDto })
  @ApiResponse({ status: 404, description: 'Deposit not found' })
  async getDeposit(@Param('id', ParseUUIDPipe) id: string): Promise<DepositResponseDto> {
    return this.depositService.getDeposit(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // WITHDRAWALS (Customer)
  // ═══════════════════════════════════════════════════════════════

  @Post('withdrawals')
  @ApiOperation({ summary: 'Request a withdrawal' })
  @ApiResponse({ status: 201, description: 'Withdrawal requested', type: WithdrawalResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async requestWithdrawal(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWithdrawalDto,
  ): Promise<WithdrawalResponseDto> {
    return this.withdrawalService.requestWithdrawal(userId, dto);
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'Get my withdrawals' })
  @ApiResponse({ status: 200, description: 'Withdrawals retrieved', type: WithdrawalResponseDto, isArray: true })
  async getMyWithdrawals(@CurrentUser('id') userId: string): Promise<WithdrawalResponseDto[]> {
    return this.withdrawalService.getUserWithdrawals(userId);
  }

  @Get('withdrawals/:id')
  @ApiOperation({ summary: 'Get withdrawal by ID' })
  @ApiParam({ name: 'id', description: 'Withdrawal ID' })
  @ApiResponse({ status: 200, description: 'Withdrawal retrieved', type: WithdrawalResponseDto })
  @ApiResponse({ status: 404, description: 'Withdrawal not found' })
  async getWithdrawal(@Param('id', ParseUUIDPipe) id: string): Promise<WithdrawalResponseDto> {
    return this.withdrawalService.getWithdrawal(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // ASSETS (Admin)
  // ═══════════════════════════════════════════════════════════════

  @Post('admin/assets')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new investment product' })
  @ApiResponse({ status: 201, description: 'Product created', type: AssetResponseDto })
  async createAsset(
    @CurrentUser('id') adminId: string,
    @Body() dto: CreateAssetDto,
  ): Promise<AssetResponseDto> {
    return this.assetService.createAsset(dto, adminId);
  }

  @Get('admin/assets')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List all investment products' })
  @ApiQuery({ name: 'assetClass', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Products retrieved', type: AssetResponseDto, isArray: true })
  async listAssets(
    @Query('assetClass') assetClass?: string,
    @Query('status') status?: string,
  ): Promise<AssetResponseDto[]> {
    return this.assetService.listAssets({ assetClass, status });
  }

  @Get('admin/assets/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved', type: AssetResponseDto })
  async getAsset(@Param('id', ParseUUIDPipe) id: string): Promise<AssetResponseDto> {
    return this.assetService.getAsset(id);
  }

  @Patch('admin/assets/:id/enable')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Enable an asset' })
  @ApiResponse({ status: 200, description: 'Asset enabled', type: AssetResponseDto })
  async enableAsset(@Param('id', ParseUUIDPipe) id: string): Promise<AssetResponseDto> {
    return this.assetService.enableAsset(id, 'admin');
  }

  @Patch('admin/assets/:id/disable')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Disable an asset' })
  @ApiResponse({ status: 200, description: 'Asset disabled', type: AssetResponseDto })
  async disableAsset(@Param('id', ParseUUIDPipe) id: string): Promise<AssetResponseDto> {
    return this.assetService.disableAsset(id, 'admin');
  }

  @Patch('admin/assets/:id/suspend')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Suspend an asset' })
  @ApiResponse({ status: 200, description: 'Asset suspended', type: AssetResponseDto })
  async suspendAsset(@Param('id', ParseUUIDPipe) id: string): Promise<AssetResponseDto> {
    return this.assetService.suspendAsset(id, 'admin');
  }

  @Patch('admin/assets/:id/freeze')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Freeze an asset' })
  @ApiResponse({ status: 200, description: 'Asset frozen', type: AssetResponseDto })
  async freezeAsset(@Param('id', ParseUUIDPipe) id: string): Promise<AssetResponseDto> {
    return this.assetService.freezeAsset(id, 'admin');
  }

  // ═══════════════════════════════════════════════════════════════
  // WALLETS (Admin)
  // ═══════════════════════════════════════════════════════════════

  @Post('admin/wallets')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a wallet address' })
  @ApiResponse({ status: 201, description: 'Wallet created', type: WalletResponseDto })
  async createWallet(@Body() dto: CreateWalletDto): Promise<WalletResponseDto> {
    return this.walletService.createWallet(dto, 'admin');
  }

  @Get('admin/wallets')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List wallets' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'network', required: false })
  @ApiResponse({ status: 200, description: 'Wallets retrieved', type: WalletResponseDto, isArray: true })
  async listWallets(
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('network') network?: string,
  ): Promise<WalletResponseDto[]> {
    return this.walletService.listWallets({ productId, status, network });
  }

  @Get('admin/wallets/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get wallet by ID' })
  @ApiParam({ name: 'id', description: 'Wallet ID' })
  @ApiResponse({ status: 200, description: 'Wallet retrieved', type: WalletResponseDto })
  async getWallet(@Param('id', ParseUUIDPipe) id: string): Promise<WalletResponseDto> {
    return this.walletService.getWallet(id);
  }

  @Patch('admin/wallets/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update wallet address' })
  @ApiParam({ name: 'id', description: 'Wallet ID' })
  @ApiResponse({ status: 200, description: 'Wallet updated', type: WalletResponseDto })
  async updateWallet(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWalletDto,
  ): Promise<WalletResponseDto> {
    return this.walletService.updateWallet(id, dto, 'admin');
  }

  @Patch('admin/wallets/:id/activate')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Activate a wallet' })
  @ApiParam({ name: 'id', description: 'Wallet ID' })
  @ApiResponse({ status: 200, description: 'Wallet activated', type: WalletResponseDto })
  async activateWallet(@Param('id', ParseUUIDPipe) id: string): Promise<WalletResponseDto> {
    return this.walletService.activateWallet(id, 'admin');
  }

  @Patch('admin/wallets/:id/deactivate')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Deactivate a wallet' })
  @ApiParam({ name: 'id', description: 'Wallet ID' })
  @ApiResponse({ status: 200, description: 'Wallet deactivated', type: WalletResponseDto })
  async deactivateWallet(@Param('id', ParseUUIDPipe) id: string): Promise<WalletResponseDto> {
    return this.walletService.deactivateWallet(id, 'admin');
  }

  // ═══════════════════════════════════════════════════════════════
  // PRICING (Admin)
  // ═══════════════════════════════════════════════════════════════

  @Post('admin/prices')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update asset price' })
  @ApiResponse({ status: 201, description: 'Price updated', type: PriceResponseDto })
  async updatePrice(@Body() dto: UpdatePriceDto): Promise<PriceResponseDto> {
    return this.pricingService.updatePrice(dto, 'admin');
  }

  @Get('admin/prices/:productId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get latest price for a product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Latest price retrieved', type: PriceResponseDto })
  async getLatestPrice(@Param('productId', ParseUUIDPipe) productId: string): Promise<PriceResponseDto> {
    return this.pricingService.getLatestPrice(productId);
  }

  @Get('admin/prices')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get all current prices' })
  @ApiResponse({ status: 200, description: 'Prices retrieved', type: PriceResponseDto, isArray: true })
  async getAllPrices(): Promise<PriceResponseDto[]> {
    return this.pricingService.getAllPrices();
  }

  // ═══════════════════════════════════════════════════════════════
  // APPROVALS (Admin)
  // ═══════════════════════════════════════════════════════════════

  @Post('admin/deposits/:id/approve')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a deposit' })
  @ApiResponse({ status: 200, description: 'Deposit approved', type: DepositResponseDto })
  async approveDeposit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('notes') notes?: string,
  ): Promise<DepositResponseDto> {
    return this.approvalService.approveDeposit(id, 'admin', notes);
  }

  @Post('admin/deposits/:id/reject')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a deposit' })
  @ApiResponse({ status: 200, description: 'Deposit rejected', type: DepositResponseDto })
  async rejectDeposit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ): Promise<DepositResponseDto> {
    return this.approvalService.rejectDeposit(id, 'admin', reason);
  }

  @Post('admin/withdrawals/:id/approve')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a withdrawal' })
  @ApiResponse({ status: 200, description: 'Withdrawal approved', type: WithdrawalResponseDto })
  async approveWithdrawal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('notes') notes?: string,
  ): Promise<WithdrawalResponseDto> {
    return this.approvalService.approveWithdrawal(id, 'admin', notes);
  }

  @Post('admin/withdrawals/:id/reject')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a withdrawal' })
  @ApiResponse({ status: 200, description: 'Withdrawal rejected', type: WithdrawalResponseDto })
  async rejectWithdrawal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ): Promise<WithdrawalResponseDto> {
    return this.approvalService.rejectWithdrawal(id, 'admin', reason);
  }

  @Get('admin/deposits')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List all deposits (admin)' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Deposits retrieved', type: DepositResponseDto, isArray: true })
  async listAllDeposits(
    @Query('userId') userId?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
  ): Promise<DepositResponseDto[]> {
    return this.depositService.listDeposits({ userId, productId, status });
  }

  @Get('admin/withdrawals')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List all withdrawals (admin)' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Withdrawals retrieved', type: WithdrawalResponseDto, isArray: true })
  async listAllWithdrawals(
    @Query('userId') userId?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
  ): Promise<WithdrawalResponseDto[]> {
    return this.withdrawalService.listWithdrawals({ userId, productId, status });
  }

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMER ASSET DISCOVERY
  // ═══════════════════════════════════════════════════════════════

  @Get('assets')
  @ApiOperation({ summary: 'List available investment assets (customer)' })
  @ApiResponse({ status: 200, description: 'Available assets', type: AssetResponseDto, isArray: true })
  async getAvailableAssets(): Promise<AssetResponseDto[]> {
    return this.assetService.listAssets({ status: 'ACTIVE' });
  }

  @Get('assets/:id')
  @ApiOperation({ summary: 'Get asset details (customer)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Asset details retrieved', type: AssetResponseDto })
  async getAssetDetails(@Param('id', ParseUUIDPipe) id: string): Promise<AssetResponseDto> {
    return this.assetService.getAsset(id);
  }

  @Get('assets/:id/wallets')
  @ApiOperation({ summary: 'Get active deposit wallets for an asset (customer)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Asset wallets retrieved', type: WalletResponseDto, isArray: true })
  async getAssetWallets(@Param('id', ParseUUIDPipe) id: string): Promise<WalletResponseDto[]> {
    return this.walletService.getWalletsByProduct(id);
  }
}
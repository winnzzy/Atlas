import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  AssetStatus,
  DepositStatus,
  WithdrawalStatus,
  WalletStatus,
} from '../enums/investment-status.enum';
import type { AssetClass } from '../enums/asset-class.enum';
import type {
  SearchAssetsDto,
  SearchDepositsDto,
  SearchWithdrawalsDto,
  SearchWalletsDto,
} from '../dto/search-investments.dto';

@Injectable()
export class InvestmentRepository {
  private readonly logger = new Logger(InvestmentRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Investment Product ───────────────────────────────────────────

  async createProduct(data: {
    symbol: string;
    name: string;
    assetClass: AssetClass;
    description?: string;
    iconUrl?: string;
    decimals?: number;
    minDeposit?: number;
    minWithdrawal?: number;
    withdrawalFee?: number;
  }) {
    return this.prisma.investmentProduct.create({
      data: {
        symbol: data.symbol,
        name: data.name,
        assetClass: data.assetClass as never,
        status: AssetStatus.ACTIVE as never,
        description: data.description ?? null,
        iconUrl: data.iconUrl ?? null,
        decimals: data.decimals ?? 8,
        minDeposit: data.minDeposit ? new Decimal(data.minDeposit) : null,
        minWithdrawal: data.minWithdrawal ? new Decimal(data.minWithdrawal) : null,
        withdrawalFee: data.withdrawalFee ? new Decimal(data.withdrawalFee) : null,
      },
    });
  }

  async findProductBySymbol(symbol: string) {
    return this.prisma.investmentProduct.findUnique({
      where: { symbol },
      include: { priceHistory: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  }

  async findProductById(id: string) {
    return this.prisma.investmentProduct.findUnique({
      where: { id },
      include: { priceHistory: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  }

  async updateProductStatus(id: string, status: AssetStatus) {
    return this.prisma.investmentProduct.update({
      where: { id },
      data: { status: status as never },
    });
  }

  async updateProduct(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      iconUrl: string;
      decimals: number;
      minDeposit: number;
      minWithdrawal: number;
      withdrawalFee: number;
      status: AssetStatus;
    }>,
  ) {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.iconUrl !== undefined) updateData.iconUrl = data.iconUrl;
    if (data.decimals !== undefined) updateData.decimals = data.decimals;
    if (data.minDeposit !== undefined) updateData.minDeposit = new Decimal(data.minDeposit);
    if (data.minWithdrawal !== undefined) updateData.minWithdrawal = new Decimal(data.minWithdrawal);
    if (data.withdrawalFee !== undefined) updateData.withdrawalFee = new Decimal(data.withdrawalFee);
    if (data.status) updateData.status = data.status as never;

    return this.prisma.investmentProduct.update({
      where: { id },
      data: updateData,
    });
  }

  async searchProducts(dto: SearchAssetsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InvestmentProductWhereInput = {};
    if (dto.assetClass) where.assetClass = dto.assetClass as never;
    if (dto.status) where.status = dto.status as never;
    if (dto.search) {
      where.OR = [
        { symbol: { contains: dto.search, mode: 'insensitive' } },
        { name: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.investmentProduct.findMany({
        where,
        include: { priceHistory: { orderBy: { createdAt: 'desc' }, take: 1 } },
        skip,
        take: limit,
        orderBy: { symbol: 'asc' },
      }),
      this.prisma.investmentProduct.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllActiveProducts() {
    return this.prisma.investmentProduct.findMany({
      where: { status: AssetStatus.ACTIVE as never },
      include: { priceHistory: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { symbol: 'asc' },
    });
  }

  // ─── Investment Custody Wallet ────────────────────────────────────

  async createWallet(data: {
    productId: string;
    network: string;
    address: string;
    memo?: string | null;
    label?: string | null;
    status?: WalletStatus;
  }) {
    return this.prisma.investmentCustodyWallet.create({
      data: {
        productId: data.productId,
        network: data.network,
        address: data.address,
        memo: data.memo ?? null,
        label: data.label ?? null,
        status: (data.status ?? WalletStatus.ACTIVE) as never,
      },
    });
  }

  async findWalletById(id: string) {
    return this.prisma.investmentCustodyWallet.findUnique({ where: { id } });
  }

  async findWalletByAddress(address: string, network?: string) {
    return this.prisma.investmentCustodyWallet.findFirst({
      where: { address, ...(network ? { network } : {}) },
      include: { product: true },
    });
  }

  async findWalletsByProduct(productId: string) {
    return this.prisma.investmentCustodyWallet.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findWallets(
    filters?:
      | string
      | {
          productId?: string;
          status?: string;
          network?: string;
        },
  ) {
    const where: Prisma.InvestmentCustodyWalletWhereInput = {};

    if (typeof filters === 'string') {
      where.productId = filters;
    } else if (filters) {
      if (filters.productId) where.productId = filters.productId;
      if (filters.status) where.status = filters.status as never;
      if (filters.network) where.network = { contains: filters.network, mode: 'insensitive' };
    }

    return this.prisma.investmentCustodyWallet.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findProducts(filters?: { assetClass?: string; status?: string; symbol?: string }) {
    const where: Prisma.InvestmentProductWhereInput = {};
    if (filters?.assetClass) where.assetClass = filters.assetClass as never;
    if (filters?.status) where.status = filters.status as never;
    if (filters?.symbol) {
      where.symbol = { contains: filters.symbol, mode: 'insensitive' };
    }

    return this.prisma.investmentProduct.findMany({
      where,
      include: { priceHistory: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { symbol: 'asc' },
    });
  }

  async updateWallet(
    id: string,
    data: Partial<{ address: string; memo: string; label: string; status: WalletStatus }>,
  ) {
    const updateData: Record<string, unknown> = {};
    if (data.address !== undefined) updateData.address = data.address;
    if (data.memo !== undefined) updateData.memo = data.memo;
    if (data.label !== undefined) updateData.label = data.label;
    if (data.status) updateData.status = data.status as never;
    return this.prisma.investmentCustodyWallet.update({ where: { id }, data: updateData });
  }

  async updateWalletStatus(id: string, status: WalletStatus) {
    return this.prisma.investmentCustodyWallet.update({
      where: { id },
      data: { status: status as never },
    });
  }

  async deleteWallet(id: string) {
    return this.prisma.investmentCustodyWallet.delete({ where: { id } });
  }

  async searchWallets(dto: SearchWalletsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InvestmentCustodyWalletWhereInput = {};
    if (dto.productId) where.productId = dto.productId;
    if (dto.network) where.network = { contains: dto.network, mode: 'insensitive' };
    if (dto.status) where.status = dto.status as never;

    const [data, total] = await Promise.all([
      this.prisma.investmentCustodyWallet.findMany({
        where,
        include: { product: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.investmentCustodyWallet.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── Investment Price ──────────────────────────────────────────────

  async createPrice(data: {
    productId: string;
    price: number;
    currency?: string;
    change24h?: number;
    change24hPct?: number;
    marketCap?: number;
    volume24h?: number;
    updatedBy?: string;
  }) {
    return this.prisma.investmentPrice.create({
      data: {
        productId: data.productId,
        price: new Decimal(data.price),
        currency: data.currency ?? 'USD',
        change24h: data.change24h !== undefined ? new Decimal(data.change24h) : null,
        change24hPct: data.change24hPct !== undefined ? new Decimal(data.change24hPct) : null,
        marketCap: data.marketCap !== undefined ? new Decimal(data.marketCap) : null,
        volume24h: data.volume24h !== undefined ? new Decimal(data.volume24h) : null,
        updatedBy: data.updatedBy ?? null,
      },
    });
  }

  async findLatestPrice(productId: string) {
    return this.prisma.investmentPrice.findFirst({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPriceHistory(productId: string, limit = 100) {
    return this.prisma.investmentPrice.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findLatestPrices() {
    const prices = await this.prisma.$queryRaw<
      Array<{
        id: string;
        productId: string;
        price: Decimal;
        currency: string;
        change24h: Decimal | null;
        change24hPct: Decimal | null;
        marketCap: Decimal | null;
        volume24h: Decimal | null;
        createdAt: Date;
      }>
    >`
      SELECT DISTINCT ON ("product_id") 
        id, "product_id" as "productId", price, currency, "change_24h" as "change24h", 
        "change_24h_pct" as "change24hPct", "market_cap" as "marketCap", 
        "volume_24h" as "volume24h", "created_at" as "createdAt"
      FROM "investment_prices"
      ORDER BY "product_id", "created_at" DESC
    `;
    return prices;
  }

  // ─── Investment Custody Deposit ───────────────────────────────────

  async createDeposit(data: {
    userId: string;
    productId: string;
    walletId: string;
    amount: number;
    network: string;
    reference: string;
    txHash?: string;
  }) {
    return this.prisma.investmentCustodyDeposit.create({
      data: {
        userId: data.userId,
        productId: data.productId,
        walletId: data.walletId,
        amount: new Decimal(data.amount),
        network: data.network,
        reference: data.reference,
        txHash: data.txHash ?? null,
        status: DepositStatus.PENDING as never,
      },
    });
  }

  async findDepositById(id: string) {
    return this.prisma.investmentCustodyDeposit.findUnique({
      where: { id },
      include: { product: true, wallet: true },
    });
  }

  async findDepositByReference(reference: string) {
    return this.prisma.investmentCustodyDeposit.findUnique({
      where: { reference },
    });
  }

  async updateDeposit(
    id: string,
    data: Partial<{
      status: DepositStatus;
      txHash: string;
      approvedBy: string;
      approvedAt: Date;
      rejectedBy: string;
      rejectedAt: Date;
      rejectionReason: string;
    }>,
  ) {
    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status as never;
    if (data.txHash !== undefined) updateData.txHash = data.txHash;
    if (data.approvedBy !== undefined) updateData.approvedBy = data.approvedBy;
    if (data.approvedAt !== undefined) updateData.approvedAt = data.approvedAt;
    if (data.rejectedBy !== undefined) updateData.rejectedBy = data.rejectedBy;
    if (data.rejectedAt !== undefined) updateData.rejectedAt = data.rejectedAt;
    if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;
    return this.prisma.investmentCustodyDeposit.update({ where: { id }, data: updateData });
  }

  async searchDeposits(dto: SearchDepositsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InvestmentCustodyDepositWhereInput = {};
    if (dto.userId) where.userId = dto.userId;
    if (dto.status) where.status = dto.status as never;
    if (dto.productSymbol) where.product = { symbol: dto.productSymbol };
    if (dto.fromDate || dto.toDate) {
      where.createdAt = {};
      if (dto.fromDate) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(dto.fromDate);
      if (dto.toDate) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(dto.toDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.investmentCustodyDeposit.findMany({
        where,
        include: { product: true, wallet: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.investmentCustodyDeposit.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findDepositsByUser(userId: string, limit = 50) {
    return this.prisma.investmentCustodyDeposit.findMany({
      where: { userId },
      include: { product: true, wallet: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findDeposits(userId?: string, limit = 50) {
    const where: Prisma.InvestmentCustodyDepositWhereInput = {};
    if (userId) where.userId = userId;
    return this.prisma.investmentCustodyDeposit.findMany({
      where,
      include: { product: true, wallet: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ─── Investment Custody Withdrawal ────────────────────────────────

  async createWithdrawal(data: {
    userId: string;
    productId: string;
    amount: number;
    network: string;
    toAddress: string;
    toMemo?: string;
    fee: number;
    netAmount: number;
    reference: string;
  }) {
    return this.prisma.investmentCustodyWithdrawal.create({
      data: {
        userId: data.userId,
        productId: data.productId,
        amount: new Decimal(data.amount),
        network: data.network,
        toAddress: data.toAddress,
        toMemo: data.toMemo ?? null,
        fee: new Decimal(data.fee),
        netAmount: new Decimal(data.netAmount),
        reference: data.reference,
        status: WithdrawalStatus.PENDING as never,
      },
    });
  }

  async findWithdrawalById(id: string) {
    return this.prisma.investmentCustodyWithdrawal.findUnique({
      where: { id },
      include: { product: true },
    });
  }

  async findWithdrawalByReference(reference: string) {
    return this.prisma.investmentCustodyWithdrawal.findUnique({
      where: { reference },
    });
  }

  async updateWithdrawal(
    id: string,
    data: Partial<{
      status: WithdrawalStatus;
      txHash: string;
      approvedBy: string;
      approvedAt: Date;
      rejectedBy: string;
      rejectedAt: Date;
      rejectionReason: string;
    }>,
  ) {
    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status as never;
    if (data.txHash !== undefined) updateData.txHash = data.txHash;
    if (data.approvedBy !== undefined) updateData.approvedBy = data.approvedBy;
    if (data.approvedAt !== undefined) updateData.approvedAt = data.approvedAt;
    if (data.rejectedBy !== undefined) updateData.rejectedBy = data.rejectedBy;
    if (data.rejectedAt !== undefined) updateData.rejectedAt = data.rejectedAt;
    if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;
    return this.prisma.investmentCustodyWithdrawal.update({ where: { id }, data: updateData });
  }

  async searchWithdrawals(dto: SearchWithdrawalsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InvestmentCustodyWithdrawalWhereInput = {};
    if (dto.userId) where.userId = dto.userId;
    if (dto.status) where.status = dto.status as never;
    if (dto.productSymbol) where.product = { symbol: dto.productSymbol };
    if (dto.fromDate || dto.toDate) {
      where.createdAt = {};
      if (dto.fromDate) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(dto.fromDate);
      if (dto.toDate) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(dto.toDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.investmentCustodyWithdrawal.findMany({
        where,
        include: { product: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.investmentCustodyWithdrawal.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findWithdrawalsByUser(userId: string, limit = 50) {
    return this.prisma.investmentCustodyWithdrawal.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findWithdrawals(userId?: string, limit = 50) {
    const where: Prisma.InvestmentCustodyWithdrawalWhereInput = {};
    if (userId) where.userId = userId;
    return this.prisma.investmentCustodyWithdrawal.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ─── Portfolio ────────────────────────────────────────────────────

  async findOrCreatePortfolio(userId: string) {
    return this.prisma.investmentPortfolio.upsert({
      where: { userId },
      create: { userId, totalValue: new Decimal(0) },
      update: {},
    });
  }

  async updatePortfolioValue(portfolioId: string, totalValue: number) {
    return this.prisma.investmentPortfolio.update({
      where: { id: portfolioId },
      data: { totalValue: new Decimal(totalValue) },
    });
  }

  async findPortfolioByUser(userId: string) {
    return this.prisma.investmentPortfolio.findUnique({
      where: { userId },
      include: {
        positions: { include: { product: true } },
        entries: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
  }

  // ─── Positions ────────────────────────────────────────────────────

  async findPositionsByPortfolio(portfolioId: string) {
    return this.prisma.investmentPosition.findMany({
      where: { portfolioId },
      include: { product: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findPosition(portfolioId: string, productId: string) {
    return this.prisma.investmentPosition.findUnique({
      where: { portfolioId_productId: { portfolioId, productId } },
      include: { product: true },
    });
  }

  async findHolding(portfolioId: string, productId: string) {
    return this.findPosition(portfolioId, productId);
  }

  async findHoldingsByUser(userId: string) {
    return this.prisma.investmentPosition.findMany({
      where: { portfolio: { userId } },
      include: { product: { include: { priceHistory: { orderBy: { createdAt: 'desc' }, take: 1 } } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async upsertPosition(data: {
    portfolioId: string;
    productId: string;
    quantity: number;
    averageCost: number;
    totalCost: number;
    currentValue: number;
    profitLoss: number;
    profitLossPct: number;
  }) {
    return this.prisma.investmentPosition.upsert({
      where: { portfolioId_productId: { portfolioId: data.portfolioId, productId: data.productId } },
      create: {
        portfolioId: data.portfolioId,
        productId: data.productId,
        quantity: new Decimal(data.quantity),
        averageCost: new Decimal(data.averageCost),
        totalCost: new Decimal(data.totalCost),
        currentValue: new Decimal(data.currentValue),
        profitLoss: new Decimal(data.profitLoss),
        profitLossPct: new Decimal(data.profitLossPct),
      },
      update: {
        quantity: new Decimal(data.quantity),
        averageCost: new Decimal(data.averageCost),
        totalCost: new Decimal(data.totalCost),
        currentValue: new Decimal(data.currentValue),
        profitLoss: new Decimal(data.profitLoss),
        profitLossPct: new Decimal(data.profitLossPct),
      },
    });
  }

  async upsertHolding(data: {
    portfolioId: string;
    productId: string;
    quantity: number;
    averageCost: number;
    totalCost: number;
    currentValue: number;
    profitLoss: number;
    profitLossPct: number;
  }) {
    return this.upsertPosition(data);
  }

  // ─── Investment Entries ───────────────────────────────────────────

  async createEntry(data: {
    portfolioId: string;
    productId: string;
    type: string;
    quantity: number;
    pricePerUnit: number;
    totalAmount: number;
    fee?: number;
    currency?: string;
    reference: string;
    description?: string;
    createdBy?: string;
  }) {
    return this.prisma.investmentEntry.create({
      data: {
        portfolioId: data.portfolioId,
        productId: data.productId,
        type: data.type as never,
        quantity: new Decimal(data.quantity),
        pricePerUnit: new Decimal(data.pricePerUnit),
        totalAmount: new Decimal(data.totalAmount),
        fee: data.fee ? new Decimal(data.fee) : new Decimal(0),
        currency: data.currency ?? 'USD',
        reference: data.reference,
        description: data.description ?? null,
        createdBy: data.createdBy ?? null,
        status: 'PENDING' as never,
      },
    });
  }

  async createPortfolioTransaction(data: {
    portfolioId: string;
    productId: string;
    type: string;
    quantity: number;
    pricePerUnit: number;
    totalAmount: number;
    fee?: number;
    currency?: string;
    reference: string;
    description?: string;
    createdBy?: string;
  }) {
    return this.createEntry(data);
  }

  async findEntryById(id: string) {
    return this.prisma.investmentEntry.findUnique({
      where: { id },
      include: { product: true },
    });
  }

  async updateEntry(
    id: string,
    data: Partial<{
      status: string;
      approvedBy: string;
      approvedAt: Date;
      completedAt: Date;
      failedAt: Date;
      failureReason: string;
      transactionId: string;
    }>,
  ) {
    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.approvedBy !== undefined) updateData.approvedBy = data.approvedBy;
    if (data.approvedAt !== undefined) updateData.approvedAt = data.approvedAt;
    if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;
    if (data.failedAt !== undefined) updateData.failedAt = data.failedAt;
    if (data.failureReason !== undefined) updateData.failureReason = data.failureReason;
    if (data.transactionId !== undefined) updateData.transactionId = data.transactionId;
    return this.prisma.investmentEntry.update({ where: { id }, data: updateData });
  }

  async findEntriesByPortfolio(portfolioId: string, limit = 100) {
    return this.prisma.investmentEntry.findMany({
      where: { portfolioId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findPortfolioTransactions(userId: string, limit = 100) {
    const portfolio = await this.prisma.investmentPortfolio.findUnique({ where: { userId } });
    if (!portfolio) return [];
    return this.prisma.investmentEntry.findMany({
      where: { portfolioId: portfolio.id },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
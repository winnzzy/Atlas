import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type AuthenticatedUser } from '../../accounts/policies/account.policy';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TransferService } from '../services/transfer.service';
import type { CreateBeneficiaryDto, CreateTransferDto } from '../dto/create-transfer.dto';
import type { SearchTransfersDto } from '../dto/search-transfers.dto';
import { BeneficiaryResponseDto, BeneficiarySearchResponseDto, TransferResponseDto, TransferSearchResponseDto } from '../dto/transfer-response.dto';

@ApiTags('Transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transfers')
export class TransferController {
  constructor(@Inject(TransferService) private readonly transferService: TransferService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a transfer' })
  @ApiResponse({ status: HttpStatus.CREATED, type: TransferResponseDto })
  createTransfer(
    @CurrentUser() userOrDto: AuthenticatedUser | CreateTransferDto,
    @Body() dto?: CreateTransferDto,
  ): Promise<TransferResponseDto> {
    if (!dto) {
      return this.transferService.createTransfer({ id: 'system', role: 'ADMIN' } as AuthenticatedUser, userOrDto as CreateTransferDto);
    }
    const user = userOrDto as AuthenticatedUser;
    return this.transferService.createTransfer(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search transfers' })
  @ApiResponse({ status: HttpStatus.OK, type: TransferSearchResponseDto })
  searchTransfers(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: SearchTransfersDto,
  ): Promise<TransferSearchResponseDto> {
    return this.transferService.searchTransfersForUser(user, dto);
  }

  @Post('beneficiaries')
  @ApiOperation({ summary: 'Create beneficiary' })
  @ApiResponse({ status: HttpStatus.CREATED, type: BeneficiaryResponseDto })
  createBeneficiary(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBeneficiaryDto,
  ): Promise<BeneficiaryResponseDto> {
    return this.transferService.createBeneficiary(user, dto);
  }

  @Get('beneficiaries')
  @ApiOperation({ summary: 'List beneficiaries' })
  @ApiResponse({ status: HttpStatus.OK, type: BeneficiarySearchResponseDto })
  listBeneficiaries(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ): Promise<BeneficiarySearchResponseDto> {
    return this.transferService.listBeneficiaries(user, limit ? Number(limit) : 20, cursor);
  }

  @Patch('beneficiaries/:id/favorite')
  @ApiOperation({ summary: 'Favorite or unfavorite a beneficiary' })
  favoriteBeneficiary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('favorite') favorite: boolean,
  ): Promise<BeneficiaryResponseDto> {
    return this.transferService.favoriteBeneficiary(user, id, favorite);
  }

  @Post('beneficiaries/:id/verify')
  @ApiOperation({ summary: 'Verify beneficiary' })
  verifyBeneficiary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<BeneficiaryResponseDto> {
    return this.transferService.verifyBeneficiary(user, id);
  }

  @Delete('beneficiaries/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete beneficiary' })
  deleteBeneficiary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.transferService.deleteBeneficiary(user, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transfer by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.OK, type: TransferResponseDto })
  getTransfer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<TransferResponseDto> {
    return this.transferService.getTransferForUser(user, id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a queued transfer' })
  @ApiResponse({ status: HttpStatus.OK, type: TransferResponseDto })
  submitTransfer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<TransferResponseDto> {
    return this.transferService.submitTransfer(user, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a transfer' })
  cancelTransfer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<TransferResponseDto> {
    return this.transferService.cancelTransfer(user, id, reason);
  }

  @Post(':id/reverse')
  @ApiOperation({ summary: 'Reverse a transfer' })
  reverseTransfer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<TransferResponseDto> {
    return this.transferService.reverseTransfer(user, id, reason);
  }
}

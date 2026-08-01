import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type AuthenticatedUser } from '../../accounts/policies/account.policy';
import { TransferService } from '../services/transfer.service';
import type { CreateBeneficiaryDto, CreateTransferDto } from '../dto/create-transfer.dto';
import type { SearchTransfersDto } from '../dto/search-transfers.dto';
import { BeneficiaryResponseDto, BeneficiarySearchResponseDto, TransferResponseDto, TransferSearchResponseDto } from '../dto/transfer-response.dto';

@ApiTags('Transfers')
@ApiBearerAuth()
@Controller('transfers')
export class TransferController {
  constructor(@Inject(TransferService) private readonly transferService: TransferService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a transfer' })
  @ApiResponse({ status: HttpStatus.CREATED, type: TransferResponseDto })
  createTransfer(@Body() dto: CreateTransferDto): Promise<TransferResponseDto> {
    return this.transferService.createTransfer({ id: 'system' } as AuthenticatedUser, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search transfers' })
  @ApiResponse({ status: HttpStatus.OK, type: TransferSearchResponseDto })
  searchTransfers(@Query() dto: SearchTransfersDto): Promise<TransferSearchResponseDto> {
    return this.transferService.searchTransfers(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transfer by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: HttpStatus.OK, type: TransferResponseDto })
  getTransfer(@Param('id') id: string): Promise<TransferResponseDto> {
    return this.transferService.getTransfer(id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a queued transfer' })
  @ApiResponse({ status: HttpStatus.OK, type: TransferResponseDto })
  submitTransfer(@Param('id') id: string): Promise<TransferResponseDto> {
    return this.transferService.submitTransfer({ id: 'system' } as AuthenticatedUser, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a transfer' })
  cancelTransfer(@Param('id') id: string, @Body('reason') reason: string): Promise<TransferResponseDto> {
    return this.transferService.cancelTransfer({ id: 'system' } as AuthenticatedUser, id, reason);
  }

  @Post(':id/reverse')
  @ApiOperation({ summary: 'Reverse a transfer' })
  reverseTransfer(@Param('id') id: string, @Body('reason') reason: string): Promise<TransferResponseDto> {
    return this.transferService.reverseTransfer({ id: 'system' } as AuthenticatedUser, id, reason);
  }

  @Post('beneficiaries')
  @ApiOperation({ summary: 'Create beneficiary' })
  @ApiResponse({ status: HttpStatus.CREATED, type: BeneficiaryResponseDto })
  createBeneficiary(@Body() dto: CreateBeneficiaryDto): Promise<BeneficiaryResponseDto> {
    return this.transferService.createBeneficiary({ id: 'system' } as AuthenticatedUser, dto);
  }

  @Get('beneficiaries')
  @ApiOperation({ summary: 'List beneficiaries' })
  @ApiResponse({ status: HttpStatus.OK, type: BeneficiarySearchResponseDto })
  listBeneficiaries(@Query('limit') limit?: number, @Query('cursor') cursor?: string): Promise<BeneficiarySearchResponseDto> {
    return this.transferService.listBeneficiaries({ id: 'system' } as AuthenticatedUser, limit ? Number(limit) : 20, cursor);
  }

  @Patch('beneficiaries/:id/favorite')
  @ApiOperation({ summary: 'Favorite or unfavorite a beneficiary' })
  favoriteBeneficiary(@Param('id') id: string, @Body('favorite') favorite: boolean): Promise<BeneficiaryResponseDto> {
    return this.transferService.favoriteBeneficiary({ id: 'system' } as AuthenticatedUser, id, favorite);
  }

  @Post('beneficiaries/:id/verify')
  @ApiOperation({ summary: 'Verify beneficiary' })
  verifyBeneficiary(@Param('id') id: string): Promise<BeneficiaryResponseDto> {
    return this.transferService.verifyBeneficiary({ id: 'system' } as AuthenticatedUser, id);
  }

  @Delete('beneficiaries/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete beneficiary' })
  deleteBeneficiary(@Param('id') id: string): Promise<void> {
    return this.transferService.deleteBeneficiary({ id: 'system' } as AuthenticatedUser, id);
  }
}

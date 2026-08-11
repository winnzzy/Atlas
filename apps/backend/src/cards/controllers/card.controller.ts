import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type AuthenticatedUser } from '../../accounts/policies/account.policy';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CardService } from '../services/card.service';
import { CardResponseDto, CardSearchResponseDto, CardTransactionSearchResponseDto } from '../dto/cards.dto';
import { AuthorizeCardTransactionDto, ChangePinDto, CreateCardDto, RegenerateCvvDto, RefundCardTransactionDto, ReverseCardTransactionDto, SearchCardTransactionsDto, SearchCardsDto, UpdateCardDto } from '../dto/cards.dto';
import type { CardTransactionResponseDto } from '../dto/cards.dto';

@ApiTags('Cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardController {
  constructor(@Inject(CardService) private readonly cardService: CardService) {}

  @Get()
  @ApiOperation({ summary: 'Search cards' })
  @ApiResponse({ status: HttpStatus.OK, type: CardSearchResponseDto })
  searchCards(@CurrentUser() user: AuthenticatedUser, @Query() dto: SearchCardsDto): Promise<CardSearchResponseDto> {
    return this.cardService.searchCards(user, dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Apply for a card',
    description:
      'Records a card application in REQUESTED status. An administrator must approve it before the card can be used.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: CardResponseDto })
  issueCard(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCardDto): Promise<CardResponseDto> {
    return this.cardService.issueCard(user, dto, { requiresApproval: true });
  }

  @Get(':cardId')
  @ApiOperation({ summary: 'Get a card' })
  @ApiParam({ name: 'cardId', description: 'Card ID' })
  @ApiResponse({ status: HttpStatus.OK, type: CardResponseDto })
  getCard(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string): Promise<CardResponseDto> {
    return this.cardService.getCard(user, cardId);
  }

  @Patch(':cardId')
  @ApiOperation({ summary: 'Update card controls' })
  @ApiResponse({ status: HttpStatus.OK, type: CardResponseDto })
  updateCard(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string, @Body() dto: UpdateCardDto): Promise<CardResponseDto> {
    return this.cardService.updateCard(user, cardId, dto);
  }

  @Post(':cardId/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a card' })
  activateCard(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string): Promise<CardResponseDto> {
    return this.cardService.activateCard(user, cardId);
  }

  @Post(':cardId/freeze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Freeze a card' })
  freezeCard(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string, @Body('reason') reason?: string): Promise<CardResponseDto> {
    return this.cardService.freezeCard(user, cardId, reason);
  }

  @Post(':cardId/unfreeze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfreeze a card' })
  unfreezeCard(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string): Promise<CardResponseDto> {
    return this.cardService.unfreezeCard(user, cardId);
  }

  @Post(':cardId/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lock a card' })
  lockCard(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string, @Body('reason') reason?: string): Promise<CardResponseDto> {
    return this.cardService.lockCard(user, cardId, reason);
  }

  @Post(':cardId/unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlock a card' })
  unlockCard(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string): Promise<CardResponseDto> {
    return this.cardService.unlockCard(user, cardId);
  }

  @Delete(':cardId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a card' })
  cancelCard(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string, @Body('reason') reason?: string): Promise<CardResponseDto> {
    return this.cardService.cancelCard(user, cardId, reason);
  }

  @Post(':cardId/replace')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Replace a card' })
  replaceCard(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string): Promise<CardResponseDto> {
    return this.cardService.replaceCard(user, cardId);
  }

  @Post(':cardId/change-pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change card PIN' })
  changePin(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string, @Body() dto: ChangePinDto): Promise<CardResponseDto> {
    return this.cardService.changePin(user, cardId, dto);
  }

  @Post(':cardId/regenerate-cvv')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate virtual card CVV' })
  regenerateCvv(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string, @Body() dto: RegenerateCvvDto): Promise<CardResponseDto> {
    return this.cardService.regenerateCvv(user, cardId, dto);
  }

  @Post(':cardId/authorize')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Authorize a card transaction' })
  authorizeTransaction(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string, @Body() dto: AuthorizeCardTransactionDto): Promise<CardTransactionResponseDto> {
    return this.cardService.authorizeTransaction(user, cardId, dto);
  }

  @Post(':cardId/transactions/:transactionId/capture')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Capture a card authorization' })
  captureTransaction(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string, @Param('transactionId') transactionId: string): Promise<CardTransactionResponseDto> {
    void cardId;
    return this.cardService.captureTransaction(user, transactionId);
  }

  @Post(':cardId/transactions/:transactionId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a card transaction' })
  completeTransaction(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string, @Param('transactionId') transactionId: string): Promise<CardTransactionResponseDto> {
    void cardId;
    return this.cardService.completeTransaction(user, transactionId);
  }

  @Post(':cardId/transactions/:transactionId/refund')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Refund a card transaction' })
  refundTransaction(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string, @Param('transactionId') transactionId: string, @Body() dto: RefundCardTransactionDto): Promise<CardTransactionResponseDto> {
    void cardId;
    return this.cardService.refundTransaction(user, transactionId, dto);
  }

  @Post(':cardId/transactions/:transactionId/reverse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reverse a card transaction' })
  reverseTransaction(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string, @Param('transactionId') transactionId: string, @Body() dto: ReverseCardTransactionDto): Promise<CardTransactionResponseDto> {
    void cardId;
    return this.cardService.reverseTransaction(user, transactionId, dto);
  }

  @Post(':cardId/transactions/:transactionId/chargeback')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Open a chargeback foundation record' })
  chargebackTransaction(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string, @Param('transactionId') transactionId: string, @Body('reason') reason?: string): Promise<CardTransactionResponseDto> {
    void cardId;
    return this.cardService.chargebackTransaction(user, transactionId, reason);
  }

  @Get(':cardId/transactions')
  @ApiOperation({ summary: 'List card transactions' })
  @ApiResponse({ status: HttpStatus.OK, type: CardTransactionSearchResponseDto })
  listCardTransactions(@CurrentUser() user: AuthenticatedUser, @Param('cardId') cardId: string, @Query() dto: SearchCardTransactionsDto): Promise<CardTransactionSearchResponseDto> {
    return this.cardService.listCardTransactions(user, cardId, dto);
  }
}

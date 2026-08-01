import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type AuthenticatedUser } from '../../accounts/policies/account.policy';
import { CardService } from '../services/card.service';
import { CardResponseDto, CardSearchResponseDto, CardTransactionSearchResponseDto } from '../dto/cards.dto';
import type { AuthorizeCardTransactionDto, CardRevealResponseDto, CardTransactionResponseDto, ChangePinDto, CreateCardDto, RegenerateCvvDto, RefundCardTransactionDto, ReverseCardTransactionDto, SearchCardTransactionsDto, SearchCardsDto, UpdateCardDto } from '../dto/cards.dto';

@ApiTags('Cards')
@ApiBearerAuth()
@Controller('cards')
export class CardController {
  constructor(@Inject(CardService) private readonly cardService: CardService) {}

  @Get()
  @ApiOperation({ summary: 'Search cards' })
  @ApiResponse({ status: HttpStatus.OK, type: CardSearchResponseDto })
  searchCards(@Query() dto: SearchCardsDto): Promise<CardSearchResponseDto> {
    return this.cardService.searchCards({ id: 'system' } as AuthenticatedUser, dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Issue a card' })
  @ApiResponse({ status: HttpStatus.CREATED, type: CardResponseDto })
  issueCard(@Body() dto: CreateCardDto): Promise<CardResponseDto> {
    return this.cardService.issueCard({ id: 'system' } as AuthenticatedUser, dto);
  }

  @Get(':cardId')
  @ApiOperation({ summary: 'Get a card' })
  @ApiParam({ name: 'cardId', description: 'Card ID' })
  @ApiResponse({ status: HttpStatus.OK, type: CardResponseDto })
  getCard(@Param('cardId') cardId: string): Promise<CardResponseDto> {
    return this.cardService.getCard({ id: 'system' } as AuthenticatedUser, cardId);
  }

  @Patch(':cardId')
  @ApiOperation({ summary: 'Update card controls' })
  @ApiResponse({ status: HttpStatus.OK, type: CardResponseDto })
  updateCard(@Param('cardId') cardId: string, @Body() dto: UpdateCardDto): Promise<CardResponseDto> {
    return this.cardService.updateCard({ id: 'system' } as AuthenticatedUser, cardId, dto);
  }

  @Post(':cardId/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a card' })
  activateCard(@Param('cardId') cardId: string): Promise<CardResponseDto> {
    return this.cardService.activateCard({ id: 'system' } as AuthenticatedUser, cardId);
  }

  @Post(':cardId/freeze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Freeze a card' })
  freezeCard(@Param('cardId') cardId: string, @Body('reason') reason?: string): Promise<CardResponseDto> {
    return this.cardService.freezeCard({ id: 'system' } as AuthenticatedUser, cardId, reason);
  }

  @Post(':cardId/unfreeze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfreeze a card' })
  unfreezeCard(@Param('cardId') cardId: string): Promise<CardResponseDto> {
    return this.cardService.unfreezeCard({ id: 'system' } as AuthenticatedUser, cardId);
  }

  @Post(':cardId/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lock a card' })
  lockCard(@Param('cardId') cardId: string, @Body('reason') reason?: string): Promise<CardResponseDto> {
    return this.cardService.lockCard({ id: 'system' } as AuthenticatedUser, cardId, reason);
  }

  @Post(':cardId/unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlock a card' })
  unlockCard(@Param('cardId') cardId: string): Promise<CardResponseDto> {
    return this.cardService.unlockCard({ id: 'system' } as AuthenticatedUser, cardId);
  }

  @Delete(':cardId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a card' })
  cancelCard(@Param('cardId') cardId: string, @Body('reason') reason?: string): Promise<CardResponseDto> {
    return this.cardService.cancelCard({ id: 'system' } as AuthenticatedUser, cardId, reason);
  }

  @Post(':cardId/replace')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Replace a card' })
  replaceCard(@Param('cardId') cardId: string): Promise<CardResponseDto> {
    return this.cardService.replaceCard({ id: 'system' } as AuthenticatedUser, cardId);
  }

  @Post(':cardId/reveal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reveal demo card details' })
  revealCard(@Param('cardId') cardId: string): Promise<CardRevealResponseDto> {
    return this.cardService.revealCard({ id: 'system' } as AuthenticatedUser, cardId);
  }

  @Post(':cardId/change-pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change card PIN' })
  changePin(@Param('cardId') cardId: string, @Body() dto: ChangePinDto): Promise<CardResponseDto> {
    return this.cardService.changePin({ id: 'system' } as AuthenticatedUser, cardId, dto);
  }

  @Post(':cardId/regenerate-cvv')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate virtual card CVV' })
  regenerateCvv(@Param('cardId') cardId: string, @Body() dto: RegenerateCvvDto): Promise<CardResponseDto> {
    return this.cardService.regenerateCvv({ id: 'system' } as AuthenticatedUser, cardId, dto);
  }

  @Post(':cardId/authorize')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Authorize a card transaction' })
  authorizeTransaction(@Param('cardId') cardId: string, @Body() dto: AuthorizeCardTransactionDto): Promise<CardTransactionResponseDto> {
    return this.cardService.authorizeTransaction({ id: 'system' } as AuthenticatedUser, cardId, dto);
  }

  @Post(':cardId/transactions/:transactionId/capture')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Capture a card authorization' })
  captureTransaction(@Param('cardId') cardId: string, @Param('transactionId') transactionId: string): Promise<CardTransactionResponseDto> {
    void cardId;
    return this.cardService.captureTransaction({ id: 'system' } as AuthenticatedUser, transactionId);
  }

  @Post(':cardId/transactions/:transactionId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a card transaction' })
  completeTransaction(@Param('cardId') cardId: string, @Param('transactionId') transactionId: string): Promise<CardTransactionResponseDto> {
    void cardId;
    return this.cardService.completeTransaction({ id: 'system' } as AuthenticatedUser, transactionId);
  }

  @Post(':cardId/transactions/:transactionId/refund')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Refund a card transaction' })
  refundTransaction(@Param('cardId') cardId: string, @Param('transactionId') transactionId: string, @Body() dto: RefundCardTransactionDto): Promise<CardTransactionResponseDto> {
    void cardId;
    return this.cardService.refundTransaction({ id: 'system' } as AuthenticatedUser, transactionId, dto);
  }

  @Post(':cardId/transactions/:transactionId/reverse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reverse a card transaction' })
  reverseTransaction(@Param('cardId') cardId: string, @Param('transactionId') transactionId: string, @Body() dto: ReverseCardTransactionDto): Promise<CardTransactionResponseDto> {
    void cardId;
    return this.cardService.reverseTransaction({ id: 'system' } as AuthenticatedUser, transactionId, dto);
  }

  @Post(':cardId/transactions/:transactionId/chargeback')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Open a chargeback foundation record' })
  chargebackTransaction(@Param('cardId') cardId: string, @Param('transactionId') transactionId: string, @Body('reason') reason?: string): Promise<CardTransactionResponseDto> {
    void cardId;
    return this.cardService.chargebackTransaction({ id: 'system' } as AuthenticatedUser, transactionId, reason);
  }

  @Get(':cardId/transactions')
  @ApiOperation({ summary: 'List card transactions' })
  @ApiResponse({ status: HttpStatus.OK, type: CardTransactionSearchResponseDto })
  listCardTransactions(@Param('cardId') cardId: string, @Query() dto: SearchCardTransactionsDto): Promise<CardTransactionSearchResponseDto> {
    return this.cardService.listCardTransactions({ id: 'system' } as AuthenticatedUser, cardId, dto);
  }
}

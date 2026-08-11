import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumberString, IsObject, IsOptional, IsString, IsUUID, Length, MaxLength, MinLength } from 'class-validator';
import { CardDeclineReason, CardNetwork, CardSpendingCategory, CardStatus, CardTransactionStatus, CardTransactionType, CardType } from '../enums/card.enums';

export class CardSpendingControlsDto {
  @ApiPropertyOptional({ description: 'Daily spend limit' })
  @IsOptional()
  @IsNumberString()
  dailyLimit?: string;

  @ApiPropertyOptional({ description: 'Weekly spend limit' })
  @IsOptional()
  @IsNumberString()
  weeklyLimit?: string;

  @ApiPropertyOptional({ description: 'Monthly spend limit' })
  @IsOptional()
  @IsNumberString()
  monthlyLimit?: string;

  @ApiPropertyOptional({ description: 'Per transaction limit' })
  @IsOptional()
  @IsNumberString()
  perTransactionLimit?: string;

  @ApiPropertyOptional({ description: 'ATM limit' })
  @IsOptional()
  @IsNumberString()
  atmLimit?: string;

  @ApiPropertyOptional({ description: 'Online limit' })
  @IsOptional()
  @IsNumberString()
  onlineLimit?: string;

  @ApiPropertyOptional({ description: 'Contactless limit' })
  @IsOptional()
  @IsNumberString()
  contactlessLimit?: string;

  @ApiPropertyOptional({ description: 'Merchant limit' })
  @IsOptional()
  @IsNumberString()
  merchantLimit?: string;

  @ApiPropertyOptional({ description: 'Country limit' })
  @IsOptional()
  @IsNumberString()
  countryLimit?: string;

  @ApiPropertyOptional({ description: 'Velocity hook threshold' })
  @IsOptional()
  @IsNumberString()
  velocityLimit?: string;
}

export class CreateCardDto {
  @ApiProperty({ description: 'Linked account ID', format: 'uuid' })
  @IsUUID()
  accountId!: string;

  @ApiProperty({ enum: CardType })
  @IsEnum(CardType)
  type!: CardType;

  @ApiPropertyOptional({ enum: CardNetwork, default: CardNetwork.VISA })
  @IsOptional()
  @IsEnum(CardNetwork)
  network?: CardNetwork;

  @ApiPropertyOptional({ description: 'Cardholder display name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cardholderName?: string;

  @ApiPropertyOptional({ description: 'Nickname for the card', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nickname?: string;

  @ApiPropertyOptional({ description: 'PIN for the card' })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(12)
  pin?: string;

  @ApiPropertyOptional({ enum: CardSpendingCategory, default: CardSpendingCategory.GENERAL })
  @IsOptional()
  @IsEnum(CardSpendingCategory)
  spendingCategory?: CardSpendingCategory;

  @ApiPropertyOptional({ type: CardSpendingControlsDto })
  @IsOptional()
  @IsObject()
  spendingControls?: CardSpendingControlsDto;

  @ApiPropertyOptional({ description: 'Enable contactless payments', default: true })
  @IsOptional()
  @IsBoolean()
  contactlessEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable online payments', default: true })
  @IsOptional()
  @IsBoolean()
  onlineEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable international payments', default: false })
  @IsOptional()
  @IsBoolean()
  internationalEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable ATM withdrawals', default: true })
  @IsOptional()
  @IsBoolean()
  atmEnabled?: boolean;
}

export class UpdateCardDto {
  @ApiPropertyOptional({ description: 'Nickname for the card', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nickname?: string;

  @ApiPropertyOptional({ type: CardSpendingControlsDto })
  @IsOptional()
  @IsObject()
  spendingControls?: CardSpendingControlsDto;

  @ApiPropertyOptional({ description: 'Enable contactless payments' })
  @IsOptional()
  @IsBoolean()
  contactlessEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable online payments' })
  @IsOptional()
  @IsBoolean()
  onlineEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable international payments' })
  @IsOptional()
  @IsBoolean()
  internationalEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable ATM withdrawals' })
  @IsOptional()
  @IsBoolean()
  atmEnabled?: boolean;
}

export class SearchCardsDto {
  @ApiPropertyOptional({ description: 'Card number mask' })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @ApiPropertyOptional({ enum: CardStatus })
  @IsOptional()
  @IsEnum(CardStatus)
  status?: CardStatus;

  @ApiPropertyOptional({ enum: CardType })
  @IsOptional()
  @IsEnum(CardType)
  type?: CardType;

  @ApiPropertyOptional({ description: 'Account ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Customer ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Merchant name' })
  @IsOptional()
  @IsString()
  merchantName?: string;

  @ApiPropertyOptional({ description: 'Date range start' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Date range end' })
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Related transaction ID' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({ description: 'Cursor for pagination' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export class SearchCardTransactionsDto {
  @ApiPropertyOptional({ description: 'Card ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  cardId?: string;

  @ApiPropertyOptional({ enum: CardTransactionType })
  @IsOptional()
  @IsEnum(CardTransactionType)
  type?: CardTransactionType;

  @ApiPropertyOptional({ enum: CardTransactionStatus })
  @IsOptional()
  @IsEnum(CardTransactionStatus)
  status?: CardTransactionStatus;

  @ApiPropertyOptional({ description: 'Merchant name' })
  @IsOptional()
  @IsString()
  merchantName?: string;

  @ApiPropertyOptional({ description: 'Transaction ID' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Account ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Customer ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Date range start' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Date range end' })
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({ description: 'Pagination cursor' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export class AuthorizeCardTransactionDto {
  @ApiProperty({ enum: CardTransactionType })
  @IsEnum(CardTransactionType)
  type!: CardTransactionType;

  @ApiProperty({ description: 'Transaction amount' })
  @IsString()
  @IsNotEmpty()
  amount!: string;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Merchant name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  merchantName?: string;

  @ApiPropertyOptional({ description: 'Merchant category code' })
  @IsOptional()
  @IsString()
  @Length(4, 4)
  merchantCategoryCode?: string;

  @ApiPropertyOptional({ description: 'Merchant city' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  merchantCity?: string;

  @ApiPropertyOptional({ description: 'Merchant country' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  merchantCountry?: string;

  @ApiPropertyOptional({ description: 'Whether the transaction is online' })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @ApiPropertyOptional({ description: 'Whether the transaction is international' })
  @IsOptional()
  @IsBoolean()
  isInternational?: boolean;

  @ApiPropertyOptional({ description: 'Whether the transaction is contactless' })
  @IsOptional()
  @IsBoolean()
  isContactless?: boolean;

  @ApiPropertyOptional({ description: 'Unique idempotency key' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Additional metadata', type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class RefundCardTransactionDto {
  @ApiProperty({ description: 'Refund amount' })
  @IsString()
  @IsNotEmpty()
  amount!: string;

  @ApiPropertyOptional({ description: 'Reason for refund' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Idempotency key' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  idempotencyKey?: string;
}

export class ReverseCardTransactionDto {
  @ApiPropertyOptional({ description: 'Reason for reversal' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class ChangePinDto {
  @ApiProperty({ description: 'New PIN' })
  @IsString()
  @MinLength(4)
  @MaxLength(12)
  pin!: string;
}

export class RegenerateCvvDto {
  @ApiPropertyOptional({ description: 'Reason for regeneration' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class CardResponseDto {
  @ApiProperty({ description: 'Card ID', format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Account ID', format: 'uuid' })
  accountId!: string;

  @ApiPropertyOptional({ description: 'Primary customer ID', format: 'uuid' })
  customerId?: string;

  @ApiProperty({ enum: CardType })
  type!: CardType;

  @ApiProperty({ enum: CardStatus })
  status!: CardStatus;

  @ApiProperty({ enum: CardNetwork })
  network!: CardNetwork;

  @ApiProperty({ description: 'Masked card number' })
  maskedNumber!: string;

  @ApiProperty({ description: 'Last four digits' })
  lastFour!: string;

  @ApiPropertyOptional({ description: 'Card nickname' })
  nickname?: string;

  @ApiPropertyOptional({ description: 'Cardholder name' })
  cardholderName?: string;

  @ApiProperty({ description: 'Expiration month' })
  expiryMonth!: number;

  @ApiProperty({ description: 'Expiration year' })
  expiryYear!: number;

  @ApiPropertyOptional({ description: 'Card token' })
  cardToken?: string;

  @ApiPropertyOptional({ description: 'Spending category', enum: CardSpendingCategory })
  spendingCategory?: CardSpendingCategory;

  @ApiPropertyOptional({ type: CardSpendingControlsDto })
  spendingControls?: CardSpendingControlsDto;

  @ApiPropertyOptional({ description: 'Contactless enabled' })
  contactlessEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Online enabled' })
  onlineEnabled?: boolean;

  @ApiPropertyOptional({ description: 'International enabled' })
  internationalEnabled?: boolean;

  @ApiPropertyOptional({ description: 'ATM enabled' })
  atmEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Activated timestamp' })
  activatedAt?: Date;

  @ApiPropertyOptional({ description: 'Frozen timestamp' })
  frozenAt?: Date;

  @ApiPropertyOptional({ description: 'Closed timestamp' })
  closedAt?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Replacement card ID', format: 'uuid' })
  replacementCardId?: string;
}

export class CardSearchResponseDto {
  @ApiProperty({ type: [CardResponseDto] })
  items!: CardResponseDto[];

  @ApiPropertyOptional({ description: 'Next cursor' })
  nextCursor?: string;

  @ApiProperty({ description: 'Total count' })
  totalCount!: number;

  @ApiProperty({ description: 'Page limit' })
  limit!: number;
}

export class CardTransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID', format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Card ID', format: 'uuid' })
  cardId!: string;

  @ApiPropertyOptional({ description: 'Linked ledger transaction ID', format: 'uuid' })
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Hold ID' })
  holdId?: string;

  @ApiProperty({ enum: CardTransactionType })
  type!: CardTransactionType;

  @ApiProperty({ enum: CardTransactionStatus })
  status!: CardTransactionStatus;

  @ApiProperty({ description: 'Amount' })
  amount!: string;

  @ApiProperty({ description: 'Currency code' })
  currency!: string;

  @ApiPropertyOptional({ description: 'Merchant name' })
  merchantName?: string;

  @ApiPropertyOptional({ description: 'Merchant category code' })
  merchantCategoryCode?: string;

  @ApiPropertyOptional({ description: 'Merchant city' })
  merchantCity?: string;

  @ApiPropertyOptional({ description: 'Merchant country' })
  merchantCountry?: string;

  @ApiProperty({ description: 'Online transaction flag' })
  isOnline!: boolean;

  @ApiProperty({ description: 'International transaction flag' })
  isInternational!: boolean;

  @ApiProperty({ description: 'Contactless transaction flag' })
  isContactless!: boolean;

  @ApiPropertyOptional({ enum: CardDeclineReason })
  declineReason?: CardDeclineReason;

  @ApiPropertyOptional({ description: 'Authorization code' })
  authorizationCode?: string;

  @ApiPropertyOptional({ description: 'Metadata' })
  metadata?: Record<string, string>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Settlement timestamp' })
  settledAt?: Date;
}

export class CardTransactionSearchResponseDto {
  @ApiProperty({ type: [CardTransactionResponseDto] })
  items!: CardTransactionResponseDto[];

  @ApiPropertyOptional({ description: 'Next cursor' })
  nextCursor?: string;

  @ApiProperty({ description: 'Total count' })
  totalCount!: number;

  @ApiProperty({ description: 'Page limit' })
  limit!: number;
}

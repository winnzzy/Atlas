import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export type DemoScenarioId =
  | 'SCENARIO_1_NEW_CUSTOMER'
  | 'SCENARIO_2_HIGH_NET_WORTH'
  | 'SCENARIO_3_BUSINESS_CUSTOMER'
  | 'SCENARIO_4_CRYPTO_INVESTOR'
  | 'SCENARIO_5_FROZEN_ACCOUNT'
  | 'SCENARIO_6_FRAUD_INVESTIGATION'
  | 'SCENARIO_7_CARD_REPLACEMENT'
  | 'SCENARIO_8_LARGE_WIRE_TRANSFER';

export class LoadScenarioDto {
  @ApiProperty({
    enum: [
      'SCENARIO_1_NEW_CUSTOMER',
      'SCENARIO_2_HIGH_NET_WORTH',
      'SCENARIO_3_BUSINESS_CUSTOMER',
      'SCENARIO_4_CRYPTO_INVESTOR',
      'SCENARIO_5_FROZEN_ACCOUNT',
      'SCENARIO_6_FRAUD_INVESTIGATION',
      'SCENARIO_7_CARD_REPLACEMENT',
      'SCENARIO_8_LARGE_WIRE_TRANSFER',
    ],
  })
  @IsEnum([
    'SCENARIO_1_NEW_CUSTOMER',
    'SCENARIO_2_HIGH_NET_WORTH',
    'SCENARIO_3_BUSINESS_CUSTOMER',
    'SCENARIO_4_CRYPTO_INVESTOR',
    'SCENARIO_5_FROZEN_ACCOUNT',
    'SCENARIO_6_FRAUD_INVESTIGATION',
    'SCENARIO_7_CARD_REPLACEMENT',
    'SCENARIO_8_LARGE_WIRE_TRANSFER',
  ])
  scenarioId!: DemoScenarioId;
}

export class DemoControlActionDto {
  @ApiProperty({
    enum: [
      'APPROVE_DEPOSIT',
      'APPROVE_WITHDRAWAL',
      'FREEZE_ACCOUNT',
      'ISSUE_CARD',
      'CANCEL_CARD',
      'GENERATE_TRANSFER',
      'GENERATE_TRANSACTION',
      'GENERATE_NOTIFICATION',
      'CHANGE_ASSET_PRICE',
      'CREATE_CUSTOMER',
    ],
  })
  @IsString()
  action!:
    | 'APPROVE_DEPOSIT'
    | 'APPROVE_WITHDRAWAL'
    | 'FREEZE_ACCOUNT'
    | 'ISSUE_CARD'
    | 'CANCEL_CARD'
    | 'GENERATE_TRANSFER'
    | 'GENERATE_TRANSACTION'
    | 'GENERATE_NOTIFICATION'
    | 'CHANGE_ASSET_PRICE'
    | 'CREATE_CUSTOMER';

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  payload?: Record<string, string | number | boolean | null>;
}

export class DemoSimulatorActionDto {
  @ApiProperty({
    enum: [
      'SIM_INCOMING_ACH',
      'SIM_INCOMING_WIRE',
      'SIM_INVESTMENT_DEPOSIT',
      'SIM_INVESTMENT_WITHDRAWAL',
      'SIM_CARD_PURCHASE',
      'SIM_CARD_REFUND',
      'SIM_PRICE_MOVEMENT',
      'SIM_NOTIFICATION_DELIVERY',
    ],
  })
  @IsString()
  action!:
    | 'SIM_INCOMING_ACH'
    | 'SIM_INCOMING_WIRE'
    | 'SIM_INVESTMENT_DEPOSIT'
    | 'SIM_INVESTMENT_WITHDRAWAL'
    | 'SIM_CARD_PURCHASE'
    | 'SIM_CARD_REFUND'
    | 'SIM_PRICE_MOVEMENT'
    | 'SIM_NOTIFICATION_DELIVERY';

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  payload?: Record<string, string | number | boolean | null>;
}

export class DemoDashboardDto {
  @ApiProperty() investorKpis!: Record<string, number>;
  @ApiProperty() growthCharts!: Array<Record<string, number | string>>;
  @ApiProperty() aum!: number;
  @ApiProperty() revenue!: number;
  @ApiProperty() customerGrowth!: number;
  @ApiProperty() transactionVolume!: number;
  @ApiProperty() portfolioAllocation!: Array<Record<string, number | string>>;
  @ApiProperty() systemHealth!: Record<string, string | number>;
}

export class DemoResetResultDto {
  @ApiProperty() resetAt!: string;
  @ApiProperty() scenarioCount!: number;
}

export class DemoEntityCountDto {
  @ApiProperty() customers!: number;
  @ApiProperty() accounts!: number;
  @ApiProperty() cards!: number;
  @ApiProperty() transactions!: number;
  @ApiProperty() transfers!: number;
  @ApiProperty() investments!: number;
  @ApiProperty() notifications!: number;
  @ApiProperty() adminUsers!: number;
}

export class DemoPriceMovementDto {
  @ApiProperty() @IsString() symbol!: string;
  @ApiProperty() @IsNumber() price!: number;
}

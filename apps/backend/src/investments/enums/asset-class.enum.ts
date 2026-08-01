export enum AssetClass {
  CRYPTO = 'CRYPTO',
  STOCK = 'STOCK',
  ETF = 'ETF',
  BOND = 'BOND',
  MONEY_MARKET = 'MONEY_MARKET',
  GOLD = 'GOLD',
}

export const ACTIVE_ASSET_CLASSES: Set<AssetClass> = new Set([AssetClass.CRYPTO]);

export const PLACEHOLDER_ASSET_CLASSES: AssetClass[] = [
  AssetClass.STOCK,
  AssetClass.ETF,
  AssetClass.BOND,
  AssetClass.MONEY_MARKET,
  AssetClass.GOLD,
];
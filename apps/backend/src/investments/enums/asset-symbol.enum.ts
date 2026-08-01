/**
 * Supported cryptocurrency asset symbols.
 * Each symbol maps to a specific blockchain asset with associated network requirements.
 */
export enum CryptoAssetSymbol {
  BTC = 'BTC',
  ETH = 'ETH',
  USDT_ERC20 = 'USDT_ERC20',
  USDT_TRC20 = 'USDT_TRC20',
  USDC = 'USDC',
  BNB = 'BNB',
  SOL = 'SOL',
  XRP = 'XRP',
}

/**
 * Maps crypto asset symbols to their blockchain networks.
 */
export const CRYPTO_NETWORK_MAP: Record<CryptoAssetSymbol, string> = {
  [CryptoAssetSymbol.BTC]: 'Bitcoin',
  [CryptoAssetSymbol.ETH]: 'Ethereum',
  [CryptoAssetSymbol.USDT_ERC20]: 'Ethereum',
  [CryptoAssetSymbol.USDT_TRC20]: 'Tron',
  [CryptoAssetSymbol.USDC]: 'Ethereum',
  [CryptoAssetSymbol.BNB]: 'BSC',
  [CryptoAssetSymbol.SOL]: 'Solana',
  [CryptoAssetSymbol.XRP]: 'XRP Ledger',
};

/**
 * Maps crypto asset symbols to their human-readable names.
 */
export const CRYPTO_ASSET_NAMES: Record<CryptoAssetSymbol, string> = {
  [CryptoAssetSymbol.BTC]: 'Bitcoin',
  [CryptoAssetSymbol.ETH]: 'Ethereum',
  [CryptoAssetSymbol.USDT_ERC20]: 'Tether (ERC20)',
  [CryptoAssetSymbol.USDT_TRC20]: 'Tether (TRC20)',
  [CryptoAssetSymbol.USDC]: 'USD Coin',
  [CryptoAssetSymbol.BNB]: 'BNB',
  [CryptoAssetSymbol.SOL]: 'Solana',
  [CryptoAssetSymbol.XRP]: 'XRP',
};

/**
 * Asset symbols that require a memo/tag for transactions.
 */
export const MEMO_REQUIRED_ASSETS = new Set<CryptoAssetSymbol>([CryptoAssetSymbol.XRP]);

/**
 * All supported asset symbols (union of all asset classes).
 * Extensible: add new symbols from other asset classes as they become active.
 */
export type AssetSymbol = CryptoAssetSymbol;
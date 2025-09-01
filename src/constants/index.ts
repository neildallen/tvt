import { PublicKey } from '@solana/web3.js';

// Solana Network Configuration
export const SOLANA_NETWORK = 'devnet';
export const SOLANA_RPC_ENDPOINT = 'https://api.devnet.solana.com';

// Well-known addresses
export const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
export const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

// Meteora Dynamic Bonding Curve Program
export const DBC_PROGRAM_ID = new PublicKey('dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN');

// DAMM V1 Migration Fee Addresses
export const DAMM_V1_MIGRATION_FEE_ADDRESS = [
  new PublicKey('8f848CEy8eY6PhJ3VcemtBDzPPSD4Vq7aJczLZ3o8MmX'), // FixedBps25
  new PublicKey('HBxB8Lf14Yj8pqeJ8C4qDb5ryHL7xwpuykz31BLNYr7S'), // FixedBps30
  new PublicKey('7v5vBdUQHTNeqk1HnduiXcgbvCyVEZ612HLmYkQoAkik'), // FixedBps100
  new PublicKey('EkvP7d5yKxovj884d2DwmBQbrHUWRLGK6bympzrkXGja'), // FixedBps200
  new PublicKey('9EZYAJrcqNWNQzP2trzZesP7XKMHA1jEomHzbRsdX8R2'), // FixedBps400
  new PublicKey('8cdKo87jZU2R12KY1BUjjRPwyjgdNjLGqSGQyrDshhud'), // FixedBps600
];

// DAMM V2 Migration Fee Addresses
export const DAMM_V2_MIGRATION_FEE_ADDRESS = [
  new PublicKey('7F6dnUcRuyM2TwR8myT1dYypFXpPSxqwKNSFNkxyNESd'), // FixedBps25
  new PublicKey('2nHK1kju6XjphBLbNxpM5XRGFj7p9U8vvNzyZiha1z6k'), // FixedBps30
  new PublicKey('Hv8Lmzmnju6m7kcokVKvwqz7QPmdX9XfKjJsXz8RXcjp'), // FixedBps100
  new PublicKey('2c4cYd4reUYVRAB9kUUkrq55VPyy2FNQ3FDL4o12JXmq'), // FixedBps200
  new PublicKey('AkmQWebAwFvWk55wBoCr5D62C6VVDTzi84NJuD9H7cFD'), // FixedBps400
  new PublicKey('DbCRBj8McvPYHJG1ukj8RE15h2dCNUdTAESG49XpQ44u'), // FixedBps600
  new PublicKey('A8gMrEPJkacWkcb3DGwtJwTe16HktSEfvwtuDh2MCtck'), // Customizable
];

// Token Decimals
export enum TokenDecimal {
  SIX = 6,
  NINE = 9,
}

// Migration Options
export enum MigrationOption {
  MET_DAMM_V1 = 0,
  MET_DAMM_V2 = 1,
}

// Fee Mode
export enum BaseFeeMode {
  FeeSchedulerLinear = 0,
  FeeSchedulerExponential = 1,
  RateLimiter = 2,
}

// Activation Type
export enum ActivationType {
  Slot = 0,
  Timestamp = 1,
}

// Collect Fee Mode
export enum CollectFeeMode {
  QuoteToken = 0,
  OutputToken = 1,
}

// Migration Fee Options
export enum MigrationFeeOption {
  FixedBps25 = 0,
  FixedBps30 = 1,
  FixedBps100 = 2,
  FixedBps200 = 3,
  FixedBps400 = 4,
  FixedBps600 = 5,
  Customizable = 6,
}

// Token Type
export enum TokenType {
  SPL = 0,
  Token2022 = 1,
}

// Token Update Authority
export enum TokenUpdateAuthorityOption {
  CreatorUpdateAuthority = 0,
  Immutable = 1,
  PartnerUpdateAuthority = 2,
  CreatorUpdateAndMintAuthority = 3,
  PartnerUpdateAndMintAuthority = 4,
}

// DAMM V2 Dynamic Fee Mode
export enum DammV2DynamicFeeMode {
  Disabled = 0,
  Enabled = 1,
}

// Default Configuration Values
export const DEFAULT_TOKEN_CONFIG = {
  totalSupply: 1000000000,
  initialMarketCap: 0,
  migrationMarketCap: 100000,
  percentageSupplyOnMigration: 20,
  baseFeeStartingBps: 500, // 5%
  baseFeeEndingBps: 100,   // 1%
  dynamicFeeEnabled: true,
  creatorTradingFeePercentage: 50,
  tokenDecimal: TokenDecimal.SIX,
  quoteDecimal: TokenDecimal.NINE,
};

// UI Constants
export const SLIPPAGE_OPTIONS = ['0.5', '1', '2', '5'];
export const DEFAULT_SLIPPAGE = '1';

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  INVALID_AMOUNT: 'Please enter a valid amount',
  POOL_NOT_FOUND: 'Pool not found',
  TRANSACTION_FAILED: 'Transaction failed',
  NETWORK_ERROR: 'Network error occurred',
};

export const PLATFORM_CONFIG = new PublicKey('Hz3hBp4oRxJHZrU24P5kHTHzHffQjoWTq68CrDatewk3');
export const TVT_CA = SOLANA_NETWORK == 'devnet' ? 'ByxJs5GjFk8CWdPDNfQa8mXBySSXGGZdiVe2yWdgbVNJ' : 'xxxxxxxxxxxx';
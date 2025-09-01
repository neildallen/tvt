import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
}

export interface BondingCurveConfig {
  totalTokenSupply: number;
  initialMarketCap: number;
  migrationMarketCap: number;
  percentageSupplyOnMigration: number;
  baseFeeParams: {
    baseFeeMode: number;
    feeSchedulerParam: {
      startingFeeBps: number;
      endingFeeBps: number;
      numberOfPeriod: number;
      totalDuration: number;
    };
  };
  dynamicFeeEnabled: boolean;
  activationType: number;
  collectFeeMode: number;
  migrationFeeOption: number;
  tokenType: number;
  partnerLpPercentage: number;
  creatorLpPercentage: number;
  partnerLockedLpPercentage: number;
  creatorLockedLpPercentage: number;
  creatorTradingFeePercentage: number;
  leftover: number;
  tokenUpdateAuthority: number;
  migrationFee: {
    feePercentage: number;
    creatorFeePercentage: number;
  };
}

export interface Pool {
  address: PublicKey;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  poolCreator: PublicKey;
  config: PublicKey;
  baseVault: PublicKey;
  quoteVault: PublicKey;
  sqrtPrice: BN;
  baseReserve: BN;
  quoteReserve: BN;
  tradingFeeNumerator: BN;
  tradingFeeDenominator: BN;
  migrationProgress: number;
}

export interface PoolStats {
  currentPrice: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  holders: number;
  transactions: number;
}

export interface TradeQuote {
  amountIn: BN;
  amountOut: BN;
  priceImpact: number;
  fee: BN;
  minimumAmountOut: BN;
}

export interface LaunchpadFormData {
  name: string;
  symbol: string;
  description: string;
  image: string;
  totalSupply: string;
  initialMarketCap: string;
  migrationMarketCap: string;
  percentageSupplyOnMigration: string;
}

// Battle Interface
export interface Battle {
  id: string;
  token1: Token;
  token2: Token;
  duration: number; // in hours
  createdAt: Date;
  startTime?: Date;
  endTime?: Date;
  status: 'new' | 'about_to_bond' | 'bonded' | 'completed';
  winner?: string; // token id
}

export interface Token {
  id: string;
  ticker: string;
  name: string;
  logo?: string;
  contractAddress?: string;
  poolAddress?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  marketCap: number;
  volume: number;
  migrated: boolean;
}

export interface BattleFormData {
  token1: TokenFormData;
  token2: TokenFormData;
  duration: number;
}

export interface TokenFormData {
  ticker: string;
  name: string;
  logo?: File | string;
  twitter?: string;
  telegram?: string;
}

export interface LeaderboardEntry {
  token: Token;
  rank: number;
  battleWon: boolean;
}

export interface CountdownData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} 
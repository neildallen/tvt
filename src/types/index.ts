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
  logo?: File;
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
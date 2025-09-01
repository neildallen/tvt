/**
 * Backend API service for communicating with the TvT Launchpad backend server
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

export interface BackendTokenData {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  totalSupply?: string;
  initialMarketCap?: string;
  migrationMarketCap?: string;
  percentageSupplyOnMigration?: string;
}

export interface BackendBattleTokenData {
  name: string;
  ticker: string;
  logo?: string;
  twitter?: string;
  telegram?: string;
}

export interface BackendCreateTokenResponse {
  success: boolean;
  data?: {
    token: {
      name: string;
      symbol: string;
      description: string;
      image: string;
    };
    blockchain: {
      poolAddress: string;
      baseMintAddress: string;
      configAddress: string;
      txIds: string[];
    };
    explorer: {
      token: string;
      pool: string;
      transactions: string[];
    };
  };
  error?: string;
}

export interface BackendCreateBattleResponse {
  success: boolean;
  data?: {
    token1: {
      name: string;
      symbol: string;
      description: string;
      image: string;
      poolAddress: string;
      baseMintAddress: string;
      creatorWallet: string;
      txIds: string[];
      explorer: {
        token: string;
        pool: string;
      };
    };
    token2: {
      name: string;
      symbol: string;
      description: string;
      image: string;
      poolAddress: string;
      baseMintAddress: string;
      creatorWallet: string;
      txIds: string[];
      explorer: {
        token: string;
        pool: string;
      };
    };
    configAddress: string;
  };
  error?: string;
}

export interface BackendPoolInfoResponse {
  success: boolean;
  data?: {
    address: string;
    baseMint: string;
    quoteMint: string;
    name: string;
    symbol: string;
    currentPrice: number;
    dammV2PoolAddress: string;
    isMigrated: boolean;
    progress: number;
    migrationThreshold: number;
    currentReserve: number;
    marketCap: number;
    baseReserve: string;
    quoteReserve: string;
  };
  error?: string;
}

export interface BackendWalletResponse {
  success: boolean;
  data?: {
    publicKey: string;
    balance: number;
    network: string;
    explorer: string;
  };
  error?: string;
}

export class BackendApiService {
  private static async fetchApi<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${BACKEND_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          // Add API key if in production
          ...(process.env.NODE_ENV === 'production' && process.env.REACT_APP_API_KEY && {
            'X-API-Key': process.env.REACT_APP_API_KEY,
          }),
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Backend API Error (${endpoint}):`, error);
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED')) {
          throw new Error('Backend server is not running. Please start the server with "npm run dev" in the server directory.');
        }
        throw error;
      }
      
      throw new Error('Unknown backend API error');
    }
  }

  /**
   * Check if backend server is healthy
   */
  static async checkHealth(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.fetchApi<{ success: boolean; message: string }>('/health');
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }

  /**
   * Get backend wallet information
   */
  static async getWalletInfo(): Promise<BackendWalletResponse> {
    return this.fetchApi<BackendWalletResponse>('/api/tokens/wallet');
  }

  /**
   * Create a single token using the backend
   */
  static async createToken(tokenData: BackendTokenData): Promise<BackendCreateTokenResponse> {
    return this.fetchApi<BackendCreateTokenResponse>('/api/tokens/create', {
      method: 'POST',
      body: JSON.stringify(tokenData),
    });
  }

  /**
   * Create two tokens for a battle using the backend
   */
  static async createBattleTokens(
    token1: BackendBattleTokenData,
    token2: BackendBattleTokenData
  ): Promise<BackendCreateBattleResponse> {
    return this.fetchApi<BackendCreateBattleResponse>('/api/tokens/create-battle', {
      method: 'POST',
      body: JSON.stringify({ token1, token2 }),
    });
  }

  /**
   * Get pool information for a token using the backend
   */
  static async getPoolInfo(
    mint: string,
    poolAddress: string,
    tokenName?: string,
    tokenSymbol?: string,
    migrated?: boolean
  ): Promise<BackendPoolInfoResponse> {
    const params = new URLSearchParams({ mint, poolAddress });
    if (tokenName) params.append('tokenName', tokenName);
    if (tokenSymbol) params.append('tokenSymbol', tokenSymbol);
    if (migrated != undefined) params.append('migrated', migrated.toString());
    
    return this.fetchApi<BackendPoolInfoResponse>(`/api/tokens/pool-info?${params.toString()}`);
  }

  /**
   * Buy/swap SOL for a token using the backend
   */
  static async rewardChampion(
    mint: string,
    poolAddress: string,
    amountSol: number,
    slippageBps?: number
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.fetchApi<{ success: boolean; data?: any; error?: string }>('/api/tokens/rewardchampion', {
      method: 'POST',
      body: JSON.stringify({ 
        mint, 
        poolAddress, 
        amountSol,
        slippageBps: slippageBps || 500 // Default 5% slippage
      }),
    });
  }
}

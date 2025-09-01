import { supabase, handleSupabaseError } from '../lib/supabase';
import { Battle, Token, BattleFormData, LeaderboardEntry } from '../types';
import { Database } from '../types/database';
import { BackendApiService } from './BackendApiService';

type BattleRow = Database['public']['Tables']['battles']['Row'];
type TokenRow = Database['public']['Tables']['tokens']['Row'];
type BattleInsert = Database['public']['Tables']['battles']['Insert'];
type TokenInsert = Database['public']['Tables']['tokens']['Insert'];
type BattleVoteInsert = Database['public']['Tables']['battle_votes']['Insert'];

export class BattleService {
  /**
   * Create a new battle
   */
  static async createBattle(
    battleData: BattleFormData,
    creatorWallet: string
  ): Promise<Battle> {
    try {
      // First, create the tokens
      const token1Insert: TokenInsert = {
        ticker: battleData.token1.ticker,
        name: battleData.token1.name,
        logo_url: typeof battleData.token1.logo === 'string' ? battleData.token1.logo : undefined,
        twitter: battleData.token1.twitter,
        telegram: battleData.token1.telegram,
        contract_address: '', // Will be set when bonding curve is created
        creator_wallet: creatorWallet,
        market_cap: 0,
        volume: 0,
        migrated: false,
      };

      const token2Insert: TokenInsert = {
        ticker: battleData.token2.ticker,
        name: battleData.token2.name,
        logo_url: typeof battleData.token2.logo === 'string' ? battleData.token2.logo : undefined,
        twitter: battleData.token2.twitter,
        telegram: battleData.token2.telegram,
        contract_address: '', // Will be set when bonding curve is created
        creator_wallet: creatorWallet,
        market_cap: 0,
        volume: 0,
        migrated: false,
      };

      // Insert tokens
      const { data: tokens, error: tokensError } = await supabase
        .from('tokens')
        .insert([token1Insert, token2Insert])
        .select()
        .returns<TokenRow[]>();

      if (tokensError) throw tokensError;
      if (!tokens || tokens.length !== 2) throw new Error('Failed to create tokens');

      // Create the battle
      const battleInsert: BattleInsert = {
        token1_id: tokens[0].id,
        token2_id: tokens[1].id,
        duration: battleData.duration,
        creator_wallet: creatorWallet,
        status: 'new',
        total_volume: 0,
      };

      const { data: battle, error: battleError } = await supabase
        .from('battles')
        .insert(battleInsert)
        .select(`
          *,
          token1:tokens!battles_token1_id_fkey(*),
          token2:tokens!battles_token2_id_fkey(*)
        `)
        .single();

      if (battleError) throw battleError;
      if (!battle) throw new Error('Failed to create battle');

      return this.mapBattleFromDB(battle);
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Create a new battle with tokens launched on-chain using backend server
   */
  static async createBattleWithBackend(
    battleData: BattleFormData,
  ): Promise<Battle> {
    try {
      console.log('🚀 Creating battle with backend server...');
      
      // First, check if backend is healthy
      const healthCheck = await BackendApiService.checkHealth();
      if (!healthCheck.success) {
        throw new Error(`Backend server unavailable: ${healthCheck.message}`);
      }

      // Launch tokens on-chain using backend
      const backendTokenData = {
        token1: {
          name: battleData.token1.name,
          ticker: battleData.token1.ticker,
          logo: typeof battleData.token1.logo === 'string' ? battleData.token1.logo : undefined,
          twitter: battleData.token1.twitter,
          telegram: battleData.token1.telegram,
        },
        token2: {
          name: battleData.token2.name,
          ticker: battleData.token2.ticker,
          logo: typeof battleData.token2.logo === 'string' ? battleData.token2.logo : undefined,
          twitter: battleData.token2.twitter,
          telegram: battleData.token2.telegram,
        },
      };

      console.log('📡 Launching tokens on blockchain...');
      const backendResponse = await BackendApiService.createBattleTokens(
        backendTokenData.token1,
        backendTokenData.token2
      );

      if (!backendResponse.success || !backendResponse.data) {
        throw new Error(`Token launch failed: ${backendResponse.error || 'Unknown error'}`);
      }

      const { token1: token1Result, token2: token2Result } = backendResponse.data;

      console.log('✅ Tokens launched successfully:', {
        token1: {
          ticker: token1Result.symbol,
          contractAddress: token1Result.baseMintAddress,
          poolAddress: token1Result.poolAddress,
        },
        token2: {
          ticker: token2Result.symbol,
          contractAddress: token2Result.baseMintAddress,
          poolAddress: token2Result.poolAddress,
        },
      });

      // Create database entries for tokens with on-chain addresses
      const token1Insert: TokenInsert = {
        ticker: battleData.token1.ticker,
        name: battleData.token1.name,
        logo_url: typeof battleData.token1.logo === 'string' ? battleData.token1.logo : undefined,
        twitter: battleData.token1.twitter,
        telegram: battleData.token1.telegram,
        contract_address: token1Result.baseMintAddress,
        pool_address: token1Result.poolAddress,
        creator_wallet: token1Result.creatorWallet,
        market_cap: 0, // Initial market cap from backend
        volume: 0,
        migrated: false,
      };

      const token2Insert: TokenInsert = {
        ticker: battleData.token2.ticker,
        name: battleData.token2.name,
        logo_url: typeof battleData.token2.logo === 'string' ? battleData.token2.logo : undefined,
        twitter: battleData.token2.twitter,
        telegram: battleData.token2.telegram,
        contract_address: token2Result.baseMintAddress,
        pool_address: token2Result.poolAddress,
        creator_wallet: token2Result.creatorWallet,
        market_cap: 0, // Initial market cap from backend
        volume: 0,
        migrated: false,
      };

      console.log('💾 Saving tokens to database...');
      // Insert tokens into database
      const { data: tokens, error: tokensError } = await supabase
        .from('tokens')
        .insert([token1Insert, token2Insert])
        .select()
        .returns<TokenRow[]>();

      if (tokensError) throw tokensError;
      if (!tokens || tokens.length !== 2) throw new Error('Failed to create tokens in database');

      // Create the battle
      const battleInsert: BattleInsert = {
        token1_id: tokens[0].id,
        token2_id: tokens[1].id,
        duration: battleData.duration,
        creator_wallet: tokens[0].creator_wallet, // Use token1's creator wallet
        status: 'new',
        total_volume: 0,
        start_time: new Date().toISOString(),
      };

      console.log('⚔️ Creating battle in database...');
      const { data: battle, error: battleError } = await supabase
        .from('battles')
        .insert(battleInsert)
        .select(`
          *,
          token1:tokens!battles_token1_id_fkey(*),
          token2:tokens!battles_token2_id_fkey(*)
        `)
        .single();

      if (battleError) throw battleError;
      if (!battle) throw new Error('Failed to create battle in database');

      console.log('🎉 Battle created successfully!', {
        battleId: battle.id,
        token1: {
          ticker: battleData.token1.ticker,
          contractAddress: token1Result.baseMintAddress,
          poolAddress: token1Result.poolAddress,
          explorerLinks: token1Result.explorer,
        },
        token2: {
          ticker: battleData.token2.ticker,
          contractAddress: token2Result.baseMintAddress,
          poolAddress: token2Result.poolAddress,
          explorerLinks: token2Result.explorer,
        },
      });

      return this.mapBattleFromDB(battle);
    } catch (error) {
      console.error('❌ Error creating battle with backend:', error);
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Get all battles with optional filtering
   */
  static async getBattles(
    status?: 'new' | 'about_to_bond' | 'bonded' | 'completed'
  ): Promise<Battle[]> {
    try {
      let query = supabase
        .from('battles')
        .select(`
          *,
          token1:tokens!battles_token1_id_fkey(*),
          token2:tokens!battles_token2_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: battles, error } = await query;

      if (error) throw error;
      if (!battles) return [];

      return battles.map(battle => this.mapBattleFromDB(battle));
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  }

  /**
   * Get battle by ID
   */
  static async getBattleById(battleId: string): Promise<Battle | null> {
    try {
      const { data: battle, error } = await supabase
        .from('battles')
        .select(`
          *,
          token1:tokens!battles_token1_id_fkey(*),
          token2:tokens!battles_token2_id_fkey(*)
        `)
        .eq('id', battleId)
        .single();

      if (error) throw error;
      if (!battle) return null;

      return this.mapBattleFromDB(battle);
    } catch (error) {
      handleSupabaseError(error);
      return null;
    }
  }

  /**
   * Update battle status
   */
  static async updateBattleStatus(
    battleId: string,
    status: 'new' | 'about_to_bond' | 'bonded' | 'completed',
    winnerId?: string
  ): Promise<void> {
    try {
      const updateData: any = { status };
      
      if (status === 'completed' && winnerId) {
        updateData.winner_id = winnerId;
        updateData.end_time = new Date().toISOString();
      }
      
      if (status === 'bonded') {
        updateData.start_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('battles')
        .update(updateData)
        .eq('id', battleId);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Update battle with custom data
   */
  static async updateBattle(
    battleId: string,
    updates: {
      status?: 'new' | 'about_to_bond' | 'bonded' | 'completed';
      startTime?: Date;
      endTime?: Date;
      winnerId?: string;
      [key: string]: any; // Allow other properties like token migration status
    }
  ): Promise<void> {
    try {
      const updateData: any = {};
      
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.startTime !== undefined) updateData.start_time = updates.startTime.toISOString();
      if (updates.endTime !== undefined) updateData.end_time = updates.endTime.toISOString();
      if (updates.winnerId !== undefined) updateData.winner_id = updates.winnerId;

      const { error } = await supabase
        .from('battles')
        .update(updateData)
        .eq('id', battleId);

      if (error) throw error;

      // // Update token migration status if provided
      // if (updates['token1.migrated'] !== undefined || updates['token2.migrated'] !== undefined) {
      //   // Get the battle to get token IDs
      //   const battle = await this.getBattleById(battleId);
      //   if (battle) {
      //     if (updates['token1.migrated'] !== undefined) {
      //       await this.updateToken(battle.token1.id, { migrated: updates['token1.migrated'] });
      //     }
      //     if (updates['token2.migrated'] !== undefined) {
      //       await this.updateToken(battle.token2.id, { migrated: updates['token2.migrated'] });
      //     }
      //   }
      // }
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Record a vote/trade for a battle
   */
  static async recordBattleVote(
    battleId: string,
    tokenId: string,
    voterWallet: string,
    amount: number,
    transactionHash: string
  ): Promise<void> {
    try {
      const voteInsert: BattleVoteInsert = {
        battle_id: battleId,
        token_id: tokenId,
        voter_wallet: voterWallet,
        amount,
        transaction_hash: transactionHash,
      };

      const { error } = await supabase
        .from('battle_votes')
        .insert(voteInsert);

      if (error) throw error;

      // Update battle total volume
      await this.updateBattleVolume(battleId, amount);
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Update token information (market cap, volume, etc.)
   */
  static async updateToken(
    tokenId: string,
    updates: {
      marketCap?: number;
      volume?: number;
      contractAddress?: string;
      poolAddress?: string;
      migrated?: boolean;
    }
  ): Promise<void> {
    try {
      const updateData: any = {};
      
      if (updates.marketCap !== undefined) updateData.market_cap = updates.marketCap;
      if (updates.volume !== undefined) updateData.volume = updates.volume;
      if (updates.contractAddress !== undefined) updateData.contract_address = updates.contractAddress;
      if (updates.poolAddress !== undefined) updateData.pool_address = updates.poolAddress;
      if (updates.migrated !== undefined) updateData.migrated = updates.migrated;

      const { error } = await supabase
        .from('tokens')
        .update(updateData)
        .eq('id', tokenId);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Get leaderboard data
   */
  static async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      // Get all migrated tokens instead of using leaderboard table
      const { data: tokens, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('migrated', true)
        .limit(20);

      if (error) throw error;
      if (!tokens || tokens.length === 0) return [];

      console.log(`Fetching pool info for ${tokens.length} migrated tokens...`);

      // Fetch fresh pool info for each migrated token
      const tokensWithPoolInfo = await Promise.all(
        tokens.map(async (token) => {
          try {
            console.log(`Fetching pool info for token ${token.ticker}`);
            
            const poolResponse = await BackendApiService.getPoolInfo(
              token.contract_address || '',
              token.pool_address || '',
              token.name,
              token.ticker,
              token.migrated
            );

            const updatedMarketCap = poolResponse.data?.marketCap || token.market_cap;
            
            console.log(`Pool info fetched for ${token.ticker}:`, {
              oldMarketCap: token.market_cap,
              newMarketCap: updatedMarketCap
            });

            return {
              ...token,
              market_cap: updatedMarketCap,
              current_price: poolResponse.data?.currentPrice || 0,
              progress: poolResponse.data?.progress || 0,
              current_reserve: poolResponse.data?.currentReserve || 0,
            };
          } catch (tokenError) {
            console.error(`Error fetching pool info for ${token.ticker}:`, tokenError);
            return token; // Return original token data if pool info fetch fails
          }
        })
      );

      // Sort by market cap and create leaderboard entries
      const sortedTokens = tokensWithPoolInfo.sort((a, b) => b.market_cap - a.market_cap);
      const filteredTokens = sortedTokens.filter(token => token.market_cap > 0).slice(0, 10);

      console.log(`Created leaderboard with ${filteredTokens.length} migrated tokens`);

      return filteredTokens.map((token, index) => ({
        token: this.mapTokenFromDB(token),
        rank: index + 1, // Calculate rank based on market cap order
        battleWon: true, // All migrated tokens have won their battles
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      handleSupabaseError(error);
      return [];
    }
  }

  /**
   * Get battles by creator wallet
   */
  static async getBattlesByCreator(creatorWallet: string): Promise<Battle[]> {
    try {
      const { data: battles, error } = await supabase
        .from('battles')
        .select(`
          *,
          token1:tokens!battles_token1_id_fkey(*),
          token2:tokens!battles_token2_id_fkey(*)
        `)
        .eq('creator_wallet', creatorWallet)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!battles) return [];

      return battles.map(battle => this.mapBattleFromDB(battle));
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  }

  /**
   * Update battle volume
   */
  private static async updateBattleVolume(battleId: string, additionalVolume: number): Promise<void> {
    try {
      const { data: battle, error: fetchError } = await supabase
        .from('battles')
        .select('total_volume')
        .eq('id', battleId)
        .single();

      if (fetchError) throw fetchError;

      const newVolume = (battle?.total_volume || 0) + additionalVolume;

      const { error: updateError } = await supabase
        .from('battles')
        .update({ total_volume: newVolume })
        .eq('id', battleId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating battle volume:', error);
    }
  }

  /**
   * Map database battle row to Battle interface
   */
  private static mapBattleFromDB(battleRow: any): Battle {
    return {
      id: battleRow.id,
      token1: this.mapTokenFromDB(battleRow.token1),
      token2: this.mapTokenFromDB(battleRow.token2),
      duration: battleRow.duration,
      createdAt: new Date(battleRow.created_at),
      startTime: battleRow.start_time ? new Date(battleRow.start_time) : undefined,
      endTime: battleRow.end_time ? new Date(battleRow.end_time) : undefined,
      status: battleRow.status,
      winner: battleRow.winner_id,
    };
  }

  /**
   * Map database token row to Token interface
   */
  private static mapTokenFromDB(tokenRow: TokenRow): Token {
    return {
      id: tokenRow.id,
      ticker: tokenRow.ticker,
      name: tokenRow.name,
      logo: tokenRow.logo_url || undefined,
      contractAddress: tokenRow.contract_address || undefined,
      poolAddress: tokenRow.pool_address || undefined,
      twitter: tokenRow.twitter || undefined,
      telegram: tokenRow.telegram || undefined,
      website: tokenRow.website || undefined,
      marketCap: tokenRow.market_cap,
      volume: tokenRow.volume,
      migrated: tokenRow.migrated,
    };
  }
}

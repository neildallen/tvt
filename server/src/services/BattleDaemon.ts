import { createClient } from '@supabase/supabase-js';
import { BackendLaunchpadService } from './LaunchpadService';
import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

interface Battle {
  id: string;
  status: 'new' | 'about_to_bond' | 'bonded' | 'completed';
  duration: number;
  start_time?: string;
  end_time?: string;
  liquidity_pouring_completed?: boolean;
  liquidity_pouring_transactions: string;
  token1_id: string;
  token2_id: string;
  token1?: {
    id: string;
    ticker: string;
    name: string;
    contract_address: string;
    pool_address?: string;
    migrated: boolean;
  };
  token2?: {
    id: string;
    ticker: string;
    name: string;
    contract_address: string;
    pool_address?: string;
    migrated: boolean;
  };
}

export class BattleDaemon {
  private static instance: BattleDaemon;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly checkInterval = 60000; // Check every 1 minute
  private readonly batchSize = 3; // Process 3 battles at a time
  private readonly batchDelay = 2000; // 2 second delay between batches
  private launchpadService: BackendLaunchpadService;
  private supabase: any;

  private constructor() {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }

    console.log(`Connecting to Supabase at ${supabaseUrl} with key ${supabaseKey ? '***' : 'not set'}`);
    this.supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize Solana connection
    const rpcUrl = process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    this.launchpadService = new BackendLaunchpadService(connection);
    
    console.log(`⚔️  Battle Daemon configured: ${this.batchSize} battles per batch, ${this.batchDelay}ms delay between batches`);
  }

  public static getInstance(): BattleDaemon {
    if (!BattleDaemon.instance) {
      BattleDaemon.instance = new BattleDaemon();
    }
    return BattleDaemon.instance;
  }

  /**
   * Start the battle monitoring daemon
   */
  public start(): void {
    if (this.isRunning) {
      console.log('🔄 Battle daemon is already running');
      return;
    }

    console.log('🚀 Starting Battle Daemon...');
    console.log(`⏱️  Check interval: ${this.checkInterval / 1000} seconds`);
    
    this.isRunning = true;
    
    // Run initial check
    this.checkBattles().catch(error => {
      console.error('❌ Error in initial battle check:', error);
    });

    // Set up periodic checks
    this.intervalId = setInterval(async () => {
      try {
        await this.checkBattles();
      } catch (error) {
        console.error('❌ Error in battle daemon check:', error);
      }
    }, this.checkInterval);

    console.log('✅ Battle Daemon started successfully');
  }

  /**
   * Stop the battle monitoring daemon
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('⚠️  Battle daemon is not running');
      return;
    }

    console.log('🛑 Stopping Battle Daemon...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log('✅ Battle Daemon stopped');
  }

  /**
   * Get daemon status
   */
  public getStatus(): { 
    isRunning: boolean; 
    checkInterval: number; 
    batchSize: number;
    batchDelay: number;
    nextCheck?: Date 
  } {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      batchSize: this.batchSize,
      batchDelay: this.batchDelay,
      nextCheck: this.isRunning ? new Date(Date.now() + this.checkInterval) : undefined
    };
  }

  /**
   * Main method to check all battles and update their status
   */
  private async checkBattles(): Promise<void> {
    try {
      console.log('🔍 Checking battles for status updates...');
      
      // Get all battles that are not yet completed
      const { data: battles, error } = await this.supabase
        .from('battles')
        .select(`
          *,
          token1:tokens!battles_token1_id_fkey(*),
          token2:tokens!battles_token2_id_fkey(*)
        `)
        .in('status', ['new', 'about_to_bond', 'bonded'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching battles:', error);
        return;
      }

      if (!battles || battles.length === 0) {
        console.log('📭 No active battles to check');
        return;
      }

      console.log(`📊 Found ${battles.length} active battles to check`);

      // Process battles in batches to avoid rate limits
      await this.processBattlesInBatches(battles as Battle[]);

      console.log('✅ Battle check completed');
    } catch (error) {
      console.error('❌ Error in checkBattles:', error);
    }
  }

  /**
   * Process battles in batches with delays to avoid rate limits
   */
  private async processBattlesInBatches(battles: Battle[]): Promise<void> {
    const totalBatches = Math.ceil(battles.length / this.batchSize);
    
    for (let i = 0; i < battles.length; i += this.batchSize) {
      const batch = battles.slice(i, i + this.batchSize);
      const currentBatchNumber = Math.floor(i / this.batchSize) + 1;
      
      console.log(`🔄 Processing batch ${currentBatchNumber}/${totalBatches} (${batch.length} battles)`);
      
      // Process battles in current batch concurrently
      const batchPromises = batch.map(battle => this.processBattle(battle));
      await Promise.allSettled(batchPromises);
      
      // Add delay between batches (except for the last batch)
      if (i + this.batchSize < battles.length) {
        console.log(`⏳ Waiting ${this.batchDelay}ms before next batch...`);
        await this.delay(this.batchDelay);
      }
    }
  }

  /**
   * Utility method to create delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Process individual battle to check if it should start or end
   */
  private async processBattle(battle: Battle): Promise<void> {
    try {
      let needsUpdate = false;
      const updates: any = {};

      // Check battle progression based on token bonding progress
      if (battle.status === 'new' || battle.status === 'about_to_bond' || battle.status === 'bonded') {
        const progressCheck = await this.checkBattleProgress(battle);
        
        if (progressCheck.shouldUpdateStatus) {
          console.log(`🎉 Updating battle ${battle.id} status to: ${progressCheck.newStatus}`);
          
          updates.status = progressCheck.newStatus;
          needsUpdate = true;

          // If battle is starting (moving to bonded), set start and end times
          if (progressCheck.newStatus === 'bonded') {
            const now = new Date();
            const endTime = new Date(now.getTime() + (battle.duration * 60 * 60 * 1000));
            
            updates.start_time = now.toISOString();
            updates.end_time = endTime.toISOString();
            
            // Update token migration status
            await this.updateTokenMigrationStatus(battle.token1_id, true);
            await this.updateTokenMigrationStatus(battle.token2_id, true);
            
            console.log(`⏰ Battle ${battle.id} will end at: ${endTime.toISOString()}`);
          }
        }
      }

      // Check if bonded battle should end
      if (battle.status === 'bonded' && battle.end_time && !battle.liquidity_pouring_completed) {
        const endTime = new Date(battle.end_time);
        const now = new Date();
        
        console.log("=========== Ending Battle Check!!! ==================")
        if (now >= endTime) {
          console.log(`🏁 Ending battle ${battle.id}: Time limit reached`);
          
          updates.status = 'completed';
          needsUpdate = true;

          // Determine winner based on market cap
          const winner = await this.determineWinner(battle);
          if (winner) {
            updates.winner_id = winner;
            console.log(`🏆 Battle ${battle.id} winner: ${winner}`);
            
            // Execute liquidity pouring process
            await this.executeLiquidityPouringForBattle(battle, winner);
          }
        }
      }

      // Apply updates if needed
      if (needsUpdate) {
        const { error: updateError } = await this.supabase
          .from('battles')
          .update(updates)
          .eq('id', battle.id);

        if (updateError) {
          console.error(`❌ Error updating battle ${battle.id}:`, updateError, updates);
        } else {
          console.log(`✅ Updated battle ${battle.id} status to: ${updates.status}`);
        }
      }

    } catch (error) {
      console.error(`❌ Error processing battle ${battle.id}:`, error);
    }
  }

  /**
   * Check battle progress and determine if status should be updated
   */
  private async checkBattleProgress(battle: Battle): Promise<{
    shouldUpdateStatus: boolean;
    newStatus?: 'about_to_bond' | 'bonded';
  }> {
    try {
      if (!battle.token1?.pool_address || !battle.token2?.pool_address) {
        console.log(`⚠️  Battle ${battle.id}: Missing pool addresses`);
        return { shouldUpdateStatus: false };
      }

      // Add small delay before checking progress to avoid overwhelming RPC
      await this.delay(500);

      // Check token1 bonding progress and migration status
      const token1Info = await this.getTokenInfoAndUpdatePool(
        battle.token1_id,
        battle.token1.contract_address,
        battle.token1.pool_address,
        battle.token1.name,
        battle.token1.ticker,
        battle.token1.migrated
      );

      // Small delay between token checks
      await this.delay(300);

      // Check token2 bonding progress and migration status
      const token2Info = await this.getTokenInfoAndUpdatePool(
        battle.token2_id,
        battle.token2.contract_address,
        battle.token2.pool_address,
        battle.token2.name,
        battle.token2.ticker,
        battle.token2.migrated
      );

      if (!token1Info || !token2Info) {
        console.log(`❌ Could not fetch token info for battle ${battle.id}`);
        return { shouldUpdateStatus: false };
      }

      // Check migration status and progress
      const token1Ready = token1Info.isMigrated || battle.token1.migrated;
      const token2Ready = token2Info.isMigrated || battle.token2.migrated;
      const token1Progress = token1Info.progress;
      const token2Progress = token2Info.progress;

      console.log(`📊 Battle ${battle.id} status: ${battle.token1.ticker}=${token1Progress.toFixed(1)}% (${token1Ready ? 'DAMM2 Ready' : 'Waiting for DAMM2'}), ${battle.token2.ticker}=${token2Progress.toFixed(1)}% (${token2Ready ? 'DAMM2 Ready' : 'Waiting for DAMM2'})`);

      // Determine status transitions
      if (battle.status === 'new' || battle.status === 'about_to_bond') {
        let res:any = { shouldUpdateStatus: false };
        // Transition from 'new' to 'about_to_bond' when both tokens >= 90%
        if (token1Progress >= 90 && token2Progress >= 90) {
          console.log(`🚀 Battle ${battle.id}: Both tokens reached 90%+ progress, moving to about_to_bond`);
          res = { shouldUpdateStatus: true, newStatus: 'about_to_bond' };
        }
      
        // Transition from 'about_to_bond' to 'bonded' when both tokens are migrated to DAMM V2
        if (token1Ready && token2Ready) {
          console.log(`🎉 Battle ${battle.id}: Both tokens migrated to DAMM V2, starting battle`);
          res = { shouldUpdateStatus: true, newStatus: 'bonded' };
        }

        return res;
      }

      return { shouldUpdateStatus: false };
    } catch (error) {
      console.error(`❌ Error checking battle progress for battle ${battle.id}:`, error);
      return { shouldUpdateStatus: false };
    }
  }

  /**
   * Get token info and update pool address if migrated to DAMM V2
   */
  private async getTokenInfoAndUpdatePool(tokenId: string, mint: string, poolAddress: string, tokenName: string, tokenSymbol: string, migrated?: boolean): Promise<any> {
    try {
      const poolInfo = await this.launchpadService.getPoolInfo(mint, poolAddress, tokenName, tokenSymbol, migrated);
      // console.log(" ===== poolInfo ===== ", poolInfo);
      
      if (!poolInfo) {
        return null;
      }

      // Check if token has migrated to DAMM V2 and we have the new pool address, update it
      if (poolInfo.isMigrated && poolInfo.dammV2PoolAddress && poolInfo.dammV2PoolAddress !== poolAddress) {
        console.log(`🔄 Updating pool address for ${tokenSymbol} from ${poolAddress} to ${poolInfo.dammV2PoolAddress}`);
        
        await this.updateTokenPoolAddress(tokenId, poolInfo.dammV2PoolAddress);
        
        // Update the poolInfo to reflect the new address
        poolInfo.address = poolInfo.dammV2PoolAddress;
      }
      // If token progress >= 100% but no DAMM V2 address found, try to find it
      else if (poolInfo.progress >= 100 && !poolInfo.isMigrated && poolInfo.baseMint) {
        console.log(`🔍 Token ${tokenSymbol} at 100%+ progress, searching for DAMM V2 pool...`);
        
        const dammV2Address = await this.launchpadService.findDammV2PoolAddress(poolInfo.baseMint);
        if (dammV2Address) {
          console.log(`🔄 Found and updating DAMM V2 pool for ${tokenSymbol}: ${dammV2Address}`);
          
          await this.updateTokenPoolAddress(tokenId, dammV2Address);
          
          // Update poolInfo to reflect migration
          poolInfo.isMigrated = true;
          poolInfo.dammV2PoolAddress = dammV2Address;
          poolInfo.address = dammV2Address;
        }
      }

      return poolInfo;
    } catch (error: any) {
      console.error(`❌ Error fetching token info for ${tokenSymbol}:`, error?.message);
      return null;
    }
  }

  /**
   * Update token pool address in database
   */
  private async updateTokenPoolAddress(tokenId: string, newPoolAddress: string): Promise<void> {
    try {
      if (!tokenId || !newPoolAddress) {
        console.error(`❌ Invalid parameters for updating token pool address: tokenId=${tokenId}, newPoolAddress=${newPoolAddress}`);
        return;
      }

      console.log(`🔄 Attempting to update token ${tokenId} pool address to ${newPoolAddress}`);

      const { error } = await this.supabase
        .from('tokens')
        .update({ pool_address: newPoolAddress, migrated: true })
        .eq('id', tokenId);

      if (error) {
        console.error(`❌ Error updating token ${tokenId} pool address:`, error);
        console.error(`❌ Parameters: tokenId=${tokenId}, newPoolAddress=${newPoolAddress}`);
        
        // Check for specific error codes
        if (error.code === '21000') {
          console.error(`❌ Error 21000 in token pool update - this may indicate a database trigger or RLS policy issue`);
        }
      } else {
        console.log(`✅ Updated token ${tokenId} pool address to: ${newPoolAddress}`);
      }
    } catch (error) {
      console.error(`❌ Error updating token pool address:`, error);
    }
  }

  /**
   * Update token migration status in database
   */
  private async updateTokenMigrationStatus(tokenId: string, migrated: boolean): Promise<void> {
    try {
      if (!tokenId) {
        console.error(`❌ Invalid tokenId for updating migration status: ${tokenId}`);
        return;
      }

      console.log(`🔄 Attempting to update token ${tokenId} migration status to ${migrated}`);

      const { error } = await this.supabase
        .from('tokens')
        .update({ migrated })
        .eq('id', tokenId);

      if (error) {
        console.error(`❌ Error updating token ${tokenId} migration status:`, error);
        console.error(`❌ Parameters: tokenId=${tokenId}, migrated=${migrated}`);
        
        // Check for specific error codes
        if (error.code === '21000') {
          console.error(`❌ Error 21000 in token migration update - this may indicate a database trigger or RLS policy issue`);
        }
      } else {
        console.log(`✅ Updated token ${tokenId} migration status to: ${migrated}`);
      }
    } catch (error) {
      console.error(`❌ Error updating token migration status:`, error);
    }
  }

  /**
   * Determine winner of a battle based on market cap
   */
  private async determineWinner(battle: Battle): Promise<string | null> {
    try {
      if (!battle.token1?.pool_address || !battle.token2?.pool_address) {
        return null;
      }

      // Add delay before fetching final market caps
      await this.delay(500);

      // Get final market caps (using current pool addresses which may have been updated)
      const token1Info = await this.getTokenInfoAndUpdatePool(
        battle.token1_id,
        battle.token1.contract_address,
        battle.token1.pool_address,
        battle.token1.name,
        battle.token1.ticker,
        battle.token1.migrated
      );

      // Small delay between token info fetches
      await this.delay(300);

      const token2Info = await this.getTokenInfoAndUpdatePool(
        battle.token2_id,
        battle.token2.contract_address,
        battle.token2.pool_address,
        battle.token2.name,
        battle.token2.ticker,
        battle.token2.migrated
      );

      if (!token1Info || !token2Info) {
        return null;
      }

      console.log(`🏆 Final market caps - ${battle.token1.ticker}: $${token1Info.marketCap.toFixed(2)}, ${battle.token2.ticker}: $${token2Info.marketCap.toFixed(2)}`);

      // Return the token with higher market cap
      return token1Info.marketCap > token2Info.marketCap ? battle.token1_id : battle.token2_id;
    } catch (error:any) {
      console.error(`❌ Error determining winner for battle ${battle.id}:`, error?.message);
      return null;
    }
  }

  /**
   * Execute liquidity pouring process for completed battle
   */
  private async executeLiquidityPouringForBattle(battle: Battle, winnerId: string): Promise<void> {
    try {
      console.log(`💰 Starting liquidity pouring for completed battle ${battle.id}`);
      
      // Determine loser token
      const loserId = winnerId === battle.token1_id ? battle.token2_id : battle.token1_id;
      const loserToken = winnerId === battle.token1_id ? battle.token2 : battle.token1;
      const winnerToken = winnerId === battle.token1_id ? battle.token1 : battle.token2;
      
      if (!loserToken?.pool_address || !winnerToken?.pool_address) {
        console.error(`❌ Missing pool addresses for liquidity pouring in battle ${battle.id}`);
        return;
      }

      // Get main token pool address from environment or use a default
      const mainTokenPoolAddress = process.env.MAIN_TOKEN_POOL_ADDRESS;
      if (!mainTokenPoolAddress) {
        console.error(`❌ MAIN_TOKEN_POOL_ADDRESS not configured in environment variables`);
        console.log(`⚠️  Skipping liquidity pouring for battle ${battle.id} - please configure MAIN_TOKEN_POOL_ADDRESS`);
        return;
      }

      console.log(`🔄 Pouring liquidity from loser ${loserToken.ticker} (${loserId}) to winner ${winnerToken.ticker} (${winnerId})`);
      console.log(`📊 Pool addresses - Loser: ${loserToken.pool_address}, Winner: ${winnerToken.pool_address}, Main: ${mainTokenPoolAddress}`);

      // Execute the liquidity pouring
      const result = await this.launchpadService.executeLiquidityPouring(
        loserId,
        loserToken.pool_address,
        winnerId,
        winnerToken.pool_address,
        mainTokenPoolAddress
      );

      if (result.success) {
        console.log(`✅ Liquidity pouring completed for battle ${battle.id}`);
        console.log(`💰 Distribution: Main=${result.details.mainTokenTransfer}, Backend=${result.details.backendWalletTransfer}, Winner=${result.details.winnerTokenTransfer}`);
        console.log(`📋 Transactions: ${result.txIds.join(', ')}`);
        
        // Update battle with liquidity pouring info
        await this.updateBattleLiquidityInfo(battle.id, result);
      } else {
        console.error(`❌ Backend position-based liquidity pouring failed for battle ${battle.id}`);
      }

    } catch (error: any) {
      console.error(`❌ Error executing liquidity pouring for battle ${battle.id}:`, error?.message);
    }
  }

  /**
   * Update battle with liquidity pouring transaction info
   */
  private async updateBattleLiquidityInfo(battleId: string, pouringResult: any): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('battles')
        .update({ 
          liquidity_pouring_completed: true,
          liquidity_pouring_transactions: pouringResult.txIds,
          liquidity_distribution: pouringResult.details
        })
        .eq('id', battleId);

      if (error) {
        console.error(`❌ Error updating battle ${battleId} liquidity info:`, error);
      } else {
        console.log(`✅ Updated battle ${battleId} with liquidity pouring info`);
      }
    } catch (error) {
      console.error(`❌ Error updating battle liquidity info:`, error);
    }
  }

  /**
   * Force check all battles (manual trigger)
   */
  public async forceCheck(): Promise<void> {
    console.log('🔄 Force checking all battles...');
    await this.checkBattles();
  }
}

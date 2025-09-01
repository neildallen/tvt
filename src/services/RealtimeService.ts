import { supabase } from '../lib/supabase';
import { Battle, Token } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

export class RealtimeService {
  private static channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to battle updates
   */
  static subscribeToBattles(
    onBattleUpdate: (battle: Battle) => void,
    onBattleInsert: (battle: Battle) => void,
    onBattleDelete: (battleId: string) => void
  ): () => void {
    const channel = supabase
      .channel('battles_channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'battles',
        },
        (payload) => {
          console.log('Battle updated:', payload);
          // You would need to fetch the full battle data with related tokens
          // onBattleUpdate(transformedBattle);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'battles',
        },
        (payload) => {
          console.log('Battle created:', payload);
          // You would need to fetch the full battle data with related tokens
          // onBattleInsert(transformedBattle);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'battles',
        },
        (payload) => {
          console.log('Battle deleted:', payload);
          if (payload.old?.id) {
            onBattleDelete(payload.old.id);
          }
        }
      )
      .subscribe();

    this.channels.set('battles', channel);

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
      this.channels.delete('battles');
    };
  }

  /**
   * Subscribe to token updates
   */
  static subscribeToTokens(
    onTokenUpdate: (token: Token) => void
  ): () => void {
    const channel = supabase
      .channel('tokens_channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tokens',
        },
        (payload) => {
          console.log('Token updated:', payload);
          if (payload.new) {
            const token = this.mapTokenFromDB(payload.new as any);
            onTokenUpdate(token);
          }
        }
      )
      .subscribe();

    this.channels.set('tokens', channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete('tokens');
    };
  }

  /**
   * Subscribe to battle votes
   */
  static subscribeToBattleVotes(
    battleId: string,
    onVoteUpdate: (vote: any) => void
  ): () => void {
    const channelName = `battle_votes_${battleId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'battle_votes',
          filter: `battle_id=eq.${battleId}`,
        },
        (payload) => {
          console.log('New vote:', payload);
          if (payload.new) {
            onVoteUpdate(payload.new);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Subscribe to leaderboard updates
   */
  static subscribeToLeaderboard(
    onLeaderboardUpdate: () => void
  ): () => void {
    const channel = supabase
      .channel('leaderboard_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboard',
        },
        (payload) => {
          console.log('Leaderboard updated:', payload);
          onLeaderboardUpdate();
        }
      )
      .subscribe();

    this.channels.set('leaderboard', channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete('leaderboard');
    };
  }

  /**
   * Unsubscribe from all channels
   */
  static unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }

  /**
   * Map database token to Token interface
   */
  private static mapTokenFromDB(tokenRow: any): Token {
    return {
      id: tokenRow.id,
      ticker: tokenRow.ticker,
      name: tokenRow.name,
      logo: tokenRow.logo_url || undefined,
      contractAddress: tokenRow.contract_address || undefined,
      twitter: tokenRow.twitter || undefined,
      telegram: tokenRow.telegram || undefined,
      website: tokenRow.website || undefined,
      marketCap: tokenRow.market_cap,
      volume: tokenRow.volume,
      migrated: tokenRow.migrated,
    };
  }
}

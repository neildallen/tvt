import { supabase, handleSupabaseError } from '../lib/supabase';
import { Database } from '../types/database';

type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export interface UserProfile {
  id: string;
  walletAddress: string;
  username?: string;
  avatarUrl?: string;
  totalBattlesCreated: number;
  totalVotesCast: number;
  totalVolumeTraded: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  /**
   * Get or create user profile
   */
  static async getOrCreateUserProfile(walletAddress: string): Promise<UserProfile> {
    try {
      // First, try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (existingProfile && !fetchError) {
        return this.mapUserProfileFromDB(existingProfile);
      }

      // If profile doesn't exist, create it
      const newProfile: UserProfileInsert = {
        wallet_address: walletAddress,
        total_battles_created: 0,
        total_votes_cast: 0,
        total_volume_traded: 0,
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single();

      if (createError) throw createError;
      if (!createdProfile) throw new Error('Failed to create user profile');

      return this.mapUserProfileFromDB(createdProfile);
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    walletAddress: string,
    updates: {
      username?: string;
      avatarUrl?: string;
    }
  ): Promise<UserProfile> {
    try {
      const updateData: UserProfileUpdate = {
        updated_at: new Date().toISOString(),
      };

      if (updates.username !== undefined) updateData.username = updates.username;
      if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;

      const { data: updatedProfile, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('wallet_address', walletAddress)
        .select()
        .single();

      if (error) throw error;
      if (!updatedProfile) throw new Error('Failed to update user profile');

      return this.mapUserProfileFromDB(updatedProfile);
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Increment battle created count
   */
  static async incrementBattlesCreated(walletAddress: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_battles_created', {
        wallet_addr: walletAddress
      });

      if (error) {
        // Fallback to manual increment if RPC doesn't exist
        const profile = await this.getOrCreateUserProfile(walletAddress);
        await supabase
          .from('user_profiles')
          .update({
            total_battles_created: profile.totalBattlesCreated + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('wallet_address', walletAddress);
      }
    } catch (error) {
      console.error('Error incrementing battles created:', error);
    }
  }

  /**
   * Increment votes cast count
   */
  static async incrementVotesCast(walletAddress: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_votes_cast', {
        wallet_addr: walletAddress
      });

      if (error) {
        // Fallback to manual increment if RPC doesn't exist
        const profile = await this.getOrCreateUserProfile(walletAddress);
        await supabase
          .from('user_profiles')
          .update({
            total_votes_cast: profile.totalVotesCast + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('wallet_address', walletAddress);
      }
    } catch (error) {
      console.error('Error incrementing votes cast:', error);
    }
  }

  /**
   * Add to total volume traded
   */
  static async addVolumeTraded(walletAddress: string, amount: number): Promise<void> {
    try {
      const { error } = await supabase.rpc('add_volume_traded', {
        wallet_addr: walletAddress,
        volume_amount: amount
      });

      if (error) {
        // Fallback to manual increment if RPC doesn't exist
        const profile = await this.getOrCreateUserProfile(walletAddress);
        await supabase
          .from('user_profiles')
          .update({
            total_volume_traded: profile.totalVolumeTraded + amount,
            updated_at: new Date().toISOString(),
          })
          .eq('wallet_address', walletAddress);
      }
    } catch (error) {
      console.error('Error adding volume traded:', error);
    }
  }

  /**
   * Get top users by various metrics
   */
  static async getTopUsers(
    metric: 'battles_created' | 'votes_cast' | 'volume_traded',
    limit: number = 10
  ): Promise<UserProfile[]> {
    try {
      const columnMap = {
        battles_created: 'total_battles_created',
        votes_cast: 'total_votes_cast',
        volume_traded: 'total_volume_traded',
      };

      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order(columnMap[metric], { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!users) return [];

      return users.map(user => this.mapUserProfileFromDB(user));
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  }

  /**
   * Search users by username
   */
  static async searchUsers(query: string, limit: number = 20): Promise<UserProfile[]> {
    try {
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .limit(limit);

      if (error) throw error;
      if (!users) return [];

      return users.map(user => this.mapUserProfileFromDB(user));
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  }

  /**
   * Map database user profile row to UserProfile interface
   */
  private static mapUserProfileFromDB(userRow: UserProfileRow): UserProfile {
    return {
      id: userRow.id,
      walletAddress: userRow.wallet_address,
      username: userRow.username || undefined,
      avatarUrl: userRow.avatar_url || undefined,
      totalBattlesCreated: userRow.total_battles_created,
      totalVotesCast: userRow.total_votes_cast,
      totalVolumeTraded: userRow.total_volume_traded,
      createdAt: new Date(userRow.created_at),
      updatedAt: new Date(userRow.updated_at),
    };
  }
}

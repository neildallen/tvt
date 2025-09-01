export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      battles: {
        Row: {
          id: string
          token1_id: string
          token2_id: string
          duration: number
          created_at: string
          start_time: string | null
          end_time: string | null
          status: 'new' | 'about_to_bond' | 'bonded' | 'completed'
          winner_id: string | null
          creator_wallet: string
          total_volume: number
          description: string | null
        }
        Insert: {
          id?: string
          token1_id: string
          token2_id: string
          duration: number
          created_at?: string
          start_time?: string | null
          end_time?: string | null
          status?: 'new' | 'about_to_bond' | 'bonded' | 'completed'
          winner_id?: string | null
          creator_wallet: string
          total_volume?: number
          description?: string | null
        }
        Update: {
          id?: string
          token1_id?: string
          token2_id?: string
          duration?: number
          created_at?: string
          start_time?: string | null
          end_time?: string | null
          status?: 'new' | 'about_to_bond' | 'bonded' | 'completed'
          winner_id?: string | null
          creator_wallet?: string
          total_volume?: number
          description?: string | null
        }
      }
      tokens: {
        Row: {
          id: string
          ticker: string
          name: string
          logo_url: string | null
          contract_address: string
          twitter: string | null
          telegram: string | null
          website: string | null
          market_cap: number
          volume: number
          migrated: boolean
          created_at: string
          creator_wallet: string
          pool_address: string | null
          metadata_uri: string | null
          description: string | null
        }
        Insert: {
          id?: string
          ticker: string
          name: string
          logo_url?: string | null
          contract_address: string
          twitter?: string | null
          telegram?: string | null
          website?: string | null
          market_cap?: number
          volume?: number
          migrated?: boolean
          created_at?: string
          creator_wallet: string
          pool_address?: string | null
          metadata_uri?: string | null
          description?: string | null
        }
        Update: {
          id?: string
          ticker?: string
          name?: string
          logo_url?: string | null
          contract_address?: string
          twitter?: string | null
          telegram?: string | null
          website?: string | null
          market_cap?: number
          volume?: number
          migrated?: boolean
          created_at?: string
          creator_wallet?: string
          pool_address?: string | null
          metadata_uri?: string | null
          description?: string | null
        }
      }
      battle_votes: {
        Row: {
          id: string
          battle_id: string
          token_id: string
          voter_wallet: string
          amount: number
          transaction_hash: string
          created_at: string
        }
        Insert: {
          id?: string
          battle_id: string
          token_id: string
          voter_wallet: string
          amount: number
          transaction_hash: string
          created_at?: string
        }
        Update: {
          id?: string
          battle_id?: string
          token_id?: string
          voter_wallet?: string
          amount?: number
          transaction_hash?: string
          created_at?: string
        }
      }
      leaderboard: {
        Row: {
          id: string
          token_id: string
          rank: number
          battles_won: number
          total_battles: number
          total_volume: number
          win_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          token_id: string
          rank: number
          battles_won?: number
          total_battles?: number
          total_volume?: number
          win_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          token_id?: string
          rank?: number
          battles_won?: number
          total_battles?: number
          total_volume?: number
          win_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          wallet_address: string
          username: string | null
          avatar_url: string | null
          total_battles_created: number
          total_votes_cast: number
          total_volume_traded: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          username?: string | null
          avatar_url?: string | null
          total_battles_created?: number
          total_votes_cast?: number
          total_volume_traded?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          username?: string | null
          avatar_url?: string | null
          total_battles_created?: number
          total_votes_cast?: number
          total_volume_traded?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      battle_status: 'new' | 'about_to_bond' | 'bonded' | 'completed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

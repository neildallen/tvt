-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
CREATE TYPE battle_status AS ENUM ('new', 'about_to_bond', 'bonded', 'completed');

-- Tokens table
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticker VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  logo_url TEXT,
  contract_address VARCHAR(100),
  twitter VARCHAR(100),
  telegram VARCHAR(100),
  website VARCHAR(200),
  market_cap BIGINT DEFAULT 0,
  volume BIGINT DEFAULT 0,
  migrated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  creator_wallet VARCHAR(100) NOT NULL,
  pool_address VARCHAR(100),
  metadata_uri TEXT,
  description TEXT,
  
  -- Indexes
  CONSTRAINT tokens_ticker_key UNIQUE (ticker),
  CONSTRAINT tokens_contract_address_key UNIQUE (contract_address)
);

-- Battles table
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token1_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  token2_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL, -- Duration in hours
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status battle_status DEFAULT 'new',
  winner_id UUID REFERENCES tokens(id),
  creator_wallet VARCHAR(100) NOT NULL,
  total_volume BIGINT DEFAULT 0,
  description TEXT,
  liquidity_pouring_completed BOOLEAN DEFAULT FALSE,
  liquidity_pouring_transactions TEXT,
  liquidity_distribution JSON
);

-- Battle votes (trades/votes within battles)
CREATE TABLE battle_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  voter_wallet VARCHAR(100) NOT NULL,
  amount BIGINT NOT NULL, -- Amount in smallest unit (e.g., lamports for SOL)
  transaction_hash VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate votes for same transaction
  CONSTRAINT battle_votes_transaction_hash_key UNIQUE (transaction_hash)
);

-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(100) NOT NULL UNIQUE,
  username VARCHAR(50),
  avatar_url TEXT,
  total_battles_created INTEGER DEFAULT 0,
  total_votes_cast INTEGER DEFAULT 0,
  total_volume_traded BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard (calculated/cached data)
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  battles_won INTEGER DEFAULT 0,
  total_battles INTEGER DEFAULT 0,
  total_volume BIGINT DEFAULT 0,
  win_percentage DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique ranking
  CONSTRAINT leaderboard_rank_key UNIQUE (rank),
  CONSTRAINT leaderboard_token_id_key UNIQUE (token_id)
);

-- Indexes for better performance
CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_battles_creator_wallet ON battles(creator_wallet);
CREATE INDEX idx_battles_created_at ON battles(created_at DESC);
CREATE INDEX idx_battle_votes_battle_id ON battle_votes(battle_id);
CREATE INDEX idx_battle_votes_token_id ON battle_votes(token_id);
CREATE INDEX idx_battle_votes_voter_wallet ON battle_votes(voter_wallet);
CREATE INDEX idx_tokens_creator_wallet ON tokens(creator_wallet);
CREATE INDEX idx_tokens_market_cap ON tokens(market_cap DESC);
CREATE INDEX idx_tokens_volume ON tokens(volume DESC);
CREATE INDEX idx_user_profiles_wallet_address ON user_profiles(wallet_address);
CREATE INDEX idx_leaderboard_rank ON leaderboard(rank);

-- Row Level Security (RLS) Policies
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access for all users" ON tokens FOR SELECT USING (true);
CREATE POLICY "Allow read access for all users" ON battles FOR SELECT USING (true);
CREATE POLICY "Allow read access for all users" ON battle_votes FOR SELECT USING (true);
CREATE POLICY "Allow read access for all users" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Allow read access for all users" ON leaderboard FOR SELECT USING (true);

-- Allow insert for authenticated users
CREATE POLICY "Allow insert for authenticated users" ON tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated users" ON battles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated users" ON battle_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated users" ON user_profiles FOR INSERT WITH CHECK (true);

-- Allow update for creators/owners
CREATE POLICY "Allow update for token creators" ON tokens FOR UPDATE USING (true);
CREATE POLICY "Allow update for battle creators" ON battles FOR UPDATE USING (true);
CREATE POLICY "Allow update for profile owners" ON user_profiles FOR UPDATE USING (true);
CREATE POLICY "Allow update for leaderboard" ON leaderboard FOR ALL USING (true);

-- Functions for updating user statistics
CREATE OR REPLACE FUNCTION increment_battles_created(wallet_addr VARCHAR)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_profiles (wallet_address, total_battles_created, updated_at)
  VALUES (wallet_addr, 1, NOW())
  ON CONFLICT (wallet_address)
  DO UPDATE SET 
    total_battles_created = user_profiles.total_battles_created + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_votes_cast(wallet_addr VARCHAR)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_profiles (wallet_address, total_votes_cast, updated_at)
  VALUES (wallet_addr, 1, NOW())
  ON CONFLICT (wallet_address)
  DO UPDATE SET 
    total_votes_cast = user_profiles.total_votes_cast + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_volume_traded(wallet_addr VARCHAR, volume_amount BIGINT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_profiles (wallet_address, total_volume_traded, updated_at)
  VALUES (wallet_addr, volume_amount, NOW())
  ON CONFLICT (wallet_address)
  DO UPDATE SET 
    total_volume_traded = user_profiles.total_volume_traded + volume_amount,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS VOID AS $$
BEGIN
  -- Clear existing leaderboard
  DELETE FROM leaderboard;
  
  -- Insert new rankings based on market cap and battle wins
  INSERT INTO leaderboard (token_id, rank, battles_won, total_battles, total_volume, win_percentage)
  SELECT 
    t.id,
    ROW_NUMBER() OVER (ORDER BY t.market_cap DESC, battle_stats.battles_won DESC) as rank,
    COALESCE(battle_stats.battles_won, 0) as battles_won,
    COALESCE(battle_stats.total_battles, 0) as total_battles,
    t.volume as total_volume,
    CASE 
      WHEN COALESCE(battle_stats.total_battles, 0) > 0 
      THEN (COALESCE(battle_stats.battles_won, 0)::DECIMAL / battle_stats.total_battles * 100)
      ELSE 0 
    END as win_percentage
  FROM tokens t
  LEFT JOIN (
    SELECT 
      t.id,
      COUNT(CASE WHEN b.winner_id = t.id THEN 1 END) as battles_won,
      COUNT(CASE WHEN (b.token1_id = t.id OR b.token2_id = t.id) AND b.status = 'completed' THEN 1 END) as total_battles
    FROM tokens t
    LEFT JOIN battles b ON (b.token1_id = t.id OR b.token2_id = t.id)
    GROUP BY t.id
  ) battle_stats ON battle_stats.id = t.id
  WHERE t.migrated = true;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update leaderboard when battles are completed
CREATE OR REPLACE FUNCTION trigger_update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'completed' AND OLD.status != 'completed') THEN
    PERFORM update_leaderboard();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leaderboard_on_battle_completion
  AFTER UPDATE ON battles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_leaderboard();

-- Insert some demo data
INSERT INTO tokens (ticker, name, contract_address, creator_wallet, market_cap, volume, migrated, twitter) VALUES
('JULY', 'JULY Token', 'ABC123DEF456GHI789', 'demo-wallet-1', 15800000, 2300000, true, '@july_token'),
('JUNE', 'JUNE Token', 'DEF456GHI789ABC123', 'demo-wallet-2', 12400000, 1800000, true, '@june_token'),
('SPRING', 'Spring Token', 'GHI789ABC123DEF456', 'demo-wallet-3', 8900000, 1200000, true, '@spring_token'),
('WINTER', 'Winter Token', 'JKL012MNO345PQR678', 'demo-wallet-4', 6700000, 980000, true, '@winter_token'),
('AUTUMN', 'Autumn Token', 'STU901VWX234YZA567', 'demo-wallet-5', 4500000, 670000, true, '@autumn_token');

-- Insert demo battles
INSERT INTO battles (token1_id, token2_id, duration, creator_wallet, status, winner_id) 
SELECT 
  t1.id, 
  t2.id, 
  12, 
  'demo-wallet-1', 
  'completed',
  t1.id
FROM tokens t1, tokens t2 
WHERE t1.ticker = 'JULY' AND t2.ticker = 'JUNE';

-- Initialize leaderboard
SELECT update_leaderboard();

-- Drop the unique constraint on contract_address since it can be empty initially
ALTER TABLE tokens DROP CONSTRAINT IF EXISTS tokens_contract_address_key;

-- Add a unique constraint only for non-null, non-empty contract addresses
CREATE UNIQUE INDEX tokens_contract_address_unique_idx ON tokens (contract_address) 
WHERE contract_address IS NOT NULL AND contract_address != '';

-- Make contract_address nullable
ALTER TABLE tokens ALTER COLUMN contract_address DROP NOT NULL;

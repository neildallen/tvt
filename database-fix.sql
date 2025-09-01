-- Fix for contract address unique constraint issue
-- Run this in your Supabase SQL Editor

-- Drop the unique constraint on contract_address since it can be empty initially
ALTER TABLE tokens DROP CONSTRAINT IF EXISTS tokens_contract_address_key;

-- Add a unique constraint only for non-null, non-empty contract addresses
CREATE UNIQUE INDEX tokens_contract_address_unique_idx ON tokens (contract_address) 
WHERE contract_address IS NOT NULL AND contract_address != '';

-- Make contract_address nullable
ALTER TABLE tokens ALTER COLUMN contract_address DROP NOT NULL;

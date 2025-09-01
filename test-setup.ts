#!/usr/bin/env node
/**
 * Simple test script to verify the backend setup
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { BackendLaunchpadService } from './src/services/LaunchpadService';
import dotenv from 'dotenv';

dotenv.config();

async function testSetup() {
  console.log('🧪 Testing TvT Launchpad Backend Setup...\n');

  try {
    // Test 1: Environment variables
    console.log('1️⃣ Checking environment variables...');
    const requiredEnvVars = ['SOLANA_RPC_ENDPOINT', 'PLATFORM_CONFIG'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('❌ Missing environment variables:', missingVars);
      return;
    }
    console.log('✅ Environment variables OK');

    // Test 2: Solana connection
    console.log('\n2️⃣ Testing Solana connection...');
    const connection = new Connection(process.env.SOLANA_RPC_ENDPOINT!, 'confirmed');
    const slot = await connection.getSlot();
    console.log(`✅ Connected to Solana (slot: ${slot})`);

    // Test 3: Platform config
    console.log('\n3️⃣ Validating platform config...');
    const configAddress = new PublicKey(process.env.PLATFORM_CONFIG!);
    console.log(`✅ Platform config address: ${configAddress.toString()}`);

    // Test 4: Wallet loading
    console.log('\n4️⃣ Testing wallet loading...');
    const launchpadService = new BackendLaunchpadService(connection);
    const walletPublicKey = launchpadService.getWalletPublicKey();
    const balance = await launchpadService.getWalletBalance();
    
    console.log(`✅ Wallet loaded: ${walletPublicKey}`);
    console.log(`💰 Balance: ${balance.toFixed(4)} SOL`);

    if (balance < 0.1) {
      console.log('⚠️  Warning: Low balance. You may need more SOL for transactions.');
    }

    console.log('\n🎉 All tests passed! Backend is ready to launch tokens.');
    console.log('\n📋 Summary:');
    console.log(`   Network: ${process.env.SOLANA_NETWORK || 'devnet'}`);
    console.log(`   RPC: ${process.env.SOLANA_RPC_ENDPOINT}`);
    console.log(`   Wallet: ${walletPublicKey}`);
    console.log(`   Balance: ${balance.toFixed(4)} SOL`);
    console.log(`   Config: ${configAddress.toString()}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testSetup();

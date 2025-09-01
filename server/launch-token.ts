#!/usr/bin/env node
/**
 * Quick token launcher script
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { BackendLaunchpadService, LaunchpadFormData } from './src/services/LaunchpadService';
import dotenv from 'dotenv';

dotenv.config();

async function launchToken() {
  console.log('🚀 Quick Token Launcher\n');

  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('Usage: npm run launch <name> <symbol> [description] [image]');
      console.log('Example: npm run launch "My Token" "MTK" "An awesome token" "https://example.com/logo.png"');
      return;
    }

    const [name, symbol, description, image] = args;

    const formData: LaunchpadFormData = {
      name,
      symbol,
      description: description || `${name} token`,
      image: image || 'https://example.com/default-logo.png',
      totalSupply: '1000000000',
      initialMarketCap: '0',
      migrationMarketCap: '100000',
      percentageSupplyOnMigration: '80',
    };

    console.log('📋 Token Details:');
    console.log(`   Name: ${formData.name}`);
    console.log(`   Symbol: ${formData.symbol}`);
    console.log(`   Description: ${formData.description}`);
    console.log(`   Total Supply: ${formData.totalSupply}`);
    console.log(`   Initial Market Cap: $${formData.initialMarketCap}`);

    // Initialize service
    const connection = new Connection(process.env.SOLANA_RPC_ENDPOINT!, 'confirmed');
    const launchpadService = new BackendLaunchpadService(connection);
    const configAddress = new PublicKey(process.env.PLATFORM_CONFIG!);

    console.log('\n⏳ Creating token...');
    
    const result = await launchpadService.createTokenWithConfig(formData, configAddress);

    console.log('\n🎉 Token created successfully!');
    console.log('\n📋 Results:');
    console.log(`   Token Address: ${result.baseMintAddress}`);
    console.log(`   Pool Address: ${result.poolAddress}`);
    console.log(`   Transaction IDs: ${result.txIds.join(', ')}`);
    
    console.log('\n🔗 Explorer Links:');
    console.log(`   Token: https://explorer.solana.com/address/${result.baseMintAddress}?cluster=devnet`);
    console.log(`   Pool: https://explorer.solana.com/address/${result.poolAddress}?cluster=devnet`);
    
    result.txIds.forEach((txId, index) => {
      console.log(`   TX ${index + 1}: https://explorer.solana.com/tx/${txId}?cluster=devnet`);
    });

  } catch (error) {
    console.error('\n❌ Token creation failed:', error);
    process.exit(1);
  }
}

// Launch token
launchToken();

import { BackendLaunchpadService } from './src/services/LaunchpadService';
import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDammV2Fallback() {
  console.log('🧪 Testing DAMM V2 fallback functionality...');
  
  try {
    // Initialize Solana connection
    const rpcUrl = process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    const launchpadService = new BackendLaunchpadService(connection);
    
    // Test with a pool address that might fail DBC but work with DAMM V2
    // This is just an example - replace with actual addresses when available
    const testPoolAddress = "11111111111111111111111111111111"; // Placeholder
    
    console.log(`📊 Testing pool info fetch for: ${testPoolAddress}`);
    
    try {
      const poolInfo = await launchpadService.getPoolInfo(
        testPoolAddress,
        "Test Token",
        "TEST"
      );
      
      console.log('✅ Pool info result:', {
        address: poolInfo.address,
        symbol: poolInfo.symbol,
        progress: poolInfo.progress,
        isMigrated: poolInfo.isMigrated,
        dammV2PoolAddress: poolInfo.dammV2PoolAddress,
        currentPrice: poolInfo.currentPrice,
        marketCap: poolInfo.marketCap
      });
      
    } catch (error) {
      console.log('❌ Pool fetch failed (expected for test):', error);
    }
    
    // Test DAMM V2 pool address derivation
    console.log('\n🔍 Testing DAMM V2 pool address derivation...');
    
    const testMint = "So11111111111111111111111111111111111111112"; // SOL mint as example
    const dammV2Address = await launchpadService.findDammV2PoolAddress(testMint);
    
    if (dammV2Address) {
      console.log(`✅ Found DAMM V2 pool: ${dammV2Address}`);
    } else {
      console.log('❌ No DAMM V2 pool found (expected for SOL mint)');
    }
    
    console.log('\n✅ DAMM V2 fallback test completed!');
    
  } catch (error) {
    console.error('❌ Error in DAMM V2 fallback test:', error);
  }
  
  process.exit(0);
}

testDammV2Fallback();

import { BattleDaemon } from './src/services/BattleDaemon';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDaemon() {
  console.log('🧪 Testing Battle Daemon...');
  
  try {
    // Get daemon instance
    const daemon = BattleDaemon.getInstance();
    
    // Check initial status
    console.log('📊 Initial status:', daemon.getStatus());
    
    // Start daemon
    console.log('🚀 Starting daemon...');
    daemon.start();
    
    // Check status after start
    console.log('📊 Status after start:', daemon.getStatus());
    
    // Force a check
    console.log('🔄 Forcing battle check...');
    await daemon.forceCheck();
    
    // Wait a bit
    console.log('⏳ Waiting 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Stop daemon
    console.log('🛑 Stopping daemon...');
    daemon.stop();
    
    // Check final status
    console.log('📊 Final status:', daemon.getStatus());
    
    console.log('✅ Daemon test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing daemon:', error);
  }
  
  process.exit(0);
}

testDaemon();

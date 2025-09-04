import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Connection, PublicKey } from '@solana/web3.js';
import tokensRouter from './routes/tokens';
import daemonRouter from './routes/daemon';
import { BattleDaemon } from './services/BattleDaemon';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['*', 'https://tvt-two.vercel.app', 'https://tvt-launchpad.vercel.app', 'http://localhost:5000', 'http://localhost:5005'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Key validation middleware (optional)
const validateApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  // Skip API key validation in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing API key'
    });
  }
  
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'TvT Launchpad Server is running',
    timestamp: new Date().toISOString(),
    network: process.env.SOLANA_NETWORK || 'devnet',
    version: '1.0.0'
  });
});

// Test Solana connection
app.get('/health/solana', async (req, res) => {
  try {
    const connection = new Connection(
      process.env.SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com',
      'confirmed'
    );
    
    const slot = await connection.getSlot();
    const blockHeight = await connection.getBlockHeight();
    
    res.json({
      success: true,
      data: {
        connected: true,
        slot,
        blockHeight,
        endpoint: process.env.SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com',
        network: process.env.SOLANA_NETWORK || 'devnet'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to connect to Solana network',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Routes
app.use('/api/tokens', validateApiKey, tokensRouter);
app.use('/api/daemon', daemonRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /health/solana',
      'GET /api/tokens/wallet',
      'POST /api/tokens/create',
      'POST /api/tokens/create-battle',
      'GET /api/daemon/status',
      'POST /api/daemon/start',
      'POST /api/daemon/stop',
      'POST /api/daemon/check'
    ]
  });
});

// Error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TvT Launchpad Server running on port ${PORT}`);
  console.log(`📡 Network: ${process.env.SOLANA_NETWORK || 'devnet'}`);
  console.log(`🔗 RPC Endpoint: ${process.env.SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Solana health: http://localhost:${PORT}/health/solana`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔧 Development mode: API key validation disabled`);
  }

  // Start Battle Daemon
  const daemon = BattleDaemon.getInstance();
  daemon.start();
  console.log(`⚔️  Battle Daemon started automatically`);
});

export default app;

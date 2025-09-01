import { Router, Request, Response } from 'express';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { BackendLaunchpadService, LaunchpadFormData } from '../services/LaunchpadService';
import BN from 'bn.js';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// Initialize Solana connection
const connection = new Connection(
  process.env.SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com',
  'confirmed'
);


const launchpadService = new BackendLaunchpadService(connection);

const idJsonPath = path.join(process.cwd(), 'id.json');
const secretKeyArray = JSON.parse(fs.readFileSync(idJsonPath, 'utf8'));
const backendKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));

/**
 * POST /api/tokens/create
 * Create a new token with bonding curve
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      symbol, 
      description, 
      image, 
      totalSupply, 
      initialMarketCap, 
      migrationMarketCap, 
      percentageSupplyOnMigration 
    } = req.body;

    // Validate required fields
    if (!name || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'Name and symbol are required fields'
      });
    }

    // Prepare form data
    const formData: LaunchpadFormData = {
      name,
      symbol,
      description: description || `${name} token`,
      image: image || 'https://example.com/default-logo.png',
      totalSupply: totalSupply || '1000000000',
      initialMarketCap: initialMarketCap || '5000',
      migrationMarketCap: migrationMarketCap || '100000',
      percentageSupplyOnMigration: percentageSupplyOnMigration || '80',
    };

    // Get platform config from environment
    const configAddress = new PublicKey(
      process.env.PLATFORM_CONFIG || 'Hz3hBp4oRxJHZrU24P5kHTHzHffQjoWTq68CrDatewk3'
    );

    console.log(`Creating token: ${name} (${symbol})`);
    console.log(`Using config: ${configAddress.toString()}`);

    // Create token
    const result = await launchpadService.createTokenWithConfig(formData, configAddress);

    res.json({
      success: true,
      data: {
        token: {
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          image: formData.image,
        },
        blockchain: {
          poolAddress: result.poolAddress,
          baseMintAddress: result.baseMintAddress,
          configAddress: configAddress.toString(),
          txIds: result.txIds,
        },
        explorer: {
          token: `https://explorer.solana.com/address/${result.baseMintAddress}?cluster=devnet`,
          pool: `https://explorer.solana.com/address/${result.poolAddress}?cluster=devnet`,
          transactions: result.txIds.map(txId => `https://explorer.solana.com/tx/${txId}?cluster=devnet`)
        }
      }
    });

  } catch (error) {
    console.error('Error creating token:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/tokens/wallet
 * Get wallet information
 */
router.get('/wallet', async (req: Request, res: Response) => {
  try {
    const publicKey = launchpadService.getWalletPublicKey();
    const balance = await launchpadService.getWalletBalance();

    res.json({
      success: true,
      data: {
        publicKey,
        balance,
        network: process.env.SOLANA_NETWORK || 'devnet',
        explorer: `https://explorer.solana.com/address/${publicKey}?cluster=devnet`
      }
    });

  } catch (error) {
    console.error('Error getting wallet info:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/tokens/create-battle
 * Create tokens for a battle
 */
router.post('/create-battle', async (req: Request, res: Response) => {
  try {
    const { token1, token2 } = req.body;

    if (!token1 || !token2) {
      return res.status(400).json({
        success: false,
        error: 'Both token1 and token2 data are required'
      });
    }

    // Validate token data
    if (!token1.name || !token1.ticker || !token2.name || !token2.ticker) {
      return res.status(400).json({
        success: false,
        error: 'Name and ticker are required for both tokens'
      });
    }

    const configAddress = new PublicKey(
      process.env.PLATFORM_CONFIG || 'Hz3hBp4oRxJHZrU24P5kHTHzHffQjoWTq68CrDatewk3'
    );

    console.log(`Creating battle tokens: ${token1.name} vs ${token2.name}`);

    // Create token 1
    const token1FormData: LaunchpadFormData = {
      name: token1.name,
      symbol: token1.ticker,
      description: `Battle token: ${token1.name}`,
      image: token1.logo || 'https://example.com/default-logo.png',
      totalSupply: '1000000000',
      initialMarketCap: '0',
      migrationMarketCap: '100000',
      percentageSupplyOnMigration: '80',
    };

    const token1Result = await launchpadService.createTokenWithConfig(token1FormData, configAddress);

    // Create token 2
    const token2FormData: LaunchpadFormData = {
      name: token2.name,
      symbol: token2.ticker,
      description: `Battle token: ${token2.name}`,
      image: token2.logo || 'https://example.com/default-logo.png',
      totalSupply: '1000000000',
      initialMarketCap: '0',
      migrationMarketCap: '100000',
      percentageSupplyOnMigration: '80',
    };

    const token2Result = await launchpadService.createTokenWithConfig(token2FormData, configAddress);

    res.json({
      success: true,
      data: {
        token1: {
          ...token1FormData,
          poolAddress: token1Result.poolAddress,
          baseMintAddress: token1Result.baseMintAddress,
          creatorWallet: backendKeypair.publicKey,
          txIds: token1Result.txIds,
          explorer: {
            token: `https://explorer.solana.com/address/${token1Result.baseMintAddress}?cluster=devnet`,
            pool: `https://explorer.solana.com/address/${token1Result.poolAddress}?cluster=devnet`,
          }
        },
        token2: {
          ...token2FormData,
          poolAddress: token2Result.poolAddress,
          baseMintAddress: token2Result.baseMintAddress,
          creatorWallet: backendKeypair.publicKey,
          txIds: token2Result.txIds,
          explorer: {
            token: `https://explorer.solana.com/address/${token2Result.baseMintAddress}?cluster=devnet`,
            pool: `https://explorer.solana.com/address/${token2Result.poolAddress}?cluster=devnet`,
          }
        },
        configAddress: configAddress.toString(),
      }
    });

  } catch (error) {
    console.error('Error creating battle tokens:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/tokens/pool-info
 * Get pool information for a token
 */
router.get('/pool-info', async (req: Request, res: Response) => {
  try {
    const { mint, poolAddress, tokenName, tokenSymbol, migrated } = req.query;

    if (!mint || typeof mint !== 'string' || !poolAddress || typeof poolAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Pool address is required'
      });
    }

    console.log(`Getting pool info for: ${poolAddress}`, "migrated", migrated);

    const poolInfo = await launchpadService.getPoolInfo(
      mint,
      poolAddress,
      tokenName as string,
      tokenSymbol as string,
      migrated === 'true'
    );

    res.json({
      success: true,
      data: poolInfo
    });

  } catch (error: any) {
    console.error('Error getting pool info:', error?.message);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/tokens/buy
 * Buy tokens with SOL using DAMM V2 swap
 */
router.post('/rewardchampion', async (req: Request, res: Response) => {
  try {
    const { mint, poolAddress, amountSol, slippageBps = 500 } = req.body;

    // Validate required fields
    if (!mint || !poolAddress || !amountSol) {
      return res.status(400).json({
        success: false,
        error: 'mint, poolAddress, and amountSol are required fields'
      });
    }

    // Validate amount
    const solAmount = parseFloat(amountSol);
    if (isNaN(solAmount) || solAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amountSol must be a positive number'
      });
    }

    // Validate slippage
    const slippage = parseInt(slippageBps);
    if (isNaN(slippage) || slippage < 0 || slippage > 10000) {
      return res.status(400).json({
        success: false,
        error: 'slippageBps must be between 0 and 10000 (0-100%)'
      });
    }

    console.log(`💰 Buying token with ${solAmount} SOL on pool: ${poolAddress}`);
    console.log(`🎯 Slippage tolerance: ${slippage} bps (${slippage/100}%)`);

    // Convert SOL amount to lamports (1 SOL = 1e9 lamports)
    const amountInLamports = Math.floor(solAmount * 1e9);

    // Check backend wallet balance first
    const walletBalance = await launchpadService.getWalletBalance();
    if (walletBalance < solAmount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient SOL balance. Required: ${solAmount} SOL, Available: ${walletBalance} SOL`
      });
    }

    // Execute the swap using DAMM V2
    const swapResult = await launchpadService.executeDammV2Swap(
      poolAddress,
      new (require('bn.js'))(amountInLamports),
      'buy', // Buying tokens with SOL
      slippage / 100, // Convert bps to percentage
      backendKeypair
    );

    console.log(`✅ Token purchase completed successfully!`);
    console.log(`🔗 Transaction ID: ${swapResult.txId}`);
    console.log(`🪙 Tokens received: ${swapResult.amountOut.toString()}`);

    res.json({
      success: true,
      data: {
        txId: swapResult.txId,
        amountSolSpent: solAmount,
        amountTokensReceived: swapResult.amountOut.toString(),
        slippageUsed: slippage,
        explorerLink: `https://explorer.solana.com/tx/${swapResult.txId}?cluster=devnet`,
        poolAddress,
        tokenMint: mint
      }
    });

  } catch (error) {
    console.error('❌ Error buying token:', error);
    
    // Enhanced error handling for swap-specific errors
    let errorMessage = 'Unknown error occurred during token purchase';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for common swap errors and provide user-friendly messages
      if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL balance for this purchase';
      } else if (errorMessage.includes('slippage')) {
        errorMessage = 'Price moved too much during swap. Try increasing slippage tolerance';
      } else if (errorMessage.includes('Pool state not found')) {
        errorMessage = 'Token pool not found or not migrated to DAMM V2 yet';
      } else if (errorMessage.includes('Pool does not contain SOL')) {
        errorMessage = 'This pool does not support SOL purchases';
      }
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export default router;

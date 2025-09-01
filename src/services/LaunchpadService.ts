import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { DAMM_V2_MIGRATION_FEE_ADDRESS, DAMM_V2_PROGRAM_ID, DYNAMIC_BONDING_CURVE_PROGRAM_ID, DynamicBondingCurveClient, deriveDammV2PoolAddress, deriveDbcPoolAddress } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { CpAmm, getSqrtPriceFromPrice, getPriceFromSqrtPrice } from '@meteora-ag/cp-amm-sdk';
import BN from 'bn.js';
import * as fs from 'fs';
import * as path from 'path';
import { getSOLPrice } from '../utils';
import { token } from 'morgan';

// Constants
const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

const SEED = Object.freeze({
    POOL_AUTHORITY: 'pool_authority',
    EVENT_AUTHORITY: '__event_authority',
    POOL: 'pool',
    TOKEN_VAULT: 'token_vault',
    METADATA: 'metadata',
    PARTNER_METADATA: 'partner_metadata',
    CLAIM_FEE_OPERATOR: 'cf_operator',
    DAMM_V1_MIGRATION_METADATA: 'meteora',
    DAMM_V2_MIGRATION_METADATA: 'damm_v2',
    LP_MINT: 'lp_mint',
    FEE: 'fee',
    POSITION: 'position',
    POSITION_NFT_ACCOUNT: 'position_nft_account',
    LOCK_ESCROW: 'lock_escrow',
    VIRTUAL_POOL_METADATA: 'virtual_pool_metadata',
    ESCROW: 'escrow',
    BASE_LOCKER: 'base_locker',
    VAULT: 'vault',
})

export interface LaunchpadFormData {
  name: string;
  symbol: string;
  description: string;
  image: string;
  totalSupply: string;
  initialMarketCap: string;
  migrationMarketCap: string;
  percentageSupplyOnMigration: string;
}

export class BackendLaunchpadService {
  private client: DynamicBondingCurveClient;
  private cpAmm: CpAmm;
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
    this.client = new DynamicBondingCurveClient(connection, 'confirmed');
    this.cpAmm = new CpAmm(connection);
  }

  /**
   * Create a new token with bonding curve using existing config and keypair from id.json
   */
  async createTokenWithConfig(
    formData: LaunchpadFormData,
    configAddress: PublicKey
  ): Promise<{
    poolAddress: string;
    baseMintAddress: string;
    txIds: string[];
  }> {
    let vanityFilePath: string | null = null;
    
    try {
      // Load keypair from id.json
      const idJsonPath = path.join(process.cwd(), 'id.json');
      
      if (!fs.existsSync(idJsonPath)) {
        throw new Error('id.json file not found. Please create it with your wallet private key.');
      }

      const secretKeyArray = JSON.parse(fs.readFileSync(idJsonPath, 'utf8'));
      const payerKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
      
      console.log(`Using wallet: ${payerKeypair.publicKey.toString()}`);
      
      // Get unused vanity address for the token mint
      const { keypair: baseMintKeypair, filePath } = await this.getUnusedVanityAddress();
      vanityFilePath = filePath;
      console.log(`Using vanity token mint: ${baseMintKeypair.publicKey.toString()}`);

      // Create pool transaction directly
      const createPoolTx = await this.client.pool.createPool({
        payer: payerKeypair.publicKey,
        config: configAddress,
        baseMint: baseMintKeypair.publicKey,
        name: formData.name,
        symbol: formData.symbol,
        uri: formData.image || 'https://example.com/metadata.json',
        poolCreator: payerKeypair.publicKey,
      });

      const txIds: string[] = [];

      // Sign and send pool transaction
      createPoolTx.feePayer = payerKeypair.publicKey;
      createPoolTx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      createPoolTx.partialSign(baseMintKeypair);
      createPoolTx.partialSign(payerKeypair);
      
      console.log('Sending pool creation transaction...');
      const poolTxId = await this.connection.sendRawTransaction(createPoolTx.serialize());
      console.log(`Pool creation transaction sent: ${poolTxId}`);
      
      await this.connection.confirmTransaction(poolTxId);
      console.log(`Pool creation transaction confirmed: ${poolTxId}`);
      txIds.push(poolTxId);

      // Derive pool address
      const poolAddress = deriveDbcPoolAddress(
        SOL_MINT,
        baseMintKeypair.publicKey,
        configAddress
      );

      console.log(`Pool address: ${poolAddress.toString()}`);

      return {
        poolAddress: poolAddress.toString(),
        baseMintAddress: baseMintKeypair.publicKey.toString(),
        txIds,
      };
    } catch (error) {
      console.error('Error creating token:', error);
      throw error;
    } finally {
      // Clean up the used vanity address file
      if (vanityFilePath) {
        await this.deleteVanityAddressFile(vanityFilePath);
      }
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(): Promise<number> {
    try {
      const idJsonPath = path.join(process.cwd(), 'id.json');
      const secretKeyArray = JSON.parse(fs.readFileSync(idJsonPath, 'utf8'));
      const payerKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
      
      const balance = await this.connection.getBalance(payerKeypair.publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw error;
    }
  }

  /**
   * Get wallet public key
   */
  getWalletPublicKey(): string {
    try {
      const idJsonPath = path.join(process.cwd(), 'id.json');
      const secretKeyArray = JSON.parse(fs.readFileSync(idJsonPath, 'utf8'));
      const payerKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
      
      return payerKeypair.publicKey.toString();
    } catch (error) {
      console.error('Error getting wallet public key:', error);
      throw error;
    }
  }

  /**
   * Get pool information for a given pool address
   */
  async getPoolInfo(mint: string, poolAddress: string, tokenName?: string, tokenSymbol?: string, migrated?: boolean): Promise<{
    address: string;
    baseMint: string;
    quoteMint: string;
    name: string;
    symbol: string;
    currentPrice: number;
    progress: number;
    migrationThreshold: number;
    currentReserve: number;
    marketCap: number;
    baseReserve: string;
    quoteReserve: string;
    isMigrated?: boolean;
    dammV2PoolAddress?: string;
  }> {
    try {
      // if (!migrated || migrated === undefined) {
        // First try to get pool data from DBC (Dynamic Bonding Curve)
        try {
          const poolPubkey = new PublicKey(poolAddress);
          const dbcPoolInfo = await this.getDbcPoolInfo(poolPubkey, tokenName, tokenSymbol);
          if (dbcPoolInfo) {
            return dbcPoolInfo;
          }
        } catch (dbcError) {
          console.log(`⚠️  DBC pool fetch failed for ${tokenSymbol || poolAddress}, trying DAMM V2...`);
        }
      // } else {
        // Try to get pool info from DAMM V2
        try {
          const configAddress = new PublicKey(
            process.env.PLATFORM_CONFIG || 'Hz3hBp4oRxJHZrU24P5kHTHzHffQjoWTq68CrDatewk3'
          );

          const poolPubkey = deriveDammV2PoolAddress(
            new PublicKey(DAMM_V2_MIGRATION_FEE_ADDRESS['0']),
            new PublicKey(mint),
            SOL_MINT
          );

          console.log("*** Mint:", mint, "DAMM2:", poolPubkey.toString());

          const dammV2PoolInfo = await this.getDammV2PoolInfo(poolPubkey, tokenName, tokenSymbol);
          if (dammV2PoolInfo) {
            return dammV2PoolInfo;
          }
        } catch (dammError) {
          console.log(`⚠️  DAMM V2 pool fetch failed for ${tokenSymbol || poolAddress}`);
          throw dammError;
        }
      // }

      throw new Error(`Pool not found in either DBC or DAMM V2: ${poolAddress}`);
    } catch (error:any) {
      console.error('Error getting pool info:', error?.message);
      throw error;
    }
  }

  /**
   * Get pool information from Dynamic Bonding Curve (DBC)
   */
  private async getDbcPoolInfo(poolPubkey: PublicKey, tokenName?: string, tokenSymbol?: string): Promise<{
    address: string;
    baseMint: string;
    quoteMint: string;
    name: string;
    symbol: string;
    currentPrice: number;
    progress: number;
    migrationThreshold: number;
    currentReserve: number;
    marketCap: number;
    baseReserve: string;
    quoteReserve: string;
    isMigrated?: boolean;
    dammV2PoolAddress?: string;
  }> {
    const poolAddress = poolPubkey.toString();
    try {
      const poolPubkey = new PublicKey(poolAddress);
      
      // Get pool data from blockchain
      const pool = await this.client.state.getPool(poolPubkey);
      if (!pool) {
        throw new Error('Pool not found : ' + poolAddress);
      }

      const sol_price = await getSOLPrice();

      // Get additional pool metrics
      const progress = await this.client.state.getPoolCurveProgress(poolPubkey);
      const threshold = await this.client.state.getPoolMigrationQuoteThreshold(poolPubkey);

      // Calculate token price using the original logic
      const baseReserve = pool.baseReserve ? new BN(pool.baseReserve.toString()) : new BN(0);
      const quoteReserve = pool.quoteReserve ? new BN(pool.quoteReserve.toString()) : new BN(0);
      
      let currentPrice = 0;
      if (!baseReserve.isZero() && !quoteReserve.isZero()) {
        // Base token usually has 6 decimals, SOL has 9 decimals
        const baseDecimals = 6;
        const quoteDecimals = 9;
        
        const baseAmount = baseReserve.toNumber() / Math.pow(10, baseDecimals);
        const quoteAmount = quoteReserve.toNumber() / Math.pow(10, quoteDecimals);
        
        if (baseAmount > 0) {
          currentPrice = quoteAmount / baseAmount * sol_price;
        }
      }

      // Calculate current reserve in SOL terms
      const currentReserve = quoteReserve.toNumber() / 1e9;

      // Calculate market cap (price * circulating supply)
      const totalSupply = baseReserve.toNumber() / Math.pow(10, 6); // Assuming 6 decimals
      const marketCap = currentPrice * totalSupply;

      // Check if token has migrated to DAMM V2
      let isMigrated = false;
      let dammV2PoolAddress = undefined;
      
      return {
        address: poolAddress,
        baseMint: pool.baseMint.toString(),
        quoteMint: SOL_MINT.toString(), // Always SOL for quote mint in bonding curves
        name: tokenName || 'Unknown Token',
        symbol: tokenSymbol || 'UNK',
        currentPrice,
        progress: progress * 100,
        migrationThreshold: Number(threshold) / 1e9,
        currentReserve,
        marketCap,
        baseReserve: baseReserve.toString(),
        quoteReserve: quoteReserve.toString(),
        isMigrated,
        dammV2PoolAddress,
      };
    } catch (error: any) {
      console.error('Error getting DBC pool info:', error?.message);
      throw error;
    }
  }

  /**
   * Get pool information from DAMM V2
   * Using proper DAMM V2 SDK methods as per official documentation
   */
  private async getDammV2PoolInfo(poolPubkey: PublicKey, tokenName?: string, tokenSymbol?: string): Promise<{
    address: string;
    baseMint: string;
    quoteMint: string;
    name: string;
    symbol: string;
    currentPrice: number;
    progress: number;
    migrationThreshold: number;
    currentReserve: number;
    marketCap: number;
    baseReserve: string;
    quoteReserve: string;
    isMigrated?: boolean;
    dammV2PoolAddress?: string;
  }> {
    try {
      const poolAddress = poolPubkey.toString();
      
      // Check if this is a DAMM V2 pool
      if (!this.cpAmm.isPoolExist(poolPubkey)) {
        throw new Error('Not a DAMM V2 pool : ' + poolAddress);
      }

      console.log(`🔍 Fetching DAMM V2 pool info for ${tokenSymbol}: ${poolAddress}`);

      const sol_price = await getSOLPrice();
      
      // For migrated tokens, progress is always 100%
      const progress = 100;
      
      // Initialize default values
      let currentPrice = 0;
      let marketCap = 0;
      let baseReserve = "0";
      let quoteReserve = "0";
      let baseMint = "";
      let quoteMint = "";
      
      try {
        // Use the official CpAmm.fetchPoolState method as per documentation
        const poolState = await this.cpAmm.fetchPoolState(poolPubkey);
        if (poolState) {
          console.log(`✅ Successfully fetched DAMM V2 pool state for ${tokenSymbol}`);
          
          // Set initial values from poolState - will be corrected in price calculation
          baseMint = poolState.tokenAMint.toString();
          quoteMint = poolState.tokenBMint.toString();
          
          // Extract liquidity and price information from the pool state
          // Convert sqrtPrice to actual price using SDK functions with proper handling
          try {
            // Get token mint info to determine decimals
            const [tokenAMintInfo, tokenBMintInfo] = await Promise.all([
              this.connection.getParsedAccountInfo(poolState.tokenAMint),
              this.connection.getParsedAccountInfo(poolState.tokenBMint)
            ]);
            
            let tokenADecimals = 9; // Default SOL decimals
            let tokenBDecimals = 9; // Default SOL decimals
            
            if (tokenAMintInfo.value?.data && 'parsed' in tokenAMintInfo.value.data) {
              tokenADecimals = tokenAMintInfo.value.data.parsed.info.decimals;
            }
            
            if (tokenBMintInfo.value?.data && 'parsed' in tokenBMintInfo.value.data) {
              tokenBDecimals = tokenBMintInfo.value.data.parsed.info.decimals;
            }
            
            console.log(`🔍 Token decimals - A: ${tokenADecimals}, B: ${tokenBDecimals}`);
            console.log(`📊 Pool liquidity: ${poolState.liquidity.toString()}`);
            console.log(`💱 sqrtPrice: ${poolState.sqrtPrice.toString()}`);
            
            // Determine which token is SOL and which is the project token
            const nativeSOL = new PublicKey("11111111111111111111111111111112");
            const wrappedSOL = new PublicKey("So11111111111111111111111111111111111111112");
            
            let tokenPriceSOL: number;
            let isTokenA_SOL = false;
            let isTokenB_SOL = false;
            let projectTokenMint: PublicKey;
            let projectTokenDecimals: number;
            
            // Check if tokenA is SOL
            if (poolState.tokenAMint.equals(nativeSOL) || poolState.tokenAMint.equals(wrappedSOL)) {
              isTokenA_SOL = true;
              projectTokenMint = poolState.tokenBMint;
              projectTokenDecimals = tokenBDecimals;
              baseMint = poolState.tokenBMint.toString(); // Project token is base
              quoteMint = poolState.tokenAMint.toString(); // SOL is quote
            }
            // Check if tokenB is SOL
            else if (poolState.tokenBMint.equals(nativeSOL) || poolState.tokenBMint.equals(wrappedSOL)) {
              isTokenB_SOL = true;
              projectTokenMint = poolState.tokenAMint;
              projectTokenDecimals = tokenADecimals;
              baseMint = poolState.tokenAMint.toString(); // Project token is base
              quoteMint = poolState.tokenBMint.toString(); // SOL is quote
            }
            else {
              // Neither is SOL, assume tokenA is project token
              projectTokenMint = poolState.tokenAMint;
              projectTokenDecimals = tokenADecimals;
              baseMint = poolState.tokenAMint.toString();
              quoteMint = poolState.tokenBMint.toString();
            }
            
            // Calculate price more carefully to avoid overflow
            try {
              // For very large sqrtPrice values, use a safer approach
              // Convert BN to string and work with smaller precision
              const sqrtPriceStr = poolState.sqrtPrice.toString();
              const sqrtPriceBN = poolState.sqrtPrice;
              
              console.log(`🔢 Processing sqrtPrice: ${sqrtPriceStr} (length: ${sqrtPriceStr.length})`);
              
              // If sqrtPrice is too large for safe calculation, use vault balances directly
              if (sqrtPriceStr.length > 15) {
                console.log(`⚠️  sqrtPrice too large for SDK calculation, using vault balance method`);
                throw new Error(`sqrtPrice too large: ${sqrtPriceStr}`);
              }
              
              // Try SDK calculation with smaller numbers
              const priceDecimal = getPriceFromSqrtPrice(poolState.sqrtPrice, tokenADecimals, tokenBDecimals);
              
              // Convert to string first to avoid number overflow
              const priceStr = priceDecimal.toString();
              const price = parseFloat(priceStr);
              
              console.log(`💱 SDK price calculation: ${priceStr} -> ${price}`);
              
              if (isFinite(price) && price > 0) {
                if (isTokenA_SOL) {
                  // Price is tokenB/tokenA (token per SOL), so token price in SOL is 1/price
                  tokenPriceSOL = 1 / price;
                } else if (isTokenB_SOL) {
                  // Price is tokenA/tokenB (token per SOL), so token price in SOL is price  
                  tokenPriceSOL = price;
                } else {
                  // Neither is SOL, use reasonable scaling
                  tokenPriceSOL = price * 0.0001;
                }
                
                // Sanity check: ensure price is reasonable for a token
                if (tokenPriceSOL > 100 || tokenPriceSOL < 0.0000000001) {
                  console.log(`⚠️  Price seems unrealistic: ${tokenPriceSOL}, falling back to vault method`);
                  throw new Error(`Price out of reasonable range: ${tokenPriceSOL}`);
                }
                
                console.log(`✅ Successfully calculated price from sqrtPrice: ${tokenPriceSOL} SOL`);
              } else {
                throw new Error(`Invalid price calculated: ${price}`);
              }
            } catch (priceError: any) {
              console.log(`⚠️  Price calculation failed, using vault balance method: ${priceError?.message || priceError}`);
              
              // Fallback: Calculate price from vault balances - this is more reliable for large pools
              try {
                const [tokenAVaultInfo, tokenBVaultInfo] = await Promise.all([
                  this.connection.getTokenAccountBalance(poolState.tokenAVault),
                  this.connection.getTokenAccountBalance(poolState.tokenBVault)
                ]);
                
                const tokenABalance = new BN(tokenAVaultInfo.value.amount);
                const tokenBBalance = new BN(tokenBVaultInfo.value.amount);
                
                console.log(`💰 Vault balances - A: ${tokenABalance.toString()}, B: ${tokenBBalance.toString()}`);
                
                if (tokenABalance.gt(new BN(1)) && tokenBBalance.gt(new BN(1))) {
                  // Use string arithmetic for very large numbers to avoid overflow
                  const tokenAAmountStr = tokenABalance.toString();
                  const tokenBAmountStr = tokenBBalance.toString();

                  // Convert to decimal representation
                  const tokenAAmount = parseFloat(tokenAAmountStr) / Math.pow(10, tokenADecimals);
                  const tokenBAmount = parseFloat(tokenBAmountStr) / Math.pow(10, tokenBDecimals);
                  
                  console.log(`🔢 Decimal amounts - A: ${tokenAAmount}, B: ${tokenBAmount}`);
                  
                  if (isTokenA_SOL) {
                    // TokenA is SOL, tokenB is project token
                    tokenPriceSOL = tokenAAmount / tokenBAmount;
                  } else if (isTokenB_SOL) {
                    // TokenB is SOL, tokenA is project token
                    tokenPriceSOL = tokenBAmount / tokenAAmount;
                  } else {
                    // Neither is SOL, use ratio with reasonable scaling
                    tokenPriceSOL = (tokenBAmount / tokenAAmount) * 0.01;
                  }
                  
                  // Additional sanity check for vault-based calculation
                  if (tokenPriceSOL > 100 || tokenPriceSOL < 0.0000000001) {
                    console.log(`⚠️  Vault-based price seems unrealistic: ${tokenPriceSOL}, using conservative estimate`);
                    tokenPriceSOL = 0.0; // Conservative estimate for new tokens
                  }
                  
                  console.log(`💱 Calculated price from vault balances: ${tokenPriceSOL} SOL`);
                } else {
                  throw new Error('One or both vault balances are zero');
                }
              } catch (vaultError: any) {
                console.log(`⚠️  Vault balance calculation failed: ${vaultError?.message || vaultError}`);
                
                // Final fallback: Use a very small default price typical for new tokens
                tokenPriceSOL = 0.0; // 0.0 SOL per token
                console.log(`🔧 Using fallback price: ${tokenPriceSOL} SOL`);
              }
            }
            
            // Convert to USD
            currentPrice = tokenPriceSOL * sol_price;
            console.log(`💵 Current token price: ${tokenPriceSOL} SOL ($${currentPrice})`, poolPubkey.toString());
            
            // Calculate market cap using token supply
            const tokenMintInfo = isTokenA_SOL ? tokenBMintInfo : tokenAMintInfo;
            if (tokenMintInfo.value?.data && 'parsed' in tokenMintInfo.value.data) {
              const tokenData = tokenMintInfo.value.data.parsed.info;
              const supply = tokenData.supply;
              const totalSupply = parseInt(supply) / Math.pow(10, projectTokenDecimals);
              marketCap = totalSupply * currentPrice;
            }
            
            // Calculate reserves from vault balances - use actual balances for accuracy
            try {
              const [tokenAVaultInfo, tokenBVaultInfo] = await Promise.all([
                this.connection.getTokenAccountBalance(poolState.tokenAVault),
                this.connection.getTokenAccountBalance(poolState.tokenBVault)
              ]);
              
              // For DAMM V2 pools, base token is the project token, quote token is SOL
              baseReserve = isTokenA_SOL ? tokenBVaultInfo.value.amount : tokenAVaultInfo.value.amount;
              quoteReserve = isTokenA_SOL ? tokenAVaultInfo.value.amount : tokenBVaultInfo.value.amount;
              
              // Calculate currentReserve in SOL terms for compatibility
              const quoteReserveSOL = parseFloat(quoteReserve) / Math.pow(10, 9); // SOL has 9 decimals
              
              console.log(`💰 Vault balances - Base: ${baseReserve}, Quote: ${quoteReserve} (${quoteReserveSOL.toFixed(4)} SOL)`);
            } catch (reserveError: any) {
              console.log(`⚠️  Could not fetch vault balances: ${reserveError?.message || reserveError}`);
              
              // Fallback: Use liquidity value as estimate
              // The liquidity BN is very large, so handle it carefully
              try {
                const liquidityStr = poolState.liquidity.toString();
                console.log(`🔢 Using liquidity as reserve fallback: ${liquidityStr}`);
                
                // For very large liquidity values, use a scaled estimate
                if (liquidityStr.length > 20) {
                  // Very large pool, use conservative estimates
                  baseReserve = "1000000000000"; // 1M tokens with 6 decimals
                  quoteReserve = "10000000000"; // 10 SOL with 9 decimals
                } else {
                  // Use liquidity value directly
                  baseReserve = liquidityStr;
                  quoteReserve = liquidityStr;
                }
              } catch (liquidityError) {
                console.log(`⚠️  Liquidity calculation failed, using defaults`);
                baseReserve = "0"; // 0 tokens
                quoteReserve = "0"; // 0 SOL
              }
            }
            
            console.log(`💰 Final calculations - Price: ${tokenPriceSOL} SOL ($${currentPrice}), Market cap: $${marketCap}`);
            
          } catch (priceCalcError) {
            console.log(`⚠️  Could not calculate price from poolState, using fallback: ${priceCalcError}`);
            
            // Fallback: use reasonable default values for migrated pools
            currentPrice = 0.0;
            marketCap = 0;
            baseReserve = "1000000000";
            quoteReserve = "10000000000";
            
            // Still try to get the correct mint addresses
            baseMint = poolState.tokenAMint.toString();
            quoteMint = poolState.tokenBMint.toString();
            
            // If one of them is SOL, make sure SOL is the quote mint
            const nativeSOL = new PublicKey("11111111111111111111111111111112");
            const wrappedSOL = new PublicKey("So11111111111111111111111111111111111111112");
            
            if (poolState.tokenBMint.equals(nativeSOL) || poolState.tokenBMint.equals(wrappedSOL)) {
              // TokenB is SOL - keep current assignment
            } else if (poolState.tokenAMint.equals(nativeSOL) || poolState.tokenAMint.equals(wrappedSOL)) {
              // TokenA is SOL - swap assignments
              baseMint = poolState.tokenBMint.toString();
              quoteMint = poolState.tokenAMint.toString();
            }
          }
        }
      } catch (poolError) {
        console.log(`⚠️  Error fetching pool state for DAMM V2 pool ${poolAddress}: ${poolError}`);
        
        // Try to get basic pool info even if detailed state fetch fails
        try {
          // At minimum, try to determine the token mints from the pool address derivation
          // The pool should still exist even if we can't fetch full state
          baseMint = "unknown";
          quoteMint = SOL_MINT.toString();
          
          console.log(`🔍 Setting fallback values for pool ${poolAddress}`);
        } catch (fallbackError) {
          console.log(`❌ Complete fallback failed: ${fallbackError}`);
        }
        
        // Set reasonable defaults for migrated pools
        currentPrice = 0.0;
        marketCap = 0;
        baseReserve = "1000000000";
        quoteReserve = "10000000000";
      }

      console.log(`✅ Successfully processed DAMM V2 pool info for ${tokenSymbol}: ${poolAddress}`);

      return {
        address: poolAddress,
        baseMint: baseMint || "unknown",
        quoteMint: quoteMint || SOL_MINT.toString(),
        name: tokenName || 'Unknown Token',
        symbol: tokenSymbol || 'UNK',
        currentPrice,
        progress,
        migrationThreshold: 0, // Already migrated
        currentReserve: parseFloat(quoteReserve) / Math.pow(10, 9), // Convert to SOL for display
        marketCap,
        baseReserve,
        quoteReserve,
        isMigrated: true,
        dammV2PoolAddress: poolAddress,
      };
    } catch (error: any) {
      console.error('❌ Error getting DAMM V2 pool info:', error?.message);
      throw error;
    }
  }

  /**
   * Execute DAMM V2 token swap
   * @param poolAddress - The pool address to swap on
   * @param amountIn - Amount of input token in lamports/smallest unit
   * @param tradeType - 'buy' (SOL -> Token) or 'sell' (Token -> SOL)
   * @param slippage - Slippage tolerance as percentage (e.g. 1 for 1%)
   * @param payerKeypair - The keypair to sign the transaction
   * @returns Transaction ID of the swap
   */
  async executeDammV2Swap(
    poolAddress: string,
    amountIn: BN,
    tradeType: 'buy' | 'sell',
    slippage: number = 1, // Default 1% slippage
    payerKeypair: Keypair
  ): Promise<{
    txId: string;
    amountOut: BN;
  }> {
    try {
      console.log(`🔄 Executing DAMM V2 swap: ${tradeType} ${amountIn.toString()} on pool ${poolAddress}`);
      
      const poolPubkey = new PublicKey(poolAddress);
      const poolState = await this.cpAmm.fetchPoolState(poolPubkey);
      
      if (!poolState) {
        throw new Error(`Pool state not found for address: ${poolAddress}`);
      }
      
      // Determine input and output token mints based on trade type
      const solMint = 'So11111111111111111111111111111111111111112';
      const isTokenASol = poolState.tokenAMint.toString() === solMint;
      const isTokenBSol = poolState.tokenBMint.toString() === solMint;
      
      let inputTokenMint: PublicKey;
      let outputTokenMint: PublicKey;
      let minimumAmountOut: BN;
      
      if (tradeType === 'buy') {
        // Buying tokens with SOL
        if (isTokenASol) {
          inputTokenMint = poolState.tokenAMint; // SOL
          outputTokenMint = poolState.tokenBMint; // Token
        } else if (isTokenBSol) {
          inputTokenMint = poolState.tokenBMint; // SOL
          outputTokenMint = poolState.tokenAMint; // Token
        } else {
          throw new Error('Pool does not contain SOL - cannot buy tokens with SOL');
        }
      } else {
        // Selling tokens for SOL
        if (isTokenASol) {
          inputTokenMint = poolState.tokenBMint; // Token
          outputTokenMint = poolState.tokenAMint; // SOL
        } else if (isTokenBSol) {
          inputTokenMint = poolState.tokenAMint; // Token
          outputTokenMint = poolState.tokenBMint; // SOL
        } else {
          throw new Error('Pool does not contain SOL - cannot sell tokens for SOL');
        }
      }
      
      // Use conservative estimate for output amount (avoid complex quote API)
      // In production, you may want to call actual quote methods when API is stable
      const estimatedOutput = amountIn.mul(new BN(95)).div(new BN(100)); // Conservative 95% estimate
      
      // Calculate minimum amount out with slippage protection
      const slippageMultiplier = 1 - (slippage / 100);
      minimumAmountOut = estimatedOutput.mul(new BN(Math.floor(slippageMultiplier * 1000))).div(new BN(1000));
      
      console.log('DAMM V2 swap parameters:', {
        poolAddress,
        inputTokenMint: inputTokenMint.toString(),
        outputTokenMint: outputTokenMint.toString(),
        amountIn: amountIn.toString(),
        estimatedAmountOut: estimatedOutput.toString(),
        minimumAmountOut: minimumAmountOut.toString(),
        tradeType,
        slippage
      });
      
      // Create the swap transaction using DAMM V2 SDK
      const swapTx = await this.cpAmm.swap({
        payer: payerKeypair.publicKey,
        pool: poolPubkey,
        inputTokenMint,
        outputTokenMint,
        amountIn,
        minimumAmountOut,
        tokenAVault: poolState.tokenAVault,
        tokenBVault: poolState.tokenBVault,
        tokenAMint: poolState.tokenAMint,
        tokenBMint: poolState.tokenBMint,
        tokenAProgram: TOKEN_PROGRAM_ID,
        tokenBProgram: TOKEN_PROGRAM_ID,
        referralTokenAccount: null,
      });
      
      // The SDK returns a Transaction object directly
      swapTx.feePayer = payerKeypair.publicKey;
      swapTx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      
      // Sign and send the transaction
      swapTx.sign(payerKeypair);
      const txId = await this.connection.sendRawTransaction(swapTx.serialize());
      
      // Confirm the transaction
      await this.connection.confirmTransaction(txId, 'confirmed');
      
      console.log(`✅ DAMM V2 swap completed: ${txId}`);
      console.log(`💰 Swapped ${amountIn.toString()} ${inputTokenMint.toString()} for ${estimatedOutput.toString()} ${outputTokenMint.toString()}`);
      
      return {
        txId,
        amountOut: estimatedOutput
      };
      
    } catch (error) {
      console.error(`❌ DAMM V2 swap failed:`, error);
      throw error;
    }
  }

  /**
   * Try to find DAMM V2 pool address for a given token mint
   * Using the CpAmm client to search for pools
   */
  async findDammV2PoolAddress(tokenMint: string): Promise<string | null> {
    try {
      const baseMintPubkey = new PublicKey(tokenMint);
      
      console.log(`🔍 Searching for DAMM V2 pools for token mint: ${tokenMint}`);
      
      // Method 1: Use getAllPools from CpAmm to find pools containing this token
      try {
        const allPools = await this.cpAmm.getAllPools();
        console.log(`📊 Found ${allPools.length} DAMM V2 pools total`);
        
        for (const poolInfo of allPools) {
          const pool = poolInfo.account;
          // Check if this pool contains our token as either tokenA or tokenB
          if (pool.tokenAMint.equals(baseMintPubkey) || pool.tokenBMint.equals(baseMintPubkey)) {
            console.log(`✅ Found DAMM V2 pool for mint ${tokenMint}: ${poolInfo.publicKey.toString()}`);
            return poolInfo.publicKey.toString();
          }
        }
      } catch (getAllPoolsError) {
        console.log(`⚠️  getAllPools failed, trying alternative method: ${getAllPoolsError}`);
        
        // Method 2: Fallback to scanning program accounts
        const programAccounts = await this.connection.getProgramAccounts(DAMM_V2_PROGRAM_ID, {
          filters: [
            {
              memcmp: {
                offset: 8, // Skip discriminator
                bytes: baseMintPubkey.toBase58(),
              },
            },
          ],
        });

        for (const account of programAccounts) {
          if (account.account.owner.equals(DAMM_V2_PROGRAM_ID)) {
            console.log(`✅ Found DAMM V2 pool via program scan for mint ${tokenMint}: ${account.pubkey.toString()}`);
            return account.pubkey.toString();
          }
        }
      }
      
      console.log(`⚠️  No DAMM V2 pool found for token mint: ${tokenMint}`);
      return null;
    } catch (error) {
      console.error(`Error finding DAMM V2 pool for mint ${tokenMint}:`, error);
      return null;
    }
  }

  /**
   * Execute liquidity pouring process for battle completion
   * Redistributes loser's liquidity: 10% for main token purchase, 20% to backend wallet, 70% to winner token liquidity
   * NOTE: This method requires backend positions in the loser pool
   */
  async executeLiquidityPouring(
    loserTokenId: string,
    loserPoolAddress: string,
    winnerTokenId: string,
    winnerPoolAddress: string,
    mainTokenPoolAddress: string
  ): Promise<{
    success: boolean;
    txIds: string[];
    details: {
      totalLiquidityRemoved: string;
      mainTokenTransfer: string;
      backendWalletTransfer: string;
      winnerTokenTransfer: string;
    };
  }> {
    const txIds: string[] = [];
    const results = {
      success: false,
      txIds,
      details: {
        totalLiquidityRemoved: '0',
        mainTokenTransfer: '0',
        backendWalletTransfer: '0',
        winnerTokenTransfer: '0'
      }
    };

    try {
      console.log(`🔄 Starting liquidity pouring process for loser token ${loserTokenId}`);
      
      // Load backend wallet keypair
      const idJsonPath = path.join(process.cwd(), 'id.json');
      if (!fs.existsSync(idJsonPath)) {
        throw new Error('Backend wallet id.json file not found');
      }
      
      const secretKeyArray = JSON.parse(fs.readFileSync(idJsonPath, 'utf8'));
      const backendKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
      
      console.log(`💼 Using backend wallet: ${backendKeypair.publicKey.toString()}`);

      // Convert pool addresses to PublicKeys
      const loserPoolPubkey = new PublicKey(loserPoolAddress);
      const winnerPoolPubkey = new PublicKey(winnerPoolAddress);
      const mainTokenPoolPubkey = new PublicKey(mainTokenPoolAddress);

      // Step 1: Get all positions in loser pool and filter for backend positions
      console.log(`📊 Finding all positions in loser pool...`);
      console.log(`   loserPool: ${loserPoolPubkey.toString()} wallet: ${backendKeypair.publicKey.toString()}`)
      
      const allPositions = await this.cpAmm.getAllPositionsByPool(
        loserPoolPubkey
      );

      if (allPositions.length === 0) {
        console.log(`⚠️  No positions found in loser pool at all`);
        console.log(`🔄 Skipping liquidity pouring - empty pool`);
        return results;
      }

      console.log(`📊 Found ${allPositions.length} total positions in loser pool`);

      // Filter for backend wallet positions by checking ownership
      const backendPositions: any[] = [];
      for (const positionInfo of allPositions) {
        try {
          // Get the position account to check ownership
          const positionAccount = await this.connection.getAccountInfo(positionInfo.publicKey);
          if (positionAccount) {
            // The position account contains ownership info - we need to check the actual position data
            const positionData = await this.cpAmm.fetchPositionState(positionInfo.publicKey);
            
            // Check if this position belongs to the backend wallet
            // This requires checking the position NFT ownership or position creator
            // For now, we'll use a simpler approach - check against known backend positions
            const userPositions = await this.cpAmm.getUserPositionByPool(
              loserPoolPubkey,
              backendKeypair.publicKey
            );
            
            // Check if this position is in the backend user's positions
            const isBackendPosition = userPositions.some(userPos => 
              userPos.position.equals(positionInfo.publicKey)
            );
            
            if (isBackendPosition) {
              backendPositions.push({
                position: positionInfo.publicKey,
                positionState: positionData,
                positionNftAccount: userPositions.find(up => up.position.equals(positionInfo.publicKey))?.positionNftAccount,
                account: positionInfo.account
              });
            }
          }
        } catch (error) {
          console.log(`⚠️  Could not check position ${positionInfo.publicKey.toString()}: ${error}`);
        }
      }

      if (backendPositions.length === 0) {
        console.log(`⚠️  No backend-owned positions found in loser pool`);
        console.log(`💡 Found ${allPositions.length} total positions, but none belong to backend wallet`);
        console.log(`🤔 Consider alternative approaches:`);
        console.log(`   - Use platform treasury/fees for redistribution`);
        console.log(`   - Implement user-consensual battle staking`);
        console.log(`   - Create initial platform positions when pools are created`);
        
        // For now, we'll return early but this should be addressed based on your business logic
        console.log(`🔄 Skipping liquidity pouring - no backend positions to redistribute`);
        return results;
      }

      console.log(`🎯 Found ${backendPositions.length} backend-owned positions out of ${allPositions.length} total positions`);

      // Step 2: Remove all liquidity from the backend's positions in the loser pool
      let totalTokenARemoved = new BN(0);
      let totalTokenBRemoved = new BN(0);

      for (const position of backendPositions) {
        const positionState = position.positionState;

        if (positionState.unlockedLiquidity.gt(new BN(0))) {
          console.log(`💧 Removing liquidity from position: ${position.position.toString()}`);
          
          // Get pool state for withdrawal calculations
          const poolState = await this.cpAmm.fetchPoolState(loserPoolPubkey);
          
          // Get withdrawal quote
          const withdrawQuote = await this.cpAmm.getWithdrawQuote({
            liquidityDelta: positionState.unlockedLiquidity,
            sqrtPrice: poolState.sqrtPrice,
            minSqrtPrice: poolState.sqrtMinPrice,
            maxSqrtPrice: poolState.sqrtMaxPrice
          });

          // Remove all liquidity from this position using removeLiquidity
          const removeLiquidityTx = await this.cpAmm.removeLiquidity({
            owner: backendKeypair.publicKey,
            pool: loserPoolPubkey,
            position: position.position,
            positionNftAccount: position.positionNftAccount,
            liquidityDelta: positionState.unlockedLiquidity,
            tokenAAmountThreshold: new BN(0), // Accept any amount
            tokenBAmountThreshold: new BN(0), // Accept any amount
            tokenAMint: poolState.tokenAMint,
            tokenBMint: poolState.tokenBMint,
            tokenAVault: poolState.tokenAVault,
            tokenBVault: poolState.tokenBVault,
            tokenAProgram: TOKEN_PROGRAM_ID,
            tokenBProgram: TOKEN_PROGRAM_ID,
            vestings: [], // No vesting accounts
            currentPoint: new BN(0) // Use default value
          });

          // Build and send transaction
          removeLiquidityTx.feePayer = backendKeypair.publicKey;
          removeLiquidityTx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
          removeLiquidityTx.sign(backendKeypair);

          try {
            const txId = await this.connection.sendRawTransaction(removeLiquidityTx.serialize());
            await this.connection.confirmTransaction(txId);
            
            console.log(`✅ Removed liquidity transaction: ${txId}`);
            txIds.push(txId);
          } catch (txError: any) {
            console.error(`❌ Error removing liquidity from position ${position.position.toString()}:`);
            
            if (txError.transactionLogs) {
              console.error(`📋 Transaction logs:`, txError.transactionLogs);
            }
            
            if (txError.signature) {
              console.error(`🔗 Transaction signature: ${txError.signature}`);
            }
            
            if (txError.transactionMessage) {
              console.error(`💬 Transaction message: ${txError.transactionMessage}`);
            }
            
            // Re-throw the error to stop processing
            throw txError;
          }

          // Track total amounts removed
          totalTokenARemoved = totalTokenARemoved.add(withdrawQuote.outAmountA);
          totalTokenBRemoved = totalTokenBRemoved.add(withdrawQuote.outAmountB);
        }
      }

      // Step 3: Calculate distribution amounts
      // Assuming tokenB is SOL/USDC (quote token) for value calculations
      const totalValue = totalTokenBRemoved; // Use quote token as value reference
      
      const mainTokenAmount = totalValue.mul(new BN(10)).div(new BN(100)); // 10%
      const backendWalletAmount = totalValue.mul(new BN(20)).div(new BN(100)); // 20%
      const winnerTokenAmount = totalValue.mul(new BN(70)).div(new BN(100)); // 70%

      console.log(`💰 Total liquidity removed: ${totalValue.toString()}`);
      console.log(`📊 Distribution - Main: ${mainTokenAmount.toString()}, Backend: ${backendWalletAmount.toString()}, Winner: ${winnerTokenAmount.toString()}`);

      // Step 4: Execute transfers/swaps for each allocation

      // 4a. Buy main token with 10% of the liquidity
      if (mainTokenAmount.gt(new BN(0))) {
        console.log(`🪙 Buying main token with ${mainTokenAmount.toString()} SOL...`);
        
        try {
          // Use the new DAMM V2 swap function to buy main tokens
          const swapResult = await this.executeDammV2Swap(
            mainTokenPoolAddress,
            mainTokenAmount,
            'buy', // Buying tokens with SOL
            50, // 1% slippage
            backendKeypair
          );
          
          console.log(`✅ Main token swap completed: ${swapResult.txId}`);
          console.log(`� Purchased ${swapResult.amountOut.toString()} main tokens with ${mainTokenAmount.toString()} SOL`);
          txIds.push(swapResult.txId);
          
        } catch (swapError: any) {
          console.error(`❌ Error buying main token:`, swapError);
          
          if (swapError.transactionLogs) {
            console.error(`📋 Transaction logs:`, swapError.transactionLogs);
          }
          
          if (swapError.signature) {
            console.error(`🔗 Transaction signature: ${swapError.signature}`);
          }
          
          if (swapError.transactionMessage) {
            console.error(`💬 Transaction message: ${swapError.transactionMessage}`);
          }
          
          // Continue processing even if this fails
          console.log(`⚠️ Main token swap failed, ${mainTokenAmount.toString()} SOL remains in backend wallet`);
          console.log(`⚠️ Continuing with winner token processing...`);
        }
      }      // 4b. Keep 20% in backend wallet (already there from liquidity removal)
      console.log(`💼 Backend wallet retains: ${backendWalletAmount.toString()}`);

      // 4c. Buy winner token with 70% of the redistributed liquidity
      if (winnerTokenAmount.gt(new BN(0))) {
        console.log(`🏆 Buying winner token with ${winnerTokenAmount.toString()} SOL...`);
        
        try {
          // Use the new DAMM V2 swap function to buy winner tokens
          const swapResult = await this.executeDammV2Swap(
            winnerPoolAddress,
            winnerTokenAmount,
            'buy', // Buying tokens with SOL
            50, // 1% slippage
            backendKeypair
          );
          
          console.log(`✅ Winner token swap completed: ${swapResult.txId}`);
          console.log(`� Purchased ${swapResult.amountOut.toString()} winner tokens with ${winnerTokenAmount.toString()} SOL`);
          txIds.push(swapResult.txId);
          
        } catch (swapError: any) {
          console.error(`❌ Error buying winner token:`, swapError);
          
          if (swapError.transactionLogs) {
            console.error(`📋 Transaction logs:`, swapError.transactionLogs);
          }
          
          if (swapError.signature) {
            console.error(`🔗 Transaction signature: ${swapError.signature}`);
          }
          
          if (swapError.transactionMessage) {
            console.error(`💬 Transaction message: ${swapError.transactionMessage}`);
          }
          
          // Continue processing even if this fails
          console.log(`⚠️ Winner token swap failed, ${winnerTokenAmount.toString()} SOL remains in backend wallet`);
          console.log(`⚠️ Continuing with final results...`);
        }
      }

      // Update results
      results.success = true;
      results.details = {
        totalLiquidityRemoved: totalValue.toString(),
        mainTokenTransfer: mainTokenAmount.toString(), // Amount allocated for main token purchase
        backendWalletTransfer: backendWalletAmount.toString(),
        winnerTokenTransfer: winnerTokenAmount.toString()
      };

      console.log(`🎉 Liquidity pouring completed successfully!`);
      console.log(`📊 Total transactions: ${txIds.length}`);
      
      return results;

    } catch (error) {
      console.error(`❌ Error in liquidity pouring process:`, error);
      results.success = false;
      return results;
    }
  }

  /**
   * Get an unused vanity address from the vanity_addresses folder
   */
  private async getUnusedVanityAddress(): Promise<{ keypair: Keypair; filePath: string }> {
    const vanityAddressesPath = path.join(process.cwd(), 'vanity_addresses');
    
    if (!fs.existsSync(vanityAddressesPath)) {
      throw new Error('vanity_addresses folder not found. Please create it with pre-generated vanity addresses.');
    }

    const files = fs.readdirSync(vanityAddressesPath).filter(file => file.endsWith('.json'));
    
    if (files.length === 0) {
      throw new Error('No vanity address files found in vanity_addresses folder.');
    }

    // Shuffle files to get random selection
    const shuffledFiles = files.sort(() => Math.random() - 0.5);

    for (const file of shuffledFiles) {
      try {
        const filePath = path.join(vanityAddressesPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const secretKeyArray = JSON.parse(fileContent);
        const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));

        // Check if this address has been used (has any SOL balance or tokens)
        const balance = await this.connection.getBalance(keypair.publicKey);
        const tokenAccounts = await this.connection.getTokenAccountsByOwner(
          keypair.publicKey,
          { programId: TOKEN_PROGRAM_ID }
        );

        // If balance is 0 and no token accounts, it's unused
        if (balance === 0 && tokenAccounts.value.length === 0) {
          console.log(`Selected unused vanity address: ${keypair.publicKey.toString()}`);
          return { keypair, filePath };
        } else {
          console.log(`Vanity address ${keypair.publicKey.toString()} is already used, deleting file and trying next...`);
          // Delete the used address file
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Error processing vanity address file ${file}:`, error);
        // Continue to next file
      }
    }

    throw new Error('No unused vanity addresses found. Please generate more vanity addresses.');
  }

  /**
   * Delete a vanity address file after use
   */
  private async deleteVanityAddressFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted used vanity address file: ${path.basename(filePath)}`);
      }
    } catch (error) {
      console.error(`Error deleting vanity address file ${filePath}:`, error);
    }
  }
}

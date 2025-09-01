import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { DynamicBondingCurveClient, buildCurve } from '@meteora-ag/dynamic-bonding-curve-sdk';
import BN from 'bn.js';
import type { 
  LaunchpadFormData,
  Pool,
  TradeQuote 
} from '../types';
import { 
  SOL_MINT,
  TokenDecimal,
  BaseFeeMode,
  ActivationType,
  CollectFeeMode,
  MigrationFeeOption,
  TokenType,
  TokenUpdateAuthorityOption,
  PLATFORM_CONFIG
} from '../constants';

export class LaunchpadService {
  private client: DynamicBondingCurveClient;
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
    this.client = new DynamicBondingCurveClient(connection, 'confirmed');
  }

  /**
   * Create a new token with bonding curve and first buy using createPoolWithFirstBuy
   */
  async createTokenWithFirstBuy(
    formData: LaunchpadFormData,
    configAddress: PublicKey,
    payer: PublicKey,
    buyAmount: BN,
    minimumAmountOut: BN,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<{
    poolAddress: string;
    baseMintAddress: string;
    txIds: string[];
  }> {
    // Generate keypair for the token mint
    const baseMintKeypair = Keypair.generate();

    // Create pool with first buy using SDK method
    const { createPoolTx, swapBuyTx } = await this.client.pool.createPoolWithFirstBuy({
      createPoolParam: {
        baseMint: baseMintKeypair.publicKey,
        config: configAddress,
        name: formData.name,
        symbol: formData.symbol,
        uri: formData.image || 'https://example.com/metadata.json',
        payer,
        poolCreator: payer,
      },
      firstBuyParam: {
        buyer: payer,
        buyAmount,
        minimumAmountOut,
        referralTokenAccount: null,
      },
    });

    const txIds: string[] = [];

    // Sign and send pool creation transaction
    createPoolTx.feePayer = payer;
    createPoolTx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    createPoolTx.partialSign(baseMintKeypair);
    
    const signedPoolTx = await signTransaction(createPoolTx);
    const poolTxId = await this.connection.sendRawTransaction(signedPoolTx.serialize());
    await this.connection.confirmTransaction(poolTxId);
    txIds.push(poolTxId);

    // Sign and send first buy transaction if available
    if (swapBuyTx) {
      swapBuyTx.feePayer = payer;
      swapBuyTx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      
      const signedSwapTx = await signTransaction(swapBuyTx);
      const swapTxId = await this.connection.sendRawTransaction(signedSwapTx.serialize());
      await this.connection.confirmTransaction(swapTxId);
      txIds.push(swapTxId);
    }

    // Derive pool address
    const poolAddress = this.derivePoolAddress(
      SOL_MINT,
      baseMintKeypair.publicKey,
      configAddress
    );

    return {
      poolAddress: poolAddress.toString(),
      baseMintAddress: baseMintKeypair.publicKey.toString(),
      txIds,
    };
  }

  /**
   * Create a new token with bonding curve using existing config
   */
  async createTokenWithConfig(
    formData: LaunchpadFormData,
    configAddress: PublicKey,
    payer: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<{
    poolAddress: string;
    baseMintAddress: string;
    txIds: string[];
  }> {
    // Generate keypair for the token mint
    const baseMintKeypair = Keypair.generate();

    // Create pool transaction directly
    const createPoolTx = await this.client.pool.createPool({
      payer,
      config: configAddress,
      baseMint: baseMintKeypair.publicKey,
      name: formData.name,
      symbol: formData.symbol,
      uri: formData.image || 'https://example.com/metadata.json',
      poolCreator: payer,
    });

    const txIds: string[] = [];

    // Sign and send pool transaction
    createPoolTx.feePayer = payer;
    createPoolTx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    createPoolTx.partialSign(baseMintKeypair);
    
    const signedPoolTx = await signTransaction(createPoolTx);
    const poolTxId = await this.connection.sendRawTransaction(signedPoolTx.serialize());
    await this.connection.confirmTransaction(poolTxId);
    txIds.push(poolTxId);

    // Derive pool address for initial buy
    const poolAddress = this.derivePoolAddress(
      SOL_MINT,
      baseMintKeypair.publicKey,
      configAddress
    );

    return {
      poolAddress: poolAddress.toString(),
      baseMintAddress: baseMintKeypair.publicKey.toString(),
      txIds,
    };
  }

  /**
   * Create a new token with bonding curve (legacy method - creates new config each time)
   */
  async createToken(
    formData: LaunchpadFormData,
    payer: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<{
    configAddress: string;
    poolAddress: string;
    baseMintAddress: string;
    txIds: string[];
  }> {
    // Generate keypairs
    const configKeypair = Keypair.generate();
    const baseMintKeypair = Keypair.generate();

        // Build curve configuration
    const curveConfig = buildCurve({
      totalTokenSupply: parseInt(formData.totalSupply),
      percentageSupplyOnMigration: 80, // 80% of supply on migration
      migrationQuoteThreshold: 10000000000, // 10 SOL threshold
      migrationOption: 1, // DAMM V2
      tokenBaseDecimal: TokenDecimal.SIX,
      tokenQuoteDecimal: TokenDecimal.NINE,
      lockedVestingParam: {
        totalLockedVestingAmount: 0,
        numberOfVestingPeriod: 0,
        cliffUnlockAmount: 0,
        totalVestingDuration: 0,
        cliffDurationFromMigrationTime: 0,
      },
      baseFeeParams: {
        baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
        feeSchedulerParam: {
          startingFeeBps: 500, // 5%
          endingFeeBps: 100,   // 1%
          numberOfPeriod: 0,
          totalDuration: 0,
        },
      },
      dynamicFeeEnabled: true,
      activationType: ActivationType.Slot,
      collectFeeMode: CollectFeeMode.QuoteToken,
      migrationFeeOption: MigrationFeeOption.FixedBps25,
      tokenType: TokenType.SPL,
      partnerLpPercentage: 0,
      creatorLpPercentage: 100,
      partnerLockedLpPercentage: 0,
      creatorLockedLpPercentage: 0,
      creatorTradingFeePercentage: 50,
      leftover: 0,
      tokenUpdateAuthority: TokenUpdateAuthorityOption.Immutable,
      migrationFee: {
        feePercentage: 0,
        creatorFeePercentage: 0,
      },
    });

    // Create config and pool with first buy
    const { createConfigTx, createPoolTx, swapBuyTx } = await this.client.pool.createConfigAndPoolWithFirstBuy({
      payer,
      config: configKeypair.publicKey,
      feeClaimer: payer,
      leftoverReceiver: payer,
      quoteMint: SOL_MINT,
      ...curveConfig,
      preCreatePoolParam: {
        baseMint: baseMintKeypair.publicKey,
        name: formData.name,
        symbol: formData.symbol,
        uri: formData.image || 'https://example.com/metadata.json',
        poolCreator: payer,
      },
      firstBuyParam: {
        buyer: payer,
        buyAmount: new BN(0.1 * 1e9), // 0.1 SOL
        minimumAmountOut: new BN(1),
        referralTokenAccount: null,
      },
    });

    const txIds: string[] = [];

    // Sign and send config transaction
    createConfigTx.feePayer = payer;
    createConfigTx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    createConfigTx.partialSign(configKeypair);
    
    const signedConfigTx = await signTransaction(createConfigTx);
    const configTxId = await this.connection.sendRawTransaction(signedConfigTx.serialize());
    await this.connection.confirmTransaction(configTxId);
    txIds.push(configTxId);

    // Sign and send pool transaction
    createPoolTx.feePayer = payer;
    createPoolTx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    createPoolTx.partialSign(baseMintKeypair);
    
    const signedPoolTx = await signTransaction(createPoolTx);
    const poolTxId = await this.connection.sendRawTransaction(signedPoolTx.serialize());
    await this.connection.confirmTransaction(poolTxId);
    txIds.push(poolTxId);

    // Sign and send first buy transaction
    if (swapBuyTx) {
      swapBuyTx.feePayer = payer;
      swapBuyTx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      
      const signedSwapTx = await signTransaction(swapBuyTx);
      const swapTxId = await this.connection.sendRawTransaction(signedSwapTx.serialize());
      await this.connection.confirmTransaction(swapTxId);
      txIds.push(swapTxId);
    }

    // Derive pool address
    const poolAddress = this.derivePoolAddress(
      SOL_MINT,
      baseMintKeypair.publicKey,
      configKeypair.publicKey
    );

    return {
      configAddress: configKeypair.publicKey.toString(),
      poolAddress: poolAddress.toString(),
      baseMintAddress: baseMintKeypair.publicKey.toString(),
      txIds,
    };
  }

  /**
   * Get all pools
   */
  async getAllPools(): Promise<Pool[]> {
    const poolAccounts = await this.client.state.getPoolsByConfig(PLATFORM_CONFIG);
    return poolAccounts.map(account => ({
      address: account.publicKey,
      baseMint: account.account.baseMint,
      quoteMint: SOL_MINT, // Use SOL as default quote mint
      poolCreator: account.publicKey, // Use pool address as fallback
      config: account.account.config,
      baseVault: account.account.baseVault,
      quoteVault: account.account.quoteVault,
      sqrtPrice: account.account.sqrtPrice,
      baseReserve: account.account.baseReserve,
      quoteReserve: account.account.quoteReserve,
      tradingFeeNumerator: new BN(0), // Use default value
      tradingFeeDenominator: new BN(10000), // Use default value
      migrationProgress: 0, // Will be calculated separately
    }));
  }

  /**
   * Get pool by address
   */
  async getPool(poolAddress: PublicKey): Promise<Pool | null> {
    const poolAccount = await this.client.state.getPool(poolAddress);
    if (!poolAccount) return null;

    const progress = await this.client.state.getPoolCurveProgress(poolAddress);

    return {
      address: poolAddress,
      baseMint: poolAccount.baseMint,
      quoteMint: SOL_MINT, // Use SOL as default quote mint
      poolCreator: poolAddress, // Use pool address as fallback
      config: poolAccount.config,
      baseVault: poolAccount.baseVault,
      quoteVault: poolAccount.quoteVault,
      sqrtPrice: poolAccount.sqrtPrice,
      baseReserve: poolAccount.baseReserve,
      quoteReserve: poolAccount.quoteReserve,
      tradingFeeNumerator: new BN(0), // Use default value
      tradingFeeDenominator: new BN(10000), // Use default value
      migrationProgress: progress,
    };
  }

  /**
   * Get swap quote
   */
  async getSwapQuote(
    poolAddress: PublicKey,
    amountIn: BN,
    swapBaseForQuote: boolean,
    slippageBps: number = 100
  ): Promise<TradeQuote> {
    const pool = await this.client.state.getPool(poolAddress);
    const config = await this.client.state.getPoolConfig(pool!.config);
    const currentSlot = await this.connection.getSlot();

    const quote = await this.client.pool.swapQuote({
      virtualPool: pool!,
      config,
      swapBaseForQuote,
      amountIn,
      slippageBps,
      hasReferral: false,
      currentPoint: new BN(currentSlot),
    });

    return {
      amountIn,
      amountOut: quote.amountOut,
      priceImpact: 0, // Use default value since property doesn't exist
      fee: new BN(0), // Use default value since property doesn't exist
      minimumAmountOut: quote.minimumAmountOut || new BN(0),
    };
  }

  /**
   * Execute swap
   */
  async executeSwap(
    poolAddress: PublicKey,
    owner: PublicKey,
    amountIn: BN,
    minimumAmountOut: BN,
    swapBaseForQuote: boolean,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<string> {
    const swapTx = await this.client.pool.swap({
      owner,
      amountIn,
      minimumAmountOut,
      swapBaseForQuote,
      pool: poolAddress,
      referralTokenAccount: null,
      payer: owner,
    });

    swapTx.feePayer = owner;
    swapTx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

    const signedTx = await signTransaction(swapTx);
    const txId = await this.connection.sendRawTransaction(signedTx.serialize());
    await this.connection.confirmTransaction(txId);

    return txId;
  }

  /**
   * Get pool migration progress
   */
  async getPoolProgress(poolAddress: PublicKey): Promise<number> {
    return await this.client.state.getPoolCurveProgress(poolAddress);
  }

  /**
   * Get pool migration threshold
   */
  async getMigrationThreshold(poolAddress: PublicKey): Promise<BN> {
    return await this.client.state.getPoolMigrationQuoteThreshold(poolAddress);
  }

  /**
   * Derive pool address
   */
  private derivePoolAddress(quoteMint: PublicKey, baseMint: PublicKey, config: PublicKey): PublicKey {
    // This would use the actual derive function from the SDK
    // For now, we'll return a placeholder
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('virtual_pool'),
        quoteMint.toBuffer(),
        baseMint.toBuffer(),
        config.toBuffer(),
      ],
      new PublicKey('dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN') // DBC Program ID
    )[0];
  }
}

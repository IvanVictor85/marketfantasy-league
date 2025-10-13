import { 
  PublicKey, 
  Transaction, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
  Connection,
  clusterApiUrl,
  Keypair,
  ComputeBudgetProgram
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { getConnectionSync, getConnection, PROGRAM_ID, solToLamports } from './connection';
import { heliusPriorityFeeService } from '../helius/priority-fee';

// Use synchronous connection for backward compatibility
const connection = getConnectionSync();

// League account structure
export interface League {
  admin: PublicKey;
  protocolTreasury: PublicKey;
  entryFee: number;
  maxPlayers: number;
  currentPlayers: number;
  startTime: number;
  endTime: number;
  isActive: boolean;
  totalPool: number;
  isDistributed: boolean;
  createdAt: number;
  bump: number;
}

// Generate PDA for league account
export const getLeaguePDA = async (admin: PublicKey): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [Buffer.from('league'), admin.toBuffer()],
    PROGRAM_ID
  );
};

// Generate PDA for treasury account
export const getTreasuryPDA = async (leagueKey: PublicKey): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [Buffer.from('treasury'), leagueKey.toBuffer()],
    PROGRAM_ID
  );
};

// Create league instruction
export const createLeagueInstruction = async (
  admin: PublicKey,
  protocolTreasury: PublicKey,
  entryFee: number,
  maxPlayers: number,
  startTime: number,
  endTime: number
): Promise<TransactionInstruction> => {
  const [leaguePDA] = await getLeaguePDA(admin);

  const data = Buffer.alloc(1 + 8 + 2 + 8 + 8); // instruction discriminator + entry_fee + max_players + start_time + end_time
  data.writeUInt8(0, 0); // instruction index for create_league
  data.writeBigUInt64LE(BigInt(entryFee), 1);
  data.writeUInt16LE(maxPlayers, 9);
  data.writeBigInt64LE(BigInt(startTime), 11);
  data.writeBigInt64LE(BigInt(endTime), 19);

  return new TransactionInstruction({
    keys: [
      { pubkey: leaguePDA, isSigner: false, isWritable: true },
      { pubkey: admin, isSigner: true, isWritable: true },
      { pubkey: protocolTreasury, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
};

// Join league instruction
export const joinLeagueInstruction = async (
  user: PublicKey,
  leagueKey: PublicKey,
  userTokenAccount: PublicKey,
  treasuryTokenAccount: PublicKey,
  tokenProgramId: PublicKey
): Promise<TransactionInstruction> => {
  const data = Buffer.alloc(1); // instruction discriminator
  data.writeUInt8(1, 0); // instruction index for join_league

  return new TransactionInstruction({
    keys: [
      { pubkey: leagueKey, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: treasuryTokenAccount, isSigner: false, isWritable: true },
      { pubkey: tokenProgramId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
};

// Distribute prizes instruction
export const distributePrizesInstruction = async (
  admin: PublicKey,
  leagueKey: PublicKey,
  winner1: PublicKey,
  winner2: PublicKey,
  winner3: PublicKey,
  treasuryTokenAccount: PublicKey,
  winner1TokenAccount: PublicKey,
  winner2TokenAccount: PublicKey,
  winner3TokenAccount: PublicKey,
  protocolTokenAccount: PublicKey,
  tokenProgramId: PublicKey
): Promise<TransactionInstruction> => {
  const [treasuryPDA] = await getTreasuryPDA(leagueKey);

  const data = Buffer.alloc(1 + 32 + 32 + 32); // instruction discriminator + 3 winner pubkeys
  data.writeUInt8(2, 0); // instruction index for distribute_prizes
  winner1.toBuffer().copy(data, 1);
  winner2.toBuffer().copy(data, 33);
  winner3.toBuffer().copy(data, 65);

  return new TransactionInstruction({
    keys: [
      { pubkey: leagueKey, isSigner: false, isWritable: true },
      { pubkey: admin, isSigner: true, isWritable: true },
      { pubkey: treasuryPDA, isSigner: false, isWritable: false },
      { pubkey: treasuryTokenAccount, isSigner: false, isWritable: true },
      { pubkey: winner1TokenAccount, isSigner: false, isWritable: true },
      { pubkey: winner2TokenAccount, isSigner: false, isWritable: true },
      { pubkey: winner3TokenAccount, isSigner: false, isWritable: true },
      { pubkey: protocolTokenAccount, isSigner: false, isWritable: true },
      { pubkey: tokenProgramId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
};

// Helper function to send and confirm transaction
// Cache for the last used blockhash to avoid duplicates
let lastBlockhash: string | null = null;
let lastBlockhashTime = 0;

// Cache for recent transactions to avoid duplicates
const recentTransactions = new Map<string, { signature: string; timestamp: number }>();
const TRANSACTION_CACHE_DURATION = 30000; // 30 seconds

// Clean old transactions from cache
const cleanTransactionCache = () => {
  const now = Date.now();
  for (const [key, value] of recentTransactions.entries()) {
    if (now - value.timestamp > TRANSACTION_CACHE_DURATION) {
      recentTransactions.delete(key);
    }
  }
};

// Helper function to check network connectivity with multiple attempts
const checkNetworkConnectivity = async (): Promise<boolean> => {
  const maxAttempts = 3;
  let lastError: any;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const conn = await getConnection();
      const response = await conn.getSlot();
      if (typeof response === 'number') {
        return true;
      }
    } catch (error) {
      lastError = error;
      console.warn(`Network connectivity check attempt ${attempt + 1} failed:`, error);
      
      // Wait a bit before retrying
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  console.error('All network connectivity attempts failed:', lastError);
  return false;
};



export const sendAndConfirmTransaction = async (
  wallet: WalletContextState,
  transaction: Transaction,
  setTransactionActive?: (active: boolean) => void,
  priorityLevel: 'low' | 'medium' | 'high' = 'medium'
): Promise<string> => {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  // Mark transaction as active to suppress wallet disconnect errors
  if (setTransactionActive) {
    setTransactionActive(true);
  }

  try {
    // Check network connectivity first (but don't fail immediately)
    const isConnected = await checkNetworkConnectivity();
    if (!isConnected) {
      console.warn('Network connectivity issues detected, but proceeding with transaction attempt...');
    }

    // Get optimal priority fee from Helius
    let priorityFee = 0;
    try {
      priorityFee = await heliusPriorityFeeService.getRecommendedPriorityFee(priorityLevel);
      console.log(`Using priority fee: ${heliusPriorityFeeService.formatPriorityFee(priorityFee)} (${priorityLevel} priority)`);
    } catch (error) {
      console.warn('Failed to get priority fee from Helius, using fallback:', error);
      // Fallback priority fees
      const fallbackFees = {
        low: 1000,      // 0.000001 SOL
        medium: 5000,   // 0.000005 SOL
        high: 10000     // 0.00001 SOL
      };
      priorityFee = fallbackFees[priorityLevel];
    }

    // Add priority fee instruction if needed
    if (priorityFee > 0) {
      const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFee
      });
      
      // Add compute unit limit instruction for better fee estimation
      const computeUnitLimitInstruction = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300000 // Reasonable limit for most transactions
      });
      
      // Insert priority fee instructions at the beginning
      transaction.instructions.unshift(computeUnitLimitInstruction, priorityFeeInstruction);
    }

    // Clean old transactions from cache
    cleanTransactionCache();

    // Create a unique key for this transaction based on instructions and payer
    const transactionKey = JSON.stringify({
      instructions: transaction.instructions.map(ix => ({
        programId: ix.programId.toString(),
        keys: ix.keys.map(k => ({ pubkey: k.pubkey.toString(), isSigner: k.isSigner, isWritable: k.isWritable })),
        data: Array.from(ix.data)
      })),
      feePayer: wallet.publicKey.toString()
    });

    // Check if we've recently sent this exact transaction
    const cachedTransaction = recentTransactions.get(transactionKey);
    if (cachedTransaction) {
      console.log('Transaction already sent recently, returning cached signature');
      return cachedTransaction.signature;
    }

    // Get a fresh blockhash with retry logic
     const getBlockhash = async (): Promise<string> => {
       let blockhash: string;
       let attempts = 0;
       const maxAttempts = 5;
       
       do {
         const conn = await getConnection();
         const blockHashInfo = await conn.getLatestBlockhash('finalized');
         blockhash = blockHashInfo.blockhash;
         
         // If this is a different blockhash or enough time has passed, use it
         if (blockhash !== lastBlockhash || Date.now() - lastBlockhashTime > 1000) {
           break;
         }
         
         // Wait a bit before trying again
         await new Promise(resolve => setTimeout(resolve, 200));
         attempts++;
       } while (attempts < maxAttempts);

       // Update cache
       lastBlockhash = blockhash;
       lastBlockhashTime = Date.now();
       
       return blockhash;
     };

    // Enhanced retry function that handles blockhash expiration
     const sendTransactionWithRetry = async (): Promise<string> => {
       let lastError: any;
       const maxRetries = 5;
       
       for (let attempt = 0; attempt <= maxRetries; attempt++) {
         try {
           // Get fresh blockhash for each attempt (especially important for retries)
           const blockhash = await getBlockhash();
           
           // Clone the transaction to avoid modifying the original
           const txClone = new Transaction();
           txClone.instructions = [...transaction.instructions];
           txClone.recentBlockhash = blockhash;
           
           if (!wallet.publicKey) {
             throw new Error('Carteira não conectada');
           }
           txClone.feePayer = wallet.publicKey;
       
           // Sign transaction
           let signedTransaction;
           try {
             if (!wallet.signTransaction) {
               throw new Error('Carteira não suporta assinatura de transações');
             }
             signedTransaction = await wallet.signTransaction(txClone);
           } catch (error: any) {
             if (error.message?.includes('User rejected') || error.message?.includes('rejected')) {
               throw new Error('Transação cancelada pelo usuário');
             }
             if (error.message?.includes('Unexpected error')) {
               throw new Error('Erro na carteira: Verifique se sua carteira está conectada adequadamente');
             }
             throw new Error(`Erro ao assinar transação: ${error.message}`);
           }
       
           // Send transaction
           const conn = await getConnection();
           const signature = await conn.sendRawTransaction(signedTransaction.serialize(), {
             skipPreflight: false,
             preflightCommitment: 'processed',
             maxRetries: 3
           });
       
           // Cache this transaction
           recentTransactions.set(transactionKey, {
             signature,
             timestamp: Date.now()
           });
       
           // Confirm transaction with timeout
           await Promise.race([
             conn.confirmTransaction(signature, 'confirmed'),
             new Promise((_, reject) => 
               setTimeout(() => reject(new Error('Transaction confirmation timeout')), 30000)
             )
           ]);
       
           return signature;
         } catch (error: any) {
           lastError = error;
           
           // Don't retry for certain types of errors (user-related or final errors)
           if (
             error.message?.includes('insufficient funds') ||
             error.message?.includes('already been processed') ||
             error.message?.includes('User rejected') ||
             error.message?.includes('Transaction cancelled') ||
             error.message?.includes('Invalid account') ||
             error.message?.includes('Account not found')
           ) {
             // Handle duplicate transaction error specially
             if (error.message?.includes('already been processed') || error.message?.includes('This transaction has already been processed')) {
               console.warn('Transaction already processed, checking for existing signature...');
               
               // Try to get recent signatures for this wallet
               try {
                 const conn = await getConnection();
                 const signatures = await conn.getSignaturesForAddress(wallet.publicKey!, { limit: 10 });
                 const recentSignature = signatures.find(sig => 
                   Math.abs(Date.now() / 1000 - (sig.blockTime || 0)) < 60 // Within last minute
                 );
                 
                 if (recentSignature) {
                   console.log('Found recent signature:', recentSignature.signature);
                   // Cache this transaction for future reference
                   recentTransactions.set(transactionKey, {
                     signature: recentSignature.signature,
                     timestamp: Date.now()
                   });
                   return recentSignature.signature;
                 }
               } catch (searchError) {
                 console.warn('Could not search for existing signature:', searchError);
               }
               
               // If we can't find the signature, throw a user-friendly error
               throw new Error('Esta transação já foi processada. Verifique seu saldo e tente novamente se necessário.');
             }
             
             // For other non-retryable errors, throw immediately
             if (error.message?.includes('insufficient funds')) {
               throw new Error('Saldo insuficiente para completar a transação.');
             }
             
             if (error.message?.includes('User rejected')) {
               throw new Error('Transação cancelada pelo usuário.');
             }
             
             throw error;
           }
           
           // Log retry attempt for retryable errors
           if (
             error.message?.includes('fetch') ||
             error.message?.includes('network') ||
             error.message?.includes('timeout') ||
             error.message?.includes('Blockhash not found') ||
             error.message?.includes('ENOTFOUND') ||
             error.message?.includes('ECONNREFUSED') ||
             error.message?.includes('Transaction confirmation timeout')
           ) {
             console.log(`Tentativa ${attempt + 1}/${maxRetries + 1} falhou devido a problema de rede/blockhash. Tentando novamente...`);
             
             // For blockhash errors, force getting a new blockhash by clearing cache
             if (error.message?.includes('Blockhash not found')) {
               lastBlockhash = '';
               lastBlockhashTime = 0;
               console.log('Blockhash expirado detectado, obtendo novo blockhash...');
             }
           }
           
           // If this is the last attempt, throw the error
           if (attempt === maxRetries) {
             break;
           }
           
           // Calculate delay with exponential backoff
           const delay = 1000 * Math.pow(2, attempt);
           console.log(`Tentativa ${attempt + 1} falhou, tentando novamente em ${delay}ms...`);
           await new Promise(resolve => setTimeout(resolve, delay));
         }
       }
       
       // If we get here, all retries failed
       console.error('Todas as tentativas de transação falharam:', lastError);
       
       // Provide user-friendly error messages
       if (lastError.message?.includes('Blockhash not found')) {
         throw new Error('Blockhash expirado após várias tentativas. Tente novamente em alguns segundos.');
       }
       
       if (
         lastError.message?.includes('fetch') ||
         lastError.message?.includes('network') ||
         lastError.message?.includes('timeout') ||
         lastError.message?.includes('ENOTFOUND') ||
         lastError.message?.includes('ECONNREFUSED') ||
         lastError.message?.includes('Transaction confirmation timeout')
       ) {
         throw new Error('Problema de conectividade com a rede Solana após várias tentativas. Verifique sua conexão.');
       }
       
       // For other errors, provide more context
       throw new Error(`Erro na transação após ${maxRetries + 1} tentativas: ${lastError.message || 'Erro desconhecido'}`);
     };

     // Execute the transaction with retry logic
     return await sendTransactionWithRetry();
  } finally {
    // Always reset transaction state
    if (setTransactionActive) {
      setTransactionActive(false);
    }
  }
};

// Fetch league account data
export const fetchLeagueAccount = async (leagueKey: PublicKey): Promise<League | null> => {
  try {
    const accountInfo = await connection.getAccountInfo(leagueKey);
    if (!accountInfo) return null;

    // Parse account data (simplified - in production, use proper deserialization)
    const data = accountInfo.data;
    // This is a simplified parser - in production, use proper Anchor deserialization
    
    return {
      admin: new PublicKey(data.slice(8, 40)),
      protocolTreasury: new PublicKey(data.slice(40, 72)),
      entryFee: Number(data.readBigUInt64LE(72)),
      maxPlayers: data.readUInt16LE(80),
      currentPlayers: data.readUInt16LE(82),
      startTime: Number(data.readBigInt64LE(84)),
      endTime: Number(data.readBigInt64LE(92)),
      isActive: data.readUInt8(100) === 1,
      totalPool: Number(data.readBigUInt64LE(101)),
      isDistributed: data.readUInt8(109) === 1,
      createdAt: Number(data.readBigInt64LE(110)),
      bump: data.readUInt8(118),
    };
  } catch (error) {
    console.error('Error fetching league account:', error);
    return null;
  }
};

// Generate PDA for user deposit account
export const getUserDepositPDA = async (user: PublicKey): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [Buffer.from('user_deposit'), user.toBuffer()],
    PROGRAM_ID
  );
};

// Platform treasury account where deposits are stored
const PLATFORM_TREASURY = new PublicKey('3GLFWDvTtxdmq6rSRFfeYExYVfpL5PTBR6LpfNq2eeFw'); // Real treasury account

// Add SOL to development treasury (for testing withdrawals)
export const addSolToTreasury = async (
  wallet: WalletContextState,
  amountSol: number,
  setTransactionActive?: (active: boolean) => void,
  priorityLevel: 'low' | 'medium' | 'high' = 'medium'
): Promise<string> => {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Carteira não conectada adequadamente');
  }

  setTransactionActive?.(true);

  try {
    const amountLamports = solToLamports(amountSol);
    const treasuryAddress = getDevelopmentTreasuryAddress();
    
    console.log('💰 Adding SOL to development treasury...');
    console.log(`Amount: ${amountSol} SOL (${amountLamports} lamports)`);
    console.log(`Treasury address: ${treasuryAddress.toString()}`);
    
    const transaction = new Transaction();
    
    // Add priority fee
    const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityLevel === 'high' ? 10000 : priorityLevel === 'medium' ? 5000 : 1000,
    });
    transaction.add(priorityFeeInstruction);
    
    // Transfer SOL from user to treasury
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: treasuryAddress,
      lamports: amountLamports,
    });
    transaction.add(transferInstruction);

    const signature = await sendAndConfirmTransaction(wallet, transaction, setTransactionActive, priorityLevel);
    
    console.log('✅ SOL added to treasury successfully!');
    console.log(`Transaction signature: ${signature}`);
    
    return signature;
  } catch (error) {
    console.error('❌ Failed to add SOL to treasury:', error);
    throw error;
  } finally {
    setTransactionActive?.(false);
  }
};

// Get the development treasury address (same as used in withdrawals)
export const getDevelopmentTreasuryAddress = (): PublicKey => {
  const treasuryKeypair = createSimpleTreasuryKeypair();
  return treasuryKeypair.publicKey;
};

// Deposit SOL to platform (temporary implementation using direct transfer)
export const depositSolInstruction = async (
  user: PublicKey,
  amount: number // amount in lamports
): Promise<TransactionInstruction> => {
  // Use the development treasury for consistency with withdrawals
  const treasuryAddress = getDevelopmentTreasuryAddress();
  
  return SystemProgram.transfer({
    fromPubkey: user,
    toPubkey: treasuryAddress,
    lamports: amount,
  });
};

// Deposit SOL to platform (high-level function)
export const depositSol = async (
  wallet: WalletContextState,
  amountSol: number,
  setTransactionActive?: (active: boolean) => void,
  priorityLevel: 'low' | 'medium' | 'high' = 'medium'
): Promise<string> => {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const amountLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);
  
  const transaction = new Transaction();
  const depositInstruction = await depositSolInstruction(wallet.publicKey, amountLamports);
  transaction.add(depositInstruction);

  const signature = await sendAndConfirmTransaction(wallet, transaction, setTransactionActive, priorityLevel);
  
  // Update local storage with the deposited amount
  updateUserDepositedBalance(wallet.publicKey, amountLamports);
  
  return signature;
};

// Temporary storage for user deposits (in production, this would be on-chain)
const getUserDepositsKey = (user: PublicKey) => `user_deposits_${user.toString()}`;

// Get user's deposited balance (temporary implementation using localStorage)
export const getUserDepositedBalance = async (user: PublicKey): Promise<number> => {
  try {
    if (typeof window === 'undefined') return 0;
    
    const depositsKey = getUserDepositsKey(user);
    const storedBalance = localStorage.getItem(depositsKey);
    
    return storedBalance ? parseInt(storedBalance, 10) : 0;
  } catch (error) {
    console.error('Error fetching user deposit balance:', error);
    return 0;
  }
};

// Update user's deposited balance (temporary implementation)
const updateUserDepositedBalance = (user: PublicKey, amount: number) => {
  try {
    if (typeof window === 'undefined') return;
    
    const depositsKey = getUserDepositsKey(user);
    const currentBalance = parseInt(localStorage.getItem(depositsKey) || '0', 10);
    const newBalance = currentBalance + amount;
    
    localStorage.setItem(depositsKey, newBalance.toString());
  } catch (error) {
    console.error('Error updating user deposit balance:', error);
  }
};

// Check if user has sufficient deposited balance
export const hasDepositedBalance = async (user: PublicKey, requiredAmount: number): Promise<boolean> => {
  const depositedBalance = await getUserDepositedBalance(user);
  return depositedBalance >= requiredAmount;
};

// Get platform treasury balance
export const getPlatformTreasuryBalance = async (): Promise<number> => {
  try {
    const treasuryAddress = getDevelopmentTreasuryAddress();
    const balance = await connection.getBalance(treasuryAddress);
    return balance;
  } catch (error) {
    console.error('Error fetching treasury balance:', error);
    return 0;
  }
};

// Get platform treasury address
export const getPlatformTreasuryAddress = (): string => {
  const treasuryAddress = getDevelopmentTreasuryAddress();
  return treasuryAddress.toString();
};

// Create withdrawal instruction from platform treasury to user
export const withdrawSolInstruction = async (
  userPublicKey: PublicKey,
  amount: number // amount in lamports
): Promise<TransactionInstruction> => {
  // Create transfer instruction from platform treasury to user
  return SystemProgram.transfer({
    fromPubkey: PLATFORM_TREASURY,
    toPubkey: userPublicKey,
    lamports: amount,
  });
};

// ⚠️ DEVELOPMENT ONLY: Create a deterministic keypair for treasury operations
// This is NOT secure and should NEVER be used in production!
const createDevelopmentTreasuryKeypair = (): Keypair => {
  // Use a fixed seed for development consistency - this creates a simple account
  const seed = new Uint8Array(32);
  seed.fill(42); // Fill with a fixed value for deterministic generation
  return Keypair.fromSeed(seed);
};

// Create a simple treasury account that can be used with SystemProgram.transfer
const createSimpleTreasuryKeypair = (): Keypair => {
  // Use a completely different approach - generate a random keypair for clean account
  // In development, we'll use a deterministic but different seed
  const seed = new Uint8Array(32);
  // Use a pattern that ensures a clean account
  for (let i = 0; i < 32; i++) {
    seed[i] = (i * 7 + 89) % 256; // Mathematical pattern for deterministic but clean account
  }
  return Keypair.fromSeed(seed);
};

// Withdraw SOL from platform (development implementation with real transfer)
// Note: In production, this would be handled by a smart contract with proper authorization
export const withdrawSolReal = async (
  wallet: WalletContextState, 
  amountSol: number,
  setTransactionActive?: (active: boolean) => void,
  priorityLevel: 'low' | 'medium' | 'high' = 'medium'
): Promise<string> => {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Carteira não conectada adequadamente');
  }

  setTransactionActive?.(true);

  try {
    const amountLamports = solToLamports(amountSol);
    
    // Check if user has sufficient deposited balance
    const userBalance = await getUserDepositedBalance(wallet.publicKey);
    if (userBalance < amountLamports) {
      throw new Error(`Saldo insuficiente. Você tem ${userBalance / LAMPORTS_PER_SOL} SOL depositados, mas está tentando sacar ${amountSol} SOL.`);
    }

    console.log('🚀 Attempting REAL SOL withdrawal from treasury...');
    console.log(`💰 Amount: ${amountSol} SOL (${amountLamports} lamports)`);
    console.log(`👤 User address: ${wallet.publicKey.toString()}`);
    
    // ⚠️ DEVELOPMENT ONLY: Use simple treasury keypair for transfers
    // In production, this would be handled by a secure backend service
    const treasuryKeypair = createSimpleTreasuryKeypair();
    const treasuryAddress = treasuryKeypair.publicKey;
    
    console.log(`🏦 Treasury address: ${treasuryAddress.toString()}`);
    
    // Check treasury balance and account info
    const treasuryBalance = await connection.getBalance(treasuryAddress);
    console.log(`💰 Treasury balance: ${treasuryBalance / LAMPORTS_PER_SOL} SOL`);
    
    if (treasuryBalance < amountLamports) {
      throw new Error(`Treasury tem saldo insuficiente. Saldo atual: ${treasuryBalance / LAMPORTS_PER_SOL} SOL, necessário: ${amountSol} SOL`);
    }

    // Log treasury account info for debugging
    const treasuryAccountInfo = await connection.getAccountInfo(treasuryAddress);
    console.log(`🔍 Treasury account info:`, {
      exists: !!treasuryAccountInfo,
      dataLength: treasuryAccountInfo?.data.length || 0,
      owner: treasuryAccountInfo?.owner.toString() || 'None'
    });

    // Create the actual transfer transaction from treasury to user
    const transaction = new Transaction();
    
    // Add priority fee for faster processing
    const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityLevel === 'high' ? 10000 : priorityLevel === 'medium' ? 5000 : 1000,
    });
    transaction.add(priorityFeeInstruction);
    
    // Add the actual SOL transfer from treasury to user
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: treasuryAddress,
      toPubkey: wallet.publicKey,
      lamports: amountLamports,
    });
    transaction.add(transferInstruction);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey; // User pays the transaction fee

    // Sign the transaction with both treasury keypair and user wallet
    transaction.partialSign(treasuryKeypair);
    
    // User must also sign the transaction since they're paying the fee
    const signedTransaction = await wallet.signTransaction!(transaction);

    // Send the transaction
    console.log('📤 Sending withdrawal transaction...');
    const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    // Wait for confirmation
    console.log('⏳ Waiting for transaction confirmation...');
    await connection.confirmTransaction(signature, 'confirmed');

    // Update user's deposited balance (subtract withdrawn amount)
    updateUserDepositedBalance(wallet.publicKey, -amountLamports);

    console.log(`✅ REAL SOL withdrawal completed successfully!`);
    console.log(`📝 Transaction signature: ${signature}`);
    console.log(`💰 Amount transferred: ${amountSol} SOL`);
    console.log(`🎯 From treasury: ${treasuryAddress.toString()}`);
    console.log(`🎯 To user: ${wallet.publicKey.toString()}`);
    console.log(`🏦 Updated user's deposited balance`);
    
    return signature;
  } catch (error) {
    console.error('❌ Real withdrawal failed:', error);
    
    // Handle specific error types for better user experience
    if (error instanceof Error) {
      if (error.message?.includes('User rejected') || error.message?.includes('rejected')) {
        throw new Error('Transação cancelada pelo usuário');
      }
      if (error.message?.includes('Wallet not connected')) {
        throw new Error('Carteira não conectada adequadamente');
      }
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Fundos insuficientes no treasury para processar o saque');
      }
    }
    
    throw error;
  } finally {
    // Ensure transaction state is always reset, even if there's an unexpected error
    setTransactionActive?.(false);
  }
};

// Withdraw SOL from platform (simplified implementation for current use)
export const withdrawSol = async (
  wallet: WalletContextState, 
  amountSol: number,
  setTransactionActive?: (active: boolean) => void,
  priorityLevel: 'low' | 'medium' | 'high' = 'medium'
): Promise<string> => {
  // For now, use the real implementation
  return withdrawSolReal(wallet, amountSol, setTransactionActive, priorityLevel);
};
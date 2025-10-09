import { 
  PublicKey, 
  Transaction, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { getConnectionSync, getConnection, PROGRAM_ID, solToLamports } from './connection';

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

// Helper function to check network connectivity
const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    const conn = await getConnection();
    const response = await conn.getSlot();
    return typeof response === 'number';
  } catch (error) {
    console.warn('Network connectivity check failed:', error);
    return false;
  }
};

// Helper function to retry with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry for certain types of errors
      if (
        error.message?.includes('insufficient funds') ||
        error.message?.includes('already been processed') ||
        error.message?.includes('User rejected') ||
        error.message?.includes('Transaction cancelled')
      ) {
        throw error;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

export const sendAndConfirmTransaction = async (
  wallet: WalletContextState,
  transaction: Transaction
): Promise<string> => {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  // Check network connectivity first
  const isConnected = await checkNetworkConnectivity();
  if (!isConnected) {
    throw new Error('Erro de conectividade. Verifique sua conexão com a internet e tente novamente.');
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

  const blockhash = await retryWithBackoff(getBlockhash);
  
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;

  // Sign transaction
  const signedTransaction = await wallet.signTransaction(transaction);

  // Send transaction with retry logic and improved error handling
  return await retryWithBackoff(async () => {
    try {
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
      // If it's a duplicate transaction error, check if we can find the signature
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
      
      // Handle network-related errors
      if (
        error.message?.includes('Blockhash not found') ||
        error.message?.includes('fetch') ||
        error.message?.includes('network') ||
        error.message?.includes('timeout') ||
        error.message?.includes('ENOTFOUND') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('Transaction confirmation timeout')
      ) {
        throw new Error('Erro de rede. Tente novamente em alguns segundos.');
      }
      
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Saldo insuficiente para completar a transação.');
      }
      
      // For other errors, provide more context
      console.error('Transaction error:', error);
      throw new Error(`Erro na transação: ${error.message || 'Erro desconhecido'}`);
    }
  });
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

// Temporary platform treasury (in production, this would be managed by the smart contract)
const PLATFORM_TREASURY = new PublicKey('11111111111111111111111111111112'); // System Program as placeholder treasury

// Deposit SOL to platform (temporary implementation using direct transfer)
export const depositSolInstruction = async (
  user: PublicKey,
  amount: number // amount in lamports
): Promise<TransactionInstruction> => {
  // For now, we'll use a simple transfer to a platform treasury
  // In production, this would be handled by a smart contract
  return SystemProgram.transfer({
    fromPubkey: user,
    toPubkey: PLATFORM_TREASURY,
    lamports: amount,
  });
};

// Deposit SOL to platform (high-level function)
export const depositSol = async (
  wallet: WalletContextState,
  amountSol: number
): Promise<string> => {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const amountLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);
  
  const transaction = new Transaction();
  const depositInstruction = await depositSolInstruction(wallet.publicKey, amountLamports);
  transaction.add(depositInstruction);

  const signature = await sendAndConfirmTransaction(wallet, transaction);
  
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

// Withdraw SOL from platform (temporary implementation)
export const withdrawSol = async (wallet: WalletContextState, amountSol: number): Promise<string> => {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const amountLamports = solToLamports(amountSol);
  
  // Check if user has sufficient deposited balance
  const depositedBalance = await getUserDepositedBalance(wallet.publicKey);
  if (depositedBalance < amountLamports) {
    throw new Error('Saldo insuficiente na plataforma para retirada');
  }

  // Create withdrawal transaction (transfer from platform treasury to user)
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: PLATFORM_TREASURY,
      toPubkey: wallet.publicKey,
      lamports: amountLamports,
    })
  );

  // Send and confirm transaction
  const signature = await sendAndConfirmTransaction(wallet, transaction);

  // Update user's deposited balance (subtract withdrawn amount)
  updateUserDepositedBalance(wallet.publicKey, -amountLamports);

  return signature;
};
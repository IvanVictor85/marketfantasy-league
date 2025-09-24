import { 
  PublicKey, 
  Transaction, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { connection, PROGRAM_ID } from './connection';

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
export const sendAndConfirmTransaction = async (
  wallet: WalletContextState,
  transaction: Transaction
): Promise<string> => {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;

  // Sign transaction
  const signedTransaction = await wallet.signTransaction(transaction);

  // Send transaction
  const signature = await connection.sendRawTransaction(signedTransaction.serialize());

  // Confirm transaction
  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
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
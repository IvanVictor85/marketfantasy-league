import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';

// Solana connection configuration
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK as 'devnet' | 'mainnet-beta' | 'testnet' || 'devnet';

// Use a more reliable RPC endpoint for devnet
const getOptimalRpcUrl = () => {
  if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  }
  
  // Use Helius free tier for better reliability
  if (SOLANA_NETWORK === 'devnet') {
    return 'https://devnet.helius-rpc.com/?api-key=demo';
  }
  
  return clusterApiUrl(SOLANA_NETWORK);
};

export const RPC_URL = getOptimalRpcUrl();

// Program ID (will be updated after deployment)
export const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || '11111111111111111111111111111112');

// Create connection instance with better configuration
export const connection = new Connection(RPC_URL, {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
});

// Helper function to get connection
export const getConnection = () => connection;

// Helper function to get program ID
export const getProgramId = () => PROGRAM_ID;

// Utility to check if wallet is connected
export const isWalletConnected = (publicKey: PublicKey | null): boolean => {
  return publicKey !== null;
};

// Utility to format SOL amount
export const formatSolAmount = (lamports: number): string => {
  return (lamports / 1e9).toFixed(4);
};

// Utility to convert SOL to lamports
export const solToLamports = (sol: number): number => {
  return Math.floor(sol * 1e9);
};

// Utility to convert lamports to SOL
export const lamportsToSol = (lamports: number): number => {
  return lamports / 1e9;
};
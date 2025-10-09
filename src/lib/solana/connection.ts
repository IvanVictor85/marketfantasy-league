import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';

// Solana connection configuration
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK as 'devnet' | 'mainnet-beta' | 'testnet' || 'devnet';

// List of RPC endpoints for fallback
const getRpcEndpoints = () => {
  const endpoints: string[] = [];
  
  // Add custom RPC URL if provided
  if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
    endpoints.push(process.env.NEXT_PUBLIC_SOLANA_RPC_URL);
  }
  
  // Add network-specific endpoints
  if (SOLANA_NETWORK === 'devnet') {
    endpoints.push(
      'https://devnet.helius-rpc.com/?api-key=demo',
      'https://api.devnet.solana.com',
      clusterApiUrl('devnet')
    );
  } else if (SOLANA_NETWORK === 'mainnet-beta') {
    endpoints.push(
      'https://api.mainnet-beta.solana.com',
      clusterApiUrl('mainnet-beta')
    );
  } else {
    endpoints.push(clusterApiUrl(SOLANA_NETWORK));
  }
  
  return [...new Set(endpoints)]; // Remove duplicates
};

const RPC_ENDPOINTS = getRpcEndpoints();
let currentEndpointIndex = 0;

// Use a more reliable RPC endpoint for devnet
const getOptimalRpcUrl = () => {
  return RPC_ENDPOINTS[currentEndpointIndex] || clusterApiUrl(SOLANA_NETWORK);
};

export const RPC_URL = getOptimalRpcUrl();

// Program ID (will be updated after deployment)
export const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || '11111111111111111111111111111112');

// Create connection instance with better configuration
let connection = new Connection(RPC_URL, {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
});

// Function to test RPC endpoint connectivity
const testRpcEndpoint = async (url: string): Promise<boolean> => {
  try {
    const testConnection = new Connection(url, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 5000,
    });
    
    // Test with a simple call
    await testConnection.getSlot();
    return true;
  } catch (error) {
    console.warn(`RPC endpoint ${url} failed connectivity test:`, error);
    return false;
  }
};

// Function to switch to next available RPC endpoint
export const switchToNextRpcEndpoint = async (): Promise<boolean> => {
  const startIndex = currentEndpointIndex;
  
  do {
    currentEndpointIndex = (currentEndpointIndex + 1) % RPC_ENDPOINTS.length;
    const newUrl = RPC_ENDPOINTS[currentEndpointIndex];
    
    console.log(`Trying RPC endpoint: ${newUrl}`);
    
    if (await testRpcEndpoint(newUrl)) {
      console.log(`Successfully switched to RPC endpoint: ${newUrl}`);
      
      // Create new connection with the working endpoint
      connection = new Connection(newUrl, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
      });
      
      return true;
    }
  } while (currentEndpointIndex !== startIndex);
  
  console.error('All RPC endpoints failed connectivity test');
  return false;
};

// Function to get connection with automatic fallback
export const getConnection = async (): Promise<Connection> => {
  // Test current connection
  try {
    await connection.getSlot();
    return connection;
  } catch (error) {
    console.warn('Current RPC endpoint failed, trying fallback...');
    
    // Try to switch to a working endpoint
    const switched = await switchToNextRpcEndpoint();
    if (switched) {
      return connection;
    }
    
    // If all endpoints fail, return the current connection anyway
    // The calling code will handle the error
    return connection;
  }
};

// Helper function to get connection (synchronous version for backward compatibility)
export const getConnectionSync = () => connection;

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
// Helius API configuration
export const HELIUS_CONFIG = {
  // Base URLs for different environments
  baseUrl: {
    devnet: 'https://api.helius.xyz',
  mainnet: 'https://api.helius.xyz',
  testnet: 'https://api.helius.xyz'
  },
  
  // RPC URLs
  rpcUrl: {
    devnet: 'https://devnet.helius-rpc.com',
  mainnet: 'https://mainnet.helius-rpc.com',
  testnet: 'https://testnet.helius-rpc.com'
  },
  
  // API endpoints
  endpoints: {
    priorityFee: '/v0/transactions/priority-fee-estimate',
    enhancedTransactions: '/v0/transactions',
    webhooks: '/v0/webhooks',
    addressTransactions: '/v0/addresses/{address}/transactions'
  },
  
  // Default configurations
  defaults: {
    priorityLevel: 'medium' as const,
    commitment: 'confirmed' as const,
    maxRetries: 3,
    timeout: 10000 // Reduced from 30s to 10s for better UX
  }
};

// Get API key from environment
export const getHeliusApiKey = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY || process.env.HELIUS_API_KEY;
  
  if (!apiKey || apiKey === 'demo') {
    console.warn('⚠️ [HELIUS] API key não configurada. Usando RPC público do Solana.');
    return 'public'; // Usar RPC público em vez de demo
  }
  
  return apiKey;
};

// Get current network
export const getCurrentNetwork = (): 'devnet' | 'mainnet' | 'testnet' => {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK as 'devnet' | 'mainnet-beta' | 'testnet';
  
  // Map mainnet-beta to mainnet for Helius
  if (network === 'mainnet-beta') {
    return 'mainnet';
  }
  
  return network || 'devnet';
};

// Build API URL with key
export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  const network = getCurrentNetwork();
  const baseUrl = HELIUS_CONFIG.baseUrl[network];
  const apiKey = getHeliusApiKey();
  
  let url = `${baseUrl}${endpoint}?api-key=${apiKey}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `&${searchParams.toString()}`;
  }
  
  return url;
};

// Build RPC URL with key
export const buildRpcUrl = (): string => {
  const network = getCurrentNetwork();
  const apiKey = getHeliusApiKey();
  
  // Se não há API key válida, usar RPC público do Solana
  if (apiKey === 'public') {
    return network === 'devnet' 
      ? 'https://api.devnet.solana.com'
      : 'https://api.mainnet-beta.solana.com';
  }
  
  const rpcUrl = HELIUS_CONFIG.rpcUrl[network];
  return `${rpcUrl}?api-key=${apiKey}`;
};

// Priority levels mapping
export const PRIORITY_LEVELS = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  veryHigh: 4,
  unsafeMax: 5
} as const;

export type PriorityLevel = keyof typeof PRIORITY_LEVELS;
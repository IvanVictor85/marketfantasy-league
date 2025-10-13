import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { buildApiUrl, buildRpcUrl, HELIUS_CONFIG, PriorityLevel, PRIORITY_LEVELS } from './config';

// Types for Priority Fee API
export interface PriorityFeeRequest {
  transaction?: string; // Base64 encoded serialized transaction
  accountKeys?: string[]; // Array of account public keys
  options?: {
    priorityLevel?: PriorityLevel;
    includeAllPriorityFeeLevels?: boolean;
    transactionEncoding?: 'base58' | 'base64';
    lookupTables?: string[];
  };
}

export interface PriorityFeeResponse {
  priorityFeeEstimate: number;
  priorityFeeLevels?: {
    none: number;
    low: number;
    medium: number;
    high: number;
    veryHigh: number;
    unsafeMax: number;
  };
}

export interface PriorityFeeError {
  error: {
    code: number;
    message: string;
  };
}

// Priority Fee Service Class
export class HeliusPriorityFeeService {
  private static instance: HeliusPriorityFeeService;
  
  public static getInstance(): HeliusPriorityFeeService {
    if (!HeliusPriorityFeeService.instance) {
      HeliusPriorityFeeService.instance = new HeliusPriorityFeeService();
    }
    return HeliusPriorityFeeService.instance;
  }

  /**
   * Get priority fee estimate using a serialized transaction
   */
  async getPriorityFeeForTransaction(
    transaction: Transaction | VersionedTransaction,
    options?: {
      priorityLevel?: PriorityLevel;
      includeAllPriorityFeeLevels?: boolean;
    }
  ): Promise<PriorityFeeResponse> {
    const startTime = Date.now();
    
    try {
      console.log('[Helius] Getting priority fee for transaction', {
        transactionType: transaction instanceof Transaction ? 'Transaction' : 'VersionedTransaction',
        options
      });

      // Serialize transaction to base64
      const serializedTx = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });
      const base64Transaction = Buffer.from(serializedTx).toString('base64');

      const request: PriorityFeeRequest = {
        transaction: base64Transaction,
        options: {
          priorityLevel: options?.priorityLevel || HELIUS_CONFIG.defaults.priorityLevel,
          includeAllPriorityFeeLevels: options?.includeAllPriorityFeeLevels || false,
          transactionEncoding: 'base64'
        }
      };

      const result = await this.makePriorityFeeRequest(request);
      
      const duration = Date.now() - startTime;
      console.log(`[Helius] Transaction priority fee request completed in ${duration}ms`, {
        priorityFeeEstimate: result.priorityFeeEstimate,
        levelsCount: result.priorityFeeLevels ? Object.keys(result.priorityFeeLevels).length : 0
      });

      return result;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      console.error(`[Helius] Transaction priority fee request failed after ${duration}ms:`, {
        error: error instanceof Error ? error.message : String(error),
        transactionType: transaction instanceof Transaction ? 'Transaction' : 'VersionedTransaction',
        options
      });
      throw new Error(`Failed to get priority fee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get priority fee estimate using account keys
   */
  async getPriorityFeeForAccounts(
    accountKeys: (PublicKey | string)[],
    options?: {
      priorityLevel?: PriorityLevel;
      includeAllPriorityFeeLevels?: boolean;
    }
  ): Promise<PriorityFeeResponse> {
    const startTime = Date.now();
    
    try {
      const accountStrings = accountKeys.map(key => 
        typeof key === 'string' ? key : key.toString()
      );

      console.log(`[Helius] Getting priority fee for ${accountStrings.length} accounts`, {
        accountKeys: accountStrings.slice(0, 3), // Log first 3 for debugging
        options
      });

      const request: PriorityFeeRequest = {
        accountKeys: accountStrings,
        options: {
          priorityLevel: options?.priorityLevel || HELIUS_CONFIG.defaults.priorityLevel,
          includeAllPriorityFeeLevels: options?.includeAllPriorityFeeLevels || false
        }
      };

      const result = await this.makePriorityFeeRequest(request);
      
      const duration = Date.now() - startTime;
      console.log(`[Helius] Priority fee request completed in ${duration}ms`, {
        priorityFeeEstimate: result.priorityFeeEstimate,
        levelsCount: result.priorityFeeLevels ? Object.keys(result.priorityFeeLevels).length : 0
      });

      return result;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      
      // Check if this is a getPriorityFeeEstimate availability error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('getPriorityFeeEstimate is not available') || 
          errorMessage.includes('Invalid request parameters') ||
          errorMessage.includes('-32600')) {
        console.warn('[Helius] getPriorityFeeEstimate not available, using Solana RPC fallback');
        try {
          const accountStrings = accountKeys.map(key => 
            typeof key === 'string' ? key : key.toString()
          );
          const request: PriorityFeeRequest = {
            accountKeys: accountStrings,
            options: {
              includeAllPriorityFeeLevels: true,
              ...options
            }
          };
          return await this.getSolanaRpcPriorityFee(request);
        } catch (fallbackError) {
          console.error('[Helius] Solana RPC fallback also failed:', fallbackError);
          // Return default values as last resort
          const defaultLevel = options?.priorityLevel || 'medium';
          const defaultFees = {
            none: 0,
            low: 1000,
            medium: 5000,
            high: 10000,
            veryHigh: 50000,
            unsafeMax: 100000
          };
          
          console.warn('[Helius] Using default priority fees as fallback');
          return {
            priorityFeeEstimate: defaultFees[defaultLevel],
            priorityFeeLevels: defaultFees
          };
        }
      }
      
      // Log timeout/network errors more quietly
      if (duration >= HELIUS_CONFIG.defaults.timeout - 1000 || errorMessage.includes('timeout') || errorMessage.includes('network')) {
        console.warn(`[Helius] Priority fee request timed out after ${duration}ms, using fallback`);
      } else {
        console.warn(`[Helius] Priority fee request failed after ${duration}ms:`, errorMessage);
      }
      
      // Return default values instead of throwing error
      const defaultLevel = options?.priorityLevel || 'medium';
      const defaultFees = {
        none: 0,
        low: 1000,
        medium: 5000,
        high: 10000,
        veryHigh: 50000,
        unsafeMax: 100000
      };
      
      console.log('[Helius] Using default priority fees as fallback');
      return {
        priorityFeeEstimate: defaultFees[defaultLevel as keyof typeof defaultFees] || defaultFees.medium,
        priorityFeeLevels: defaultFees
      };
    }
  }

  /**
   * Get priority fee estimate for common program interactions
   */
  async getPriorityFeeForProgram(
    programId: PublicKey | string,
    priorityLevel: PriorityLevel = 'medium'
  ): Promise<PriorityFeeResponse> {
    try {
      const programKey = typeof programId === 'string' ? programId : programId.toString();
      
      return await this.getPriorityFeeForAccounts([programKey], {
        priorityLevel,
        includeAllPriorityFeeLevels: true
      });
    } catch (error: unknown) {
      console.error('Error getting priority fee for program:', error);
      throw new Error(`Failed to get priority fee for program: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get recommended priority fee based on network conditions
   */
  async getRecommendedPriorityFee(
    urgency: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<number> {
    try {
      // Map urgency to priority level
      const priorityLevelMap = {
        low: 'low' as const,
        medium: 'medium' as const,
        high: 'veryHigh' as const
      };

      const response = await this.getPriorityFeeForAccounts([], {
        priorityLevel: priorityLevelMap[urgency],
        includeAllPriorityFeeLevels: true
      });

      return response.priorityFeeEstimate;
    } catch (error: unknown) {
      console.error('Error getting recommended priority fee:', error);
      // Return fallback values based on urgency
      const fallbackFees = {
        low: 1000,      // 0.000001 SOL
        medium: 5000,   // 0.000005 SOL
        high: 10000     // 0.00001 SOL
      };
      return fallbackFees[urgency];
    }
  }

  /**
   * Make the actual JSON-RPC request to Helius
   */
  private async makePriorityFeeRequest(request: PriorityFeeRequest): Promise<PriorityFeeResponse> {
    const url = buildRpcUrl();
    
    try {
      // Convert to JSON-RPC format
      const rpcRequest = {
        jsonrpc: "2.0",
        id: Date.now().toString(),
        method: "getPriorityFeeEstimate",
        params: [request]
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rpcRequest),
        signal: AbortSignal.timeout(HELIUS_CONFIG.defaults.timeout)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        
        // Handle specific HTTP status codes
        switch (response.status) {
          case 400:
            throw new Error(`Invalid request parameters: ${errorText}`);
          case 401:
            throw new Error('Invalid or missing API key. Please check your Helius API configuration.');
          case 403:
            throw new Error('API key does not have permission for this endpoint.');
          case 429:
            throw new Error('Rate limit exceeded. Please try again later.');
          case 500:
            throw new Error('Helius server error. Please try again later.');
          case 503:
            throw new Error('Helius service temporarily unavailable. Please try again later.');
          default:
            throw new Error(`Helius API error (${response.status}): ${errorText}`);
        }
      }

      const rpcResponse = await response.json();
      
      if (rpcResponse.error) {
        const { code, message } = rpcResponse.error;
        
        // Handle specific RPC error codes
        switch (code) {
          case -32600:
            // If getPriorityFeeEstimate is not available, try fallback
            if (message.includes('getPriorityFeeEstimate is not available')) {
              console.warn('[Helius] getPriorityFeeEstimate not available, using Solana RPC fallback');
              return await this.getSolanaRpcPriorityFee(request);
            }
            throw new Error(`Invalid JSON-RPC request: ${message}`);
          case -32601:
            // Method not found - try fallback
            console.warn('[Helius] Method not found, using Solana RPC fallback');
            return await this.getSolanaRpcPriorityFee(request);
          case -32602:
            throw new Error(`Invalid parameters: ${message}`);
          case -32603:
            throw new Error(`Internal RPC error: ${message}`);
          default:
            throw new Error(`Helius RPC error (${code}): ${message}`);
        }
      }

      // Validate response structure
      if (!rpcResponse.result) {
        throw new Error('Invalid response: missing result field');
      }

      // Convert RPC response to our expected format
      return {
        priorityFeeEstimate: rpcResponse.result.priorityFeeEstimate,
        priorityFeeLevels: rpcResponse.result.priorityFeeLevels
      };
      
    } catch (error: unknown) {
      // Handle network and timeout errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to Helius API. Please check your internet connection.');
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout: Helius API did not respond within ${HELIUS_CONFIG.defaults.timeout}ms`);
      }
      
      // Re-throw our custom errors
      if (error instanceof Error) {
        throw error;
      }
      
      // Fallback for unknown errors
      throw new Error(`Unexpected error: ${String(error)}`);
    }
  }

  /**
   * Fallback method using Solana RPC getRecentPrioritizationFees
   */
  private async getSolanaRpcPriorityFee(request: PriorityFeeRequest): Promise<PriorityFeeResponse> {
    try {
      // Use Solana RPC endpoint instead of Helius
      const solanaRpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
      
      const rpcRequest = {
        jsonrpc: "2.0",
        id: Date.now().toString(),
        method: "getRecentPrioritizationFees",
        params: [request.accountKeys]
      };
      
      const response = await fetch(solanaRpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rpcRequest),
        signal: AbortSignal.timeout(HELIUS_CONFIG.defaults.timeout)
      });

      if (!response.ok) {
        throw new Error(`Solana RPC error: ${response.status}`);
      }

      const rpcResponse = await response.json();
      
      if (rpcResponse.error) {
        throw new Error(`Solana RPC error: ${rpcResponse.error.message}`);
      }

      // Process the prioritization fees to calculate estimates
      const fees = rpcResponse.result || [];
      
      if (fees.length === 0) {
        // Return default values if no fees available
        return {
          priorityFeeEstimate: 5000, // 5000 micro-lamports as default
          priorityFeeLevels: {
            none: 0,
            low: 1000,
            medium: 5000,
            high: 10000,
            veryHigh: 50000,
            unsafeMax: 100000
          }
        };
      }

      // Calculate statistics from recent fees
      const priorityFees = fees.map((fee: any) => fee.prioritizationFee).filter((fee: number) => fee > 0);
      
      if (priorityFees.length === 0) {
        // Return default values if no priority fees found
        return {
          priorityFeeEstimate: 5000,
          priorityFeeLevels: {
            none: 0,
            low: 1000,
            medium: 5000,
            high: 10000,
            veryHigh: 50000,
            unsafeMax: 100000
          }
        };
      }

      // Sort fees and calculate percentiles
      priorityFees.sort((a: number, b: number) => a - b);
      
      const getPercentile = (arr: number[], percentile: number): number => {
        const index = Math.ceil((percentile / 100) * arr.length) - 1;
        return arr[Math.max(0, index)] || 0;
      };

      const priorityFeeLevels = {
        none: 0,
        low: getPercentile(priorityFees, 25),
        medium: getPercentile(priorityFees, 50),
        high: getPercentile(priorityFees, 75),
        veryHigh: getPercentile(priorityFees, 90),
        unsafeMax: Math.max(...priorityFees)
      };

      // Get the requested priority level
      const requestedLevel = request.options?.priorityLevel || 'medium';
      const priorityFeeEstimate = priorityFeeLevels[requestedLevel as keyof typeof priorityFeeLevels] || priorityFeeLevels.medium;

      console.log('[Solana RPC] Priority fee fallback completed', {
        feesCount: fees.length,
        priorityFeesCount: priorityFees.length,
        priorityFeeEstimate,
        requestedLevel
      });

      return {
        priorityFeeEstimate,
        priorityFeeLevels
      };
      
    } catch (error: unknown) {
      console.error('[Solana RPC] Fallback failed:', error);
      
      // Return safe default values as last resort
      const defaultLevel = request.options?.priorityLevel || 'medium';
      const defaultFees = {
        none: 0,
        low: 1000,
        medium: 5000,
        high: 10000,
        veryHigh: 50000,
        unsafeMax: 100000
      };
      
      return {
        priorityFeeEstimate: defaultFees[defaultLevel as keyof typeof defaultFees] || defaultFees.medium,
        priorityFeeLevels: defaultFees
      };
    }
  }

  /**
   * Get priority fee level name from numeric value
   */
  getPriorityLevelName(fee: number, allLevels?: PriorityFeeResponse['priorityFeeLevels']): PriorityLevel {
    if (!allLevels) {
      return 'medium';
    }

    // Find the closest priority level
    const levels = Object.entries(allLevels) as [PriorityLevel, number][];
    let closestLevel: PriorityLevel = 'medium';
    let closestDiff = Infinity;

    for (const [level, levelFee] of levels) {
      const diff = Math.abs(fee - levelFee);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestLevel = level;
      }
    }

    return closestLevel;
  }

  /**
   * Format priority fee for display
   */
  formatPriorityFee(fee: number): string {
    const sol = fee / 1e9;
    if (sol < 0.000001) {
      return `${fee} lamports`;
    }
    return `${sol.toFixed(6)} SOL`;
  }
}

// Export singleton instance
export const heliusPriorityFeeService = HeliusPriorityFeeService.getInstance();
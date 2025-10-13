import { PublicKey } from '@solana/web3.js';
import { getHeliusApiKey, buildApiUrl, getCurrentNetwork, HELIUS_CONFIG } from './config';

// Enhanced Transaction Types
export interface EnhancedTransaction {
  accountData: AccountData[];
  description: string;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  signature: string;
  slot: number;
  timestamp: number;
  tokenTransfers: TokenTransfer[];
  nativeTransfers: NativeTransfer[];
  instructions: TransactionInstruction[];
  events: TransactionEvent[];
}

export interface AccountData {
  account: string;
  nativeBalanceChange: number;
  tokenBalanceChanges: TokenBalanceChange[];
}

export interface TokenBalanceChange {
  userAccount: string;
  tokenAccount: string;
  rawTokenAmount: {
    tokenAmount: string;
    decimals: number;
  };
  mint: string;
}

export interface TokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  fromTokenAccount: string;
  toTokenAccount: string;
  tokenAmount: number;
  mint: string;
  tokenStandard: string;
}

export interface NativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number;
}

export interface TransactionInstruction {
  accounts: string[];
  data: string;
  programId: string;
  innerInstructions: InnerInstruction[];
}

export interface InnerInstruction {
  accounts: string[];
  data: string;
  programId: string;
}

export interface TransactionEvent {
  nft?: NFTEvent;
  swap?: SwapEvent;
  compressed?: CompressedNFTEvent;
}

export interface NFTEvent {
  description: string;
  type: string;
  source: string;
  amount: number;
  fee: number;
  feePayer: string;
  signature: string;
  slot: number;
  timestamp: number;
  saleType: string;
  buyer: string;
  seller: string;
  staker: string;
  nfts: NFTDetails[];
}

export interface SwapEvent {
  nativeInput: {
    account: string;
    amount: string;
  };
  nativeOutput: {
    account: string;
    amount: string;
  };
  tokenInputs: TokenInput[];
  tokenOutputs: TokenOutput[];
}

export interface TokenInput {
  userAccount: string;
  tokenAccount: string;
  rawTokenAmount: {
    tokenAmount: string;
    decimals: number;
  };
  mint: string;
}

export interface TokenOutput {
  userAccount: string;
  tokenAccount: string;
  rawTokenAmount: {
    tokenAmount: string;
    decimals: number;
  };
  mint: string;
}

export interface CompressedNFTEvent {
  type: string;
  treeId: string;
  leafIndex: number;
  seq: number;
  assetId: string;
  instructionIndex: number;
  innerInstructionIndex: number;
}

export interface NFTDetails {
  mint: string;
  tokenStandard: string;
}

// Request/Response interfaces
export interface ParsedTransactionsRequest {
  transactions: string[];
}

export interface ParsedTransactionsResponse {
  [signature: string]: EnhancedTransaction[];
}

export interface TransactionHistoryRequest {
  address: string;
  before?: string;
  until?: string;
  limit?: number;
  commitment?: 'processed' | 'confirmed' | 'finalized';
  source?: string;
  type?: string;
}

export interface TransactionHistoryResponse {
  transactions: EnhancedTransaction[];
  pagination?: {
    before: string;
    after: string;
  };
}

// Enhanced Transactions Service
export class HeliusEnhancedTransactionsService {
  private apiKey: string;

  constructor() {
    this.apiKey = getHeliusApiKey();
  }

  /**
   * Parse transactions with enhanced data
   */
  async parseTransactions(signatures: string[]): Promise<ParsedTransactionsResponse> {
    try {
      const url = buildApiUrl(HELIUS_CONFIG.endpoints.enhancedTransactions);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: signatures,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to parse transactions: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error parsing transactions:', error);
      throw error;
    }
  }

  /**
   * Get transaction history for an address with enhanced data
   */
  async getTransactionHistory(
    address: string,
    options: Omit<TransactionHistoryRequest, 'address'> = {}
  ): Promise<TransactionHistoryResponse> {
    try {
      const filteredOptions = Object.fromEntries(
        Object.entries(options).filter(([_, value]) => value !== undefined)
      ) as Record<string, string>;

      const endpoint = HELIUS_CONFIG.endpoints.addressTransactions.replace('{address}', address);
      const url = buildApiUrl(endpoint, filteredOptions);
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to get transaction history: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  /**
   * Get enhanced transaction by signature
   */
  async getTransactionBySignature(signature: string): Promise<EnhancedTransaction[]> {
    try {
      const result = await this.parseTransactions([signature]);
      return result[signature] || [];
    } catch (error) {
      console.error('Error getting transaction by signature:', error);
      throw error;
    }
  }

  /**
   * Filter transactions by type
   */
  filterTransactionsByType(
    transactions: EnhancedTransaction[],
    type: string
  ): EnhancedTransaction[] {
    return transactions.filter(tx => tx.type === type);
  }

  /**
   * Get SOL transfers from transactions
   */
  getSolTransfers(transactions: EnhancedTransaction[]): NativeTransfer[] {
    return transactions.flatMap(tx => tx.nativeTransfers || []);
  }

  /**
   * Get token transfers from transactions
   */
  getTokenTransfers(transactions: EnhancedTransaction[]): TokenTransfer[] {
    return transactions.flatMap(tx => tx.tokenTransfers || []);
  }

  /**
   * Calculate total fees from transactions
   */
  calculateTotalFees(transactions: EnhancedTransaction[]): number {
    return transactions.reduce((total, tx) => total + (tx.fee || 0), 0);
  }

  /**
   * Get transactions involving a specific program
   */
  getTransactionsByProgram(
    transactions: EnhancedTransaction[],
    programId: string
  ): EnhancedTransaction[] {
    return transactions.filter(tx =>
      tx.instructions?.some(instruction => instruction.programId === programId)
    );
  }

  /**
   * Get balance changes for an address
   */
  getBalanceChanges(
    transactions: EnhancedTransaction[],
    address: string
  ): { native: number; tokens: TokenBalanceChange[] } {
    let nativeChange = 0;
    const tokenChanges: TokenBalanceChange[] = [];

    transactions.forEach(tx => {
      // Native balance changes
      const accountData = tx.accountData?.find(acc => acc.account === address);
      if (accountData) {
        nativeChange += accountData.nativeBalanceChange || 0;
        tokenChanges.push(...(accountData.tokenBalanceChanges || []));
      }
    });

    return {
      native: nativeChange,
      tokens: tokenChanges,
    };
  }
}

// Create singleton instance
export const heliusEnhancedTransactionsService = new HeliusEnhancedTransactionsService();

// Utility functions
export const formatTransactionType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'TRANSFER': 'Transferência',
    'SWAP': 'Troca',
    'NFT_SALE': 'Venda de NFT',
    'NFT_MINT': 'Mint de NFT',
    'STAKE': 'Stake',
    'UNSTAKE': 'Unstake',
    'BURN': 'Queima',
    'UNKNOWN': 'Desconhecido',
  };

  return typeMap[type] || type;
};

export const formatTransactionSource = (source: string): string => {
  const sourceMap: Record<string, string> = {
    'JUPITER': 'Jupiter',
    'RAYDIUM': 'Raydium',
    'ORCA': 'Orca',
    'SERUM': 'Serum',
    'MAGIC_EDEN': 'Magic Eden',
    'SOLANART': 'Solanart',
    'SYSTEM_PROGRAM': 'Sistema',
    'UNKNOWN': 'Desconhecido',
  };

  return sourceMap[source] || source;
};

export const isSuccessfulTransaction = (transaction: EnhancedTransaction): boolean => {
  // A transaction is considered successful if it has a signature and timestamp
  return !!(transaction.signature && transaction.timestamp);
};

export const getTransactionAge = (transaction: EnhancedTransaction): string => {
  if (!transaction.timestamp) return 'Desconhecido';

  const now = Date.now();
  const txTime = transaction.timestamp * 1000; // Convert to milliseconds
  const diffMs = now - txTime;

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Agora mesmo';
  if (diffMinutes < 60) return `${diffMinutes} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  return `${diffDays}d atrás`;
};
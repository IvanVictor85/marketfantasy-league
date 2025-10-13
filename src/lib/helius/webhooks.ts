import { buildApiUrl, getHeliusApiKey, getCurrentNetwork } from './config';

// Webhook Types
export interface WebhookConfig {
  webhookURL: string;
  transactionTypes: TransactionType[];
  accountAddresses: string[];
  webhookType: 'enhanced' | 'raw' | 'enhancedDevnet' | 'rawDevnet';
  authHeader?: string;
}

export interface CreateWebhookRequest {
  webhookURL: string;
  transactionTypes: TransactionType[];
  accountAddresses: string[];
  webhookType: 'enhanced' | 'raw' | 'enhancedDevnet' | 'rawDevnet';
  authHeader?: string;
}

export interface WebhookResponse {
  webhookID: string;
  wallet: string;
  webhookURL: string;
  transactionTypes: TransactionType[];
  accountAddresses: string[];
  webhookType: string;
  authHeader?: string;
}

export interface WebhookEvent {
  accountData: Array<{
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges: Array<{
      mint: string;
      rawTokenAmount: {
        tokenAmount: string;
        decimals: number;
      };
      userAccount: string;
    }>;
  }>;
  description: string;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  signature: string;
  slot: number;
  timestamp: number;
  tokenTransfers: Array<{
    fromTokenAccount: string;
    toTokenAccount: string;
    fromUserAccount: string;
    toUserAccount: string;
    tokenAmount: number;
    mint: string;
  }>;
  nativeTransfers: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
  instructions: Array<{
    accounts: string[];
    data: string;
    programId: string;
    innerInstructions: Array<{
      accounts: string[];
      data: string;
      programId: string;
    }>;
  }>;
  events: {
    nft?: {
      type: string;
      nfts: Array<{
        mint: string;
        tokenStandard: string;
      }>;
    };
    swap?: {
      nativeInput?: {
        account: string;
        amount: string;
      };
      nativeOutput?: {
        account: string;
        amount: string;
      };
      tokenInputs: Array<{
        mint: string;
        rawTokenAmount: {
          tokenAmount: string;
          decimals: number;
        };
        userAccount: string;
      }>;
      tokenOutputs: Array<{
        mint: string;
        rawTokenAmount: {
          tokenAmount: string;
          decimals: number;
        };
        userAccount: string;
      }>;
    };
  };
}

export type TransactionType = 
  | 'Any'
  | 'SWAP'
  | 'NFT_BID'
  | 'NFT_LISTING'
  | 'NFT_PURCHASE'
  | 'NFT_SALE'
  | 'NFT_MINT'
  | 'NFT_AUCTION_CREATED'
  | 'NFT_AUCTION_UPDATED'
  | 'NFT_AUCTION_CANCELLED'
  | 'NFT_PARTICIPATION_REWARD'
  | 'NFT_MINT_REJECTED'
  | 'NFT_BID_CANCELLED'
  | 'NFT_LISTING_CANCELLED'
  | 'UNKNOWN';

// League-specific webhook event types
export interface LeagueWebhookEvent extends WebhookEvent {
  leagueContext?: {
    leagueId: string;
    userId: string;
    action: 'deposit' | 'withdraw' | 'join_league' | 'leave_league' | 'claim_reward';
    amount?: number;
    tokenMint?: string;
  };
}

// Webhook service class
export class HeliusWebhookService {
  private apiKey: string;

  constructor() {
    this.apiKey = getHeliusApiKey();
  }

  /**
   * Create a new webhook
   */
  async createWebhook(config: CreateWebhookRequest): Promise<WebhookResponse> {
    try {
      const url = buildApiUrl('webhooks');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Failed to create webhook: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw error;
    }
  }

  /**
   * Get all webhooks
   */
  async getWebhooks(): Promise<WebhookResponse[]> {
    try {
      const url = buildApiUrl('webhooks');
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to get webhooks: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting webhooks:', error);
      throw error;
    }
  }

  /**
   * Get a specific webhook by ID
   */
  async getWebhook(webhookId: string): Promise<WebhookResponse> {
    try {
      const url = buildApiUrl(`webhooks/${webhookId}`);
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to get webhook: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting webhook:', error);
      throw error;
    }
  }

  /**
   * Update a webhook
   */
  async updateWebhook(webhookId: string, config: Partial<CreateWebhookRequest>): Promise<WebhookResponse> {
    try {
      const url = buildApiUrl(`webhooks/${webhookId}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Failed to update webhook: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating webhook:', error);
      throw error;
    }
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      const url = buildApiUrl(`webhooks/${webhookId}`);
      
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete webhook: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw error;
    }
  }

  /**
   * Create a league-specific webhook for monitoring deposits, withdrawals, and other league events
   */
  async createLeagueWebhook(
    leagueAddress: string,
    webhookUrl: string,
    authHeader?: string
  ): Promise<WebhookResponse> {
    const network = getCurrentNetwork();
    const webhookType = network === 'mainnet' ? 'enhanced' : 'enhancedDevnet';

    return this.createWebhook({
      webhookURL: webhookUrl,
      transactionTypes: ['Any'], // Monitor all transaction types for the league
      accountAddresses: [leagueAddress],
      webhookType,
      authHeader,
    });
  }

  /**
   * Create a user-specific webhook for monitoring user activities across all leagues
   */
  async createUserWebhook(
    userAddress: string,
    webhookUrl: string,
    authHeader?: string
  ): Promise<WebhookResponse> {
    const network = getCurrentNetwork();
    const webhookType = network === 'mainnet' ? 'enhanced' : 'enhancedDevnet';

    return this.createWebhook({
      webhookURL: webhookUrl,
      transactionTypes: ['Any'],
      accountAddresses: [userAddress],
      webhookType,
      authHeader,
    });
  }
}

// Webhook event processing utilities
export class WebhookEventProcessor {
  /**
   * Process a webhook event and extract league-specific information
   */
  static processLeagueEvent(event: WebhookEvent): LeagueWebhookEvent {
    const leagueEvent: LeagueWebhookEvent = { ...event };

    // Try to extract league context from the transaction
    const leagueContext = this.extractLeagueContext(event);
    if (leagueContext) {
      leagueEvent.leagueContext = leagueContext;
    }

    return leagueEvent;
  }

  /**
   * Extract league-specific context from a webhook event
   */
  private static extractLeagueContext(event: WebhookEvent): LeagueWebhookEvent['leagueContext'] | null {
    // Check for SOL transfers (deposits/withdrawals)
    if (event.nativeTransfers && event.nativeTransfers.length > 0) {
      const transfer = event.nativeTransfers[0];
      
      // Determine if this is a deposit or withdrawal based on the transfer direction
      // This would need to be customized based on your league program's structure
      return {
        leagueId: 'unknown', // Would need to be extracted from program data
        userId: transfer.fromUserAccount,
        action: 'deposit', // or 'withdraw' based on direction
        amount: transfer.amount,
      };
    }

    // Check for token transfers
    if (event.tokenTransfers && event.tokenTransfers.length > 0) {
      const transfer = event.tokenTransfers[0];
      
      return {
        leagueId: 'unknown',
        userId: transfer.fromUserAccount,
        action: 'deposit',
        amount: transfer.tokenAmount,
        tokenMint: transfer.mint,
      };
    }

    return null;
  }

  /**
   * Validate webhook signature (if using auth headers)
   */
  static validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // Implementation would depend on the signature scheme used
    // This is a placeholder for webhook signature validation
    return true;
  }

  /**
   * Filter events by transaction type
   */
  static filterEventsByType(
    events: WebhookEvent[],
    types: TransactionType[]
  ): WebhookEvent[] {
    return events.filter(event => types.includes(event.type as TransactionType));
  }

  /**
   * Get events for a specific account
   */
  static getEventsForAccount(
    events: WebhookEvent[],
    accountAddress: string
  ): WebhookEvent[] {
    return events.filter(event => 
      event.accountData.some(account => account.account === accountAddress) ||
      event.nativeTransfers.some(transfer => 
        transfer.fromUserAccount === accountAddress || 
        transfer.toUserAccount === accountAddress
      ) ||
      event.tokenTransfers.some(transfer => 
        transfer.fromUserAccount === accountAddress || 
        transfer.toUserAccount === accountAddress
      )
    );
  }
}

// Create a singleton instance
export const heliusWebhookService = new HeliusWebhookService();

// Utility functions
export const webhookUtils = {
  /**
   * Format webhook event for display
   */
  formatEventForDisplay: (event: LeagueWebhookEvent): string => {
    const { signature, type, timestamp, leagueContext } = event;
    const date = new Date(timestamp * 1000).toLocaleString();
    
    let description = `${type} transaction at ${date}`;
    
    if (leagueContext) {
      description += ` - ${leagueContext.action}`;
      if (leagueContext.amount) {
        description += ` of ${leagueContext.amount} ${leagueContext.tokenMint ? 'tokens' : 'SOL'}`;
      }
    }
    
    return description;
  },

  /**
   * Get transaction explorer URL
   */
  getExplorerUrl: (signature: string): string => {
    const network = getCurrentNetwork();
    const cluster = network === 'mainnet' ? '' : `?cluster=${network}`;
    return `https://explorer.solana.com/tx/${signature}${cluster}`;
  },

  /**
   * Check if event is league-related
   */
  isLeagueEvent: (event: WebhookEvent): boolean => {
    // This would need to be customized based on your league program's structure
    return event.instructions.some(instruction => 
      instruction.programId === process.env.NEXT_PUBLIC_PROGRAM_ID
    );
  },
};
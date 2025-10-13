import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  heliusEnhancedTransactionsService,
  EnhancedTransaction,
  TransactionHistoryResponse,
  NativeTransfer,
  TokenTransfer,
  TokenBalanceChange,
} from '@/lib/helius/enhanced-transactions';

export interface UseEnhancedTransactionsOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  transactionTypes?: string[];
}

export interface UseEnhancedTransactionsReturn {
  transactions: EnhancedTransaction[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalFees: number;
  balanceChanges: {
    native: number;
    tokens: TokenBalanceChange[];
  };
  solTransfers: NativeTransfer[];
  tokenTransfers: TokenTransfer[];
  refreshTransactions: () => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  parseTransaction: (signature: string) => Promise<EnhancedTransaction[]>;
  filterByType: (type: string) => EnhancedTransaction[];
  filterByProgram: (programId: string) => EnhancedTransaction[];
}

export const useEnhancedTransactions = (
  options: UseEnhancedTransactionsOptions = {}
): UseEnhancedTransactionsReturn => {
  const { publicKey } = useWallet();
  const {
    limit = 50,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    transactionTypes = [],
  } = options;

  const [transactions, setTransactions] = useState<EnhancedTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastSignature, setLastSignature] = useState<string | undefined>();

  // Fetch transactions
  const fetchTransactions = useCallback(
    async (before?: string, append = false) => {
      if (!publicKey) {
        setTransactions([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response: TransactionHistoryResponse =
          await heliusEnhancedTransactionsService.getTransactionHistory(
            publicKey.toString(),
            {
              before,
              limit,
              commitment: 'confirmed',
            }
          );

        let newTransactions = response.transactions || [];

        // Filter by transaction types if specified
        if (transactionTypes.length > 0) {
          newTransactions = newTransactions.filter(tx =>
            transactionTypes.includes(tx.type)
          );
        }

        if (append) {
          setTransactions(prev => [...prev, ...newTransactions]);
        } else {
          setTransactions(newTransactions);
        }

        // Update pagination state
        setHasMore(newTransactions.length === limit);
        if (newTransactions.length > 0) {
          setLastSignature(newTransactions[newTransactions.length - 1].signature);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError(err instanceof Error ? err.message : 'Erro ao buscar transações');
      } finally {
        setLoading(false);
      }
    },
    [publicKey, limit, transactionTypes]
  );

  // Refresh transactions
  const refreshTransactions = useCallback(async () => {
    await fetchTransactions();
  }, [fetchTransactions]);

  // Load more transactions
  const loadMoreTransactions = useCallback(async () => {
    if (hasMore && !loading && lastSignature) {
      await fetchTransactions(lastSignature, true);
    }
  }, [hasMore, loading, lastSignature, fetchTransactions]);

  // Parse single transaction
  const parseTransaction = useCallback(
    async (signature: string): Promise<EnhancedTransaction[]> => {
      try {
        return await heliusEnhancedTransactionsService.getTransactionBySignature(
          signature
        );
      } catch (err) {
        console.error('Error parsing transaction:', err);
        throw err;
      }
    },
    []
  );

  // Filter transactions by type
  const filterByType = useCallback(
    (type: string): EnhancedTransaction[] => {
      return heliusEnhancedTransactionsService.filterTransactionsByType(
        transactions,
        type
      );
    },
    [transactions]
  );

  // Filter transactions by program
  const filterByProgram = useCallback(
    (programId: string): EnhancedTransaction[] => {
      return heliusEnhancedTransactionsService.getTransactionsByProgram(
        transactions,
        programId
      );
    },
    [transactions]
  );

  // Calculate derived data
  const totalFees = heliusEnhancedTransactionsService.calculateTotalFees(transactions);
  const balanceChanges = publicKey
    ? heliusEnhancedTransactionsService.getBalanceChanges(
        transactions,
        publicKey.toString()
      )
    : { native: 0, tokens: [] };
  const solTransfers = heliusEnhancedTransactionsService.getSolTransfers(transactions);
  const tokenTransfers = heliusEnhancedTransactionsService.getTokenTransfers(transactions);

  // Initial load
  useEffect(() => {
    if (publicKey) {
      fetchTransactions();
    }
  }, [publicKey, fetchTransactions]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !publicKey) return;

    const interval = setInterval(() => {
      refreshTransactions();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, publicKey, refreshInterval, refreshTransactions]);

  return {
    transactions,
    loading,
    error,
    hasMore,
    totalFees,
    balanceChanges,
    solTransfers,
    tokenTransfers,
    refreshTransactions,
    loadMoreTransactions,
    parseTransaction,
    filterByType,
    filterByProgram,
  };
};

// Hook for monitoring specific transaction
export interface UseTransactionMonitorOptions {
  signature: string;
  pollInterval?: number;
  maxAttempts?: number;
}

export interface UseTransactionMonitorReturn {
  transaction: EnhancedTransaction | null;
  loading: boolean;
  error: string | null;
  confirmed: boolean;
  attempts: number;
}

export const useTransactionMonitor = (
  options: UseTransactionMonitorOptions
): UseTransactionMonitorReturn => {
  const { signature, pollInterval = 2000, maxAttempts = 30 } = options;

  const [transaction, setTransaction] = useState<EnhancedTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!signature) return;

    let intervalId: NodeJS.Timeout;
    let currentAttempts = 0;

    const checkTransaction = async () => {
      if (currentAttempts >= maxAttempts) {
        setError('Timeout: Transação não confirmada');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        currentAttempts++;
        setAttempts(currentAttempts);

        const transactions = await heliusEnhancedTransactionsService.getTransactionBySignature(
          signature
        );

        if (transactions.length > 0) {
          const tx = transactions[0];
          setTransaction(tx);
          setConfirmed(true);
          setLoading(false);
          clearInterval(intervalId);
        } else if (currentAttempts >= maxAttempts) {
          setError('Transação não encontrada após múltiplas tentativas');
          setLoading(false);
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Error monitoring transaction:', err);
        if (currentAttempts >= maxAttempts) {
          setError(err instanceof Error ? err.message : 'Erro ao monitorar transação');
          setLoading(false);
          clearInterval(intervalId);
        }
      }
    };

    // Start monitoring
    setLoading(true);
    checkTransaction();

    intervalId = setInterval(checkTransaction, pollInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [signature, pollInterval, maxAttempts]);

  return {
    transaction,
    loading,
    error,
    confirmed,
    attempts,
  };
};

// Hook for transaction analytics
export interface UseTransactionAnalyticsReturn {
  totalTransactions: number;
  totalVolume: number;
  totalFees: number;
  transactionsByType: Record<string, number>;
  transactionsBySource: Record<string, number>;
  averageTransactionSize: number;
  mostActiveDay: string;
  successRate: number;
}

export const useTransactionAnalytics = (
  transactions: EnhancedTransaction[]
): UseTransactionAnalyticsReturn => {
  const analytics = {
    totalTransactions: transactions.length,
    totalVolume: 0,
    totalFees: heliusEnhancedTransactionsService.calculateTotalFees(transactions),
    transactionsByType: {} as Record<string, number>,
    transactionsBySource: {} as Record<string, number>,
    averageTransactionSize: 0,
    mostActiveDay: '',
    successRate: 0,
  };

  // Calculate volume and categorize transactions
  let totalVolume = 0;
  const typeCount: Record<string, number> = {};
  const sourceCount: Record<string, number> = {};
  const dayCount: Record<string, number> = {};
  let successfulTransactions = 0;

  transactions.forEach(tx => {
    // Volume calculation (sum of native transfers)
    const nativeTransfers = tx.nativeTransfers || [];
    nativeTransfers.forEach(transfer => {
      totalVolume += transfer.amount;
    });

    // Type categorization
    typeCount[tx.type] = (typeCount[tx.type] || 0) + 1;

    // Source categorization
    sourceCount[tx.source] = (sourceCount[tx.source] || 0) + 1;

    // Day categorization
    if (tx.timestamp) {
      const date = new Date(tx.timestamp * 1000).toDateString();
      dayCount[date] = (dayCount[date] || 0) + 1;
    }

    // Success rate
    if (tx.signature && tx.timestamp) {
      successfulTransactions++;
    }
  });

  analytics.totalVolume = totalVolume;
  analytics.transactionsByType = typeCount;
  analytics.transactionsBySource = sourceCount;
  analytics.averageTransactionSize = transactions.length > 0 ? totalVolume / transactions.length : 0;
  analytics.successRate = transactions.length > 0 ? (successfulTransactions / transactions.length) * 100 : 0;

  // Find most active day
  const mostActiveDay = Object.entries(dayCount).reduce(
    (max, [day, count]) => (count > max.count ? { day, count } : max),
    { day: '', count: 0 }
  );
  analytics.mostActiveDay = mostActiveDay.day;

  return analytics;
};
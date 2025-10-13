import { useState, useEffect, useCallback } from 'react';
import { heliusPriorityFeeService, PriorityFeeResponse } from '@/lib/helius/priority-fee';

export interface UsePriorityFeeOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  accountKeys?: string[];
  includeAllPriorityFeeLevels?: boolean;
}

export interface UsePriorityFeeReturn {
  priorityFee: PriorityFeeResponse | null;
  loading: boolean;
  error: string | null;
  refreshPriorityFee: () => Promise<void>;
  estimateForTransaction: (accountKeys: string[]) => Promise<PriorityFeeResponse | null>;
}

export const usePriorityFee = (
  options: UsePriorityFeeOptions = {}
): UsePriorityFeeReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    accountKeys = [],
    includeAllPriorityFeeLevels = true,
  } = options;

  const [priorityFee, setPriorityFee] = useState<PriorityFeeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch priority fee estimate
  const fetchPriorityFee = useCallback(
    async (keys: string[] = accountKeys) => {
      try {
        setLoading(true);
        setError(null);

        const estimate = await heliusPriorityFeeService.getPriorityFeeForAccounts(
          keys,
          {
            includeAllPriorityFeeLevels: includeAllPriorityFeeLevels,
          }
        );

        setPriorityFee(estimate);
      } catch (err) {
        console.error('Error fetching priority fee:', err);
        setError(err instanceof Error ? err.message : 'Erro ao buscar taxa de prioridade');
      } finally {
        setLoading(false);
      }
    },
    [accountKeys, includeAllPriorityFeeLevels]
  );

  // Refresh priority fee manually
  const refreshPriorityFee = useCallback(async () => {
    await fetchPriorityFee();
  }, [fetchPriorityFee]);

  // Estimate priority fee for specific transaction
  const estimateForTransaction = useCallback(
    async (keys: string[]): Promise<PriorityFeeResponse | null> => {
      try {
        setLoading(true);
        setError(null);

        const estimate = await heliusPriorityFeeService.getPriorityFeeForAccounts(
         keys,
         {
           includeAllPriorityFeeLevels: includeAllPriorityFeeLevels,
         }
       );

         return estimate;
      } catch (err) {
        console.error('Error estimating priority fee for transaction:', err);
        setError(err instanceof Error ? err.message : 'Erro ao estimar taxa de prioridade');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [includeAllPriorityFeeLevels]
  );

  // Initial fetch
  useEffect(() => {
    fetchPriorityFee();
  }, [fetchPriorityFee]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchPriorityFee();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchPriorityFee]);

  return {
    priorityFee,
    loading,
    error,
    refreshPriorityFee,
    estimateForTransaction,
  };
};

// Hook for getting priority fee for specific priority level
export const usePriorityFeeLevel = (level: 'low' | 'medium' | 'high' = 'medium') => {
  const { priorityFee, loading, error, refreshPriorityFee } = usePriorityFee({
    includeAllPriorityFeeLevels: true,
  });

  const levelFee = priorityFee?.priorityFeeLevels ? priorityFee.priorityFeeLevels[level] : null;

  return {
    fee: levelFee,
    loading,
    error,
    refresh: refreshPriorityFee,
  };
};

// Hook for comparing priority fee levels
export const usePriorityFeeComparison = () => {
  const { priorityFee, loading, error, refreshPriorityFee } = usePriorityFee({
    includeAllPriorityFeeLevels: true,
  });

  const comparison = priorityFee?.priorityFeeLevels
    ? {
        low: priorityFee.priorityFeeLevels.low,
        medium: priorityFee.priorityFeeLevels.medium,
        high: priorityFee.priorityFeeLevels.high,
        veryHigh: priorityFee.priorityFeeLevels.veryHigh,
        savings: {
          lowVsMedium: priorityFee.priorityFeeLevels.medium - priorityFee.priorityFeeLevels.low,
          lowVsHigh: priorityFee.priorityFeeLevels.high - priorityFee.priorityFeeLevels.low,
          mediumVsHigh: priorityFee.priorityFeeLevels.high - priorityFee.priorityFeeLevels.medium,
        },
        recommendations: {
          costEffective: priorityFee.priorityFeeLevels.low,
          balanced: priorityFee.priorityFeeLevels.medium,
          fastest: priorityFee.priorityFeeLevels.veryHigh,
        },
      }
    : null;

  return {
    comparison,
    loading,
    error,
    refresh: refreshPriorityFee,
  };
};
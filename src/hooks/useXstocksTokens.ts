import { useState, useEffect, useCallback } from 'react';
import type { XStockApiResponse, XStockApiItem } from '@/app/api/xstocks/route';

export interface UseXstocksTokensOptions {
  minVolumeUsd?: number;
  revalidate?: boolean;
  debug?: boolean;
  autoFetch?: boolean;
  refreshInterval?: number; // em milissegundos
}

export interface UseXstocksTokensReturn {
  tokens: XStockApiItem[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  count: number;
  refetch: () => Promise<void>;
  debugInfo?: any;
}

/**
 * Hook para consumir a API /api/xstocks
 */
export function useXstocksTokens(options: UseXstocksTokensOptions = {}): UseXstocksTokensReturn {
  const {
    minVolumeUsd = 0,
    revalidate = false,
    debug = false,
    autoFetch = true,
    refreshInterval,
  } = options;

  const [tokens, setTokens] = useState<XStockApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(undefined);

  /**
   * Função para buscar dados da API
   */
  const fetchTokens = useCallback(async () => {
    if (loading) return;
    
    console.log('🔍 [useXstocksTokens] Iniciando busca de tokens...');
    setLoading(true);
    setError(null);
    
    try {
      // Construir URL com query parameters
      const params = new URLSearchParams();
      if (minVolumeUsd > 0) params.append('minVolumeUsd', minVolumeUsd.toString());
      if (revalidate) params.append('revalidate', 'true');
      if (debug) params.append('debug', 'true');

      const url = `/api/xstocks${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🌐 [useXstocksTokens] URL da API:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 [useXstocksTokens] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: XStockApiResponse = await response.json();
      
      console.log('📊 [useXstocksTokens] Dados recebidos:', {
        count: data.count,
        itemsLength: data.items?.length,
        updatedAt: data.updatedAt
      });
      
      setTokens(data.items);
      setLastUpdated(data.updatedAt);
      
      if (debug && data.debug) {
        setDebugInfo(data.debug);
      }

      console.log('✅ [useXstocksTokens] Tokens atualizados com sucesso:', data.items?.length || 0);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar tokens';
      console.error('❌ [useXstocksTokens] Error fetching xStocks tokens:', errorMessage);
      setError(errorMessage);
      setTokens([]);
      setLastUpdated(null);
    } finally {
      setLoading(false);
    }
  }, [minVolumeUsd, revalidate, debug]);

  // Auto-fetch na montagem do componente
  useEffect(() => {
    if (autoFetch) {
      fetchTokens();
    }
  }, [fetchTokens, autoFetch]);

  // Refresh automático baseado no intervalo
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      if (!loading) {
        console.log('Refresh automático dos tokens xStocks');
        fetchTokens();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return {
    tokens,
    loading,
    error,
    lastUpdated,
    count: tokens.length,
    refetch: fetchTokens,
    debugInfo: debug ? debugInfo : undefined,
  };
}

/**
 * Hook simplificado para buscar apenas tokens com liquidez
 */
export function useXstocksLiquidTokens(minVolumeUsd: number = 1000): UseXstocksTokensReturn {
  return useXstocksTokens({
    minVolumeUsd,
    autoFetch: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar todos os tokens (sem filtro de volume)
 */
export function useAllXstocksTokens(): UseXstocksTokensReturn {
  return useXstocksTokens({
    minVolumeUsd: 0,
    autoFetch: true,
  });
}

/**
 * Hook para debug com informações detalhadas
 */
export function useXstocksDebug(): UseXstocksTokensReturn {
  return useXstocksTokens({
    debug: true,
    revalidate: true,
    autoFetch: true,
  });
}
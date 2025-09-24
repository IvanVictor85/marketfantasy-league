'use client';

import { useState, useEffect } from 'react';
import { type TokenMarketData } from '@/data/expanded-tokens';

// Re-export TokenMarketData as Token for compatibility
export type Token = TokenMarketData;

export function useTokens() {
  const [tokens, setTokens] = useState<TokenMarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTokens() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/tokens');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tokens: ${response.status}`);
        }
        
        const data = await response.json();
        setTokens(data);
      } catch (err) {
        console.error('Error fetching tokens:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
      } finally {
        setLoading(false);
      }
    }

    fetchTokens();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/tokens');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.status}`);
      }
      
      const data = await response.json();
      setTokens(data);
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  };

  return { tokens, loading, error, refetch };
}
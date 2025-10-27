'use client';

import { useQuery } from '@tanstack/react-query';
import { type TokenMarketData } from '@/data/expanded-tokens';

// Re-export TokenMarketData as Token for compatibility
export type Token = TokenMarketData;

/**
 * Função que busca os tokens da API
 * 
 * Essa função é chamada pelo React Query para buscar os dados.
 * Ela deve retornar os dados ou lançar um erro.
 */
const fetchTokens = async (): Promise<TokenMarketData[]> => {
  try {
    // ✅ Chama a API Route interna que busca dados da CoinGecko
    const response = await fetch('/api/tokens');
    
    // ✅ CORREÇÃO CRÍTICA: Lançar erro se a resposta não for 2xx
    if (!response.ok) {
      // Tenta ler a mensagem de erro da API, se houver
      let errorMessage = `${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = `${errorMessage}: ${errorData.error}`;
        }
      } catch {
        // Se não conseguir parsear o JSON, usa a mensagem padrão
      }
      
      throw new Error(`API Error: ${errorMessage}`);
    }

    const data = await response.json();
    
    // ✅ Validação adicional: Garante que os dados são um array
    if (!Array.isArray(data)) {
      console.error('Formato inesperado de dados:', data);
      throw new Error('Formato de dados inválido: esperado um array de tokens');
    }
    
    return data;

  } catch (error) {
    // ✅ Log detalhado para debug
    console.error('❌ Erro ao buscar tokens:', error);
    
    // Re-lança o erro para o React Query poder capturá-lo
    throw error;
  }
};

/**
 * Hook customizado para buscar tokens usando React Query
 * 
 * Configurações:
 * - queryKey: ['tokens'] - Chave única para este cache
 * - queryFn: fetchTokens - Função que busca os dados
 * - refetchInterval: 5 minutos - Atualiza automaticamente a cada 5 minutos
 * - staleTime: 4 minutos - Considera dados "frescos" por 4 minutos
 * - refetchOnWindowFocus: true - Atualiza quando a janela ganha foco
 * 
 * @returns {Object} - { tokens, loading, error, refetch }
 */
export function useTokens() {
  const { 
    data: tokens,      // Renomeia 'data' para 'tokens'
    isLoading: loading, // Renomeia 'isLoading' para 'loading' (compatibilidade)
    error,             // Estado de erro gerenciado pelo React Query
    refetch            // Função para forçar a atualização (para o botão Update)
  } = useQuery({
    queryKey: ['tokens'],             // Chave única para este cache
    queryFn: fetchTokens,             // Função que busca os dados
    refetchInterval: 5 * 60 * 1000,   // ✅ Atualiza a cada 5 minutos (300000 ms)
    staleTime: 4 * 60 * 1000,         // Considera dados "frescos" por 4 minutos (240000 ms)
    refetchOnWindowFocus: true,       // Atualiza quando a janela ganha foco
    retry: 2,                         // ✅ Tenta novamente 2 vezes em caso de erro
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
    refetchOnReconnect: true,         // ✅ Atualiza quando a conexão é restaurada
  });

  // Retorna os dados e estados gerenciados pelo React Query
  return { 
    tokens: tokens || [], // Retorna array vazio se 'tokens' for undefined inicialmente
    loading, 
    error: error ? (error as Error).message : null, // Converte Error para string
    refetch // Retorna a função refetch para o botão Update
  };
}
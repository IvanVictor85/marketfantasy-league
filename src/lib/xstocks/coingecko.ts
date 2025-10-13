import pRetry from 'p-retry';
import { z } from 'zod';

// Schemas para validar respostas da CoinGecko
const TokenPriceResponseSchema = z.record(
  z.object({
    usd: z.number().optional(),
    usd_24h_vol: z.number().optional(),
  })
);

const CoinDetailResponseSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  market_data: z.object({
    current_price: z.object({
      usd: z.number().optional(),
    }).optional(),
    total_volume: z.object({
      usd: z.number().optional(),
    }).optional(),
  }).optional(),
});

export type TokenPriceData = {
  mint: string;
  priceUsd: number | null;
  volume24hUsd: number | null;
  coingeckoAvailable: boolean;
};

/**
 * Configurações para rate limiting e retry
 */
const COINGECKO_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 segundo
  batchSize: 50, // Máximo de tokens por request
  requestDelay: 200, // Delay entre requests para evitar rate limit
};

/**
 * Faz delay entre requests para respeitar rate limits
 */
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Busca preços em lote usando a API de token prices da CoinGecko
 * @param mints Array de mint addresses
 * @returns Dados de preço e volume para cada mint
 */
export async function fetchTokenPricesBatch(mints: string[]): Promise<TokenPriceData[]> {
  if (mints.length === 0) return [];

  const results: TokenPriceData[] = [];
  
  // Processar em lotes para evitar URLs muito longas
  for (let i = 0; i < mints.length; i += COINGECKO_CONFIG.batchSize) {
    const batch = mints.slice(i, i + COINGECKO_CONFIG.batchSize);
    
    try {
      const batchResults = await pRetry(
        async () => {
          console.log(`Buscando preços para lote ${Math.floor(i / COINGECKO_CONFIG.batchSize) + 1}/${Math.ceil(mints.length / COINGECKO_CONFIG.batchSize)}`);
          
          const contractAddresses = batch.join(',');
          const url = `https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${contractAddresses}&vs_currencies=usd&include_24hr_vol=true`;
          
          const response = await fetch(url, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Market-Fantasy-League/1.0',
            },
          });

          if (response.status === 429) {
            throw new Error('Rate limit exceeded');
          }

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          return TokenPriceResponseSchema.parse(data);
        },
        {
          retries: COINGECKO_CONFIG.maxRetries,
          minTimeout: COINGECKO_CONFIG.retryDelay,
          factor: 2,
          onFailedAttempt: (error) => {
            console.warn(`Tentativa ${error.attemptNumber} falhou para lote:`, (error as any).message || 'Erro desconhecido');
          },
        }
      );

      // Processar resultados do lote
      for (const mint of batch) {
        const tokenData = batchResults[mint];
        results.push({
          mint,
          priceUsd: tokenData?.usd ?? null,
          volume24hUsd: tokenData?.usd_24h_vol ?? null,
          coingeckoAvailable: !!tokenData,
        });
      }

    } catch (error) {
      console.error(`Erro ao buscar preços para lote:`, error);
      
      // Adicionar resultados vazios para o lote que falhou
      for (const mint of batch) {
        results.push({
          mint,
          priceUsd: null,
          volume24hUsd: null,
          coingeckoAvailable: false,
        });
      }
    }

    // Delay entre lotes para respeitar rate limits
    if (i + COINGECKO_CONFIG.batchSize < mints.length) {
      await delay(COINGECKO_CONFIG.requestDelay);
    }
  }

  return results;
}

/**
 * Busca dados detalhados de um token específico (fallback)
 * @param mint Mint address do token
 * @returns Dados detalhados do token ou null se não encontrado
 */
export async function fetchTokenDetailsFallback(mint: string): Promise<TokenPriceData> {
  try {
    const result = await pRetry(
      async () => {
        console.log(`Buscando dados detalhados para token: ${mint}`);
        
        const url = `https://api.coingecko.com/api/v3/coins/solana/contract/${mint}`;
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Market-Fantasy-League/1.0',
          },
        });

        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }

        if (response.status === 404) {
          // Token não encontrado na CoinGecko
          return null;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return CoinDetailResponseSchema.parse(data);
      },
      {
        retries: COINGECKO_CONFIG.maxRetries,
        minTimeout: COINGECKO_CONFIG.retryDelay,
        factor: 2,
        onFailedAttempt: (error) => {
          console.warn(`Tentativa ${error.attemptNumber} falhou para token ${mint}:`, (error as any).message || 'Erro desconhecido');
        },
      }
    );

    if (!result) {
      return {
        mint,
        priceUsd: null,
        volume24hUsd: null,
        coingeckoAvailable: false,
      };
    }

    return {
      mint,
      priceUsd: result.market_data?.current_price?.usd ?? null,
      volume24hUsd: result.market_data?.total_volume?.usd ?? null,
      coingeckoAvailable: true,
    };

  } catch (error) {
    console.error(`Erro ao buscar dados detalhados para token ${mint}:`, error);
    return {
      mint,
      priceUsd: null,
      volume24hUsd: null,
      coingeckoAvailable: false,
    };
  }
}

/**
 * Busca preços para uma lista de tokens, usando batch primeiro e fallback quando necessário
 * @param mints Array de mint addresses
 * @param useFallback Se deve usar fallback para tokens não encontrados
 * @returns Dados de preço e volume para cada mint
 */
export async function fetchAllTokenPrices(
  mints: string[], 
  useFallback: boolean = false
): Promise<TokenPriceData[]> {
  console.log(`Iniciando busca de preços para ${mints.length} tokens...`);
  
  // Primeiro, tentar buscar em lote
  const batchResults = await fetchTokenPricesBatch(mints);
  
  if (!useFallback) {
    return batchResults;
  }

  // Se fallback está habilitado, buscar individualmente os tokens que falharam
  const failedTokens = batchResults.filter(result => !result.coingeckoAvailable);
  
  if (failedTokens.length > 0) {
    console.log(`Usando fallback para ${failedTokens.length} tokens...`);
    
    for (let i = 0; i < failedTokens.length; i++) {
      const token = failedTokens[i];
      const fallbackResult = await fetchTokenDetailsFallback(token.mint);
      
      // Atualizar resultado no array principal
      const index = batchResults.findIndex(r => r.mint === token.mint);
      if (index !== -1) {
        batchResults[index] = fallbackResult;
      }

      // Delay entre requests de fallback
      if (i < failedTokens.length - 1) {
        await delay(COINGECKO_CONFIG.requestDelay);
      }
    }
  }

  const successCount = batchResults.filter(r => r.coingeckoAvailable).length;
  console.log(`Busca de preços concluída: ${successCount}/${mints.length} tokens encontrados na CoinGecko`);

  return batchResults;
}

/**
 * Função utilitária para testar a integração com CoinGecko
 */
export async function testCoinGeckoIntegration(): Promise<void> {
  // Alguns mints de exemplo para teste
  const testMints = [
    'So11111111111111111111111111111111111111112', // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  ];

  try {
    console.log('Testando integração com CoinGecko...');
    const results = await fetchAllTokenPrices(testMints, true);
    console.log('Resultados do teste:', results);
  } catch (error) {
    console.error('Erro no teste da CoinGecko:', error);
  }
}
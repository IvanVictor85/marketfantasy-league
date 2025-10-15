/**
 * Utilitários para análise de mercado usando dados reais da API CoinGecko
 */

export interface MarketToken {
  id: string;
  symbol: string;
  name: string;
  logoUrl: string;
  currentPrice: number;
  priceChange24h: number;
  priceChange7d: number;
  marketCap: number;
  volume24h: number;
  rank: number;
}

export interface MarketAnalysisData {
  topGainers: MarketToken[];
  topLosers: MarketToken[];
  lastUpdated: string;
}

/**
 * Busca dados dos TOP 100 tokens da CoinGecko
 */
export async function fetchTop100Tokens(signal?: AbortSignal): Promise<MarketToken[]> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }
      console.log(`🔄 Tentativa ${attempt}/${maxRetries} - Buscando dados da API...`);
      
      const response = await fetch('/api/market', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
        signal,
      });

      if (!response.ok) {
        throw new Error(`Erro na API interna: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Dados recebidos com sucesso: ${data.tokens?.length || 0} tokens`);
      return data.tokens || [];
      
    } catch (error) {
      const err = error as any;
      if (err?.name === 'AbortError') {
        console.warn('⛔ Busca abortada (AbortController).');
        throw err;
      }
      lastError = err as Error;
      console.error(`❌ Tentativa ${attempt} falhou:`, err);
      
      if (attempt < maxRetries) {
        if (signal?.aborted) {
          throw new DOMException('The operation was aborted.', 'AbortError');
        }
        const delay = attempt * 1000; // 1s, 2s, 3s
        console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error('❌ Todas as tentativas falharam');
  throw lastError || new Error('Falha ao buscar dados após múltiplas tentativas');
}

/**
 * Filtra os maiores ganhos (foguetes da semana) baseado na variação de 24h
 */
export function getTopGainers(tokens: MarketToken[], limit: number = 5): MarketToken[] {
  return tokens
    .filter(token => token.priceChange24h > 0) // Apenas tokens com ganho positivo
    .sort((a, b) => b.priceChange24h - a.priceChange24h) // Ordenar por maior ganho
    .slice(0, limit);
}

/**
 * Filtra as maiores quedas (alerta de queda) baseado na variação de 24h
 */
export function getTopLosers(tokens: MarketToken[], limit: number = 5): MarketToken[] {
  return tokens
    .filter(token => token.priceChange24h < 0) // Apenas tokens com queda
    .sort((a, b) => a.priceChange24h - b.priceChange24h) // Ordenar por maior queda
    .slice(0, limit);
}

/**
 * Busca e processa dados de análise de mercado
 */
export async function getMarketAnalysisData(signal?: AbortSignal): Promise<MarketAnalysisData> {
  try {
    const tokens = await fetchTop100Tokens(signal);
    
    const topGainers = getTopGainers(tokens, 5);
    const topLosers = getTopLosers(tokens, 5);
    
    return {
      topGainers,
      topLosers,
      lastUpdated: new Date().toISOString(),
    };
    
  } catch (error) {
    const err = error as any;
    if (err?.name === 'AbortError') {
      // Propaga para o chamador decidir ignorar
      throw err;
    }
    console.error('❌ Erro ao obter dados de análise de mercado:', err);
    throw err;
  }
}

/**
 * Formata a variação percentual para exibição
 */
export function formatPercentageChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Formata o preço para exibição
 */
export function formatPrice(price: number): string {
  if (price >= 1) {
    return `$${price.toFixed(2)}`;
  } else if (price >= 0.01) {
    return `$${price.toFixed(4)}`;
  } else {
    return `$${price.toFixed(8)}`;
  }
}
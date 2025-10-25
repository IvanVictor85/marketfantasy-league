import { NextResponse } from 'next/server';
import { mockTokens } from '@/lib/mock-data/tokens';

export const dynamic = 'force-dynamic';
import { 
  getCachedCoinGeckoPrices, 
  cacheCoinGeckoPrices,
  cacheApiResponse,
  getCachedApiResponse,
  CACHE_CONFIG 
} from '@/lib/xstocks/cache';
import { shouldWarmCache, warmPopularTokensCache } from '@/lib/cache/warming';



// Esta função irá lidar com requisições GET para /api/tokens
export async function GET(request: Request) {
  try {
    // Extrair parâmetros da URL para cache
    const { searchParams } = new URL(request.url);
    const cacheKey = searchParams.toString() || 'default';
    
    // Verificar cache primeiro
    const cachedData = getCachedCoinGeckoPrices();
    if (cachedData) {
      console.log('Cache HIT: Retornando dados de tokens do cache');
      
      // Verificar se o cache precisa ser aquecido em background
      if (shouldWarmCache()) {
        console.log('Cache warming iniciado em background');
        // Executar aquecimento em background sem bloquear a resposta
        warmPopularTokensCache().catch(err => 
          console.error('Erro no cache warming em background:', err)
        );
      }
      
      return NextResponse.json(cachedData);
    }

    console.log('Cache MISS: Buscando dados da API CoinGecko');

    // URL da API da CoinGecko para buscar os top 100 tokens por capitalização de mercado em USD
    // Incluindo price_change_percentage para obter dados de 1h, 24h, 7d e 30d
    const COINGECKO_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=1h,24h,7d,30d';

    try {
      // Faz a chamada para a API com timeout e headers apropriados
      const response = await fetch(COINGECKO_URL, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Market-Fantasy-League/1.0',
        },
        // Removemos o cache do Next.js para usar nosso cache customizado
      });

      // Se a resposta da CoinGecko não for bem-sucedida, usa dados mock
      if (!response.ok) {
        console.warn(`CoinGecko API não disponível. Status: ${response.status}. Usando dados mock.`);
        const mockData = await formatMockTokens();
        
        // Cache dados mock por um tempo menor
        cacheApiResponse('tokens', cacheKey, mockData, CACHE_CONFIG.TTL.MARKET_DATA);
        
        return NextResponse.json(mockData);
      }

      // Converte a resposta para JSON
      const data = await response.json();

      // Mapeia os dados para o formato que nossa aplicação espera
      const formattedTokens = data.map((token: any) => {
        return {
          id: token.id,
          symbol: token.symbol.toUpperCase(),
          name: token.name,
          image: token.image,
          price: token.current_price || 0,
          change_1h: token.price_change_percentage_1h_in_currency || 0,
          change_24h: token.price_change_percentage_24h || 0,
          change_7d: token.price_change_percentage_7d_in_currency || 0,
          change_30d: token.price_change_percentage_30d_in_currency || 0,
          market_cap: token.market_cap || 0,
          volume_24h: token.total_volume || 0,
          rank: token.market_cap_rank || 999,
          circulating_supply: token.circulating_supply || 0,
          rarity: getRarityByMarketCap(token.market_cap_rank),
          // Adicionar timestamp para debug
          cached_at: new Date().toISOString(),
          source: 'coingecko'
        };
      });

      // Cache os dados formatados
      cacheCoinGeckoPrices(formattedTokens);
      
      console.log(`Dados de ${formattedTokens.length} tokens armazenados no cache`);

      // Retorna os tokens da CoinGecko
      return NextResponse.json(formattedTokens);
    } catch (apiError) {
      console.warn('[API_FETCH_ERROR]', apiError);
      console.log('Usando dados mock devido a erro na API');
      
      const mockData = await formatMockTokens();
      
      // Cache dados mock por um tempo menor em caso de erro
      cacheApiResponse('tokens', cacheKey, mockData, CACHE_CONFIG.TTL.MARKET_DATA);
      
      return NextResponse.json(mockData);
    }
  } catch (error) {
    // Em caso de erro, loga no console do servidor e retorna dados mock
    console.error('[API_TOKENS_ERROR]', error);
    
    const mockData = await formatMockTokens();
    return NextResponse.json(mockData);
  }
}

// Função para formatar os dados mock no formato esperado pela aplicação
async function formatMockTokens() {
  // Formatar tokens mock
  const formattedMockTokens = mockTokens.map(token => {
    const change24h = token.price_change_percentage_24h || (Math.random() * 10 - 5);
    const change7d = token.price_change_percentage_7d || (Math.random() * 20 - 10);
    
    return {
      id: token.id,
      symbol: token.symbol,
      name: token.name,
      image: token.image,
      price: token.price,
      change_1h: 0,
      change_24h: change24h,
      change_7d: change7d,
      change_30d: 0,
      market_cap: token.market_cap,
      volume_24h: token.total_volume,
      rank: token.market_cap_rank,
      circulating_supply: 0,
      rarity: token.rarity,
      // Adicionar campos para consistência
      cached_at: new Date().toISOString(),
      source: 'mock'
    };
  });

  // Retornar apenas tokens mock (sem xStocks)
  return formattedMockTokens;
}

// Função para determinar a raridade baseada no ranking de market cap
function getRarityByMarketCap(rank: number): 'legendary' | 'epic' | 'rare' | 'common' {
  if (rank <= 5) return 'legendary';
  if (rank <= 20) return 'epic';
  if (rank <= 50) return 'rare';
  return 'common';
}
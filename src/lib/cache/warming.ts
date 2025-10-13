import { 
  cacheCoinGeckoPrices, 
  getCachedCoinGeckoPrices,
  cacheTokenPrice,
  CACHE_CONFIG 
} from '@/lib/xstocks/cache';

// Lista de tokens mais populares para cache warming
const POPULAR_TOKENS = [
  'bitcoin',
  'ethereum', 
  'solana',
  'binancecoin',
  'cardano',
  'avalanche-2',
  'polygon',
  'chainlink',
  'dogecoin',
  'shiba-inu'
];

// Lista de tokens da liga principal que devem estar sempre em cache
const MAIN_LEAGUE_TOKENS = [
  'bitcoin',
  'ethereum',
  'solana',
  'binancecoin',
  'cardano'
];

/**
 * Interface para configuração de cache warming
 */
interface CacheWarmingConfig {
  enableAutoWarming: boolean;
  warmingIntervalMs: number;
  popularTokens: string[];
  mainLeagueTokens: string[];
}

/**
 * Configuração padrão para cache warming
 */
export const DEFAULT_WARMING_CONFIG: CacheWarmingConfig = {
  enableAutoWarming: process.env.NODE_ENV === 'production',
  warmingIntervalMs: parseInt(process.env.CACHE_WARMING_INTERVAL_MS || '300000'), // 5 minutos
  popularTokens: POPULAR_TOKENS,
  mainLeagueTokens: MAIN_LEAGUE_TOKENS,
};

/**
 * Aquece o cache com dados dos tokens mais populares
 */
export async function warmPopularTokensCache(): Promise<void> {
  try {
    console.log('Iniciando cache warming para tokens populares...');
    
    // Verificar se já temos dados em cache
    const cachedData = getCachedCoinGeckoPrices();
    if (cachedData && cachedData.length > 0) {
      console.log('Cache já aquecido com dados recentes');
      return;
    }

    // Buscar dados da API CoinGecko
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=1h,24h,7d,30d',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Market-Fantasy-League/1.0',
        },
      }
    );

    if (!response.ok) {
      console.warn(`Falha no cache warming: ${response.status}`);
      return;
    }

    const data = await response.json();
    
    // Formatar dados
    const formattedTokens = data.map((token: any) => ({
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
      cached_at: new Date().toISOString(),
      source: 'coingecko-warming'
    }));

    // Cache os dados
    cacheCoinGeckoPrices(formattedTokens);
    
    // Cache tokens individuais para os mais populares
    const popularTokensData = formattedTokens.filter((token: any) => 
      DEFAULT_WARMING_CONFIG.popularTokens.includes(token.id)
    );
    
    popularTokensData.forEach((token: any) => {
      cacheTokenPrice(token.id, token);
    });

    console.log(`Cache warming concluído: ${formattedTokens.length} tokens, ${popularTokensData.length} tokens populares`);
    
  } catch (error) {
    console.error('Erro durante cache warming:', error);
  }
}

/**
 * Aquece o cache especificamente para tokens da liga principal
 */
export async function warmMainLeagueCache(): Promise<void> {
  try {
    console.log('Aquecendo cache para tokens da liga principal...');
    
    for (const tokenId of DEFAULT_WARMING_CONFIG.mainLeagueTokens) {
      // Buscar dados individuais do token se não estiver em cache
      const cachedToken = getCachedCoinGeckoPrices()?.find((t: any) => t.id === tokenId);
      
      if (!cachedToken) {
        await warmIndividualToken(tokenId);
        // Delay para respeitar rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log('Cache warming da liga principal concluído');
    
  } catch (error) {
    console.error('Erro durante cache warming da liga principal:', error);
  }
}

/**
 * Aquece o cache para um token individual
 */
export async function warmIndividualToken(tokenId: string): Promise<void> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Market-Fantasy-League/1.0',
        },
      }
    );

    if (!response.ok) {
      console.warn(`Falha ao aquecer cache do token ${tokenId}: ${response.status}`);
      return;
    }

    const data = await response.json();
    
    const tokenData = {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      image: data.image?.small || '',
      price: data.market_data?.current_price?.usd || 0,
      change_1h: data.market_data?.price_change_percentage_1h || 0,
      change_24h: data.market_data?.price_change_percentage_24h || 0,
      change_7d: data.market_data?.price_change_percentage_7d || 0,
      change_30d: data.market_data?.price_change_percentage_30d || 0,
      market_cap: data.market_data?.market_cap?.usd || 0,
      volume_24h: data.market_data?.total_volume?.usd || 0,
      rank: data.market_cap_rank || 999,
      circulating_supply: data.market_data?.circulating_supply || 0,
      rarity: getRarityByMarketCap(data.market_cap_rank),
      cached_at: new Date().toISOString(),
      source: 'coingecko-individual-warming'
    };

    cacheTokenPrice(tokenId, tokenData);
    console.log(`Token ${tokenId} aquecido no cache`);
    
  } catch (error) {
    console.error(`Erro ao aquecer cache do token ${tokenId}:`, error);
  }
}

/**
 * Inicia o processo automático de cache warming
 */
export function startCacheWarming(config: Partial<CacheWarmingConfig> = {}): void {
  const finalConfig = { ...DEFAULT_WARMING_CONFIG, ...config };
  
  if (!finalConfig.enableAutoWarming) {
    console.log('Cache warming automático desabilitado');
    return;
  }

  console.log('Iniciando cache warming automático...');
  
  // Aquecimento inicial
  warmPopularTokensCache();
  warmMainLeagueCache();
  
  // Aquecimento periódico
  setInterval(() => {
    warmPopularTokensCache();
    warmMainLeagueCache();
  }, finalConfig.warmingIntervalMs);
  
  console.log(`Cache warming configurado para executar a cada ${finalConfig.warmingIntervalMs / 1000} segundos`);
}

/**
 * Para o cache warming automático
 */
let warmingInterval: NodeJS.Timeout | null = null;

export function stopCacheWarming(): void {
  if (warmingInterval) {
    clearInterval(warmingInterval);
    warmingInterval = null;
    console.log('Cache warming automático parado');
  }
}

/**
 * Função auxiliar para determinar raridade baseada no ranking
 */
function getRarityByMarketCap(rank: number): 'legendary' | 'epic' | 'rare' | 'common' {
  if (rank <= 5) return 'legendary';
  if (rank <= 20) return 'epic';
  if (rank <= 50) return 'rare';
  return 'common';
}

/**
 * Verifica se o cache precisa ser aquecido
 */
export function shouldWarmCache(): boolean {
  const cachedData = getCachedCoinGeckoPrices();
  
  if (!cachedData || cachedData.length === 0) {
    return true;
  }
  
  // Verificar se os dados estão muito antigos
  const firstItem = cachedData[0] as any;
  const cacheAge = Date.now() - new Date(firstItem?.cached_at || 0).getTime();
  const maxAge = CACHE_CONFIG.TTL.TOKEN_PRICES * 0.8; // 80% do TTL
  
  return cacheAge > maxAge;
}

// Iniciar cache warming automaticamente em produção
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  startCacheWarming();
}
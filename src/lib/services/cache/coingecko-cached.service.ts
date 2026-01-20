/**
 * CoinGecko Cached Service - Serviço Principal com SWR
 *
 * Combina todas as otimizações em um único serviço:
 * - TieredCache (L1 memória + L2 arquivo)
 * - Mutex (previne chamadas paralelas)
 * - SWR (Stale-While-Revalidate)
 * - Ghost tokens inteligentes
 *
 * USO:
 * import { getTop100TokensWithSWR, getMarketDataByIds } from '@/lib/services/cache/coingecko-cached.service';
 */

import { TokenMarketData, CACHE_CONFIG } from './types';
import { getTop100Cache, getTokenCache, TieredCache } from './tiered-cache';
import { getMutex } from './mutex';

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

// ============================================================================
// SYMBOL TO ID MAP (preservado do serviço original)
// ============================================================================

export const SYMBOL_TO_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'AVAX': 'avalanche-2',
  'DOGE': 'dogecoin',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'POL': 'matic-network',
  'MATIC': 'matic-network',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'LTC': 'litecoin',
  'SHIB': 'shiba-inu',
  'TRX': 'tron',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'XLM': 'stellar',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'ICP': 'internet-computer',
  'FIL': 'filecoin',
  'HBAR': 'hedera-hashgraph',
  'APT': 'aptos',
  'NEAR': 'near',
  'STX': 'blockstack',
  'IMX': 'immutable-x',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'INJ': 'injective-protocol',
  'SUI': 'sui',
  'RUNE': 'thorchain',
  'GRT': 'the-graph',
  'AAVE': 'aave',
  'MKR': 'maker',
  'SNX': 'synthetix-network-token',
  'LDO': 'lido-dao',
  'PEPE': 'pepe',
  'WIF': 'dogwifcoin',
  'BONK': 'bonk',
  'FLOKI': 'floki',
  'PENGU': 'pudgy-penguins',
  'RENDER': 'render-token',
  'FET': 'fetch-ai',
  'TAO': 'bittensor',
  'AR': 'arweave',
  'THETA': 'theta-token',
  'SAND': 'the-sandbox',
  'MANA': 'decentraland',
  'AXS': 'axie-infinity',
  'GALA': 'gala',
  'ENJ': 'enjincoin',
  'CHZ': 'chiliz',
  'FLOW': 'flow',
  'KAVA': 'kava',
  'XTZ': 'tezos',
  'EOS': 'eos',
  'EGLD': 'elrond-erd-2',
  'CAKE': 'pancakeswap-token',
  'CRV': 'curve-dao-token',
  'COMP': 'compound-governance-token',
  'SUSHI': 'sushi',
  '1INCH': '1inch',
  'BAT': 'basic-attention-token',
  'ZRX': '0x',
  'YFI': 'yearn-finance',
  'STETH': 'staked-ether',
  'WBTC': 'wrapped-bitcoin',
  'DAI': 'dai',
  'USDD': 'usdd',
  'HYPE': 'hyperliquid',
  'JLP': 'jupiter-perpetuals-liquidity-provider-token',
  'ZEC': 'zcash',
  'PUMP': 'pump-fun',
  'XMR': 'monero',
  'BCH': 'bitcoin-cash',
  'ETC': 'ethereum-classic',
  'DASH': 'dash',
  'CRO': 'crypto-com-coin',
  'FLR': 'flare-networks',
  'KAS': 'kaspa',
  'TON': 'the-open-network',
  'LEO': 'leo-token',
  'OKB': 'okb',
  'KCS': 'kucoin-shares',
  'MNT': 'mantle',
  'WLD': 'worldcoin-wld',
  'QNT': 'quant-network',
  'ONDO': 'ondo-finance',
  'PAXG': 'pax-gold',
  'XAUT': 'tether-gold',
  'GT': 'gatetoken',
  'ENA': 'ethena',
  'BGB': 'bitget-token',
  'WETH': 'weth',
  'WBNB': 'wbnb',
  'WSTETH': 'wrapped-steth',
  'RETH': 'rocket-pool-eth',
  'WEETH': 'wrapped-eeth',
  'WBETH': 'wrapped-beacon-eth',
  'CBBTC': 'coinbase-wrapped-btc',
  'JITOSOL': 'jito-staked-sol',
  'BNSOL': 'binance-staked-sol',
  'PYUSD': 'paypal-usd',
  'USDE': 'ethena-usde',
  'SUSDE': 'ethena-staked-usde',
  'USDS': 'usds',
  'USDG': 'usd-global',
  'USDtb': 'usdtb',
  'USDTB': 'usdtb',
  'USD1': 'usd1',
  'WBT': 'whitebit',
  'TRUMP': 'official-trump',
  'SKY': 'sky',
  'HTX': 'htx-dao',
  'ASTER': 'aster-2',
  'BFUSD': 'bfusd',
  'BUIDL': 'blackrock-usd-institutional-digital-liquidity-fund',
  'C1USD': 'c1usd',
  'CC': 'canton',
  'FBTC': 'function-fbtc',
  'HASH': 'hash-2',
  'KHYPE': 'kinetiq-staked-hype',
  'M': 'memecore',
  'PI': 'pi-network',
  'RSETH': 'kelp-dao-restaked-eth',
  'SUSDS': 'susds',
  'SYRUPUSDC': 'syrup-usdc',
  'SYRUPUSDT': 'syrupusdt',
  'WLFI': 'world-liberty-financial',
  'BSC-USD': 'binance-bridged-usdt-bnb-smart-chain',
  'FIGR_HELOC': 'figure-heloc',
  'USDF': 'falcon-usd',
  'USDT0': 'usdt0',
};

// Mapa reverso para buscar símbolo a partir do ID
const ID_TO_SYMBOL_MAP: Record<string, string> = Object.entries(SYMBOL_TO_ID_MAP)
  .reduce((acc, [symbol, id]) => {
    if (!acc[id]) acc[id] = symbol; // Primeiro símbolo encontrado ganha
    return acc;
  }, {} as Record<string, string>);

// ============================================================================
// HELPERS
// ============================================================================

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter
          ? parseInt(retryAfter) * 1000
          : INITIAL_RETRY_DELAY * Math.pow(2, attempt);

        if (attempt < retries) {
          console.warn(`⏳ [RETRY ${attempt + 1}/${retries}] Rate limit. Aguardando ${waitTime}ms...`);
          await sleep(waitTime);
          continue;
        }
      }

      const errorText = await response.text();
      throw new Error(`CoinGecko API error: ${response.status} - ${errorText.substring(0, 100)}`);
    } catch (error) {
      lastError = error as Error;

      if (attempt < retries) {
        const waitTime = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.warn(`⏳ [RETRY ${attempt + 1}/${retries}] Erro de rede. Aguardando ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }
    }
  }

  throw lastError || new Error('Falha após múltiplas tentativas');
}

// ============================================================================
// GHOST TOKENS
// ============================================================================

/**
 * Fallback de imagens para tokens comuns
 */
const TOKEN_IMAGE_FALLBACKS: Record<string, string> = {
  'bitcoin': 'https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png',
  'ethereum': 'https://coin-images.coingecko.com/coins/images/279/small/ethereum.png',
  'solana': 'https://coin-images.coingecko.com/coins/images/4128/small/solana.png',
  'binancecoin': 'https://coin-images.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  'ripple': 'https://coin-images.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  'cardano': 'https://coin-images.coingecko.com/coins/images/975/small/cardano.png',
  'dogecoin': 'https://coin-images.coingecko.com/coins/images/5/small/dogecoin.png',
  'polkadot': 'https://coin-images.coingecko.com/coins/images/12171/small/polkadot.png',
  'chainlink': 'https://coin-images.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  'uniswap': 'https://coin-images.coingecko.com/coins/images/12504/small/uni.jpg',
};

/**
 * Cria ghost token com dados do cache se disponível
 */
function createGhostToken(
  tokenId: string,
  symbol?: string,
  cachedData?: TokenMarketData | null
): TokenMarketData {
  const resolvedSymbol = symbol || ID_TO_SYMBOL_MAP[tokenId] || tokenId.toUpperCase();
  const fallbackImage = TOKEN_IMAGE_FALLBACKS[tokenId] || '/icons/coinx.svg';

  // Se temos dados em cache, usar como base (último preço conhecido)
  if (cachedData) {
    console.log(`👻 Ghost token com dados do cache: ${resolvedSymbol} (preço: $${cachedData.current_price})`);
    return {
      ...cachedData,
      // Manter preço mas zerar variações (dados desatualizados)
      price_change_percentage_1h_in_currency: 0,
      price_change_percentage_24h: 0,
      price_change_percentage_7d_in_currency: 0,
      price_change_percentage_30d_in_currency: 0,
    };
  }

  console.warn(`👻 Ghost token (sem cache): ${resolvedSymbol}`);
  return {
    id: tokenId,
    symbol: resolvedSymbol,
    name: tokenId.charAt(0).toUpperCase() + tokenId.slice(1).replace(/-/g, ' '),
    image: fallbackImage,
    current_price: 0,
    price_change_percentage_1h_in_currency: 0,
    price_change_percentage_24h: 0,
    price_change_percentage_7d_in_currency: 0,
    price_change_percentage_30d_in_currency: 0,
    market_cap: 0,
    total_volume: 0,
    market_cap_rank: null,
  };
}

// ============================================================================
// TOP 100 TOKENS (com SWR)
// ============================================================================

/**
 * Busca Top 100 tokens com padrão Stale-While-Revalidate
 *
 * Comportamento:
 * - FRESH: Retorna imediatamente do cache
 * - STALE: Retorna do cache + dispara revalidação em background
 * - MISS/EXPIRED: Aguarda fetch (com mutex para evitar duplicação)
 */
export async function getTop100TokensWithSWR(): Promise<TokenMarketData[]> {
  const cache = getTop100Cache<TokenMarketData[]>();
  const mutex = getMutex();
  const cacheKey = 'top100';

  // 1. Verificar cache
  const cacheResult = await cache.get(cacheKey);

  // 2. Se FRESH, retornar imediatamente
  if (cacheResult.state === 'FRESH') {
    console.log(`✅ [SWR] Top 100 FRESH (age: ${Math.round(cacheResult.age / 1000)}s)`);
    return cacheResult.data!;
  }

  // 3. Se STALE, retornar + revalidar em background
  if (cacheResult.state === 'STALE' && cacheResult.data) {
    console.log(`🔄 [SWR] Top 100 STALE, retornando + revalidando em background`);

    // Revalidar em background (não bloqueia)
    revalidateTop100InBackground().catch(err => {
      console.error(`❌ [SWR] Erro na revalidação em background:`, err);
    });

    return cacheResult.data;
  }

  // 4. MISS ou EXPIRED - Fetch com mutex
  console.log(`⏳ [SWR] Top 100 ${cacheResult.state}, fazendo fetch com mutex...`);

  return mutex.withLock(cacheKey, async () => {
    // Double-check: outro processo pode ter populado o cache
    const recheckResult = await cache.get(cacheKey);
    if (recheckResult.state === 'FRESH' || recheckResult.state === 'STALE') {
      console.log(`✅ [SWR] Cache populado por outro processo`);
      return recheckResult.data!;
    }

    // Fetch real
    const tokens = await fetchTop100FromAPI();

    // Salvar no cache
    await cache.set(cacheKey, tokens, {
      freshTTL: CACHE_CONFIG.TOP100_FRESH_TTL,
      staleTTL: CACHE_CONFIG.TOP100_STALE_TTL,
    });

    // Forçar persistência do top100
    await cache.forceFlush();

    // Popular cache individual de tokens (já faz forceFlush internamente)
    await populateTokenCacheFromTop100(tokens);

    return tokens;
  });
}

/**
 * Revalida Top 100 em background (não bloqueia)
 */
async function revalidateTop100InBackground(): Promise<void> {
  const cache = getTop100Cache<TokenMarketData[]>();
  const mutex = getMutex();
  const cacheKey = 'top100';

  // Usar mutex para evitar múltiplas revalidações simultâneas
  if (mutex.isLocked(cacheKey)) {
    console.log(`⏭️ [SWR] Revalidação já em andamento, ignorando`);
    return;
  }

  return mutex.withLock(`${cacheKey}_revalidate`, async () => {
    console.log(`🔄 [SWR] Iniciando revalidação em background...`);

    try {
      const tokens = await fetchTop100FromAPI();

      // Atualizar cache
      await cache.set(cacheKey, tokens, {
        freshTTL: CACHE_CONFIG.TOP100_FRESH_TTL,
        staleTTL: CACHE_CONFIG.TOP100_STALE_TTL,
      });

      // Forçar persistência do top100
      await cache.forceFlush();

      // Popular cache individual (já faz forceFlush internamente)
      await populateTokenCacheFromTop100(tokens);

      console.log(`✅ [SWR] Revalidação em background concluída`);
    } catch (error) {
      console.error(`❌ [SWR] Erro na revalidação:`, error);
      // Não propagar erro - é background
    }
  });
}

/**
 * Fetch real do Top 100 da API CoinGecko
 */
async function fetchTop100FromAPI(): Promise<TokenMarketData[]> {
  console.log('🌐 [API] Buscando Top 100 da CoinGecko...');

  const allTokens: TokenMarketData[] = [];
  const TARGET_COUNT = 100;
  const MAX_PAGES = 3;

  for (let page = 1; page <= MAX_PAGES && allTokens.length < TARGET_COUNT; page++) {
    const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
    url.searchParams.set('vs_currency', 'usd');
    url.searchParams.set('order', 'market_cap_desc');
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', page.toString());
    url.searchParams.set('price_change_percentage', '1h,24h,7d,30d');

    const response = await fetchWithRetry(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MFL-Platform/1.0',
      },
      cache: 'no-store',
    });

    const pageData = await response.json();
    console.log(`   ✅ Página ${page}: ${pageData.length} tokens`);

    const validTokens = pageData
      .filter((token: any) => token.current_price && token.current_price > 0)
      .slice(0, TARGET_COUNT - allTokens.length)
      .map((token: any): TokenMarketData => ({
        id: token.id,
        symbol: token.symbol.toUpperCase(),
        name: token.name,
        image: token.image,
        current_price: token.current_price || 0,
        price_change_percentage_1h_in_currency: token.price_change_percentage_1h_in_currency,
        price_change_percentage_24h: token.price_change_percentage_24h,
        price_change_percentage_7d_in_currency: token.price_change_percentage_7d_in_currency,
        price_change_percentage_30d_in_currency: token.price_change_percentage_30d_in_currency,
        market_cap: token.market_cap || 0,
        total_volume: token.total_volume || 0,
        market_cap_rank: token.market_cap_rank,
      }));

    allTokens.push(...validTokens);

    if (page < MAX_PAGES && allTokens.length < TARGET_COUNT) {
      await sleep(500); // Delay entre páginas
    }
  }

  console.log(`✅ [API] Top 100 obtido: ${allTokens.length} tokens`);
  return allTokens;
}

/**
 * Popula cache individual de tokens a partir do Top 100
 */
async function populateTokenCacheFromTop100(tokens: TokenMarketData[]): Promise<void> {
  const tokenCache = getTokenCache<TokenMarketData>();

  for (const token of tokens) {
    await tokenCache.set(`token:${token.id}`, token, {
      freshTTL: CACHE_CONFIG.TOKEN_FRESH_TTL,
      staleTTL: CACHE_CONFIG.TOKEN_STALE_TTL,
    });
  }

  // Forçar persistência imediata após batch save
  await tokenCache.forceFlush();

  console.log(`💾 [CACHE] ${tokens.length} tokens populados e persistidos no cache individual`);
}

// ============================================================================
// MARKET DATA BY IDS (para times de usuário)
// ============================================================================

/**
 * Busca dados de mercado para uma lista de IDs de tokens
 *
 * Otimizações:
 * - Verifica cache individual primeiro
 * - Usa ghost tokens inteligentes quando apropriado
 * - Faz batch request apenas para tokens faltantes
 */
export async function getMarketDataByIds(ids: string[]): Promise<TokenMarketData[]> {
  if (!ids || ids.length === 0) {
    return [];
  }

  const uniqueIds = [...new Set(ids)];
  const tokenCache = getTokenCache<TokenMarketData>();

  // 1. Verificar cache individual
  const cached: TokenMarketData[] = [];
  const missing: string[] = [];

  for (const id of uniqueIds) {
    const result = await tokenCache.get(`token:${id}`);
    if (result.data && (result.state === 'FRESH' || result.state === 'STALE')) {
      cached.push(result.data);
    } else {
      missing.push(id);
    }
  }

  if (cached.length > 0) {
    console.log(`💾 [CACHE] ${cached.length}/${uniqueIds.length} tokens em cache`);
  }

  // 2. Se todos em cache, retornar
  if (missing.length === 0) {
    console.log(`💾 [CACHE_FULL_HIT] Todos os ${cached.length} tokens em cache!`);
    return cached;
  }

  // 3. Verificar se devemos usar ghost tokens (evitar rate limit)
  const cacheHitRate = cached.length / uniqueIds.length;

  if (cacheHitRate >= CACHE_CONFIG.CACHE_HIT_RATE_THRESHOLD &&
      missing.length <= CACHE_CONFIG.GHOST_TOKEN_THRESHOLD) {
    console.log(`🛡️ [RATE_LIMIT_PROTECTION] ${Math.round(cacheHitRate * 100)}% em cache, usando ghost para ${missing.length} faltantes`);

    const ghostTokens = await Promise.all(
      missing.map(async id => {
        // Tentar buscar dados stale do cache para ghost mais inteligente
        const staleResult = await tokenCache.get(`token:${id}`);
        return createGhostToken(id, undefined, staleResult.data);
      })
    );

    return [...cached, ...ghostTokens];
  }

  // 4. Fetch tokens faltantes da API
  console.log(`🌐 [API] Buscando ${missing.length} tokens faltantes...`);

  const mutex = getMutex();
  const cacheKey = `tokens:${missing.sort().join(',')}`;

  const freshTokens = await mutex.withLock(cacheKey, async () => {
    // Double-check cache
    const stillMissing: string[] = [];
    const foundInCache: TokenMarketData[] = [];

    for (const id of missing) {
      const result = await tokenCache.get(`token:${id}`);
      if (result.data) {
        foundInCache.push(result.data);
      } else {
        stillMissing.push(id);
      }
    }

    if (stillMissing.length === 0) {
      return foundInCache;
    }

    // Fetch da API
    const fetched = await fetchTokensByIdsFromAPI(stillMissing);

    // Salvar no cache
    for (const token of fetched) {
      await tokenCache.set(`token:${token.id}`, token, {
        freshTTL: CACHE_CONFIG.TOKEN_FRESH_TTL,
        staleTTL: CACHE_CONFIG.TOKEN_STALE_TTL,
      });
    }

    // Forçar persistência após batch save
    if (fetched.length > 0) {
      await tokenCache.forceFlush();
    }

    return [...foundInCache, ...fetched];
  });

  return [...cached, ...freshTokens];
}

/**
 * Fetch tokens específicos da API CoinGecko
 */
async function fetchTokensByIdsFromAPI(tokenIds: string[]): Promise<TokenMarketData[]> {
  if (tokenIds.length === 0) return [];

  console.log(`🌐 [API] Requisitando ${tokenIds.length} tokens específicos...`);

  const idsString = tokenIds.join(',');
  const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
  url.searchParams.set('vs_currency', 'usd');
  url.searchParams.set('ids', idsString);
  url.searchParams.set('price_change_percentage', '1h,24h,7d,30d');

  try {
    const response = await fetchWithRetry(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MFL-Platform/1.0',
      },
      cache: 'no-cache',
    });

    const data = await response.json();
    console.log(`✅ [API] ${data.length} tokens recebidos`);

    return data.map((token: any): TokenMarketData => ({
      id: token.id,
      symbol: token.symbol.toUpperCase(),
      name: token.name,
      image: token.image,
      current_price: token.current_price || 0,
      price_change_percentage_1h_in_currency: token.price_change_percentage_1h_in_currency,
      price_change_percentage_24h: token.price_change_percentage_24h,
      price_change_percentage_7d_in_currency: token.price_change_percentage_7d_in_currency,
      price_change_percentage_30d_in_currency: token.price_change_percentage_30d_in_currency,
      market_cap: token.market_cap || 0,
      total_volume: token.total_volume || 0,
      market_cap_rank: token.market_cap_rank,
    }));
  } catch (error) {
    console.error(`❌ [API] Erro ao buscar tokens:`, error);
    // Retornar ghost tokens em caso de erro
    return tokenIds.map(id => createGhostToken(id));
  }
}

// ============================================================================
// HELPERS PÚBLICOS
// ============================================================================

/**
 * Converte símbolos para IDs da CoinGecko
 */
export function symbolsToIds(symbols: string[]): string[] {
  return symbols
    .map(symbol => SYMBOL_TO_ID_MAP[symbol.toUpperCase()])
    .filter((id): id is string => id !== undefined);
}

/**
 * Busca dados com fallback para ghost tokens
 * Equivalente à getMarketDataWithFallback do serviço antigo
 */
export async function getMarketDataWithFallback(symbols: string[]): Promise<TokenMarketData[]> {
  const ids = symbolsToIds(symbols);

  if (ids.length === 0) {
    return symbols.map(s => createGhostToken(`unknown-${s.toLowerCase()}`, s));
  }

  // Criar mapa símbolo → ID
  const symbolToIdMap = new Map<string, string>();
  symbols.forEach(symbol => {
    const id = SYMBOL_TO_ID_MAP[symbol.toUpperCase()];
    if (id) symbolToIdMap.set(symbol.toUpperCase(), id);
  });

  // Buscar dados
  const apiData = await getMarketDataByIds(ids);
  const apiDataMap = new Map(apiData.map(t => [t.id, t]));

  // Construir resultado com fallback
  const result: TokenMarketData[] = [];

  for (const symbol of symbols) {
    const tokenId = symbolToIdMap.get(symbol.toUpperCase());

    if (!tokenId) {
      result.push(createGhostToken(`unknown-${symbol.toLowerCase()}`, symbol));
      continue;
    }

    const apiToken = apiDataMap.get(tokenId);
    if (apiToken) {
      result.push(apiToken);
    } else {
      result.push(createGhostToken(tokenId, symbol));
    }
  }

  return result;
}

/**
 * Garante que o cache está populado (para uso antes de outras operações)
 */
export async function ensureCachePopulated(): Promise<boolean> {
  try {
    const tokens = await getTop100TokensWithSWR();
    return tokens.length > 0;
  } catch (error) {
    console.error('❌ [CACHE] Erro ao popular cache:', error);
    return false;
  }
}

/**
 * Retorna estatísticas do cache
 */
export function getCacheStats() {
  const top100Cache = getTop100Cache<TokenMarketData[]>();
  const tokenCache = getTokenCache<TokenMarketData>();
  const mutex = getMutex();

  return {
    top100: top100Cache.getStats(),
    tokens: tokenCache.getStats(),
    mutex: mutex.getStats(),
  };
}

// ============================================================================
// ALIASES PARA COMPATIBILIDADE
// ============================================================================

// Aliases para facilitar migração
export type { TokenMarketData as CoinGeckoTokenData };
export const getTop100Tokens = getTop100TokensWithSWR;
export const getMarketDataByTokenIds = getMarketDataByIds;
export const getMarketDataWithFallbackDedupe = getMarketDataWithFallback;
export const getMarketDataByTokenIdsDedupe = getMarketDataByIds;

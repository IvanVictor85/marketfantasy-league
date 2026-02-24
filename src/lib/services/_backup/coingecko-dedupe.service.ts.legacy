/**
 * CoinGecko Service com Request Deduplication
 *
 * Solução para o problema de rate limiting causado por requisições paralelas.
 *
 * PROBLEMAS RESOLVIDOS:
 * 1. ✅ Requisições paralelas para mesmos tokens
 * 2. ✅ Cache insuficiente (conjuntos diferentes = cache miss)
 * 3. ✅ Rate limit 429 causando delays de 20-60s
 * 4. ✅ Múltiplas páginas chamando APIs simultaneamente
 */

import { CoinGeckoTokenData, SYMBOL_TO_ID_MAP } from './coingecko.service';

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const CACHE_TTL = 30 * 60 * 1000; // 30 minutos - evita Rate Limit (429)
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const REQUEST_QUEUE_DELAY = 500; // 500ms entre requisições

// ============================================================================
// TYPES
// ============================================================================

interface TokenCacheEntry {
  data: CoinGeckoTokenData;
  timestamp: number;
}

interface PendingRequest {
  promise: Promise<CoinGeckoTokenData[]>;
  tokenIds: string[];
}

// ============================================================================
// CACHE & STATE MANAGEMENT
// ============================================================================

/**
 * Cache individual por token (granular)
 * Permite reuso máximo entre requisições diferentes
 */
const tokenCache = new Map<string, TokenCacheEntry>();

/**
 * Fila de requisições pendentes para deduplicação
 * Se já existe uma requisição em andamento para um conjunto de tokens,
 * requisições subsequentes aguardam a mesma Promise
 */
const pendingRequests = new Map<string, PendingRequest>();

/**
 * Fila de requisições aguardando execução (request queue)
 * Evita disparar múltiplas requisições simultâneas ao CoinGecko
 */
const requestQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;

// ============================================================================
// CACHE HELPERS
// ============================================================================

/**
 * Verifica se um token está em cache e ainda válido
 */
function isCached(tokenId: string): boolean {
  const entry = tokenCache.get(tokenId);
  if (!entry) return false;

  const age = Date.now() - entry.timestamp;
  return age < CACHE_TTL;
}

/**
 * Recupera token do cache (se válido)
 */
function getFromCache(tokenId: string): CoinGeckoTokenData | null {
  if (!isCached(tokenId)) return null;
  return tokenCache.get(tokenId)!.data;
}

/**
 * Salva token no cache individual
 */
function saveToCache(token: CoinGeckoTokenData): void {
  tokenCache.set(token.id, {
    data: token,
    timestamp: Date.now()
  });
}

/**
 * ✅ SINCRONIZAÇÃO DE CACHE: Popula o cache de dedupe a partir de um array de tokens
 * Chamado pelo coingecko.service.ts após carregar o Top 100
 * Isso evita que requisições subsequentes façam chamadas duplicadas à API
 */
export function populateCacheFromTokens(tokens: CoinGeckoTokenData[]): void {
  const now = Date.now();
  let added = 0;

  for (const token of tokens) {
    // Só adicionar se não existir ou estiver expirado
    if (!isCached(token.id)) {
      tokenCache.set(token.id, {
        data: token,
        timestamp: now
      });
      added++;
    }
  }

  if (added > 0) {
    console.log(`🔄 [CACHE_SYNC] ${added} tokens sincronizados do Top 100 para cache de dedupe`);
  }
}

/**
 * Recupera múltiplos tokens do cache
 * Retorna array com tokens encontrados + array de IDs faltantes
 */
function getMultipleFromCache(tokenIds: string[]): {
  cached: CoinGeckoTokenData[];
  missing: string[];
} {
  const cached: CoinGeckoTokenData[] = [];
  const missing: string[] = [];

  for (const id of tokenIds) {
    const token = getFromCache(id);
    if (token) {
      cached.push(token);
    } else {
      missing.push(id);
    }
  }

  return { cached, missing };
}

// ============================================================================
// REQUEST QUEUE (evitar requisições paralelas)
// ============================================================================

/**
 * Adiciona uma requisição na fila e aguarda sua execução
 */
async function enqueueRequest<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    // Iniciar processamento da fila se não estiver rodando
    if (!isProcessingQueue) {
      processQueue();
    }
  });
}

/**
 * Processa a fila de requisições sequencialmente
 */
async function processQueue(): Promise<void> {
  if (isProcessingQueue) return;

  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      try {
        await request();
      } catch (error) {
        console.error('❌ Erro ao processar requisição na fila:', error);
      }

      // Aguardar antes da próxima requisição
      if (requestQueue.length > 0) {
        await sleep(REQUEST_QUEUE_DELAY);
      }
    }
  }

  isProcessingQueue = false;
}

// ============================================================================
// FETCH HELPERS
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

      // Rate limit - retry com backoff
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
      console.error(`❌ [COINGECKO_ERROR_${response.status}]`, {
        status: response.status,
        url: url.substring(0, 100)
      });

      throw new Error(`CoinGecko API error: ${response.status}`);
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
// MAIN API FUNCTION
// ============================================================================

/**
 * Busca dados de tokens com deduplicação e cache granular
 *
 * FEATURES:
 * - ✅ Cache individual por token (reuso máximo)
 * - ✅ Request deduplication (evita requisições paralelas)
 * - ✅ Request queue (serializa chamadas ao CoinGecko)
 * - ✅ Cache mais longo (15min vs 10min)
 *
 * @param ids - Array de IDs da CoinGecko
 * @returns Promise com dados dos tokens
 */
export async function getMarketDataByTokenIdsDedupe(
  ids: string[]
): Promise<CoinGeckoTokenData[]> {
  if (!ids || ids.length === 0) {
    console.warn('⚠️ Array de IDs vazio');
    return [];
  }

  try {
    const uniqueIds = [...new Set(ids)].sort();

    // 1️⃣ CACHE: Verificar cache individual por token
    const { cached, missing } = getMultipleFromCache(uniqueIds);

    if (cached.length > 0) {
      console.log(`💾 [CACHE_HIT] ${cached.length}/${uniqueIds.length} tokens em cache`);
    }

    // Se todos os tokens estão em cache, retornar imediatamente
    if (missing.length === 0) {
      console.log(`💾 [CACHE_FULL_HIT] Todos os ${cached.length} tokens em cache!`);
      return cached;
    }

    // ✅ OTIMIZAÇÃO: Se temos a maioria em cache e poucos faltam, usar ghost tokens
    // Isso evita rate limit quando apenas 1-2 tokens estão faltando
    const cacheHitRate = cached.length / uniqueIds.length;
    const MAX_MISSING_FOR_GHOST = 3; // Máximo de tokens para usar ghost em vez de API

    if (cacheHitRate >= 0.7 && missing.length <= MAX_MISSING_FOR_GHOST) {
      console.log(`🛡️ [RATE_LIMIT_PROTECTION] ${cached.length}/${uniqueIds.length} em cache (${Math.round(cacheHitRate * 100)}%), usando ghost para ${missing.length} faltantes`);
      const ghostTokens = missing.map(id => createGhostTokenById(id));
      return [...cached, ...ghostTokens];
    }

    console.log(`🌐 [CACHE_MISS] Faltam ${missing.length} tokens. Buscando da API...`);

    // 2️⃣ DEDUPLICATION: Verificar se já existe requisição pendente
    const cacheKey = missing.sort().join(',');

    if (pendingRequests.has(cacheKey)) {
      console.log(`⏳ [DEDUPE] Aguardando requisição em andamento (${missing.length} tokens)...`);
      const pending = pendingRequests.get(cacheKey)!;
      const freshData = await pending.promise;

      // Retornar cached + freshData
      return [...cached, ...freshData];
    }

    // 3️⃣ NOVA REQUISIÇÃO: Criar Promise e armazenar como pendente
    const fetchPromise = fetchMissingTokens(missing);

    pendingRequests.set(cacheKey, {
      promise: fetchPromise,
      tokenIds: missing
    });

    try {
      const freshData = await fetchPromise;

      // Salvar tokens no cache individual
      freshData.forEach(token => saveToCache(token));

      console.log(`💾 [CACHE_SAVE] ${freshData.length} tokens salvos (TTL: ${Math.round(CACHE_TTL / 60000)}min)`);

      // Retornar cached + freshData
      return [...cached, ...freshData];

    } finally {
      // Remover da fila de pendentes
      pendingRequests.delete(cacheKey);
    }

  } catch (error) {
    console.error('❌ Erro ao buscar tokens:', error);

    // Fallback: retornar apenas dados em cache (se houver)
    const { cached } = getMultipleFromCache(ids);
    if (cached.length > 0) {
      console.warn(`⚠️ [FALLBACK] Retornando ${cached.length} tokens do cache após erro`);
      return cached;
    }

    return [];
  }
}

/**
 * Faz requisição real à API CoinGecko (enfileirada)
 */
async function fetchMissingTokens(tokenIds: string[]): Promise<CoinGeckoTokenData[]> {
  return enqueueRequest(async () => {
    console.log(`🔍 [API_REQUEST] Requisitando ${tokenIds.length} tokens do CoinGecko...`);
    console.log(`   Primeiros 10 IDs:`, tokenIds.slice(0, 10));

    const idsString = tokenIds.join(',');
    const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
    url.searchParams.set('vs_currency', 'usd');
    url.searchParams.set('ids', idsString);
    url.searchParams.set('price_change_percentage', '1h,24h,7d,30d');

    const response = await fetchWithRetry(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MFL-Platform/1.0',
      },
      cache: 'no-cache',
    });

    const data = await response.json();
    console.log(`✅ CoinGecko: ${data.length} tokens recebidos`);

    const tokens: CoinGeckoTokenData[] = data.map((token: any) => ({
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

    return tokens;
  });
}

/**
 * Converte símbolos para IDs (helper)
 */
export function symbolsToIds(symbols: string[]): string[] {
  return symbols
    .map(symbol => {
      const upperSymbol = symbol.toUpperCase();
      return SYMBOL_TO_ID_MAP[upperSymbol];
    })
    .filter((id): id is string => id !== undefined);
}

/**
 * Busca dados com fallback para símbolos
 */
export async function getMarketDataBySymbolsDedupe(
  symbols: string[]
): Promise<CoinGeckoTokenData[]> {
  const ids = symbolsToIds(symbols);
  if (ids.length === 0) return [];

  return getMarketDataByTokenIdsDedupe(ids);
}

/**
 * Busca dados com REDE DE SEGURANÇA para tokens delistados (versão dedupe)
 *
 * Equivalente à `getMarketDataWithFallback` mas usando deduplicação.
 * Garante que todos os símbolos solicitados tenham um objeto de retorno.
 * Se um token não for encontrado na API (delistado), cria um "ghost token".
 *
 * @param symbols - Array de símbolos (ex: ['BTC', 'PENGU'])
 * @returns Array com dados completos (inclui ghosts se necessário)
 */
export async function getMarketDataWithFallbackDedupe(
  symbols: string[]
): Promise<CoinGeckoTokenData[]> {
  const ids = symbolsToIds(symbols);

  if (ids.length === 0) {
    console.warn('⚠️ Nenhum ID válido encontrado');
    // Criar ghost tokens para todos os símbolos
    return symbols.map(s => createGhostToken(`unknown-${s.toLowerCase()}`, s));
  }

  // Criar mapa símbolo → ID
  const symbolToIdMap = new Map<string, string>();
  symbols.forEach(symbol => {
    const upperSymbol = symbol.toUpperCase();
    const id = SYMBOL_TO_ID_MAP[upperSymbol];
    if (id) {
      symbolToIdMap.set(upperSymbol, id);
    }
  });

  // Buscar dados da API (com dedupe)
  const apiData = await getMarketDataByTokenIdsDedupe(ids);
  const apiDataMap = new Map(apiData.map(token => [token.id, token]));

  // Construir resultado com fallback
  const result: CoinGeckoTokenData[] = [];

  for (const symbol of symbols) {
    const upperSymbol = symbol.toUpperCase();
    const tokenId = symbolToIdMap.get(upperSymbol);

    if (!tokenId) {
      // Símbolo não mapeado - criar ghost
      result.push(createGhostToken(`unknown-${symbol.toLowerCase()}`, symbol));
      continue;
    }

    const apiToken = apiDataMap.get(tokenId);

    if (apiToken) {
      // Token encontrado na API ✅
      result.push(apiToken);
    } else {
      // Token não retornado pela API (delistado) - criar ghost 👻
      result.push(createGhostToken(tokenId, symbol));
    }
  }

  const ghostCount = result.length - apiData.length;
  if (ghostCount > 0) {
    console.log(`👻 ${ghostCount} ghost token(s) criado(s)`);
  }

  return result;
}

/**
 * Cria um token "fantasma" (placeholder) para tokens delistados ou indisponíveis
 */
function createGhostToken(tokenId: string, symbol: string): CoinGeckoTokenData {
  console.warn(`👻 Criando ghost token para: ${symbol} (${tokenId})`);

  return {
    id: tokenId,
    symbol: symbol.toUpperCase(),
    name: 'Token Não Encontrado',
    image: '/icons/coinx.svg',
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

/**
 * Cria um ghost token a partir de um ID (quando não temos o símbolo)
 * Usado para evitar rate limit quando poucos tokens estão faltando no cache
 */
function createGhostTokenById(tokenId: string): CoinGeckoTokenData {
  // Tentar descobrir o símbolo a partir do ID
  const symbol = Object.entries(SYMBOL_TO_ID_MAP).find(([_, id]) => id === tokenId)?.[0] || tokenId.toUpperCase();
  console.warn(`👻 Criando ghost token (by ID) para: ${tokenId} → ${symbol}`);

  return {
    id: tokenId,
    symbol: symbol,
    name: tokenId.charAt(0).toUpperCase() + tokenId.slice(1).replace(/-/g, ' '),
    image: '/icons/coinx.svg',
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

/**
 * Retorna estatísticas do cache para debug
 */
export function getCacheStats() {
  const now = Date.now();
  const entries = Array.from(tokenCache.entries()).map(([id, entry]) => ({
    id,
    age: Math.round((now - entry.timestamp) / 1000),
    ttl: Math.round(CACHE_TTL / 1000),
    isExpired: (now - entry.timestamp) > CACHE_TTL
  }));

  return {
    totalCached: tokenCache.size,
    pendingRequests: pendingRequests.size,
    queuedRequests: requestQueue.length,
    isProcessingQueue,
    entries
  };
}

/**
 * Limpa cache expirado (pode ser chamado periodicamente)
 */
export function cleanupCache() {
  const now = Date.now();
  let removed = 0;

  for (const [id, entry] of tokenCache.entries()) {
    if ((now - entry.timestamp) > CACHE_TTL) {
      tokenCache.delete(id);
      removed++;
    }
  }

  if (removed > 0) {
    console.log(`🗑️ [CACHE_CLEANUP] ${removed} tokens expirados removidos`);
  }
}

// Auto-cleanup a cada 10 minutos (se no servidor)
if (typeof window === 'undefined') {
  setInterval(cleanupCache, 10 * 60 * 1000);
}

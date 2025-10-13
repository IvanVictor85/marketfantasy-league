import { z } from 'zod';

// Schema para validar dados do cache
const CacheEntrySchema = z.object({
  data: z.any(),
  timestamp: z.number(),
  ttl: z.number(),
});

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

/**
 * Cache simples em memória com TTL (Time To Live)
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;
  private lastCleanup = Date.now();

  /**
   * Armazena um valor no cache
   * @param key Chave do cache
   * @param data Dados a serem armazenados
   * @param ttlMs TTL em milissegundos
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };

    this.cache.set(key, entry);
    
    // Log para debug
    console.log(`Cache SET: ${key} (TTL: ${ttlMs}ms)`);
  }

  /**
   * Recupera um valor do cache
   * @param key Chave do cache
   * @returns Dados armazenados ou null se expirado/não encontrado
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      console.log(`Cache MISS: ${key} (não encontrado)`);
      return null;
    }

    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      this.misses++;
      console.log(`Cache MISS: ${key} (expirado)`);
      return null;
    }

    this.hits++;
    console.log(`Cache HIT: ${key}`);
    return entry.data as T;
  }

  /**
   * Remove uma entrada específica do cache
   * @param key Chave do cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`Cache DELETE: ${key}`);
    }
    return deleted;
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`Cache CLEAR: ${size} entradas removidas`);
  }

  /**
   * Remove entradas expiradas do cache
   */
  cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      const isExpired = (now - entry.timestamp) > entry.ttl;
      if (isExpired) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    this.lastCleanup = now;

    if (removedCount > 0) {
      console.log(`Cache CLEANUP: ${removedCount} entradas expiradas removidas`);
    }
  }

  /**
   * Retorna informações sobre o estado do cache
   */
  getStats(): {
    size: number;
    totalEntries: number;
    hits: number;
    misses: number;
    lastCleanup: number;
    entries: Array<{
      key: string;
      timestamp: number;
      ttl: number;
      isExpired: boolean;
      ageMs: number;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      timestamp: entry.timestamp,
      ttl: entry.ttl,
      isExpired: (now - entry.timestamp) > entry.ttl,
      ageMs: now - entry.timestamp,
    }));

    return {
      size: this.cache.size,
      totalEntries: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      lastCleanup: this.lastCleanup,
      entries,
    };
  }

  /**
   * Verifica se uma chave existe e não está expirada
   * @param key Chave do cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

// Instância global do cache
const globalCache = new MemoryCache();

// Configurações de cache para diferentes tipos de dados
export const CACHE_CONFIG = {
  // TTL para diferentes tipos de dados (em milissegundos)
  TTL: {
    // Preços de tokens - cache mais curto para dados em tempo real
    TOKEN_PRICES: parseInt(process.env.TOKEN_PRICES_CACHE_TTL_MS || '60000'), // 1 minuto
    // Dados de mercado - cache médio
    MARKET_DATA: parseInt(process.env.MARKET_DATA_CACHE_TTL_MS || '300000'), // 5 minutos
    // Lista de tokens - cache mais longo
    TOKEN_LIST: parseInt(process.env.TOKEN_LIST_CACHE_TTL_MS || '900000'), // 15 minutos
    // xStocks data - cache longo
    XSTOCKS_DATA: parseInt(process.env.XSTOCKS_CACHE_TTL_MS || '900000'), // 15 minutos
    // Dados estáticos - cache muito longo
    STATIC_DATA: parseInt(process.env.STATIC_DATA_CACHE_TTL_MS || '3600000'), // 1 hora
  },
  
  // Chaves de cache organizadas por categoria
  KEYS: {
    // Preços de tokens
    COINGECKO_PRICES: 'prices:coingecko:markets',
    HELIUS_PRICES: 'prices:helius:batch',
    TOKEN_PRICE_INDIVIDUAL: (tokenId: string) => `prices:token:${tokenId}`,
    
    // xStocks
    XSTOCKS_ALLOWLIST: 'xstocks:allowlist',
    XSTOCKS_PRICES: 'xstocks:prices',
    XSTOCKS_FULL_DATA: 'xstocks:full_data',
    
    // Dados de mercado
    MARKET_OVERVIEW: 'market:overview',
    TOP_TOKENS: 'market:top_tokens',
    
    // Cache de API responses
    API_RESPONSE: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
  },
  
  // Configurações de rate limiting
  RATE_LIMIT: {
    COINGECKO_REQUESTS_PER_MINUTE: 30,
    HELIUS_REQUESTS_PER_MINUTE: 100,
  },
} as const;

// ============================================================================
// PRICE CACHING FUNCTIONS
// ============================================================================

/**
 * Armazena preços do CoinGecko no cache
 * @param prices Dados de preços do CoinGecko
 */
export function cacheCoinGeckoPrices(prices: any[]): void {
  globalCache.set(
    CACHE_CONFIG.KEYS.COINGECKO_PRICES,
    prices,
    CACHE_CONFIG.TTL.TOKEN_PRICES
  );
}

/**
 * Recupera preços do CoinGecko do cache
 * @returns Dados de preços ou null se não encontrados/expirados
 */
export function getCachedCoinGeckoPrices<T>(): T[] | null {
  return globalCache.get<T[]>(CACHE_CONFIG.KEYS.COINGECKO_PRICES);
}

/**
 * Armazena preços do Helius no cache
 * @param prices Dados de preços do Helius
 */
export function cacheHeliusPrices(prices: any[]): void {
  globalCache.set(
    CACHE_CONFIG.KEYS.HELIUS_PRICES,
    prices,
    CACHE_CONFIG.TTL.TOKEN_PRICES
  );
}

/**
 * Recupera preços do Helius do cache
 * @returns Dados de preços ou null se não encontrados/expirados
 */
export function getCachedHeliusPrices<T>(): T[] | null {
  return globalCache.get<T[]>(CACHE_CONFIG.KEYS.HELIUS_PRICES);
}

/**
 * Armazena preço individual de um token
 * @param tokenId ID do token
 * @param priceData Dados de preço do token
 */
export function cacheTokenPrice(tokenId: string, priceData: any): void {
  globalCache.set(
    CACHE_CONFIG.KEYS.TOKEN_PRICE_INDIVIDUAL(tokenId),
    priceData,
    CACHE_CONFIG.TTL.TOKEN_PRICES
  );
}

/**
 * Recupera preço individual de um token
 * @param tokenId ID do token
 * @returns Dados de preço ou null se não encontrados/expirados
 */
export function getCachedTokenPrice<T>(tokenId: string): T | null {
  return globalCache.get<T>(CACHE_CONFIG.KEYS.TOKEN_PRICE_INDIVIDUAL(tokenId));
}

/**
 * Cache genérico para respostas de API com parâmetros
 * @param endpoint Nome do endpoint
 * @param params Parâmetros da requisição (serializado)
 * @param data Dados da resposta
 * @param ttl TTL customizado (opcional)
 */
export function cacheApiResponse(endpoint: string, params: string, data: any, ttl?: number): void {
  const cacheKey = CACHE_CONFIG.KEYS.API_RESPONSE(endpoint, params);
  const cacheTtl = ttl || CACHE_CONFIG.TTL.MARKET_DATA;
  
  globalCache.set(cacheKey, data, cacheTtl);
}

/**
 * Recupera resposta de API do cache
 * @param endpoint Nome do endpoint
 * @param params Parâmetros da requisição (serializado)
 * @returns Dados da resposta ou null se não encontrados/expirados
 */
export function getCachedApiResponse<T>(endpoint: string, params: string): T | null {
  const cacheKey = CACHE_CONFIG.KEYS.API_RESPONSE(endpoint, params);
  return globalCache.get<T>(cacheKey);
}

// ============================================================================
// XSTOCKS CACHING FUNCTIONS (mantidas para compatibilidade)
// ============================================================================

/**
 * Armazena a allowlist de tokens xStocks no cache
 * @param allowlist Lista de tokens
 */
export function cacheAllowlist(allowlist: any[]): void {
  globalCache.set(
    CACHE_CONFIG.KEYS.XSTOCKS_ALLOWLIST,
    allowlist,
    CACHE_CONFIG.TTL.XSTOCKS_DATA
  );
}

/**
 * Recupera a allowlist de tokens xStocks do cache
 * @returns Lista de tokens ou null se não encontrada/expirada
 */
export function getCachedAllowlist<T>(): T[] | null {
  return globalCache.get<T[]>(CACHE_CONFIG.KEYS.XSTOCKS_ALLOWLIST);
}

/**
 * Armazena dados de preços xStocks no cache
 * @param prices Dados de preços
 */
export function cachePrices(prices: any[]): void {
  globalCache.set(
    CACHE_CONFIG.KEYS.XSTOCKS_PRICES,
    prices,
    CACHE_CONFIG.TTL.XSTOCKS_DATA
  );
}

/**
 * Recupera dados de preços xStocks do cache
 * @returns Dados de preços ou null se não encontrados/expirados
 */
export function getCachedPrices<T>(): T[] | null {
  return globalCache.get<T[]>(CACHE_CONFIG.KEYS.XSTOCKS_PRICES);
}

/**
 * Armazena dados completos da API xStocks no cache
 * @param data Dados completos da API
 */
export function cacheFullData(data: any): void {
  globalCache.set(
    CACHE_CONFIG.KEYS.XSTOCKS_FULL_DATA,
    data,
    CACHE_CONFIG.TTL.XSTOCKS_DATA
  );
}

/**
 * Recupera dados completos da API xStocks do cache
 * @returns Dados completos ou null se não encontrados/expirados
 */
export function getCachedFullData<T>(): T | null {
  return globalCache.get<T>(CACHE_CONFIG.KEYS.XSTOCKS_FULL_DATA);
}

// ============================================================================
// CACHE INVALIDATION FUNCTIONS
// ============================================================================

/**
 * Invalida todo o cache relacionado ao xStocks
 */
export function invalidateXStocksCache(): void {
  globalCache.delete(CACHE_CONFIG.KEYS.XSTOCKS_ALLOWLIST);
  globalCache.delete(CACHE_CONFIG.KEYS.XSTOCKS_PRICES);
  globalCache.delete(CACHE_CONFIG.KEYS.XSTOCKS_FULL_DATA);
  console.log('Cache xStocks invalidado');
}

/**
 * Invalida todo o cache de preços
 */
export function invalidatePriceCache(): void {
  globalCache.delete(CACHE_CONFIG.KEYS.COINGECKO_PRICES);
  globalCache.delete(CACHE_CONFIG.KEYS.HELIUS_PRICES);
  
  // Invalida preços individuais de tokens
  const stats = globalCache.getStats();
  stats.entries.forEach(entry => {
    if (entry.key.startsWith('prices:token:')) {
      globalCache.delete(entry.key);
    }
  });
  
  console.log('Cache de preços invalidado');
}

/**
 * Invalida cache de um endpoint específico
 * @param endpoint Nome do endpoint
 */
export function invalidateEndpointCache(endpoint: string): void {
  const stats = globalCache.getStats();
  stats.entries.forEach(entry => {
    if (entry.key.startsWith(`api:${endpoint}:`)) {
      globalCache.delete(entry.key);
    }
  });
  
  console.log(`Cache do endpoint ${endpoint} invalidado`);
}

/**
 * Executa limpeza automática do cache (remove entradas expiradas)
 */
export function cleanupCache(): void {
  globalCache.cleanup();
}

/**
 * Retorna estatísticas do cache para debug
 */
export function getCacheStats() {
  return globalCache.getStats();
}

/**
 * Verifica se os dados estão em cache e válidos
 * @param key Chave do cache
 */
export function isCached(key: string): boolean {
  return globalCache.has(key);
}

// Configurar limpeza automática do cache a cada 5 minutos
if (typeof window === 'undefined') { // Apenas no servidor
  setInterval(() => {
    cleanupCache();
  }, 5 * 60 * 1000); // 5 minutos
}

export { globalCache };
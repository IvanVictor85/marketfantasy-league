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
      console.log(`Cache MISS: ${key} (não encontrado)`);
      return null;
    }

    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      console.log(`Cache MISS: ${key} (expirado)`);
      return null;
    }

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

    if (removedCount > 0) {
      console.log(`Cache CLEANUP: ${removedCount} entradas expiradas removidas`);
    }
  }

  /**
   * Retorna informações sobre o estado do cache
   */
  getStats(): {
    size: number;
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

// Configurações de cache para xStocks
export const XSTOCKS_CACHE_CONFIG = {
  // TTL padrão: 15 minutos
  DEFAULT_TTL_MS: parseInt(process.env.XSTOCKS_CACHE_TTL_MS || '900000'), // 15 * 60 * 1000
  
  // Chaves de cache
  KEYS: {
    ALLOWLIST: 'xstocks:allowlist',
    PRICES: 'xstocks:prices',
    FULL_DATA: 'xstocks:full_data',
  },
} as const;

/**
 * Armazena a allowlist de tokens xStocks no cache
 * @param allowlist Lista de tokens
 */
export function cacheAllowlist(allowlist: any[]): void {
  globalCache.set(
    XSTOCKS_CACHE_CONFIG.KEYS.ALLOWLIST,
    allowlist,
    XSTOCKS_CACHE_CONFIG.DEFAULT_TTL_MS
  );
}

/**
 * Recupera a allowlist de tokens xStocks do cache
 * @returns Lista de tokens ou null se não encontrada/expirada
 */
export function getCachedAllowlist<T>(): T[] | null {
  return globalCache.get<T[]>(XSTOCKS_CACHE_CONFIG.KEYS.ALLOWLIST);
}

/**
 * Armazena dados de preços no cache
 * @param prices Dados de preços
 */
export function cachePrices(prices: any[]): void {
  globalCache.set(
    XSTOCKS_CACHE_CONFIG.KEYS.PRICES,
    prices,
    XSTOCKS_CACHE_CONFIG.DEFAULT_TTL_MS
  );
}

/**
 * Recupera dados de preços do cache
 * @returns Dados de preços ou null se não encontrados/expirados
 */
export function getCachedPrices<T>(): T[] | null {
  return globalCache.get<T[]>(XSTOCKS_CACHE_CONFIG.KEYS.PRICES);
}

/**
 * Armazena dados completos da API no cache
 * @param data Dados completos da API
 */
export function cacheFullData(data: any): void {
  globalCache.set(
    XSTOCKS_CACHE_CONFIG.KEYS.FULL_DATA,
    data,
    XSTOCKS_CACHE_CONFIG.DEFAULT_TTL_MS
  );
}

/**
 * Recupera dados completos da API do cache
 * @returns Dados completos ou null se não encontrados/expirados
 */
export function getCachedFullData<T>(): T | null {
  return globalCache.get<T>(XSTOCKS_CACHE_CONFIG.KEYS.FULL_DATA);
}

/**
 * Invalida todo o cache relacionado ao xStocks
 */
export function invalidateXStocksCache(): void {
  globalCache.delete(XSTOCKS_CACHE_CONFIG.KEYS.ALLOWLIST);
  globalCache.delete(XSTOCKS_CACHE_CONFIG.KEYS.PRICES);
  globalCache.delete(XSTOCKS_CACHE_CONFIG.KEYS.FULL_DATA);
  console.log('Cache xStocks invalidado');
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
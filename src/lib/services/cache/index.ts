/**
 * Cache System - Exports
 *
 * Sistema de cache em camadas para CoinGecko API com padrão SWR.
 *
 * USO:
 * import {
 *   getTop100TokensWithSWR,
 *   getMarketDataByIds,
 *   getMarketDataWithFallback,
 *   ensureCachePopulated,
 * } from '@/lib/services/cache';
 */

// Tipos
export type {
  CacheEntry,
  CacheOptions,
  CacheState,
  CacheResult,
  CacheLayer,
  TokenMarketData,
  RevalidateCallback,
} from './types';

export { CACHE_CONFIG } from './types';

// Serviço principal (use este para todas as chamadas CoinGecko)
export {
  getTop100TokensWithSWR,
  getMarketDataByIds,
  getMarketDataWithFallback,
  ensureCachePopulated,
  symbolsToIds,
  getCacheStats,
  SYMBOL_TO_ID_MAP,
  // Aliases para compatibilidade
  getTop100Tokens,
  getMarketDataByTokenIds,
  getMarketDataWithFallbackDedupe,
  getMarketDataByTokenIdsDedupe,
} from './coingecko-cached.service';
export type { CoinGeckoTokenData } from './coingecko-cached.service';

// Componentes do cache (para uso avançado)
export { getTop100Cache, getTokenCache, TieredCache } from './tiered-cache';
export { getFileCache, FileCache } from './file-cache';
export { getMutex, Mutex } from './mutex';

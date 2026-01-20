/**
 * Tipos para o Sistema de Cache em Camadas
 *
 * Este módulo define as interfaces usadas pelo TieredCache, FileCache e CoinGeckoService.
 */

/**
 * Entry individual no cache com metadados de expiração
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;    // Quando foi criado
  staleAt: number;      // Quando pode retornar stale (mas ainda válido)
  expiresAt: number;    // Quando deve ser deletado
}

/**
 * Configuração de TTL para o cache
 */
export interface CacheOptions {
  freshTTL: number;     // Tempo que dado é considerado "fresh" (não faz revalidate)
  staleTTL: number;     // Tempo máximo para retornar stale (depois disso, bloqueia até fetch)
}

/**
 * Estado de uma entrada no cache
 */
export type CacheState = 'FRESH' | 'STALE' | 'EXPIRED' | 'MISS';

/**
 * Resultado de uma busca no cache
 */
export interface CacheResult<T> {
  data: T | null;
  state: CacheState;
  age: number;          // Idade em ms
}

/**
 * Interface para implementações de cache (L1 ou L2)
 */
export interface CacheLayer<T> {
  get(key: string): Promise<CacheEntry<T> | null>;
  set(key: string, entry: CacheEntry<T>): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

/**
 * Dados de token da CoinGecko
 */
export interface TokenMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_1h_in_currency: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency: number | null;
  price_change_percentage_30d_in_currency: number | null;
  market_cap: number;
  total_volume: number;
  market_cap_rank: number | null;
}

/**
 * Configurações globais do sistema de cache
 */
export const CACHE_CONFIG = {
  // Top 100 tokens
  TOP100_FRESH_TTL: 2 * 60 * 1000,      // 2 minutos - dados considerados "fresh"
  TOP100_STALE_TTL: 30 * 60 * 1000,     // 30 minutos - máximo para stale

  // Tokens individuais
  TOKEN_FRESH_TTL: 5 * 60 * 1000,       // 5 minutos
  TOKEN_STALE_TTL: 60 * 60 * 1000,      // 1 hora

  // Mutex
  MUTEX_TIMEOUT: 30 * 1000,             // 30 segundos timeout

  // Ghost tokens
  GHOST_TOKEN_THRESHOLD: 3,             // Max tokens faltantes para usar ghost
  CACHE_HIT_RATE_THRESHOLD: 0.7,        // 70% em cache → usa ghost para o resto

  // File cache
  FILE_CACHE_PATH: '/tmp/mfl-coingecko-cache.json',
  FILE_CACHE_CLEANUP_INTERVAL: 5 * 60 * 1000,  // Cleanup a cada 5 minutos
};

/**
 * Tipo para callback de revalidação em background
 */
export type RevalidateCallback<T> = () => Promise<T>;

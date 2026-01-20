/**
 * TieredCache - Cache em Duas Camadas
 *
 * L1: Memória (Map) - Rápido, volátil
 * L2: FileCache - Lento, persistente
 *
 * Fluxo de leitura:
 * 1. Verifica L1 → retorna se encontrar
 * 2. Verifica L2 → promove para L1 se encontrar
 * 3. Retorna null (MISS)
 *
 * Fluxo de escrita:
 * 1. Escreve em L1 (síncrono)
 * 2. Escreve em L2 (async, não bloqueia)
 */

import { CacheEntry, CacheOptions, CacheResult, CacheState, CACHE_CONFIG } from './types';
import { getFileCache, FileCache } from './file-cache';

class TieredCache<T> {
  private l1: Map<string, CacheEntry<T>> = new Map();
  private l2: FileCache<T>;
  private defaultOptions: CacheOptions;

  constructor(options?: Partial<CacheOptions>) {
    this.l2 = getFileCache<T>();
    this.defaultOptions = {
      freshTTL: options?.freshTTL ?? CACHE_CONFIG.TOP100_FRESH_TTL,
      staleTTL: options?.staleTTL ?? CACHE_CONFIG.TOP100_STALE_TTL,
    };
  }

  /**
   * Determina o estado de uma entry
   */
  private getEntryState(entry: CacheEntry<T>): CacheState {
    const now = Date.now();

    if (now < entry.staleAt) {
      return 'FRESH';
    }

    if (now < entry.expiresAt) {
      return 'STALE';
    }

    return 'EXPIRED';
  }

  /**
   * Busca dados do cache (L1 → L2)
   */
  async get(key: string): Promise<CacheResult<T>> {
    const now = Date.now();

    // 1. Tentar L1 (memória)
    const l1Entry = this.l1.get(key);
    if (l1Entry) {
      const state = this.getEntryState(l1Entry);

      if (state !== 'EXPIRED') {
        console.log(`✅ [L1_HIT] ${key} (${state})`);
        return {
          data: l1Entry.data,
          state,
          age: now - l1Entry.timestamp,
        };
      }

      // Entry expirada, remover
      this.l1.delete(key);
    }

    // 2. Tentar L2 (arquivo)
    const l2Entry = await this.l2.get(key);
    if (l2Entry) {
      const state = this.getEntryState(l2Entry);

      if (state !== 'EXPIRED') {
        // Promover para L1
        this.l1.set(key, l2Entry);
        console.log(`✅ [L2_HIT] ${key} (${state}) - promovido para L1`);
        return {
          data: l2Entry.data,
          state,
          age: now - l2Entry.timestamp,
        };
      }

      // Entry expirada, remover do L2
      await this.l2.delete(key);
    }

    // 3. MISS
    console.log(`❌ [CACHE_MISS] ${key}`);
    return {
      data: null,
      state: 'MISS',
      age: 0,
    };
  }

  /**
   * Armazena dados no cache (L1 + L2)
   */
  async set(key: string, data: T, options?: Partial<CacheOptions>): Promise<void> {
    const now = Date.now();
    const freshTTL = options?.freshTTL ?? this.defaultOptions.freshTTL;
    const staleTTL = options?.staleTTL ?? this.defaultOptions.staleTTL;

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      staleAt: now + freshTTL,
      expiresAt: now + staleTTL,
    };

    // 1. Escrever em L1 (síncrono)
    this.l1.set(key, entry);

    // 2. Escrever em L2 (async, não bloqueia)
    this.l2.set(key, entry).catch(err => {
      console.error(`⚠️ [L2_WRITE_ERROR] ${key}:`, err);
    });

    const freshMin = Math.round(freshTTL / 60000);
    const staleMin = Math.round(staleTTL / 60000);
    console.log(`💾 [CACHE_SET] ${key} (fresh: ${freshMin}min, stale: ${staleMin}min)`);
  }

  /**
   * Verifica se dados estão FRESH (não precisa revalidar)
   */
  async isFresh(key: string): Promise<boolean> {
    const result = await this.get(key);
    return result.state === 'FRESH';
  }

  /**
   * Verifica se dados estão disponíveis (FRESH ou STALE)
   */
  async isAvailable(key: string): Promise<boolean> {
    const result = await this.get(key);
    return result.state === 'FRESH' || result.state === 'STALE';
  }

  /**
   * Remove entrada do cache
   */
  async delete(key: string): Promise<void> {
    this.l1.delete(key);
    await this.l2.delete(key);
    console.log(`🗑️ [CACHE_DELETE] ${key}`);
  }

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    this.l1.clear();
    await this.l2.clear();
    console.log(`🗑️ [CACHE_CLEAR] Todo o cache foi limpo`);
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): { l1Size: number; l1Keys: string[] } {
    return {
      l1Size: this.l1.size,
      l1Keys: Array.from(this.l1.keys()),
    };
  }

  /**
   * Força persistência imediata no L2 (FileCache)
   * Útil após batch saves para garantir que todos os dados são persistidos
   */
  async forceFlush(): Promise<void> {
    await this.l2.forceFlush();
  }
}

// Singletons para diferentes tipos de cache
let top100CacheInstance: TieredCache<unknown> | null = null;
let tokenCacheInstance: TieredCache<unknown> | null = null;

/**
 * Cache para Top 100 tokens
 */
export function getTop100Cache<T>(): TieredCache<T> {
  if (!top100CacheInstance) {
    top100CacheInstance = new TieredCache({
      freshTTL: CACHE_CONFIG.TOP100_FRESH_TTL,
      staleTTL: CACHE_CONFIG.TOP100_STALE_TTL,
    });
  }
  return top100CacheInstance as TieredCache<T>;
}

/**
 * Cache para tokens individuais
 */
export function getTokenCache<T>(): TieredCache<T> {
  if (!tokenCacheInstance) {
    tokenCacheInstance = new TieredCache({
      freshTTL: CACHE_CONFIG.TOKEN_FRESH_TTL,
      staleTTL: CACHE_CONFIG.TOKEN_STALE_TTL,
    });
  }
  return tokenCacheInstance as TieredCache<T>;
}

export { TieredCache };

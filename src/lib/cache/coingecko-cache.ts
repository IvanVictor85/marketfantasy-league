/**
 * Sistema de cache multi-camada para API CoinGecko
 *
 * Camadas:
 * 1. Memória (Node.js) - 5 minutos - mais rápido
 * 2. Banco de Dados (SQLite) - 15 minutos - persistente
 * 3. Atualização em background - evita rate limiting
 */

import { MarketToken } from '@/lib/market-analysis';
import { prisma } from '@/lib/prisma';

// ============================================
// CAMADA 1: CACHE EM MEMÓRIA
// ============================================

interface MemoryCacheEntry {
  data: MarketToken[];
  timestamp: number;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, MemoryCacheEntry> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos

  set(key: string, data: MarketToken[]): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.TTL
    });
  }

  get(key: string): MarketToken[] | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();

    // Verificar se expirou
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton do cache em memória
const memoryCache = new MemoryCache();

// ============================================
// CAMADA 2: CACHE NO BANCO DE DADOS
// ============================================

const DB_CACHE_TTL = 15 * 60 * 1000; // 15 minutos
const CACHE_KEY = 'coingecko_top100';

async function getCachedTokensFromDB(): Promise<MarketToken[] | null> {
  try {
    // Buscar última entrada de cache no banco (usando PriceHistory como tabela temporária)
    const cacheEntry = await prisma.priceHistory.findFirst({
      where: {
        tokenSymbol: CACHE_KEY,
        timestamp: {
          gte: new Date(Date.now() - DB_CACHE_TTL)
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    if (!cacheEntry) {
      return null;
    }

    // Os dados estão armazenados no campo 'source' como JSON
    const tokens = JSON.parse(cacheEntry.source) as MarketToken[];

    console.log(`✅ Cache DB: ${tokens.length} tokens recuperados (idade: ${Math.floor((Date.now() - cacheEntry.timestamp.getTime()) / 1000)}s)`);

    return tokens;
  } catch (error) {
    console.error('❌ Erro ao buscar cache do banco:', error);
    return null;
  }
}

async function saveCachedTokensToDB(tokens: MarketToken[]): Promise<void> {
  try {
    // Salvar no banco usando PriceHistory como cache
    await prisma.priceHistory.create({
      data: {
        tokenSymbol: CACHE_KEY,
        price: tokens.length, // Armazenar quantidade como price
        timestamp: new Date(),
        source: JSON.stringify(tokens) // Dados completos em JSON
      }
    });

    console.log(`💾 Cache DB: ${tokens.length} tokens salvos com sucesso`);

    // Limpar entradas antigas (manter apenas últimas 3)
    const oldEntries = await prisma.priceHistory.findMany({
      where: {
        tokenSymbol: CACHE_KEY
      },
      orderBy: {
        timestamp: 'desc'
      },
      skip: 3
    });

    if (oldEntries.length > 0) {
      await prisma.priceHistory.deleteMany({
        where: {
          id: {
            in: oldEntries.map(e => e.id)
          }
        }
      });
      console.log(`🧹 Cache DB: ${oldEntries.length} entradas antigas removidas`);
    }
  } catch (error) {
    console.error('❌ Erro ao salvar cache no banco:', error);
  }
}

// ============================================
// CAMADA 3: BUSCA NA API COM RETRY
// ============================================

async function fetchFromCoinGecko(): Promise<MarketToken[]> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🌐 Tentativa ${attempt}/${maxRetries}: Buscando API CoinGecko...`);

      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h,7d',
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'CryptoFantasyLeague/1.0',
          },
          // Sem cache aqui - controlaremos manualmente
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Mapear para formato esperado
      const tokens: MarketToken[] = data.map((token: any): MarketToken => ({
        id: token.id,
        symbol: token.symbol.toUpperCase(),
        name: token.name,
        logoUrl: token.image,
        currentPrice: token.current_price,
        priceChange24h: token.price_change_percentage_24h || 0,
        priceChange7d: token.price_change_percentage_7d_in_currency || 0,
        marketCap: token.market_cap,
        volume24h: token.total_volume,
        rank: token.market_cap_rank ?? 0,
      }));

      console.log(`✅ API CoinGecko: ${tokens.length} tokens obtidos com sucesso`);

      return tokens;

    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Tentativa ${attempt} falhou:`, lastError.message);

      // Se não for a última tentativa, aguardar antes de tentar novamente
      if (attempt < maxRetries) {
        const delay = attempt * 2000; // 2s, 4s
        console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Falha ao buscar dados da API após múltiplas tentativas');
}

// ============================================
// FUNÇÃO PRINCIPAL: GET COM CACHE INTELIGENTE
// ============================================

export async function getCachedMarketTokens(): Promise<{
  tokens: MarketToken[];
  source: 'memory' | 'database' | 'api';
  age: number;
}> {
  const startTime = Date.now();

  // 1. Tentar cache em memória (mais rápido)
  const memoryTokens = memoryCache.get(CACHE_KEY);
  if (memoryTokens) {
    console.log(`⚡ Cache em memória: ${memoryTokens.length} tokens (${Date.now() - startTime}ms)`);
    return {
      tokens: memoryTokens,
      source: 'memory',
      age: 0
    };
  }

  // 2. Tentar cache no banco de dados
  const dbTokens = await getCachedTokensFromDB();
  if (dbTokens) {
    // Salvar em memória para próximas requisições
    memoryCache.set(CACHE_KEY, dbTokens);

    console.log(`💾 Cache em banco: ${dbTokens.length} tokens (${Date.now() - startTime}ms)`);
    return {
      tokens: dbTokens,
      source: 'database',
      age: 0
    };
  }

  // 3. Buscar da API (último recurso)
  console.log(`🌐 Nenhum cache válido encontrado, buscando API...`);
  const apiTokens = await fetchFromCoinGecko();

  // Salvar em ambos os caches
  memoryCache.set(CACHE_KEY, apiTokens);
  await saveCachedTokensToDB(apiTokens);

  console.log(`🎯 API completa: ${apiTokens.length} tokens (${Date.now() - startTime}ms)`);

  return {
    tokens: apiTokens,
    source: 'api',
    age: 0
  };
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Força atualização do cache (útil para cron jobs)
 */
export async function refreshCache(): Promise<void> {
  console.log('🔄 Iniciando atualização forçada do cache...');

  try {
    const tokens = await fetchFromCoinGecko();

    memoryCache.set(CACHE_KEY, tokens);
    await saveCachedTokensToDB(tokens);

    console.log(`✅ Cache atualizado com sucesso: ${tokens.length} tokens`);
  } catch (error) {
    console.error('❌ Erro ao atualizar cache:', error);
    throw error;
  }
}

/**
 * Limpa todo o cache (desenvolvimento)
 */
export async function clearAllCache(): Promise<void> {
  memoryCache.clear();

  await prisma.priceHistory.deleteMany({
    where: {
      tokenSymbol: CACHE_KEY
    }
  });

  console.log('🧹 Todo o cache foi limpo');
}

/**
 * Estatísticas do cache
 */
export async function getCacheStats() {
  const memStats = memoryCache.getStats();

  const dbCount = await prisma.priceHistory.count({
    where: {
      tokenSymbol: CACHE_KEY
    }
  });

  const latestDb = await prisma.priceHistory.findFirst({
    where: {
      tokenSymbol: CACHE_KEY
    },
    orderBy: {
      timestamp: 'desc'
    }
  });

  return {
    memory: {
      entries: memStats.size,
      keys: memStats.keys
    },
    database: {
      entries: dbCount,
      latestUpdate: latestDb?.timestamp,
      ageSeconds: latestDb ? Math.floor((Date.now() - latestDb.timestamp.getTime()) / 1000) : null
    }
  };
}

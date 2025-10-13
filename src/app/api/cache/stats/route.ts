import { NextResponse } from 'next/server';
import { getCacheStats, CACHE_CONFIG } from '@/lib/xstocks/cache';

/**
 * GET /api/cache/stats
 * Endpoint para obter estatísticas detalhadas do cache
 */
export async function GET() {
  try {
    const stats = getCacheStats();
    
    // Calcular métricas adicionais
    const totalEntries = stats.totalEntries;
    const hitRate = stats.hits > 0 ? (stats.hits / (stats.hits + stats.misses)) * 100 : 0;
    const memoryUsageEstimate = totalEntries * 1024; // Estimativa simples
    
    // Obter informações sobre TTLs
    const ttlInfo = Object.entries(CACHE_CONFIG.TTL).map(([key, value]) => ({
      type: key,
      ttlSeconds: value / 1000,
      ttlMinutes: value / (1000 * 60)
    }));

    // Obter informações sobre rate limits
    const rateLimitInfo = Object.entries(CACHE_CONFIG.RATE_LIMIT).map(([key, value]) => ({
      service: key,
      requestsPerMinute: value as number,
    }));

    return NextResponse.json({
      cache: {
        stats: {
          ...stats,
          hitRate: Math.round(hitRate * 100) / 100,
          memoryUsageEstimateKB: Math.round(memoryUsageEstimate / 1024),
        },
        configuration: {
          ttls: ttlInfo,
          rateLimits: rateLimitInfo,
          keys: CACHE_CONFIG.KEYS
        },
        health: {
          status: totalEntries > 0 ? 'healthy' : 'empty',
          lastCleanup: stats.lastCleanup,
          uptime: process.uptime(),
          nodeEnv: process.env.NODE_ENV
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas do cache:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        cache: {
          stats: { error: 'Não foi possível obter estatísticas' },
          health: { status: 'error' }
        }
      },
      { status: 500 }
    );
  }
}
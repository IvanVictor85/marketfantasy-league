import { NextResponse } from 'next/server';
import { getCachedMarketTokens, getCacheStats } from '@/lib/cache/coingecko-cache';

export const dynamic = 'force-dynamic';

/**
 * GET /api/market
 *
 * Retorna dados dos TOP 100 tokens com sistema de cache inteligente:
 * - Cache em memória (5 min)
 * - Cache em banco de dados (15 min)
 * - API CoinGecko (fallback)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get('stats') === 'true';

    // Se requisitar apenas estatísticas
    if (statsOnly) {
      const stats = await getCacheStats();
      return NextResponse.json({
        stats,
        timestamp: new Date().toISOString()
      });
    }

    console.log('🔍 API /api/market: Buscando tokens com cache...');

    // Buscar tokens usando sistema de cache
    const result = await getCachedMarketTokens();

    console.log(`✅ API /api/market: ${result.tokens.length} tokens retornados (fonte: ${result.source})`);

    return NextResponse.json({
      tokens: result.tokens,
      lastUpdated: new Date().toISOString(),
      cacheSource: result.source,
      count: result.tokens.length
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });

  } catch (error) {
    console.error('❌ API /api/market: Erro:', error);

    return NextResponse.json(
      {
        error: 'Erro ao buscar dados do mercado',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
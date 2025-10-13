import { NextRequest, NextResponse } from 'next/server';
import { 
  invalidatePriceCache,
  invalidateEndpointCache,
  invalidateXStocksCache,
  cleanupCache,
  getCacheStats,
  CACHE_CONFIG 
} from '@/lib/xstocks/cache';
import { warmPopularTokensCache, warmMainLeagueCache } from '@/lib/cache/warming';

/**
 * POST /api/cache/invalidate
 * Endpoint para invalidar cache manualmente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, key, warmAfterInvalidation = false } = body;

    // Verificar se há uma chave de API para autenticação (opcional)
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.CACHE_ADMIN_API_KEY;
    
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let result: any = {};

    switch (type) {
      case 'prices':
        // Invalidar cache de preços
        invalidatePriceCache();
        result.message = 'Cache de preços invalidado';
        
        if (warmAfterInvalidation) {
          await warmPopularTokensCache();
          result.message += ' e reaquecido';
        }
        break;

      case 'endpoint':
        // Invalidar cache de endpoint específico
        if (!key) {
          return NextResponse.json(
            { error: 'Key é obrigatória para invalidação de endpoint' },
            { status: 400 }
          );
        }
        invalidateEndpointCache(key);
        result.message = `Cache do endpoint '${key}' invalidado`;
        break;

      case 'xstocks':
        // Invalidar cache xStocks
        invalidateXStocksCache();
        result.message = 'Cache xStocks invalidado';
        break;

      case 'all':
        // Invalidar todo o cache
        invalidatePriceCache();
        invalidateXStocksCache();
        cleanupCache();
        result.message = 'Todo o cache invalidado';
        
        if (warmAfterInvalidation) {
          await Promise.all([
            warmPopularTokensCache(),
            warmMainLeagueCache()
          ]);
          result.message += ' e reaquecido';
        }
        break;

      case 'cleanup':
        // Limpeza de entradas expiradas
        const cleanedCount = cleanupCache();
        result.message = `Limpeza concluída: ${cleanedCount} entradas removidas`;
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de invalidação inválido. Use: prices, endpoint, xstocks, all, cleanup' },
          { status: 400 }
        );
    }

    // Adicionar estatísticas do cache na resposta
    result.stats = getCacheStats();
    result.timestamp = new Date().toISOString();

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erro na invalidação do cache:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cache/invalidate
 * Endpoint para obter informações sobre invalidação de cache
 */
export async function GET() {
  try {
    const stats = getCacheStats();
    
    return NextResponse.json({
      message: 'Endpoints de invalidação de cache disponíveis',
      endpoints: {
        'POST /api/cache/invalidate': {
          description: 'Invalidar cache',
          parameters: {
            type: 'prices | endpoint | xstocks | all | cleanup',
            key: 'string (obrigatório para type=endpoint)',
            warmAfterInvalidation: 'boolean (opcional, padrão: false)'
          }
        },
        'GET /api/cache/stats': 'Obter estatísticas do cache',
        'POST /api/cache/warm': 'Aquecer cache manualmente'
      },
      currentStats: stats,
      config: {
        ttls: CACHE_CONFIG.TTL,
        rateLimits: CACHE_CONFIG.RATE_LIMIT
      }
    });

  } catch (error) {
    console.error('Erro ao obter informações de cache:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
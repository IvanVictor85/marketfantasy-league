import { NextRequest, NextResponse } from 'next/server';
import { 
  warmPopularTokensCache, 
  warmMainLeagueCache, 
  warmIndividualToken,
  shouldWarmCache 
} from '@/lib/cache/warming';
import { getCacheStats } from '@/lib/xstocks/cache';

/**
 * POST /api/cache/warm
 * Endpoint para aquecer o cache manualmente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, tokenId, force = false } = body;

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
    const startTime = Date.now();

    // Verificar se o cache precisa ser aquecido (a menos que seja forçado)
    if (!force && !shouldWarmCache()) {
      return NextResponse.json({
        message: 'Cache já está aquecido e atualizado',
        skipped: true,
        stats: getCacheStats(),
        timestamp: new Date().toISOString()
      });
    }

    switch (type) {
      case 'popular':
        // Aquecer cache de tokens populares
        await warmPopularTokensCache();
        result.message = 'Cache de tokens populares aquecido';
        break;

      case 'main-league':
        // Aquecer cache da liga principal
        await warmMainLeagueCache();
        result.message = 'Cache da liga principal aquecido';
        break;

      case 'token':
        // Aquecer cache de token específico
        if (!tokenId) {
          return NextResponse.json(
            { error: 'tokenId é obrigatório para aquecimento de token específico' },
            { status: 400 }
          );
        }
        await warmIndividualToken(tokenId);
        result.message = `Cache do token '${tokenId}' aquecido`;
        break;

      case 'all':
        // Aquecer todo o cache
        await Promise.all([
          warmPopularTokensCache(),
          warmMainLeagueCache()
        ]);
        result.message = 'Todo o cache aquecido';
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de aquecimento inválido. Use: popular, main-league, token, all' },
          { status: 400 }
        );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Adicionar estatísticas do cache na resposta
    result.stats = getCacheStats();
    result.duration = `${duration}ms`;
    result.timestamp = new Date().toISOString();
    result.forced = force;

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erro no aquecimento do cache:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cache/warm
 * Endpoint para obter informações sobre aquecimento de cache
 */
export async function GET() {
  try {
    const stats = getCacheStats();
    const needsWarming = shouldWarmCache();
    
    return NextResponse.json({
      message: 'Endpoints de aquecimento de cache disponíveis',
      endpoints: {
        'POST /api/cache/warm': {
          description: 'Aquecer cache',
          parameters: {
            type: 'popular | main-league | token | all',
            tokenId: 'string (obrigatório para type=token)',
            force: 'boolean (opcional, padrão: false)'
          }
        }
      },
      status: {
        needsWarming,
        currentStats: stats,
        recommendations: needsWarming 
          ? ['Execute aquecimento de cache para melhor performance']
          : ['Cache está atualizado']
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao obter informações de aquecimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
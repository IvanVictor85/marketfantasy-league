import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMarketDataByTokenIds } from '@/lib/services/coingecko.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/market
 *
 * Retorna os tokens disponíveis para draft baseado no "Static Draft Universe":
 *
 * 1. Busca a competição atual (ativa ou pendente)
 * 2. Lê o cardápio CONGELADO de tokens da tabela CompetitionTokens
 * 3. Busca preços FRESCOS da CoinGecko usando getMarketDataByTokenIds
 * 4. Retorna os 100 tokens com preços atualizados
 *
 * O cardápio é TRAVADO na criação da competição (domingo 21h),
 * garantindo que o draft seja justo durante toda a semana.
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    console.log('🔍 API /api/market: Buscando cardápio da competição atual...');

    // Buscar competição atual (pending ou active)
    // Pending = draft aberto (sex 21h → dom 21h)
    // Active = rodada em andamento (dom 21h → próximo dom 21h)
    const competition = await prisma.competition.findFirst({
      where: {
        OR: [
          { status: 'pending' },
          { status: 'active' }
        ]
      },
      orderBy: {
        startTime: 'desc' // Mais recente primeiro
      },
      include: {
        tokens: true // Incluir CompetitionTokens
      }
    });

    if (!competition) {
      console.warn('⚠️ Nenhuma competição ativa ou pendente encontrada');
      return NextResponse.json({
        tokens: [],
        count: 0,
        error: 'Nenhuma competição ativa no momento',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ Competição encontrada: ${competition.id} (status: ${competition.status})`);

    // Verificar se há tokens cadastrados
    if (!competition.tokens || competition.tokens.length === 0) {
      console.warn('⚠️ Competição sem tokens cadastrados');
      return NextResponse.json({
        tokens: [],
        count: 0,
        error: 'Cardápio de tokens ainda não foi definido para esta competição',
        competitionId: competition.id,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔒 Cardápio TRAVADO: ${competition.tokens.length} tokens`);

    // Extrair IDs dos tokens
    const tokenIds = competition.tokens.map(t => t.tokenId);

    // Buscar preços FRESCOS da CoinGecko
    console.log('🌐 Buscando preços frescos da CoinGecko...');
    const marketData = await getMarketDataByTokenIds(tokenIds);

    // Criar mapa de preços por ID
    const priceMap = new Map(marketData.map(token => [token.id, token]));

    // Combinar dados: cardápio travado + preços frescos
    const tokens = competition.tokens.map(competitionToken => {
      const liveData = priceMap.get(competitionToken.tokenId);

      return {
        id: competitionToken.tokenId,
        symbol: competitionToken.symbol,
        name: competitionToken.name,
        image: competitionToken.imageUrl,
        currentPrice: liveData?.current_price || 0,
        priceChange24h: liveData?.price_change_percentage_24h || 0,
        priceChange7d: liveData?.price_change_percentage_7d_in_currency || 0,
        marketCap: liveData?.market_cap || 0,
        totalVolume: liveData?.total_volume || 0,
        marketCapRank: competitionToken.marketCapRank || liveData?.market_cap_rank || null
      };
    });

    const duration = Date.now() - startTime;

    console.log(`✅ API /api/market: ${tokens.length} tokens retornados em ${duration}ms`);
    console.log(`   📅 Competição: ${competition.id}`);
    console.log(`   🔒 Status: ${competition.status}`);
    console.log(`   📊 Tokens: ${tokens.length}`);

    return NextResponse.json({
      tokens,
      competition: {
        id: competition.id,
        status: competition.status,
        startTime: competition.startTime,
        endTime: competition.endTime
      },
      count: tokens.length,
      duration,
      timestamp: new Date().toISOString()
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
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
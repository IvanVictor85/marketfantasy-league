import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getTop100TokensWithSWR,
  getMarketDataByIds,
  SYMBOL_TO_ID_MAP,
} from '@/lib/services/cache';
import { rateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/market
 *
 * Retorna os tokens disponíveis para seleção:
 *
 * 1. SEMPRE busca Top 100 tokens do CoinGecko por market cap
 * 2. Adiciona tokens que estão em times existentes mas caíram fora do Top 100
 * 3. Retorna lista completa ordenada por market cap rank
 *
 * A TRAVA de edição acontece no frontend/backend baseado no status da competição (ACTIVE)
 * Os tokens disponíveis NUNCA são travados - sempre mostra Top 100 + tokens em uso
 */
export async function GET(request: Request) {
  // 🔒 RATE LIMITING: Prevenir spam na API pública de tokens
  const rateLimitResult = await rateLimit(request as NextRequest, RATE_LIMITS.PUBLIC_API);
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult.reset);
  }

  const startTime = Date.now();

  try {
    console.log('🔍 API /api/market: Buscando Top 100 tokens + tokens em uso...');

    // 1️⃣ SEMPRE buscar Top 100 do CoinGecko (com SWR - retorna rápido se stale)
    const top100Tokens = await getTop100TokensWithSWR();

    if (!top100Tokens || top100Tokens.length === 0) {
      console.error('❌ CoinGecko retornou array vazio');
      return NextResponse.json({
        error: 'Serviço de dados de mercado temporariamente indisponível',
        details: 'Não foi possível buscar dados da CoinGecko API. Tente novamente em alguns minutos.',
        tokens: [],
        count: 0
      }, { status: 503 });
    }

    console.log(`✅ Top 100 tokens obtidos: ${top100Tokens.length}`);

    // 2️⃣ Buscar todos os tokens únicos em uso nos times existentes
    const userTeams = await prisma.userTeam.findMany({
      select: {
        players: true
      }
    });

    // Extrair símbolos únicos de todos os times
    const tokensInUse = new Set<string>();
    userTeams.forEach(team => {
      if (Array.isArray(team.players)) {
        team.players.forEach((symbol: string) => {
          tokensInUse.add(symbol.toUpperCase());
        });
      }
    });

    console.log(`📊 Tokens em uso nos times: ${tokensInUse.size}`);

    // 3️⃣ Identificar tokens em uso que NÃO estão no Top 100
    const top100Ids = new Set(top100Tokens.map(t => t.id));
    const top100Symbols = new Set(top100Tokens.map(t => t.symbol.toUpperCase()));

    // Usar mapa de símbolos do serviço de cache
    const tokenMapping = SYMBOL_TO_ID_MAP;

    // Tokens em uso que NÃO estão no Top 100
    const extraTokenSymbols = Array.from(tokensInUse).filter(symbol =>
      !top100Symbols.has(symbol)
    );

    console.log(`➕ Tokens extras (fora do Top 100): ${extraTokenSymbols.length}`, extraTokenSymbols);

    // 4️⃣ Buscar dados dos tokens extras do CoinGecko
    let extraTokens: any[] = [];
    if (extraTokenSymbols.length > 0) {
      const extraTokenIds = extraTokenSymbols
        .map(symbol => tokenMapping[symbol])
        .filter(Boolean);

      if (extraTokenIds.length > 0) {
        console.log(`🌐 Buscando dados de ${extraTokenIds.length} tokens extras (com cache SWR)...`);
        const extraData = await getMarketDataByIds(extraTokenIds);
        extraTokens = extraData || [];
        console.log(`✅ ${extraTokens.length} tokens extras obtidos`);
      }
    }

    // 5️⃣ Combinar Top 100 + Tokens Extras
    const allTokens = [...top100Tokens, ...extraTokens];

    // MODO 1: Se há competição ativa, incluir info dela
    const competition = await prisma.competition.findFirst({
      where: {
        OR: [
          { status: 'PENDING' },
          { status: 'ACTIVE' }
        ]
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    // 6️⃣ Formatar resposta
    const tokens = allTokens.map(token => ({
      id: token.id,
      symbol: token.symbol,
      name: token.name,
      image: token.image,
      logoUrl: token.image,
      currentPrice: token.current_price,
      priceChange1h: token.price_change_percentage_1h_in_currency || 0,
      priceChange24h: token.price_change_percentage_24h || 0,
      priceChange7d: token.price_change_percentage_7d_in_currency || 0,
      priceChange30d: token.price_change_percentage_30d_in_currency || 0,
      marketCap: token.market_cap,
      totalVolume: token.total_volume,
      marketCapRank: token.market_cap_rank
    }));

    const duration = Date.now() - startTime;

    console.log(`✅ API /api/market: ${tokens.length} tokens retornados em ${duration}ms`);
    console.log(`   Top 100: ${top100Tokens.length}`);
    console.log(`   Extras: ${extraTokens.length}`);
    console.log(`   Total: ${tokens.length}`);

    if (competition) {
      console.log(`   📅 Competição: ${competition.id}`);
      console.log(`   🔒 Status: ${competition.status}`);
    }

    return NextResponse.json({
      tokens,
      competition: competition ? {
        id: competition.id,
        status: competition.status,
        startDate: competition.startDate,
        endDate: competition.endDate,
        isEditingAllowed: competition.status !== 'ACTIVE' // ✅ Trava de edição
      } : null,
      count: tokens.length,
      top100Count: top100Tokens.length,
      extraCount: extraTokens.length,
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
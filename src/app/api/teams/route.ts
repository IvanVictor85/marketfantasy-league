import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Mapeamento de símbolos para IDs do CoinGecko
 */
const TOKEN_MAPPING: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'XRP': 'ripple',
  'DOGE': 'dogecoin',
  'ADA': 'cardano',
  'AVAX': 'avalanche-2',
  'SHIB': 'shiba-inu',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'AAVE': 'aave',
  'MATIC': 'matic-network',
  'POL': 'matic-network',
  'ATOM': 'cosmos',
  'FTM': 'fantom',
  'NEAR': 'near',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'ICP': 'internet-computer',
  'APT': 'aptos',
  'OP': 'optimism',
  'ARB': 'arbitrum',
  'LDO': 'lido-dao',
  'GRT': 'the-graph',
  'MKR': 'maker',
  'SNX': 'havven',
  'RUNE': 'thorchain',
  'INJ': 'injective-protocol',
  'ZEC': 'zcash',
  'HYPE': 'hyperliquid',
  'DASH': 'dash',
  'ASTER': 'aster-2'
};

/**
 * Calcula pontuação parcial em tempo real para competições ACTIVE
 */
async function calculateLiveScores(competitionId: string, userTeams: any[]) {
  console.log(`🔄 [LIVE-SCORE] Calculando pontuação parcial para ${userTeams.length} times...`);

  // 1. Buscar CompetitionTokens com priceStart
  const competitionTokens = await prisma.competitionToken.findMany({
    where: { competitionId },
    select: {
      symbol: true,
      tokenId: true,
      priceStart: true
    }
  });

  if (competitionTokens.length === 0) {
    console.log('⚠️ [LIVE-SCORE] Sem tokens com priceStart. Retornando 0 para todos.');
    return userTeams.map(team => ({ ...team, liveScore: 0 }));
  }

  // 2. Criar mapa de priceStart por símbolo
  const priceStartMap = new Map<string, number>();
  competitionTokens.forEach(ct => {
    priceStartMap.set(ct.symbol.toUpperCase(), parseFloat(ct.priceStart?.toString() || '0'));
  });

  console.log(`📊 [LIVE-SCORE] Preços iniciais: ${competitionTokens.length} tokens`);

  // 3. Buscar preços atuais do CoinGecko
  const allTokenSymbols = new Set<string>();
  userTeams.forEach(team => {
    const tokens = team.players as string[];
    tokens.forEach(symbol => allTokenSymbols.add(symbol.toUpperCase()));
  });

  const tokenIds = Array.from(allTokenSymbols)
    .map(symbol => TOKEN_MAPPING[symbol])
    .filter(Boolean);

  if (tokenIds.length === 0) {
    console.log('⚠️ [LIVE-SCORE] Nenhum token para buscar no CoinGecko');
    return userTeams.map(team => ({ ...team, liveScore: 0 }));
  }

  console.log(`🌐 [LIVE-SCORE] Buscando preços atuais de ${tokenIds.length} tokens no CoinGecko...`);

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    console.error('❌ [LIVE-SCORE] Erro ao buscar preços do CoinGecko:', response.statusText);
    return userTeams.map(team => ({ ...team, liveScore: 0 }));
  }

  const currentPrices = await response.json();
  console.log(`✅ [LIVE-SCORE] Preços atuais obtidos com sucesso`);

  // 4. Criar mapa de preços atuais por símbolo
  const currentPriceMap = new Map<string, number>();
  Object.entries(TOKEN_MAPPING).forEach(([symbol, coingeckoId]) => {
    if (currentPrices[coingeckoId]?.usd) {
      currentPriceMap.set(symbol, currentPrices[coingeckoId].usd);
    }
  });

  // 5. Calcular pontuação para cada time
  const teamsWithLiveScores = userTeams.map(team => {
    const tokens = team.players as string[];
    let totalScore = 0;

    tokens.forEach(symbol => {
      const symbolUpper = symbol.toUpperCase();
      const priceStart = priceStartMap.get(symbolUpper);
      const currentPrice = currentPriceMap.get(symbolUpper);

      if (priceStart && currentPrice && priceStart > 0) {
        const percentChange = ((currentPrice - priceStart) / priceStart) * 100;
        totalScore += percentChange;
      }
    });

    return {
      ...team,
      liveScore: totalScore
    };
  });

  console.log(`✅ [LIVE-SCORE] Pontuação parcial calculada para ${teamsWithLiveScores.length} times`);

  return teamsWithLiveScores;
}

/**
 * GET /api/teams
 *
 * Lista times de uma competição específica (Ranking)
 * ✅ REFATORADO: Usa UserTeam filtrado por competitionId OU leagueId
 * ✅ FIX: Aceita leagueId para mostrar times mesmo sem rodada ativa
 * ✅ NOVO: Calcula pontuação parcial em tempo real para competições ACTIVE
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId');
    const leagueId = searchParams.get('leagueId');

    if (!competitionId && !leagueId) {
      return NextResponse.json(
        { error: 'competitionId ou leagueId é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`📊 [TEAMS-GET] Buscando times:`, { competitionId, leagueId });

    let competition = null;
    let league = null;

    if (competitionId) {
      // Buscar competição específica
      competition = await prisma.competition.findUnique({
        where: { id: competitionId },
        include: {
          league: {
            select: {
              id: true,
              name: true,
              entryFee: true
            }
          }
        }
      });

      if (!competition) {
        return NextResponse.json(
          { error: 'Competição não encontrada' },
          { status: 404 }
        );
      }

      league = competition.league;
    } else if (leagueId) {
      // Buscar liga e competição ativa (se houver)
      league = await prisma.league.findUnique({
        where: { id: leagueId },
        select: {
          id: true,
          name: true,
          entryFee: true
        }
      });

      if (!league) {
        return NextResponse.json(
          { error: 'Liga não encontrada' },
          { status: 404 }
        );
      }

      // Tentar buscar competição ativa da liga
      competition = await prisma.competition.findFirst({
        where: {
          leagueId: leagueId,
          status: 'ACTIVE'
        }
      });
    }

    // ✅ NOVO: Buscar UserTeams da competição
    // Se não houver competição, retornar array vazio
    const userTeams = competition
      ? await prisma.userTeam.findMany({
          where: { competitionId: competition.id },
          include: {
            user: {
              select: {
                name: true,
                email: true,
                publicKey: true
              }
            }
          }
        })
      : []; // Sem competição ativa = sem times para mostrar

    console.log(`✅ [TEAMS-GET] Encontrados ${userTeams.length} times`);

    // ✅ NOVO: Calcular pontuação baseada no status da competição
    let teamsWithScores;

    if (competition && competition.status === 'ACTIVE') {
      // 🔥 COMPETIÇÃO ATIVA: Calcular pontuação parcial em tempo real
      console.log('🔴 [TEAMS-GET] Competição ACTIVE - calculando pontuação parcial em tempo real');
      teamsWithScores = await calculateLiveScores(competition.id, userTeams);
    } else {
      // ✅ COMPETIÇÃO COMPLETA/PENDING: Usar totalPoints do banco
      console.log('✅ [TEAMS-GET] Competição não está ACTIVE - usando totalPoints do banco');
      teamsWithScores = userTeams.map(team => ({
        ...team,
        liveScore: Number(team.totalPoints) || 0
      }));
    }

    // Ordenar por pontuação (decrescente)
    teamsWithScores.sort((a, b) => b.liveScore - a.liveScore);

    // ✅ IMPORTANTE: Calcular rank em runtime (não existe no banco)
    const isActiveCompetition = competition && competition.status === 'ACTIVE';

    const teamsWithRankAndParsedTokens = teamsWithScores.map((userTeam, index) => {
      // ✅ players já é JSON, não precisa de parse
      const tokens = userTeam.players as string[];

      return {
        id: userTeam.id,
        teamName: userTeam.teamName,
        tokens: tokens,
        totalScore: userTeam.liveScore, // ✅ Usar pontuação calculada (parcial ou final)
        liveScore: isActiveCompetition ? userTeam.liveScore : undefined, // ✅ Indicar que é live score
        rank: index + 1, // ✅ Rank calculado em runtime
        updatedAt: userTeam.updatedAt,
        user: {
          name: userTeam.user.name,
          email: userTeam.user.email,
          publicKey: userTeam.user.publicKey
        }
      };
    });

    return NextResponse.json({
      success: true,
      competition: competition ? {
        id: competition.id,
        status: competition.status,
        startDate: competition.startDate,
        endDate: competition.endDate,
        isLiveScoring: competition.status === 'ACTIVE' // ✅ Indicador de pontuação em tempo real
      } : null,
      league: league ? {
        id: league.id,
        name: league.name,
        entryFee: league.entryFee
      } : null,
      teams: teamsWithRankAndParsedTokens
    });

  } catch (error) {
    console.error('❌ Erro ao buscar times:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

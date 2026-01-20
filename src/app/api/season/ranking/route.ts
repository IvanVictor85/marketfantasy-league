import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMarketDataByIds, SYMBOL_TO_ID_MAP } from '@/lib/services/cache';

// Usar mapa de símbolos do serviço de cache
const TOKEN_MAPPING = SYMBOL_TO_ID_MAP;

/**
 * Calcula pontuação parcial em tempo real para uma competição ACTIVE
 */
async function calculateLiveScoresForCompetition(competitionId: string, userTeams: any[]) {
  console.log(`🔄 [SEASON-LIVE-SCORE] Calculando pontuação parcial para ${userTeams.length} times...`);

  if (userTeams.length === 0) {
    return new Map<string, number>();
  }

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
    console.log('⚠️ [SEASON-LIVE-SCORE] Sem tokens com priceStart. Retornando 0 para todos.');
    return new Map<string, number>();
  }

  // 2. Criar mapa de priceStart por símbolo
  const priceStartMap = new Map<string, number>();
  competitionTokens.forEach(ct => {
    priceStartMap.set(ct.symbol.toUpperCase(), parseFloat(ct.priceStart?.toString() || '0'));
  });

  console.log(`📊 [SEASON-LIVE-SCORE] Preços iniciais: ${competitionTokens.length} tokens`);

  // 3. Buscar preços atuais do CoinGecko
  const allTokenSymbols = new Set<string>();
  userTeams.forEach(team => {
    const tokens = team.players as string[];
    tokens.forEach((symbol: string) => allTokenSymbols.add(symbol.toUpperCase()));
  });

  const tokenIds = Array.from(allTokenSymbols)
    .map(symbol => TOKEN_MAPPING[symbol])
    .filter(Boolean);

  if (tokenIds.length === 0) {
    console.log('⚠️ [SEASON-LIVE-SCORE] Nenhum token para buscar no CoinGecko');
    return new Map<string, number>();
  }

  console.log(`🌐 [SEASON-LIVE-SCORE] Buscando preços atuais de ${tokenIds.length} tokens no CoinGecko (com dedupe)...`);

  // ✅ Usar serviço CoinGecko com dedupe, retry e fallback
  const marketData = await getMarketDataByIds(tokenIds);

  if (!marketData || marketData.length === 0) {
    console.error('❌ [SEASON-LIVE-SCORE] Nenhum dado retornado do CoinGecko (mesmo com fallback)');
    return new Map<string, number>();
  }

  console.log(`✅ [SEASON-LIVE-SCORE] Preços atuais obtidos com sucesso (${marketData.length} tokens)`);

  // 4. Criar mapa de preços atuais por símbolo
  const currentPriceMap = new Map<string, number>();
  marketData.forEach(token => {
    // Encontrar o símbolo correspondente ao ID do CoinGecko
    const symbol = Object.keys(TOKEN_MAPPING).find(key => TOKEN_MAPPING[key] === token.id);
    if (symbol && token.current_price) {
      currentPriceMap.set(symbol, token.current_price);
    }
  });

  // 5. Calcular pontuação para cada time
  const liveScoresMap = new Map<string, number>();

  userTeams.forEach(team => {
    const tokens = team.players as string[];
    let totalScore = 0;

    tokens.forEach((symbol: string) => {
      const symbolUpper = symbol.toUpperCase();
      const priceStart = priceStartMap.get(symbolUpper);
      const currentPrice = currentPriceMap.get(symbolUpper);

      if (priceStart && currentPrice && priceStart > 0) {
        const percentChange = ((currentPrice - priceStart) / priceStart) * 100;
        totalScore += percentChange;
      }
    });

    liveScoresMap.set(team.userId, totalScore);
  });

  console.log(`✅ [SEASON-LIVE-SCORE] Pontuação parcial calculada para ${liveScoresMap.size} times`);

  return liveScoresMap;
}

/**
 * GET /api/season/ranking
 *
 * Retorna o ranking da temporada com:
 * - Pontos acumulados de rodadas completed
 * - Pontos parciais da rodada active
 * - Prêmios estimados baseados no prize pool total
 * - Breakdown por rodada para cada usuário
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');
    const userId = searchParams.get('userId'); // Opcional: para buscar dados específicos do usuário

    if (!seasonId) {
      return NextResponse.json(
        { error: 'seasonId é obrigatório' },
        { status: 400 }
      );
    }

    // 1. Buscar informações da temporada
    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        competitions: {
          orderBy: {
            startDate: 'asc'
          }
        }
      }
    });

    if (!season) {
      return NextResponse.json(
        { error: 'Season não encontrada' },
        { status: 404 }
      );
    }

    // 2. Calcular dados da temporada
    const completedCompetitions = season.competitions.filter(c => c.status === 'COMPLETED');
    const activeCompetition = season.competitions.find(c => c.status === 'ACTIVE');
    const totalRounds = season.competitions.length;
    const completedRounds = completedCompetitions.length;
    const totalPrizePool = Number(season.prizePool);

    // 3. Buscar SeasonRanking (pontos acumulados das rodadas completed)
    const seasonRankings = await prisma.seasonRanking.findMany({
      where: { seasonId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            publicKey: true,
            name: true
          }
        }
      },
      orderBy: {
        totalSeasonPoints: 'desc'
      }
    });

    // 4. Buscar pontos parciais da rodada ACTIVE (se existir)
    let activeRoundScores = new Map<string, number>();

    if (activeCompetition) {
      console.log(`🔴 [SEASON-RANKING] Rodada ACTIVE detectada: ${activeCompetition.name}`);
      console.log(`   Calculando pontuação em tempo real...`);

      const activeTeams = await prisma.userTeam.findMany({
        where: { competitionId: activeCompetition.id },
        select: {
          userId: true,
          players: true,
          totalPoints: true
        }
      });

      // ✅ CALCULAR LIVE SCORES ao invés de usar totalPoints
      activeRoundScores = await calculateLiveScoresForCompetition(
        activeCompetition.id,
        activeTeams
      );

      console.log(`✅ [SEASON-RANKING] Live scores calculados para ${activeRoundScores.size} usuários`);
    }

    // 5. Buscar participação de cada usuário (quantas rodadas jogou)
    console.log(`📊 [SEASON-RANKING] Calculando participação dos usuários...`);

    const userParticipation = await prisma.userTeam.groupBy({
      by: ['userId'],
      where: {
        competition: {
          seasonId
        }
      },
      _count: {
        userId: true
      }
    });

    // Criar mapa de participação (userId -> roundsPlayed)
    const participationMap = new Map<string, number>();
    userParticipation.forEach(up => {
      participationMap.set(up.userId, up._count.userId);
    });

    console.log(`✅ [SEASON-RANKING] Participação calculada para ${participationMap.size} usuários`);

    // 6. Criar ranking combinado (completed + parcial active) COM MULTIPLICADOR
    const rankings = seasonRankings.map((ranking, index) => {
      const completedPoints = Number(ranking.totalSeasonPoints);
      const activePoints = activeRoundScores.get(ranking.userId) || 0;
      const rawTotalPoints = completedPoints + activePoints;

      // 🎯 MULTIPLICADOR DE PARTICIPAÇÃO
      const roundsPlayed = participationMap.get(ranking.userId) || 0;
      const participationMultiplier = totalRounds > 0 ? roundsPlayed / totalRounds : 0;
      const totalPoints = rawTotalPoints * participationMultiplier;

      console.log(`👤 ${ranking.user.username}: ${roundsPlayed}/${totalRounds} rodadas (${participationMultiplier.toFixed(2)}x) = ${rawTotalPoints.toFixed(2)} → ${totalPoints.toFixed(2)} pts`);

      // Calcular prêmio estimado (50%, 30%, 20% para top 3)
      let estimatedPrize = 0;
      if (index === 0) estimatedPrize = totalPrizePool * 0.5;
      else if (index === 1) estimatedPrize = totalPrizePool * 0.3;
      else if (index === 2) estimatedPrize = totalPrizePool * 0.2;

      return {
        rank: index + 1,
        userId: ranking.userId,
        username: ranking.user.username || ranking.user.email || 'Anônimo',
        publicKey: ranking.user.publicKey,
        name: ranking.user.name,
        completedPoints,
        activePoints,
        rawTotalPoints, // Pontos brutos (sem multiplicador)
        roundsPlayed,
        participationMultiplier,
        totalPoints, // Pontos finais (com multiplicador aplicado)
        estimatedPrize: estimatedPrize > 0 ? estimatedPrize : null
      };
    });

    // 7. Re-ordenar por totalPoints (COM multiplicador aplicado)
    rankings.sort((a, b) => b.totalPoints - a.totalPoints);

    // 8. Re-calcular ranks e prêmios após ordenação
    rankings.forEach((r, i) => {
      r.rank = i + 1;

      // Re-calcular prêmios após nova ordenação (baseado no totalPoints COM multiplicador)
      if (i === 0) r.estimatedPrize = totalPrizePool * 0.5;
      else if (i === 1) r.estimatedPrize = totalPrizePool * 0.3;
      else if (i === 2) r.estimatedPrize = totalPrizePool * 0.2;
      else r.estimatedPrize = null;
    });

    console.log(`🏆 [SEASON-RANKING] Top 3 após multiplicador:`);
    rankings.slice(0, 3).forEach(r => {
      console.log(`   ${r.rank}º ${r.username}: ${r.totalPoints.toFixed(2)} pts (${r.roundsPlayed}/${totalRounds} rodadas, ${r.participationMultiplier.toFixed(2)}x)`);
    });

    // 9. Se userId foi fornecido, buscar breakdown detalhado por rodada
    let userBreakdown = null;

    if (userId) {
      const userTeams = await prisma.userTeam.findMany({
        where: {
          userId,
          competition: {
            seasonId
          }
        },
        include: {
          competition: {
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true,
              endDate: true
            }
          }
        },
        orderBy: {
          competition: {
            startDate: 'asc'
          }
        }
      });

      // Buscar PrizeClaims do usuário na temporada
      const prizeClaims = await prisma.prizeClaim.findMany({
        where: {
          userId,
          seasonId  // ✅ FIXED: seasonId é campo direto, não nested
        }
        // ✅ FIXED: Removido include - PrizeClaim não tem relação com Competition no schema
      });

      // Criar mapa de prêmios por competição
      const prizesByCompetition = new Map(
        prizeClaims.map(claim => [claim.competitionId, {
          amount: Number(claim.amount),
          position: claim.position,
          claimed: claim.claimed
        }])
      );

      // ✅ USAR LIVE SCORE para rodadas ACTIVE, totalPoints para as demais
      userBreakdown = userTeams.map(team => {
        let points = Number(team.totalPoints);

        // Se for a rodada ACTIVE, usar live score calculado
        if (team.competition.status === 'ACTIVE' && activeRoundScores.has(userId)) {
          points = activeRoundScores.get(userId) || 0;
        }

        return {
          competitionId: team.competitionId,
          competitionName: team.competition.name || 'Sem nome',
          competitionStatus: team.competition.status,
          startDate: team.competition.startDate,
          endDate: team.competition.endDate,
          points: points,
          prize: prizesByCompetition.get(team.competitionId) || null
        };
      });

      // Calcular prêmios acumulados
      const accumulatedPrizes = prizeClaims.reduce((sum, claim) => sum + Number(claim.amount), 0);

      // Encontrar posição do usuário no ranking
      const userRanking = rankings.find(r => r.userId === userId);

      userBreakdown = {
        rounds: userBreakdown,
        totalCompletedPoints: userRanking?.completedPoints || 0,
        totalActivePoints: userRanking?.activePoints || 0,
        rawTotalPoints: userRanking?.rawTotalPoints || 0, // Pontos brutos (sem multiplicador)
        roundsPlayed: userRanking?.roundsPlayed || 0,
        totalRounds: totalRounds,
        participationMultiplier: userRanking?.participationMultiplier || 0,
        totalPoints: userRanking?.totalPoints || 0, // Pontos finais (com multiplicador)
        currentRank: userRanking?.rank || null,
        estimatedPrize: userRanking?.estimatedPrize || null,
        accumulatedPrizes
      };
    }

    return NextResponse.json({
      success: true,
      season: {
        id: season.id,
        name: season.name,
        status: season.status,
        startDate: season.startDate,
        endDate: season.endDate,
        prizePool: totalPrizePool,
        totalRounds,
        completedRounds,
        activeRound: activeCompetition ? {
          id: activeCompetition.id,
          name: activeCompetition.name,
          startDate: activeCompetition.startDate,
          endDate: activeCompetition.endDate
        } : null
      },
      rankings,
      userBreakdown
    });

  } catch (error) {
    console.error('❌ Erro ao buscar ranking da temporada:', error);
    return NextResponse.json(
      {
        error: 'Erro ao buscar ranking da temporada',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMarketDataByIds, SYMBOL_TO_ID_MAP } from '@/lib/services/cache';

export const dynamic = 'force-dynamic';

// Usar mapa de símbolos do serviço de cache
const TOKEN_MAPPING = SYMBOL_TO_ID_MAP;

/**
 * Calcula pontuação parcial em tempo real para competições ACTIVE
 * @returns Array de times com liveScore calculado, ou null se houver erro
 */
async function calculateLiveScores(competitionId: string, userTeams: any[]): Promise<any[] | null> {
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
    console.log('⚠️ [LIVE-SCORE] Sem tokens com priceStart. Usando fallback do banco.');
    return null;
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
    console.log('⚠️ [LIVE-SCORE] Nenhum token para buscar no CoinGecko. Usando fallback do banco.');
    return null;
  }

  console.log(`🌐 [LIVE-SCORE] Buscando preços atuais de ${tokenIds.length} tokens no CoinGecko (com dedupe)...`);

  // ✅ Usar serviço com dedupe ao invés de fetch direto
  let marketData;
  try {
    marketData = await getMarketDataByIds(tokenIds);
  } catch (error) {
    console.error('❌ [LIVE-SCORE] Erro ao buscar preços do CoinGecko:', error);
    console.log('⚠️ [LIVE-SCORE] Usando totalPoints do banco como fallback');
    return null;
  }

  if (!marketData || marketData.length === 0) {
    console.error('❌ [LIVE-SCORE] Nenhum dado retornado do CoinGecko');
    console.log('⚠️ [LIVE-SCORE] Usando totalPoints do banco como fallback');
    return null;
  }

  console.log(`✅ [LIVE-SCORE] Preços atuais obtidos com sucesso (${marketData.length} tokens)`);

  // 4. Criar mapa de preços atuais por símbolo
  const currentPriceMap = new Map<string, number>();
  marketData.forEach(token => {
    // Encontrar o símbolo correspondente ao ID do CoinGecko
    const symbol = Object.keys(TOKEN_MAPPING).find(key => TOKEN_MAPPING[key] === token.id);
    if (symbol && token.current_price) {
      currentPriceMap.set(symbol, token.current_price);
    }
  });

  // 5. Calcular pontuação para cada time E performance individual de cada token
  const teamsWithLiveScores = userTeams.map(team => {
    const tokens = team.players as string[];
    let totalScore = 0;
    const tokenPerformances: Array<{ symbol: string; percentChange: number; image: string }> = [];

    tokens.forEach(symbol => {
      const symbolUpper = symbol.toUpperCase();
      const priceStart = priceStartMap.get(symbolUpper);
      const currentPrice = currentPriceMap.get(symbolUpper);

      let percentChange = 0;
      if (priceStart && currentPrice && priceStart > 0) {
        percentChange = ((currentPrice - priceStart) / priceStart) * 100;
        totalScore += percentChange;
      }

      // Buscar imagem do token
      const snapshot = competitionTokens.find(ct => ct.symbol.toUpperCase() === symbolUpper);
      const imageUrl = snapshot?.imageUrl || snapshot?.token?.image || '';

      tokenPerformances.push({
        symbol: symbolUpper,
        percentChange,
        image: imageUrl
      });
    });

    return {
      ...team,
      liveScore: totalScore,
      tokenPerformances
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
    const userId = searchParams.get('userId'); // ✅ Permitir filtrar por userId
    const userTeams = competition
      ? await prisma.userTeam.findMany({
          where: {
            competitionId: competition.id,
            ...(userId && { userId }) // ✅ Filtrar por userId se fornecido
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                publicKey: true,
                avatar: true // ✅ Incluir avatar
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
      const liveScores = await calculateLiveScores(competition.id, userTeams);

      // ✅ FALLBACK: Se calculateLiveScores falhar (null), usar totalPoints do banco
      if (liveScores === null) {
        console.log('⚠️ [TEAMS-GET] Live score falhou - usando totalPoints do banco como fallback');
        teamsWithScores = userTeams.map(team => ({
          ...team,
          liveScore: Number(team.totalPoints) || 0
        }));
      } else {
        teamsWithScores = liveScores;
      }
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
        userId: userTeam.userId, // ✅ Adicionar userId
        teamName: userTeam.teamName,
        tokens: tokens,
        players: tokens, // Alias para compatibilidade
        formation: userTeam.formation || '433', // ✅ Adicionar formação (padrão 4-3-3)
        totalPoints: userTeam.liveScore, // ✅ Adicionar totalPoints
        totalScore: userTeam.liveScore, // ✅ Usar pontuação calculada (parcial ou final)
        liveScore: isActiveCompetition ? userTeam.liveScore : undefined, // ✅ Indicar que é live score
        tokenPerformances: (userTeam as any).tokenPerformances || undefined, // ✅ Performances individuais
        rank: index + 1, // ✅ Rank calculado em runtime
        updatedAt: userTeam.updatedAt,
        user: {
          id: userTeam.user.id,
          name: userTeam.user.name,
          email: userTeam.user.email,
          publicKey: userTeam.user.publicKey,
          avatar: userTeam.user.avatar // ✅ Incluir avatar
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

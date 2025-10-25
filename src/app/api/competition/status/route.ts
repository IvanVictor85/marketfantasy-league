import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCachedMarketTokens } from '@/lib/cache/coingecko-cache';

export const dynamic = 'force-dynamic';

// ============================================
// GET /api/competition/status
// ============================================

/**
 * Retorna status completo de uma competição:
 * - Informações da competição
 * - Rankings atuais dos times
 * - Tempo restante
 * - Top 3 times
 * - Vencedores (se já finalizada)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId') || searchParams.get('id');

    if (!competitionId) {
      return NextResponse.json(
        { error: 'Competition ID é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`📊 API /api/competition/status: Buscando status para ${competitionId}`);

    // Buscar competição com dados relacionados
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        league: {
          include: {
            teams: {
              orderBy: {
                rank: 'asc'
              },
              select: {
                id: true,
                teamName: true,
                userWallet: true,
                rank: true,
                totalScore: true,
                tokens: true,
                hasValidEntry: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!competition) {
      console.log('❌ Competição não encontrada');
      return NextResponse.json(
        { error: 'Competição não encontrada' },
        { status: 404 }
      );
    }

    // Calcular tempo restante
    const now = new Date();
    let timeRemaining = 0;
    let phase: 'pending' | 'active' | 'completed' = 'pending';

    if (competition.status === 'pending') {
      timeRemaining = Math.max(0, competition.startTime.getTime() - now.getTime());
      phase = 'pending';
    } else if (competition.status === 'active') {
      timeRemaining = Math.max(0, competition.endTime.getTime() - now.getTime());
      phase = 'active';
    } else {
      timeRemaining = 0;
      phase = 'completed';
    }

    // Parse winners se existir
    let winners = null;
    if (competition.winners) {
      try {
        winners = JSON.parse(competition.winners);
      } catch (error) {
        console.error('❌ Erro ao parsear winners:', error);
      }
    }

    // Top 3 times
    const topTeams = competition.league.teams
      .filter(t => t.rank && t.rank <= 3)
      .map(t => ({
        rank: t.rank,
        teamId: t.id,
        teamName: t.teamName,
        userWallet: t.userWallet,
        totalScore: Number((t.totalScore || 0).toFixed(2)),
        tokens: (() => {
          try {
            return JSON.parse(t.tokens);
          } catch {
            return [];
          }
        })()
      }));

    // Rankings completos com tokens parsed e pontuação calculada
    const teamsWithScores = await Promise.all(
      competition.league.teams.map(async (t) => {
        const parsedTokens = await parseTeamTokens(t.tokens);
        const calculatedScore = calculateTeamScore(parsedTokens);

        return {
          teamId: t.id,
          teamName: t.teamName,
          userWallet: t.userWallet,
          totalScore: Number(calculatedScore.toFixed(2)),
          previousPosition: t.rank,
          tokens: parsedTokens,
        };
      })
    );

    // Ordenar por pontuação
    teamsWithScores.sort((a, b) => b.totalScore - a.totalScore);

    // Adicionar posição atual
    const currentRankings = teamsWithScores.map((t, index) => ({
      ...t,
      position: index + 1,
    }));

    // Estatísticas
    const stats = {
      totalTeams: competition.league.teams.length,
      teamsWithValidEntry: competition.league.teams.filter(t => t.hasValidEntry).length,
      prizePool: competition.prizePool,
      distributed: competition.distributed
    };

    // Parse winners para formato esperado pelos componentes
    const parsedWinners = parseWinners(competition, currentRankings);

    console.log(`✅ Status retornado: ${competition.status}, ${stats.totalTeams} times`);

    return NextResponse.json({
      competition: {
        id: competition.id,
        leagueId: competition.leagueId,
        status: competition.status,
        phase,
        startTime: competition.startTime,
        endTime: competition.endTime,
        prizePool: competition.prizePool,
        distributed: competition.distributed,
        createdAt: competition.createdAt,
        updatedAt: competition.updatedAt
      },
      timeRemaining: {
        milliseconds: timeRemaining,
        seconds: Math.floor(timeRemaining / 1000),
        minutes: Math.floor(timeRemaining / 1000 / 60),
        hours: Math.floor(timeRemaining / 1000 / 60 / 60),
        days: Math.floor(timeRemaining / 1000 / 60 / 60 / 24)
      },
      topTeams,
      rankings: currentRankings, // Para componente LiveRankings
      currentRankings, // Compatibilidade com código existente
      winners: parsedWinners, // Para componente Winners
      totalParticipants: stats.totalTeams, // Para página principal
      stats,
      league: {
        id: competition.league.id,
        name: competition.league.name,
        leagueType: competition.league.leagueType
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar status da competição:', error);

    return NextResponse.json(
      {
        error: 'Erro interno ao buscar status',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Parse tokens do time com dados reais da CoinGecko + preços mock para demo
 */
async function parseTeamTokens(tokensJson: string) {
  try {
    const tokens = JSON.parse(tokensJson);

    // Buscar dados reais dos tokens da CoinGecko
    let marketData: any[] = [];
    try {
      const { tokens: cgTokens } = await getCachedMarketTokens();
      marketData = cgTokens;
    } catch (err) {
      console.warn('Não foi possível buscar dados do CoinGecko, usando fallback:', err);
    }

    // Se for array de objetos
    if (Array.isArray(tokens)) {
      return tokens.map((token: any) => {
        // Buscar dados reais do token
        const tokenSymbol = (token.symbol || token.tokenSymbol || 'UNKNOWN').toUpperCase();
        const marketToken = marketData.find(
          t => t.symbol?.toUpperCase() === tokenSymbol
        );

        return {
          symbol: tokenSymbol,
          name: marketToken?.name || token.name || tokenSymbol,
          logoUrl: marketToken?.image || token.logoUrl || undefined,
          position: token.position || 'WILDCARD',
          startPrice: token.startPrice || generateMockPrice(),
          currentPrice: token.currentPrice || generateMockPriceWithVariation(token.startPrice),
        };
      });
    }

    // Se for objeto com posições como chaves
    const tokenArray = [];
    for (const [position, tokenData] of Object.entries(tokens)) {
      const data = tokenData as any;
      const tokenSymbol = (data.symbol || data.tokenSymbol || 'UNKNOWN').toUpperCase();
      const marketToken = marketData.find(
        t => t.symbol?.toUpperCase() === tokenSymbol
      );

      tokenArray.push({
        symbol: tokenSymbol,
        name: marketToken?.name || data.name || tokenSymbol,
        logoUrl: marketToken?.image || data.logoUrl || undefined,
        position: position.toUpperCase(),
        startPrice: data.startPrice || generateMockPrice(),
        currentPrice: data.currentPrice || generateMockPriceWithVariation(data.startPrice),
      });
    }

    return tokenArray;
  } catch (err) {
    console.error('Error parsing tokens:', err);
    return [];
  }
}

/**
 * Parse winners com distribuição de prêmios
 */
function parseWinners(competition: any, rankings: any[]) {
  const winners = [];

  // Se competição já tem vencedores definidos
  if (competition.status === 'completed' && competition.winners) {
    try {
      const winnerWallets = JSON.parse(competition.winners);
      const prizeDistribution = JSON.parse(competition.league.prizeDistribution);

      return winnerWallets.map((wallet: string, index: number) => {
        const team = rankings.find(r => r.userWallet === wallet);
        const position = index + 1;

        let prizePercentage = 0;
        if (position === 1) prizePercentage = prizeDistribution.first || 50;
        else if (position === 2) prizePercentage = prizeDistribution.second || 30;
        else if (position === 3) prizePercentage = prizeDistribution.third || 20;

        const prize = (competition.prizePool * prizePercentage) / 100;

        return {
          position,
          teamName: team?.teamName || 'Unknown',
          userWallet: wallet,
          totalScore: team?.totalScore || 0,
          prize,
        };
      });
    } catch (err) {
      console.error('Error parsing winners:', err);
    }
  }

  // Se competição está ativa, mostrar top 3 atual como "vencedores provisórios"
  if (competition.status === 'active' && rankings.length >= 3) {
    const prizeDistribution = JSON.parse(competition.league.prizeDistribution);

    return rankings.slice(0, 3).map((team, index) => {
      const position = index + 1;
      let prizePercentage = 0;

      if (position === 1) prizePercentage = prizeDistribution.first || 50;
      else if (position === 2) prizePercentage = prizeDistribution.second || 30;
      else if (position === 3) prizePercentage = prizeDistribution.third || 20;

      const prize = (competition.prizePool * prizePercentage) / 100;

      return {
        position,
        teamName: team.teamName,
        userWallet: team.userWallet,
        totalScore: team.totalScore,
        prize,
      };
    });
  }

  return [];
}

/**
 * Gera preço mock para demonstração
 * TODO: Substituir por busca real de preços via CoinGecko API
 */
function generateMockPrice() {
  return Math.random() * 100 + 1; // Preço entre 1 e 101
}

/**
 * Gera variação de preço realista para demonstração
 * Distribuição:
 * - 60% dos tokens: variação entre -5% e +15%
 * - 30% dos tokens: variação entre +15% e +30%
 * - 10% dos tokens: variação extrema entre -15% e +50%
 */
function generateMockPriceWithVariation(startPrice?: number) {
  if (!startPrice) return generateMockPrice();

  const random = Math.random();
  let variation;

  if (random < 0.6) {
    // 60%: variação moderada (-5% a +15%)
    variation = (Math.random() * 0.2 - 0.05); // -0.05 a +0.15
  } else if (random < 0.9) {
    // 30%: variação positiva boa (+15% a +30%)
    variation = (Math.random() * 0.15 + 0.15); // +0.15 a +0.30
  } else {
    // 10%: variação extrema (-15% a +50%)
    const extremeRandom = Math.random();
    if (extremeRandom < 0.3) {
      // Negativo extremo
      variation = -(Math.random() * 0.15); // -15% a 0%
    } else {
      // Positivo extremo
      variation = (Math.random() * 0.35 + 0.15); // +15% a +50%
    }
  }

  return startPrice * (1 + variation);
}

/**
 * Calcula pontuação do time baseado na performance dos tokens
 * Fórmula: Para cada token, ((currentPrice - startPrice) / startPrice) * 100
 * Pontuação final = soma das variações / quantidade de tokens (média)
 */
function calculateTeamScore(tokens: any[]): number {
  if (!tokens || tokens.length === 0) return 0;

  let totalPerformance = 0;

  tokens.forEach((token) => {
    if (!token.startPrice || !token.currentPrice) return;

    // Variação percentual
    const variation = ((token.currentPrice - token.startPrice) / token.startPrice) * 100;
    totalPerformance += variation;
  });

  // Retornar média das variações
  return totalPerformance / tokens.length;
}

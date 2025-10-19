/**
 * Competition Manager
 *
 * Gerencia todo o ciclo de vida de competições:
 * - Snapshots de preços (início e fim)
 * - Cálculo de pontuações
 * - Rankings
 * - Determinação de vencedores e prêmios
 */

import { prisma } from '@/lib/prisma';
import { getCachedMarketTokens } from '@/lib/cache/coingecko-cache';

// ============================================
// TYPES
// ============================================

export interface PrizeDistribution {
  first: number;   // Percentage (e.g., 50)
  second: number;  // Percentage (e.g., 30)
  third: number;   // Percentage (e.g., 20)
}

export interface Winner {
  position: number;
  teamId: string;
  teamName: string;
  userWallet: string;
  totalScore: number;
  prize: number;
}

export interface TokenSnapshot {
  symbol: string;
  price: number;
  timestamp: Date;
}

export interface TeamScore {
  teamId: string;
  teamName: string;
  userWallet: string;
  tokens: string[];
  totalScore: number;
  breakdown: {
    symbol: string;
    startPrice: number;
    endPrice: number;
    change: number;
    percentChange: number;
  }[];
}

// ============================================
// SNAPSHOT MANAGEMENT
// ============================================

/**
 * Cria snapshot de preços no início da competição
 */
export async function createStartSnapshot(competitionId: string): Promise<TokenSnapshot[]> {
  console.log(`📸 Criando snapshot inicial para competição ${competitionId}...`);

  try {
    // Buscar a competição
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        league: {
          include: {
            teams: true
          }
        }
      }
    });

    if (!competition) {
      throw new Error(`Competição ${competitionId} não encontrada`);
    }

    // Coletar todos os tokens únicos dos times
    const allTokens = new Set<string>();
    competition.league.teams.forEach(team => {
      try {
        const tokens = JSON.parse(team.tokens) as string[];
        tokens.forEach(token => allTokens.add(token));
      } catch (error) {
        console.error(`❌ Erro ao parsear tokens do time ${team.id}:`, error);
      }
    });

    console.log(`🔍 Encontrados ${allTokens.size} tokens únicos nos times`);

    // Buscar preços atuais do cache
    const { tokens: marketTokens } = await getCachedMarketTokens();
    const snapshots: TokenSnapshot[] = [];
    const now = new Date();

    // Criar entradas de snapshot para cada token
    for (const symbol of allTokens) {
      const tokenData = marketTokens.find(
        t => t.symbol.toUpperCase() === symbol.toUpperCase()
      );

      if (tokenData) {
        // Salvar no banco
        await prisma.priceHistory.create({
          data: {
            tokenSymbol: symbol,
            price: tokenData.currentPrice,
            timestamp: now,
            source: `competition_start_${competitionId}`
          }
        });

        snapshots.push({
          symbol,
          price: tokenData.currentPrice,
          timestamp: now
        });

        console.log(`  ✅ ${symbol}: $${tokenData.currentPrice}`);
      } else {
        console.warn(`  ⚠️ Token ${symbol} não encontrado no mercado`);
      }
    }

    console.log(`✅ Snapshot inicial criado: ${snapshots.length} tokens salvos`);
    return snapshots;

  } catch (error) {
    console.error(`❌ Erro ao criar snapshot inicial:`, error);
    throw error;
  }
}

/**
 * Cria snapshot de preços no fim da competição
 */
export async function createEndSnapshot(competitionId: string): Promise<TokenSnapshot[]> {
  console.log(`📸 Criando snapshot final para competição ${competitionId}...`);

  try {
    // Buscar a competição
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        league: {
          include: {
            teams: true
          }
        }
      }
    });

    if (!competition) {
      throw new Error(`Competição ${competitionId} não encontrada`);
    }

    // Coletar todos os tokens únicos
    const allTokens = new Set<string>();
    competition.league.teams.forEach(team => {
      try {
        const tokens = JSON.parse(team.tokens) as string[];
        tokens.forEach(token => allTokens.add(token));
      } catch (error) {
        console.error(`❌ Erro ao parsear tokens do time ${team.id}:`, error);
      }
    });

    console.log(`🔍 Encontrados ${allTokens.size} tokens únicos nos times`);

    // Buscar preços atuais do cache
    const { tokens: marketTokens } = await getCachedMarketTokens();
    const snapshots: TokenSnapshot[] = [];
    const now = new Date();

    // Criar entradas de snapshot para cada token
    for (const symbol of allTokens) {
      const tokenData = marketTokens.find(
        t => t.symbol.toUpperCase() === symbol.toUpperCase()
      );

      if (tokenData) {
        // Salvar no banco
        await prisma.priceHistory.create({
          data: {
            tokenSymbol: symbol,
            price: tokenData.currentPrice,
            timestamp: now,
            source: `competition_end_${competitionId}`
          }
        });

        snapshots.push({
          symbol,
          price: tokenData.currentPrice,
          timestamp: now
        });

        console.log(`  ✅ ${symbol}: $${tokenData.currentPrice}`);
      } else {
        console.warn(`  ⚠️ Token ${symbol} não encontrado no mercado`);
      }
    }

    console.log(`✅ Snapshot final criado: ${snapshots.length} tokens salvos`);
    return snapshots;

  } catch (error) {
    console.error(`❌ Erro ao criar snapshot final:`, error);
    throw error;
  }
}

// ============================================
// SCORING & RANKINGS
// ============================================

/**
 * Calcula pontuação de todos os times na competição
 */
export async function calculateAllScores(competitionId: string): Promise<TeamScore[]> {
  console.log(`🧮 Calculando pontuações para competição ${competitionId}...`);

  try {
    // Buscar a competição com times
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        league: {
          include: {
            teams: true
          }
        }
      }
    });

    if (!competition) {
      throw new Error(`Competição ${competitionId} não encontrada`);
    }

    // Buscar snapshots de preços
    const startSnapshots = await prisma.priceHistory.findMany({
      where: {
        source: `competition_start_${competitionId}`
      }
    });

    const endSnapshots = await prisma.priceHistory.findMany({
      where: {
        source: `competition_end_${competitionId}`
      }
    });

    if (startSnapshots.length === 0 || endSnapshots.length === 0) {
      throw new Error('Snapshots de preços não encontrados');
    }

    console.log(`📊 Snapshots: ${startSnapshots.length} início, ${endSnapshots.length} fim`);

    // Criar maps para acesso rápido
    const startPrices = new Map(
      startSnapshots.map(s => [s.tokenSymbol, s.price])
    );
    const endPrices = new Map(
      endSnapshots.map(s => [s.tokenSymbol, s.price])
    );

    const teamScores: TeamScore[] = [];

    // Calcular pontuação para cada time
    for (const team of competition.league.teams) {
      try {
        const tokens = JSON.parse(team.tokens) as string[];
        let totalScore = 0;
        const breakdown = [];

        // Calcular variação de cada token
        for (const symbol of tokens) {
          const startPrice = startPrices.get(symbol);
          const endPrice = endPrices.get(symbol);

          if (startPrice && endPrice && startPrice > 0) {
            // Variação percentual: ((final - inicial) / inicial) * 100
            const percentChange = ((endPrice - startPrice) / startPrice) * 100;
            totalScore += percentChange;

            breakdown.push({
              symbol,
              startPrice,
              endPrice,
              change: endPrice - startPrice,
              percentChange
            });
          } else {
            console.warn(`⚠️ Preços não encontrados para ${symbol} no time ${team.teamName}`);
          }
        }

        // Atualizar pontuação no banco
        await prisma.team.update({
          where: { id: team.id },
          data: { totalScore }
        });

        teamScores.push({
          teamId: team.id,
          teamName: team.teamName,
          userWallet: team.userWallet,
          tokens,
          totalScore,
          breakdown
        });

        console.log(`  📊 ${team.teamName}: ${totalScore.toFixed(2)}%`);

      } catch (error) {
        console.error(`❌ Erro ao calcular score do time ${team.id}:`, error);
      }
    }

    console.log(`✅ Pontuações calculadas para ${teamScores.length} times`);
    return teamScores;

  } catch (error) {
    console.error(`❌ Erro ao calcular pontuações:`, error);
    throw error;
  }
}

/**
 * Atualiza rankings dos times baseado em totalScore
 */
export async function updateRankings(competitionId: string): Promise<void> {
  console.log(`🏆 Atualizando rankings para competição ${competitionId}...`);

  try {
    // Buscar competição com times
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        league: {
          include: {
            teams: {
              orderBy: {
                totalScore: 'desc'
              }
            }
          }
        }
      }
    });

    if (!competition) {
      throw new Error(`Competição ${competitionId} não encontrada`);
    }

    // Atualizar rank de cada time
    for (let i = 0; i < competition.league.teams.length; i++) {
      const team = competition.league.teams[i];
      const rank = i + 1;

      await prisma.team.update({
        where: { id: team.id },
        data: { rank }
      });

      console.log(`  🥇 #${rank}: ${team.teamName} (${team.totalScore?.toFixed(2)}%)`);
    }

    console.log(`✅ Rankings atualizados para ${competition.league.teams.length} times`);

  } catch (error) {
    console.error(`❌ Erro ao atualizar rankings:`, error);
    throw error;
  }
}

// ============================================
// WINNERS & PRIZES
// ============================================

/**
 * Calcula valor do prêmio baseado em posição e distribuição
 */
export function calculatePrize(
  totalPrize: number,
  position: number,
  prizeDistribution: PrizeDistribution
): number {
  const percentages = [
    prizeDistribution.first,
    prizeDistribution.second,
    prizeDistribution.third
  ];

  if (position < 1 || position > 3) {
    return 0;
  }

  const percentage = percentages[position - 1];
  return (totalPrize * percentage) / 100;
}

/**
 * Determina vencedores e calcula prêmios
 */
export async function determineWinners(competitionId: string): Promise<Winner[]> {
  console.log(`🎯 Determinando vencedores para competição ${competitionId}...`);

  try {
    // Buscar competição
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        league: {
          include: {
            teams: {
              where: {
                rank: {
                  lte: 3
                }
              },
              orderBy: {
                rank: 'asc'
              }
            }
          }
        }
      }
    });

    if (!competition) {
      throw new Error(`Competição ${competitionId} não encontrada`);
    }

    // Parse prize distribution
    let prizeDistribution: PrizeDistribution;
    try {
      prizeDistribution = JSON.parse(competition.league.prizeDistribution);
    } catch {
      // Default distribution
      prizeDistribution = { first: 50, second: 30, third: 20 };
    }

    const winners: Winner[] = [];

    // Calcular prêmios para top 3
    for (const team of competition.league.teams) {
      if (team.rank && team.rank <= 3) {
        const prize = calculatePrize(
          competition.prizePool,
          team.rank,
          prizeDistribution
        );

        winners.push({
          position: team.rank,
          teamId: team.id,
          teamName: team.teamName,
          userWallet: team.userWallet,
          totalScore: team.totalScore || 0,
          prize
        });

        console.log(`  🏆 ${team.rank}º lugar: ${team.teamName} - ${prize} SOL`);
      }
    }

    // Salvar vencedores na competição
    await prisma.competition.update({
      where: { id: competitionId },
      data: {
        winners: JSON.stringify(winners)
      }
    });

    console.log(`✅ Vencedores determinados: ${winners.length} times premiados`);
    return winners;

  } catch (error) {
    console.error(`❌ Erro ao determinar vencedores:`, error);
    throw error;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Verifica se uma competição pode ser iniciada
 */
export async function canStartCompetition(competitionId: string): Promise<boolean> {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId }
  });

  if (!competition) return false;
  if (competition.status !== 'pending') return false;

  const now = new Date();
  return now >= competition.startTime;
}

/**
 * Verifica se uma competição pode ser finalizada
 */
export async function canEndCompetition(competitionId: string): Promise<boolean> {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId }
  });

  if (!competition) return false;
  if (competition.status !== 'active') return false;

  const now = new Date();
  return now >= competition.endTime;
}

/**
 * Competition Manager
 *
 * Gerencia todo o ciclo de vida de competições:
 * - Snapshots de preços (início e fim)
 * - Cálculo de pontuações
 * - Rankings
 * - Determinação de vencedores e prêmios
 *
 * ✅ REFATORADO: Agora usa UserTeam em vez de Team (legacy)
 */

import { prisma } from '@/lib/prisma';
import { getMarketDataByIds, symbolsToIds } from '@/lib/services/cache';

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
 * ✅ REFATORADO: Usa UserTeam filtrado por competitionId
 */
export async function createStartSnapshot(competitionId: string): Promise<TokenSnapshot[]> {
  console.log(`📸 Criando snapshot inicial para competição ${competitionId}...`);

  try {
    // ✅ NOVO: Buscar UserTeams da competição diretamente
    const userTeams = await prisma.userTeam.findMany({
      where: { competitionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            publicKey: true
          }
        }
      }
    });

    console.log(`👥 Encontrados ${userTeams.length} times na competição`);

    // Coletar todos os tokens únicos dos times
    const allTokens = new Set<string>();
    userTeams.forEach(userTeam => {
      try {
        // ✅ IMPORTANTE: players já é JSON, não precisa de parse
        const tokens = userTeam.players as string[];
        tokens.forEach(token => allTokens.add(token));
      } catch (error) {
        console.error(`❌ Erro ao processar tokens do time ${userTeam.id}:`, error);
      }
    });

    console.log(`🔍 Encontrados ${allTokens.size} tokens únicos nos times`);

    // Converter símbolos para IDs da CoinGecko
    const symbolsArray = Array.from(allTokens);
    const tokenIds = symbolsToIds(symbolsArray);

    console.log(`🔄 Convertidos ${symbolsArray.length} símbolos → ${tokenIds.length} IDs`);

    // Buscar preços atuais da CoinGecko (dados frescos)
    const marketTokens = await getMarketDataByIds(tokenIds);

    const snapshots: TokenSnapshot[] = [];
    const now = new Date();

    // Criar mapa símbolo → preço para acesso rápido
    const priceMap = new Map(
      marketTokens.map(t => [t.symbol.toUpperCase(), t.current_price])
    );

    // Criar entradas de snapshot para cada token
    for (const symbol of allTokens) {
      const price = priceMap.get(symbol.toUpperCase());

      if (price !== undefined) {
        // Salvar no PriceHistory
        await prisma.priceHistory.create({
          data: {
            tokenSymbol: symbol,
            price: price,
            timestamp: now,
            source: `competition_start_${competitionId}`
          }
        });

        // ✅ CORREÇÃO DE BUG: Usar upsert em vez de updateMany
        // Isso garante que tokens escalados em times mas fora do Top 100
        // sejam criados no CompetitionToken se não existirem
        const tokenData = marketTokens.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());

        if (tokenData) {
          await prisma.competitionToken.upsert({
            where: {
              competitionId_tokenId: {
                competitionId: competitionId,
                tokenId: tokenData.id
              }
            },
            update: {
              priceStart: price,
              priceStartDate: now
            },
            create: {
              competitionId: competitionId,
              tokenId: tokenData.id,
              symbol: tokenData.symbol,
              name: tokenData.name,
              imageUrl: tokenData.image,
              marketCapRank: tokenData.market_cap_rank,
              priceStart: price,
              priceStartDate: now
            }
          });
          console.log(`  ✅ ${symbol}: $${price}`);
        } else {
          console.warn(`  ⚠️ Token ${symbol} não encontrado nos dados de mercado`);
        }

        snapshots.push({
          symbol,
          price: price,
          timestamp: now
        });
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
 * ✅ REFATORADO: Usa UserTeam filtrado por competitionId
 */
export async function createEndSnapshot(competitionId: string): Promise<TokenSnapshot[]> {
  console.log(`📸 Criando snapshot final para competição ${competitionId}...`);

  try {
    // ✅ NOVO: Buscar UserTeams da competição diretamente
    const userTeams = await prisma.userTeam.findMany({
      where: { competitionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            publicKey: true
          }
        }
      }
    });

    console.log(`👥 Encontrados ${userTeams.length} times na competição`);

    // Coletar todos os tokens únicos
    const allTokens = new Set<string>();
    userTeams.forEach(userTeam => {
      try {
        // ✅ IMPORTANTE: players já é JSON, não precisa de parse
        const tokens = userTeam.players as string[];
        tokens.forEach(token => allTokens.add(token));
      } catch (error) {
        console.error(`❌ Erro ao processar tokens do time ${userTeam.id}:`, error);
      }
    });

    console.log(`🔍 Encontrados ${allTokens.size} tokens únicos nos times`);

    // Converter símbolos para IDs da CoinGecko
    const symbolsArray = Array.from(allTokens);
    const tokenIds = symbolsToIds(symbolsArray);

    console.log(`🔄 Convertidos ${symbolsArray.length} símbolos → ${tokenIds.length} IDs`);

    // Buscar preços atuais da CoinGecko (dados frescos)
    const marketTokens = await getMarketDataByIds(tokenIds);

    const snapshots: TokenSnapshot[] = [];
    const now = new Date();

    // Criar mapa símbolo → preço para acesso rápido
    const priceMap = new Map(
      marketTokens.map(t => [t.symbol.toUpperCase(), t.current_price])
    );

    // Criar entradas de snapshot para cada token
    for (const symbol of allTokens) {
      const price = priceMap.get(symbol.toUpperCase());

      if (price !== undefined) {
        // Salvar no PriceHistory
        await prisma.priceHistory.create({
          data: {
            tokenSymbol: symbol,
            price: price,
            timestamp: now,
            source: `competition_end_${competitionId}`
          }
        });

        // ✅ CRÍTICO: Atualizar CompetitionToken.priceEnd e calcular percentChange
        const competitionToken = await prisma.competitionToken.findFirst({
          where: {
            competitionId: competitionId,
            symbol: symbol
          }
        });

        if (competitionToken && competitionToken.priceStart) {
          const priceStart = Number(competitionToken.priceStart);
          const percentChange = ((price - priceStart) / priceStart) * 100;

          await prisma.competitionToken.update({
            where: { id: competitionToken.id },
            data: {
              priceEnd: price,
              priceEndDate: now,
              percentChange: percentChange
            }
          });
        }

        snapshots.push({
          symbol,
          price: price,
          timestamp: now
        });

        console.log(`  ✅ ${symbol}: $${price}`);
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
 * ✅ REFATORADO: Usa UserTeam e atualiza totalPoints
 */
export async function calculateAllScores(competitionId: string): Promise<TeamScore[]> {
  console.log(`🧮 Calculando pontuações para competição ${competitionId}...`);

  try {
    // ✅ NOVO: Buscar UserTeams diretamente
    const userTeams = await prisma.userTeam.findMany({
      where: { competitionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            publicKey: true
          }
        }
      }
    });

    console.log(`👥 Encontrados ${userTeams.length} times na competição`);

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
    for (const userTeam of userTeams) {
      try {
        // ✅ IMPORTANTE: players já é JSON, não precisa de parse
        const tokens = userTeam.players as string[];
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
            console.warn(`⚠️ Preços não encontrados para ${symbol} no time ${userTeam.teamName}`);
          }
        }

        // ✅ NOVO: Atualizar totalPoints no UserTeam (SEM rank!)
        await prisma.userTeam.update({
          where: { id: userTeam.id },
          data: { totalPoints: totalScore }
        });

        teamScores.push({
          teamId: userTeam.id,
          teamName: userTeam.teamName || 'Time sem nome',
          userWallet: userTeam.user.publicKey || '',
          tokens,
          totalScore,
          breakdown
        });

        console.log(`  📊 ${userTeam.teamName}: ${totalScore.toFixed(2)}%`);

      } catch (error) {
        console.error(`❌ Erro ao calcular score do time ${userTeam.id}:`, error);
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
 * Atualiza rankings dos times baseado em totalPoints
 * ✅ REFATORADO: UserTeam não tem coluna rank, então essa função apenas ordena
 * O rank será calculado em runtime nos endpoints que precisam dele
 */
export async function updateRankings(competitionId: string): Promise<void> {
  console.log(`🏆 Atualizando rankings para competição ${competitionId}...`);

  try {
    // ✅ NOVO: Buscar UserTeams ordenados por totalPoints
    const userTeams = await prisma.userTeam.findMany({
      where: { competitionId },
      include: {
        user: {
          select: {
            name: true,
            publicKey: true
          }
        }
      },
      orderBy: {
        totalPoints: 'desc'
      }
    });

    console.log(`👥 Ranking da competição ${competitionId}:`);

    // ✅ IMPORTANTE: Não salvamos rank no banco, apenas exibimos
    userTeams.forEach((team, index) => {
      const rank = index + 1;
      const userName = team.user.name || 'Usuário sem nome';
      console.log(`  🥇 #${rank}: ${team.teamName} (${userName}) - ${team.totalPoints.toString()}%`);
    });

    console.log(`✅ Rankings processados para ${userTeams.length} times`);

  } catch (error) {
    console.error(`❌ Erro ao processar rankings:`, error);
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
 * ✅ REFATORADO: Usa UserTeam e calcula rank em runtime
 */
export async function determineWinners(competitionId: string): Promise<Winner[]> {
  console.log(`🎯 Determinando vencedores para competição ${competitionId}...`);

  try {
    // Buscar competição com league
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        league: true
      }
    });

    if (!competition) {
      throw new Error(`Competição ${competitionId} não encontrada`);
    }

    // ✅ NOVO: Buscar UserTeams ordenados por totalPoints
    const userTeams = await prisma.userTeam.findMany({
      where: { competitionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            publicKey: true
          }
        }
      },
      orderBy: {
        totalPoints: 'desc'
      },
      take: 3 // Top 3
    });

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
    userTeams.forEach((team, index) => {
      const position = index + 1; // ✅ Rank calculado em runtime

      const prize = calculatePrize(
        competition.prizePool,
        position,
        prizeDistribution
      );

      winners.push({
        position,
        teamId: team.id,
        teamName: team.teamName || 'Time sem nome',
        userWallet: team.user.publicKey || '',
        totalScore: Number(team.totalPoints) || 0,
        prize
      });

      console.log(`  🏆 ${position}º lugar: ${team.teamName} - ${prize} SOL`);
    });

    // Salvar vencedores na competição
    await prisma.competition.update({
      where: { id: competitionId },
      data: {
        winners: JSON.stringify(winners)
      }
    });

    // ✅ CRIAR PRIZE CLAIMS NO BANCO PARA CADA VENCEDOR
    console.log('💾 Criando PrizeClaims no banco...');

    for (const winner of winners) {
      // Buscar userId do time
      const team = await prisma.userTeam.findUnique({
        where: { id: winner.teamId },
        select: { userId: true }
      });

      if (team) {
        await prisma.prizeClaim.create({
          data: {
            userId: team.userId,
            competitionId: competitionId,
            amount: winner.prize,
            position: winner.position,
            prizeType: 'ROUND_PRIZE',
            claimed: false
          }
        });

        console.log(`  💰 PrizeClaim criado: ${winner.position}º lugar - ${winner.teamName} - ${winner.prize} SOL`);
      }
    }

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
  if (competition.status !== 'PENDING') return false;  // ✅ CORREÇÃO: Status maiúsculo

  const now = new Date();
  return now >= competition.startDate;  // ✅ CORREÇÃO: startDate (não startTime)
}

/**
 * Verifica se uma competição pode ser finalizada
 */
export async function canEndCompetition(competitionId: string): Promise<boolean> {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId }
  });

  if (!competition) return false;
  if (competition.status !== 'ACTIVE') return false;  // ✅ CORREÇÃO: Status maiúsculo

  const now = new Date();
  return now >= competition.endDate;  // ✅ CORREÇÃO: endDate (não endTime)
}

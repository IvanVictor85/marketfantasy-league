import { prisma } from './prisma';
import { ScoringService, TeamScore } from './scoring-service';

export interface PrizeDistribution {
  first: number;   // Percentual para 1º lugar
  second: number;  // Percentual para 2º lugar  
  third: number;   // Percentual para 3º lugar
}

export interface PrizeWinner {
  rank: number;
  teamId: string;
  teamName: string;
  userWallet: string;
  prizeAmount: number;
  prizePercentage: number;
  totalScore: number;
}

export interface PrizeDistributionResult {
  leagueId: string;
  leagueName: string;
  totalPrizePool: number;
  winners: PrizeWinner[];
  distribution: PrizeDistribution;
  distributedAt: Date;
  transactionHashes?: string[];
}

export class PrizeService {
  /**
   * Calcula distribuição de prêmios para uma liga
   */
  static async calculatePrizeDistribution(leagueId: string): Promise<PrizeDistributionResult> {
    try {
      console.log('🏆 [Prize] Calculating prize distribution for league:', leagueId);

      // Buscar dados da liga
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: {
          teams: {
            where: { hasValidEntry: true },
            orderBy: { rank: 'asc' }
          }
        }
      });

      if (!league) {
        throw new Error('Liga não encontrada');
      }

      if (league.teams.length === 0) {
        throw new Error('Nenhum time participando da liga');
      }

      // Parse da distribuição de prêmios
      const distribution: PrizeDistribution = JSON.parse(league.prizeDistribution);
      
      // Calcular prêmios para os 3 primeiros colocados
      const winners: PrizeWinner[] = [];
      const topTeams = league.teams.slice(0, 3); // Top 3

      topTeams.forEach((team, index) => {
        const rank = index + 1;
        let prizePercentage = 0;
        
        switch (rank) {
          case 1:
            prizePercentage = distribution.first;
            break;
          case 2:
            prizePercentage = distribution.second;
            break;
          case 3:
            prizePercentage = distribution.third;
            break;
        }

        const prizeAmount = (league.totalPrizePool * prizePercentage) / 100;

        winners.push({
          rank,
          teamId: team.id,
          teamName: team.teamName,
          userWallet: team.userWallet,
          prizeAmount: Math.round(prizeAmount * 100) / 100, // Arredondar para 2 casas decimais
          prizePercentage,
          totalScore: team.totalScore || 0
        });
      });

      const result: PrizeDistributionResult = {
        leagueId: league.id,
        leagueName: league.name,
        totalPrizePool: league.totalPrizePool,
        winners,
        distribution,
        distributedAt: new Date()
      };

      console.log('✅ [Prize] Prize distribution calculated:', {
        leagueId: league.id,
        totalPrizePool: league.totalPrizePool,
        winnersCount: winners.length,
        totalDistributed: winners.reduce((sum, w) => sum + w.prizeAmount, 0)
      });

      return result;

    } catch (error) {
      console.error('❌ [Prize] Error calculating prize distribution:', error);
      throw error;
    }
  }

  /**
   * Simula distribuição de prêmios (para desenvolvimento)
   */
  static async simulatePrizeDistribution(leagueId: string): Promise<PrizeDistributionResult> {
    try {
      console.log('🎭 [Prize] Simulating prize distribution for league:', leagueId);

      const league = await prisma.league.findUnique({
        where: { id: leagueId }
      });

      if (!league) {
        throw new Error('Liga não encontrada');
      }

      // Gerar times simulados com rankings
      const simulatedTeams = ScoringService.generateSimulatedScores(6);
      const topTeams = simulatedTeams.slice(0, 3);

      const distribution: PrizeDistribution = JSON.parse(league.prizeDistribution);
      
      const winners: PrizeWinner[] = topTeams.map((team, index) => {
        const rank = index + 1;
        let prizePercentage = 0;
        
        switch (rank) {
          case 1:
            prizePercentage = distribution.first;
            break;
          case 2:
            prizePercentage = distribution.second;
            break;
          case 3:
            prizePercentage = distribution.third;
            break;
        }

        const prizeAmount = (league.totalPrizePool * prizePercentage) / 100;

        return {
          rank,
          teamId: team.teamId,
          teamName: team.teamName,
          userWallet: team.userWallet,
          prizeAmount: Math.round(prizeAmount * 100) / 100,
          prizePercentage,
          totalScore: team.totalScore
        };
      });

      const result: PrizeDistributionResult = {
        leagueId: league.id,
        leagueName: league.name,
        totalPrizePool: league.totalPrizePool,
        winners,
        distribution,
        distributedAt: new Date(),
        transactionHashes: [
          'SIMULATED_TX_1st_PLACE',
          'SIMULATED_TX_2nd_PLACE', 
          'SIMULATED_TX_3rd_PLACE'
        ]
      };

      console.log('✅ [Prize] Simulated prize distribution:', {
        leagueId: league.id,
        totalPrizePool: league.totalPrizePool,
        winnersCount: winners.length
      });

      return result;

    } catch (error) {
      console.error('❌ [Prize] Error simulating prize distribution:', error);
      throw error;
    }
  }

  /**
   * Registra distribuição de prêmios no banco de dados
   */
  static async recordPrizeDistribution(distribution: PrizeDistributionResult): Promise<void> {
    try {
      console.log('📝 [Prize] Recording prize distribution in database');

      // Criar registro de competição com os vencedores
      const competition = await prisma.competition.create({
        data: {
          leagueId: distribution.leagueId,
          startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
          endTime: new Date(),
          status: 'completed',
          winners: JSON.stringify(distribution.winners.map(w => w.userWallet)),
          prizePool: distribution.totalPrizePool,
          distributed: true
        }
      });

      console.log('✅ [Prize] Prize distribution recorded:', {
        competitionId: competition.id,
        winnersCount: distribution.winners.length
      });

    } catch (error) {
      console.error('❌ [Prize] Error recording prize distribution:', error);
      throw error;
    }
  }

  /**
   * Obtém histórico de distribuições de prêmios
   */
  static async getPrizeHistory(leagueId: string): Promise<PrizeDistributionResult[]> {
    try {
      const competitions = await prisma.competition.findMany({
        where: {
          leagueId,
          distributed: true,
          status: 'completed'
        },
        orderBy: { endTime: 'desc' },
        include: {
          league: true
        }
      });

      return competitions.map(comp => {
        const winners = JSON.parse(comp.winners || '[]') as string[];
        const distribution: PrizeDistribution = JSON.parse(comp.league.prizeDistribution);
        
        return {
          leagueId: comp.leagueId,
          leagueName: comp.league.name,
          totalPrizePool: comp.prizePool,
          winners: winners.map((wallet, index) => ({
            rank: index + 1,
            teamId: `historical_${comp.id}_${index}`,
            teamName: `Time ${index + 1}`,
            userWallet: wallet,
            prizeAmount: (comp.prizePool * Object.values(distribution)[index]) / 100,
            prizePercentage: Object.values(distribution)[index],
            totalScore: 0
          })),
          distribution,
          distributedAt: comp.endTime,
          transactionHashes: [`HISTORICAL_TX_${comp.id}`]
        };
      });

    } catch (error) {
      console.error('❌ [Prize] Error getting prize history:', error);
      return [];
    }
  }

  /**
   * Valida se uma liga pode ter prêmios distribuídos
   */
  static async canDistributePrizes(leagueId: string): Promise<{ canDistribute: boolean; reason?: string }> {
    try {
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: {
          teams: {
            where: { hasValidEntry: true }
          }
        }
      });

      if (!league) {
        return { canDistribute: false, reason: 'Liga não encontrada' };
      }

      if (!league.isActive) {
        return { canDistribute: false, reason: 'Liga não está ativa' };
      }

      if (league.teams.length < 3) {
        return { canDistribute: false, reason: 'Mínimo de 3 times necessário para distribuição' };
      }

      if (league.totalPrizePool <= 0) {
        return { canDistribute: false, reason: 'Prize pool vazio' };
      }

      const now = new Date();
      if (now < league.endDate) {
        return { canDistribute: false, reason: 'Liga ainda não terminou' };
      }

      return { canDistribute: true };

    } catch (error) {
      console.error('❌ [Prize] Error validating prize distribution:', error);
      return { canDistribute: false, reason: 'Erro interno' };
    }
  }
}

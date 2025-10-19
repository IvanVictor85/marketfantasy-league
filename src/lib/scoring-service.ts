import { CoinGeckoService, TokenPriceData } from './coingecko-service';
import { prisma } from './prisma';

export interface TeamScore {
  teamId: string;
  teamName: string;
  userWallet: string;
  tokens: string[];
  tokenPrices: TokenPriceData[];
  totalScore: number;
  rank: number;
  scoreBreakdown: {
    tokenScores: Array<{
      symbol: string;
      score: number;
      change24h: number;
      change7d: number;
      change30d: number;
    }>;
  };
}

export interface LeagueRanking {
  leagueId: string;
  leagueName: string;
  totalTeams: number;
  teams: TeamScore[];
  lastUpdated: Date;
  prizePool: number;
  entryFee: number;
}

export class ScoringService {
  /**
   * Calcula pontuações e rankings para todos os times de uma liga
   */
  static async calculateLeagueRankings(leagueId: string): Promise<LeagueRanking> {
    try {
      console.log('📊 [Scoring] Calculating rankings for league:', leagueId);

      // Buscar dados da liga
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: {
          teams: {
            where: { hasValidEntry: true },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!league) {
        throw new Error('Liga não encontrada');
      }

      // Coletar todos os tokens únicos dos times
      const allTokens = new Set<string>();
      league.teams.forEach(team => {
        try {
          const tokens = JSON.parse(team.tokens) as string[];
          tokens.forEach(token => allTokens.add(token));
        } catch (error) {
          console.error('Error parsing team tokens:', error);
        }
      });

      // Buscar preços de todos os tokens
      const tokenPrices = await CoinGeckoService.getTokenPrices(Array.from(allTokens));
      const priceMap = new Map(tokenPrices.map(tp => [tp.symbol, tp]));

      // Calcular pontuações para cada time
      const teamScores: TeamScore[] = league.teams.map(team => {
        try {
          const teamTokens = JSON.parse(team.tokens) as string[];
          const teamTokenPrices = teamTokens
            .map(symbol => priceMap.get(symbol))
            .filter(Boolean) as TokenPriceData[];

          const totalScore = CoinGeckoService.calculateTeamScore(teamTokenPrices);
          
          const scoreBreakdown = {
            tokenScores: teamTokenPrices.map(token => ({
              symbol: token.symbol,
              score: CoinGeckoService.calculateTokenScore(token),
              change24h: token.change24h,
              change7d: token.change7d,
              change30d: token.change30d
            }))
          };

          return {
            teamId: team.id,
            teamName: team.teamName,
            userWallet: team.userWallet,
            tokens: teamTokens,
            tokenPrices: teamTokenPrices,
            totalScore,
            rank: 0, // Será calculado após ordenação
            scoreBreakdown
          };
        } catch (error) {
          console.error('Error calculating team score:', error);
          return {
            teamId: team.id,
            teamName: team.teamName,
            userWallet: team.userWallet,
            tokens: [],
            tokenPrices: [],
            totalScore: 0,
            rank: 0,
            scoreBreakdown: { tokenScores: [] }
          };
        }
      });

      // Ordenar por pontuação (maior para menor) e atribuir rankings
      teamScores.sort((a, b) => b.totalScore - a.totalScore);
      teamScores.forEach((team, index) => {
        team.rank = index + 1;
      });

      // Atualizar rankings no banco de dados
      await this.updateTeamRankings(teamScores);

      const ranking: LeagueRanking = {
        leagueId: league.id,
        leagueName: league.name,
        totalTeams: teamScores.length,
        teams: teamScores,
        lastUpdated: new Date(),
        prizePool: league.totalPrizePool,
        entryFee: league.entryFee
      };

      console.log('✅ [Scoring] Rankings calculated successfully:', {
        leagueId: league.id,
        totalTeams: teamScores.length,
        topTeam: teamScores[0]?.teamName,
        topScore: teamScores[0]?.totalScore
      });

      return ranking;

    } catch (error) {
      console.error('❌ [Scoring] Error calculating league rankings:', error);
      throw error;
    }
  }

  /**
   * Atualiza rankings dos times no banco de dados
   */
  private static async updateTeamRankings(teamScores: TeamScore[]): Promise<void> {
    try {
      const updatePromises = teamScores.map(team => 
        prisma.team.update({
          where: { id: team.teamId },
          data: {
            totalScore: team.totalScore,
            rank: team.rank
          }
        })
      );

      await Promise.all(updatePromises);
      console.log('✅ [Scoring] Team rankings updated in database');

    } catch (error) {
      console.error('❌ [Scoring] Error updating team rankings:', error);
      throw error;
    }
  }

  /**
   * Calcula pontuação para um time específico
   */
  static async calculateTeamScore(teamId: string): Promise<TeamScore | null> {
    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          league: true
        }
      });

      if (!team) {
        return null;
      }

      const teamTokens = JSON.parse(team.tokens) as string[];
      const tokenPrices = await CoinGeckoService.getTokenPrices(teamTokens);
      
      const totalScore = CoinGeckoService.calculateTeamScore(tokenPrices);
      
      const scoreBreakdown = {
        tokenScores: tokenPrices.map(token => ({
          symbol: token.symbol,
          score: CoinGeckoService.calculateTokenScore(token),
          change24h: token.change24h,
          change7d: token.change7d,
          change30d: token.change30d
        }))
      };

      return {
        teamId: team.id,
        teamName: team.teamName,
        userWallet: team.userWallet,
        tokens: teamTokens,
        tokenPrices,
        totalScore,
        rank: team.rank || 0,
        scoreBreakdown
      };

    } catch (error) {
      console.error('❌ [Scoring] Error calculating team score:', error);
      return null;
    }
  }

  /**
   * Obtém ranking atual de uma liga (sem recalcular)
   */
  static async getCurrentRanking(leagueId: string): Promise<LeagueRanking | null> {
    try {
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
        return null;
      }

      const teamScores: TeamScore[] = league.teams.map(team => {
        try {
          const teamTokens = JSON.parse(team.tokens) as string[];
          return {
            teamId: team.id,
            teamName: team.teamName,
            userWallet: team.userWallet,
            tokens: teamTokens,
            tokenPrices: [], // Não carregamos preços para ranking rápido
            totalScore: team.totalScore || 0,
            rank: team.rank || 0,
            scoreBreakdown: { tokenScores: [] }
          };
        } catch (error) {
          return {
            teamId: team.id,
            teamName: team.teamName,
            userWallet: team.userWallet,
            tokens: [],
            tokenPrices: [],
            totalScore: 0,
            rank: 0,
            scoreBreakdown: { tokenScores: [] }
          };
        }
      });

      return {
        leagueId: league.id,
        leagueName: league.name,
        totalTeams: teamScores.length,
        teams: teamScores,
        lastUpdated: league.updatedAt,
        prizePool: league.totalPrizePool,
        entryFee: league.entryFee
      };

    } catch (error) {
      console.error('❌ [Scoring] Error getting current ranking:', error);
      return null;
    }
  }

  /**
   * Simula pontuações para desenvolvimento/teste
   */
  static generateSimulatedScores(teamCount: number): TeamScore[] {
    const teams: TeamScore[] = [];
    
    for (let i = 0; i < teamCount; i++) {
      const score = Math.random() * 100 + 10; // 10-110 pontos
      teams.push({
        teamId: `sim_${i}`,
        teamName: `Time ${i + 1}`,
        userWallet: `wallet_${i}`,
        tokens: ['BTC', 'ETH', 'SOL'],
        tokenPrices: [],
        totalScore: Math.round(score * 100) / 100,
        rank: i + 1,
        scoreBreakdown: {
          tokenScores: [
            { symbol: 'BTC', score: score * 0.4, change24h: 5, change7d: 10, change30d: 15 },
            { symbol: 'ETH', score: score * 0.35, change24h: 3, change7d: 8, change30d: 12 },
            { symbol: 'SOL', score: score * 0.25, change24h: 7, change7d: 12, change30d: 18 }
          ]
        }
      });
    }

    return teams.sort((a, b) => b.totalScore - a.totalScore);
  }
}

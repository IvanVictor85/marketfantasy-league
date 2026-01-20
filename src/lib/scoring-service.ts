/**
 * 📊 SCORING SERVICE - Sistema de Pontuação em Tempo Real
 *
 * Calcula pontuações dos times baseado em variações de preços dos tokens.
 *
 * LÓGICA DE CÁLCULO:
 * - Competição ACTIVE: Usa preços ATUAIS vs snapshot inicial (tempo real)
 * - Competição COMPLETED: Usa totalPoints já calculado (fixo)
 */

import { prisma } from './prisma';
import { getMarketDataByIds } from './services/cache';

export interface TokenScore {
  symbol: string;
  priceStart: number;
  priceCurrent: number;
  percentChange: number;
}

export interface TeamScore {
  teamId: string;
  teamName: string;
  userId: string;
  userEmail: string | null;
  username: string | null;
  tokens: string[];
  tokenScores: TokenScore[];
  totalScore: number;
  rank: number;
}

export interface LeagueRanking {
  leagueId: string;
  leagueName: string;
  competitionId: string;
  competitionStatus: string;
  totalTeams: number;
  teams: TeamScore[];
  lastUpdated: Date;
  prizePool: number;
  entryFee: number;
}

export class ScoringService {
  /**
   * Calcula rankings para a competição ativa de uma liga
   */
  static async calculateLeagueRankings(leagueId: string): Promise<LeagueRanking> {
    try {
      console.log('📊 [Scoring] Calculating rankings for league:', leagueId);

      // Buscar a liga
      const league = await prisma.league.findUnique({
        where: { id: leagueId }
      });

      if (!league) {
        throw new Error('Liga não encontrada');
      }

      // Buscar a competição mais recente (ACTIVE ou COMPLETED)
      const competition = await prisma.competition.findFirst({
        where: {
          leagueId: leagueId,
          status: { in: ['ACTIVE', 'COMPLETED'] }
        },
        orderBy: { startDate: 'desc' },
        include: {
          userTeams: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true
                }
              }
            }
          },
          competitionTokens: true
        }
      });

      if (!competition) {
        // Nenhuma competição ativa ou completa - retornar ranking vazio
        console.log('⚠️  [Scoring] Nenhuma competição ativa/completa encontrada');
        return {
          leagueId: league.id,
          leagueName: league.name,
          competitionId: '',
          competitionStatus: 'NONE',
          totalTeams: 0,
          teams: [],
          lastUpdated: new Date(),
          prizePool: 0,
          entryFee: Number(league.entryFee)
        };
      }

      console.log(`🎯 [Scoring] Competition found: ${competition.id} (${competition.status})`);
      console.log(`📋 [Scoring] Teams: ${competition.userTeams.length}`);

      let teamScores: TeamScore[];

      if (competition.status === 'COMPLETED') {
        // Competição finalizada - usar pontuação já calculada
        teamScores = await this.getCompletedRankings(competition);
      } else {
        // Competição ativa - calcular em tempo real
        teamScores = await this.calculateLiveRankings(competition);
      }

      // Ordenar por pontuação e atribuir ranks
      teamScores.sort((a, b) => b.totalScore - a.totalScore);
      teamScores.forEach((team, index) => {
        team.rank = index + 1;
      });

      const ranking: LeagueRanking = {
        leagueId: league.id,
        leagueName: league.name,
        competitionId: competition.id,
        competitionStatus: competition.status,
        totalTeams: teamScores.length,
        teams: teamScores,
        lastUpdated: new Date(),
        prizePool: Number(competition.prizePool),
        entryFee: Number(league.entryFee)
      };

      console.log('✅ [Scoring] Rankings calculated:', {
        totalTeams: teamScores.length,
        topTeam: teamScores[0]?.teamName,
        topScore: teamScores[0]?.totalScore.toFixed(2) + '%'
      });

      return ranking;

    } catch (error) {
      console.error('❌ [Scoring] Error calculating league rankings:', error);
      throw error;
    }
  }

  /**
   * Calcula rankings em tempo real para competição ACTIVE
   */
  private static async calculateLiveRankings(competition: any): Promise<TeamScore[]> {
    console.log('🔴 [Scoring] Calculating LIVE rankings...');

    const teamScores: TeamScore[] = [];

    // Coletar todos os tokens únicos
    const allTokens = new Set<string>();
    competition.userTeams.forEach((userTeam: any) => {
      const tokens = Array.isArray(userTeam.players) ? userTeam.players : [];
      tokens.forEach((token: string) => allTokens.add(token));
    });

    console.log(`📊 [Scoring] Unique tokens: ${allTokens.size}`);

    // Buscar preços ATUAIS de todos os tokens
    const tokenSymbols = Array.from(allTokens);
    const tokenIds = this.getTokenIds(tokenSymbols);
    const currentPrices = await getMarketDataByIds(tokenIds);

    // Criar mapa de preços atuais
    const currentPriceMap = new Map(
      currentPrices.map(t => [t.symbol.toUpperCase(), t.current_price])
    );

    // Criar mapa de preços iniciais (do snapshot)
    const startPriceMap = new Map(
      competition.competitionTokens.map((ct: any) => [
        ct.symbol.toUpperCase(),
        ct.priceStart ? Number(ct.priceStart) : 0
      ])
    );

    // Calcular pontuação de cada time
    for (const userTeam of competition.userTeams) {
      const tokens = Array.isArray(userTeam.players) ? userTeam.players : [];
      const tokenScores: TokenScore[] = [];
      let totalScore = 0;

      for (const tokenSymbol of tokens) {
        const symbol = tokenSymbol.toUpperCase();
        const priceStart = startPriceMap.get(symbol) || 0;
        const priceCurrent = currentPriceMap.get(symbol) || 0;

        let percentChange = 0;
        if (priceStart > 0 && priceCurrent > 0) {
          percentChange = ((priceCurrent - priceStart) / priceStart) * 100;
        }

        tokenScores.push({
          symbol,
          priceStart,
          priceCurrent,
          percentChange
        });

        totalScore += percentChange;
      }

      teamScores.push({
        teamId: userTeam.id,
        teamName: userTeam.teamName || `Time de ${userTeam.user.username || userTeam.user.email}`,
        userId: userTeam.userId,
        userEmail: userTeam.user.email,
        username: userTeam.user.username,
        tokens,
        tokenScores,
        totalScore,
        rank: 0 // Será calculado depois
      });
    }

    return teamScores;
  }

  /**
   * Retorna rankings de competição COMPLETED (usa pontos já salvos)
   */
  private static async getCompletedRankings(competition: any): Promise<TeamScore[]> {
    console.log('✅ [Scoring] Getting COMPLETED rankings...');

    const teamScores: TeamScore[] = competition.userTeams.map((userTeam: any) => {
      const tokens = Array.isArray(userTeam.players) ? userTeam.players : [];

      return {
        teamId: userTeam.id,
        teamName: userTeam.teamName || `Time de ${userTeam.user.username || userTeam.user.email}`,
        userId: userTeam.userId,
        userEmail: userTeam.user.email,
        username: userTeam.user.username,
        tokens,
        tokenScores: [], // Não precisa calcular para competições finalizadas
        totalScore: Number(userTeam.totalPoints) || 0,
        rank: 0 // Será calculado depois
      };
    });

    return teamScores;
  }

  /**
   * Mapeia símbolos de tokens para IDs da CoinGecko
   */
  private static getTokenIds(symbols: string[]): string[] {
    const symbolToId: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'BNB': 'binancecoin',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'TRX': 'tron',
      'LINK': 'chainlink',
      'AVAX': 'avalanche-2',
      'MATIC': 'matic-network',
      'POL': 'polygon-ecosystem-token',
      'DOT': 'polkadot',
      'UNI': 'uniswap',
      'ATOM': 'cosmos',
      'LTC': 'litecoin',
      'BCH': 'bitcoin-cash',
      'XLM': 'stellar',
      'AAVE': 'aave',
      'ALGO': 'algorand',
      'VET': 'vechain',
      'FIL': 'filecoin',
      'ETC': 'ethereum-classic',
      'HBAR': 'hedera-hashgraph',
      'APT': 'aptos',
      'NEAR': 'near',
      'GRT': 'the-graph',
      'SAND': 'the-sandbox',
      'MANA': 'decentraland',
      'XTZ': 'tezos',
      'EOS': 'eos',
      'THETA': 'theta-token',
      'FLOW': 'flow',
      'ICP': 'internet-computer',
      'FTM': 'fantom',
      'EGLD': 'elrond-erd-2',
      'XMR': 'monero',
      'ZEC': 'zcash',
      'DASH': 'dash',
      'HYPE': 'hyperliquid'
    };

    return symbols.map(s => symbolToId[s.toUpperCase()] || s.toLowerCase());
  }

  /**
   * Obtém ranking atual sem recalcular (cache)
   */
  static async getCurrentRanking(leagueId: string): Promise<LeagueRanking | null> {
    try {
      // Por enquanto, sempre recalcula para garantir dados frescos
      return await this.calculateLeagueRankings(leagueId);
    } catch (error) {
      console.error('❌ [Scoring] Error getting current ranking:', error);
      return null;
    }
  }

  /**
   * Simula pontuações para testes
   */
  static generateSimulatedScores(teamCount: number): TeamScore[] {
    const teams: TeamScore[] = [];

    for (let i = 0; i < teamCount; i++) {
      const score = Math.random() * 100 - 20; // -20 a +80 pontos
      teams.push({
        teamId: `sim_${i}`,
        teamName: `Time ${i + 1}`,
        userId: `user_${i}`,
        userEmail: `user${i}@test.com`,
        username: `player${i}`,
        tokens: ['BTC', 'ETH', 'SOL'],
        tokenScores: [],
        totalScore: Math.round(score * 100) / 100,
        rank: i + 1
      });
    }

    return teams.sort((a, b) => b.totalScore - a.totalScore);
  }
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, RefreshCw, Coins } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TeamScore {
  teamId: string;
  teamName: string;
  userWallet: string;
  tokens: string[];
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

interface PrizeWinner {
  rank: number;
  teamId: string;
  teamName: string;
  userWallet: string;
  prizeAmount: number;
  prizePercentage: number;
  totalScore: number;
}

interface LeagueRanking {
  leagueId: string;
  leagueName: string;
  totalTeams: number;
  teams: TeamScore[];
  lastUpdated: Date;
  prizePool: number;
  entryFee: number;
}

interface PrizeDistribution {
  leagueId: string;
  leagueName: string;
  totalPrizePool: number;
  winners: PrizeWinner[];
  distribution: {
    first: number;
    second: number;
    third: number;
  };
  distributedAt: Date;
}

export default function RankingsAndPrizes() {
  const [ranking, setRanking] = useState<LeagueRanking | null>(null);
  const [prizeDistribution, setPrizeDistribution] = useState<PrizeDistribution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchRankings = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError('');

      const url = forceRefresh 
        ? '/api/rankings/main?refresh=true'
        : '/api/rankings/main';

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar rankings');
      }

      setRanking(data.ranking);
      setLastRefresh(new Date());
    } catch (error: any) {
      console.error('Error fetching rankings:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPrizeDistribution = async () => {
    try {
      const response = await fetch('/api/prizes/main');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar distribuição de prêmios');
      }

      setPrizeDistribution(data.distribution);
    } catch (error: any) {
      console.error('Error fetching prize distribution:', error);
    }
  };

  const simulatePrizeDistribution = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/prizes/main', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'simulate-distribution' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao simular distribuição');
      }

      setPrizeDistribution(data.distribution);
      await fetchRankings(true); // Refresh rankings after simulation
    } catch (error: any) {
      console.error('Error simulating prize distribution:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
    fetchPrizeDistribution();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <Badge variant="secondary">#{rank}</Badge>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading && !ranking) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Carregando rankings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rankings & Prêmios</h2>
          <p className="text-gray-600">
            {lastRefresh && `Atualizado em ${lastRefresh.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => fetchRankings(true)}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={simulatePrizeDistribution}
            disabled={isLoading}
            size="sm"
          >
            <Coins className="h-4 w-4 mr-2" />
            Simular Prêmios
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Rankings */}
      {ranking && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Ranking da Liga
            </CardTitle>
            <CardDescription>
              {ranking.totalTeams} times • Prize Pool: {ranking.prizePool.toFixed(2)} SOL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ranking.teams.map((team) => (
                <div
                  key={team.teamId}
                  className={`flex items-center justify-between p-4 rounded-lg ${getRankColor(team.rank)}`}
                >
                  <div className="flex items-center gap-3">
                    {getRankIcon(team.rank)}
                    <div>
                      <h3 className="font-semibold">{team.teamName}</h3>
                      <p className="text-sm opacity-80">
                        {team.userWallet.slice(0, 8)}...{team.userWallet.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {team.totalScore.toFixed(2)} pts
                    </div>
                    <div className="text-sm opacity-80">
                      {team.tokens.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prize Distribution */}
      {prizeDistribution && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Distribuição de Prêmios
            </CardTitle>
            <CardDescription>
              Total: {prizeDistribution.totalPrizePool.toFixed(2)} SOL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prizeDistribution.winners.map((winner) => (
                <div
                  key={winner.rank}
                  className={`flex items-center justify-between p-4 rounded-lg ${getRankColor(winner.rank)}`}
                >
                  <div className="flex items-center gap-3">
                    {getRankIcon(winner.rank)}
                    <div>
                      <h3 className="font-semibold">{winner.teamName}</h3>
                      <p className="text-sm opacity-80">
                        {winner.userWallet.slice(0, 8)}...{winner.userWallet.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {winner.prizeAmount.toFixed(2)} SOL
                    </div>
                    <div className="text-sm opacity-80">
                      {winner.prizePercentage}% • {winner.totalScore.toFixed(2)} pts
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>Distribuição:</strong> {prizeDistribution.distribution.first}% / {prizeDistribution.distribution.second}% / {prizeDistribution.distribution.third}%
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Distribuído em:</strong> {new Date(prizeDistribution.distributedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

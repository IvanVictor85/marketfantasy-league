'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flag, TrendingUp, TrendingDown, Award, Clock } from 'lucide-react';

interface Competition {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  seasonId: string | null;
  seasonName: string;
}

interface RoundPerformanceProps {
  leagueId: string;
  userId?: string;
  selectedCompetitionId: string | null;
  onCompetitionChange: (competitionId: string | null) => void;
}

interface RoundData {
  competitionId: string;
  competitionName: string;
  competitionStatus: string;
  startDate: string;
  endDate: string;
  points: number;
  rank: number | null;
  totalParticipants: number;
  prize: {
    amount: number;
    position: number;
    claimed: boolean;
  } | null;
}

interface SeasonData {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  prizePool: number;
  totalRounds: number;
  completedRounds: number;
  activeRound: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
}

interface UserBreakdown {
  rounds: RoundData[];
  totalCompletedPoints: number;
  totalActivePoints: number;
  totalPoints: number;
  currentRank: number | null;
  estimatedPrize: number | null;
  accumulatedPrizes: number;
}

export function RoundPerformance({ leagueId, userId, selectedCompetitionId, onCompetitionChange }: RoundPerformanceProps) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasonData, setSeasonData] = useState<SeasonData | null>(null);
  const [userBreakdown, setUserBreakdown] = useState<UserBreakdown | null>(null);
  const [roundData, setRoundData] = useState<RoundData | null>(null);

  // Fetch competitions
  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const response = await fetch(`/api/league/competitions?leagueId=${leagueId}`);
        if (response.ok) {
          const data = await response.json();
          setCompetitions(data.competitions || []);

          // Set first competition as default if available
          if (data.competitions && data.competitions.length > 0 && !selectedCompetitionId) {
            // Try to find ACTIVE competition first
            const activeComp = data.competitions.find((c: Competition) => c.status === 'ACTIVE');
            if (activeComp) {
              onCompetitionChange(activeComp.id);
            } else {
              onCompetitionChange(data.competitions[0].id);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar competições:', error);
      } finally {
        setLoading(false);
      }
    };

    if (leagueId) {
      fetchCompetitions();
    }
  }, [leagueId]);

  // Fetch data based on selection
  useEffect(() => {
    if (!userId || !selectedCompetitionId || selectedCompetitionId === 'all') {
      return;
    }

    const fetchData = async () => {
      try {
        if (selectedCompetitionId === 'SEASON') {
          // Fetch season data
          const competition = competitions.find(c => c.seasonId);
          if (!competition || !competition.seasonId) return;

          const response = await fetch(
            `/api/season/ranking?seasonId=${competition.seasonId}&userId=${userId}`
          );

          if (response.ok) {
            const data = await response.json();
            setSeasonData(data.season);
            setUserBreakdown(data.userBreakdown);
            setRoundData(null);
          }
        } else {
          // Fetch specific round data
          const response = await fetch(
            `/api/teams?competitionId=${selectedCompetitionId}`
          );

          if (response.ok) {
            const data = await response.json();
            const userTeam = data.teams?.find((t: any) => t.userId === userId);

            if (userTeam) {
              const competition = competitions.find(c => c.id === selectedCompetitionId);
              setRoundData({
                competitionId: selectedCompetitionId,
                competitionName: competition?.name || 'Rodada',
                competitionStatus: competition?.status || 'UNKNOWN',
                startDate: competition?.startDate || '',
                endDate: competition?.endDate || '',
                points: userTeam.liveScore || userTeam.totalPoints || 0,
                rank: userTeam.rank || null,
                totalParticipants: data.teams?.length || 0,
                prize: null // Would need to fetch from prizes API
              });
            }
            setSeasonData(null);
            setUserBreakdown(null);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };

    fetchData();
  }, [selectedCompetitionId, userId, competitions]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="secondary" className="bg-gray-100">✅ Finalizada</Badge>;
      case 'ACTIVE':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">🔴 Ao Vivo</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">⏳ Aguardando</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  // Extract seasonId from competitions
  const seasonId = competitions.find(c => c.seasonId)?.seasonId;

  return (
    <div className="space-y-4">
      {/* Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Meu Desempenho</h3>

        <Select value={selectedCompetitionId || 'all'} onValueChange={onCompetitionChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">📊 Visão Geral</SelectItem>

            {seasonId && (
              <>
                <SelectItem
                  value="SEASON"
                  className="font-semibold text-yellow-700 dark:text-yellow-400"
                >
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    🏆 Temporada
                  </div>
                </SelectItem>
                <div className="h-px bg-border my-1" />
              </>
            )}

            {competitions.map((comp) => (
              <SelectItem key={comp.id} value={comp.id}>
                <div className="flex items-center gap-2">
                  <Flag className="h-3 w-3" />
                  {comp.status === 'COMPLETED' && '✅ '}
                  {comp.status === 'ACTIVE' && '🔴 '}
                  {comp.status === 'PENDING' && '⏳ '}
                  {comp.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Season View */}
      {selectedCompetitionId === 'SEASON' && seasonData && userBreakdown && (
        <div className="space-y-4">
          {/* Season Header */}
          <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-yellow-900 dark:text-yellow-100">
                    {seasonData.name}
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {seasonData.status === 'ACTIVE' ? '🔴 Ativa' : '✅ Finalizada'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-700">
                    {userBreakdown.totalPoints.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Pontos Totais</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-700">
                    {userBreakdown.totalCompletedPoints.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Completados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-700">
                    {userBreakdown.currentRank ? `#${userBreakdown.currentRank}` : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">Ranking</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {userBreakdown.estimatedPrize ?
                      `${userBreakdown.estimatedPrize.toFixed(4)} ◎` : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">Prêmio Est.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rounds Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Breakdown por Rodada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userBreakdown.rounds.map((round) => (
                  <div
                    key={round.competitionId}
                    className={`p-4 rounded-lg border ${
                      round.competitionStatus === 'ACTIVE'
                        ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
                        : 'border-gray-200 bg-gray-50 dark:bg-gray-950/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          {getStatusBadge(round.competitionStatus)}
                          {round.competitionName}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(round.startDate)} - {formatDate(round.endDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {round.points.toFixed(2)} pts
                        </p>
                        {round.rank && (
                          <p className="text-xs text-muted-foreground">
                            #{round.rank} de {round.totalParticipants}
                          </p>
                        )}
                      </div>
                    </div>

                    {round.prize && (
                      <div className="mt-2 pt-2 border-t flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-semibold text-yellow-700">
                          {round.prize.position === 1 && '🥇'}
                          {round.prize.position === 2 && '🥈'}
                          {round.prize.position === 3 && '🥉'}
                          {' '}+{round.prize.amount.toFixed(4)} SOL
                        </span>
                        {round.prize.claimed && (
                          <Badge variant="secondary" className="text-xs">Recebido</Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">💰 Prêmios Acumulados:</span>
                  <span className="font-bold text-green-600">
                    {userBreakdown.accumulatedPrizes.toFixed(4)} SOL
                  </span>
                </div>
                {userBreakdown.estimatedPrize && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="font-semibold">🎯 Prêmio Final Estimado:</span>
                    <span className="font-bold text-yellow-600">
                      {userBreakdown.estimatedPrize.toFixed(4)} SOL
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Single Round View */}
      {selectedCompetitionId !== 'SEASON' && selectedCompetitionId !== 'all' && roundData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{roundData.competitionName}</CardTitle>
              {getStatusBadge(roundData.competitionStatus)}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(roundData.startDate)} - {formatDate(roundData.endDate)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {roundData.points.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {roundData.competitionStatus === 'ACTIVE' ? 'Pontos Parciais' : 'Pontos Finais'}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {roundData.rank ? `#${roundData.rank}` : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Ranking</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">
                  {roundData.totalParticipants}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Participantes</p>
              </div>
            </div>

            {roundData.competitionStatus === 'ACTIVE' && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Rodada em andamento - pontuação parcial atualizada em tempo real
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overview */}
      {selectedCompetitionId === 'all' && (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Selecione uma rodada ou temporada para ver detalhes do seu desempenho
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

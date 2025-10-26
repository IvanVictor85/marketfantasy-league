'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Users, Coins, Target, Award, Clock, RotateCcw } from 'lucide-react';
import { RankingTable } from '@/components/dashboard/ranking-table';
import { LocalizedLink } from '@/components/ui/localized-link';
import { useTranslations } from 'next-intl';

interface Team {
  id: string;
  teamName: string;
  totalScore: number | null;
  rank: number | null;
  tokens: string[];
  user: {
    name: string;
    email: string;
  };
}

interface LeagueData {
  id: string;
  name: string;
  entryFee: number;
  totalPrizePool: number;
  participantCount: number;
}

interface League {
  id: string;
  name: string;
  leagueType: string;
  isActive: boolean;
}

export default function RankingPage() {
  const { user, isAuthenticated } = useAuth();
  const t = useTranslations('RankingPage');
  const [teams, setTeams] = useState<Team[]>([]);
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar todas as ligas
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const response = await fetch('/api/leagues');
        const data = await response.json();

        if (response.ok) {
          setLeagues(data.leagues);
          // Definir liga principal como padrão
          const mainLeague = data.leagues.find((league: League) => 
            league.leagueType === 'MAIN' && league.isActive
          );
          if (mainLeague) {
            setSelectedLeagueId(mainLeague.id);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar ligas:', err);
      }
    };

    fetchLeagues();
  }, []);

  // Buscar dados dos times da liga selecionada
  useEffect(() => {
    const fetchTeams = async () => {
      if (!selectedLeagueId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/teams?leagueId=${selectedLeagueId}`);
        const data = await response.json();

        if (response.ok) {
          setTeams(data.teams);
          setLeagueData(data.league);
        } else {
          setError(data.error || 'Erro ao carregar dados');
        }
      } catch (err) {
        setError('Erro ao conectar com o servidor');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && selectedLeagueId) {
      fetchTeams();
    }
  }, [isAuthenticated, selectedLeagueId]);

  // Encontrar o time do usuário atual
  const currentUserTeam = teams.find(team => 
    team.user.email === user?.email || 
    team.user.name === user?.name
  );

  // Executar reset da competição
  const handleReset = async () => {
    try {
      const response = await fetch('/api/competition/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leagueId: selectedLeagueId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Recarregar dados após reset
        window.location.reload();
      } else {
        setError(data.error || 'Erro ao executar reset');
      }
    } catch (err) {
      setError('Erro ao executar reset');
    }
  };

  // Executar snapshot da competição
  const handleSnapshot = async () => {
    try {
      const response = await fetch('/api/competition/snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leagueId: selectedLeagueId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Recarregar dados após snapshot
        window.location.reload();
      } else {
        setError(data.error || 'Erro ao executar snapshot');
      }
    } catch (err) {
      setError('Erro ao executar snapshot');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">{t('restrictedAccess')}</h2>
            <p className="text-muted-foreground mb-4">
              {t('loginRequired')}
            </p>
            <LocalizedLink href="/login">
              <Button>{t('loginButton')}</Button>
            </LocalizedLink>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-600">{t('error')}</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar com estatísticas */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                {t('quickStatsTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentUserTeam ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('rankLabel')}</span>
                    <Badge variant={currentUserTeam.rank === 1 ? 'default' : 'secondary'}>
                      {currentUserTeam.rank ? `#${currentUserTeam.rank}` : 'N/A'}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('scoreLabel')}</span>
                    <span className="font-bold">
                      {currentUserTeam.totalScore ? `${currentUserTeam.totalScore.toFixed(2)} pts` : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('teamLabel')}</span>
                    <span className="font-medium">{currentUserTeam.teamName}</span>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>{t('noTeamFound')}</p>
                  <LocalizedLink href="/teams">
                    <Button size="sm" className="mt-2">
                      {t('createTeam')}
                    </Button>
                  </LocalizedLink>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-green-500" />
                {t('selectedLeagueTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {leagueData && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('participantsLabel')}</span>
                    <span className="font-bold">{leagueData.participantCount}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('totalPrizeLabel')}</span>
                    <span className="font-bold">{leagueData.totalPrizePool} SOL</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('entryFeeLabel')}</span>
                    <span className="font-bold">{leagueData.entryFee} SOL</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                {t('actionsTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={handleSnapshot}
                className="w-full"
                variant="outline"
              >
                <Trophy className="h-4 w-4 mr-2" />
                {t('execSnapshotButton')}
              </Button>

              <Button
                onClick={handleReset}
                className="w-full"
                variant="outline"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('resetRoundButton')}
              </Button>

              <LocalizedLink href="/teams" className="block">
                <Button variant="outline" className="w-full">
                  <Award className="h-4 w-4 mr-2" />
                  {t('manageTeamButton')}
                </Button>
              </LocalizedLink>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo principal - Ranking */}
        <div className="lg:col-span-3">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
                <p className="text-muted-foreground">
                  {t('subtitle')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">{t('leagueLabel')}</label>
                <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={t('selectLeague')} />
                  </SelectTrigger>
                  <SelectContent>
                    {leagues.map((league) => (
                      <SelectItem key={league.id} value={league.id}>
                        {league.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <RankingTable
            teams={teams}
            currentUserId={user?.id}
            currentUserEmail={user?.email}
          />
        </div>
      </div>
    </div>
  );
}

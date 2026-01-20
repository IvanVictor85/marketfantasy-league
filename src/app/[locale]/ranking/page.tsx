'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Users, Coins, Target, Award, Clock, RotateCcw, Flag } from 'lucide-react';
import { RankingTable } from '@/components/dashboard/ranking-table';
import { SeasonRankingTable } from '@/components/dashboard/season-ranking-table';
import { TeamDetailModal } from '@/components/ranking/team-detail-modal';
import { LocalizedLink } from '@/components/ui/localized-link';
import { useTranslations } from 'next-intl';

import { useRoundTimer } from '@/hooks/useRoundTimer';
import { useCompetitionStatus } from '@/hooks/useCompetitionStatus';
import { useRanking } from '@/hooks/use-ranking';

interface Team {
  id: string;
  teamName: string;
  totalScore: number | null;
  liveScore?: number; // Score calculado em tempo real para competições ACTIVE
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
}

interface League {
  id: string;
  name: string;
  leagueType: string;
  isActive: boolean;
}

interface Competition {
  id: string;
  name: string | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
}


// Componente para exibir o timer da rodada
function RoundTimerCard({ leagueId }: { leagueId: string }) {
  const t = useTranslations('teams');
  const tCommon = useTranslations('common');
  const { formatTime, loading, isExpired } = useRoundTimer({ leagueId: leagueId || 'main-league' });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-5 w-5 mr-2 animate-pulse" />
            <span className="text-sm">{tCommon('loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isExpired) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center text-red-700">
            <Clock className="h-5 w-5 mr-2" />
            <div className="flex-1">
              <p className="text-sm font-semibold">🔴 {t('roundInProgressTime')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-center text-green-700">
          <Clock className="h-5 w-5 mr-2" />
          <div className="flex-1">
            <p className="text-sm font-semibold">🟢 {t('nextRoundStartsIn')}</p>
            <p className="text-lg font-bold">{formatTime()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RankingPage() {
  const { user, isAuthenticated } = useAuth();
  const t = useTranslations('RankingPage');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>('');
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [seasonUserStats, setSeasonUserStats] = useState<any>(null);
  const [isLoadingSeasonStats, setIsLoadingSeasonStats] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  // 🔍 DEBUG: Monitorar mudanças no seasonId
  useEffect(() => {
    console.log('🎯 [SEASON-STATE] seasonId mudou para:', seasonId);
  }, [seasonId]);

  // ✅ Usar hook de ranking com auto-refresh (sincronizado com tokens a cada 5 minutos)
  // ✅ FIXED: Não buscar teams quando "SEASON" está selecionado (evita 404)
  const {
    teams,
    leagueData,
    loading,
    error,
    refetch: refetchRanking
  } = useRanking(
    selectedLeagueId,
    selectedCompetitionId === 'SEASON' ? null : (selectedCompetitionId || null),
    isAuthenticated
  );

  // Verificar se o usuário é admin
  const adminEmails = ['learts@gmail.com', 'pretimaoairdrops@gmail.com'];
  const isAdmin = user && user.email && adminEmails.includes(user.email);

  // Buscar todas as ligas
  useEffect(() => {
    console.log('🏁 RANKING: Iniciando busca de ligas...');

    const fetchLeagues = async () => {
      try {
        console.log('📡 RANKING: Chamando /api/leagues...');
        const response = await fetch('/api/leagues');
        const data = await response.json();

        console.log('📊 RANKING: Resposta de ligas:', {
          ok: response.ok,
          leagues: data.leagues?.length,
          allLeagues: data.leagues,
          data
        });

        if (response.ok) {
          setLeagues(data.leagues);

          // 🔍 DEBUG: Verificar estrutura das ligas
          console.log('🔍 RANKING: Estrutura das ligas:', data.leagues.map((l: any) => ({
            id: l.id,
            name: l.name,
            leagueType: l.leagueType,
            isActive: l.isActive
          })));

          // ✅ FIX: Tentar encontrar liga MAIN ativa, senão usar primeira liga disponível
          const mainLeague = data.leagues.find((league: League) =>
            league.leagueType === 'MAIN' && league.isActive
          ) || data.leagues[0]; // Fallback para primeira liga

          console.log('🎯 RANKING: Liga selecionada:', {
            league: mainLeague,
            wasMainFound: !!data.leagues.find((l: League) => l.leagueType === 'MAIN' && l.isActive),
            usingFallback: !data.leagues.find((l: League) => l.leagueType === 'MAIN' && l.isActive)
          });

          if (mainLeague) {
            console.log('✅ RANKING: Definindo selectedLeagueId:', mainLeague.id);
            setSelectedLeagueId(mainLeague.id);
          } else {
            console.warn('⚠️ RANKING: Nenhuma liga encontrada!');
          }
        }
      } catch (err) {
        console.error('❌ RANKING: Erro ao buscar ligas:', err);
      }
    };

    fetchLeagues();
  }, []);

  // Buscar competições/rodadas quando a liga mudar
  useEffect(() => {
    const fetchCompetitions = async () => {
      if (!selectedLeagueId) {
        setCompetitions([]);
        setSelectedCompetitionId('');
        setSeasonId(null);
        return;
      }

      try {
        console.log('📊 RANKING: Buscando competições da liga:', selectedLeagueId);

        const response = await fetch(`/api/competitions?leagueId=${selectedLeagueId}`);
        const data = await response.json();

        if (response.ok && data.competitions) {
          setCompetitions(data.competitions);

          // Extrair seasonId da primeira competição (todas devem ter o mesmo seasonId)
          console.log('🔍 RANKING: Primeira competição:', data.competitions[0]);
          console.log('🔍 RANKING: seasonId da primeira competição:', data.competitions[0]?.seasonId);

          if (data.competitions.length > 0 && data.competitions[0].seasonId) {
            console.log('✅ RANKING: Definindo seasonId:', data.competitions[0].seasonId);
            setSeasonId(data.competitions[0].seasonId);
          } else {
            console.log('❌ RANKING: seasonId não encontrado, setando null');
            setSeasonId(null);
          }

          // Selecionar automaticamente a competição ACTIVE, ou a mais recente
          const activeComp = data.competitions.find((c: Competition) => c.status === 'ACTIVE');
          const defaultComp = activeComp || data.competitions[0];

          if (defaultComp) {
            console.log('✅ RANKING: Selecionando competição:', defaultComp.name, defaultComp.status);
            setSelectedCompetitionId(defaultComp.id);
          }
        }
      } catch (err) {
        console.error('❌ RANKING: Erro ao buscar competições:', err);
        setCompetitions([]);
      }
    };

    fetchCompetitions();
  }, [selectedLeagueId]);

  // Buscar estatísticas da temporada do usuário
  useEffect(() => {
    const fetchSeasonStats = async () => {
      if (!seasonId || !user?.id) {
        setSeasonUserStats(null);
        return;
      }

      setIsLoadingSeasonStats(true);
      try {
        const response = await fetch(`/api/season/ranking?seasonId=${seasonId}&userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.userBreakdown) {
            setSeasonUserStats(data.userBreakdown);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas da temporada:', error);
      } finally {
        setIsLoadingSeasonStats(false);
      }
    };

    fetchSeasonStats();
  }, [seasonId, user?.id]);

  // Encontrar o time do usuário atual
  const currentUserTeam = teams.find(team => 
    team.user.email === user?.email || 
    team.user.name === user?.name
  );

  // Função para abrir modal de detalhes do time
  const handleTeamClick = (team: any) => {
    console.log('🎯 [RANKING] Time clicado:', team);
    setSelectedTeam(team);
    setTeamModalOpen(true);
  };

  // Obter o status da competição selecionada
  const competitionStatus = competitions.find(c => c.id === selectedCompetitionId)?.status || null;

  // Executar reset da competição
  const handleReset = async () => {
    if (isProcessing) return;

    if (!confirm('Tem certeza que deseja resetar a rodada? Isso apagará todas as pontuações.')) {
      return;
    }

    try {
      setIsProcessing(true);

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
        alert(t('roundResetSuccess'));
        window.location.reload();
      } else {
        alert(`${t('errorLabel')} ${data.error || t('resetError')}`);
        setIsProcessing(false);
      }
    } catch (err) {
      alert(`❌ ${t('resetError')}`);
      setIsProcessing(false);
    }
  };

  // ✅ REFATORADO: Executar snapshot usando competitionId selecionado
  const handleSnapshot = async () => {
    if (isProcessing) return;

    if (!selectedCompetitionId) {
      alert('❌ Nenhuma competição selecionada');
      return;
    }

    if (!confirm('Executar snapshot e calcular pontuações para todos os times?')) {
      return;
    }

    try {
      setIsProcessing(true);

      const response = await fetch('/api/competition/snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          competitionId: selectedCompetitionId
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Snapshot executado com sucesso! Pontuações calculadas.');
        // Refetch ranking em vez de reload
        refetchRanking();
        setIsProcessing(false);
      } else {
        alert(`❌ Erro: ${data.error || 'Erro ao executar snapshot'}`);
        setIsProcessing(false);
      }
    } catch (err) {
      alert('❌ Erro ao executar snapshot');
      setIsProcessing(false);
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

  // ✅ FIX: Só mostrar loading inicial, depois renderizar página mesmo se dados ainda carregando
  const isInitialLoad = loading && teams.length === 0;

  if (isInitialLoad) {
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
                      {(() => {
                        const displayScore = currentUserTeam.liveScore !== undefined
                          ? currentUserTeam.liveScore
                          : currentUserTeam.totalScore;
                        return displayScore !== null ? `${displayScore.toFixed(2)} pts` : 'N/A';
                      })()}
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

          {/* Estatísticas da Temporada */}
          {seasonId && seasonUserStats && (
            <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <Trophy className="h-5 w-5" />
                  🏆 {t('seasonRanking')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Posição</span>
                  <Badge
                    variant={seasonUserStats.currentRank === 1 ? 'default' : 'secondary'}
                    className={seasonUserStats.currentRank <= 3 ? 'bg-yellow-600' : ''}
                  >
                    #{seasonUserStats.currentRank || 'N/A'}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pontos Totais</span>
                  <span className="font-bold text-yellow-700 dark:text-yellow-400">
                    {seasonUserStats.totalPoints.toFixed(2)} pts
                  </span>
                </div>

                {seasonUserStats.totalActivePoints > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Parcial (Ao Vivo)</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      +{seasonUserStats.totalActivePoints.toFixed(2)} pts
                    </span>
                  </div>
                )}

                {seasonUserStats.estimatedPrize && seasonUserStats.estimatedPrize > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Prêmio Estimado</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {seasonUserStats.estimatedPrize.toFixed(4)} SOL
                      </span>
                    </div>
                  </div>
                )}

                {seasonUserStats.accumulatedPrizes > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Prêmios Ganhos</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {seasonUserStats.accumulatedPrizes.toFixed(4)} SOL
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timer da Rodada */}
          <RoundTimerCard leagueId={selectedLeagueId} />

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
                    <span className="font-bold">{teams.length}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('entryFeeLabel')}</span>
                    <span className="font-bold">{leagueData.entryFee} SOL</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {isAdmin && (
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
                  disabled={isProcessing}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processando...' : t('execSnapshotButton')}
                </Button>

                <Button
                  onClick={handleReset}
                  className="w-full"
                  variant="outline"
                  disabled={isProcessing}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processando...' : t('resetRoundButton')}
                </Button>

                <LocalizedLink href="/teams" className="block">
                  <Button variant="outline" className="w-full">
                    <Award className="h-4 w-4 mr-2" />
                    {t('manageTeamButton')}
                  </Button>
                </LocalizedLink>
              </CardContent>
            </Card>
          )}
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

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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

                {/* Seletor de Rodadas */}
                {competitions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">{t('viewLabel')}</label>
                    <Select value={selectedCompetitionId} onValueChange={setSelectedCompetitionId}>
                      <SelectTrigger className="w-[240px]">
                        <SelectValue placeholder={t('selectRound')} />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Opção especial: Temporada (sempre exibida) */}
                        <SelectItem
                          value="SEASON"
                          className="font-semibold text-yellow-700 dark:text-yellow-400"
                        >
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            🏆 {t('season')}
                          </div>
                        </SelectItem>
                        <div className="h-px bg-border my-1" />

                        {/* Rodadas individuais */}
                        {competitions.map((comp, index) => (
                          <SelectItem key={comp.id} value={comp.id}>
                            <div className="flex items-center gap-2">
                              <Flag className="h-3 w-3 opacity-50" />
                              <span>{comp.name || `${t('round')} ${competitions.length - index}`}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                comp.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-700'
                                  : comp.status === 'COMPLETED'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {comp.status === 'ACTIVE' ? `🔴 ${t('live')}` : comp.status}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Renderizar ranking da temporada ou de rodada individual */}
          {selectedCompetitionId === 'SEASON' && seasonId ? (
            <SeasonRankingTable
              seasonId={seasonId}
              currentUserId={user?.id}
            />
          ) : (
            <RankingTable
              teams={teams}
              currentUserId={user?.id}
              currentUserEmail={user?.email}
              onTeamClick={handleTeamClick}
            />
          )}
        </div>
      </div>

      {/* Modal de Detalhes do Time */}
      <TeamDetailModal
        open={teamModalOpen}
        onOpenChange={setTeamModalOpen}
        teamData={selectedTeam ? {
          userId: selectedTeam.userId || selectedTeam.user?.id || selectedTeam.id,
          username: selectedTeam.user?.name || selectedTeam.teamName,
          totalPoints: selectedTeam.liveScore !== undefined ? selectedTeam.liveScore : (selectedTeam.totalScore || 0),
          rank: selectedTeam.rank || 0,
          tokens: selectedTeam.tokens || [],
          formation: selectedTeam.formation || '433',
          user: selectedTeam.user
        } : null}
        competitionId={selectedCompetitionId !== 'SEASON' ? selectedCompetitionId : null}
        competitionStatus={competitionStatus}
        currentUserId={user?.id}
      />
    </div>
  );
}

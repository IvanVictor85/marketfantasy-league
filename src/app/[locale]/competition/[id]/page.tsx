'use client';

import { useParams } from 'next/navigation';
import { useCompetitionStatus } from '@/hooks/useCompetitionStatus';
import CompetitionTimer from '@/components/competition/CompetitionTimer';
import LiveRankings from '@/components/competition/LiveRankings';
import TokenPerformance from '@/components/competition/TokenPerformance';
import Winners from '@/components/competition/Winners';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft, Share2, Download } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function CompetitionPage() {
  const params = useParams();
  const competitionId = params?.id as string;
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { competition, rankings, winners, totalParticipants, loading, error } = useCompetitionStatus({
    competitionId,
    refreshInterval: 30000, // 30 seconds
    enabled: autoRefresh,
  });

  if (loading && !competition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Carregando Competição</h2>
          <p className="text-muted-foreground">Aguarde enquanto buscamos os dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 bg-red-500/10 border-red-500/30 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-500 mb-2">Erro ao Carregar</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link href="/">
            <Button className="bg-red-500 hover:bg-red-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 bg-card border-border text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Competição Não Encontrada</h2>
          <p className="text-muted-foreground mb-6">A competição solicitada não existe ou foi removida.</p>
          <Link href="/">
            <Button className="bg-purple-500 hover:bg-purple-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-75" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/">
              <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              {/* Auto-refresh toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`border-gray-700 ${autoRefresh ? 'bg-green-500/20 border-green-500/50' : 'hover:bg-gray-800'}`}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Auto-atualização ON' : 'Auto-atualização OFF'}
              </Button>

              {/* Share button */}
              <Button variant="outline" size="sm" className="border-gray-700 hover:bg-gray-800">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>

              {/* Export button */}
              <Button variant="outline" size="sm" className="border-gray-700 hover:bg-gray-800">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Competition Title */}
          <div className="text-center mb-6">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-3">
              Competição em Tempo Real
            </h1>
            <p className="text-muted-foreground text-lg">Acompanhe rankings, performances e vencedores</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 bg-card border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge
                    className={`${
                      competition.status === 'active'
                        ? 'bg-green-500'
                        : competition.status === 'completed'
                        ? 'bg-purple-500'
                        : 'bg-yellow-500'
                    } text-white border-0`}
                  >
                    {competition.status === 'active'
                      ? 'Em Andamento'
                      : competition.status === 'completed'
                      ? 'Finalizada'
                      : 'Aguardando'}
                  </Badge>
                </div>
                <div className="text-3xl">
                  {competition.status === 'active' ? '🔴' : competition.status === 'completed' ? '🏆' : '⏳'}
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Participantes</p>
                  <p className="text-2xl font-bold text-foreground">{totalParticipants}</p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
            </Card>

            <Card className="p-4 bg-card border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Prize Pool</p>
                  <div className="flex items-center gap-1">
                    <span className="text-xl">◎</span>
                    <p className="text-2xl font-bold text-foreground">{competition.prizePool.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </Card>

            <Card className="p-4 bg-card border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Vencedores</p>
                  <p className="text-2xl font-bold text-foreground">{winners.length > 0 ? winners.length : '-'}</p>
                </div>
                <div className="text-3xl">🏅</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timer */}
            <CompetitionTimer
              startTime={competition.startTime}
              endTime={competition.endTime}
              status={competition.status}
            />

            {/* Rankings */}
            <LiveRankings teams={rankings} refreshInterval={30000} />

            {/* Winners (only show if competition is completed) */}
            {competition.status === 'completed' && winners.length > 0 && <Winners winners={winners} />}
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Token Performance for Top Team */}
            {rankings.length > 0 && rankings[0].tokens && (
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-1">Performance do Líder</h3>
                  <p className="text-sm text-gray-400">Time: {rankings[0].teamName}</p>
                </div>
                <TokenPerformance tokens={rankings[0].tokens} />
              </div>
            )}

            {/* Competition Info Card */}
            <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Informações da Competição</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">ID:</span>
                  <code className="text-xs text-purple-400 bg-gray-800 px-2 py-1 rounded">
                    {competition.id.slice(0, 8)}...
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Início:</span>
                  <span className="text-white">{new Date(competition.startTime).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Término:</span>
                  <span className="text-white">{new Date(competition.endTime).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Prêmios Distribuídos:</span>
                  <Badge className={competition.distributed ? 'bg-green-500' : 'bg-gray-500'}>
                    {competition.distributed ? 'Sim' : 'Não'}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Live Updates Info */}
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <h3 className="text-lg font-bold text-white">Atualizações ao Vivo</h3>
              </div>
              <p className="text-sm text-gray-400">
                Os dados são atualizados automaticamente a cada 30 segundos. Você pode desativar a atualização
                automática clicando no botão no canto superior direito.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

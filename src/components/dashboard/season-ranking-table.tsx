'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Trophy, TrendingUp, TrendingDown, Award } from 'lucide-react';

interface SeasonRankingTableProps {
  seasonId: string;
  currentUserId?: string;
}

interface RankingEntry {
  rank: number;
  userId: string;
  username: string;
  publicKey: string | null;
  name: string | null;
  completedPoints: number;
  activePoints: number;
  rawTotalPoints: number; // Pontos brutos (sem multiplicador)
  roundsPlayed: number;
  participationMultiplier: number;
  totalPoints: number; // Pontos finais (com multiplicador aplicado)
  estimatedPrize: number | null;
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

export function SeasonRankingTable({ seasonId, currentUserId }: SeasonRankingTableProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasonData, setSeasonData] = useState<SeasonData | null>(null);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);

  useEffect(() => {
    const fetchSeasonRanking = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = currentUserId
          ? `/api/season/ranking?seasonId=${seasonId}&userId=${currentUserId}`
          : `/api/season/ranking?seasonId=${seasonId}`;

        console.log('🔍 [SEASON-RANKING-TABLE] Buscando dados:', url);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Erro ao buscar ranking: ${response.statusText}`);
        }

        const data = await response.json();

        console.log('✅ [SEASON-RANKING-TABLE] Dados recebidos:', data);

        setSeasonData(data.season);
        setRankings(data.rankings);
      } catch (err) {
        console.error('❌ [SEASON-RANKING-TABLE] Erro:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchSeasonRanking();

    const interval = setInterval(() => {
      fetchSeasonRanking();
    }, 30000);

    return () => clearInterval(interval);
  }, [seasonId, currentUserId]);

  if (loading && rankings.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          Carregando ranking da temporada...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center text-destructive">
          Erro ao carregar ranking: {error}
        </div>
      </Card>
    );
  }

  if (!seasonData || rankings.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          Nenhum dado disponível para esta temporada
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              {seasonData.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {seasonData.completedRounds} de {seasonData.totalRounds} rodadas completadas
            </p>
            {seasonData.activeRound && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                {seasonData.activeRound.name} em andamento
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Prêmio Total</p>
            <p className="text-2xl font-bold text-yellow-500">
              {seasonData.prizePool.toFixed(4)} SOL
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Posição</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Jogador</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Rodadas</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Completados</th>
                {seasonData.activeRound && (
                  <th className="px-4 py-3 text-right text-sm font-medium">Ativa</th>
                )}
                <th className="px-4 py-3 text-center text-sm font-medium">Multiplicador</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Total Final</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Prêmio</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((entry) => {
                const isCurrentUser = entry.userId === currentUserId;
                const isTop3 = entry.rank <= 3;

                return (
                  <tr key={entry.userId} className={`border-b ${isCurrentUser ? 'bg-blue-500/10' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {entry.rank === 1 && <Trophy className="w-5 h-5 text-yellow-500" />}
                        {entry.rank === 2 && <Award className="w-5 h-5 text-gray-400" />}
                        {entry.rank === 3 && <Award className="w-5 h-5 text-orange-600" />}
                        <span className={isTop3 ? 'font-bold text-lg' : 'font-semibold'}>
                          {entry.rank}º
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`font-medium ${isCurrentUser ? 'text-blue-600' : ''}`}>
                        {entry.username || entry.name || 'Anônimo'}
                        {isCurrentUser && <span className="ml-2 text-xs">(Você)</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-mono">
                        {entry.roundsPlayed}/{seasonData.totalRounds}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {entry.completedPoints.toFixed(2)}
                    </td>
                    {seasonData.activeRound && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {entry.activePoints >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`font-mono text-sm ${entry.activePoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {entry.activePoints >= 0 ? '+' : ''}{entry.activePoints.toFixed(2)}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        entry.participationMultiplier >= 1.0
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : entry.participationMultiplier >= 0.5
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {entry.participationMultiplier.toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {entry.totalPoints.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {entry.estimatedPrize ? (
                        <span className="font-semibold text-yellow-600">
                          {entry.estimatedPrize.toFixed(4)} SOL
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {seasonData.activeRound && (
        <Card className="p-4 bg-muted/30">
          <p className="text-xs text-muted-foreground">
            <strong>Nota:</strong> A rodada ativa está sendo calculada em tempo real.
            Os pontos parciais são atualizados automaticamente a cada 30 segundos.
          </p>
        </Card>
      )}

      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            🎯 Como funciona o Multiplicador de Participação
          </p>
          <p className="text-xs text-blue-800 dark:text-blue-200">
            O <strong>Total Final</strong> é calculado multiplicando seus pontos brutos pela sua taxa de participação.
          </p>
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Fórmula:</strong> Total Final = Pontos Brutos × (Rodadas Jogadas ÷ Total de Rodadas)
          </p>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 font-bold">1.00x</span>
              <span className="text-blue-800 dark:text-blue-200">Jogou todas as rodadas</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 font-bold">0.50x</span>
              <span className="text-blue-800 dark:text-blue-200">Jogou metade das rodadas</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 font-bold">0.25x</span>
              <span className="text-blue-800 dark:text-blue-200">Jogou 1/4 das rodadas</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

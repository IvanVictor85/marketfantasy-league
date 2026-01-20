'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Award } from 'lucide-react';

interface RoundPoint {
  competitionId: string;
  competitionName: string;
  points: number;
  date: string;
  rank?: number;
}

interface PointsEvolutionChartProps {
  userId: string;
  leagueId?: string;
}

export function PointsEvolutionChart({ userId, leagueId }: PointsEvolutionChartProps) {
  const [roundPoints, setRoundPoints] = useState<RoundPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoundPoints = async () => {
      try {
        setLoading(true);

        // Buscar competições da liga
        if (!leagueId) {
          setLoading(false);
          return;
        }

        const compsResponse = await fetch(`/api/league/competitions?leagueId=${leagueId}`);
        if (!compsResponse.ok) {
          setLoading(false);
          return;
        }

        const compsData = await compsResponse.json();
        const competitions = compsData.competitions || [];

        // Buscar pontos para cada competição completada ou ativa
        const pointsPromises = competitions
          .filter((comp: any) => comp.status === 'COMPLETED' || comp.status === 'ACTIVE')
          .map(async (comp: any) => {
            const response = await fetch(`/api/teams?competitionId=${comp.id}`);
            if (response.ok) {
              const data = await response.json();
              const userTeam = data.teams?.find((t: any) => t.userId === userId);

              if (userTeam) {
                const points = userTeam.totalScore || userTeam.liveScore || userTeam.totalPoints || 0;
                console.log(`[PointsEvolution] ${comp.name}: ${points} pts (rank: ${userTeam.rank})`);

                return {
                  competitionId: comp.id,
                  competitionName: comp.name || 'Rodada',
                  points: points,
                  date: comp.endDate || comp.startDate,
                  rank: userTeam.rank
                };
              }
            }
            return null;
          });

        const points = (await Promise.all(pointsPromises))
          .filter(p => p !== null) as RoundPoint[];

        // Filtrar "Rodada Teste" e ordenar por data
        const filteredPoints = points
          .filter(p => !p.competitionName.toLowerCase().includes('teste'))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setRoundPoints(filteredPoints);
      } catch (error) {
        console.error('Erro ao buscar pontos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoundPoints();
  }, [userId, leagueId]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando evolução...</p>
      </div>
    );
  }

  if (roundPoints.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center">
        <div className="text-5xl mb-3">📊</div>
        <p className="text-muted-foreground">Nenhuma rodada completada ainda</p>
      </div>
    );
  }

  const maxPoints = Math.max(...roundPoints.map(r => r.points));
  const minPoints = Math.min(...roundPoints.map(r => r.points));
  const avgPoints = roundPoints.reduce((sum, r) => sum + r.points, 0) / roundPoints.length;

  // Calcular altura de cada barra (normalizado para 0-100%)
  const getBarHeight = (points: number) => {
    if (maxPoints === minPoints) return 50;
    return ((points - minPoints) / (maxPoints - minPoints)) * 80 + 10;
  };

  return (
    <div className="space-y-4">
      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-semibold">Máximo</span>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {maxPoints.toFixed(1)}
          </p>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
            <Award className="h-4 w-4" />
            <span className="text-sm font-semibold">Média</span>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {avgPoints.toFixed(1)}
          </p>
        </div>
        <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400">
            <TrendingDown className="h-4 w-4" />
            <span className="text-sm font-semibold">Mínimo</span>
          </div>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {minPoints.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Gráfico de Linha */}
      <div className="relative h-48 px-2 mb-8">
        {/* Container do gráfico */}
        <div className="h-full relative">
          {/* Linha da média */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-blue-300 dark:border-blue-700 pointer-events-none"
            style={{
              bottom: `${getBarHeight(avgPoints)}%`
            }}
          >
            <span className="absolute -top-6 right-2 text-xs text-blue-600 dark:text-blue-400 font-semibold">
              Média: {avgPoints.toFixed(1)}
            </span>
          </div>

          {/* SVG para desenhar a linha */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(168, 85, 247)" />
                <stop offset="100%" stopColor="rgb(139, 92, 246)" />
              </linearGradient>
            </defs>

            {/* Linha conectando os pontos */}
            <polyline
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              points={roundPoints.map((round, index) => {
                const x = ((index + 0.5) / roundPoints.length) * 100;
                const y = 100 - getBarHeight(round.points);
                return `${x},${y}`;
              }).join(' ')}
            />
          </svg>

          {/* Pontos do gráfico */}
          <div className="absolute inset-0 flex justify-around items-end">
            {roundPoints.map((round, index) => {
              const height = getBarHeight(round.points);
              const isAboveAvg = round.points > avgPoints;

              return (
                <div
                  key={round.competitionId}
                  className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative"
                  style={{ paddingBottom: `${height}%` }}
                >
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-20 left-1/2 transform -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none z-20 shadow-lg">
                    <div className="font-semibold">{round.competitionName}</div>
                    <div>{round.points.toFixed(2)} pts</div>
                    {round.rank && <div>#{round.rank}</div>}
                  </div>

                  {/* Ponto no gráfico */}
                  <div
                    className={`w-4 h-4 rounded-full border-3 border-white dark:border-gray-800 shadow-lg transition-all group-hover:scale-125 ${
                      isAboveAvg
                        ? 'bg-green-500'
                        : 'bg-orange-500'
                    }`}
                    title={`${round.competitionName}: ${round.points.toFixed(2)} pts`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Labels abaixo do gráfico */}
        <div className="flex justify-around gap-2 mt-2">
          {roundPoints.map((round, index) => (
            <div key={`label-${round.competitionId}`} className="flex-1 text-center">
              <div className="text-xs text-muted-foreground font-medium">
                R{index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="text-center pt-4 border-t">
        <p className="text-sm text-muted-foreground">Total Acumulado</p>
        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
          {roundPoints.reduce((sum, r) => sum + r.points, 0).toFixed(2)} pts
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {roundPoints.length} rodada{roundPoints.length > 1 ? 's' : ''} completada{roundPoints.length > 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

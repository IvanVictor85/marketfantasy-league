'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus, Trophy, Medal, Award } from 'lucide-react';

interface TeamRanking {
  position: number;
  teamName: string;
  userWallet: string;
  totalScore: number;
  previousPosition?: number;
}

interface LiveRankingsProps {
  teams: TeamRanking[];
  refreshInterval?: number;
}

export default function LiveRankings({ teams, refreshInterval = 30000 }: LiveRankingsProps) {
  const [sortedTeams, setSortedTeams] = useState<TeamRanking[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Simular animação de atualização
    setIsUpdating(true);
    const timer = setTimeout(() => {
      setSortedTeams(teams);
      setIsUpdating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [teams]);

  const getPositionChange = (current: number, previous?: number) => {
    if (!previous || previous === current) {
      return { icon: Minus, color: 'text-gray-400', text: '-' };
    }
    if (previous > current) {
      return { icon: TrendingUp, color: 'text-green-500', text: `+${previous - current}` };
    }
    return { icon: TrendingDown, color: 'text-red-500', text: `-${current - previous}` };
  };

  const getPositionBadge = (position: number) => {
    switch (position) {
      case 1:
        return {
          icon: Trophy,
          color: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
          textColor: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          label: '1º',
        };
      case 2:
        return {
          icon: Medal,
          color: 'bg-gradient-to-r from-gray-400 to-gray-500',
          textColor: 'text-gray-400',
          bgColor: 'bg-gray-400/10',
          borderColor: 'border-gray-400/30',
          label: '2º',
        };
      case 3:
        return {
          icon: Award,
          color: 'bg-gradient-to-r from-orange-600 to-orange-700',
          textColor: 'text-orange-600',
          bgColor: 'bg-orange-600/10',
          borderColor: 'border-orange-600/30',
          label: '3º',
        };
      default:
        return {
          icon: null,
          color: 'bg-gray-700',
          textColor: 'text-gray-300',
          bgColor: 'bg-gray-700/10',
          borderColor: 'border-gray-700/30',
          label: `${position}º`,
        };
    }
  };

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-30">
              <Trophy className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Rankings ao Vivo</h3>
              <p className="text-sm text-gray-400">Atualizado em tempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-xs text-gray-400">{isUpdating ? 'Atualizando...' : 'Atualizado'}</span>
          </div>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700 hover:bg-transparent">
              <TableHead className="text-gray-400 font-semibold">Posição</TableHead>
              <TableHead className="text-gray-400 font-semibold">Time</TableHead>
              <TableHead className="text-gray-400 font-semibold">Carteira</TableHead>
              <TableHead className="text-gray-400 font-semibold text-right">Pontuação</TableHead>
              <TableHead className="text-gray-400 font-semibold text-center">Variação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTeams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                  Nenhum time participando ainda
                </TableCell>
              </TableRow>
            ) : (
              sortedTeams.map((team, index) => {
                const positionConfig = getPositionBadge(team.position);
                const changeConfig = getPositionChange(team.position, team.previousPosition);
                const PositionIcon = positionConfig.icon;
                const ChangeIcon = changeConfig.icon;

                return (
                  <TableRow
                    key={team.userWallet}
                    className={`border-gray-700 transition-all duration-500 ${
                      isUpdating ? 'opacity-50' : 'opacity-100'
                    } ${
                      team.position <= 3
                        ? `${positionConfig.bgColor} border-l-4 ${positionConfig.borderColor}`
                        : 'hover:bg-gray-800/50'
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    {/* Posição */}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${positionConfig.color} text-white border-0 px-3 py-1 font-bold min-w-[48px] justify-center`}
                        >
                          {positionConfig.label}
                        </Badge>
                        {PositionIcon && <PositionIcon className={`w-5 h-5 ${positionConfig.textColor}`} />}
                      </div>
                    </TableCell>

                    {/* Nome do Time */}
                    <TableCell>
                      <div className="font-semibold text-white">{team.teamName}</div>
                    </TableCell>

                    {/* Carteira */}
                    <TableCell>
                      <code className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                        {formatWallet(team.userWallet)}
                      </code>
                    </TableCell>

                    {/* Pontuação */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                          {team.totalScore.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-400">pts</span>
                      </div>
                    </TableCell>

                    {/* Variação */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <ChangeIcon className={`w-4 h-4 ${changeConfig.color}`} />
                        <span className={`text-sm font-medium ${changeConfig.color}`}>{changeConfig.text}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer com total de participantes */}
      <div className="p-4 border-t border-gray-700 bg-gray-800/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Total de times:</span>
          <span className="text-white font-semibold">{sortedTeams.length} participantes</span>
        </div>
      </div>
    </Card>
  );
}

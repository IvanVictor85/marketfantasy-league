'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Trophy,
  Clock,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface Season {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  stats: {
    totalRounds: number;
    completedRounds: number;
    activeRounds: number;
    upcomingRounds: number;
  };
}

interface SeasonSelectorProps {
  leagueId: string;
  currentSeasonId?: string;
  onSelectSeason?: (seasonId: string) => void;
  className?: string;
}

export function SeasonSelector({
  leagueId,
  currentSeasonId,
  onSelectSeason,
  className
}: SeasonSelectorProps) {
  const t = useTranslations('seasons');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>(currentSeasonId);

  useEffect(() => {
    loadSeasons();
  }, [leagueId]);

  async function loadSeasons() {
    try {
      setLoading(true);
      const response = await fetch(`/api/seasons?leagueId=${leagueId}`);
      if (!response.ok) throw new Error('Failed to fetch seasons');

      const data = await response.json();
      const loadedSeasons = data.seasons.map((s: any) => ({
        ...s,
        startDate: new Date(s.startDate),
        endDate: new Date(s.endDate)
      }));

      setSeasons(loadedSeasons);

      // Auto-selecionar temporada ACTIVE ou mais recente
      if (!selectedSeasonId && loadedSeasons.length > 0) {
        const activeSeason = loadedSeasons.find((s: Season) => s.status === 'ACTIVE');
        const defaultSeason = activeSeason || loadedSeasons[0];
        setSelectedSeasonId(defaultSeason.id);
        onSelectSeason?.(defaultSeason.id);
      }
    } catch (error) {
      console.error('Error loading seasons:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSeasonChange(seasonId: string) {
    setSelectedSeasonId(seasonId);
    onSelectSeason?.(seasonId);
  }

  const currentSeason = seasons.find(s => s.id === selectedSeasonId);

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentSeason) {
    return null;
  }

  const isSeasonCompleted = currentSeason.status === 'COMPLETED';
  const isSeasonActive = currentSeason.status === 'ACTIVE';
  const isSeasonUpcoming = currentSeason.status === 'UPCOMING';

  return (
    <Card className={cn(
      "border-2 transition-all",
      isSeasonCompleted && "bg-gradient-to-r from-gray-500/10 to-gray-700/10 border-gray-500/30",
      isSeasonActive && "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30",
      isSeasonUpcoming && "bg-gradient-to-r from-orange-500/10 to-purple-500/10 border-orange-500/30",
      className
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Header com Seletor de Temporada */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Trophy className="w-5 h-5 text-orange-500" />
            <Select value={selectedSeasonId} onValueChange={handleSeasonChange}>
              <SelectTrigger className="w-full border-0 bg-transparent focus:ring-0 font-bold text-base p-0 h-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    <div className="flex items-center gap-2">
                      <span>{season.name}</span>
                      {season.status === 'ACTIVE' && (
                        <Badge variant="outline" className="text-[10px] bg-green-500/20 text-green-600 border-green-500/50">
                          {t('active')}
                        </Badge>
                      )}
                      {season.status === 'COMPLETED' && (
                        <Badge variant="outline" className="text-[10px] bg-gray-500/20 text-gray-500 border-gray-500/50">
                          {t('ended')}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Badge */}
          {isSeasonCompleted && (
            <Badge className="bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/50 font-bold">
              <CheckCircle className="w-3 h-3 mr-1" />
              {t('seasonEnded')}
            </Badge>
          )}
          {isSeasonActive && (
            <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50 font-bold">
              <Clock className="w-3 h-3 mr-1" />
              {t('seasonActive')}
            </Badge>
          )}
          {isSeasonUpcoming && (
            <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/50 font-bold">
              <Sparkles className="w-3 h-3 mr-1" />
              {t('seasonUpcoming')}
            </Badge>
          )}
        </div>

        {/* Informações da Temporada */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {currentSeason.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                {' - '}
                {currentSeason.endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {currentSeason.stats.completedRounds}/{currentSeason.stats.totalRounds} {t('roundsCompleted')}
              </span>
            </div>
          </div>
        </div>

        {/* Alerta de Temporada Encerrada */}
        {isSeasonCompleted && (
          <div className="flex items-start gap-2 p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('seasonEndedTitle')}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('seasonEndedMessage')}
              </p>
            </div>
          </div>
        )}

        {/* Alerta de Nova Temporada em Breve (quando não há ACTIVE) */}
        {isSeasonCompleted && !seasons.find(s => s.status === 'ACTIVE') && (
          <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                {t('newSeasonSoon')}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                {t('newSeasonMessage')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

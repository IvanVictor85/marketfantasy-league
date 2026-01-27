'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trophy, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

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

interface SeasonSelectorInlineProps {
  leagueId: string;
  currentSeasonId?: string;
  onSelectSeason?: (seasonId: string, status: 'ACTIVE' | 'COMPLETED' | 'UPCOMING') => void;
}

export function SeasonSelectorInline({
  leagueId,
  currentSeasonId,
  onSelectSeason,
}: SeasonSelectorInlineProps) {
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
        onSelectSeason?.(defaultSeason.id, defaultSeason.status);
      }
    } catch (error) {
      console.error('Error loading seasons:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSeasonChange(seasonId: string) {
    const season = seasons.find(s => s.id === seasonId);
    if (!season) return;
    
    setSelectedSeasonId(seasonId);
    onSelectSeason?.(seasonId, season.status);
  }

  function getStatusBadge(status: Season['status']) {
    if (status === 'ACTIVE') {
      return (
        <Badge variant="outline" className="text-[9px] bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50 ml-1.5">
          {t('active')}
        </Badge>
      );
    }
    if (status === 'COMPLETED') {
      return (
        <Badge variant="outline" className="text-[9px] bg-gray-500/20 text-gray-500 border-gray-500/50 ml-1.5">
          {t('ended')}
        </Badge>
      );
    }
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="text-xs">{t('title')}...</span>
      </div>
    );
  }

  if (seasons.length === 0) {
    return null;
  }

  const currentSeason = seasons.find(s => s.id === selectedSeasonId);

  return (
    <div className="flex items-center gap-2">
      <Trophy className="w-3.5 h-3.5 text-orange-500" />
      <Select value={selectedSeasonId} onValueChange={handleSeasonChange}>
        <SelectTrigger className="h-7 text-xs font-medium border-0 bg-transparent focus:ring-0 p-0 pr-4 gap-1 w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {seasons.map((season) => (
            <SelectItem key={season.id} value={season.id}>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium">{season.name}</span>
                {getStatusBadge(season.status)}
                <span className="text-[10px] text-muted-foreground">
                  ({season.stats.completedRounds}/{season.stats.totalRounds})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentSeason && getStatusBadge(currentSeason.status)}
    </div>
  );
}

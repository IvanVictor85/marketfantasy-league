'use client';

import { useEffect, useState } from 'react';

export interface Competition {
  id: string;
  leagueId: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'active' | 'completed';
  prizePool: number;
  distributed: boolean;
}

export interface TeamRanking {
  position: number;
  teamName: string;
  userWallet: string;
  totalScore: number;
  previousPosition?: number;
  tokens?: TokenData[];
}

export interface TokenData {
  symbol: string;
  name: string;
  logoUrl?: string;
  position: string;
  startPrice: number;
  currentPrice: number;
}

export interface Winner {
  position: number;
  teamName: string;
  userWallet: string;
  totalScore: number;
  prize: number;
}

export interface CompetitionStatusData {
  competition: Competition | null;
  rankings: TeamRanking[];
  winners: Winner[];
  totalParticipants: number;
  loading: boolean;
  error: string | null;
}

interface UseCompetitionStatusOptions {
  competitionId: string;
  refreshInterval?: number; // in milliseconds, default 30000 (30s)
  enabled?: boolean; // whether to auto-refresh, default true
}

export function useCompetitionStatus({
  competitionId,
  refreshInterval = 30000,
  enabled = true,
}: UseCompetitionStatusOptions): CompetitionStatusData {
  const [data, setData] = useState<CompetitionStatusData>({
    competition: null,
    rankings: [],
    winners: [],
    totalParticipants: 0,
    loading: true,
    error: null,
  });

  const fetchCompetitionStatus = async () => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/competition/status?id=${competitionId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch competition status: ${response.statusText}`);
      }

      const result = await response.json();

      setData({
        competition: result.competition ? {
          ...result.competition,
          startTime: new Date(result.competition.startTime),
          endTime: new Date(result.competition.endTime),
        } : null,
        rankings: result.rankings || [],
        winners: result.winners || [],
        totalParticipants: result.totalParticipants || 0,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching competition status:', err);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
      }));
    }
  };

  // Initial fetch
  useEffect(() => {
    if (!competitionId) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: 'Competition ID is required',
      }));
      return;
    }

    fetchCompetitionStatus();
  }, [competitionId]);

  // Auto-refresh with interval
  useEffect(() => {
    if (!enabled || !competitionId) return;

    const interval = setInterval(() => {
      fetchCompetitionStatus();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [competitionId, refreshInterval, enabled]);

  return data;
}

// Alternative hook for manual refresh control
export function useCompetitionStatusManual(competitionId: string) {
  const [data, setData] = useState<CompetitionStatusData>({
    competition: null,
    rankings: [],
    winners: [],
    totalParticipants: 0,
    loading: false,
    error: null,
  });

  const refresh = async () => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/competition/status?id=${competitionId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch competition status: ${response.statusText}`);
      }

      const result = await response.json();

      setData({
        competition: result.competition ? {
          ...result.competition,
          startTime: new Date(result.competition.startTime),
          endTime: new Date(result.competition.endTime),
        } : null,
        rankings: result.rankings || [],
        winners: result.winners || [],
        totalParticipants: result.totalParticipants || 0,
        loading: false,
        error: null,
      });

      return result;
    } catch (err) {
      console.error('Error fetching competition status:', err);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
      }));
      throw err;
    }
  };

  return { ...data, refresh };
}

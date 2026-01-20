'use client';

import { useEffect, useState } from 'react';

export interface Competition {
  id: string;
  competitionId?: string; // Alias para id (compatibilidade)
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
  refreshInterval?: number; // in milliseconds, default based on competition status
  enabled?: boolean; // whether to auto-refresh, default true
}

// Polling intervals optimized for CoinGecko rate limits
const POLL_INTERVAL_ACTIVE = 5 * 60 * 1000; // 5 minutos durante competição ativa
const POLL_INTERVAL_INACTIVE = 15 * 60 * 1000; // 15 minutos fora de competição
const POLL_INTERVAL_COMPLETED = 60 * 60 * 1000; // 60 minutos para competições finalizadas

export function useCompetitionStatus({
  competitionId,
  refreshInterval,
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

  // Calcular intervalo inteligente baseado no status da competição
  const getSmartInterval = (): number => {
    if (refreshInterval) return refreshInterval; // Use custom interval if provided

    if (!data.competition) return POLL_INTERVAL_INACTIVE;

    switch (data.competition.status) {
      case 'active':
        return POLL_INTERVAL_ACTIVE; // 5 min durante competição
      case 'completed':
        return POLL_INTERVAL_COMPLETED; // 60 min após finalizar
      case 'pending':
      default:
        return POLL_INTERVAL_INACTIVE; // 15 min antes de começar
    }
  };

  const fetchCompetitionStatus = async () => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/competition/status?id=${competitionId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch competition status: ${response.statusText}`);
      }

      const result = await response.json();

      console.log('🔍 [HOOK] useCompetitionStatus: Resposta da API:', {
        hasCompetitionId: !!result.competitionId,
        competitionId: result.competitionId,
        status: result.status
      });

      // ✅ CORREÇÃO: API retorna objeto flat, não nested
      const competitionObject = result.competitionId ? {
        id: result.competitionId,
        competitionId: result.competitionId, // Alias para compatibilidade
        leagueId: result.leagueId,
        startTime: new Date(result.startDate),
        endTime: new Date(result.endDate),
        status: result.status?.toLowerCase() || 'pending',
        prizePool: result.prizePool || 0,
        distributed: result.distributed || false,
      } : null;

      console.log('🔍 [HOOK] useCompetitionStatus: Objeto competition criado:', {
        hasCompetition: !!competitionObject,
        competitionId: competitionObject?.competitionId,
        id: competitionObject?.id
      });

      setData({
        competition: competitionObject,
        rankings: result.rankings || [],
        winners: result.winners || [],
        totalParticipants: result.participants || 0,
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
    // ✅ PERFORMANCE FIX: Respeitar flag 'enabled' no fetch inicial
    if (!enabled) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: null,
      }));
      return;
    }

    if (!competitionId) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: 'Competition ID is required',
      }));
      return;
    }

    fetchCompetitionStatus();
  }, [competitionId, enabled]);

  // Auto-refresh with smart interval
  useEffect(() => {
    if (!enabled || !competitionId) return;

    const smartInterval = getSmartInterval();

    console.log(`🔄 Polling competição ${competitionId}:`, {
      status: data.competition?.status || 'unknown',
      interval: `${smartInterval / 1000 / 60} minutos`,
      nextUpdate: new Date(Date.now() + smartInterval).toLocaleTimeString()
    });

    const interval = setInterval(() => {
      fetchCompetitionStatus();
    }, smartInterval);

    return () => clearInterval(interval);
  }, [competitionId, data.competition?.status, enabled]);

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

      console.log('🔍 [HOOK] useCompetitionStatus: Resposta da API:', {
        hasCompetitionId: !!result.competitionId,
        competitionId: result.competitionId,
        status: result.status
      });

      // ✅ CORREÇÃO: API retorna objeto flat, não nested
      const competitionObject = result.competitionId ? {
        id: result.competitionId,
        competitionId: result.competitionId, // Alias para compatibilidade
        leagueId: result.leagueId,
        startTime: new Date(result.startDate),
        endTime: new Date(result.endDate),
        status: result.status?.toLowerCase() || 'pending',
        prizePool: result.prizePool || 0,
        distributed: result.distributed || false,
      } : null;

      console.log('🔍 [HOOK] useCompetitionStatus: Objeto competition criado:', {
        hasCompetition: !!competitionObject,
        competitionId: competitionObject?.competitionId,
        id: competitionObject?.id
      });

      setData({
        competition: competitionObject,
        rankings: result.rankings || [],
        winners: result.winners || [],
        totalParticipants: result.participants || 0,
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

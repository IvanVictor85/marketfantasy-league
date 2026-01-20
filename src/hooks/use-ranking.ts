'use client';

import { useQuery } from '@tanstack/react-query';

interface Team {
  id: string;
  userId: string;
  teamName: string;
  totalScore: number | null;
  liveScore?: number; // Score calculado em tempo real para competições ACTIVE
  rank: number | null;
  tokens: string[];
  formation?: '433' | '442' | '352';
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface LeagueData {
  id: string;
  name: string;
  entryFee: number;
}

interface RankingResponse {
  teams: Team[];
  league: LeagueData | null;
}

/**
 * Busca dados de ranking (times e pontuações)
 */
const fetchRanking = async (
  leagueId: string | null,
  competitionId: string | null
): Promise<RankingResponse> => {
  if (!leagueId) {
    throw new Error('League ID is required');
  }

  // Usar competitionId se disponível, senão usar leagueId
  const queryParam = competitionId
    ? `competitionId=${competitionId}`
    : `leagueId=${leagueId}`;

  const response = await fetch(`/api/teams?${queryParam}`);

  if (!response.ok) {
    let errorMessage = `${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Se não conseguir parsear, usa mensagem padrão
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  return {
    teams: data.teams || [],
    league: data.league || null
  };
};

/**
 * Hook para buscar dados de ranking usando React Query
 *
 * Sincronizado com use-tokens:
 * - refetchInterval: 5 minutos (mesmo que tokens)
 * - staleTime: 4 minutos
 * - Atualiza em window focus e reconnect
 *
 * Isso garante que ranking e tokens atualizem juntos,
 * evitando chamadas duplicadas à API do CoinGecko.
 */
export function useRanking(
  leagueId: string | null,
  competitionId: string | null,
  enabled: boolean = true
) {
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['ranking', leagueId, competitionId],
    queryFn: () => fetchRanking(leagueId, competitionId),
    enabled: enabled && !!leagueId, // Só busca se enabled e leagueId existir
    refetchInterval: 5 * 60 * 1000,        // ✅ 5 minutos (sincronizado com tokens)
    staleTime: 4 * 60 * 1000,              // 4 minutos
    refetchOnWindowFocus: true,            // Atualiza quando janela ganha foco
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnReconnect: true,
  });

  return {
    teams: data?.teams || [],
    leagueData: data?.league || null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch
  };
}

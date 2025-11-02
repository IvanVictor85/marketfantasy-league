'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export interface TeamPlayer {
  id: string;
  position: number;
  name: string;
  token: string;
  symbol?: string; // NEW standardized field
  image: string;
  // NEW standardized field names
  currentPrice?: number;
  priceChange24h?: number;
  priceChange7d?: number;
  // OLD field names (for compatibility)
  price: number;
  points: number;
  rarity: string;
  change_24h: number;
  change_7d: number;
}

export interface TeamData {
  id: string;
  teamName: string;
  tokens: string[];
  players: TeamPlayer[];
  hasTeam: boolean;
  league: {
    id: string;
    name: string;
    entryFee: number;
  } | null;
}

export function useTeamData(leagueId?: string) {
  const { user, isAuthenticated } = useAuth();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setTeamData(null);
      return;
    }

    const fetchTeamData = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (leagueId) {
          params.append('leagueId', leagueId);
        }

        const response = await fetch(`/api/team?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
          }
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao buscar dados do time');
        }

        if (!data.hasTeam) {
          setTeamData({
            id: '',
            teamName: '',
            tokens: [],
            players: [],
            hasTeam: false,
            league: data.league || null,
          });
        } else {
          // Map tokenDetails to ensure both old and new field names are present
          const mappedPlayers = (data.tokenDetails || data.team.tokenDetails || []).map((token: any) => ({
            ...token,
            // Ensure new standardized field names
            symbol: token.symbol || token.token,
            currentPrice: token.currentPrice || token.price || 0,
            priceChange24h: token.priceChange24h || token.change_24h || 0,
            priceChange7d: token.priceChange7d || token.change_7d || 0,
            // Ensure old field names for backward compatibility
            token: token.token || token.symbol,
            price: token.price || token.currentPrice || 0,
            change_24h: token.change_24h || token.priceChange24h || 0,
            change_7d: token.change_7d || token.priceChange7d || 0,
          }));

          const teamDataObject = {
            id: data.team.id,
            teamName: data.team.name || data.team.teamName,
            tokens: data.team.tokens,
            players: mappedPlayers,
            hasTeam: true,
            league: data.league || null,
          };
          setTeamData(teamDataObject);
        }
      } catch (err) {
        console.error('Erro ao buscar dados do time:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [isAuthenticated, user, leagueId]);

  return { teamData, loading, error, refetch: () => {
    if (isAuthenticated && user) {
      // Re-trigger the effect
      setTeamData(null);
    }
  }};
}
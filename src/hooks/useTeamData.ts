'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export interface TeamPlayer {
  id: string;
  position: number;
  name: string;
  token: string;
  image: string;
  price: number;
  points: number;
  rarity: string;
  change_24h: number;
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
  const { publicKey } = useWallet();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setTeamData(null);
      return;
    }

    const fetchTeamData = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          userWallet: publicKey.toString(),
        });

        if (leagueId) {
          params.append('leagueId', leagueId);
        }

        const response = await fetch(`/api/team?${params}`);
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
          setTeamData({
            id: data.team.id,
            teamName: data.team.teamName,
            tokens: data.team.tokens,
            players: data.team.tokenDetails || [],
            hasTeam: true,
            league: data.league || null,
          });
        }
      } catch (err) {
        console.error('Erro ao buscar dados do time:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [publicKey, leagueId]);

  return { teamData, loading, error, refetch: () => {
    if (publicKey) {
      // Re-trigger the effect
      setTeamData(null);
    }
  }};
}
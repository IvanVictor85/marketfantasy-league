const fs = require('fs');
const path = require('path');

console.log('🔧 Reescrevendo useTeamData.ts...\n');

const useTeamDataPath = path.join(__dirname, '..', 'src/hooks/useTeamData.ts');

const newContent = `'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export interface TeamPlayer {
  id: string;
  position: number;
  name: string;
  symbol: string;
  image: string;
  currentPrice: number;
  priceChange24h: number;
  priceChange7d: number;
  marketCap: number;
  marketCapRank: number | null;
  points: number;
  rarity: string;
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

        const response = await fetch(\`/api/team?\${params}\`, {
          headers: {
            'Authorization': \`Bearer \${localStorage.getItem('auth-token')}\`
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
          const mappedPlayers = (data.tokenDetails || data.team.tokenDetails || []).map((token: any) => ({
            ...token,
            symbol: token.symbol || token.token,
            currentPrice: token.currentPrice || token.price || 0,
            priceChange24h: token.priceChange24h || token.change_24h || 0,
            priceChange7d: token.priceChange7d || token.change_7d || 0,
            marketCap: token.marketCap || token.market_cap || 0,
            marketCapRank: token.marketCapRank || token.market_cap_rank || null,
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
      setTeamData(null);
    }
  }};
}
`;

fs.writeFileSync(useTeamDataPath, newContent, 'utf8');

console.log('✅ useTeamData.ts reescrito com sucesso!');
console.log('\n✨ TeamPlayer agora tem os campos padronizados:');
console.log('   - symbol, image, currentPrice, priceChange24h, priceChange7d');
console.log('   - marketCap, marketCapRank, points, rarity');

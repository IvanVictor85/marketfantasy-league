// Tipos para o sistema de múltiplos times por liga

export interface Token {
  name: string;
  symbol: string;
  logoUrl: string;
  performance: number;
  id: string;
  price: number;
  image?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  change_24h?: number;
}

export interface Player {
  id: string;
  position: number; // 1-10 (1 = goalkeeper, 2-5 = defenders, 6-8 = midfielders, 9-10 = forwards)
  name: string;
  token: string;
  image?: string;
  price: number;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  change_24h?: number;
}

// Time específico para uma liga
export interface LeagueTeam {
  id: string;
  leagueId: string;
  userId: string;
  players: Player[];
  formation: '433' | '442' | '352';
  isMainTeam: boolean; // Flag para identificar se é o Time Principal
  createdAt: Date;
  updatedAt: Date;
}

// Time Principal do usuário (template padrão)
export interface MainTeam {
  id: string;
  userId: string;
  players: Player[];
  formation: '433' | '442' | '352';
  createdAt: Date;
  updatedAt: Date;
}

// Liga com informações básicas
export interface League {
  id: string;
  leagueName: string;
  description?: string;
  rank: number;
  totalParticipants: number;
  partialScore: number;
  lastRoundScore: number;
  entryFee?: number;
  prizePool?: number;
  startDate?: Date;
  endDate?: Date;
  status: 'upcoming' | 'active' | 'completed';
  creator?: string;
}

// Dados do usuário com múltiplos times
export interface UserData {
  id: string;
  teamName: string;
  userName: string;
  walletAddress?: string;
  mascot: {
    animal: string;
    shirt: string;
  };
  mainTeam?: MainTeam; // Time Principal
  leagueTeams: LeagueTeam[]; // Times específicos por liga
  leagues: League[]; // Ligas que o usuário participa
}

// Contexto para seleção de liga/time
export interface TeamContext {
  selectedLeague: League | null;
  selectedTeam: LeagueTeam | MainTeam | null;
  isMainTeam: boolean;
}

// Dados para exibição no Dashboard
export interface DashboardData {
  league: League;
  team: LeagueTeam | MainTeam;
  performance: {
    bestToken: Token;
    worstToken: Token;
    totalPerformance: number;
  };
  statistics: {
    rank: number;
    totalParticipants: number;
    partialScore: number;
    lastRoundScore: number;
  };
}

// Opções para o dropdown de seleção
export interface TeamSelectOption {
  value: string;
  label: string;
  type: 'main' | 'league';
  leagueId?: string;
  team: LeagueTeam | MainTeam;
}
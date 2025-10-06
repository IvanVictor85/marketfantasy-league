'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Coins, 
  Star,
  Calendar,
  Target,
  Award,
  Clock,
  ArrowRight,
  Crown,
  Shield,
  ExternalLink,
  Edit,
  Gift,
  HelpCircle,
  ShoppingCart
} from 'lucide-react';

// Importando os novos tipos
import { 
  UserData, 
  League, 
  Token, 
  LeagueTeam, 
  MainTeam, 
  TeamSelectOption, 
  DashboardData 
} from '@/types/teams';

// Interface para o mascote salvo
interface SavedMascot {
  id: string;
  imageUrl: string;
  character: string;
  uniformStyle: string;
  accessory?: string;
  createdAt: string;
}

// Mock Data
const mockUserData: UserData = {
  id: "user-1",
  teamName: "Sport Club Receba",
  userName: "Ivan Victor",
  mascot: {
    animal: "doge",
    colors: {
      primary: "#F59E0B",
      secondary: "#EAB308", 
      accent: "#FCD34D"
    },
    accessories: {
      hat: "none",
      glasses: "sunglasses",
      shoes: "cleats",
      extra: "none"
    },
    shirt: "solana",
    pose: "default",
    ball: true
  },
  mainTeam: {
    id: "main-team-1",
    userId: "user-1",
    formation: "433",
    createdAt: new Date(),
    updatedAt: new Date(),
    players: [
      { id: "sol", position: 1, name: "Solana", token: "SOL", image: "", price: 100, points: 85, rarity: "legendary", change_24h: 12.5 },
      { id: "btc", position: 2, name: "Bitcoin", token: "BTC", image: "", price: 45000, points: 92, rarity: "legendary", change_24h: 5.2 },
      { id: "eth", position: 3, name: "Ethereum", token: "ETH", image: "", price: 2500, points: 88, rarity: "epic", change_24h: 3.8 },
      { id: "ada", position: 4, name: "Cardano", token: "ADA", image: "", price: 0.5, points: 75, rarity: "rare", change_24h: 1.5 },
      { id: "dot", position: 5, name: "Polkadot", token: "DOT", image: "", price: 7, points: 78, rarity: "rare", change_24h: 2.7 },
      { id: "link", position: 6, name: "Chainlink", token: "LINK", image: "", price: 15, points: 82, rarity: "epic", change_24h: 4.3 },
      { id: "avax", position: 7, name: "Avalanche", token: "AVAX", image: "", price: 35, points: 80, rarity: "rare", change_24h: 6.1 },
      { id: "matic", position: 8, name: "Polygon", token: "MATIC", image: "", price: 1, points: 76, rarity: "common", change_24h: 3.2 },
      { id: "doge", position: 9, name: "Dogecoin", token: "DOGE", image: "", price: 0.08, points: 65, rarity: "common", change_24h: -4.2 },
      { id: "uni", position: 10, name: "Uniswap", token: "UNI", image: "", price: 6, points: 72, rarity: "rare", change_24h: 0.8 }
    ]
  },
  leagueTeams: [
    {
      id: "team-liga-1",
      leagueId: "liga-1",
      userId: "user-1",
      formation: "433",
      isMainTeam: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      players: [
        { id: "sol", position: 1, name: "Solana", token: "SOL", image: "", price: 100, points: 85, rarity: "legendary", change_24h: 12.5 },
        { id: "btc", position: 2, name: "Bitcoin", token: "BTC", image: "", price: 45000, points: 92, rarity: "legendary", change_24h: 5.2 },
        { id: "eth", position: 3, name: "Ethereum", token: "ETH", image: "", price: 2500, points: 88, rarity: "epic", change_24h: 3.8 },
        { id: "ada", position: 4, name: "Cardano", token: "ADA", image: "", price: 0.5, points: 75, rarity: "rare", change_24h: 1.5 },
        { id: "dot", position: 5, name: "Polkadot", token: "DOT", image: "", price: 7, points: 78, rarity: "rare", change_24h: 2.7 },
        { id: "link", position: 6, name: "Chainlink", token: "LINK", image: "", price: 15, points: 82, rarity: "epic", change_24h: 4.3 },
        { id: "avax", position: 7, name: "Avalanche", token: "AVAX", image: "", price: 35, points: 80, rarity: "rare", change_24h: 6.1 },
        { id: "matic", position: 8, name: "Polygon", token: "MATIC", image: "", price: 1, points: 76, rarity: "common", change_24h: 3.2 },
        { id: "doge", position: 9, name: "Dogecoin", token: "DOGE", image: "", price: 0.08, points: 65, rarity: "common", change_24h: -4.2 },
        { id: "uni", position: 10, name: "Uniswap", token: "UNI", image: "", price: 6, points: 72, rarity: "rare", change_24h: 0.8 }
      ]
    },
    {
      id: "team-liga-2",
      leagueId: "liga-2",
      userId: "user-1",
      formation: "442",
      isMainTeam: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      players: [
        { id: "btc", position: 1, name: "Bitcoin", token: "BTC", image: "", price: 45000, points: 92, rarity: "legendary", change_24h: 5.2 },
        { id: "eth", position: 2, name: "Ethereum", token: "ETH", image: "", price: 2500, points: 88, rarity: "epic", change_24h: 3.8 },
        { id: "bnb", position: 3, name: "Binance Coin", token: "BNB", image: "", price: 300, points: 85, rarity: "epic", change_24h: 7.1 },
        { id: "xrp", position: 4, name: "Ripple", token: "XRP", image: "", price: 0.6, points: 70, rarity: "common", change_24h: 2.3 },
        { id: "ada", position: 5, name: "Cardano", token: "ADA", image: "", price: 0.5, points: 75, rarity: "rare", change_24h: 1.5 },
        { id: "sol", position: 6, name: "Solana", token: "SOL", image: "", price: 100, points: 85, rarity: "legendary", change_24h: 12.5 },
        { id: "dot", position: 7, name: "Polkadot", token: "DOT", image: "", price: 7, points: 78, rarity: "rare", change_24h: 2.7 },
        { id: "doge", position: 8, name: "Dogecoin", token: "DOGE", image: "", price: 0.08, points: 65, rarity: "common", change_24h: -4.2 },
        { id: "avax", position: 9, name: "Avalanche", token: "AVAX", image: "", price: 35, points: 80, rarity: "rare", change_24h: 6.1 },
        { id: "shib", position: 10, name: "Shiba Inu", token: "SHIB", image: "", price: 0.00001, points: 60, rarity: "common", change_24h: -2.5 }
      ]
    }
  ],
  leagues: [
    {
      id: "liga-1",
      leagueName: "Liga Principal",
      rank: 128,
      totalParticipants: 1500,
      partialScore: 8.34,
      lastRoundScore: 2.10,
      status: "active"
    },
    {
      id: "liga-2",
      leagueName: "Liga dos Amigos",
      rank: 3,
      totalParticipants: 12,
      partialScore: 10.45,
      lastRoundScore: 3.20,
      status: "active"
    }
  ]
};

// Dashboard Sidebar Component
const DashboardSidebar = ({ userData, selectedTeamData, savedMascot }: { 
  userData: UserData, 
  selectedTeamData: { league: League | null, team: LeagueTeam | MainTeam | null, isMainTeam: boolean },
  savedMascot: SavedMascot | null
}) => {
  return (
    <div className="flex flex-col gap-4 w-full lg:w-64">
      {/* Card de Perfil */}
      <Card>
        <CardContent className="p-6 flex flex-col items-center">
          <div className="w-32 h-32 relative mb-4">
            {savedMascot ? (
              <Image 
                src={savedMascot.imageUrl} 
                alt="Seu Mascote da Sorte" 
                fill 
                className="object-contain rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎭</div>
                  <p className="text-xs text-gray-600">Sem mascote</p>
                </div>
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold text-center">{userData.teamName}</h3>
          <p className="text-sm text-muted-foreground mb-4">{userData.userName}</p>
          <Button variant="outline" className="w-full" size="sm" asChild>
            <Link href="/perfil" prefetch={false}>
              <Edit className="h-4 w-4 mr-2" />
              Ver/Editar Perfil
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Card de Estatísticas Rápidas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Estatísticas Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">RANK NA LIGA</p>
              <p className="text-2xl font-bold">
                {selectedTeamData.isMainTeam ? "Time Principal" : 
                 `${selectedTeamData.league?.rank || 0} / ${selectedTeamData.league?.totalParticipants || 0}`}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">VALORIZAÇÃO PARCIAL</p>
              <p className="text-2xl font-bold text-green-600">
                {selectedTeamData.isMainTeam ? "N/A" : `+${selectedTeamData.league?.partialScore?.toFixed(2) || 0}%`}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ÚLTIMA RODADA</p>
              <p className="text-xl font-bold">
                {selectedTeamData.isMainTeam ? "N/A" : `+${selectedTeamData.league?.lastRoundScore?.toFixed(2) || 0}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Navegação Rápida */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Navegação Rápida</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/ligas" prefetch={false}>
                <Trophy className="h-4 w-4 mr-2 text-[#F4A261]" />
                Minhas Ligas
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/market" prefetch={false}>
                <ShoppingCart className="h-4 w-4 mr-2 text-[#2A9D8F]" />
                Mercado de Tokens
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/help" prefetch={false}>
                <HelpCircle className="h-4 w-4 mr-2 text-[#F4A261]" />
                Entenda o Jogo
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Dashboard Content Component
const DashboardContent = ({ userData, selectedTeamData, onLeagueChange }: {
  userData: UserData,
  selectedTeamData: { league: League | null, team: LeagueTeam | MainTeam | null, isMainTeam: boolean },
  onLeagueChange: (leagueId: string) => void
}) => {
  // Encontrar o melhor e pior token do time
  const teamPlayers = selectedTeamData.team?.players || [];
  const bestToken = teamPlayers.length > 0 ? teamPlayers.reduce((best, current) => 
    (current.change_24h ?? 0) > (best.change_24h ?? 0) ? current : best
  ) : null;
  const worstToken = teamPlayers.length > 0 ? teamPlayers.reduce((worst, current) => 
    (current.change_24h ?? 0) < (worst.change_24h ?? 0) ? current : worst
  ) : null;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Seletor de Liga e Contagem Regressiva */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <h2 className="text-2xl font-bold">Meu Desempenho</h2>
        <div className="w-full md:w-auto">
          <Select 
            defaultValue={selectedTeamData.isMainTeam ? "main" : selectedTeamData.league?.id || ""}
            onValueChange={(value: string) => {
              if (value === "main") {
                onLeagueChange("main");
              } else {
                onLeagueChange(value);
              }
            }}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Selecione uma liga" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Time Principal</SelectItem>
              {userData.leagues.map((league) => (
                <SelectItem key={league.id} value={league.id}>
                  {league.leagueName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="bg-[#2A9D8F]/10 p-3 rounded-md flex items-center mb-2">
        <Clock className="h-5 w-5 mr-2 text-[#2A9D8F]" />
        <span className="font-medium">Próxima rodada em: <span className="font-bold">2d 15h 30m</span></span>
      </div>

      {/* Card de Gráfico de Desempenho */}
      <Card>
        <CardHeader>
          <CardTitle>{selectedTeamData.isMainTeam 
            ? "Evolução da Carteira - Time Principal" 
            : `Evolução da Carteira na Liga: ${selectedTeamData.league?.leagueName || 'N/A'}`}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 w-full bg-slate-100 flex items-center justify-center rounded-md">
            <p className="text-muted-foreground">Gráfico de desempenho virá aqui</p>
          </div>
        </CardContent>
      </Card>

      {/* Card "Meu Time na Rodada" (Destaques) */}
      <Card>
        <CardHeader>
          <CardTitle>Destaques do seu time em: {selectedTeamData.isMainTeam ? "Time Principal" : selectedTeamData.league?.leagueName || 'N/A'}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestToken && (
              <div className="bg-green-100 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  <h3 className="font-bold">Sua Gema da Rodada</h3>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 relative mr-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                      {bestToken.token.substring(0, 1)}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">{bestToken.name} ({bestToken.token})</p>
                    <p className="text-green-600 font-bold">+{(bestToken.change_24h ?? 0).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            )}
            {worstToken && (
              <div className="bg-red-100 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                  <h3 className="font-bold">Sua Âncora da Rodada</h3>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 relative mr-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                      {worstToken.token.substring(0, 1)}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">{worstToken.name} ({worstToken.token})</p>
                    <p className="text-red-600 font-bold">{(worstToken.change_24h ?? 0).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card "Composição do Time" */}
      <Card>
        <CardHeader>
          <CardTitle>Sua escalação para: {selectedTeamData.isMainTeam ? "Time Principal" : selectedTeamData.league?.leagueName || 'N/A'}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Símbolo</TableHead>
                <TableHead className="text-right">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamPlayers.map((player) => (
                <TableRow key={player.token}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>{player.token}</TableCell>
                  <TableCell className={`text-right font-medium ${(player.change_24h ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(player.change_24h ?? 0) >= 0 ? '+' : ''}{(player.change_24h ?? 0).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Card Social / Convide Amigos */}
      <Card className="bg-[#2A9D8F]/5">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-4">
          <div className="rounded-full bg-[#2A9D8F]/20 p-4">
            <Gift className="h-8 w-8 text-[#2A9D8F]" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">Melhor com Amigos!</h3>
            <p className="text-muted-foreground mb-4">O CryptoFantasy é mais divertido em grupo. Convide seus amigos para suas ligas privadas ou para competir na liga principal.</p>
            <Button className="bg-[#2A9D8F] hover:bg-[#2A9D8F]/90">
              Convidar Amigos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("main");
  const [savedMascot, setSavedMascot] = useState<SavedMascot | null>(null);

  // Carregar mascote salvo do localStorage
  useEffect(() => {
    if (user) {
      try {
        const key = `savedMascot_${user.id}`;
        const savedMascotData = localStorage.getItem(key);
        
        if (savedMascotData) {
          const mascot = JSON.parse(savedMascotData);
          setSavedMascot(mascot);
        } else {
          // Fallback: tentar carregar com chave do mockUserData para compatibilidade
          const fallbackKey = `savedMascot_${mockUserData.id}`;
          const fallbackData = localStorage.getItem(fallbackKey);
          if (fallbackData) {
            const mascot = JSON.parse(fallbackData);
            setSavedMascot(mascot);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar mascote salvo:', error);
      }
    } else {
      // Se não há usuário autenticado, tentar carregar com dados mock
      try {
        const key = `savedMascot_${mockUserData.id}`;
        const savedMascotData = localStorage.getItem(key);
        if (savedMascotData) {
          const mascot = JSON.parse(savedMascotData);
          setSavedMascot(mascot);
        } else {
          // Criar um mascote de exemplo para demonstração
          const exampleMascot = {
            id: 'example-mascot',
            imageUrl: '/mascots/Gemini_Generated_Image_c6qn3c6qn3c6qn3c.png',
            character: 'Doge Guerreiro',
            uniformStyle: 'classic-cfl',
            createdAt: new Date().toISOString()
          };
          localStorage.setItem(key, JSON.stringify(exampleMascot));
          setSavedMascot(exampleMascot);
        }
      } catch (error) {
        console.error('Erro ao carregar mascote mock:', error);
      }
    }
  }, [user]);

  const selectedTeamData = useMemo(() => {
    if (selectedTeamId === "main") {
      return {
        league: null,
        team: mockUserData.mainTeam || null,
        isMainTeam: true
      };
    }
    
    const league = mockUserData.leagues.find(l => l.id === selectedTeamId);
    const team = mockUserData.leagueTeams.find(t => t.leagueId === selectedTeamId);
    
    return {
      league: league || null,
      team: team || null,
      isMainTeam: false
    };
  }, [selectedTeamId]);

  return (
    <main className="container mx-auto py-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <DashboardSidebar 
          userData={mockUserData} 
          selectedTeamData={selectedTeamData} 
          savedMascot={savedMascot}
        />
        <DashboardContent 
          userData={mockUserData} 
          selectedTeamData={selectedTeamData} 
          onLeagueChange={setSelectedTeamId}
        />
      </div>
    </main>
  );
}
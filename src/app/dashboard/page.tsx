'use client';

import React, { useState } from 'react';
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

// Mock Data Types
interface Token {
  name: string;
  symbol: string;
  logoUrl: string;
  performance: number;
}

interface League {
  leagueName: string;
  rank: number;
  totalParticipants: number;
  partialScore: number;
  lastRoundScore: number;
  team: Token[];
}

interface UserData {
  teamName: string;
  userName: string;
  mascot: {
    animal: string;
    shirt: string;
  };
  leagues: League[];
}

// Mock Data
const mockUserData: UserData = {
  teamName: "Sport Club Receba",
  userName: "Ivan Victor",
  mascot: {
    animal: "doge",
    shirt: "solana"
  },
  leagues: [
    {
      leagueName: "Liga Principal",
      rank: 128,
      totalParticipants: 1500,
      partialScore: 8.34,
      lastRoundScore: 2.10,
      team: [
        { name: "Solana", symbol: "SOL", logoUrl: "", performance: 12.5 },
        { name: "Bitcoin", symbol: "BTC", logoUrl: "", performance: 5.2 },
        { name: "Ethereum", symbol: "ETH", logoUrl: "", performance: 3.8 },
        { name: "Cardano", symbol: "ADA", logoUrl: "", performance: 1.5 },
        { name: "Polkadot", symbol: "DOT", logoUrl: "", performance: 2.7 },
        { name: "Chainlink", symbol: "LINK", logoUrl: "", performance: 4.3 },
        { name: "Avalanche", symbol: "AVAX", logoUrl: "", performance: 6.1 },
        { name: "Polygon", symbol: "MATIC", logoUrl: "", performance: 3.2 },
        { name: "Dogecoin", symbol: "DOGE", logoUrl: "", performance: -4.2 },
        { name: "Uniswap", symbol: "UNI", logoUrl: "", performance: 0.8 }
      ]
    },
    {
      leagueName: "Liga dos Amigos",
      rank: 3,
      totalParticipants: 12,
      partialScore: 10.45,
      lastRoundScore: 3.20,
      team: [
        { name: "Bitcoin", symbol: "BTC", logoUrl: "", performance: 5.2 },
        { name: "Ethereum", symbol: "ETH", logoUrl: "", performance: 3.8 },
        { name: "Binance Coin", symbol: "BNB", logoUrl: "", performance: 7.1 },
        { name: "Ripple", symbol: "XRP", logoUrl: "", performance: 2.3 },
        { name: "Cardano", symbol: "ADA", logoUrl: "", performance: 1.5 },
        { name: "Solana", symbol: "SOL", logoUrl: "", performance: 12.5 },
        { name: "Polkadot", symbol: "DOT", logoUrl: "", performance: 2.7 },
        { name: "Dogecoin", symbol: "DOGE", logoUrl: "", performance: -4.2 },
        { name: "Avalanche", symbol: "AVAX", logoUrl: "", performance: 6.1 },
        { name: "Shiba Inu", symbol: "SHIB", logoUrl: "", performance: -2.5 }
      ]
    }
  ]
};

// Dashboard Sidebar Component
const DashboardSidebar = ({ userData, selectedLeague }: { userData: UserData, selectedLeague: League }) => {
  return (
    <div className="flex flex-col gap-4 w-full lg:w-64">
      {/* Card de Perfil */}
      <Card>
        <CardContent className="p-6 flex flex-col items-center">
          <div className="w-32 h-32 relative mb-4">
            <Image 
              src={`/mascots/Gemini_Generated_Image_frnm54frnm54frnm.png`} 
              alt="Mascote do time" 
              fill 
              className="object-contain"
            />
          </div>
          <h3 className="text-xl font-bold text-center">{userData.teamName}</h3>
          <p className="text-sm text-muted-foreground mb-4">{userData.userName}</p>
          <Button variant="outline" className="w-full" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Ver/Editar Perfil
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
              <p className="text-2xl font-bold">{selectedLeague.rank} / {selectedLeague.totalParticipants}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">VALORIZAÇÃO PARCIAL</p>
              <p className="text-2xl font-bold text-green-600">+{selectedLeague.partialScore.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ÚLTIMA RODADA</p>
              <p className="text-2xl font-bold text-green-600">+{selectedLeague.lastRoundScore.toFixed(2)}%</p>
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
              <Link href="/ligas">
                <Trophy className="h-4 w-4 mr-2 text-[#F4A261]" />
                Minhas Ligas
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/market">
                <ShoppingCart className="h-4 w-4 mr-2 text-[#2A9D8F]" />
                Mercado de Tokens
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/help">
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
const DashboardContent = ({ userData, selectedLeague, onLeagueChange }: { 
  userData: UserData, 
  selectedLeague: League,
  onLeagueChange: (league: League) => void
}) => {
  // Encontrar o melhor e pior token do time
  const bestToken = [...selectedLeague.team].sort((a, b) => b.performance - a.performance)[0];
  const worstToken = [...selectedLeague.team].sort((a, b) => a.performance - b.performance)[0];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Seletor de Liga e Contagem Regressiva */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <h2 className="text-2xl font-bold">Meu Desempenho</h2>
        <div className="w-full md:w-auto">
          <Select 
            defaultValue={selectedLeague.leagueName}
            onValueChange={(value: string) => {
              const league = userData.leagues.find(l => l.leagueName === value);
              if (league) onLeagueChange(league);
            }}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Selecione uma liga" />
            </SelectTrigger>
            <SelectContent>
              {userData.leagues.map((league) => (
                <SelectItem key={league.leagueName} value={league.leagueName}>
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
          <CardTitle>Evolução da Carteira na Liga: {selectedLeague.leagueName}</CardTitle>
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
          <CardTitle>Destaques do seu time em: {selectedLeague.leagueName}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-100 p-4 rounded-md">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                <h3 className="font-bold">Sua Gema da Rodada</h3>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 relative mr-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                    {bestToken.symbol.substring(0, 1)}
                  </div>
                </div>
                <div>
                  <p className="font-medium">{bestToken.name} (${bestToken.symbol})</p>
                  <p className="text-green-600 font-bold">+{bestToken.performance.toFixed(1)}%</p>
                </div>
              </div>
            </div>
            <div className="bg-red-100 p-4 rounded-md">
              <div className="flex items-center mb-2">
                <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                <h3 className="font-bold">Sua Âncora da Rodada</h3>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 relative mr-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                    {worstToken.symbol.substring(0, 1)}
                  </div>
                </div>
                <div>
                  <p className="font-medium">{worstToken.name} (${worstToken.symbol})</p>
                  <p className="text-red-600 font-bold">{worstToken.performance.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card "Composição do Time" */}
      <Card>
        <CardHeader>
          <CardTitle>Sua escalação para: {selectedLeague.leagueName}</CardTitle>
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
              {selectedLeague.team.map((token) => (
                <TableRow key={token.symbol}>
                  <TableCell className="font-medium">{token.name}</TableCell>
                  <TableCell>${token.symbol}</TableCell>
                  <TableCell className={`text-right font-medium ${token.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {token.performance >= 0 ? '+' : ''}{token.performance.toFixed(1)}%
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
  const [selectedLeague, setSelectedLeague] = useState(mockUserData.leagues[0]);

  return (
    <main className="container mx-auto py-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <DashboardSidebar userData={mockUserData} selectedLeague={selectedLeague} />
        <DashboardContent 
          userData={mockUserData} 
          selectedLeague={selectedLeague} 
          onLeagueChange={setSelectedLeague}
        />
      </div>
    </main>
  );
}
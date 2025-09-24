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
import { Navbar } from '@/components/layout/navbar';
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
  ExternalLink
} from 'lucide-react';

// Mock Data Types
interface League {
  id: string;
  name: string;
  status: 'active' | 'finished' | 'market_closed';
  participants: number;
  prizePool: number;
  timeRemaining?: string;
}

interface UserTeam {
  id: string;
  name: string;
  mascotUrl: string;
  emblemUrl: string;
  heartToken: string;
  currentScore: number;
  ranking: number;
  totalParticipants: number;
}

interface TokenPerformance {
  id: string;
  name: string;
  symbol: string;
  logoUrl: string;
  currentPrice: number;
  change24h: number;
  changeFromStart: number;
  pointsContribution: number;
}

interface LeagueRanking {
  position: number;
  teamName: string;
  mascotUrl: string;
  score: number;
  isCurrentUser?: boolean;
}

// Mock Data
const mockLeagues: League[] = [
  {
    id: '1',
    name: 'Liga Premier Crypto',
    status: 'active',
    participants: 123,
    prizePool: 50.5,
    timeRemaining: '5 dias 12 horas'
  },
  {
    id: '2',
    name: 'DeFi Champions',
    status: 'market_closed',
    participants: 89,
    prizePool: 25.0,
    timeRemaining: '2 dias 8 horas'
  },
  {
    id: '3',
    name: 'Altcoin Masters',
    status: 'finished',
    participants: 156,
    prizePool: 75.2
  }
];

const mockUserTeam: UserTeam = {
  id: '1',
  name: 'Crypto Bulls FC',
  mascotUrl: '/mascots/bitcoin-viking.png',
  emblemUrl: '/mascots/solana-gaming-cat.png',
  heartToken: 'SOL',
  currentScore: 15.47,
  ranking: 5,
  totalParticipants: 123
};

const mockTokens: TokenPerformance[] = [
  {
    id: '1',
    name: 'Bitcoin',
    symbol: 'BTC',
    logoUrl: '/mascots/bitcoin-viking.png',
    currentPrice: 112717,
    change24h: -2.27,
    changeFromStart: 5.12,
    pointsContribution: 1.05
  },
  {
    id: '2',
    name: 'Ethereum',
    symbol: 'ETH',
    logoUrl: '/mascots/ethereum-crystal-dog.png',
    currentPrice: 4156,
    change24h: 3.45,
    changeFromStart: 8.23,
    pointsContribution: 2.15
  },
  {
    id: '3',
    name: 'Solana',
    symbol: 'SOL',
    logoUrl: '/mascots/solana-gaming-cat.png',
    currentPrice: 245,
    change24h: 7.82,
    changeFromStart: 12.45,
    pointsContribution: 3.22
  },
  {
    id: '4',
    name: 'Cardano',
    symbol: 'ADA',
    logoUrl: '/mascots/cardano-space-dog.png',
    currentPrice: 1.23,
    change24h: -1.56,
    changeFromStart: -2.34,
    pointsContribution: -0.45
  },
  {
    id: '5',
    name: 'Polygon',
    symbol: 'MATIC',
    logoUrl: '/mascots/polygon-cyber-fox.png',
    currentPrice: 0.89,
    change24h: 4.67,
    changeFromStart: 6.78,
    pointsContribution: 1.89
  },
  {
    id: '6',
    name: 'Chainlink',
    symbol: 'LINK',
    logoUrl: '/mascots/chainlink-oracle-owl.png',
    currentPrice: 23.45,
    change24h: 2.34,
    changeFromStart: 4.56,
    pointsContribution: 1.23
  },
  {
    id: '7',
    name: 'Avalanche',
    symbol: 'AVAX',
    logoUrl: '/mascots/avalanche-snow-wolf.png',
    currentPrice: 45.67,
    change24h: -3.21,
    changeFromStart: -1.23,
    pointsContribution: -0.67
  },
  {
    id: '8',
    name: 'Polkadot',
    symbol: 'DOT',
    logoUrl: '/mascots/polkadot-quantum-cat.png',
    currentPrice: 8.91,
    change24h: 1.78,
    changeFromStart: 3.45,
    pointsContribution: 0.89
  },
  {
    id: '9',
    name: 'Uniswap',
    symbol: 'UNI',
    logoUrl: '/mascots/uniswap-rainbow-unicorn.png',
    currentPrice: 12.34,
    change24h: 5.67,
    changeFromStart: 7.89,
    pointsContribution: 2.34
  },
  {
    id: '10',
    name: 'Litecoin',
    symbol: 'LTC',
    logoUrl: '/mascots/litecoin-silver-eagle.png',
    currentPrice: 156.78,
    change24h: -0.89,
    changeFromStart: 2.34,
    pointsContribution: 0.56
  }
];

const mockRanking: LeagueRanking[] = [
  { position: 3, teamName: 'DeFi Warriors', mascotUrl: '/mascots/ethereum-crystal-dog.png', score: 18.92 },
  { position: 4, teamName: 'Moon Shooters', mascotUrl: '/mascots/bitcoin-viking.png', score: 17.34 },
  { position: 5, teamName: 'Crypto Bulls FC', mascotUrl: '/mascots/bitcoin-viking.png', score: 15.47, isCurrentUser: true },
  { position: 6, teamName: 'Altcoin Hunters', mascotUrl: '/mascots/solana-gaming-cat.png', score: 14.23 },
  { position: 7, teamName: 'Blockchain Legends', mascotUrl: '/mascots/cardano-space-dog.png', score: 13.56 }
];

export default function DashboardPage() {
  const [selectedLeague, setSelectedLeague] = useState<string>('1');
  
  const currentLeague = mockLeagues.find(league => league.id === selectedLeague) || mockLeagues[0];

  const getStatusColor = (status: League['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'market_closed': return 'bg-yellow-100 text-yellow-800';
      case 'finished': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: League['status']) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'market_closed': return 'Mercado Fechado';
      case 'finished': return 'Finalizada';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* 1. Header da Página e Seleção de Liga */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard da Liga</h1>
              <p className="text-gray-600">Acompanhe o desempenho do seu time e ranking</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Liga Selecionada</label>
                <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Selecione uma liga" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockLeagues.map((league) => (
                      <SelectItem key={league.id} value={league.id}>
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          {league.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Coluna Principal (3/4) */}
          <div className="lg:col-span-3 space-y-8">
            {/* 2. Card Principal: Visão Geral do Time */}
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Trophy className="w-6 h-6 text-blue-600" />
                  Visão Geral do Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Informações do Time */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{mockUserTeam.name}</h3>
                      
                      {/* Mascote e Escudo */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                          <Avatar className="w-20 h-20 border-4 border-blue-300">
                            <AvatarImage src={mockUserTeam.mascotUrl} alt="Mascote do time" />
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-bold">
                              {mockUserTeam.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-2 -right-2">
                            <Avatar className="w-8 h-8 border-2 border-white">
                              <AvatarImage src={mockUserTeam.emblemUrl} alt="Escudo" />
                              <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                                <Shield className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">Token de Coração</p>
                          <Badge variant="outline" className="text-lg font-bold">
                            <Coins className="w-4 h-4 mr-1" />
                            {mockUserTeam.heartToken}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pontuação e Ranking */}
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-white rounded-lg border-2 border-green-200">
                      <p className="text-sm text-gray-600 mb-2">Pontuação Atual</p>
                      <p className="text-4xl font-bold text-green-600 mb-2">+{mockUserTeam.currentScore}%</p>
                      <div className="flex items-center justify-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-green-600">Em alta</span>
                      </div>
                    </div>
                    
                    <div className="text-center p-6 bg-white rounded-lg border-2 border-blue-200">
                      <p className="text-sm text-gray-600 mb-2">Ranking na Liga</p>
                      <p className="text-3xl font-bold text-blue-600 mb-2">
                        #{mockUserTeam.ranking}
                      </p>
                      <p className="text-sm text-gray-500">
                        de {mockUserTeam.totalParticipants} participantes
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <Link href="/teams">
                    <Button className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Users className="w-4 h-4 mr-2" />
                      Ver Minha Escalação Completa
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 3. Seção Secundária: Desempenho dos Tokens do Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Desempenho dos Tokens do Time
                </CardTitle>
                <CardDescription>
                  Acompanhe como cada token está contribuindo para sua pontuação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Token</TableHead>
                        <TableHead>Preço Atual</TableHead>
                        <TableHead>24h</TableHead>
                        <TableHead>Desde Início</TableHead>
                        <TableHead>Contribuição</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockTokens.map((token) => (
                        <TableRow key={token.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={token.logoUrl} alt={token.name} />
                                <AvatarFallback className="text-xs">
                                  {token.symbol.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{token.name}</p>
                                <p className="text-sm text-gray-500">{token.symbol}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            ${token.currentPrice.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-1 ${
                              token.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {token.change24h >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-1 ${
                              token.changeFromStart >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {token.changeFromStart >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              {token.changeFromStart >= 0 ? '+' : ''}{token.changeFromStart}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`font-bold ${
                              token.pointsContribution >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {token.pointsContribution >= 0 ? '+' : ''}{token.pointsContribution} pts
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Lateral (1/4) */}
          <div className="space-y-6">
            {/* 4. Seção Terciária: Ranking da Liga */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Ranking da Liga
                </CardTitle>
                <CardDescription>
                  Sua posição e competidores próximos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockRanking.map((entry) => (
                    <div
                      key={entry.position}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        entry.isCurrentUser 
                          ? 'bg-blue-50 border-2 border-blue-200' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        entry.position <= 3 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {entry.position <= 3 && <Crown className="w-4 h-4" />}
                        {entry.position > 3 && entry.position}
                      </div>
                      
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={entry.mascotUrl} alt={entry.teamName} />
                        <AvatarFallback className="text-xs">
                          {entry.teamName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          entry.isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {entry.teamName}
                        </p>
                        <p className="text-xs text-gray-500">+{entry.score}%</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <Link href={`/leagues/${selectedLeague}/ranking`}>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver Ranking Completo
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 5. Seção Quaternária: Status da Liga e Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Status da Liga
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Status Atual</p>
                  <Badge className={getStatusColor(currentLeague.status)}>
                    {getStatusText(currentLeague.status)}
                  </Badge>
                </div>
                
                {currentLeague.timeRemaining && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Tempo Restante</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="font-medium">{currentLeague.timeRemaining}</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">Prêmio Acumulado</p>
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-green-500" />
                    <span className="font-bold text-lg">{currentLeague.prizePool} USDC</span>
                  </div>
                </div>
                
                <div className="space-y-2 pt-4 border-t">
                  {currentLeague.status === 'active' && (
                    <Link href="/market">
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <Target className="w-4 h-4 mr-2" />
                        Ir para o Mercado
                      </Button>
                    </Link>
                  )}
                  
                  <Link href="/leagues/create">
                    <Button variant="outline" className="w-full">
                      <Trophy className="w-4 h-4 mr-2" />
                      Criar Nova Liga
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
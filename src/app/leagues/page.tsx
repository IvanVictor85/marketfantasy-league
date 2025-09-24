'use client';

import React, { useState, useEffect } from 'react';
// import { useWallet } from '@solana/wallet-adapter-react'; // Temporariamente removido
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Navbar } from '@/components/layout/navbar';
import { CartolaCard, LeagueCard } from '@/components/cartola-card';
import { Plus, Users, Trophy, Clock, Coins, Crown, TrendingDown } from 'lucide-react';

interface League {
  id: string;
  name: string;
  description: string;
  entryFee: number;
  maxParticipants: number;
  currentParticipants: number;
  prizePool: number;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed';
  creator: string;
}

const mockLeagues: League[] = [
  {
    id: '1',
    name: 'Liga Nacional Crypto',
    description: 'A liga principal para traders experientes',
    entryFee: 0.1,
    maxParticipants: 100,
    currentParticipants: 67,
    prizePool: 6.7,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-28'),
    status: 'active',
    creator: 'CryptoMaster'
  },
  {
    id: '2',
    name: 'Copa dos Novatos',
    description: 'Perfeita para iniciantes aprenderem e competirem',
    entryFee: 0.01,
    maxParticipants: 50,
    currentParticipants: 23,
    prizePool: 0.23,
    startDate: new Date('2024-02-15'),
    endDate: new Date('2024-03-15'),
    status: 'upcoming',
    creator: 'NewbieFriend'
  },
  {
    id: '3',
    name: 'DeFi Champions',
    description: 'Foco em tokens e protocolos DeFi',
    entryFee: 0.25,
    maxParticipants: 30,
    currentParticipants: 30,
    prizePool: 7.5,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    status: 'completed',
    creator: 'DeFiExpert'
  },
  {
    id: '4',
    name: 'Arena das Altcoins',
    description: 'Descubra joias escondidas no espaço das altcoins',
    entryFee: 0.05,
    maxParticipants: 75,
    currentParticipants: 12,
    prizePool: 0.6,
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-03-31'),
    status: 'upcoming',
    creator: 'AltcoinHunter'
  }
];

// Mock data for league highlights
const mockHighlights = {
  leader: {
    id: '1',
    teamName: 'Crypto Bulls FC',
    userName: 'CryptoKing',
    points: 127.5,
    avatar: '/avatars/crypto-king.svg'
  },
  viceLeader: {
    id: '2',
    teamName: 'DeFi Warriors',
    userName: 'BlockchainPro',
    points: 124.8,
    avatar: '/avatars/blockchain-pro.svg'
  },
  lanterna: {
    id: '3',
    teamName: 'Rookie Traders',
    userName: 'NewTrader',
    points: 45.2,
    avatar: '/avatars/new-trader.svg'
  }
};

export default function LeaguesPage() {
  const connected = false; // Temporariamente desabilitado
  const publicKey = null; // Temporariamente desabilitado
  const [leagues, setLeagues] = useState<League[]>(mockLeagues);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all');

  const filteredLeagues = leagues.filter(league => 
    filter === 'all' || league.status === filter
  );

  const getStatusColor = (status: League['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleJoinLeague = async (leagueId: string) => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    // TODO: Implement actual Solana transaction
    console.log('Joining league:', leagueId);
    alert('League join functionality will be implemented with smart contract integration');
  };

  const handleCreateLeague = () => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    // TODO: Implement create league modal/form
    alert('Create league functionality will be implemented');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header da Página */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Ligas Disponíveis</h1>
              <p className="text-gray-600">Participe de ligas e compete com outros traders</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button onClick={handleCreateLeague} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Criar Liga
              </Button>
            </div>
          </div>
        </div>

        {/* Main League Banner */}
        <div className="relative mb-8">
          <CartolaCard className="bg-gradient-to-r from-primary/90 to-orange-600 text-white p-8 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%" viewBox="0 0 100 100" className="h-full w-full">
                <defs>
                  <pattern id="stripes" patternUnits="userSpaceOnUse" width="10" height="10">
                    <rect width="5" height="10" fill="white" opacity="0.1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#stripes)"/>
              </svg>
            </div>
            
            {/* Trophy Icon */}
            <div className="absolute right-8 top-1/2 transform -translate-y-1/2 opacity-20">
              <Trophy className="w-32 h-32" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mr-4">
                  <Trophy className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">LIGA NACIONAL</h1>
                  <p className="text-orange-100">A liga principal do Fantasy Crypto</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{mockLeagues[0].currentParticipants} participantes</span>
                </div>
                <div className="flex items-center">
                  <Trophy className="w-4 h-4 mr-2" />
                  <span>{mockLeagues[0].prizePool} SOL em prêmios</span>
                </div>
              </div>
            </div>
          </CartolaCard>
        </div>

        {/* Highlights Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Destaques da Rodada Anterior</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Leader */}
            <CartolaCard className="text-center p-6 border-2 border-yellow-400 bg-gradient-to-b from-yellow-50 to-white">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={mockHighlights.leader.avatar} />
                    <AvatarFallback className="bg-yellow-400 text-yellow-800">
                      {mockHighlights.leader.userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Crown className="w-4 h-4 text-yellow-800" />
                  </div>
                </div>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Líder da Rodada</h3>
              <p className="text-sm text-gray-600 mb-2">{mockHighlights.leader.teamName}</p>
              <p className="text-xs text-gray-500 mb-3">{mockHighlights.leader.userName}</p>
              <div className="text-2xl font-bold text-yellow-600">{mockHighlights.leader.points} pts</div>
            </CartolaCard>

            {/* Vice Leader */}
            <CartolaCard className="text-center p-6 border-2 border-gray-300 bg-gradient-to-b from-gray-50 to-white">
              <div className="flex justify-center mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={mockHighlights.viceLeader.avatar} />
                  <AvatarFallback className="bg-gray-300 text-gray-700">
                    {mockHighlights.viceLeader.userName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Vice-Líder</h3>
              <p className="text-sm text-gray-600 mb-2">{mockHighlights.viceLeader.teamName}</p>
              <p className="text-xs text-gray-500 mb-3">{mockHighlights.viceLeader.userName}</p>
              <div className="text-2xl font-bold text-gray-600">{mockHighlights.viceLeader.points} pts</div>
            </CartolaCard>

            {/* Lanterna */}
            <CartolaCard className="text-center p-6 border-2 border-red-300 bg-gradient-to-b from-red-50 to-white">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={mockHighlights.lanterna.avatar} />
                    <AvatarFallback className="bg-red-300 text-red-700">
                      {mockHighlights.lanterna.userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-400 rounded-full flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-red-800" />
                  </div>
                </div>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">Lanterna</h3>
              <p className="text-sm text-gray-600 mb-2">{mockHighlights.lanterna.teamName}</p>
              <p className="text-xs text-gray-500 mb-3">{mockHighlights.lanterna.userName}</p>
              <div className="text-2xl font-bold text-red-600">{mockHighlights.lanterna.points} pts</div>
            </CartolaCard>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          {(['all', 'upcoming', 'active', 'completed'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className={`capitalize ${filter === status ? 'bg-primary hover:bg-primary/90' : ''}`}
            >
              {status === 'all' ? 'Todas' : 
               status === 'upcoming' ? 'Próximas' :
               status === 'active' ? 'Ativas' : 'Finalizadas'}
            </Button>
          ))}
          
          <Button 
            onClick={handleCreateLeague}
            className="ml-auto bg-primary hover:bg-primary/90"
            disabled={!connected}
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Liga
          </Button>
        </div>

        {/* Leagues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeagues.map((league) => (
            <LeagueCard
              key={league.id}
              leagueName={league.name}
              description={league.description}
              participants={league.currentParticipants}
              status={league.status === 'upcoming' ? 'open' : league.status === 'active' ? 'closed' : 'finished'}
              prize={`${league.prizePool} SOL`}
            />
          ))}
        </div>

        {filteredLeagues.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Nenhuma liga encontrada para o filtro selecionado</div>
          </div>
        )}
      </div>
    </div>
  );
}
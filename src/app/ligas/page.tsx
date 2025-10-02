'use client';

import React from 'react';
import { Navbar } from '@/components/layout/navbar';
import { LigaCard } from '@/components/LigaCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock data para as ligas
const leaguesData = [
  {
    id: '1',
    name: 'Liga Principal',
    type: 'principal' as const,
    logoUrl: '/league-logos/main-league-trophy.png',
    entryFee: {
      amount: 0,
      currency: 'SOL'
    },
    prizePool: {
      amount: 1000,
      currency: 'USDC'
    },
    participants: 1234,
    maxParticipants: 5000
  },
  {
    id: '2',
    name: 'Liga de Ações Tokenizadas',
    type: 'principal' as const,
    logoUrl: '/mascots/mascot-2.png',
    entryFee: {
      amount: 5,
      currency: 'USDC'
    },
    prizePool: {
      amount: 2500,
      currency: 'USDC'
    },
    participants: 876,
    maxParticipants: 2000
  },
  {
    id: '3',
    name: 'Yield Hackers',
    type: 'comunidade' as const,
    logoUrl: '',
    entryFee: {
      amount: 2,
      currency: 'USDC'
    },
    prizePool: {
      amount: 500,
      currency: 'USDC'
    },
    participants: 123,
    maxParticipants: 500
  },
  {
    id: '4',
    name: 'Liga do ZP (João Hazim)',
    type: 'comunidade' as const,
    logoUrl: '',
    entryFee: {
      amount: 1,
      currency: 'SOL'
    },
    prizePool: {
      amount: 300,
      currency: 'USDC'
    },
    participants: 245,
    maxParticipants: 300
  },
  {
    id: '5',
    name: 'Casta Guilda',
    type: 'comunidade' as const,
    logoUrl: '',
    entryFee: {
      amount: 3,
      currency: 'USDC'
    },
    prizePool: {
      amount: 750,
      currency: 'USDC'
    },
    participants: 178,
    maxParticipants: 400
  },
  {
    id: '6',
    name: 'Coleta Cripto',
    type: 'comunidade' as const,
    logoUrl: '',
    entryFee: {
      amount: 0.5,
      currency: 'SOL'
    },
    prizePool: {
      amount: 200,
      currency: 'USDC'
    },
    participants: 89,
    maxParticipants: 200
  },
  {
    id: '7',
    name: 'Intus Cripto',
    type: 'comunidade' as const,
    logoUrl: '',
    entryFee: {
      amount: 10,
      currency: 'USDC'
    },
    prizePool: {
      amount: 1500,
      currency: 'USDC'
    },
    participants: 67,
    maxParticipants: 150
  },
  {
    id: '8',
    name: 'Cripto Sincero',
    type: 'comunidade' as const,
    logoUrl: '',
    entryFee: {
      amount: 1,
      currency: 'USDC'
    },
    prizePool: {
      amount: 100,
      currency: 'USDC'
    },
    participants: 56,
    maxParticipants: 100
  },
  {
    id: '9',
    name: 'Matico',
    type: 'comunidade' as const,
    logoUrl: '',
    entryFee: {
      amount: 2,
      currency: 'USDC'
    },
    prizePool: {
      amount: 400,
      currency: 'USDC'
    },
    participants: 134,
    maxParticipants: 250
  },
  {
    id: '10',
    name: 'Bitinada',
    type: 'comunidade' as const,
    logoUrl: '',
    entryFee: {
      amount: 0.2,
      currency: 'SOL'
    },
    prizePool: {
      amount: 150,
      currency: 'USDC'
    },
    participants: 45,
    maxParticipants: 100
  }
];

export default function LigasPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const principalLeagues = leaguesData.filter(league => league.type === 'principal');
  const communityLeagues = leaguesData.filter(league => 
    league.type === 'comunidade' && 
    league.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header da Página */}
      <header className="py-12 bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-800">
            Encontre Sua Competição
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Participe das ligas oficiais ou junte-se à sua comunidade para competir por prêmios incríveis.
          </p>
        </div>
      </header>
      
      {/* Seção de Ligas Principais */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-slate-800">
            Ligas Oficiais
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {principalLeagues.map(league => (
              <LigaCard 
                key={league.id}
                id={league.id}
                name={league.name}
                type={league.type}
                logoUrl={league.logoUrl}
                entryFee={league.entryFee}
                prizePool={league.prizePool}
                participants={league.participants}
                maxParticipants={league.maxParticipants}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* Seção de Ligas da Comunidade */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-slate-800">
            Ligas da Comunidade
          </h2>
          
          {/* Barra de Ferramentas */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="w-full md:w-1/2">
              <Input 
                placeholder="Buscar pelo nome da liga..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-1/4">
              <Select defaultValue="recentes">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recentes">Mais Recentes</SelectItem>
                  <SelectItem value="populares">Mais Populares</SelectItem>
                  <SelectItem value="premios">Maiores Prêmios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Grid de Ligas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {communityLeagues.map(league => (
              <LigaCard 
                key={league.id}
                id={league.id}
                name={league.name}
                type={league.type}
                logoUrl={league.logoUrl}
                entryFee={league.entryFee}
                prizePool={league.prizePool}
                participants={league.participants}
                maxParticipants={league.maxParticipants}
              />
            ))}
          </div>
          
          {communityLeagues.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">Nenhuma liga encontrada com esse nome.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { LigaCard } from '@/components/LigaCard';
import { MainLeagueCard } from '@/components/MainLeagueCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock data para as ligas (removendo a Liga Principal do mock)
const leaguesData = [
  {
    id: '2',
    name: 'Liga de Ações Tokenizadas',
    type: 'principal' as const,
    logoUrl: '/league-logos/tokenized-stocks-league.png',
    entryFee: {
      amount: 0.001,
      currency: 'SOL'
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
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = React.useState('');
  const highlightLeagueId = searchParams?.get('highlight');
  
  const principalLeagues = leaguesData.filter(league => league.type === 'principal');
  const communityLeagues = leaguesData.filter(league => 
    league.type === 'comunidade' && 
    league.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Scroll para a liga destacada quando a página carrega
  React.useEffect(() => {
    if (highlightLeagueId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`league-${highlightLeagueId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightLeagueId]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header da Página */}
      <header className="py-12 bg-card border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Encontre Sua Competição
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Participe das ligas oficiais ou junte-se à sua comunidade para competir por prêmios incríveis.
          </p>
        </div>
      </header>
      
      {/* Seção de Ligas Principais */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-foreground">
            Liga Oficial
          </h2>
          
          <div className="max-w-2xl mx-auto">
            <MainLeagueCard />
          </div>

          {/* Outras Ligas Principais (se houver) */}
          {principalLeagues.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-6 text-foreground">
                Outras Ligas Oficiais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {principalLeagues.map(league => (
                  <div 
                    key={league.id} 
                    id={`league-${league.id}`}
                    className={highlightLeagueId === league.id ? 'ring-4 ring-primary ring-opacity-50 rounded-xl animate-pulse' : ''}
                  >
                    <LigaCard 
                      id={league.id}
                      name={league.name}
                      type={league.type}
                      logoUrl={league.logoUrl}
                      entryFee={league.entryFee}
                      prizePool={league.prizePool}
                      participants={league.participants}
                      maxParticipants={league.maxParticipants}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* Seção de Ligas da Comunidade */}
      <section className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-card-foreground">
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
              <div 
                key={league.id} 
                id={`league-${league.id}`}
                className={highlightLeagueId === league.id ? 'ring-4 ring-primary ring-opacity-50 rounded-xl animate-pulse' : ''}
              >
                <LigaCard 
                  id={league.id}
                  name={league.name}
                  type={league.type}
                  logoUrl={league.logoUrl}
                  entryFee={league.entryFee}
                  prizePool={league.prizePool}
                  participants={league.participants}
                  maxParticipants={league.maxParticipants}
                />
              </div>
            ))}
          </div>
          
          {communityLeagues.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma liga encontrada com esse nome.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
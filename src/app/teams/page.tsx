'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
// import { useWallet } from '@solana/wallet-adapter-react'; // Temporariamente removido
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CartolaCard } from '@/components/cartola-card';
import { SoccerField } from '@/components/field/soccer-field';
import { TokenMarket } from '@/components/market/token-market';
import { type Token } from '@/hooks/use-tokens';
import { type TokenMarketData } from '@/data/expanded-tokens';
import { Search, Filter, Star, TrendingUp, TrendingDown, Minus, Clock, AlertCircle } from 'lucide-react';

interface Player {
  id: string;
  position: number; // 1-10 (1 = goalkeeper, 2-5 = defenders, 6-8 = midfielders, 9-10 = forwards)
  name: string;
  token: string;
  image?: string; // URL do logo oficial do token
  price: number;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  change_24h?: number;
}

interface League {
  id: string;
  name: string;
  leagueName: string;
}

interface MainTeam {
  id: string;
  name: string;
  players: Player[];
}

interface LeagueTeam {
  id: string;
  leagueId: string;
  name: string;
  players: Player[];
}

// Mock data
const mockLeagues: League[] = [
  { id: "1", name: "Liga Principal", leagueName: "Liga Principal" },
  { id: "2", name: "Solana Degens", leagueName: "Solana Degens" },
  { id: "3", name: "Ações da Semana", leagueName: "Ações da Semana" }
];

const mockMainTeam: MainTeam = {
  id: "main",
  name: "Time Principal",
  players: []
};



export default function TeamsPage() {
  const [selectedFormation, setSelectedFormation] = useState<'433' | '442' | '352'>('433');
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenMarketData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [setAsMainTeam, setSetAsMainTeam] = useState(false);
  const [showMainTeamNotification, setShowMainTeamNotification] = useState(false);
  
  // Market status - true for open, false for closed
  const [isMarketOpen, setIsMarketOpen] = useState(true); // Set to true to show market
  
  // Simular parâmetros de URL para determinar a liga atual
  // Em uma implementação real, isso viria dos parâmetros de rota ou query string
  const [currentLeagueId] = useState<string | null>("1"); // null = Time Principal, string = Liga específica
  
  const currentLeague = useMemo(() => {
    if (!currentLeagueId) return null;
    return mockLeagues.find(league => league.id === currentLeagueId) || null;
  }, [currentLeagueId]);
  
  const isEditingMainTeam = currentLeagueId === null;
  
  // Efeito para carregar a escalação inicial
  useEffect(() => {
    if (currentLeagueId) {
      // Verificar se já existe uma escalação para esta liga
      // Em uma implementação real, isso viria de uma API ou localStorage
      const existingTeamForLeague: LeagueTeam | null = null; // Simular que não existe escalação para esta liga
      
      if (existingTeamForLeague) {
        // Carregar escalação existente
        setPlayers((existingTeamForLeague as LeagueTeam).players);
      } else {
        // Carregar Time Principal como base
        setPlayers(mockMainTeam.players);
        setShowMainTeamNotification(true);
        
        // Esconder notificação após 5 segundos
        const timer = setTimeout(() => {
          setShowMainTeamNotification(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    } else {
      // Carregar Time Principal
      setPlayers(mockMainTeam.players);
    }
  }, [currentLeagueId]);

  const handleAddPlayer = useCallback((position: number) => {
    console.log('Posição selecionada:', position);
    setSelectedPosition(position);
    
    // Se já tiver um token selecionado, adiciona ele imediatamente
    if (selectedToken) {
      // Precisamos usar esta forma para evitar problemas de closure
      const token = selectedToken;
      // Chamada direta para evitar problemas de dependência
      const isTokenAlreadyUsed = players.some(player => player.id === token.id);
      
      if (isTokenAlreadyUsed) {
        alert(`O token ${token.name} (${token.symbol}) já está sendo usado no seu time. Escolha um token diferente.`);
        return;
      }

      const newPlayer = {
        id: token.id,
        name: token.name,
        position: position,
        token: token.symbol,
        image: token.image,
        price: token.price,
        points: Math.floor((token.price % 100)) + 50, // Deterministic points based on price
        rarity: token.rarity || 'common',
        change_24h: token.change_24h
      };

      setPlayers(prev => {
        const filtered = prev.filter(p => p.position !== position);
        return [...filtered, newPlayer];
      });
      
      setSelectedPosition(null);
      setSelectedToken(null);
    }
  }, [selectedToken, players]);

  const handleRemovePlayer = useCallback((position: number) => {
    setPlayers(prev => prev.filter(p => p.position !== position));
  }, []);

  const handleSelectToken = useCallback((token: TokenMarketData) => {
    console.log('Token selecionado:', token); // Debug log
    if (selectedPosition) {
      // Convert token market data to player
      const newPlayer: Player = {
        id: token.id,
        position: selectedPosition,
        name: token.name,
        token: token.symbol,
        image: token.image,
        price: token.price,
        points: Math.floor((token.price % 100)) + 50, // Deterministic points based on price
        rarity: token.rarity || 'common'
      };
      
      console.log('Novo jogador criado:', newPlayer); // Debug log
      
      setPlayers(prev => {
        // Remove any existing player at this position
        const filtered = prev.filter(p => p.position !== selectedPosition);
        return [...filtered, newPlayer];
      });
      
      setSelectedPosition(null);
      setSelectedToken(null); // Clear token selection after adding to field
    }
  }, [selectedPosition]);

  const handleTokenSelect = (token: TokenMarketData | null) => {
    setSelectedToken(token);
  };

  const handleTokenAdd = (token: TokenMarketData, position: number) => {
    console.log('Adicionando token:', token.name, 'na posição:', position);
    
    // Check if token is already in the team
    const isTokenAlreadyUsed = players.some(player => player.id === token.id);
    
    if (isTokenAlreadyUsed) {
      alert(`O token ${token.name} (${token.symbol}) já está sendo usado no seu time. Escolha um token diferente.`);
      return;
    }

    const newPlayer: Player = {
      id: token.id,
      name: token.name,
      position: position,
      token: token.symbol,
      image: token.image,
      price: token.price,
      points: 0,
      rarity: token.rarity || 'common',
      change_24h: token.change_24h
    };

    setPlayers(prev => {
      const filtered = prev.filter(p => p.position !== position);
      return [...filtered, newPlayer];
    });
    
    setSelectedPosition(null); // Limpa a posição selecionada
    setSelectedToken(null); // Clear token selection after adding to field
  };

  const saveTeam = async () => {
    if (players.length !== 10) {
      alert('Por favor, complete todas as posições do time antes de salvar');
      return;
    }

    // TODO: Implement actual team saving with Solana
    console.log('Salvando time:', players);
    
    let successMessage = '';
    
    if (setAsMainTeam) {
      // Salvar como Time Principal
      console.log('Atualizando Time Principal:', players);
      successMessage = `Time Principal atualizado com sucesso!\n\nJogadores: ${players.length}/10\nValor total: $${players.reduce((sum, p) => sum + p.price, 0).toLocaleString()}`;
    } else if (currentLeague) {
      // Salvar escalação para liga específica
      console.log(`Salvando escalação para liga ${currentLeague.leagueName}:`, players);
      successMessage = `Escalação para ${currentLeague.leagueName} salva com sucesso!\n\nJogadores: ${players.length}/10\nValor total: $${players.reduce((sum, p) => sum + p.price, 0).toLocaleString()}`;
    } else {
      // Salvando Time Principal diretamente
      console.log('Salvando Time Principal:', players);
      successMessage = `Time Principal salvo com sucesso!\n\nJogadores: ${players.length}/10\nValor total: $${players.reduce((sum, p) => sum + p.price, 0).toLocaleString()}`;
    }
    
    // Show success message
    alert(successMessage);
    
    // Reset flag after saving
    setSetAsMainTeam(false);
  };

  // Check if team is complete and valid
  const isTeamComplete = players.length === 10;
  const hasChanges = players.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header da Página */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {isEditingMainTeam ? "Escalação do Time Principal" : "Escalação do Time"}
              </h1>
              {currentLeague && (
                <h2 className="text-2xl font-semibold text-primary mb-2">
                  Escalando time para: {currentLeague.name}
                </h2>
              )}
              <p className="text-gray-600">Monte seu time com formação 4-3-3 e escolha tokens do mercado</p>
            </div>
          </div>
        </div>
        
        {/* Notificação de carregamento do Time Principal */}
        {showMainTeamNotification && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Carregamos seu time principal. Personalize-o para esta liga!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        {/* Coluna da esquerda - Campo de futebol */}
        <div className="col-span-1 h-full">
          <div className="space-y-4">
            {/* Controles de escalação */}
            <Card className="p-4">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Configurações da Escalação</h3>
                    <p className="text-sm text-gray-600">
                      {isEditingMainTeam 
                        ? "Editando seu Time Principal" 
                        : `Escalação para ${currentLeague?.name || 'Liga'}`}
                    </p>
                  </div>
                  <Badge variant={isEditingMainTeam ? "default" : "secondary"}>
                    {isEditingMainTeam ? "Time Principal" : "Liga Específica"}
                  </Badge>
                </div>
                
                {/* Switch para definir como Time Principal (apenas quando editando liga) */}
                {!isEditingMainTeam && (
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Switch
                      id="set-as-main-team"
                      checked={setAsMainTeam}
                      onCheckedChange={setSetAsMainTeam}
                    />
                    <Label htmlFor="set-as-main-team" className="text-sm font-medium">
                      Definir esta escalação como meu Time Principal
                    </Label>
                  </div>
                )}
                
                {setAsMainTeam && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Esta escalação substituirá seu Time Principal atual e será usada como base para futuras ligas.
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Botão de salvar */}
                <Button 
                  onClick={saveTeam}
                  disabled={!isTeamComplete}
                  className="w-full"
                  size="lg"
                >
                  {setAsMainTeam 
                    ? "Salvar como Time Principal" 
                    : isEditingMainTeam 
                      ? "Salvar Time Principal"
                      : `Salvar Escalação para ${currentLeague?.name || 'Liga'}`}
                </Button>
                
                {!isTeamComplete && (
                  <p className="text-sm text-gray-500 text-center">
                    Complete todas as 10 posições para salvar ({players.length}/10)
                  </p>
                )}
              </div>
            </Card>
            
            <SoccerField 
              formation={selectedFormation}
              players={players}
              onAddPlayer={handleAddPlayer}
              onRemovePlayer={handleRemovePlayer}
              selectedPosition={selectedPosition}
              selectedToken={selectedToken}
              onTokenAdd={handleTokenAdd}
            />
          </div>
        </div>
        
        {/* Coluna da direita - Token Market */}
        <div className="col-span-1 border rounded-lg overflow-hidden bg-white p-0 m-0 flex flex-col h-full">
          {!isMarketOpen ? (
            /* Market Closed Card */
            <CartolaCard className="p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                {/* Illustration */}
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-12 h-12 text-primary" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-800">Mercado Fechado!</h2>
                  <p className="text-gray-600 max-w-sm">
                    O mercado está fechado para escalações. Você poderá fazer alterações no seu time quando o próximo período de escalação começar.
                  </p>
                </div>
                
                <Button 
                  className="bg-primary hover:bg-primary/90 text-white mt-6"
                  onClick={() => {/* Navigate to leagues */}}
                >
                  Conferir Ligas
                </Button>
              </div>
            </CartolaCard>
          ) : (
            /* Token Market */
            <TokenMarket 
              onSelectToken={handleSelectToken}
              selectedToken={selectedToken}
              selectedPosition={selectedPosition?.toString()}
              onTokenSelect={handleTokenSelect}
              usedTokens={players.map(p => p.id)}
              onAddToField={(token) => {
                if (selectedPosition) {
                  handleSelectToken(token);
                }
              }}
            />
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
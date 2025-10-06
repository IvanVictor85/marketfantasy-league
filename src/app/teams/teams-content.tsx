'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SoccerField } from '@/components/field/soccer-field';
import { TokenMarket } from '@/components/market/token-market';
import { type TokenMarketData } from '@/data/expanded-tokens';
import { type Player } from '@/types/teams';

import { 
  Users, 
  Trophy, 
  Target, 
  Settings,
  Save,
  RotateCcw,
  Zap,
  Crown
} from 'lucide-react';

// Mock data para ligas
const mockLeagues = [
  { id: 'main', name: 'Time Principal', type: 'main' },
  { id: 'liga-1', name: 'Liga Principal', type: 'league' },
  { id: 'liga-2', name: 'Liga de Ações Tokenizadas', type: 'xstocks' },
  { id: 'liga-3', name: 'Liga DeFi', type: 'defi' },
  { id: 'liga-4', name: 'Liga Meme', type: 'meme' },
  { id: 'liga-5', name: 'Liga Gaming', type: 'gaming' }
];

export function TeamsContent() {
  const searchParams = useSearchParams();
  
  // Estados principais
  const [formation, setFormation] = useState<'433' | '442' | '352'>('433');
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenMarketData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('main');
  const [isEditingMainTeam, setIsEditingMainTeam] = useState(true);

  // Capturar parâmetros da URL de forma segura
  useEffect(() => {
    if (searchParams) {
      const urlLeagueId = searchParams.get('league');
      if (urlLeagueId && mockLeagues.find(league => league.id === urlLeagueId)) {
        setSelectedLeagueId(urlLeagueId);
        setIsEditingMainTeam(urlLeagueId === 'main');
      }
    }
  }, [searchParams]);

  // Função para obter filtro fixo baseado no tipo de liga
  const getFixedFilter = (leagueType: string) => {
    switch (leagueType) {
      case 'xstocks':
        return { type: 'xstocks' as const, label: 'xStocks Elite' };
      case 'defi':
        return { type: 'defi' as const, label: 'DeFi Tokens' };
      case 'meme':
        return { type: 'meme' as const, label: 'Meme Tokens' };
      case 'gaming':
        return { type: 'gaming' as const, label: 'Gaming Tokens' };
      default:
        return undefined;
    }
  };

  // Obter liga atual e filtro
  const currentLeague = mockLeagues.find(league => league.id === selectedLeagueId);
  const fixedFilter = currentLeague ? getFixedFilter(currentLeague.type) : undefined;

  // Função para adicionar jogador
  const handleAddPlayer = (position: number) => {
    setSelectedPosition(position);
  };

  // Função para remover jogador
  const handleRemovePlayer = (position: number) => {
    setPlayers(prev => prev.filter(p => p.position !== position));
  };

  // Função para adicionar token ao campo
  const handleTokenAdd = (token: TokenMarketData, position: number) => {
    const newPlayer: Player = {
      id: token.id,
      position,
      name: token.name,
      token: token.symbol,
      image: token.image,
      price: token.price || 0,
      points: 0,
      rarity: 'common',
      change_24h: token.change_24h
    };

    setPlayers(prev => {
      const filtered = prev.filter(p => p.position !== position);
      return [...filtered, newPlayer];
    });

    setSelectedToken(null);
    setSelectedPosition(null);
  };

  // Função para selecionar token
  const handleTokenSelect = (token: TokenMarketData | null) => {
    setSelectedToken(token);
  };

  // Função para salvar escalação
  const handleSaveTeam = () => {
    console.log('Salvando escalação:', {
      leagueId: selectedLeagueId,
      formation,
      players,
      isMainTeam: isEditingMainTeam
    });
    // Aqui seria implementada a lógica de salvamento
  };

  // Função para resetar escalação
  const handleResetTeam = () => {
    setPlayers([]);
    setSelectedToken(null);
    setSelectedPosition(null);
  };

  // Obter tokens já utilizados
  const usedTokens = players.map(p => p.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Escalação de Times
            </h1>
            <p className="text-gray-600">
              Monte sua escalação estratégica para {currentLeague?.name || 'Liga Selecionada'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Seletor de Liga */}
            <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Selecionar Liga" />
              </SelectTrigger>
              <SelectContent>
                {mockLeagues.map(league => (
                  <SelectItem key={league.id} value={league.id}>
                    {league.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Seletor de Formação */}
            <Select value={formation} onValueChange={(value: '433' | '442' | '352') => setFormation(value)}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="433">4-3-3</SelectItem>
                <SelectItem value="442">4-4-2</SelectItem>
                <SelectItem value="352">3-5-2</SelectItem>
              </SelectContent>
            </Select>

            {/* Indicador de Time Principal */}
            {isEditingMainTeam && (
              <Badge variant="default" className="bg-yellow-500 text-white flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Time Principal
              </Badge>
            )}
          </div>
        </div>

        {/* Informações da Liga */}
        {fixedFilter && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {fixedFilter.label}
                </Badge>
                <span className="text-sm text-gray-600">
                  Esta liga permite apenas tokens da categoria {fixedFilter.label}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Layout Principal */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Campo de Futebol */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Campo de Escalação
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetTeam}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Resetar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveTeam}
                      className="flex items-center gap-1"
                    >
                      <Save className="w-4 h-4" />
                      Salvar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SoccerField
                  players={players}
                  onAddPlayer={handleAddPlayer}
                  onRemovePlayer={handleRemovePlayer}
                  formation={formation}
                  selectedToken={selectedToken}
                  onTokenAdd={handleTokenAdd}
                  selectedPosition={selectedPosition}
                />
              </CardContent>
            </Card>

            {/* Estatísticas da Escalação */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Estatísticas da Escalação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{players.length}/10</div>
                    <div className="text-sm text-gray-600">Jogadores</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${players.reduce((sum, p) => sum + p.price, 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Valor Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {players.reduce((sum, p) => sum + p.points, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Pontos Médios</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {players.length > 0 
                        ? ((players.reduce((sum, p) => sum + (p.change_24h || 0), 0) / players.length)).toFixed(1)
                        : '0.0'
                      }%
                    </div>
                    <div className="text-sm text-gray-600">Performance 24h</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market de Tokens */}
          <div className="xl:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Token Market
                  {selectedPosition && (
                    <Badge variant="outline">
                      Posição {selectedPosition}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TokenMarket
                  selectedToken={selectedToken}
                  onTokenSelect={handleTokenSelect}
                  onSelectToken={selectedPosition ? (token) => handleTokenAdd(token, selectedPosition) : undefined}
                  usedTokens={usedTokens}
                  fixedFilter={fixedFilter}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
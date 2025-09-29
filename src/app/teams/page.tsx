'use client';

import React, { useState, useCallback } from 'react';
// import { useWallet } from '@solana/wallet-adapter-react'; // Temporariamente removido
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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



export default function TeamsPage() {
  const [selectedFormation, setSelectedFormation] = useState<'433' | '442' | '352'>('433');
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenMarketData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  
  // Market status - true for open, false for closed
  const [isMarketOpen, setIsMarketOpen] = useState(true); // Set to true to show market

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
    
    // Show success message
    alert(`Time salvo com sucesso!\n\nJogadores: ${players.length}/10\nValor total: $${players.reduce((sum, p) => sum + p.price, 0).toLocaleString()}\n\nFuncionalidade completa será implementada com integração do smart contract.`);
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Escalação do Time</h1>
              <p className="text-gray-600">Monte seu time com formação 4-3-3 e escolha tokens do mercado</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        {/* Coluna da esquerda - Campo de futebol */}
        <div className="col-span-1 h-full">
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
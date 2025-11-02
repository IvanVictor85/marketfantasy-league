'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type TokenMarketData } from '@/data/expanded-tokens';
import { useTranslations } from 'next-intl';

import { 
  User, 
  Crown, 
  Shield, 
  Zap, 
  Target,
  Plus,
  X
} from 'lucide-react';

interface Player {
  id: string;
  position: number; // 1-10 (1 = goalkeeper, 2-4 = defenders, 5-7 = midfielders, 8-10 = forwards)
  name: string;
  token: string;
  image?: string; // URL do logo oficial do token
  price: number;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}



interface SoccerFieldProps {
  players: Player[];
  onAddPlayer: (position: number) => void;
  onRemovePlayer: (position: number) => void;
  formation?: '433' | '442' | '352';
  selectedToken?: TokenMarketData | null;
  onTokenAdd?: (token: TokenMarketData, position: number) => void;
  selectedPosition?: number | null;
}

const defaultPlayers: Player[] = [];

export function SoccerField({ 
  players = defaultPlayers, 
  onAddPlayer, 
  onRemovePlayer, 
  formation = '433',
  selectedToken,
  onTokenAdd
}: SoccerFieldProps) {
  const t = useTranslations('teams');
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

  // Formation layouts - positions on the field (x, y coordinates as percentages) - 10 players
  const formations: Record<'433' | '442' | '352', Record<number, { x: number; y: number }>> = {
    '433': {
      1: { x: 50, y: 90 }, // Goalkeeper
      2: { x: 20, y: 70 }, // Right Back
      3: { x: 40, y: 70 }, // Center Back
      4: { x: 60, y: 70 }, // Center Back
      5: { x: 80, y: 70 }, // Left Back
      6: { x: 35, y: 45 }, // Defensive Midfielder
      7: { x: 65, y: 45 }, // Central Midfielder
      8: { x: 25, y: 15 }, // Left Winger
      9: { x: 50, y: 10 }, // Striker
      10: { x: 75, y: 15 }, // Right Winger
    },
    '442': {
      1: { x: 50, y: 90 }, // Goalkeeper
      2: { x: 20, y: 70 }, // Right Back
      3: { x: 40, y: 70 }, // Center Back
      4: { x: 60, y: 70 }, // Center Back
      5: { x: 80, y: 70 }, // Left Back
      6: { x: 30, y: 45 }, // Right Midfielder
      7: { x: 50, y: 40 }, // Central Midfielder
      8: { x: 70, y: 45 }, // Left Midfielder
      9: { x: 40, y: 15 }, // Striker
      10: { x: 60, y: 15 }, // Striker
    },
    '352': {
      1: { x: 50, y: 90 }, // Goalkeeper
      2: { x: 30, y: 70 }, // Right Center Back
      3: { x: 50, y: 75 }, // Center Back
      4: { x: 70, y: 70 }, // Left Center Back
      5: { x: 20, y: 50 }, // Right Wing Back
      6: { x: 40, y: 45 }, // Central Midfielder
      7: { x: 60, y: 45 }, // Central Midfielder
      8: { x: 80, y: 50 }, // Left Wing Back
      9: { x: 40, y: 15 }, // Striker
      10: { x: 60, y: 15 }, // Striker
    }
  };

  const getPlayerAtPosition = (position: number) => {
    return players.find(p => p.position === position);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-purple-500 bg-purple-100';
      case 'epic': return 'border-orange-500 bg-orange-100';
      case 'rare': return 'border-blue-500 bg-blue-100';
      case 'common': return 'border-muted-foreground bg-muted';
      default: return 'border-border bg-card';
    }
  };

  const getTooltipPosition = (position: number, coords: { x: number; y: number }) => {
    // Posições específicas que precisam de tratamento especial
    const specialPositions: Record<number, string> = {
      10: 'top-full mt-2 right-0', // Posição 10 para baixo e à direita (não cortado)
      8: 'top-full mt-2 left-0',   // Posição 8 para baixo e à esquerda
      9: 'top-full mt-2 left-1/2 transform -translate-x-1/2', // Posição 9 para baixo e centralizado
    };

    // Se é uma posição especial, usar posicionamento específico
    if (specialPositions[position]) {
      return specialPositions[position];
    }

    // Lógica padrão para outras posições
    const verticalPosition = coords.y < 30 ? 'top-full mt-2' : 'bottom-full mb-2';
    const horizontalPosition = coords.x < 25 ? 'left-0' : coords.x > 75 ? 'right-0' : 'left-1/2 transform -translate-x-1/2';
    
    return `${verticalPosition} ${horizontalPosition}`;
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return Crown; // Goalkeeper
    if (position >= 2 && position <= 5) return Shield; // Defenders
    if (position >= 6 && position <= 8) return Zap; // Midfielders
    if (position >= 9 && position <= 10) return Target; // Forwards
    return Crown; // Default
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const handleDragOver = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverPosition(position);
  };

  const handleDragLeave = () => {
    setDragOverPosition(null);
  };

  const handleDrop = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    setDragOverPosition(null);
    
    try {
      const tokenData = JSON.parse(e.dataTransfer.getData('application/json'));
      if (tokenData && onTokenAdd) {
        onTokenAdd(tokenData, position);
      }
    } catch (error) {
      console.error('Error parsing dropped token data:', error);
    }
  };

  const totalValue = players.reduce((sum, player) => sum + (player.currentPrice || player.price || 0), 0);
  const averagePoints = players.length > 0 ? players.reduce((sum, player) => sum + (player.points || 0), 0) / players.length : 0;

  return (
    <div className="space-y-4">
      {/* Field Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">{players.length}/10</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Jogadores</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Valor Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{averagePoints.toFixed(1)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Pontos Médios</div>
          </CardContent>
        </Card>
      </div>

      {/* Soccer Field */}
      <Card className="bg-gradient-to-b from-green-400 to-green-600">
        <CardContent className="p-6">
          <div className="relative w-full h-[400px] bg-green-500 rounded-lg border-4 border-white overflow-hidden">
            {/* Field markings */}
            <div className="absolute inset-0">
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
              
              {/* Center line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white transform -translate-y-1/2"></div>
              
              {/* Goal areas */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-12 border-2 border-white border-t-0"></div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-12 border-2 border-white border-b-0"></div>
              
              {/* Penalty areas */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-20 border-2 border-white border-t-0"></div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-20 border-2 border-white border-b-0"></div>
            </div>

            {/* Players */}
            {Object.entries(formations[formation]).map(([position, coords]) => {
              const positionNum = parseInt(position);
              const player = getPlayerAtPosition(positionNum);
              const PositionIcon = getPositionIcon(positionNum);

              return (
                <div
                  key={position}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${coords.x}%`,
                    top: `${coords.y}%`,
                  }}
                >
                  {player ? (
                    <div className="relative group">
                      {/* Container principal do jogador */}
                      <div className="flex flex-col items-center">
                        {/* Círculo do jogador */}
                        <div 
                          className={`w-16 h-16 rounded-full border-4 ${getRarityColor(player.rarity)} flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg bg-card relative overflow-hidden`}
                          onClick={() => onRemovePlayer(positionNum)}
                        >
                          {player.image ? (
                            <>
                              <Image 
                                src={player.image} 
                                alt={`${player.name} logo`}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                              <div className="absolute bottom-0 left-0 right-0 text-xs font-bold text-white bg-black/70 text-center py-0.5">
                                {positionNum}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-sm font-bold text-gray-800 dark:text-white">{positionNum}</div>
                              <div className="text-xs font-semibold text-card-foreground bg-card/80 px-1 rounded">{player.token}</div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Player info tooltip - movido para fora do círculo */}
                      <div className={`absolute ${getTooltipPosition(positionNum, coords)} 
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                    bg-card rounded-lg shadow-lg p-3 z-50 border border-border max-w-xs pointer-events-none group-hover:pointer-events-auto`}>
                        <div className="font-semibold text-sm leading-tight max-h-10 overflow-hidden" 
                             style={{
                               display: '-webkit-box',
                               WebkitLineClamp: 2,
                               WebkitBoxOrient: 'vertical'
                             }}
                             title={player.name}>
                          {player.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2 mt-1">
                          <span className="font-mono">{player.token}</span>
                          {/* TODO: Substituir "rarity" por algo útil como "volatilidade" ou "categoria" */}
                          {/* <Badge variant="secondary" className={getRarityColor(player.rarity)}>
                            {player.rarity}
                          </Badge> */}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {formatPrice(player.currentPrice || player.price || 0)} • {player.points || 0} pts
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full mt-2 h-6 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemovePlayer?.(positionNum);
                          }}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Remover
                        </Button>
                      </div>
                        
                      {/* Ticker abaixo do logo */}
                      {player.image && (
                        <div className="mt-1 text-xs font-bold text-white bg-black/80 px-2 py-0.5 rounded-full shadow-lg text-center mx-auto">
                          {player.token}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`w-16 h-16 rounded-full border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${dragOverPosition === positionNum ? 'border-blue-400 bg-blue-400/50 scale-110' : selectedToken ? 'border-green-400 bg-green-400/30 hover:bg-green-400/50' : selectedPosition === positionNum ? 'border-primary bg-primary/30 hover:bg-primary/50' : 'border-white/50 bg-black/30 hover:bg-black/50'}`}
                      onClick={() => {
                        if (selectedToken && onTokenAdd) {
                          onTokenAdd(selectedToken, positionNum);
                        } else {
                          setSelectedPosition(positionNum);
                          onAddPlayer?.(positionNum);
                        }
                      }}
                      onDragOver={(e) => handleDragOver(e, positionNum)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, positionNum)}
                    >
                      <Plus className={`w-6 h-6 mb-1 ${dragOverPosition === positionNum ? 'text-blue-100' : selectedToken ? 'text-green-100' : selectedPosition === positionNum ? 'text-primary-foreground' : 'text-white'}`} />
                      <div className={`text-xs font-bold ${dragOverPosition === positionNum ? 'text-blue-100' : selectedToken ? 'text-green-100' : selectedPosition === positionNum ? 'text-primary-foreground' : 'text-white'}`}>
                        {positionNum}
                      </div>
                      {dragOverPosition === positionNum && (
                        <div className="text-xs text-blue-100 mt-1 text-center leading-tight">
                          Soltar<br/>aqui
                        </div>
                      )}
                      {selectedToken && dragOverPosition !== positionNum && (
                        <div className="text-xs text-green-100 mt-1 text-center leading-tight">
                          Adicionar<br/>{selectedToken.name.split(' ')[0]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Formation indicator */}
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="bg-card/90 text-card-foreground">
                {t('formation')} {formation.split('').join('-')}
              </Badge>
            </div>

            {/* Field direction indicator */}
            <div className="absolute top-4 right-4 text-white text-sm font-medium">
              ⬆️ {t('attack')}
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}
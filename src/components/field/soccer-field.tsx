'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { type TokenMarketData } from '@/data/expanded-tokens';
import { useTranslations } from 'next-intl';
import { Player } from '@/types/teams';

import {
  User,
  Crown,
  Shield,
  Zap,
  Target,
  Plus,
  X
} from 'lucide-react';

interface SoccerFieldProps {
  players: Player[];
  onAddPlayer: (position: number) => void;
  onRemovePlayer: (position: number) => void;
  formation?: '433' | '442' | '352';
  selectedToken?: TokenMarketData | null;
  onTokenAdd?: (token: TokenMarketData, position: number) => void;
  selectedPosition?: number | null;
  roundScore?: number; // Pontuação da rodada atual
  roundRank?: number; // Ranking da rodada atual
  leagueTotalScore?: number; // Pontuação total acumulada da liga
  leagueRank?: number | null; // Ranking geral na liga
  competitionStatus?: string; // Status da competição (PENDING, ACTIVE, COMPLETED)
}

const defaultPlayers: Player[] = [];

export function SoccerField({
  players = defaultPlayers,
  onAddPlayer,
  onRemovePlayer,
  formation = '433',
  selectedToken,
  onTokenAdd,
  roundScore,
  roundRank,
  leagueTotalScore,
  leagueRank,
  competitionStatus
}: SoccerFieldProps) {
  const t = useTranslations('teams');
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [activePlayerCard, setActivePlayerCard] = useState<number | null>(null);

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

  return (
    <div className="space-y-4">
      {/* Field Stats - Estatísticas da RODADA ATUAL */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">{players.length}/10</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{t('players')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {roundScore !== undefined ? roundScore.toFixed(1) : 'N/A'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {t('roundScore')}
              {competitionStatus === 'ACTIVE' && roundScore === 0 && (
                <div className="text-xs text-orange-500 mt-1">
                  (Aguardando conclusão)
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {roundRank ? `#${roundRank}` : 'N/A'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {t('roundRanking')}
              {competitionStatus === 'ACTIVE' && (
                <div className="text-xs text-orange-500 mt-1">
                  (Aguardando conclusão)
                </div>
              )}
            </div>
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
                    <Popover open={activePlayerCard === positionNum} onOpenChange={(open) => setActivePlayerCard(open ? positionNum : null)}>
                      <PopoverTrigger asChild>
                        <div className="flex flex-col items-center">
                          {/* Círculo do jogador */}
                          <div
                            className={`w-16 h-16 rounded-full border-4 ${getRarityColor(player.rarity)} flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg bg-card relative overflow-hidden`}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              onRemovePlayer(positionNum);
                              setActivePlayerCard(null);
                            }}
                            title="Clique para ver detalhes • Duplo-clique para remover"
                          >
                            {player.image ? (
                              <>
                                <img
                                  src={player.image}
                                  alt={`${player.name} logo`}
                                  className="w-10 h-10 rounded-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                                <div className="absolute bottom-0 left-0 right-0 text-xs font-bold text-white bg-black/70 text-center py-0.5">
                                  {positionNum}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-sm font-bold text-gray-800 dark:text-white">{positionNum}</div>
                                <div className="text-xs font-semibold text-card-foreground bg-card/80 px-1 rounded">{(player.symbol || player.symbol || '?')}</div>
                              </>
                            )}
                          </div>

                          {/* Ticker abaixo do logo */}
                          {player.image && (
                            <div className="mt-1 text-xs font-bold text-white bg-black/80 px-2 py-0.5 rounded-full shadow-lg text-center mx-auto">
                              {(player.symbol || player.symbol || '?')}
                            </div>
                          )}
                        </div>
                      </PopoverTrigger>

                      <PopoverContent side="top" align="center" className="w-48 p-3">
                        {/* Nome do Jogador */}
                        <div className="font-bold text-base text-card-foreground mb-1">
                          {player.symbol || player.symbol || '?'}
                        </div>

                        {/* Pontuação */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Pontuação:</span>
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {player.points || 0} pts
                          </span>
                        </div>

                        {/* Variação 7d */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-muted-foreground">Variação 7d:</span>
                          <span className={`text-sm font-semibold ${
                            (player.priceChange7d || 0) >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {(player.priceChange7d || 0) >= 0 ? '+' : ''}
                            {(player.priceChange7d || 0).toFixed(2)}%
                          </span>
                        </div>

                        {/* Botão Remover */}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemovePlayer?.(positionNum);
                            setActivePlayerCard(null);
                          }}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Remover
                        </Button>
                      </PopoverContent>
                    </Popover>
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
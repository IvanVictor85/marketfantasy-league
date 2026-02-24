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
      // 4 Defensores (Linha Inferior) - Subi para 75%
      1: { x: 20, y: 75 }, 
      2: { x: 40, y: 75 }, 
      3: { x: 60, y: 75 }, 
      4: { x: 80, y: 75 }, 
      // 3 Meias (Linha Média) - Subi para 45%
      5: { x: 30, y: 45 }, 
      6: { x: 50, y: 45 }, 
      7: { x: 70, y: 45 }, 
      // 3 Atacantes (Linha Superior) - Mantido ou leve ajuste
      8: { x: 25, y: 15 }, 
      9: { x: 50, y: 10 }, 
      10: { x: 75, y: 15 }, 
    },
    '442': {
      // 4 Defensores - Subi para 75%
      1: { x: 20, y: 75 }, 
      2: { x: 40, y: 75 }, 
      3: { x: 60, y: 75 }, 
      4: { x: 80, y: 75 }, 
      // 4 Meias - Subi para 45%
      5: { x: 20, y: 45 }, 
      6: { x: 40, y: 45 }, 
      7: { x: 60, y: 45 }, 
      8: { x: 80, y: 45 },
      // 2 Atacantes
      9: { x: 35, y: 15 }, 
      10: { x: 65, y: 15 }, 
    },
    '352': {
      // 3 Defensores - Subi para 75%
      1: { x: 30, y: 75 }, 
      2: { x: 50, y: 75 }, 
      3: { x: 70, y: 75 }, 
      // 5 Meias - Subi para 45%
      4: { x: 15, y: 45 }, 
      5: { x: 32.5, y: 45 }, 
      6: { x: 50, y: 45 }, 
      7: { x: 67.5, y: 45 },
      8: { x: 85, y: 45 },
      // 2 Atacantes
      9: { x: 35, y: 15 }, 
      10: { x: 65, y: 15 }, 
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
    // Lógica ajustada para 10 jogadores sem goleiro
    // DEF: 1-4
    if (position >= 1 && position <= 4) return Shield; 
    // MID: 5-7 (433) ou 5-8 (442) ou 4-8 (352)
    if (position >= 5 && position <= 7) return Zap; 
    // ATA: 8-10 (433) ou 9-10 (442) etc - simplificação: > 7
    if (position >= 8) return Target;
    return Crown; 
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
        <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">{players.length}/10</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{t('players')}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {roundScore !== undefined ? Number(roundScore).toFixed(1) : 'N/A'}
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
        <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
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
      <Card className="bg-gradient-to-b from-gray-900 to-gray-800 border-none shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          {/* Reduzi a altura para 600px para remover o espaço preto inferior excessivo */}
          <div className="relative w-full h-[600px] bg-gray-900 overflow-hidden perspective-[1000px] group">
            
            {/* 3D Field Container */}
            {/* Removi margens excessivas: top-0 e h-full com leve escala para caber perfeito */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[95%] h-full transform rotate-x-[25deg] origin-top transition-transform duration-700 ease-in-out py-4">
              
              {/* Grass Pattern */}
              <div 
                className="absolute inset-0 w-full h-full shadow-2xl rounded-lg overflow-hidden"
                style={{
                  background: 'repeating-linear-gradient(0deg, #3a7f28 0px, #3a7f28 40px, #2e6b1f 40px, #2e6b1f 80px)',
                  boxShadow: 'inset 0 0 100px rgba(0,0,0,0.6)'
                }}
              >
                {/* Field Markings - White Lines */}
                <div className="absolute inset-0 border-[3px] border-white/60 m-4 rounded-sm">
                  
                  {/* Center Circle */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-[3px] border-white/60 rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white/80 rounded-full shadow-md"></div>
                  
                  {/* Center Line */}
                  <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-white/60 transform -translate-y-1/2"></div>
                  
                  {/* Penalty Areas */}
                  {/* Top (Goalkeeper side in 4-3-3 visual usually) */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[40%] h-[15%] border-[3px] border-white/60 border-t-0 bg-white/5"></div>
                  <div className="absolute top-[12%] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white/80 rounded-full"></div>
                  {/* Penalty Arc Top */}
                  <div className="absolute top-[15%] left-1/2 transform -translate-x-1/2 w-24 h-12 border-[3px] border-white/60 border-t-0 rounded-b-full"></div>

                  {/* Bottom */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[40%] h-[15%] border-[3px] border-white/60 border-b-0 bg-white/5"></div>
                  <div className="absolute bottom-[12%] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white/80 rounded-full"></div>
                  {/* Penalty Arc Bottom */}
                  <div className="absolute bottom-[15%] left-1/2 transform -translate-x-1/2 w-24 h-12 border-[3px] border-white/60 border-b-0 rounded-t-full"></div>

                  {/* Corner Arcs */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-[3px] border-white/60 border-l-0 border-t-0 rounded-br-full"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-[3px] border-white/60 border-r-0 border-t-0 rounded-bl-full"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-[3px] border-white/60 border-l-0 border-b-0 rounded-tr-full"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-[3px] border-white/60 border-r-0 border-b-0 rounded-tl-full"></div>
                </div>
              </div>

              {/* Players Layer (Inside 3D Container but Counter-Transformed) */}
              {Object.entries(formations[formation]).map(([position, coords]) => {
                const positionNum = parseInt(position);
                const player = getPlayerAtPosition(positionNum);
                const PositionIcon = getPositionIcon(positionNum);

                // Adjust perspective scale based on Y position (closer = bigger)
                // Inverted Y because 0 is top (far) and 100 is bottom (close)
                // But we want visual consistency, so we might not need heavy scaling if 3D does it naturally.
                // However, counter-rotation is essential.

                return (
                  <div
                    key={position}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 hover:z-50 transition-all duration-300"
                    style={{
                      left: `${coords.x}%`,
                      top: `${coords.y}%`,
                    }}
                  >
                    {/* Counter-rotate container to face camera */}
                    <div className="transform -rotate-x-[25deg] origin-center transition-transform duration-300 hover:scale-110">
                      {player ? (
                        <Popover open={activePlayerCard === positionNum} onOpenChange={(open) => setActivePlayerCard(open ? positionNum : null)}>
                          <PopoverTrigger asChild>
                            <div className="flex flex-col items-center group/card cursor-pointer">
                              {/* Card Body */}
                              <div className={`
                                relative w-20 h-24 
                                bg-gradient-to-b from-gray-800 to-black 
                                border-2 ${player.image ? 'border-blue-500/50' : 'border-gray-600'} 
                                rounded-lg shadow-xl 
                                flex flex-col items-center justify-between p-1
                                overflow-hidden
                                transition-all duration-300
                                hover:border-blue-400 hover:shadow-blue-500/20 hover:-translate-y-2
                              `}>
                                {/* Header (Position) */}
                                <div className="w-full text-center border-b border-white/10 pb-0.5">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {/* Lógica dinâmica de labels baseada na formação */}
                                    {formation === '433' ? (
                                      positionNum <= 4 ? 'DEF' : positionNum <= 7 ? 'MEI' : 'ATA'
                                    ) : formation === '442' ? (
                                      positionNum <= 4 ? 'DEF' : positionNum <= 8 ? 'MEI' : 'ATA'
                                    ) : (
                                      positionNum <= 3 ? 'DEF' : positionNum <= 8 ? 'MEI' : 'ATA'
                                    )}
                                  </span>
                                </div>

                                {/* Player Image/Token */}
                                <div className="flex-1 flex items-center justify-center w-full my-0.5">
                                  {player.image ? (
                                    <div className="relative w-10 h-10 rounded-full bg-white/15 p-0.5 shadow-sm backdrop-blur-sm border border-white/10">
                                      <img
                                        src={player.image}
                                        alt={player.name}
                                        className="w-full h-full rounded-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                      <Shield className="w-5 h-5 text-gray-600" />
                                    </div>
                                  )}
                                </div>

                                {/* Footer (Name/Price) */}
                                <div className="w-full bg-blue-900/40 rounded px-1 min-h-[14px] flex items-center justify-center overflow-hidden">
                                  <span className="text-[9px] font-bold text-white block truncate leading-none pt-0.5">
                                    {player.symbol || '?'}
                                  </span>
                                </div>
                                
                                {/* Top Badge (Points or %7d) */}
                                <div 
                                  className={`absolute top-0 right-0 text-white text-[7px] font-bold px-1 py-[1px] rounded-bl shadow-sm ${
                                    (!competitionStatus || competitionStatus === 'PENDING' || competitionStatus === 'UPCOMING') 
                                      ? ((player.priceChange7d || 0) >= 0 ? 'bg-green-600' : 'bg-red-600')
                                      : ((player.points || 0) >= 0 ? 'bg-green-600' : 'bg-red-600')
                                  }`}
                                  title={(!competitionStatus || competitionStatus === 'PENDING' || competitionStatus === 'UPCOMING') ? "Variação 7 dias" : "Pontos na rodada"}
                                >
                                  {(!competitionStatus || competitionStatus === 'PENDING' || competitionStatus === 'UPCOMING') ? (
                                    `${(player.priceChange7d || 0).toFixed(2)} %7d`
                                  ) : (
                                    `${Number(player.points || 0).toFixed(2)} pts`
                                  )}
                                </div>
                              </div>

                              {/* Base Shadow (Ground) */}
                              <div className="w-16 h-4 bg-black/60 blur-md rounded-full mt-[-8px] -z-10 transform scale-x-150"></div>
                            </div>
                          </PopoverTrigger>

                          <PopoverContent side="top" align="center" className="w-48 p-3 bg-gray-900 border-gray-700 text-white">
                            <div className="font-bold text-base mb-1 text-blue-400">
                              {player.symbol || '?'}
                            </div>
                            {(!competitionStatus || competitionStatus === 'PENDING' || competitionStatus === 'UPCOMING') ? (
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-gray-400">%7d:</span>
                                <span className={`text-sm font-semibold ${
                                  (player.priceChange7d || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {(player.priceChange7d || 0) >= 0 ? '+' : ''}
                                  {(player.priceChange7d || 0).toFixed(2)}%
                                </span>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-gray-400">Pontuação:</span>
                                  <span className="text-sm font-semibold text-white">
                                    {Number(player.points || 0).toFixed(2)} pts
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs text-gray-400">Variação 7d:</span>
                                  <span className={`text-sm font-semibold ${
                                    (player.priceChange7d || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                    {(player.priceChange7d || 0) >= 0 ? '+' : ''}
                                    {(player.priceChange7d || 0).toFixed(2)}%
                                  </span>
                                </div>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-full h-8 text-xs bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800"
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
                        // Empty Slot Card
                        <div
                          className={`
                            relative w-20 h-24 
                            bg-black/40 backdrop-blur-sm
                            border-2 border-dashed ${
                              dragOverPosition === positionNum ? 'border-blue-400 bg-blue-900/40' : 
                              selectedPosition === positionNum ? 'border-yellow-400 bg-yellow-900/20' : 'border-white/20'
                            }
                            rounded-lg 
                            flex flex-col items-center justify-center gap-2
                            cursor-pointer transition-all duration-200
                            hover:border-white/50 hover:bg-white/5 hover:-translate-y-1
                          `}
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
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {formation === '433' ? (
                              positionNum <= 4 ? 'DEF' : positionNum <= 7 ? 'MEI' : 'ATA'
                            ) : formation === '442' ? (
                              positionNum <= 4 ? 'DEF' : positionNum <= 8 ? 'MEI' : 'ATA'
                            ) : (
                              positionNum <= 3 ? 'DEF' : positionNum <= 8 ? 'MEI' : 'ATA'
                            )}
                          </div>
                          
                          <div className={`
                            w-8 h-8 rounded-full border border-white/20 flex items-center justify-center
                            ${selectedPosition === positionNum ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/50'}
                          `}>
                            <Plus className="w-4 h-4" />
                          </div>

                          {dragOverPosition === positionNum && (
                            <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 rounded-lg">
                              <span className="text-[10px] font-bold text-blue-200 animate-pulse">SOLTAR</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formation Indicator (Floating) */}
            <div className="absolute top-4 left-4 z-20">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-bold text-white tracking-widest font-mono">
                  {formation.split('').join('-')}
                </span>
              </div>
            </div>

            {/* League Logo / Watermark Removed */}
          </div>
        </CardContent>
      </Card>


    </div>
  );
}
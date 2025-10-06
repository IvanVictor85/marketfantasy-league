'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mascot } from '@/types/teams';
import { MASCOT_ANIMALS, MASCOT_ACCESSORIES } from '@/data/mascot-options';

interface MascotPreviewProps {
  mascot: Mascot;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export function MascotPreview({ mascot, size = 'md', showDetails = true }: MascotPreviewProps) {
  const animal = MASCOT_ANIMALS.find(a => a.id === mascot.animal);
  const hat = MASCOT_ACCESSORIES.hats.find(h => h.id === mascot.accessories.hat);
  const glasses = MASCOT_ACCESSORIES.glasses.find(g => g.id === mascot.accessories.glasses);
  const shoes = MASCOT_ACCESSORIES.shoes.find(s => s.id === mascot.accessories.shoes);

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  };

  const textSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl'
  };

  return (
    <div className="space-y-4">
      {/* Preview Card */}
      <Card className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Mascot Visual */}
          <div 
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center relative overflow-hidden`}
            style={{
              background: `linear-gradient(135deg, ${mascot.colors.primary} 0%, ${mascot.colors.secondary} 100%)`,
              border: `3px solid ${mascot.colors.accent}`
            }}
          >
            {/* Animal */}
            <div className={`${textSizes[size]} relative z-10`}>
              {animal?.emoji || '🐕'}
            </div>

            {/* Hat Accessory */}
            {hat && hat.id !== 'none' && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-lg">
                {hat.emoji}
              </div>
            )}

            {/* Glasses Accessory */}
            {glasses && glasses.id !== 'none' && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg">
                {glasses.emoji}
              </div>
            )}

            {/* Shoes at bottom */}
            {shoes && shoes.id !== 'none' && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-sm">
                {shoes.emoji}
              </div>
            )}
          </div>

          {/* Football Shirt */}
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-6 rounded-sm flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: mascot.colors.primary }}
            >
              ⚽
            </div>
            <span className="text-sm text-muted-foreground">Camisa do Time</span>
          </div>

          {/* Football */}
          {mascot.ball && (
            <div className="text-2xl">⚽</div>
          )}

          {/* Pose Indicator */}
          <Badge variant="outline" className="text-xs">
            {mascot.pose === 'celebrating' && '🙌 Comemorando'}
            {mascot.pose === 'playing' && '⚽ Jogando'}
            {mascot.pose === 'thinking' && '🤔 Pensando'}
            {mascot.pose === 'strong' && '💪 Forte'}
            {mascot.pose === 'default' && '😊 Padrão'}
          </Badge>
        </div>
      </Card>

      {/* Details */}
      {showDetails && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Detalhes do Mascote</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Animal:</span>
              <span>{animal?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cores:</span>
              <div className="flex gap-1">
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: mascot.colors.primary }}
                  title="Primária"
                />
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: mascot.colors.secondary }}
                  title="Secundária"
                />
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: mascot.colors.accent }}
                  title="Destaque"
                />
              </div>
            </div>
            {hat && hat.id !== 'none' && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chapéu:</span>
                <span>{hat.name}</span>
              </div>
            )}
            {glasses && glasses.id !== 'none' && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Óculos:</span>
                <span>{glasses.name}</span>
              </div>
            )}
            {shoes && shoes.id !== 'none' && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Calçados:</span>
                <span>{shoes.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bola:</span>
              <span>{mascot.ball ? 'Sim' : 'Não'}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
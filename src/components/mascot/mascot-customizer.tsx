'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  MASCOT_ANIMALS, 
  MASCOT_COLORS, 
  MASCOT_ACCESSORIES, 
  MASCOT_POSES,
  DEFAULT_MASCOT 
} from '@/data/mascot-options';
import { Mascot } from '@/types/teams';

interface MascotCustomizerProps {
  mascot: Mascot;
  onMascotChange: (mascot: Mascot) => void;
}

export function MascotCustomizer({ mascot, onMascotChange }: MascotCustomizerProps) {
  const [currentMascot, setCurrentMascot] = useState<Mascot>(mascot);

  const updateMascot = (updates: Partial<Mascot>) => {
    const newMascot = { ...currentMascot, ...updates };
    setCurrentMascot(newMascot);
    onMascotChange(newMascot);
  };

  const updateColors = (colorType: keyof Mascot['colors'], color: string) => {
    const newColors = { ...currentMascot.colors, [colorType]: color };
    updateMascot({ colors: newColors });
  };

  const updateAccessories = (accessoryType: keyof Mascot['accessories'], accessory: string) => {
    const newAccessories = { ...currentMascot.accessories, [accessoryType]: accessory };
    updateMascot({ accessories: newAccessories });
  };

  const resetToDefault = () => {
    setCurrentMascot(DEFAULT_MASCOT);
    onMascotChange(DEFAULT_MASCOT);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Customize seu Mascote</h3>
          <p className="text-sm text-muted-foreground">
            Personalize seu mascote com animal, cores e acessórios
          </p>
        </div>
        <Button variant="outline" onClick={resetToDefault}>
          Resetar Padrão
        </Button>
      </div>

      {/* Animal Selection */}
      <Card className="p-4">
        <Label className="text-base font-medium mb-3 block">Animal</Label>
        <div className="grid grid-cols-4 gap-2">
          {MASCOT_ANIMALS.map((animal) => (
            <Button
              key={animal.id}
              variant={currentMascot.animal === animal.id ? "default" : "outline"}
              className="h-16 flex-col gap-1"
              onClick={() => updateMascot({ animal: animal.id })}
            >
              <span className="text-2xl">{animal.emoji}</span>
              <span className="text-xs">{animal.name}</span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Colors */}
      <Card className="p-4">
        <Label className="text-base font-medium mb-3 block">Cores</Label>
        <div className="space-y-4">
          {/* Primary Color */}
          <div>
            <Label className="text-sm mb-2 block">Cor Primária</Label>
            <div className="grid grid-cols-5 gap-2">
              {MASCOT_COLORS.map((color) => (
                <Button
                  key={color.id}
                  variant="outline"
                  className="h-12 p-1"
                  onClick={() => updateColors('primary', color.hex)}
                >
                  <div 
                    className="w-full h-full rounded border-2"
                    style={{ 
                      backgroundColor: color.hex,
                      borderColor: currentMascot.colors.primary === color.hex ? 'hsl(var(--foreground))' : 'transparent'
                    }}
                  />
                </Button>
              ))}
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <Label className="text-sm mb-2 block">Cor Secundária</Label>
            <div className="grid grid-cols-5 gap-2">
              {MASCOT_COLORS.map((color) => (
                <Button
                  key={color.id}
                  variant="outline"
                  className="h-12 p-1"
                  onClick={() => updateColors('secondary', color.hex)}
                >
                  <div 
                    className="w-full h-full rounded border-2"
                    style={{ 
                      backgroundColor: color.hex,
                      borderColor: currentMascot.colors.secondary === color.hex ? 'hsl(var(--foreground))' : 'transparent'
                    }}
                  />
                </Button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <Label className="text-sm mb-2 block">Cor de Destaque</Label>
            <div className="grid grid-cols-5 gap-2">
              {MASCOT_COLORS.map((color) => (
                <Button
                  key={color.id}
                  variant="outline"
                  className="h-12 p-1"
                  onClick={() => updateColors('accent', color.hex)}
                >
                  <div 
                    className="w-full h-full rounded border-2"
                    style={{ 
                      backgroundColor: color.hex,
                      borderColor: currentMascot.colors.accent === color.hex ? 'hsl(var(--foreground))' : 'transparent'
                    }}
                  />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Accessories */}
      <Card className="p-4">
        <Label className="text-base font-medium mb-3 block">Acessórios</Label>
        <div className="space-y-4">
          {/* Hats */}
          <div>
            <Label className="text-sm mb-2 block">Chapéus</Label>
            <div className="grid grid-cols-5 gap-2">
              {MASCOT_ACCESSORIES.hats.map((hat) => (
                <Button
                  key={hat.id}
                  variant={currentMascot.accessories.hat === hat.id ? "default" : "outline"}
                  className="h-12 flex-col gap-1"
                  onClick={() => updateAccessories('hat', hat.id)}
                >
                  <span className="text-lg">{hat.emoji || '❌'}</span>
                  <span className="text-xs">{hat.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Glasses */}
          <div>
            <Label className="text-sm mb-2 block">Óculos</Label>
            <div className="grid grid-cols-4 gap-2">
              {MASCOT_ACCESSORIES.glasses.map((glasses) => (
                <Button
                  key={glasses.id}
                  variant={currentMascot.accessories.glasses === glasses.id ? "default" : "outline"}
                  className="h-12 flex-col gap-1"
                  onClick={() => updateAccessories('glasses', glasses.id)}
                >
                  <span className="text-lg">{glasses.emoji || '❌'}</span>
                  <span className="text-xs">{glasses.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Shoes */}
          <div>
            <Label className="text-sm mb-2 block">Calçados</Label>
            <div className="grid grid-cols-4 gap-2">
              {MASCOT_ACCESSORIES.shoes.map((shoes) => (
                <Button
                  key={shoes.id}
                  variant={currentMascot.accessories.shoes === shoes.id ? "default" : "outline"}
                  className="h-12 flex-col gap-1"
                  onClick={() => updateAccessories('shoes', shoes.id)}
                >
                  <span className="text-lg">{shoes.emoji || '❌'}</span>
                  <span className="text-xs">{shoes.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Pose */}
      <Card className="p-4">
        <Label className="text-base font-medium mb-3 block">Pose</Label>
        <div className="grid grid-cols-2 gap-2">
          {MASCOT_POSES.map((pose) => (
            <Button
              key={pose.id}
              variant={currentMascot.pose === pose.id ? "default" : "outline"}
              className="h-16 flex-col gap-1"
              onClick={() => updateMascot({ pose: pose.id })}
            >
              <span className="font-medium">{pose.name}</span>
              <span className="text-xs text-muted-foreground">{pose.description}</span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Ball Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Bola de Futebol</Label>
            <p className="text-sm text-muted-foreground">
              Mostrar bola de futebol com o mascote
            </p>
          </div>
          <Switch
            checked={currentMascot.ball}
            onCheckedChange={(checked) => updateMascot({ ball: checked })}
          />
        </div>
      </Card>

      {/* Current Configuration */}
      <Card className="p-4 bg-muted/50">
        <Label className="text-base font-medium mb-3 block">Configuração Atual</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Animal:</Badge>
            <span className="text-sm">
              {MASCOT_ANIMALS.find(a => a.id === currentMascot.animal)?.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Pose:</Badge>
            <span className="text-sm">
              {MASCOT_POSES.find(p => p.id === currentMascot.pose)?.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Bola:</Badge>
            <span className="text-sm">{currentMascot.ball ? 'Sim' : 'Não'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
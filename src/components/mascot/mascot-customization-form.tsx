'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export interface MascotFormData {
  character: string;
  uniformStyle: string;
  accessory: string;
}

interface MascotCustomizationFormProps {
  onGenerate: (data: MascotFormData) => void;
  isGenerating: boolean;
  initialData?: Partial<MascotFormData>;
}

export function MascotCustomizationForm({
  onGenerate,
  isGenerating,
  initialData = {}
}: MascotCustomizationFormProps) {
  const t = useTranslations('ProfilePage');

  const UNIFORM_STYLES = [
    { value: 'classic-cfl', label: t('uniformCFL') },
    { value: 'vibrant-solana', label: t('uniformSolana') },
    { value: 'elegant-ethereum', label: t('uniformEth') },
    { value: 'golden-bitcoin', label: t('uniformBtc') },
    { value: 'neon-polygon', label: t('uniformPolygon') },
    { value: 'cosmic-cardano', label: t('uniformCardano') },
  ];

  const [formData, setFormData] = useState<MascotFormData>({
    character: initialData.character || '',
    uniformStyle: initialData.uniformStyle || '',
    accessory: initialData.accessory || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (!formData.character.trim()) {
      alert(t('characterRequired'));
      return;
    }

    if (!formData.uniformStyle) {
      alert(t('uniformRequired'));
      return;
    }

    onGenerate(formData);
  };

  const handleInputChange = (field: keyof MascotFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFormValid = formData.character.trim() && formData.uniformStyle;

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo 1: Personagem Principal */}
          <div className="space-y-2">
            <Label htmlFor="character" className="text-sm font-medium">
              {t('characterLabel')}
            </Label>
            <Input
              id="character"
              type="text"
              placeholder={t('characterPlaceholder')}
              value={formData.character}
              onChange={(e) => handleInputChange('character', e.target.value)}
              disabled={isGenerating}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {t('characterHelp')}
            </p>
          </div>

          {/* Campo 2: Estilo do Uniforme */}
          <div className="space-y-2">
            <Label htmlFor="uniform-style" className="text-sm font-medium">
              {t('uniformLabel')}
            </Label>
            <Select
              value={formData.uniformStyle}
              onValueChange={(value) => handleInputChange('uniformStyle', value)}
              disabled={isGenerating}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('uniformPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {UNIFORM_STYLES.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('uniformHelp')}
            </p>
          </div>

          {/* Campo 3: Acessório Especial */}
          <div className="space-y-2">
            <Label htmlFor="accessory" className="text-sm font-medium">
              {t('accessoryLabel')}
            </Label>
            <Input
              id="accessory"
              type="text"
              placeholder={t('accessoryPlaceholder')}
              value={formData.accessory}
              onChange={(e) => handleInputChange('accessory', e.target.value)}
              disabled={isGenerating}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {t('accessoryHelp')}
            </p>
          </div>

          {/* Botão de Ação */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={!isFormValid || isGenerating}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('generating')}</span>
                </div>
              ) : (
                t('generateButton')
              )}
            </Button>
          </div>

          {/* Informações adicionais */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-start space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 mt-0.5 flex-shrink-0"></div>
              <p className="text-xs text-muted-foreground">
                {t('tip')}
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-4 h-4 rounded-full bg-orange-500 mt-0.5 flex-shrink-0"></div>
              <p className="text-xs text-muted-foreground">
                {t('reminder')}
              </p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
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

const UNIFORM_STYLES = [
  { value: 'classic-cfl', label: 'Clássico CFL (Laranja & Roxo)' },
  { value: 'vibrant-solana', label: 'Vibrante Solana (Roxo & Verde)' },
  { value: 'elegant-ethereum', label: 'Elegante Ethereum (Preto & Roxo)' },
  { value: 'golden-bitcoin', label: 'Dourado Bitcoin (Ouro & Preto)' },
  { value: 'neon-polygon', label: 'Neon Polygon (Roxo & Rosa)' },
  { value: 'cosmic-cardano', label: 'Cósmico Cardano (Azul & Prata)' },
];

export function MascotCustomizationForm({ 
  onGenerate, 
  isGenerating, 
  initialData = {} 
}: MascotCustomizationFormProps) {
  const [formData, setFormData] = useState<MascotFormData>({
    character: initialData.character || '',
    uniformStyle: initialData.uniformStyle || '',
    accessory: initialData.accessory || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.character.trim()) {
      alert('Por favor, descreva seu personagem principal.');
      return;
    }
    
    if (!formData.uniformStyle) {
      alert('Por favor, escolha um estilo de uniforme.');
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
              Qual é o seu personagem?
            </Label>
            <Input
              id="character"
              type="text"
              placeholder="Ex: Cachorro Shiba Inu, Unicórnio, Leão, Astronauta..."
              value={formData.character}
              onChange={(e) => handleInputChange('character', e.target.value)}
              disabled={isGenerating}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Descreva o personagem principal do seu mascote
            </p>
          </div>

          {/* Campo 2: Estilo do Uniforme */}
          <div className="space-y-2">
            <Label htmlFor="uniform-style" className="text-sm font-medium">
              Escolha o Uniforme
            </Label>
            <Select
              value={formData.uniformStyle}
              onValueChange={(value) => handleInputChange('uniformStyle', value)}
              disabled={isGenerating}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um estilo de uniforme..." />
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
              O uniforme define as cores principais do seu mascote
            </p>
          </div>

          {/* Campo 3: Acessório Especial */}
          <div className="space-y-2">
            <Label htmlFor="accessory" className="text-sm font-medium">
              Adicione um Acessório Único (Opcional)
            </Label>
            <Input
              id="accessory"
              type="text"
              placeholder="Ex: Óculos de sol futuristas, Touca de crochê rosa..."
              value={formData.accessory}
              onChange={(e) => handleInputChange('accessory', e.target.value)}
              disabled={isGenerating}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Adicione um toque especial ao seu mascote (opcional)
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
                  <span>Gerando Mascote...</span>
                </div>
              ) : (
                'Atualizar Mascote'
              )}
            </Button>
          </div>

          {/* Informações adicionais */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-start space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 mt-0.5 flex-shrink-0"></div>
              <p className="text-xs text-muted-foreground">
                <strong>Dica:</strong> Seja criativo! Quanto mais detalhes você fornecer, mais único será seu mascote.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-4 h-4 rounded-full bg-orange-500 mt-0.5 flex-shrink-0"></div>
              <p className="text-xs text-muted-foreground">
                <strong>Lembre-se:</strong> O mascote só será salvo permanentemente quando você clicar em &quot;Salvar Alterações&quot;.
              </p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
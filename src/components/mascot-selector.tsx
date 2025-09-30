'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface MascotSelectorProps {
  selectedMascot?: string;
  onMascotSelect: (mascotUrl: string) => void;
  title?: string;
  description?: string;
  className?: string;
}

// Lista dos mascotes disponíveis
const AVAILABLE_MASCOTS = [
  {
    url: '/mascots/Gemini_Generated_Image_c6qn3c6qn3c6qn3c.png',
    name: 'Bitcoin Viking',
    description: 'Guerreiro das criptomoedas'
  },
  {
    url: '/mascots/Gemini_Generated_Image_9vccj59vccj59vcc.png',
    name: 'Ethereum Crystal Dog',
    description: 'Guardião dos contratos inteligentes'
  },
  {
    url: '/mascots/Gemini_Generated_Image_frnm54frnm54frnm.png',
    name: 'Shiba Inu Técnico',
    description: 'Especialista em análise técnica'
  },
  {
    url: '/mascots/Gemini_Generated_Image_liy5euliy5euliy5.png',
    name: 'Gato Solana Gamer',
    description: 'Velocidade e performance'
  },
  {
    url: '/mascots/Gemini_Generated_Image_pzsw7rpzsw7rpzsw.png',
    name: 'Dogecoin Campeão',
    description: 'Sempre otimista e vencedor'
  },
  {
    url: '/mascots/Gemini_Generated_Image_sqoarjsqoarjsqoa (1).png',
    name: 'Fantasy Trader',
    description: 'Mestre do trading fantasy'
  },
  {
    url: '/mascots/Gemini_Generated_Image_veg2o5veg2o5veg2.png',
    name: 'Liga Competitiva',
    description: 'Espírito competitivo'
  },
  {
    url: '/mascots/Gemini_Generated_Image_vkzl1dvkzl1dvkzl.png',
    name: 'Analytics Expert',
    description: 'Dados e estatísticas'
  },
  {
    url: '/mascots/Gemini_Generated_Image_vslemvvslemvvsle.png',
    name: 'Real Time Speedster',
    description: 'Informações em tempo real'
  },
  {
    url: '/mascots/Gemini_Generated_Image_xqhm8nxqhm8nxqhm.png',
    name: 'Crypto Guardian',
    description: 'Protetor das criptomoedas'
  }
];

export function MascotSelector({
  selectedMascot,
  onMascotSelect,
  title = "Escolha seu Mascote",
  description = "Selecione um mascote para representar sua equipe",
  className = ""
}: MascotSelectorProps) {
  const [hoveredMascot, setHoveredMascot] = useState<string | null>(null);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {AVAILABLE_MASCOTS.map((mascot) => (
          <Card
            key={mascot.url}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative ${
              selectedMascot === mascot.url
                ? 'ring-2 ring-blue-500 bg-blue-50'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onMascotSelect(mascot.url)}
            onMouseEnter={() => setHoveredMascot(mascot.url)}
            onMouseLeave={() => setHoveredMascot(null)}
          >
            <CardContent className="p-4 text-center">
              {/* Selected Badge */}
              {selectedMascot === mascot.url && (
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge className="bg-blue-500 text-white rounded-full p-1">
                    <Check className="w-3 h-3" />
                  </Badge>
                </div>
              )}

              {/* Mascot Image */}
              <div className="mb-3">
                <Image
                  src={mascot.url}
                  alt={mascot.name}
                  width={80}
                  height={80}
                  className="mx-auto object-contain filter drop-shadow-lg transition-transform duration-300 hover:scale-110"
                />
              </div>

              {/* Mascot Info */}
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                  {mascot.name}
                </h4>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {mascot.description}
                </p>
              </div>

              {/* Hover Effect */}
              {hoveredMascot === mascot.url && (
                <div className="absolute inset-0 bg-blue-500/10 rounded-lg pointer-events-none" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Mascot Preview */}
      {selectedMascot && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-4">
            <Image
              src={selectedMascot}
              alt="Mascote selecionado"
              width={60}
              height={60}
              className="object-contain filter drop-shadow-lg"
            />
            <div>
              <h4 className="font-semibold text-blue-900">Mascote Selecionado</h4>
              <p className="text-sm text-blue-700">
                {AVAILABLE_MASCOTS.find(m => m.url === selectedMascot)?.name}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
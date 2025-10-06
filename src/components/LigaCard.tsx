'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Coins } from 'lucide-react';

interface LigaCardProps {
  id: string;
  name: string;
  type: 'principal' | 'comunidade';
  logoUrl: string;
  entryFee: {
    amount: number;
    currency: string;
  };
  prizePool: {
    amount: number;
    currency: string;
  };
  participants: number;
  maxParticipants: number;
}

export function LigaCard({
  id,
  name,
  type,
  logoUrl,
  entryFee,
  prizePool,
  participants,
  maxParticipants
}: LigaCardProps) {
  const isPrincipal = type === 'principal';

  // Define o logo padrão para a liga principal com cache-busting
  const defaultLogoUrl = isPrincipal ? `/league-logos/main-league-trophy.png?v=${Date.now()}` : '';
  const finalLogoUrl = logoUrl || defaultLogoUrl;

  return (
    <Card 
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all ${
        isPrincipal ? 'border-[#F4A261] border-2' : 'border-slate-200 hover:border-[#2A9D8F]'
      }`}
    >
      <CardHeader className="pb-2 pt-3 px-2 flex items-center justify-center">
        <div className="relative w-56 h-56 bg-transparent flex items-center justify-center">
          {finalLogoUrl ? (
            <Image 
              src={finalLogoUrl} 
              alt={`Logo da liga ${name}`} 
              fill 
              className="object-contain"
            />
          ) : (
            <Trophy className="h-8 w-8 text-[#2A9D8F]" />
          )}
        </div>
        {isPrincipal && (
          <span className="absolute top-2 right-2 bg-[#E9C46A] text-white text-xs font-bold px-2 py-1 rounded-full">
            Oficial
          </span>
        )}
        {type === 'comunidade' && (
          <span className="absolute top-2 right-2 bg-slate-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            Comunidade
          </span>
        )}
      </CardHeader>
      
      <CardContent className="pb-4">
        <h3 className="text-xl font-bold text-center text-slate-800 mb-4">{name}</h3>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-[#2A9D8F]" />
            <span className="text-sm text-slate-600">Entrada:</span>
          </div>
          <div className="text-sm font-medium text-slate-800">
            {entryFee.amount} {entryFee.currency}
          </div>
          
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-[#2A9D8F]" />
            <span className="text-sm text-slate-600">Prêmio:</span>
          </div>
          <div className="text-sm font-medium text-slate-800">
            {prizePool.amount} {prizePool.currency}
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-[#2A9D8F]" />
            <span className="text-sm text-slate-600">Participantes:</span>
          </div>
          <div className="text-sm font-medium text-slate-800">
            {participants} / {maxParticipants}
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button asChild className="w-full bg-[#2A9D8F] hover:bg-[#2A9D8F]/90 text-white">
          <Link href={`/teams?league=${id}`}>
            Entrar na Liga
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
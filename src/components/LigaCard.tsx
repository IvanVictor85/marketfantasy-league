'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LocalizedLink } from '@/components/ui/localized-link';
import { Trophy, Users, Coins } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations("LeaguesPage");
  const isPrincipal = type === 'principal';

  // Define o logo padrão para a liga principal
  const defaultLogoUrl = isPrincipal ? `/league-logos/main-league-trophy.png` : '';
  const finalLogoUrl = logoUrl || defaultLogoUrl;

  return (
    <Card 
      className={`bg-card rounded-xl shadow-md hover:shadow-lg transition-all ${
        isPrincipal ? 'border-accent border-2' : 'border-border hover:border-primary'
      }`}
    >
      <CardHeader className="pb-2 pt-3 px-2 flex items-center justify-center relative">
        <div className="relative w-56 h-56 bg-transparent flex items-center justify-center">
          {finalLogoUrl ? (
            <Image 
              src={finalLogoUrl} 
              alt={`Logo da liga ${name}`} 
              fill 
              className="object-contain"
            />
          ) : (
            <Trophy className="h-8 w-8 text-accent" />
          )}
        </div>
        {isPrincipal && (
          <span className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-full">
            {t("official")}
          </span>
        )}
        {type === 'comunidade' && (
          <span className="absolute top-2 right-2 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-full">
            {t("community")}
          </span>
        )}
      </CardHeader>
      
      <CardContent className="pb-4">
        <h3 className="text-xl font-bold text-center text-card-foreground mb-4">{name}</h3>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-accent" />
            <span className="text-sm text-muted-foreground">{t("entry")}:</span>
          </div>
          <div className="text-sm font-medium text-card-foreground">
            {entryFee.amount} {entryFee.currency}
          </div>
          
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-accent" />
            <span className="text-sm text-muted-foreground">{t("totalPrize")}:</span>
          </div>
          <div className="text-sm font-medium text-card-foreground">
            {prizePool.amount} {prizePool.currency}
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-accent" />
            <span className="text-sm text-muted-foreground">{t("participants")}:</span>
          </div>
          <div className="text-sm font-medium text-card-foreground">
            {participants} / {maxParticipants}
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <LocalizedLink href={`/teams?league=${id}`}>
            {t("joinLeague")}
          </LocalizedLink>
        </Button>
      </CardFooter>
    </Card>
  );
}

'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { useRoundTimer } from '@/hooks/useRoundTimer';
import { useTranslations } from 'next-intl';
import { isRodadaEmAndamento } from '@/lib/utils/timeCheck';

interface CountdownTimerProps {
  leagueId?: string;
  className?: string;
}

export function CountdownTimer({ leagueId = 'main-league', className = '' }: CountdownTimerProps) {
  const t = useTranslations('teams');
  const tCommon = useTranslations('common');
  const { timeRemaining, loading } = useRoundTimer({ leagueId });

  // Usar a lógica correta de horário (Sáb/Dom = Mercado Aberto)
  const rodadaAtiva = isRodadaEmAndamento();
  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-gray-400 font-semibold ${className}`}>
        <Clock className="h-4 w-4 animate-pulse" />
        <span>{tCommon('loading')}</span>
      </div>
    );
  }

  if (rodadaAtiva) {
    return (
      <div className={`flex items-center gap-2 text-red-600 font-semibold ${className}`}>
        <Clock className="h-4 w-4" />
        <span>🔴 {t('roundInProgressTime')}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-green-600 font-semibold ${className}`}>
      <Clock className="h-4 w-4" />
      <span>🟢 {t('nextRoundStartsIn')}</span>
      <div className="flex items-center gap-1 font-mono text-sm">
        <span className="bg-green-100 px-2 py-1 rounded">
          {timeRemaining.days.toString().padStart(2, '0')}
        </span>
        <span>:</span>
        <span className="bg-green-100 px-2 py-1 rounded">
          {timeRemaining.hours.toString().padStart(2, '0')}
        </span>
        <span>:</span>
        <span className="bg-green-100 px-2 py-1 rounded">
          {timeRemaining.minutes.toString().padStart(2, '0')}
        </span>
        <span>:</span>
        <span className="bg-green-100 px-2 py-1 rounded">
          {timeRemaining.seconds.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

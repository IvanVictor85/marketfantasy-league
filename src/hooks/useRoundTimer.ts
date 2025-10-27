'use client';

import { useState, useEffect } from 'react';
import { useCompetitionStatus } from './useCompetitionStatus';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

interface UseRoundTimerOptions {
  leagueId?: string;
  enabled?: boolean;
}

/**
 * Hook unificado para gerenciar o timer da rodada
 * Usa a data de início da próxima rodada (startTime) como referência
 */
export function useRoundTimer({ leagueId = 'main-league', enabled = true }: UseRoundTimerOptions = {}) {
  const { competition, loading, error } = useCompetitionStatus({
    competitionId: leagueId,
    enabled
  });

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0
  });

  useEffect(() => {
    if (!enabled) return;

    const calculateTimeRemaining = (): TimeRemaining => {
      const now = new Date();
      
      // 🎯 LÓGICA: Calcular tempo até as 21:00 de AMANHÃ (início da próxima rodada)
      // Horário de Brasília (GMT-3)
      const brasiliaOffset = -3 * 60; // -3 horas em minutos
      const localOffset = now.getTimezoneOffset(); // offset do navegador
      const offsetDiff = localOffset - brasiliaOffset;
      
      // Ajustar para horário de Brasília
      const nowBrasilia = new Date(now.getTime() + offsetDiff * 60 * 1000);
      
      // ✅ SEMPRE calcular para AMANHÃ às 21:00
      const nextRoundStart = new Date(nowBrasilia);
      nextRoundStart.setDate(nextRoundStart.getDate() + 1); // AMANHÃ
      nextRoundStart.setHours(21, 0, 0, 0); // 21:00
      
      // Calcular diferença
      const difference = nextRoundStart.getTime() - nowBrasilia.getTime();

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        totalMs: difference
      };
    };

    // Atualiza imediatamente
    setTimeRemaining(calculateTimeRemaining());

    // Atualiza a cada segundo
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, [enabled]);

  // Formata o tempo para exibição
  const formatTime = (includeSeconds = false): string => {
    const { days, hours, minutes, seconds } = timeRemaining;
    
    if (days > 0) {
      return includeSeconds 
        ? `${days}d ${hours}h ${minutes}m ${seconds}s`
        : `${days}d ${hours}h ${minutes}m`;
    }
    
    if (hours > 0) {
      return includeSeconds
        ? `${hours}h ${minutes}m ${seconds}s`
        : `${hours}h ${minutes}m`;
    }
    
    if (minutes > 0) {
      return includeSeconds
        ? `${minutes}m ${seconds}s`
        : `${minutes}m`;
    }
    
    return `${seconds}s`;
  };

  return {
    timeRemaining,
    formatTime,
    competition,
    loading,
    error,
    isExpired: timeRemaining.totalMs <= 0
  };
}


'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  CheckCircle,
  Clock,
  Lock,
  Trophy,
  ChevronRight,
  Copy,
  Plus,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { SeasonSelector } from './season-selector';

interface Competition {
  id: string;
  name: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  startDate: Date;
  endDate: Date;
  seasonId?: string;
  hasTeam?: boolean;
  hasPaid?: boolean;
  isEnrolled?: boolean;
}

// ✅ Dados de inscrição passados junto com a seleção para evitar chamadas duplicadas
export interface CompetitionEnrollmentData {
  hasPaid: boolean;
  hasTeam: boolean;
  isEnrolled: boolean;
}

interface CompetitionNavigatorProps {
  leagueId: string;
  currentCompetitionId?: string;
  onSelectCompetition: (competitionId: string, enrollmentData?: CompetitionEnrollmentData) => void;
  onCopyFromPrevious?: (competitionId: string) => void;
  className?: string;
  refreshTrigger?: number; // Incrementar este valor para forçar reload
}

export function CompetitionNavigator({
  leagueId,
  currentCompetitionId,
  onSelectCompetition,
  onCopyFromPrevious,
  className,
  refreshTrigger
}: CompetitionNavigatorProps) {
  const t = useTranslations('competitions');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEnrollments, setUserEnrollments] = useState<Record<string, boolean>>({});
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentCompetitionId && scrollContainerRef.current && filteredCompetitions.length > 0) {
      const selectedElement = document.getElementById(`comp-${currentCompetitionId}`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentCompetitionId, filteredCompetitions.length]);

  useEffect(() => {
    loadCompetitions();
  }, [leagueId, refreshTrigger]);

  // Filtrar competições por temporada
  useEffect(() => {
    if (!selectedSeasonId) {
      setFilteredCompetitions(competitions);
      return;
    }

    const filtered = competitions.filter(comp => {
      // Assumimos que competitions já vem com seasonId da API
      return (comp as any).seasonId === selectedSeasonId;
    });
    setFilteredCompetitions(filtered);
  }, [selectedSeasonId, competitions]);

  async function loadCompetitions() {
    try {
      setLoading(true);

      // 1. Buscar todas as competições da liga
      const response = await fetch(`/api/competitions?leagueId=${leagueId}`);
      if (!response.ok) throw new Error('Failed to fetch competitions');

      const data = await response.json();

      // 2. Buscar status de inscrição E time do usuário em cada rodada
      // ✅ PERFORMANCE FIX: Sequential requests ao invés de Promise.all() para evitar Rate Limit 429
      const enrollments = [];
      for (const comp of data.competitions) {
        try {
          const checkResponse = await fetch('/api/league/check-entry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ competitionId: comp.id })
          });

          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            enrollments.push({
              compId: comp.id,
              hasPaid: checkData.hasPaid,
              hasTeam: checkData.hasTeam,
              enrolled: checkData.hasPaid || checkData.hasTeam
            });
          } else {
            enrollments.push({ compId: comp.id, hasPaid: false, hasTeam: false, enrolled: false });
          }
        } catch {
          enrollments.push({ compId: comp.id, hasPaid: false, hasTeam: false, enrolled: false });
        }
      }
      const enrollmentMap = enrollments.reduce((acc, curr) => {
        acc[curr.compId] = curr.enrolled;
        return acc;
      }, {} as Record<string, boolean>);

      setUserEnrollments(enrollmentMap);
      const loadedCompetitions = data.competitions.map((c: any) => {
        const enrollment = enrollments.find(e => e.compId === c.id);
        return {
          ...c,
          startDate: new Date(c.startDate),
          endDate: new Date(c.endDate),
          seasonId: c.seasonId,
          isEnrolled: enrollment?.enrolled || false,
          hasPaid: enrollment?.hasPaid || false,
          hasTeam: enrollment?.hasTeam || false
        };
      }).sort((a: Competition, b: Competition) => a.startDate.getTime() - b.startDate.getTime());

      setCompetitions(loadedCompetitions);

      // Auto-selecionar temporada da primeira competição ACTIVE ou mais recente
      if (!selectedSeasonId && loadedCompetitions.length > 0) {
        const activeComp = loadedCompetitions.find((c: Competition) => c.status === 'ACTIVE');
        const defaultComp = activeComp || loadedCompetitions[0];
        if (defaultComp.seasonId) {
          setSelectedSeasonId(defaultComp.seasonId);
        }
      }

      // ✅ UX FIX: Auto-selecionar rodada se nenhuma estiver selecionada
      // Usar setTimeout para garantir que o estado já foi atualizado antes de auto-selecionar
      if (!currentCompetitionId && loadedCompetitions.length > 0) {
        setTimeout(() => {
          console.log('🎯 Auto-selecionando rodada...');

          // ✅ Helper para criar dados de enrollment
          const getEnrollmentData = (comp: Competition): CompetitionEnrollmentData => ({
            hasPaid: comp.hasPaid || false,
            hasTeam: comp.hasTeam || false,
            isEnrolled: comp.isEnrolled || false
          });

          // Prioridade 1: Rodada ACTIVE
          const activeCompetition = loadedCompetitions.find((c: Competition) => c.status === 'ACTIVE');
          if (activeCompetition) {
            console.log('✅ Auto-selecionado: Rodada ACTIVE -', activeCompetition.name, '(com dados de enrollment)');
            onSelectCompetition(activeCompetition.id, getEnrollmentData(activeCompetition));
            return;
          }

          // Prioridade 2: Última COMPLETED com time do usuário (ordem reversa)
          const completedWithTeam = [...loadedCompetitions]
            .reverse()
            .find((c: Competition) => c.status === 'COMPLETED' && c.hasTeam);
          if (completedWithTeam) {
            console.log('✅ Auto-selecionado: Última COMPLETED com time -', completedWithTeam.name, '(com dados de enrollment)');
            onSelectCompetition(completedWithTeam.id, getEnrollmentData(completedWithTeam));
            return;
          }

          // Prioridade 3: Primeira UPCOMING com inscrição
          const upcomingWithEnrollment = loadedCompetitions.find(
            (c: Competition) => c.status === 'UPCOMING' && c.isEnrolled
          );
          if (upcomingWithEnrollment) {
            console.log('✅ Auto-selecionado: Primeira UPCOMING com inscrição -', upcomingWithEnrollment.name, '(com dados de enrollment)');
            onSelectCompetition(upcomingWithEnrollment.id, getEnrollmentData(upcomingWithEnrollment));
            return;
          }

          // Prioridade 4: Primeira UPCOMING sem inscrição
          const firstUpcoming = loadedCompetitions.find((c: Competition) => c.status === 'UPCOMING');
          if (firstUpcoming) {
            console.log('✅ Auto-selecionado: Primeira UPCOMING -', firstUpcoming.name, '(com dados de enrollment)');
            onSelectCompetition(firstUpcoming.id, getEnrollmentData(firstUpcoming));
            return;
          }

          // Fallback: Primeira rodada de qualquer tipo
          console.log('✅ Auto-selecionado: Primeira rodada (fallback) -', loadedCompetitions[0].name, '(com dados de enrollment)');
          onSelectCompetition(loadedCompetitions[0].id, getEnrollmentData(loadedCompetitions[0]));
        }, 100);
      }

    } catch (error) {
      console.error('Error loading competitions:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(comp: Competition) {
    if (comp.status === 'ACTIVE') {
      return (
        <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50 text-[11px] font-bold px-2 py-0.5 whitespace-nowrap shadow-sm">
          <Clock className="w-3 h-3 mr-1" />
          {t('statusActive')}
        </Badge>
      );
    }

    if (comp.status === 'COMPLETED') {
      return (
        <Badge className="bg-gray-500/20 text-gray-500 dark:text-gray-400 border-gray-500/50 text-[11px] font-bold px-2 py-0.5 whitespace-nowrap shadow-sm">
          <Trophy className="w-3 h-3 mr-1" />
          {t('statusCompleted')}
        </Badge>
      );
    }

    if (comp.isEnrolled) {
      return (
        <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/50 text-[11px] font-bold px-2 py-0.5 whitespace-nowrap shadow-sm">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t('statusEnrolled')}
        </Badge>
      );
    }

    return (
      <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/50 text-[11px] font-bold px-2 py-0.5 whitespace-nowrap shadow-sm">
        <Calendar className="w-3 h-3 mr-1" />
        {t('statusUpcoming')}
      </Badge>
    );
  }

  function getActionButton(comp: Competition) {
    // Rodada ativa - inscrito pode editar time
    if (comp.status === 'ACTIVE' && comp.isEnrolled) {
      return (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onSelectCompetition(comp.id);
          }}
          size="sm"
          className="bg-green-600 hover:bg-green-700 w-full"
        >
          {t('manageTeam')}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      );
    }

    // Rodada ativa - não inscrito não pode mais se inscrever
    if (comp.status === 'ACTIVE' && !comp.isEnrolled) {
      return (
        <Button
          disabled
          size="sm"
          variant="outline"
          className="border-gray-500/50 text-gray-500 cursor-not-allowed w-full"
        >
          <Lock className="w-4 h-4 mr-1" />
          {t('enrollmentClosed')}
        </Button>
      );
    }

    // Rodada futura - tem time mas não pagou
    if (comp.status === 'UPCOMING' && comp.hasTeam && !comp.hasPaid) {
      return (
        <div className="space-y-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSelectCompetition(comp.id);
            }}
            size="sm"
            variant="outline"
            className="border-blue-500/50 text-blue-600 hover:bg-blue-500/20 w-full"
          >
            {t('editTeam')}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSelectCompetition(comp.id);
            }}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 w-full text-xs"
          >
            {t('payConfirm')}
          </Button>
        </div>
      );
    }

    // Rodada futura - inscrito com pagamento
    if (comp.status === 'UPCOMING' && comp.hasPaid) {
      return (
        <div className="flex gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSelectCompetition(comp.id);
            }}
            size="sm"
            variant="outline"
            className="border-blue-500/50 text-blue-600 hover:bg-blue-500/20 flex-1"
          >
            {t('buildTeam')}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>

          {onCopyFromPrevious && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onCopyFromPrevious(comp.id);
              }}
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-gray-600"
              title={t('copyPrevious')}
            >
              <Copy className="w-4 h-4" />
            </Button>
          )}
        </div>
      );
    }

    // Rodada futura - não inscrito (nem time nem pagamento)
    if (comp.status === 'UPCOMING' && !comp.isEnrolled) {
      return (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onSelectCompetition(comp.id);
          }}
          size="sm"
          variant="outline"
          className="border-orange-500/50 text-orange-600 hover:bg-orange-500/20 w-full"
        >
          {t('enroll')}
          <Plus className="w-4 h-4 ml-1" />
        </Button>
      );
    }

    // Rodada encerrada
    if (comp.status === 'COMPLETED') {
      return (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onSelectCompetition(comp.id);
          }}
          size="sm"
          variant="ghost"
          className="text-gray-500 w-full"
        >
          {t('viewResults')}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      );
    }

    return null;
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (loading) {
    return (
      <Card className="p-6 bg-gray-900/50 border-gray-800">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Seletor de Temporada */}
      <SeasonSelector
        leagueId={leagueId}
        currentSeasonId={selectedSeasonId}
        onSelectSeason={setSelectedSeasonId}
      />

      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {t('title')}
        </h3>
      </div>

      {/* Carrossel de Cards */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto pb-4 gap-3 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent px-1"
      >
        {filteredCompetitions.map((comp) => {
          const isSelected = comp.id === currentCompetitionId;

          return (
            <Card
              key={comp.id}
              id={`comp-${comp.id}`}
              onClick={() => onSelectCompetition(comp.id, {
                hasPaid: comp.hasPaid || false,
                hasTeam: comp.hasTeam || false,
                isEnrolled: comp.isEnrolled || false
              })}
              className={cn(
                "transition-all cursor-pointer snap-center flex-shrink-0 border-2 flex flex-col relative overflow-hidden",
                "min-w-[160px] w-[160px]",
                isSelected 
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md scale-100 z-10" 
                  : "hover:border-gray-500/50 bg-card/50 scale-95 opacity-80 hover:opacity-100 border-transparent",
                comp.isEnrolled && !isSelected && "border-green-500/30 bg-green-50/10"
              )}
            >
              {/* Status Badge Flutuante (Centralizado no Topo) */}
              <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 z-20">
                {getStatusBadge(comp)}
              </div>

              <CardHeader className="px-1 pb-0 space-y-0 flex justify-center pt-4 text-center"> 
                <CardTitle className="text-sm font-bold truncate leading-none w-full">
                  {comp.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="px-1 pb-6 pt-0 space-y-0 flex-grow flex flex-col justify-center">
                {/* Datas Minimalistas */}
                <div className="text-sm text-muted-foreground leading-none">
                  <div className="flex justify-between">
                    <span>{formatDate(comp.startDate).slice(0, 5)}</span>
                    <span>{formatDate(comp.endDate).slice(0, 5)}</span>
                  </div>
                  <div className="flex justify-between opacity-70 text-xs mt-0.5">
                    <span>{formatTime(comp.startDate)}</span>
                    <span>{formatTime(comp.endDate)}</span>
                  </div>
                </div>
              </CardContent>

              {/* Status Inscrito (Destaque) - Fixado no rodapé */}
              {comp.isEnrolled && (
                <div className="absolute bottom-1 left-1 right-1 flex items-center justify-center gap-1 text-green-600 dark:text-green-400 text-[10px] font-black bg-green-500/10 py-0.5 rounded uppercase tracking-wider">
                  <CheckCircle className="w-2.5 h-2.5" />
                  {t('enrolled')}
                </div>
              )}
              
              {!isSelected && !comp.isEnrolled && comp.status === 'UPCOMING' && (
                  <div className="absolute bottom-1.5 left-0 right-0 text-center text-[9px] text-orange-500 font-medium leading-none">
                    {t('enrollmentPending')}
                  </div>
              )}
            </Card>
          );
        })}
      </div>

      {filteredCompetitions.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {t('noRounds')}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useGuardedActionHook } from '@/hooks/useGuardedActionHook';
import { useCompetitionStatus } from '@/hooks/useCompetitionStatus';
import { useWalletModal } from '@/contexts/wallet-modal-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SoccerField } from '@/components/field/soccer-field';
import { TokenMarket } from '@/components/market/token-market';
import { RoundSelector } from '@/components/rounds/round-selector';
import { CompetitionNavigator } from '@/components/rounds/competition-navigator';
import { type TokenMarketData } from '@/data/expanded-tokens';
import { type Player } from '@/types/teams';
import { validateTokens } from '@/lib/valid-tokens';
import { LocalizedLink } from '@/components/ui/localized-link';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { isRodadaEmAndamento } from '@/lib/utils/timeCheck';
import { useTranslations, useLocale } from 'next-intl';

import { useMflProgram, getVaultPda } from '@/lib/anchor-client';
import { SystemProgram } from '@solana/web3.js';
import {
  Users,
  Trophy,
  Target,
  Settings,
  Save,
  RotateCcw,
  Zap,
  Crown,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Clock
} from 'lucide-react';

// Interface para ligas da API
interface League {
  id: string;
  name: string;
  description: string | null;
  entryFee: number;
  emblemUrl: string | null;
  badgeUrl: string | null;
  bannerUrl: string | null;
  competitionsCount: number;
  allowedTokensCount: number;
}

export function TeamsContent() {
  const t = useTranslations('teams');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const { user, isAuthenticated } = useAuth();
  const { canExecuteAction } = useGuardedActionHook();
  const { openModal: openWalletModal } = useWalletModal();
  // Hook para interagir com o smart contract
  const program = useMflProgram();

  // console.log('DEBUG TeamsContent: Estado inicial', {
  //   connected,
  //   publicKey: publicKey?.toString(),
  //   user,
  //   userExists: !!user,
  //   userName: user?.name
  // });
  
  // Estados principais
  const [formation, setFormation] = useState<'433' | '442' | '352'>('433');
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenMarketData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(true);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | undefined>(undefined);
  const [selectedCompetitionStatus, setSelectedCompetitionStatus] = useState<string | undefined>(undefined);
  const [isEditingMainTeam, setIsEditingMainTeam] = useState(false);

  // Buscar dados da competição para a liga selecionada
  // ✅ CORREÇÃO: Mapear leagueId para slug correto
  const competitionSlug = selectedLeagueId === 'cmh3qcrw80000cjvdrwtvt65i' ? 'main-league' : selectedLeagueId;
  const { competition: competitionData, loading: isCompetitionLoading } = useCompetitionStatus({
    competitionId: competitionSlug,
    enabled: !!selectedLeagueId && !isLoadingLeagues && selectedLeagueId !== 'main_template'
  });
  const [hasValidEntry, setHasValidEntry] = useState<boolean | null>(null);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [existingTeam, setExistingTeam] = useState<any>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingAllowed, setEditingAllowed] = useState(false);
  const [leagueStats, setLeagueStats] = useState<{totalScore: number; rank: number | null} | null>(null);
  const [competitionRefreshTrigger, setCompetitionRefreshTrigger] = useState(0);

  // 🛡️ SAFEGUARD: Prevent duplicate calls
  const lastCheckRef = useRef<string | null>(null);
  const checkInProgressRef = useRef<boolean>(false);
  const isChangingLeagueRef = useRef<boolean>(false);
  const loadTemplateInProgressRef = useRef<boolean>(false);

  // 📦 Cache de enrollment para evitar chamadas duplicadas à API
  const cachedEnrollmentRef = useRef<{
    competitionId: string;
    data: { hasPaid: boolean; hasTeam: boolean; isEnrolled: boolean };
    timestamp: number;
  } | null>(null);

  // 🎯 Ref para rastrear qual rodada foi carregada com sucesso (evita recarregar)
  const lastLoadedCompetitionRef = useRef<string | null>(null);
  
  // 🏆 Buscar ligas disponíveis da API
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        setIsLoadingLeagues(true);
        const response = await fetch('/api/leagues');

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.leagues) {
            setLeagues(data.leagues);

            // Inicializar liga selecionada da URL ou template por padrão
            const urlLeagueParam = searchParams?.get('league');

            // Map URL slug to actual league ID
            let resolvedLeagueId = urlLeagueParam;

            // Special case: "main" slug maps to the main league
            if (urlLeagueParam === 'main') {
              // Find the main league (Liga Principal MarketFantasy)
              const mainLeague = data.leagues.find((l: League) =>
                l.name === 'Liga Principal MarketFantasy' ||
                l.id === 'cmh3qcrw80000cjvdrwtvt65i'
              );
              resolvedLeagueId = mainLeague?.id || urlLeagueParam;
            }

            // Check if the resolved league ID exists
            if (resolvedLeagueId && data.leagues.find((l: League) => l.id === resolvedLeagueId)) {
              console.log('🎯 Selecionando liga da URL:', { urlParam: urlLeagueParam, resolvedId: resolvedLeagueId });
              setSelectedLeagueId(resolvedLeagueId);
            } else {
              // Padrão: Meu Time Principal (Template)
              console.log('📋 Liga não encontrada na URL, usando template');
              setSelectedLeagueId('main_template');
              // ✅ CORREÇÃO: Não carregar manualmente - deixar a API buscar com dados do CoinGecko
              // O useEffect de checkPaymentAndLoadTeam vai cuidar de buscar os dados completos
            }
          }
        } else {
          console.error('Erro ao buscar ligas:', await response.text());
        }
      } catch (error) {
        console.error('Erro ao buscar ligas:', error);
      } finally {
        setIsLoadingLeagues(false);
      }
    };

    fetchLeagues();
  }, [searchParams, user?.mainTeam]);

  // 🔍 Buscar status da rodada SELECIONADA (se houver)
  useEffect(() => {
    async function fetchSelectedCompetitionStatus() {
      if (!selectedCompetitionId) {
        setSelectedCompetitionStatus(undefined);
        return;
      }

      try {
        const response = await fetch(`/api/competitions/${selectedCompetitionId}`);
        if (response.ok) {
          const data = await response.json();
          setSelectedCompetitionStatus(data.status);
        }
      } catch (error) {
        console.error('Erro ao buscar status da rodada selecionada:', error);
      }
    }

    fetchSelectedCompetitionStatus();
  }, [selectedCompetitionId]);

  // ✅ Verificação de edição: combina horário + status da competição
  useEffect(() => {
    // Verificação de horário (client-side only para evitar hydration mismatch)
    const timeAllowed = !isRodadaEmAndamento();

    // ✅ NOVA LÓGICA: Também verificar se a competição está ACTIVE
    // Para template (main_template), sempre permitir edição (desde que no horário correto)
    // Para ligas reais, bloquear se a competição estiver ACTIVE ou COMPLETED
    let competitionAllowed = true;
    if (selectedLeagueId !== 'main_template') {
      // ✅ PRIORIZAR status da rodada SELECIONADA se existir
      const statusToCheck = selectedCompetitionStatus || competitionData?.status;

      if (statusToCheck) {
        // Se a competição estiver ACTIVE ou COMPLETED, bloquear edição (comparação case-insensitive)
        const status = statusToCheck.toUpperCase();
        competitionAllowed = status !== 'ACTIVE' && status !== 'COMPLETED';
      }
    }

    const allowed = timeAllowed && competitionAllowed;
    setEditingAllowed(allowed);

    console.log('DEBUG useEditWindow: Verificando permissões de edição', {
      selectedLeagueId,
      isTemplate: selectedLeagueId === 'main_template',
      timeAllowed,
      selectedCompetitionId,
      selectedCompetitionStatus,
      currentCompetitionStatus: competitionData?.status,
      statusUsed: selectedCompetitionStatus || competitionData?.status,
      competitionAllowed,
      editingAllowed: allowed,
    });
  }, [selectedLeagueId, selectedCompetitionId, selectedCompetitionStatus, competitionData]);

  // 📊 Buscar estatísticas acumuladas da liga
  useEffect(() => {
    const fetchLeagueStats = async () => {
      if (!isAuthenticated || !selectedLeagueId || selectedLeagueId === 'main_template') {
        setLeagueStats(null);
        return;
      }

      try {
        const response = await fetch(`/api/user/league-stats?leagueId=${selectedLeagueId}`);

        if (response.ok) {
          const data = await response.json();
          setLeagueStats({
            totalScore: data.totalScore || 0,
            rank: data.rank
          });
        } else {
          setLeagueStats(null);
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas da liga:', error);
        setLeagueStats(null);
      }
    };

    fetchLeagueStats();
  }, [isAuthenticated, selectedLeagueId]);

  // Obter o nome do time a partir do nome do usuário
  const teamName = user?.name || 'Meu Time';

  // console.log('DEBUG teamName:', {
  //   userName: user?.name,
  //   teamName,
  //   userExists: !!user
  // });

  // 📋 Função NOVA para carregar template (sem verificação de pagamento)
  const loadMainTemplate = useCallback(async () => {
    // 🛡️ SAFEGUARD: Evitar chamadas duplicadas
    if (loadTemplateInProgressRef.current) {
      console.log('🛡️ loadMainTemplate: Chamada em progresso, ignorando');
      return;
    }

    console.log('📋 loadMainTemplate: Carregando time principal (template)');

    if (!user || !isAuthenticated) {
      console.log('❌ loadMainTemplate: Usuário não autenticado');
      return;
    }

    loadTemplateInProgressRef.current = true;
    setIsLoadingTeam(true);

    try {
      console.log('📋 loadMainTemplate: Buscando time principal da API');
      const teamResponse = await fetch('/api/team?leagueId=main_template');

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        console.log('📋 loadMainTemplate: Dados recebidos:', teamData);

        if (teamData.hasTeam && teamData.tokenDetails && teamData.team.tokens) {
          setExistingTeam(teamData.team);
          setHasValidEntry(true); // Template sempre válido

          // Carregar jogadores com dados do CoinGecko
          const loadedPlayers: Player[] = teamData.team.tokens.map((symbol: string, index: number) => {
            const tokenDetail = teamData.tokenDetails.find((t: any) => t.symbol?.toUpperCase() === symbol?.toUpperCase());
            return {
              id: symbol,
              position: index + 1,
              name: tokenDetail?.name || symbol,
              symbol: symbol,
              image: tokenDetail?.image || '',
              currentPrice: tokenDetail?.currentPrice || 0,
              points: 0,
              rarity: 'common' as const,
              priceChange24h: tokenDetail?.priceChange24h || 0,
              priceChange7d: tokenDetail?.priceChange7d || 0,
              marketCap: 0,
              marketCapRank: null
            };
          });

          console.log('📋 loadMainTemplate: Players carregados:', loadedPlayers);
          setPlayers(loadedPlayers);
        } else {
          console.log('📋 loadMainTemplate: Nenhum time encontrado');
          setExistingTeam(null);
          setPlayers([]);
          setHasValidEntry(true); // Template sempre válido
        }
      }
    } catch (error) {
      console.error('❌ loadMainTemplate: Erro:', error);
      setPaymentError(t('errorLoadingMainTeam'));
    } finally {
      setIsLoadingTeam(false);
      loadTemplateInProgressRef.current = false; // 🛡️ Liberar safeguard
    }
  }, [user, isAuthenticated]);

  // Função para verificar status de pagamento e carregar time existente
  const checkPaymentAndLoadTeam = useCallback(async () => {
    // Determinar competitionId efetivo ANTES de criar a chave
    const effectiveCompetitionId = selectedCompetitionId || competitionData?.competitionId;

    // 🛡️ SAFEGUARD 1: Prevent duplicate calls - incluir competitionId na chave
    const checkKey = `${user?.id}-${selectedLeagueId}-${effectiveCompetitionId || 'no-comp'}`;
    if (checkInProgressRef.current) {
      console.log('🛡️ SAFEGUARD: Chamada em progresso bloqueada', { checkKey });
      return;
    }
    if (lastCheckRef.current === checkKey) {
      console.log('🛡️ SAFEGUARD: Mesma verificação já realizada', { checkKey });
      return;
    }

    console.log('🔍 checkPaymentAndLoadTeam: Verificando entrada na liga', {
      timestamp: new Date().toISOString(),
      userId: user?.id,
      selectedLeagueId,
      effectiveCompetitionId
    });

    if (!user || !isAuthenticated) {
      console.log('DEBUG checkPaymentAndLoadTeam: Usuário não autenticado');
      setHasValidEntry(null);
      return;
    }

    // 🛡️ SAFEGUARD 2: Mark as in progress
    checkInProgressRef.current = true;
    lastCheckRef.current = checkKey;

    setIsLoadingTeam(true);
    setPaymentError(null);

    try {
      console.log('DEBUG checkPaymentAndLoadTeam: Buscando time existente');

      let teamUrl = `/api/team?leagueId=${selectedLeagueId}`;
      if (effectiveCompetitionId) {
        teamUrl += `&competitionId=${effectiveCompetitionId}`;
        console.log('DEBUG checkPaymentAndLoadTeam: URL da API:', teamUrl);
      }

      const teamResponse = await fetch(teamUrl);

      console.log('DEBUG checkPaymentAndLoadTeam: Resposta:', { status: teamResponse.status });

      // Variável para armazenar o status de pagamento
      let hasValidPayment = false;

      // ✅ OTIMIZAÇÃO: Usar cache de enrollment se disponível e válido (5 min TTL)
      const ENROLLMENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutos
      const cachedEnrollment = cachedEnrollmentRef.current;
      const cacheValid = cachedEnrollment &&
        cachedEnrollment.competitionId === effectiveCompetitionId &&
        (Date.now() - cachedEnrollment.timestamp) < ENROLLMENT_CACHE_TTL;

      if (cacheValid) {
        console.log('✅ CACHE HIT: Usando dados de enrollment cacheados');
        hasValidPayment = cachedEnrollment.data.hasPaid;
      } else if (effectiveCompetitionId) {
        console.log('🌐 CACHE MISS: Buscando enrollment da API');
        const entryResponse = await fetch('/api/league/check-entry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
          },
          body: JSON.stringify({ competitionId: effectiveCompetitionId })
        });

        if (entryResponse.ok) {
          const entryData = await entryResponse.json();
          hasValidPayment = entryData.hasPaid;

          // 💾 Salvar no cache
          cachedEnrollmentRef.current = {
            competitionId: effectiveCompetitionId,
            data: { hasPaid: entryData.hasPaid, hasTeam: entryData.hasTeam, isEnrolled: entryData.isEnrolled },
            timestamp: Date.now()
          };
          console.log('💾 Enrollment salvo no cache');
        }
      } else {
        console.log('⏳ checkPaymentAndLoadTeam: competitionId não disponível, pulando verificação de entrada');
        // Se não temos competitionId, assumir válido para permitir edição do time
        hasValidPayment = true;
      }

      // Processar resposta do time
      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        console.log('DEBUG checkPaymentAndLoadTeam: Dados do time:', teamData);

        if (teamData.hasTeam) {
          console.log('DEBUG checkPaymentAndLoadTeam: Time existente encontrado');
          setExistingTeam(teamData.team);
          setHasValidEntry(hasValidPayment); // Usar o status de pagamento real

          // ✅ Se tem time mas não tem pagamento, mostrar alerta
          if (!hasValidPayment) {
            setPaymentError('Seu time foi criado mas você ainda precisa pagar a taxa de entrada para confirmar sua participação nesta rodada.');
          }

          // Carregar jogadores do time existente
          if (teamData.tokenDetails && teamData.team.tokens) {
            console.log('DEBUG checkPaymentAndLoadTeam: Carregando players do time existente');
            const loadedPlayers: Player[] = teamData.team.tokens.map((symbol: string, index: number) => {
              const tokenDetail = teamData.tokenDetails.find((t: any) => t.symbol?.toUpperCase() === symbol?.toUpperCase());
              
              // ✅ LÓGICA DE PONTUAÇÃO:
              // 1. Se for dado histórico (CompetitionToken), usar priceChange7d como score
              // 2. Se for dado vivo, usar a própria variação 7d como pontuação (regra padrão)
              let calculatedPoints = 0;
              
              if (tokenDetail?.isHistorical) {
                 calculatedPoints = Number(tokenDetail.priceChange7d) || 0;
              } else if (tokenDetail) {
                 // ✅ CORREÇÃO: Usar variação 7d como pontuação padrão para evitar números "insanos" baseados em preço
                 calculatedPoints = Number(tokenDetail.priceChange7d) || 0;
              }

              return {
                id: symbol,
                position: index + 1,
                name: tokenDetail?.name || symbol,
                symbol: symbol,
                image: tokenDetail?.image || '',
                currentPrice: tokenDetail?.currentPrice || 0,
                points: calculatedPoints, // ✅ Pontos corretos (histórico ou calculado)
                rarity: 'common' as const,
                priceChange24h: tokenDetail?.priceChange24h || 0,
                priceChange7d: tokenDetail?.priceChange7d || 0,
                marketCap: 0,
                marketCapRank: null
              };
            });
            console.log('DEBUG checkPaymentAndLoadTeam: Players carregados:', loadedPlayers);
            setPlayers(loadedPlayers);
            // 🎯 Marcar rodada como carregada com sucesso
            lastLoadedCompetitionRef.current = effectiveCompetitionId || null;
          }
        } else {
          console.log('DEBUG checkPaymentAndLoadTeam: Nenhum time existente encontrado');
          // Limpar jogadores e time quando não houver time para esta rodada
          setPlayers([]);
          setExistingTeam(null);
          // Usar o status de pagamento real
          setHasValidEntry(hasValidPayment);

          // ✅ Se não tem pagamento, mostrar alerta
          if (!hasValidPayment) {
            setPaymentError('Você precisa pagar a taxa de entrada para esta rodada antes de criar seu time.');
          }
        }
      } else if (teamResponse.status === 402) {
        // Payment required
        const errorData = await teamResponse.json();
        setHasValidEntry(false);
        setPaymentError(errorData.error);
        setPlayers([]);
        setExistingTeam(null);
      } else {
        // Se houve erro ao verificar time, mas o pagamento foi feito, permitir criação
        setHasValidEntry(hasValidPayment);
        setPlayers([]);
        setExistingTeam(null);
      }
    } catch (error) {
      console.error('DEBUG checkPaymentAndLoadTeam: Erro capturado:', error);
      setPaymentError('Erro ao verificar status do time');
      setHasValidEntry(false);
    } finally {
      console.log('DEBUG checkPaymentAndLoadTeam: Finalizando verificação');
      setIsLoadingTeam(false);
      // 🛡️ SAFEGUARD 3: Release lock after completion
      checkInProgressRef.current = false;
    }
  }, [user, isAuthenticated, selectedLeagueId, selectedCompetitionId, competitionData?.competitionId]);

  // Atualizar liga quando parâmetros da URL mudarem
  useEffect(() => {
    // 🛡️ SAFEGUARD: Não reverter se estivermos mudando programaticamente
    if (isChangingLeagueRef.current) {
      console.log('🛡️ URL-SYNC: Ignorando atualização durante troca programática de liga');
      return;
    }

    if (searchParams && leagues.length > 0) {
      const urlLeagueParam = searchParams.get('league');

      // ✅ CORREÇÃO: Incluir suporte para 'main_template' e slug 'main'
      if (urlLeagueParam) {
        // Map URL slug to actual league ID
        let resolvedLeagueId = urlLeagueParam;

        // Special case: "main" slug maps to the main league
        if (urlLeagueParam === 'main') {
          const mainLeague = leagues.find(league =>
            league.name === 'Liga Principal MarketFantasy' ||
            league.id === 'cmh3qcrw80000cjvdrwtvt65i'
          );
          resolvedLeagueId = mainLeague?.id || urlLeagueParam;
        }

        // Verificar se é template ou se existe nas ligas reais
        const isValidLeague = resolvedLeagueId === 'main_template' || leagues.find(league => league.id === resolvedLeagueId);

        if (isValidLeague && resolvedLeagueId !== selectedLeagueId) {
          console.log('🔄 URL-SYNC: Atualizando selectedLeagueId de URL:', { urlParam: urlLeagueParam, resolvedId: resolvedLeagueId });
          setSelectedLeagueId(resolvedLeagueId);
        }
      }
    }
  }, [searchParams, leagues, selectedLeagueId]);

  // Verificar pagamento quando usuário estiver autenticado ou mudar liga
  useEffect(() => {
    console.log('🔍 [USEEFFECT] Check-Entry: Executado com:', {
      selectedLeagueId,
      isTemplate: selectedLeagueId === 'main_template',
      isCompetitionLoading,
      hasCompetitionData: !!competitionData,
      competitionId: competitionData?.competitionId,
      hasUser: !!user,
      isAuthenticated
    });

    // 🎯 CORREÇÃO: Template usa função separada SEM verificação de pagamento
    if (selectedLeagueId === 'main_template') {
      console.log('📋 Check-Entry: Template detectado, usando loadMainTemplate...');
      setHasValidEntry(true); // Template não precisa de pagamento

      if (user && isAuthenticated) {
        loadMainTemplate(); // ✅ Função separada sem verificação de pagamento
      }
      return;
    }

    // ✅ CORREÇÃO: Aguardar que os dados da competição (com o ID da rodada) estejam prontos
    // Se for liga real, EXIGIR selectedCompetitionId para evitar carregar rodada errada/default antes da seleção
    if (selectedLeagueId !== 'main_template') {
      if (!selectedCompetitionId) {
        console.log('⏳ Check-Entry: Aguardando seleção da rodada (CompetitionNavigator)...');
        return;
      }
    } else {
      // Para template, verificar se competitionData básico carregou (opcional, mas bom para consistência)
      if (isCompetitionLoading) {
         console.log('⏳ Check-Entry: Aguardando dados iniciais...');
         return;
      }
    }

    if (user && isAuthenticated) {
      console.log('✅ Check-Entry: Condições satisfeitas, chamando checkPaymentAndLoadTeam');
      checkPaymentAndLoadTeam();
    } else {
      console.log('❌ Check-Entry: Usuário não autenticado', { hasUser: !!user, isAuthenticated });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthenticated, selectedLeagueId, selectedCompetitionId, competitionData?.competitionId, isCompetitionLoading]);

  // Obter liga atual
  const currentLeague = leagues.find(league => league.id === selectedLeagueId);

  // Por enquanto, não aplicamos filtros fixos (isso dependerá de como as ligas serão categorizadas no futuro)
  const fixedFilter = undefined;

  // ✅ DEBOUNCING: Timer para evitar múltiplas requisições ao navegar rapidamente entre rodadas
  const competitionSelectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Função para lidar com seleção de competição (com debouncing)
  const handleSelectCompetition = (competitionId: string, enrollmentData?: { hasPaid: boolean; hasTeam: boolean; isEnrolled: boolean }) => {
    // console.log('🏆 handleSelectCompetition: Selecionando rodada:', competitionId);

    // ✅ OTIMIZAÇÃO: Cachear enrollment data se recebido do CompetitionNavigator
    if (enrollmentData) {
      cachedEnrollmentRef.current = {
        competitionId,
        data: enrollmentData,
        timestamp: Date.now()
      };
      // console.log('💾 Enrollment data cacheado do Navigator');
    }

    // ✅ Cancelar timer pendente (debouncing)
    if (competitionSelectTimerRef.current) {
      clearTimeout(competitionSelectTimerRef.current);
    }

    // ✅ Aguardar 100ms (debounce rápido)
    competitionSelectTimerRef.current = setTimeout(() => {
      console.log('✅ Processando seleção da rodada:', competitionId);

      // 🧹 LIMPEZA FORÇADA: Garantir que o estado anterior não bloqueie o novo carregamento
      lastCheckRef.current = null; // Resetar ref de segurança para permitir nova busca
      checkInProgressRef.current = false;
      
      // Limpar estado visual ANTES de atualizar o ID para dar feedback imediato
      setPlayers([]);
      setExistingTeam(null);
      setHasValidEntry(null);
      setPaymentError(null);
      setSuccessMessage(null);
      setIsLoadingTeam(true);

      // Atualizar ID dispara o useEffect principal
      setSelectedCompetitionId(competitionId);
    }, 100);
  };

  // ✅ Cleanup: Limpar timer ao desmontar componente (evitar memory leak)
  useEffect(() => {
    return () => {
      if (competitionSelectTimerRef.current) {
        clearTimeout(competitionSelectTimerRef.current);
      }
    };
  }, []);

  // Função para copiar time da rodada anterior
  const handleCopyFromPrevious = async (competitionId: string) => {
    console.log('📋 handleCopyFromPrevious: Copiando time para rodada:', competitionId);

    try {
      setIsLoadingTeam(true);
      setPaymentError(null);
      setSuccessMessage(null);

      // 1. Buscar todas as competições da liga para encontrar a rodada anterior
      const competitionsResponse = await fetch(`/api/competitions?leagueId=${selectedLeagueId}`);
      if (!competitionsResponse.ok) {
        throw new Error('Erro ao buscar competições');
      }

      const competitionsData = await competitionsResponse.json();
      const competitions = competitionsData.competitions || [];

      // Ordenar por data de início
      competitions.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      // Encontrar a competição atual e a anterior
      const currentIndex = competitions.findIndex((c: any) => c.id === competitionId);
      if (currentIndex <= 0) {
        setPaymentError('Não há rodada anterior para copiar o time.');
        setTimeout(() => setPaymentError(null), 3000);
        return;
      }

      const previousCompetition = competitions[currentIndex - 1];
      console.log('📋 Rodada anterior encontrada:', previousCompetition.name);

      // 2. Buscar time da rodada anterior
      const previousTeamResponse = await fetch(
        `/api/team?leagueId=${selectedLeagueId}&competitionId=${previousCompetition.id}`
      );

      if (!previousTeamResponse.ok) {
        throw new Error('Erro ao buscar time da rodada anterior');
      }

      const previousTeamData = await previousTeamResponse.json();

      if (!previousTeamData.hasTeam || !previousTeamData.team.tokens || previousTeamData.team.tokens.length === 0) {
        setPaymentError('Você não tem um time salvo na rodada anterior.');
        setTimeout(() => setPaymentError(null), 3000);
        return;
      }

      console.log('📋 Time da rodada anterior:', previousTeamData.team.tokens);

      // 3. Copiar jogadores com dados do CoinGecko
      const copiedPlayers: Player[] = previousTeamData.team.tokens.map((symbol: string, index: number) => {
        const tokenDetail = previousTeamData.tokenDetails?.find((t: any) => t.symbol?.toUpperCase() === symbol?.toUpperCase());
        return {
          id: symbol,
          position: index + 1,
          name: tokenDetail?.name || symbol,
          symbol: symbol,
          image: tokenDetail?.image || '',
          currentPrice: tokenDetail?.currentPrice || 0,
          points: 0,
          rarity: 'common' as const,
          priceChange24h: tokenDetail?.priceChange24h || 0,
          priceChange7d: tokenDetail?.priceChange7d || 0,
          marketCap: 0,
          marketCapRank: null
        };
      });

      console.log('📋 Jogadores copiados:', copiedPlayers);
      setPlayers(copiedPlayers);

      setSuccessMessage(`Time copiado da ${previousCompetition.name} com sucesso! ${copiedPlayers.length} jogadores importados.`);
      setTimeout(() => setSuccessMessage(null), 5000);

    } catch (error) {
      console.error('❌ Erro ao copiar time da rodada anterior:', error);
      setPaymentError(error instanceof Error ? error.message : 'Erro ao copiar time da rodada anterior');
      setTimeout(() => setPaymentError(null), 3000);
    } finally {
      setIsLoadingTeam(false);
    }
  };

  // Função para lidar com mudança de liga
  const handleLeagueChange = (newLeagueId: string) => {
    console.log('DEBUG handleLeagueChange: Mudando liga para:', newLeagueId);

    // 🛡️ SAFEGUARD: Marcar que estamos mudando programaticamente
    isChangingLeagueRef.current = true;

    // 🛡️ SAFEGUARD: Limpar refs de verificação para permitir nova carga
    lastCheckRef.current = null;
    checkInProgressRef.current = false;
    loadTemplateInProgressRef.current = false;

    // 🧹 INVALIDAR CACHE: Enrollment data não é válido para outra liga
    cachedEnrollmentRef.current = null;
    lastLoadedCompetitionRef.current = null;

    // 🧹 LIMPEZA IMEDIATA DE ESTADO (UX Fix)
    // Remove dados antigos da tela ANTES de buscar novos dados
    setPlayers([]);           // Limpa jogadores do campo
    setExistingTeam(null);    // Remove time antigo
    setHasValidEntry(null);   // Reseta status de entrada
    setPaymentError(null);    // Limpa erros
    setSuccessMessage(null);  // Limpa mensagens
    setIsLoadingTeam(true);   // Mostra spinner durante troca
    setSelectedCompetitionId(undefined); // Limpar competição selecionada ao mudar de liga

    // Atualizar estado local
    setSelectedLeagueId(newLeagueId);

    // Se selecionou "Meu Time Principal (Template)"
    if (newLeagueId === 'main_template') {
      console.log('📋 Carregando template do Time Principal');

      // Carregar jogadores do user.mainTeam
      if (user?.mainTeam) {
        const mainTeamTokens = user.mainTeam as string[];

        if (Array.isArray(mainTeamTokens) && mainTeamTokens.length > 0) {
          const importedPlayers: Player[] = mainTeamTokens.slice(0, 10).map((symbol, index) => ({
            id: symbol,
            position: index + 1,
            name: symbol,
            symbol: symbol,
            image: '', // ✅ Vazio para mostrar símbolo
            currentPrice: 0,
            points: 0,
            rarity: 'common' as const,
            priceChange24h: 0,
            priceChange7d: 0,
            marketCap: 0,
            marketCapRank: null
          }));

          setPlayers(importedPlayers);
          setSuccessMessage('Time Principal carregado como template!');
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setPlayers([]);
          setPaymentError('Seu time principal está vazio. Crie um time primeiro!');
          setTimeout(() => setPaymentError(null), 3000);
        }
      } else {
        setPlayers([]);
        setPaymentError('Você ainda não tem um time principal. Crie um time primeiro!');
        setTimeout(() => setPaymentError(null), 3000);
      }

      // ✅ CORREÇÃO CRÍTICA: Atualizar URL para template para evitar que useEffect reverta o estado
      const newUrl = `/${locale}/teams?league=main_template`;
      router.push(newUrl);

      // 🛡️ SAFEGUARD: Liberar flag após navegação
      setTimeout(() => {
        isChangingLeagueRef.current = false;
      }, 100);
      return;
    }

    // Se selecionou uma liga real, limpar jogadores e atualizar URL
    setPlayers([]);
    const newUrl = `/${locale}/teams?league=${newLeagueId}`;
    router.push(newUrl);

    // 🛡️ SAFEGUARD: Liberar flag após navegação
    setTimeout(() => {
      isChangingLeagueRef.current = false;
    }, 100);
  };

  // Função para importar do time principal
  const handleImportFromMainTeam = async () => {
    console.log('📥 handleImportFromMainTeam: Iniciando importação...');

    try {
      setIsLoadingTeam(true);
      setPaymentError(null);
      setPlayers([]);

      // 🔄 CORREÇÃO: Buscar dados FRESCOS da API em vez do contexto desatualizado
      console.log('📥 handleImportFromMainTeam: Buscando time principal da API...');
      const response = await fetch('/api/team?leagueId=main_template');

      if (!response.ok) {
        throw new Error('Erro ao buscar time principal');
      }

      const teamData = await response.json();
      console.log('📥 handleImportFromMainTeam: Dados recebidos:', teamData);

      if (!teamData.hasTeam || !teamData.team.tokens || teamData.team.tokens.length === 0) {
        setPaymentError('Você ainda não tem um time principal salvo.');
        setTimeout(() => setPaymentError(null), 3000);
        return;
      }

      const mainTeamTokens = teamData.team.tokens;
      console.log('📥 handleImportFromMainTeam: Tokens do template:', mainTeamTokens);

      // Importar jogadores com dados do CoinGecko que já vêm da API
      const importedPlayers: Player[] = mainTeamTokens.slice(0, 10).map((symbol: string, index: number) => {
        const tokenDetail = teamData.tokenDetails?.find((t: any) => t.symbol?.toUpperCase() === symbol?.toUpperCase());
        return {
          id: symbol,
          position: index + 1,
          name: tokenDetail?.name || symbol,
          symbol: symbol,
          image: tokenDetail?.image || '', // ✅ Já vem da API com dados do CoinGecko
          currentPrice: tokenDetail?.currentPrice || 0,
          points: 0,
          rarity: 'common' as const,
          priceChange24h: tokenDetail?.priceChange24h || 0,
          priceChange7d: tokenDetail?.priceChange7d || 0,
          marketCap: 0,
          marketCapRank: null
        };
      });

      console.log('📥 handleImportFromMainTeam: Players importados:', importedPlayers);
      setPlayers(importedPlayers);

      setSuccessMessage(`${importedPlayers.length} jogadores importados do time principal!`);
      setTimeout(() => setSuccessMessage(null), 3000);

      console.log('✅ Time principal importado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao importar time principal:', error);
      setPaymentError('Erro ao importar time principal.');
      setTimeout(() => setPaymentError(null), 3000);
    } finally {
      setIsLoadingTeam(false);
    }
  };

  // Função para adicionar jogador
  const handleAddPlayer = (position: number) => {
    setSelectedPosition(position);
  };

  // Função para remover jogador
  const handleRemovePlayer = (position: number) => {
    setPlayers(prev => prev.filter(p => p.position !== position));
  };

  // Função para carregar logos do CoinGecko
  const loadTokenLogos = async (tokens: string[]) => {
    try {
      console.log('🖼️ Carregando logos do CoinGecko para:', tokens);

      // Buscar top 100
      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=1h,24h,7d,30d', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoFantasy/1.0'
        }
      });

      if (!response.ok) {
        console.warn('⚠️ Erro ao carregar logos do CoinGecko');
        return;
      }

      const allTokens = await response.json();
      console.log(`✅ Top 100 carregado: ${allTokens.length} tokens`);

      // Identificar tokens que não foram encontrados no top 100
      const foundSymbols = new Set(allTokens.map((t: any) => t.symbol.toUpperCase()));
      const missingTokens = tokens.filter(symbol => !foundSymbols.has(symbol.toUpperCase()));

      if (missingTokens.length > 0) {
        console.log(`🔍 Tokens fora do top 100: ${missingTokens.join(', ')}`);
        console.log('📡 Buscando dados específicos desses tokens...');

        // Buscar dados específicos dos tokens que não estão no top 100
        // Usar IDs da competição (lowercase)
        const missingIds = missingTokens.map(s => s.toLowerCase()).join(',');
        const specificResponse = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${missingIds}&price_change_percentage=1h,24h,7d,30d`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'CryptoFantasy/1.0'
            }
          }
        );

        if (specificResponse.ok) {
          const specificTokens = await specificResponse.json();
          console.log(`✅ Dados específicos carregados: ${specificTokens.length} tokens`);
          allTokens.push(...specificTokens);
        } else {
          console.warn('⚠️ Erro ao buscar tokens específicos');
        }
      }

      // Atualizar players com logos do CoinGecko
      setPlayers(prevPlayers => {
        return prevPlayers.map(player => {
          const tokenData = allTokens.find((token: any) =>
            token.symbol.toUpperCase() === (player.symbol || '').toUpperCase()
          );

          if (tokenData) {
            return {
              ...player,
              image: tokenData.image,
              name: tokenData.name,
              currentPrice: tokenData.current_price || 0,
              priceChange24h: tokenData.price_change_percentage_24h || 0,
              priceChange7d: tokenData.price_change_percentage_7d_in_currency || 0,
              points: Math.round(Number(tokenData.price_change_percentage_7d_in_currency || 0))
            };
          }

          console.log(`⚠️ Token ${player.symbol} não encontrado no CoinGecko`);
          return player;
        });
      });

      console.log('✅ Logos carregados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar logos:', error);
    }
  };

  // Função para adicionar token ao campo
  const handleTokenAdd = (token: TokenMarketData, position: number) => {
    console.log('🎯 Adicionando token ao campo:', { token: token.symbol, position });
    
    // Verificar se o token já está sendo usado em outra posição
    const isTokenAlreadyUsed = players.some(p => (p.symbol || p.symbol) === token.symbol && p.position !== position);
    if (isTokenAlreadyUsed) {
      setPaymentError(`O token ${token.symbol} já está sendo usado em outra posição.`);
      setTimeout(() => setPaymentError(null), 3000);
      return;
    }
    
    const newPlayer: Player = {
      id: token.symbol, // Usar o símbolo como ID para consistência
      position,
      name: token.name,
      symbol: token.symbol,
            image: token.image,
      currentPrice: token.currentPrice || token.currentPrice || 0,
      points: Math.round(Number(token.priceChange7d || 0)), // Calcular pontos baseado na performance (7d)
      rarity: 'common',
      priceChange24h: token.priceChange24h || token.priceChange24h || 0,
            priceChange7d: token.priceChange7d || token.priceChange7d || 0,
              marketCap: 0,
              marketCapRank: null
      };

    setPlayers(prev => {
      const filtered = prev.filter(p => p.position !== position);
      const newTeam = [...filtered, newPlayer];
      console.log('👥 Time atualizado:', newTeam.length, 'jogadores');
      return newTeam;
    });

    setSelectedToken(null);
    setSelectedPosition(null);
    console.log('✅ Token adicionado com sucesso!');
  };

  // Função para selecionar token
  const handleTokenSelect = (token: TokenMarketData | null) => {
    setSelectedToken(token);
  };

  // Função para encontrar a menor posição livre
  const findSmallestFreePosition = (): number | null => {
    const occupiedPositions = players.map(p => p.position);
    for (let i = 1; i <= 10; i++) {
      if (!occupiedPositions.includes(i)) {
        return i;
      }
    }
    return null; // Todas as posições estão ocupadas
  };

  // Função para posicionamento automático
  const handleAutoPosition = (token: TokenMarketData) => {
    const freePosition = findSmallestFreePosition();
    if (freePosition) {
      handleTokenAdd(token, freePosition);
    }
  };

  // ✅ REMOVIDO: Função isEditingAllowed() movida para useEffect acima para evitar hydration mismatch
  // Função para pagar a taxa de entrada via smart contract
  const handlePayEntryFee = async () => {
    // ✅ NOVO: Verificar se a rodada está encerrada ou ativa
    const status = selectedCompetitionStatus?.toUpperCase();
    if (status === 'COMPLETED') {
      toast.error(t('roundClosedToast'), {
        description: t('roundClosedToastDesc'),
        duration: 5000,
      });
      return;
    }
    if (status === 'ACTIVE') {
      toast.error(t('roundActiveToast'), {
        description: t('roundActiveToastDesc'),
        duration: 5000,
      });
      return;
    }

    if (!program || !publicKey) {
      console.error("Programa Anchor ou carteira não estão prontos.");
      setPaymentError(t('connectWalletFirst'));
      return;
    }

    try {
      setIsLoadingTeam(true);
      setPaymentError(null);

      // 1. Encontrar o endereço do nosso cofre (PDA)
      const vaultPda = getVaultPda();

      console.log("Verificando se vault existe...");
      console.log("Cofre (PDA):", vaultPda.toBase58());
      console.log("Usuário:", publicKey.toBase58());

      // 2. Verificar se o vault já foi inicializado
      try {
        const vaultAccount = await (program.account as any).vault.fetch(vaultPda);
        console.log("✅ Vault já existe:", vaultAccount);
      } catch (error) {
        // Vault não existe, precisamos inicializar primeiro
        console.log("⚠️ Vault não existe. Inicializando...");

        try {
          // Pegar blockhash recente para inicialização
          const { blockhash: initBlockhash, lastValidBlockHeight: initHeight } =
            await program.provider.connection.getLatestBlockhash('confirmed');

          const initTxHash = await (program.methods as any)
            .initializeVault() // ✅ CORREÇÃO: Nome correto da função
            .accountsPartial({
              vault: vaultPda,
              authority: publicKey, // ✅ CORREÇÃO: Parâmetro correto
              systemProgram: SystemProgram.programId,
            })
            .rpc({
              skipPreflight: false,
              preflightCommitment: 'confirmed',
              commitment: 'confirmed'
            });

          console.log("✅ Vault inicializado! Hash:", initTxHash);
          await program.provider.connection.confirmTransaction({
            signature: initTxHash,
            blockhash: initBlockhash,
            lastValidBlockHeight: initHeight
          }, 'confirmed');
          console.log("✅ Inicialização confirmada!");
        } catch (initError) {
          console.error("❌ Erro ao inicializar vault:", initError);
          throw new Error(t('vaultInitError'));
        }
      }

      // 3. Fazer o depósito (usando skipPreflight para evitar erro de simulação)
      console.log("Chamando 'depositEntryFee'...");
      const txHash = await (program.methods as any)
        .depositEntryFee()
        .accountsPartial({
          vault: vaultPda,
          user: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({
          skipPreflight: true,  // Pular a simulação que está falhando
          commitment: 'processed' // Usar commitment mais rápido
        });

      console.log("Transação enviada! Hash:", txHash);
      console.log(`🔍 Verifique a transação em: https://explorer.solana.com/tx/${txHash}?cluster=devnet`);

      // 4. Confirmar a transação com timeout estendido (90s) para redes lentas
      console.log("Aguardando confirmação da transação (até 90 segundos)...");

      try {
        // Estratégia de confirmação com timeout customizado
        const latestBlockhash = await program.provider.connection.getLatestBlockhash();
        const confirmation = await program.provider.connection.confirmTransaction(
          {
            signature: txHash,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
          },
          "confirmed"
        );

        console.log("Confirmação recebida:", confirmation);

        if (confirmation.value.err) {
          throw new Error(`Transação falhou: ${JSON.stringify(confirmation.value.err)}`);
        }

        // Aguardar propagação
        console.log("Aguardando 3 segundos adicionais para garantir propagação...");
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log("Pagamento confirmado on-chain!");

      } catch (confirmError: any) {
        // Se timeout, verificar manualmente o status da transação
        console.warn("⚠️ Timeout ao confirmar. Verificando status manualmente...");

        const status = await program.provider.connection.getSignatureStatus(txHash);
        console.log("Status da transação:", status);

        if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') {
          console.log("✅ Transação confirmada (verificação manual)!");
        } else {
          console.error("❌ Transação não confirmada. Link para verificar:");
          console.error(`https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
          throw new Error(`Transação não confirmada. Verifique em: https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
        }
      }

      // 5. Registrar o pagamento no banco de dados
      console.log("Registrando pagamento no banco de dados...");
      console.log("selectedLeagueId:", selectedLeagueId);

      // ✅ CORREÇÃO CRÍTICA: Adicionar competitionId ao request
      const effectiveCompetitionId = selectedCompetitionId || competitionData?.competitionId;

      const confirmBody = {
        transactionHash: txHash,
        leagueId: selectedLeagueId,
        competitionId: effectiveCompetitionId  // ✅ Adicionar competitionId obrigatório
      };

      console.log("Enviando para confirm-entry:", confirmBody);

      const confirmResponse = await fetch('/api/league/confirm-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(confirmBody)
      });

      const confirmData = await confirmResponse.json();

      if (!confirmResponse.ok) {
        console.error("❌ Erro ao confirmar entrada no banco:", confirmData);
        console.error("❌ Detalhes da validação:", JSON.stringify(confirmData.details, null, 2));
        throw new Error(confirmData.error || 'Erro ao registrar pagamento');
      }

      console.log("✅ Pagamento registrado no banco:", confirmData);

      // 6. Atualizar a UI
      setHasValidEntry(true);
      setSuccessMessage(t('paymentConfirmedMessage'));

      // 7. Recarregar dados do time para refletir hasValidEntry
      await checkPaymentAndLoadTeam();

      // 8. Forçar reload das competições para atualizar status de inscrição
      setCompetitionRefreshTrigger(prev => prev + 1);

    } catch (error) {
      console.error("Erro ao pagar a taxa de entrada:", error);
      setPaymentError(`Erro ao processar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoadingTeam(false);
    }
  };


  // Função para salvar escalação
  const handleSaveTeam = async () => {
    console.log('🚀 handleSaveTeam: Iniciando salvamento...', {
      connected,
      publicKey: publicKey?.toString(),
      playersLength: players.length,
      teamName,
      user,
      userHasWallet: !!user?.publicKey
    });

    // 🔒 VERIFICAÇÃO DE CARTEIRA NO BANCO: Se usuário não tem carteira vinculada, abrir modal
    if (!user?.publicKey) {
      console.log('⚠️ handleSaveTeam: Usuário sem carteira vinculada - abrindo modal');
      setPaymentError('Você precisa conectar uma carteira para criar seu time');
      openWalletModal();
      return;
    }

    // 🔒 VERIFICAÇÃO DE HORÁRIO: Bloquear edição dentro da janela (21:00-09:00 BRT)
    if (!editingAllowed) {
      console.log('🚫 handleSaveTeam: Rodada em Andamento - edição bloqueada entre 21:00-09:00 BRT');
      setPaymentError('Rodada em Andamento. A edição está bloqueada entre 21:00 e 09:00 (Horário de Brasília).');
      return;
    }

    // 🔒 VERIFICAÇÃO DE SEGURANÇA: Bloquear se carteira incompatível
    console.log('🔍 handleSaveTeam: Verificando segurança...', {
      canExecute: canExecuteAction(),
      isMismatched: !canExecuteAction()
    });

    if (!canExecuteAction()) {
      console.log('🚫 handleSaveTeam: Ação bloqueada - carteira incompatível');
      setPaymentError('Carteira incompatível com o perfil. Use a carteira correta.');
      return;
    }

    if (!connected || !publicKey) {
      setPaymentError('Conecte sua carteira para salvar o time');
      return;
    }

    if (players.length !== 10) {
      setPaymentError('O time deve ter exatamente 10 jogadores');
      return;
    }

    setIsSavingTeam(true);
    setPaymentError(null);
    setSuccessMessage(null);

    try {
      const tokens = players
        .sort((a, b) => a.position - b.position)
        .map(player => player.symbol || player.symbol || '');

      console.log('📋 handleSaveTeam: Tokens preparados:', tokens);

      // Verificar se há tokens duplicados
      const uniqueTokens = [...new Set(tokens)];
      if (uniqueTokens.length !== tokens.length) {
        console.log('❌ handleSaveTeam: Tokens duplicados encontrados');
        setPaymentError('Há tokens duplicados no time. Cada posição deve ter um token diferente.');
        return;
      }

      const requestBody: any = {
        leagueId: selectedLeagueId,
        teamName: teamName,
        tokens: tokens
      };

      // ✅ Adicionar competitionId se disponível (exceto para template)
      // PRIORIZA selectedCompetitionId (rodada selecionada) ao invés de competitionData.competitionId (rodada atual)
      if (selectedLeagueId !== 'main_template') {
        const effectiveCompetitionId = selectedCompetitionId || competitionData?.competitionId;
        if (effectiveCompetitionId) {
          requestBody.competitionId = effectiveCompetitionId;
          console.log('✅ handleSaveTeam: Adicionando competitionId:', effectiveCompetitionId);
        }
      }

      console.log('📤 handleSaveTeam: Enviando requisição:', requestBody);

      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // ✅ Garantir que cookies são enviados
        body: JSON.stringify(requestBody),
      });

      console.log('📥 handleSaveTeam: Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();
      console.log('📊 handleSaveTeam: Dados da resposta:', data);

      if (response.ok) {
        console.log('✅ handleSaveTeam: Salvamento bem-sucedido');
        
        setExistingTeam(data.team);
        setHasValidEntry(true);
        setPaymentError(null);
        
        // Atualizar os players com os dados retornados da API, preservando as imagens existentes
        if (data.tokenDetails && data.team.tokens) {
          console.log('🔄 handleSaveTeam: Atualizando players com dados da API');
          
          const updatedPlayers: Player[] = data.team.tokens.map((symbol: string, index: number) => {
            const tokenDetail = data.tokenDetails.find((t: any) => t.symbol?.toUpperCase() === symbol?.toUpperCase());
            const existingPlayer = players.find(p => p.symbol?.toUpperCase() === symbol?.toUpperCase());

            return {
              id: symbol, // Usar símbolo como ID para consistência
              position: index + 1,
              name: tokenDetail?.name || existingPlayer?.name || symbol,
              symbol: symbol,
                            image: existingPlayer?.image || tokenDetail?.image || '', // ✅ Preservar imagem existente ou vazio
              currentPrice: tokenDetail?.currentPrice || tokenDetail?.currentPrice || existingPlayer?.currentPrice || existingPlayer?.currentPrice || 0,
              points: existingPlayer?.points || 0,
              rarity: (existingPlayer?.rarity as 'common' | 'rare' | 'epic' | 'legendary') || 'common',
              priceChange24h: tokenDetail?.priceChange24h || tokenDetail?.priceChange24h || existingPlayer?.priceChange24h || existingPlayer?.priceChange24h || 0,
                            priceChange7d: tokenDetail?.priceChange7d || tokenDetail?.priceChange7d || existingPlayer?.priceChange7d || existingPlayer?.priceChange7d || 0,
              marketCap: 0,
              marketCapRank: null
              };
          });
          
          console.log('👥 handleSaveTeam: Players atualizados:', updatedPlayers);
          setPlayers(updatedPlayers);
        }
        
        const successMsg = data.message || 'Time salvo com sucesso!';
        setSuccessMessage(successMsg);

        // 🔄 REVALIDAÇÃO: Recarregar dados do time após salvamento
        console.log('🔄 handleSaveTeam: Revalidando dados do time...');
        if (selectedLeagueId === 'main_template') {
          // Template: recarregar sem verificar pagamento
          await loadMainTemplate();
        } else {
          // Liga: recarregar com verificação de pagamento
          await checkPaymentAndLoadTeam();
          // Atualizar status das competições após salvar time
          setCompetitionRefreshTrigger(prev => prev + 1);
        }

        // 🖼️ CARREGAR LOGOS: Buscar logos do CoinGecko para os tokens
        console.log('🖼️ handleSaveTeam: Carregando logos do CoinGecko...');
        await loadTokenLogos(tokens);

        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
        
      } else if (response.status === 402) {
        setHasValidEntry(false);
        setPaymentError(data.error);
      } else if (response.status === 400 && data.invalidTokens) {
        const invalidTokensList = data.invalidTokens.join(', ');
        setPaymentError(`Tokens inválidos encontrados: ${invalidTokensList}. Estes tokens não estão no top 100 do mercado. Por favor, substitua-os por tokens válidos do Token Market e tente novamente.`);
      } else {
        console.log('❌ handleSaveTeam: Erro no salvamento:', data.error);
        throw new Error(data.error || 'Erro ao salvar time');
      }
    } catch (error) {
      console.error('💥 handleSaveTeam: Erro capturado:', error);
      setPaymentError(error instanceof Error ? error.message : 'Erro ao salvar time');
    } finally {
      console.log('🏁 handleSaveTeam: Finalizando salvamento');
      setIsSavingTeam(false);
    }
  };

  // Função para resetar escalação
  const handleResetTeam = () => {
    setPlayers([]);
    setSelectedToken(null);
    setSelectedPosition(null);
  };

  // Obter tokens já utilizados
  const usedTokens = players.map(p => p.symbol || p.symbol || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {t('pageTitle')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t('pageSubtitle')}
            </p>
            {existingTeam && (
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">{t('teamSaved')}: {existingTeam.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Seletor de Liga */}
            <Select value={selectedLeagueId} onValueChange={handleLeagueChange} disabled={isLoadingLeagues || leagues.length === 0}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder={isLoadingLeagues ? t('loadingLeagues') : t('selectLeague')} />
              </SelectTrigger>
              <SelectContent>
                {/* Opção Template: Meu Time Principal */}
                <SelectItem value="main_template">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    Meu Time Principal (Template)
                  </div>
                </SelectItem>

                {/* Ligas da API */}
                {leagues.map(league => (
                  <SelectItem key={league.id} value={league.id}>
                    {league.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Seletor de Formação */}
            <Select value={formation} onValueChange={(value: '433' | '442' | '352') => setFormation(value)}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="433">4-3-3</SelectItem>
                <SelectItem value="442">4-4-2</SelectItem>
                <SelectItem value="352">3-5-2</SelectItem>
              </SelectContent>
            </Select>

            {/* Botão Importar do Time Principal - apenas em ligas reais, NUNCA no template */}
            {user?.mainTeam &&
             selectedLeagueId !== 'main_template' &&
             selectedLeagueId &&
             selectedLeagueId.trim() !== '' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportFromMainTeam}
                disabled={!editingAllowed || isLoadingTeam}
                className="flex items-center gap-2"
              >
                {isLoadingTeam ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('loading')}
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Importar Time Principal
                  </>
                )}
              </Button>
            )}

            {/* Indicador de Status da Rodada */}
            <Badge
              variant="default"
              className={`flex items-center gap-1 ${
                editingAllowed
                  ? 'bg-green-600 text-white'
                  : (selectedCompetitionStatus === 'COMPLETED' ? 'bg-gray-600 text-white' : 'bg-red-600 text-white')
              }`}
            >
              <Clock className="w-3 h-3" />
              {(() => {
                if (editingAllowed) return t('roundOpen');
                if (selectedCompetitionStatus === 'COMPLETED') return "Rodada Encerrada"; // Fallback text if key missing
                return t('roundInProgress');
              })()}
            </Badge>
          </div>
        </div>

        {/* Mensagem de Sucesso */}
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Status de Conexão e Pagamento */}
        {!connected && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('connectWalletBanner')}
            </AlertDescription>
          </Alert>
        )}

        {connected && isLoadingTeam && (
          <Alert className="mb-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              {t('verifyingPayment')}
            </AlertDescription>
          </Alert>
        )}

        {/* ⚠️ NOVO: Aviso de competição ACTIVE (edição bloqueada) */}
        {selectedLeagueId !== 'main_template' && ((selectedCompetitionStatus || competitionData?.status) === 'ACTIVE') && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-300">
              <div className="flex flex-col gap-2">
                <span className="font-semibold">Rodada em Andamento</span>
                <span className="text-sm">
                  A edição de times está bloqueada enquanto a competição está ATIVA. Você pode visualizar os tokens disponíveis, mas não poderá salvar alterações até a próxima rodada.
                </span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* ✅ NOVO: Alerta de rodada encerrada (não permite pagamento) */}
        {connected && hasValidEntry === false && selectedCompetitionStatus === 'COMPLETED' && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-300">
              <div className="flex flex-col gap-2">
                <span className="font-medium">{t('roundCompletedTitle')}</span>
                <span className="text-sm">{t('roundCompletedMessage')}</span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* ✅ NOVO: Alerta de rodada ativa (não permite pagamento) */}
        {connected && hasValidEntry === false && selectedCompetitionStatus === 'ACTIVE' && (
          <Alert className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-300">
              <div className="flex flex-col gap-2">
                <span className="font-medium">{t('roundActiveTitle')}</span>
                <span className="text-sm">{t('roundActiveMessage')}</span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Alerta de pagamento (só mostra se rodada for UPCOMING ou indefinida) */}
        {connected && hasValidEntry === false && paymentError && 
         selectedCompetitionStatus !== 'COMPLETED' && selectedCompetitionStatus !== 'ACTIVE' && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="flex flex-col gap-2">
                <span>{paymentError}</span>
                {currentLeague && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      Pague a taxa de entrada ({currentLeague.entryFee} SOL) para participar da {currentLeague.name}:
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePayEntryFee}
                      disabled={isLoadingTeam}
                      className="text-orange-600 border-orange-300 hover:bg-orange-100"
                    >
                      {isLoadingTeam ? t('processing') : t('payAndJoin', { fee: currentLeague.entryFee })}
                    </Button>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Nome do Time */}
        {connected && hasValidEntry !== false && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {t('teamNameLabel')}
                  </label>
                  <div className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground">
                    {teamName}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('teamNameHelp')}
                  </p>
                </div>
                {hasValidEntry && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">{t('paymentConfirmed')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações da Liga */}
        {fixedFilter && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {fixedFilter.label}
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Esta liga permite apenas tokens da categoria {fixedFilter.label}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navegador de Rodadas - apenas para ligas reais, não template */}
        {selectedLeagueId && selectedLeagueId !== 'main_template' && (
          <div className="mb-8">
            <CompetitionNavigator
              leagueId={selectedLeagueId}
              currentCompetitionId={selectedCompetitionId}
              onSelectCompetition={handleSelectCompetition}
              onCopyFromPrevious={handleCopyFromPrevious}
              refreshTrigger={competitionRefreshTrigger}
            />
          </div>
        )}

        {/* Layout Principal */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* 🚧 TEMPORÁRIO: Modal de pagamento desabilitado até implementar smart contract */}
          {/* Overlay para bloquear interação quando pagamento não confirmado */}
          {/* {connected && hasValidEntry === false && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
              <Card className="max-w-md mx-4">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 dark:text-white">Pagamento Necessário</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {currentLeague?.type === 'main'
                      ? 'Você precisa pagar a taxa de entrada da Liga Principal para criar seu time.'
                      : `Você precisa pagar a taxa de entrada da ${currentLeague?.name} para criar seu time.`
                    }
                  </p>
                  <Button asChild>
                    <LocalizedLink href={currentLeague?.type === 'main' ? "/ligas" : `/ligas?highlight=${selectedLeagueId}`}>
                      {currentLeague?.type === 'main'
                        ? 'Ir para Liga Principal'
                        : `Pagar ${currentLeague?.name}`
                      }
                    </LocalizedLink>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )} */}
          {/* Campo de Futebol */}
          <div>
            <Card>
              <CardHeader>
                {/* DIV PAI - Layout Responsivo: vertical no mobile, horizontal no desktop */}
                <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">

                  {/* GRUPO ESQUERDA - Título + Contador */}
                  <div className="flex items-center gap-3 flex-wrap">

                    {/* TÍTULO */}
                    <div className="leading-none font-semibold flex items-center gap-2 w-fit">
                      <Target className="w-5 h-5 flex-shrink-0" />
                      {t('teamSetup')}
                    </div>

                    {/* ✅ CONTADOR UNIFICADO DA RODADA - Apenas para ligas reais, não template */}
                    {selectedLeagueId !== 'main_template' && (
                      <CountdownTimer leagueId={selectedLeagueId} className="text-xs" />
                    )}

                  </div>

                  {/* GRUPO DIREITA - Botões (alinhados à direita no mobile) */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetTeam}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {tCommon('reset')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveTeam}
                      disabled={!connected || isSavingTeam || players.length !== 10 || !editingAllowed}
                      className="flex items-center gap-1"
                    >
                      {!editingAllowed ? (
                        <>
                          <Clock className="w-4 h-4" />
                          {t('editingBlocked')}
                        </>
                      ) : isSavingTeam ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('saving')}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {tCommon('save')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SoccerField
                  players={players}
                  onAddPlayer={handleAddPlayer}
                  onRemovePlayer={handleRemovePlayer}
                  formation={formation}
                  selectedToken={selectedToken}
                  onTokenAdd={handleTokenAdd}
                  selectedPosition={selectedPosition}
                  roundScore={existingTeam?.totalPoints}
                  roundRank={existingTeam?.rank}
                  leagueTotalScore={leagueStats?.totalScore}
                  leagueRank={leagueStats?.rank}
                  competitionStatus={selectedCompetitionStatus || competitionData?.status}
                />
              </CardContent>
            </Card>

            {/* Estatísticas da Escalação */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  {t('teamStats')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                  {/* Pontuação da Rodada */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {existingTeam?.totalPoints !== undefined ? Number(existingTeam.totalPoints).toFixed(2) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {t('roundScore')}
                      {selectedCompetitionStatus === 'ACTIVE' && existingTeam?.totalPoints === 0 && (
                        <div className="text-xs text-orange-500 mt-1">
                          (Aguardando conclusão)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ranking da Rodada */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {existingTeam?.rank ? `#${existingTeam.rank}` : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {t('roundRanking')}
                      {selectedCompetitionStatus === 'ACTIVE' && (
                        <div className="text-xs text-orange-500 mt-1">
                          (Aguardando conclusão)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Melhor Ativo (baseado em change_7d) */}
                  <div className="text-center">
                    {(() => {
                      if (players.length === 0) {
                        return (
                          <>
                            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">N/A</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{t('bestAsset')}</div>
                          </>
                        );
                      }
                      const best = players.reduce((prev, current) =>
                        ((current.priceChange7d || current.priceChange7d || 0) > (prev.priceChange7d || prev.priceChange7d || 0)) ? current : prev
                      );
                      return (
                        <>
                          <div className="text-lg font-bold text-green-600">
                            {best.symbol || best.symbol || '?'}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            +{(best.priceChange7d || best.priceChange7d || 0).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{t('bestAsset')}</div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Pior Ativo (baseado em change_7d) */}
                  <div className="text-center">
                    {(() => {
                      if (players.length === 0) {
                        return (
                          <>
                            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">N/A</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{t('worstAsset')}</div>
                          </>
                        );
                      }
                      const worst = players.reduce((prev, current) =>
                        ((current.priceChange7d || current.priceChange7d || 0) < (prev.priceChange7d || prev.priceChange7d || 0)) ? current : prev
                      );
                      return (
                        <>
                          <div className="text-lg font-bold text-red-600">
                            {worst.symbol || worst.symbol || '?'}
                          </div>
                          <div className="text-xs text-red-600">
                            {(worst.priceChange7d || worst.priceChange7d || 0).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">{t('worstAsset')}</div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Performance 7d */}
                  <div className="text-center">
                    {(() => {
                      const performance7d = players.length > 0
                        ? (players.reduce((sum, p) => sum + (p.priceChange7d || p.priceChange7d || 0), 0) / players.length)
                        : 0;
                      const getPerformanceColor = (value: number) => {
                        if (value > 5) return 'text-green-600';
                        if (value > 0) return 'text-green-500';
                        if (value < -5) return 'text-red-600';
                        return 'text-red-500';
                      };
                      return (
                        <>
                          <div className={`text-2xl font-bold ${getPerformanceColor(performance7d)}`}>
                            {performance7d > 0 ? '+' : ''}{performance7d.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">{t('performance7d')}</div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market de Tokens */}
          <div className="xl:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Token Market
                  {selectedPosition && (
                    <Badge variant="outline">
                      Posição {selectedPosition}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TokenMarket
                  selectedToken={selectedToken}
                  onTokenSelect={handleTokenSelect}
                  onSelectToken={selectedPosition ? (token) => handleTokenAdd(token, selectedPosition) : undefined}
                  usedTokens={usedTokens}
                  fixedFilter={fixedFilter}
                  onAutoPosition={handleAutoPosition}
                  isTemplateMode={selectedLeagueId === 'main_template'}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
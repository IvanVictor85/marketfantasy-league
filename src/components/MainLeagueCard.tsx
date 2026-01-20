'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trophy, Users, Coins, Clock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppWalletStatus } from '@/hooks/useAppWalletStatus';
import { useGuardedActionHook } from '@/hooks/useGuardedActionHook';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { LocalizedLink } from '@/components/ui/localized-link';
import { useAuth } from '@/contexts/auth-context';
import { useLocaleNavigation } from '@/hooks/useLocaleNavigation';
import { useRoundTimer } from '@/hooks/useRoundTimer';
import { useTranslations } from 'next-intl';

interface MainLeagueData {
  id: string;
  name: string;
  description: string;
  entryFee: number;
  totalPrizePool: number;
  participantCount: number;

  // ✅ REFATORAÇÃO: Dados "crus" da competição
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | null;
  startDate: string | null;  // Data de LOCK (domingo 21h)
  endDate: string | null;    // Data de FIM (sexta 21h)
  activeCompetitionId: string | null;  // ID da rodada ativa

  // ✅ NOVO: Informações da temporada
  season?: {
    id: string;
    name: string;
    prizePool: number;
    status: string;
    totalRounds: number;
    completedRounds: number;
    currentRoundNumber: number | null;
  } | null;

  // Campos legados (para compatibilidade)
  isActive?: boolean;
  round?: {
    current: number;
    timeRemaining: number;
    isActive: boolean;
  };
}

interface EntryStatus {
  hasPaid: boolean;
  error?: string;
  entry?: {
    transactionHash: string;
    amountPaid: number;
    createdAt: string;
  };
}

/**
 * ✅ REFATORAÇÃO: Calcular o estado atual da competição
 * Esta função implementa a lógica de 4 estados baseada nos dados "crus" da API
 *
 * ⚠️ IMPORTANTE: Prioriza o status do banco sobre verificações de data
 * Isso permite testes e controle manual do estado da competição
 */
type CompetitionState =
  | 'DRAFT_OPEN'      // Antes de startDate - Draft aberto, pode entrar
  | 'LOCKED'          // Entre startDate e endDate - Rodada em andamento, times trancados
  | 'FINISHED'        // Após endDate ou status COMPLETED - Rodada finalizada
  | 'UNKNOWN';        // Sem dados ou status inválido

function getCompetitionState(
  status: MainLeagueData['status'],
  startDate: string | null,
  endDate: string | null
): CompetitionState {
  if (!status) {
    return 'UNKNOWN';
  }

  // ✅ PRIORIDADE 1: Status COMPLETED sempre resulta em FINISHED
  if (status === 'COMPLETED') {
    return 'FINISHED';
  }

  // ✅ PRIORIDADE 2: Status ACTIVE - verificar datas apenas como guia
  if (status === 'ACTIVE') {
    if (!startDate || !endDate) {
      // Se não tem datas mas está ACTIVE, considerar draft aberto
      return 'DRAFT_OPEN';
    }

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // ⚠️ MODO DE TESTE: Se status é ACTIVE, sempre permitir entrada
    // independente das datas, para facilitar testes
    // Quando estiver em produção, pode mudar para LOCKED se já passou de startDate

    // Se ainda não começou, draft está aberto
    if (now < start) {
      return 'DRAFT_OPEN';
    }

    // ✅ MUDANÇA PARA TESTES: Mesmo após startDate, se ACTIVE, manter DRAFT_OPEN
    // Isso permite entrar na rodada para testar mesmo depois do início
    // Em produção, você pode comentar esta linha e descomentar a de baixo
    return 'DRAFT_OPEN'; // ← MODO TESTE: Sempre permite entrada

    // Descomentar para produção (bloqueia entrada após início):
    // return 'LOCKED';
  }

  // ✅ PRIORIDADE 3: Status PENDING - draft aberto
  if (status === 'PENDING') {
    return 'DRAFT_OPEN';
  }

  return 'UNKNOWN';
}

// Componente inline para exibir o timer da rodada
function RoundTimerInline() {
  const tLeagues = useTranslations('leagues');
  const { formatTime, loading, isExpired } = useRoundTimer({ leagueId: 'main-league' });

  if (loading) return <span className="text-gray-400">{tLeagues('loading')}</span>;
  if (isExpired) return <span className="text-red-600">🔴 {tLeagues('roundInProgress')}</span>;

  return <span className="text-green-600">🟢 {tLeagues('startsIn')} {formatTime()}</span>;
}

export function MainLeagueCard() {
  const { publicKey, connected, sendTransaction, isMismatched, canExecuteAction } = useGuardedActionHook();
  const { profileWallet, isProfileLoading } = useAppWalletStatus();
  const t = useTranslations('LeaguesPage');
  const tLeagues = useTranslations('leagues');
  const { user, isAuthenticated, connectWalletToUser } = useAuth();
  const { setVisible } = useWalletModal();
  const { push } = useLocaleNavigation();

  const [leagueData, setLeagueData] = useState<MainLeagueData | null>(null);
  const [entryStatus, setEntryStatus] = useState<EntryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingEntry, setIsCheckingEntry] = useState(true);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false); // NOVO: Estado para vinculação manual
  const [error, setError] = useState<string | null>(null);

  // 🛡️ SAFEGUARD: Prevent duplicate calls
  const lastCheckRef = useRef<string | null>(null);
  const checkInProgressRef = useRef<boolean>(false);

  const fetchLeagueData = async (retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      console.log(`🚀 MainLeagueCard: Tentativa ${retryCount + 1}/${maxRetries + 1} - Iniciando busca de dados da liga...`);
      
      // Estratégia 1: Fetch normal
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
      
      const response = await fetch('/api/league/main', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('📡 MainLeagueCard: Response status:', response.status);
      console.log('📡 MainLeagueCard: Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ MainLeagueCard: Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ MainLeagueCard: Dados da liga recebidos:', data);
      setLeagueData(data);
      setError(null);
      
    } catch (err) {
      console.error(`❌ MainLeagueCard: Erro na tentativa ${retryCount + 1}:`, err);
      
      // Se não é a última tentativa, tenta novamente
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`⏳ MainLeagueCard: Tentando novamente em ${delay}ms...`);
        setTimeout(() => fetchLeagueData(retryCount + 1), delay);
        return;
      }
      
      // Estratégia 2: Fallback com dados mock se todas as tentativas falharam
      console.log('🔄 MainLeagueCard: Todas as tentativas falharam, usando dados de fallback...');
      
      const fallbackData = {
        id: 'main-league-fallback',
        name: tLeagues('mainLeagueName'),
        description: tLeagues('mainLeagueDescription'),
        entryFee: 0.025, // ✅ Atualizado para 0.025 SOL
        totalPrizePool: 0.025,
        participantCount: 0,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        round: {
          current: 1,
          timeRemaining: 7 * 24 * 60 * 60 * 1000, // 7 dias
          isActive: true
        }
      };
      
      setLeagueData(fallbackData);
      setError('Usando dados offline. Alguns recursos podem estar limitados.');
      
    } finally {
      setLoading(false);
    }
  };

  const checkEntryStatus = useCallback(async () => {
    // 🔒 CORREÇÃO CRÍTICA: Usar carteira do perfil, não a carteira conectada
    if (!profileWallet || !leagueData) {
      console.log('🔍 MainLeagueCard: Não verificando entrada - sem carteira do perfil ou dados da liga');
      setIsCheckingEntry(false);
      return;
    }

    // 🛡️ SAFEGUARD 1: Prevent duplicate calls
    const checkKey = `${profileWallet}-${leagueData.id}`;
    if (checkInProgressRef.current || lastCheckRef.current === checkKey) {
      console.log('🛡️ SAFEGUARD: Chamada duplicada bloqueada (MainLeagueCard)', { checkKey, inProgress: checkInProgressRef.current });
      setIsCheckingEntry(false);
      return;
    }

    console.log('🔍 MainLeagueCard: Verificando entrada na liga', {
      timestamp: new Date().toISOString(),
      profileWallet, // ✅ Usando carteira do perfil
      leagueId: leagueData.id
    });

    // 🛡️ SAFEGUARD 2: Mark as in progress
    checkInProgressRef.current = true;
    lastCheckRef.current = checkKey;
    setIsCheckingEntry(true);

    try {
      // ✅ CORREÇÃO: Não precisa verificar token do localStorage
      // A API usa cookies de sessão que são enviados automaticamente

      // Verificar se o usuário está autenticado
      if (!isAuthenticated || !user) {
        console.log('⏩ [MAINLEAGUECARD] Usuário não autenticado, pulando verificação');
        setEntryStatus({ hasPaid: false, error: 'Usuário não autenticado' });
        checkInProgressRef.current = false;
        return;
      }

      console.log('🔍 MainLeagueCard: Dados do usuário:', {
        isAuthenticated,
        userId: user?.id,
        userEmail: user?.email,
        userPublicKey: user?.publicKey
      });

      // ✅ REFATORAÇÃO: Enviar competitionId em vez de leagueId
      if (!leagueData.activeCompetitionId) {
        console.error('❌ MainLeagueCard: Nenhuma competição ativa encontrada');
        setEntryStatus({ hasPaid: false, error: 'Nenhuma rodada ativa disponível' });
        return;
      }

      console.log('📡 MainLeagueCard: Enviando requisição para check-entry:', {
        url: '/api/league/check-entry',
        method: 'POST',
        competitionId: leagueData.activeCompetitionId
      });

      // ✅ CORREÇÃO: Cookies de sessão são enviados automaticamente
      const response = await fetch('/api/league/check-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Garantir que cookies sejam enviados
        body: JSON.stringify({
          competitionId: leagueData.activeCompetitionId
        })
      });

      console.log('📡 MainLeagueCard: Resposta da API:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ MainLeagueCard: Status de entrada recebido:', data);
        setEntryStatus(data);
        
        // Update league data with latest info
        if (data.league) {
          console.log('📊 MainLeagueCard: Atualizando dados da liga:', data.league);
          setLeagueData(prev => prev ? { ...prev, ...data.league } : null);
        }
      } else {
        console.error('❌ MainLeagueCard: Erro na resposta da API:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ MainLeagueCard: Detalhes do erro:', errorData);
        setEntryStatus({ hasPaid: false, error: `Erro ${response.status}: ${response.statusText}` });
      }
    } catch (err) {
      console.error('❌ MainLeagueCard: Erro ao verificar status de entrada:', err);
    } finally {
      // 🛡️ SAFEGUARD 3: Release lock after completion
      checkInProgressRef.current = false;
      setIsCheckingEntry(false);
    }
  }, [profileWallet, leagueData, setEntryStatus, setLeagueData]);

  // Fetch league data
  useEffect(() => {
    fetchLeagueData();
  }, []);

  // Check entry status when profile wallet changes (with debounce)
  useEffect(() => {
    console.log('🔍 [MAINLEAGUECARD-EFFECT] Check-Entry: Executado com:', {
      profileWallet,
      isProfileLoading,
      isAuthenticated,
      hasLeagueData: !!leagueData,
      activeCompetitionId: leagueData?.activeCompetitionId
    });

    // 🔒 GUARD CLAUSE: Se não houver carteira ou perfil está carregando, setar isCheckingEntry = false
    if (!profileWallet || isProfileLoading) {
      console.log('⏩ [MAINLEAGUECARD] Aguardando carteira ou perfil...');
      setIsCheckingEntry(false);
      return;
    }

    // ✅ CORREÇÃO: Aguardar autenticação
    if (!isAuthenticated) {
      console.log('⏩ [MAINLEAGUECARD] Aguardando autenticação...');
      setIsCheckingEntry(false);
      return;
    }

    // ✅ CORREÇÃO: Não executar se activeCompetitionId não estiver disponível
    if (!leagueData?.activeCompetitionId) {
      console.log('⏳ MainLeagueCard: Aguardando activeCompetitionId...');
      setIsCheckingEntry(false);
      return;
    }

    if (leagueData) {
      const timeoutId = setTimeout(() => {
        console.log('✅ [MAINLEAGUECARD] Condições satisfeitas, chamando checkEntryStatus');
        checkEntryStatus();
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileWallet, leagueData?.activeCompetitionId, isProfileLoading, isAuthenticated]);

  const handleConnectWallet = () => {
    setVisible(true);
  };

  // NOVO: Função para vincular carteira manualmente (Plano B)
  const handleLinkWallet = async () => {
    if (!connected || !publicKey) {
      console.error('❌ [LINK-WALLET] Carteira não conectada');
      setError('Carteira não conectada. Tente novamente.');
      return;
    }

    setIsLinking(true);
    setError(null);

    try {
      console.log('🔗 [LINK-WALLET] Iniciando vinculação manual:', publicKey.toString());

      // 1. Chamar API de vinculação manualmente
      const response = await fetch('/api/user/link-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Usar cookies de sessão
        body: JSON.stringify({ publicKey: publicKey.toString() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao vincular carteira');
      }

      console.log('✅ [LINK-WALLET] Carteira vinculada com sucesso');

      // 2. Atualizar o contexto de autenticação
      await connectWalletToUser();

      // 3. Revalidar status de entrada
      if (leagueData) {
        await checkEntryStatus();
      }

      console.log('🎉 [LINK-WALLET] Vinculação completa! Pronto para entrar na liga.');

    } catch (err) {
      console.error('❌ [LINK-WALLET] Erro ao vincular carteira:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao vincular carteira';
      setError(errorMessage);
    } finally {
      setIsLinking(false);
    }
  };

  // Função principal de ação do botão (lógica de 3 estados)
  const handleActionClick = async () => {
    // ESTADO 1: VINCULADO (Sessão OK)
    // A carteira está no banco. Pode entrar na liga.
    if (profileWallet) {
      handleEnterLeague();
      return;
    }

    // ESTADO 2: NÃO VINCULADO e NÃO CONECTADO
    // Apenas abre o modal de conexão
    if (!connected) {
      setVisible(true);
      return;
    }

    // ESTADO 3: NÃO VINCULADO, mas CONECTADO
    // O Plano A falhou ou está lento. Vamos forçar a vinculação AGORA.
    if (connected && publicKey && !profileWallet) {
      handleLinkWallet();
      return;
    }
  };

  const handleEnterLeague = async () => {
    // Verificar se pode executar a ação
    if (!canExecuteAction()) {
      return;
    }

    if (!connected || !publicKey || !leagueData) {
      handleConnectWallet();
      return;
    }

    console.log('🚀 MainLeagueCard: Iniciando processo de entrada na liga');
    console.log('🚀 MainLeagueCard: Usuário:', publicKey.toString());
    console.log('🚀 MainLeagueCard: Liga:', leagueData.name, 'Taxa:', leagueData.entryFee, 'SOL');

    setTransactionLoading(true);
    setError(null);

    try {
      // Create connection
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        'confirmed'
      );

      // Verificar se a conexão está funcionando
      try {
        await connection.getVersion();
      } catch (networkError) {
        throw new Error('Erro de conexão com a rede Solana. Verifique sua internet.');
      }

      // Verificar saldo antes de prosseguir
      const balance = await connection.getBalance(publicKey);
      const requiredAmount = leagueData.entryFee * LAMPORTS_PER_SOL;
      
      if (balance < requiredAmount) {
        throw new Error(`Saldo insuficiente. Necessário: ${leagueData.entryFee} SOL, Disponível: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      }

      // Get recent blockhash with retry
      let blockhash;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const result = await connection.getLatestBlockhash('confirmed');
          blockhash = result.blockhash;
          break;
        } catch (blockhashError) {
          attempts++;
          if (attempts === maxAttempts) {
            throw new Error('Erro ao obter blockhash da rede. Tente novamente.');
          }
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }

      // Create transaction
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: publicKey
      });

      // For now, we'll send SOL to a treasury wallet
      // In production, this would interact with the Solana Program
      const treasuryWallet = new PublicKey(
        process.env.NEXT_PUBLIC_MAIN_LEAGUE_PROTOCOL_WALLET || 
        'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH' // Fallback devnet wallet
      );

      const transferInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: treasuryWallet,
        lamports: leagueData.entryFee * LAMPORTS_PER_SOL
      });

      transaction.add(transferInstruction);

      // Send transaction
      console.log('💸 MainLeagueCard: Enviando transação para carteira do tesouro...');
      const signature = await sendTransaction(transaction, connection);
      console.log('✅ MainLeagueCard: Transação enviada com assinatura:', signature);

      // Wait for confirmation with timeout
      try {
        console.log('⏳ MainLeagueCard: Aguardando confirmação da transação...');
        const latestBlockhash = await connection.getLatestBlockhash();
        const confirmation = await connection.confirmTransaction(
          {
            signature,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
          },
          'confirmed'
        );
        
        if (confirmation.value.err) {
          throw new Error(`Transação falhou: ${confirmation.value.err.toString()}`);
        }
        
        console.log('🎉 MainLeagueCard: Transação confirmada:', signature);
      } catch (confirmError) {
        console.error('❌ MainLeagueCard: Erro na confirmação da transação:', confirmError);
        throw new Error('Erro ao confirmar transação. Verifique o status na carteira.');
      }

      // ✅ REFATORAÇÃO: Confirmar entrada com competitionId
      console.log('🔄 MainLeagueCard: Confirmando entrada com o backend...');

      if (!leagueData?.activeCompetitionId) {
        throw new Error('Nenhuma rodada ativa disponível');
      }

      const confirmResponse = await fetch('/api/league/confirm-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Usar cookies de sessão
        body: JSON.stringify({
          transactionHash: signature,
          competitionId: leagueData.activeCompetitionId
        })
      });

      if (!confirmResponse.ok) {
        console.error('❌ MainLeagueCard: Erro na confirmação com backend:', confirmResponse.status, confirmResponse.statusText);
        throw new Error('Failed to confirm entry');
      }

      const confirmData = await confirmResponse.json();
      console.log('✅ MainLeagueCard: Entrada confirmada com sucesso:', confirmData);
      
      // Update entry status
      setEntryStatus({
        hasPaid: true,
        entry: confirmData.entry
      });

      // Update league data
      if (confirmData.league) {
        console.log('📊 MainLeagueCard: Atualizando dados da liga após confirmação:', confirmData.league);
        setLeagueData(prev => prev ? { ...prev, ...confirmData.league } : null);
      }

      // Redirect to team creation
      console.log('🚀 MainLeagueCard: Redirecionando para criação de time...');
      push('/teams?league=main&new=true');

    } catch (err) {
      console.error('Error entering league:', err);
      
      // Tratamento específico para diferentes tipos de erro
      let errorMessage = 'Erro ao entrar na liga';
      
      if (err instanceof Error) {
        // Erros específicos da carteira
        if (err.message.includes('User rejected') || err.message.includes('rejected the request')) {
          errorMessage = 'Transação cancelada pelo usuário';
        } else if (err.message.includes('Insufficient funds') || err.message.includes('insufficient')) {
          errorMessage = 'Saldo insuficiente para completar a transação';
        } else if (err.message.includes('Network error') || err.message.includes('connection')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente';
        } else if (err.message.includes('Blockhash not found') || err.message.includes('blockhash')) {
          errorMessage = 'Erro de rede Solana. Tente novamente em alguns segundos';
        } else if (err.message.includes('Transaction simulation failed')) {
          errorMessage = 'Falha na simulação da transação. Verifique seu saldo e tente novamente';
        } else if (err.message === 'Unexpected error' || err.message.trim() === '') {
          errorMessage = 'Erro inesperado. Verifique sua carteira e conexão';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setTransactionLoading(false);
    }
  };

  const formatTimeRemaining = (milliseconds: number) => {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Menos de 1h';
  };

  if (loading) {
    return (
      <Card className="border-[#F4A261] border-2">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!leagueData) {
    return (
      <Card className="border-red-200 border-2">
        <CardContent className="py-12">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {tLeagues('notFound')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-accent border-2 bg-card">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{leagueData.name}</h3>
          <Badge className="bg-secondary text-secondary-foreground font-bold text-xs">
            {tLeagues("officialBadge")}
          </Badge>
        </div>
        {leagueData.season && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {leagueData.season.name} • Rodada {leagueData.season.currentRoundNumber || '-'}/{leagueData.season.totalRounds} • {leagueData.season.completedRounds} completadas
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{leagueData.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{leagueData.description}</p>
        </div>

        {/* ✅ NOVO: Informações da Temporada */}
        {leagueData.season && (
          <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {leagueData.season.name}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {leagueData.season.status === 'ACTIVE' ? '🔴 Ativa' : '✅ Finalizada'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Rodada:</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {leagueData.season.currentRoundNumber || '-'} / {leagueData.season.totalRounds}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Prêmio Total:</span>
                <span className="font-bold text-yellow-600 dark:text-yellow-400">
                  {leagueData.season.prizePool.toFixed(3)} SOL
                </span>
              </div>
            </div>

            {/* Barra de progresso das rodadas */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Progresso</span>
                <span>{leagueData.season.completedRounds} completadas</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(leagueData.season.completedRounds / leagueData.season.totalRounds) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* League Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-accent" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('entry')}</span>
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {leagueData.entryFee} SOL
          </div>
          
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-accent" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('totalPrize')}</span>
          </div>
          <div className="text-sm font-bold text-accent">
            {leagueData.totalPrizePool} SOL
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-accent" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('participants')}</span>
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {leagueData.participantCount}
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-accent" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('nextRound')}</span>
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
            <RoundTimerInline />
          </div>
        </div>

        {/* Entry Status */}
        {entryStatus?.hasPaid && !isMismatched && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {tLeagues('alreadyJoined')} 
              <span className="font-medium ml-1">
                {tLeagues('transaction')}: {entryStatus.entry?.transactionHash.slice(0, 8)}...
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="mb-4 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 flex items-center justify-between">
              <span>{error}</span>
              {error.includes('offline') && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    fetchLeagueData(0);
                  }}
                  className="ml-2 h-6 text-xs"
                >
                  Tentar Novamente
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter>
        {/* Loading inicial da verificação de entrada */}
        {isCheckingEntry ? (
          <Button
            disabled
            className="w-full bg-gray-500 text-white cursor-not-allowed"
          >
            {tLeagues('verifying')}
          </Button>
        )

        /* Usuário já pagou e está na liga */
        : entryStatus?.hasPaid && profileWallet && !isMismatched ? (
          <Button
            asChild
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <LocalizedLink href="/teams?league=main">
              {tLeagues("viewMyTeam")}
            </LocalizedLink>
          </Button>
        )

        /* Carteira incompatível (mismatch) */
        : isMismatched ? (
          <Button
            disabled
            className="w-full bg-red-600 text-white cursor-not-allowed"
          >
            Carteira Incompatível
          </Button>
        )

        /* ✅ REFATORAÇÃO: LÓGICA DE 4 ESTADOS */

        /* ESTADO 1: VINCULADO (profileWallet existe) */
        : profileWallet ? (
          (() => {
            const competitionState = getCompetitionState(
              leagueData.status,
              leagueData.startDate,
              leagueData.endDate
            );

            // Estado: Draft Aberto (pode entrar)
            if (competitionState === 'DRAFT_OPEN') {
              return (
                <Button
                  onClick={handleActionClick}
                  disabled={transactionLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                >
                  {transactionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {tLeagues('processing')}
                    </>
                  ) : (
                    `${tLeagues("joinRound")} (${leagueData.entryFee} SOL)`
                  )}
                </Button>
              );
            }

            // Estado: Rodada em Andamento (times trancados)
            if (competitionState === 'LOCKED') {
              return (
                <Button
                  disabled
                  className="w-full bg-red-600 text-white cursor-not-allowed"
                >
                  🔒 {tLeagues('teamsLocked')}
                </Button>
              );
            }

            // Estado: Rodada Finalizada
            if (competitionState === 'FINISHED') {
              return (
                <Button
                  disabled
                  variant="outline"
                  className="w-full cursor-not-allowed"
                >
                  {tLeagues('leagueFinished')}
                </Button>
              );
            }

            // Estado: Desconhecido (fallback)
            return (
              <Button
                disabled
                variant="outline"
                className="w-full cursor-not-allowed"
              >
                {tLeagues('waiting')}
              </Button>
            );
          })()
        )

        /* ESTADO 2: NÃO VINCULADO e NÃO CONECTADO */
        : !connected ? (
          <Button
            onClick={handleActionClick}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {tLeagues('connectWallet')}
          </Button>
        )

        /* ESTADO 3: NÃO VINCULADO, mas CONECTADO */
        : connected && !profileWallet ? (
          <Button
            onClick={handleActionClick}
            disabled={isLinking}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
          >
            {isLinking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {tLeagues('linking')}
              </>
            ) : (
              tLeagues('linkWallet')
            )}
          </Button>
        )

        /* Fallback */
        : (
          <Button
            onClick={() => setVisible(true)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {tLeagues('connectWallet')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
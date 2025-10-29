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

interface MainLeagueData {
  id: string;
  name: string;
  description: string;
  entryFee: number;
  totalPrizePool: number;
  participantCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  round: {
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

// Componente inline para exibir o timer da rodada
function RoundTimerInline() {
  const { formatTime, loading, isExpired } = useRoundTimer({ leagueId: 'main-league' });

  if (loading) return <span className="text-gray-400">Carregando...</span>;
  if (isExpired) return <span className="text-red-600">🔴 Em andamento</span>;
  
  return <span className="text-green-600">🟢 Inicia em {formatTime()}</span>;
}

export function MainLeagueCard() {
  const { publicKey, connected, sendTransaction, isMismatched, canExecuteAction } = useGuardedActionHook();
  const { profileWallet, isProfileLoading } = useAppWalletStatus();
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
        name: 'Liga Principal',
        description: 'Liga Principal do CryptoFantasy - Competição mensal de tokens',
        entryFee: 0.005,
        totalPrizePool: 0.01,
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
      // Obter token de autenticação
      const token = localStorage.getItem('auth-token');
      console.log('🔑 MainLeagueCard: Token obtido:', token ? 'Presente' : 'Ausente');
      
      if (!token) {
        console.error('❌ MainLeagueCard: Token de autenticação não encontrado');
        setEntryStatus({ hasPaid: false, error: 'Token de autenticação não encontrado' });
        return;
      }

      // Verificar se o usuário está autenticado
      if (!isAuthenticated || !user) {
        console.error('❌ MainLeagueCard: Usuário não autenticado');
        setEntryStatus({ hasPaid: false, error: 'Usuário não autenticado' });
        return;
      }

      console.log('🔍 MainLeagueCard: Dados do usuário:', {
        isAuthenticated,
        userId: user?.id,
        userEmail: user?.email,
        userPublicKey: user?.publicKey
      });

      console.log('📡 MainLeagueCard: Enviando requisição para check-entry:', {
        url: '/api/league/check-entry',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token ? token.substring(0, 20) + '...' : 'null'}`
        },
        body: {
          leagueId: leagueData.id
        }
      });

      const response = await fetch('/api/league/check-entry', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          leagueId: leagueData.id 
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
    // 🔒 GUARD CLAUSE: Se não houver carteira ou perfil está carregando, setar isCheckingEntry = false
    if (!profileWallet || isProfileLoading) {
      setIsCheckingEntry(false);
      return;
    }

    if (leagueData) {
      const timeoutId = setTimeout(() => {
        checkEntryStatus();
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileWallet, leagueData, isProfileLoading]);

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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({ publicKey: publicKey.toString() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao vincular carteira');
      }

      console.log('✅ [LINK-WALLET] Carteira vinculada com sucesso');

      // 2. Atualizar o contexto de autenticação
      await connectWalletToUser(publicKey.toString());

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

      // Confirm entry with backend
      console.log('🔄 MainLeagueCard: Confirmando entrada com o backend...');
      // TEMPORÁRIO: Usar endpoint de teste para bypass da verificação on-chain
      const confirmResponse = await fetch('/api/league/test-entry', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          leagueId: leagueData?.id
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
              Liga Principal não encontrada. Tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-accent border-2 bg-card">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div className="relative w-16 h-16 bg-transparent flex items-center justify-center">
            <Image 
              src="/league-logos/main-league-trophy.png" 
              alt="Liga Principal" 
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <Badge className="bg-secondary text-secondary-foreground font-bold">
            Oficial
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{leagueData.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{leagueData.description}</p>
        </div>

        {/* League Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-accent" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Entrada:</span>
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {leagueData.entryFee} SOL
          </div>
          
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-accent" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Prêmio Total:</span>
          </div>
          <div className="text-sm font-bold text-accent">
            {leagueData.totalPrizePool} SOL
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-accent" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Participantes:</span>
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {leagueData.participantCount}
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-accent" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Próxima Rodada:</span>
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
              Você já está participando desta liga! 
              <span className="font-medium ml-1">
                Transação: {entryStatus.entry?.transactionHash.slice(0, 8)}...
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
            Verificando...
          </Button>
        )

        /* Usuário já pagou e está na liga */
        : entryStatus?.hasPaid && profileWallet && !isMismatched ? (
          <Button
            asChild
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <LocalizedLink href="/teams?league=main">
              Ver Meu Time
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

        /* LÓGICA DE 3 ESTADOS */

        /* ESTADO 1: VINCULADO (profileWallet existe) */
        : profileWallet ? (
          <Button
            onClick={handleActionClick}
            disabled={transactionLoading || !leagueData.round.isActive}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
          >
            {transactionLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : !leagueData.round.isActive ? (
              'Liga Finalizada'
            ) : (
              `Entrar na Liga (${leagueData.entryFee} SOL)`
            )}
          </Button>
        )

        /* ESTADO 2: NÃO VINCULADO e NÃO CONECTADO */
        : !connected ? (
          <Button
            onClick={handleActionClick}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Conectar Carteira
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
                Vinculando...
              </>
            ) : (
              'Vincular Carteira'
            )}
          </Button>
        )

        /* Fallback */
        : (
          <Button
            onClick={() => setVisible(true)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Conectar Carteira
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
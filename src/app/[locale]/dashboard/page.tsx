'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { LocalizedLink } from '@/components/ui/localized-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Coins, 
  Star,
  Calendar,
  Target,
  Award,
  Clock,
  ArrowRight,
  Crown,
  Shield,
  ExternalLink,
  Edit,
  Gift,
  HelpCircle,
  ShoppingCart,
  Plus
} from 'lucide-react';
import { useGuardedActionHook } from '@/hooks/useGuardedActionHook';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getConnectionSync, formatSolAmount, solToLamports } from '@/lib/solana/connection';

const connection = getConnectionSync();
import { depositSol, withdrawSol, getUserDepositedBalance, hasDepositedBalance, getPlatformTreasuryBalance, getPlatformTreasuryAddress, addSolToTreasury } from '@/lib/solana/program';
import { useTransactionState } from '@/components/providers/wallet-provider';
import { toast } from 'sonner';
import { useTeamData } from '@/hooks/useTeamData';
import { useRoundTimer } from '@/hooks/useRoundTimer';
import { RoundPerformance } from '@/components/dashboard/round-performance';
import { PrizeClaims } from '@/components/dashboard/prize-claims';
import { PointsEvolutionChart } from '@/components/dashboard/points-evolution-chart';

// Importando os novos tipos
import { 
  UserData, 
  League, 
  Token, 
  LeagueTeam, 
  MainTeam, 
  TeamSelectOption, 
  DashboardData 
} from '@/types/teams';

// Interface para o mascote salvo
interface SavedMascot {
  id: string;
  imageUrl: string;
  character: string;
  uniformStyle: string;
  accessory?: string;
  createdAt: string;
}

// Mock Data
const mockUserData: UserData = {
  id: "user-1",
  teamName: "Nome do Time",
  userName: "Nome de Usuário",
  mascot: {
    animal: "doge",
    colors: {
      primary: "#F59E0B",
      secondary: "#EAB308", 
      accent: "#FCD34D"
    },
    accessories: {
      hat: "none",
      glasses: "sunglasses",
      shoes: "cleats",
      extra: "none"
    },
    shirt: "solana",
    pose: "default",
    ball: true
  },
  mainTeam: {
    id: "main-team-1",
    userId: "user-1",
    formation: "433",
    createdAt: new Date(),
    updatedAt: new Date(),
    players: [
      { id: "sol", position: 1, name: "Solana", symbol: "SOL", image: "", currentPrice: 100, points: 85, rarity: "legendary", priceChange24h: 12.5, priceChange7d: 0, marketCap: 0, marketCapRank: null },
      { id: "btc", position: 2, name: "Bitcoin", symbol: "BTC", image: "", currentPrice: 45000, points: 92, rarity: "legendary", priceChange24h: 5.2, priceChange7d: 0, marketCap: 0, marketCapRank: null },
      { id: "eth", position: 3, name: "Ethereum", symbol: "ETH", image: "", currentPrice: 2500, points: 88, rarity: "epic", priceChange24h: 3.8, priceChange7d: 0, marketCap: 0, marketCapRank: null },
      { id: "ada", position: 4, name: "Cardano", symbol: "ADA", image: "", currentPrice: 0.5, points: 75, rarity: "rare", priceChange24h: 1.5, priceChange7d: 0, marketCap: 0, marketCapRank: null },
      { id: "dot", position: 5, name: "Polkadot", symbol: "DOT", image: "", currentPrice: 7, points: 78, rarity: "rare", priceChange24h: 2.7, priceChange7d: 0, marketCap: 0, marketCapRank: null },
      { id: "link", position: 6, name: "Chainlink", symbol: "LINK", image: "", currentPrice: 15, points: 82, rarity: "epic", priceChange24h: 4.3, priceChange7d: 0, marketCap: 0, marketCapRank: null },
      { id: "avax", position: 7, name: "Avalanche", symbol: "AVAX", image: "", currentPrice: 35, points: 80, rarity: "rare", priceChange24h: 6.1, priceChange7d: 0, marketCap: 0, marketCapRank: null },
      { id: "matic", position: 8, name: "Polygon", symbol: "MATIC", image: "", currentPrice: 1, points: 76, rarity: "common", priceChange24h: 3.2, priceChange7d: 0, marketCap: 0, marketCapRank: null },
      { id: "doge", position: 9, name: "Dogecoin", symbol: "DOGE", image: "", currentPrice: 0.08, points: 65, rarity: "common", priceChange24h: -4.2, priceChange7d: 0, marketCap: 0, marketCapRank: null },
      { id: "uni", position: 10, name: "Uniswap", symbol: "UNI", image: "", currentPrice: 6, points: 72, rarity: "rare", priceChange24h: 0.8, priceChange7d: 0, marketCap: 0, marketCapRank: null }
    ]
  },
  leagueTeams: [
    {
      id: "team-1",
      leagueId: "1",
      userId: "user-1",
      formation: "433",
      isMainTeam: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      players: [
        { id: "sol", position: 1, name: "Solana", symbol: "SOL", image: "", currentPrice: 100, points: 85, rarity: "legendary", priceChange24h: 12.5, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "btc", position: 2, name: "Bitcoin", symbol: "BTC", image: "", currentPrice: 45000, points: 92, rarity: "legendary", priceChange24h: 5.2, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "eth", position: 3, name: "Ethereum", symbol: "ETH", image: "", currentPrice: 2500, points: 88, rarity: "epic", priceChange24h: 3.8, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "ada", position: 4, name: "Cardano", symbol: "ADA", image: "", currentPrice: 0.5, points: 75, rarity: "rare", priceChange24h: 1.5, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "dot", position: 5, name: "Polkadot", symbol: "DOT", image: "", currentPrice: 7, points: 78, rarity: "rare", priceChange24h: 2.7, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "link", position: 6, name: "Chainlink", symbol: "LINK", image: "", currentPrice: 15, points: 82, rarity: "epic", priceChange24h: 4.3, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "avax", position: 7, name: "Avalanche", symbol: "AVAX", image: "", currentPrice: 35, points: 80, rarity: "rare", priceChange24h: 6.1, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "matic", position: 8, name: "Polygon", symbol: "MATIC", image: "", currentPrice: 1, points: 76, rarity: "common", priceChange24h: 3.2, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "doge", position: 9, name: "Dogecoin", symbol: "DOGE", image: "", currentPrice: 0.08, points: 65, rarity: "common", priceChange24h: -4.2, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "uni", position: 10, name: "Uniswap", symbol: "UNI", image: "", currentPrice: 6, points: 72, rarity: "rare", priceChange24h: 0.8, priceChange7d: 0, marketCap: 0, marketCapRank: null }
      ]
    },
    {
      id: "team-2",
      leagueId: "2",
      userId: "user-1",
      formation: "442",
      isMainTeam: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      players: [
        { id: "btc", position: 1, name: "Bitcoin", symbol: "BTC", image: "", currentPrice: 45000, points: 92, rarity: "legendary", priceChange24h: 5.2, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "eth", position: 2, name: "Ethereum", symbol: "ETH", image: "", currentPrice: 2500, points: 88, rarity: "epic", priceChange24h: 3.8, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "bnb", position: 3, name: "Binance Coin", symbol: "BNB", image: "", currentPrice: 300, points: 85, rarity: "epic", priceChange24h: 7.1, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "xrp", position: 4, name: "Ripple", symbol: "XRP", image: "", currentPrice: 0.6, points: 70, rarity: "common", priceChange24h: 2.3, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "ada", position: 5, name: "Cardano", symbol: "ADA", image: "", currentPrice: 0.5, points: 75, rarity: "rare", priceChange24h: 1.5, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "sol", position: 6, name: "Solana", symbol: "SOL", image: "", currentPrice: 100, points: 85, rarity: "legendary", priceChange24h: 12.5, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "dot", position: 7, name: "Polkadot", symbol: "DOT", image: "", currentPrice: 7, points: 78, rarity: "rare", priceChange24h: 2.7, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "doge", position: 8, name: "Dogecoin", symbol: "DOGE", image: "", currentPrice: 0.08, points: 65, rarity: "common", priceChange24h: -4.2, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "avax", position: 9, name: "Avalanche", symbol: "AVAX", image: "", currentPrice: 35, points: 80, rarity: "rare", priceChange24h: 6.1, priceChange7d: 0, marketCap: 0, marketCapRank: null },
        { id: "shib", position: 10, name: "Shiba Inu", symbol: "SHIB", image: "", currentPrice: 0.00001, points: 60, rarity: "common", priceChange24h: -2.5, priceChange7d: 0, marketCap: 0, marketCapRank: null }
      ]
    }
  ],
  leagues: [
    {
      id: "1",
      leagueName: "Liga Principal",
      rank: 128,
      totalParticipants: 1500,
      partialScore: 8.34,
      lastRoundScore: 2.10,
      status: "active"
    },
    {
      id: "2",
      leagueName: "Liga dos Amigos",
      rank: 3,
      totalParticipants: 12,
      partialScore: 10.45,
      lastRoundScore: 3.20,
      status: "active"
    }
  ]
};

// Dashboard Sidebar Component
const DashboardSidebar = ({ userData, selectedTeamData, savedMascot, isLoading, selectedCompetitionId, userId }: {
  userData: UserData,
  selectedTeamData: { league: League | null, team: LeagueTeam | MainTeam | null, isMainTeam: boolean },
  savedMascot: SavedMascot | null,
  isLoading: boolean,
  selectedCompetitionId?: string | null,
  userId?: string
}) => {
  const t = useTranslations('DashboardPage');
  const wallet = useGuardedActionHook();
  const { publicKey, connected, canExecuteAction } = wallet;
  const { setTransactionActive } = useTransactionState();

  // Estado para estatísticas rápidas (muda conforme seleção)
  const [quickStats, setQuickStats] = useState<{
    rank: number;
    totalParticipants: number;
    partialScore: number;
    lastRoundScore: number;
  } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositedBalance, setDepositedBalance] = useState<number>(0);
  const [treasuryBalance, setTreasuryBalance] = useState<number | null>(null);
  const [isDepositingReal, setIsDepositingReal] = useState(false);
  const [lastDepositTime, setLastDepositTime] = useState<number>(0);
  
  // Modal states
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        if (publicKey) {
          // Buscar saldo da carteira
          const lamports = await connection.getBalance(publicKey);
          setBalance(lamports);
          
          // Buscar saldo depositado na plataforma
          const deposited = await getUserDepositedBalance(publicKey);
          setDepositedBalance(deposited);
          
          // Buscar saldo da treasury
          try {
            const treasuryBal = await getPlatformTreasuryBalance();
            setTreasuryBalance(treasuryBal);
          } catch (err) {
            console.warn('Erro ao buscar saldo da treasury:', err);
            setTreasuryBalance(null);
          }
        } else {
          setBalance(null);
          setDepositedBalance(0);
          setTreasuryBalance(null);
        }
      } catch (err) {
        console.error('Erro ao buscar saldos:', err);
      }
    };
    fetchBalances();
  }, [publicKey]);

  // Buscar estatísticas rápidas baseado na seleção
  useEffect(() => {
    if (!userId || !selectedTeamData.league) {
      setQuickStats(null);
      return;
    }

    const fetchQuickStats = async () => {
      try {
        if (selectedCompetitionId === 'SEASON') {
          // Buscar dados da temporada
          const competition = await fetch(`/api/league/competitions?leagueId=${selectedTeamData.league?.id}`);
          if (competition.ok) {
            const compData = await competition.json();
            const seasonId = compData.competitions?.find((c: any) => c.seasonId)?.seasonId;

            if (seasonId) {
              const response = await fetch(`/api/season/ranking?seasonId=${seasonId}&userId=${userId}`);
              if (response.ok) {
                const data = await response.json();
                const userRanking = data.rankings?.find((r: any) => r.userId === userId);

                setQuickStats({
                  rank: userRanking?.rank || 0,
                  totalParticipants: data.rankings?.length || 0,
                  partialScore: userRanking?.totalPoints || 0,
                  lastRoundScore: data.userBreakdown?.rounds?.[data.userBreakdown.rounds.length - 1]?.points || 0
                });
              }
            }
          }
        } else if (selectedCompetitionId && selectedCompetitionId !== 'all') {
          // Buscar dados da rodada específica
          const response = await fetch(`/api/teams?competitionId=${selectedCompetitionId}`);
          if (response.ok) {
            const data = await response.json();
            const userTeam = data.teams?.find((t: any) => t.userId === userId);

            if (userTeam) {
              setQuickStats({
                rank: userTeam.rank || 0,
                totalParticipants: data.teams?.length || 0,
                partialScore: userTeam.liveScore || userTeam.totalPoints || 0,
                lastRoundScore: userTeam.liveScore || userTeam.totalPoints || 0
              });
            }
          }
        } else {
          // Usar dados padrão da liga
          setQuickStats({
            rank: selectedTeamData.league?.rank || 0,
            totalParticipants: selectedTeamData.league?.totalParticipants || 0,
            partialScore: selectedTeamData.league?.partialScore || 0,
            lastRoundScore: selectedTeamData.league?.lastRoundScore || 0
          });
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas rápidas:', error);
      }
    };

    fetchQuickStats();
  }, [selectedCompetitionId, userId, selectedTeamData.league]);

  const openSolanaFaucet = useCallback(() => {
    if (!publicKey) {
      toast.error('Conecte sua carteira primeiro');
      return;
    }
    
    const faucetUrl = `https://faucet.solana.com/?address=${publicKey.toString()}`;
    window.open(faucetUrl, '_blank');
    
    toast.info('Faucet oficial aberto!', {
      description: 'Use o faucet oficial para obter SOL de teste. Máximo de 2 solicitações a cada 8 horas.',
      duration: 5000,
    });
  }, [publicKey]);

  const handleDepositAirdrop = useCallback(async (amountSol: number) => {
    if (!publicKey) {
      toast.error('Conecte sua carteira para depositar');
      return;
    }
    
    setIsDepositing(true);
    
    try {
      // Limit airdrop amount to prevent rate limiting
      const maxAirdrop = 2; // Maximum 2 SOL per request
      const requestAmount = Math.min(amountSol, maxAirdrop);
      
      toast.info(`Solicitando airdrop de ${requestAmount} SOL...`);
      
      // Request airdrop with retry logic
      let sig: string;
      let retries = 3;
      
      while (retries > 0) {
        try {
          sig = await connection.requestAirdrop(publicKey, solToLamports(requestAmount));
          break;
        } catch (error: any) {
          retries--;
          
          // Check for rate limiting (429 error)
          if (error.message?.includes('429') || error.code === 429) {
            throw new Error('RATE_LIMITED');
          }
          
          if (retries === 0) throw error;
          
          console.warn(`Airdrop attempt failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        }
      }
      
      toast.info('Confirmando transação...');
      
      // Confirm transaction with timeout
      const confirmation = await connection.confirmTransaction(sig!, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
      
      // Update balance
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports);
      
      toast.success(`Airdrop de ${requestAmount} SOL confirmado! Saldo atualizado.`);
      
      // If user requested more than max airdrop, inform them
      if (amountSol > maxAirdrop) {
        toast.info(`Nota: Limite de ${maxAirdrop} SOL por airdrop. Tente novamente para mais SOL.`);
      }
      
    } catch (err: any) {
      console.error('Falha no airdrop:', err);
      
      // Handle rate limiting specifically
      if (err.message === 'RATE_LIMITED' || err.message?.includes('429') || err.code === 429) {
        toast.error('Limite de airdrop atingido!', {
          description: 'Redirecionando para o faucet oficial da Solana...',
          duration: 3000,
        });
        
        // Redirect to official Solana faucet after a short delay
        setTimeout(() => {
          const faucetUrl = `https://faucet.solana.com/?address=${publicKey.toString()}`;
          window.open(faucetUrl, '_blank');
          
          toast.info('Faucet oficial aberto!', {
            description: 'Use o faucet oficial para obter SOL de teste. Máximo de 2 solicitações a cada 8 horas.',
            duration: 5000,
          });
        }, 1500);
        
        return;
      }
      
      let errorMessage = 'Falha ao solicitar airdrop.';
      
      if (err.message?.includes('airdrop')) {
        errorMessage = 'Limite de airdrop atingido. Tente novamente em alguns minutos.';
      } else if (err.message?.includes('rate limit')) {
        errorMessage = 'Muitas solicitações. Aguarde alguns minutos antes de tentar novamente.';
      } else if (err.message?.includes('Internal error')) {
        errorMessage = 'Erro interno do servidor RPC. Tente novamente em alguns momentos.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsDepositing(false);
    }
  }, [publicKey]);

  const handleRealDeposit = useCallback(async (amountSol: number) => {
    if (!publicKey) {
      toast.error('Conecte sua carteira para depositar');
      return;
    }
    
    // Debounce: prevent multiple rapid clicks
    const now = Date.now();
    if (now - lastDepositTime < 3000) { // 3 seconds debounce
      toast.warning('Aguarde alguns segundos antes de fazer outro depósito');
      return;
    }
    
    // Check if user has enough balance
    if (balance === null || balance < solToLamports(amountSol)) {
      toast.error('Saldo insuficiente na carteira');
      return;
    }
    
    setIsDepositingReal(true);
    setLastDepositTime(now);
    
    try {
      toast.info(`Depositando ${amountSol} SOL na plataforma...`);
      
      // Call the deposit function
      const signature = await depositSol(wallet, amountSol, setTransactionActive);
      
      toast.info('Confirmando depósito...');
      
      // Update balances after successful deposit
      const [newWalletBalance, newDepositedBalance, newTreasuryBalance] = await Promise.all([
        connection.getBalance(publicKey),
        getUserDepositedBalance(publicKey),
        getPlatformTreasuryBalance()
      ]);
      
      setBalance(newWalletBalance);
      setDepositedBalance(newDepositedBalance);
      setTreasuryBalance(newTreasuryBalance);
      
      toast.success(`Depósito de ${amountSol} SOL confirmado!`, {
        description: `Saldo depositado: ${formatSolAmount(newDepositedBalance)} SOL`,
        duration: 5000,
      });
      
    } catch (err: any) {
      console.error('Falha no depósito:', err);
      
      let errorMessage = 'Falha ao depositar SOL na plataforma.';
      
      if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Saldo insuficiente para cobrir o depósito e taxas de transação.';
      } else if (err.message?.includes('User rejected')) {
        errorMessage = 'Transação cancelada pelo usuário.';
      } else if (err.message?.includes('Wallet not connected')) {
        errorMessage = 'Carteira não conectada. Conecte sua carteira e tente novamente.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsDepositingReal(false);
    }
  }, [publicKey, balance, lastDepositTime, connected, setTransactionActive, setBalance, setDepositedBalance, setTreasuryBalance, setIsDepositingReal, setLastDepositTime]);

  // Handle modal deposit
  const handleModalDeposit = useCallback(async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Digite um valor válido para depósito');
      return;
    }
    
    await handleRealDeposit(amount);
    setDepositAmount('');
    setIsDepositModalOpen(false);
  }, [depositAmount, handleRealDeposit]);

  // Handle withdrawal
  const handleWithdraw = useCallback(async () => {
    // 🔒 TRAVA DE SEGURANÇA: Verificar compatibilidade de carteira
    if (!canExecuteAction()) {
      console.error('🚨 Dashboard: Ação bloqueada - carteira incompatível');
      return;
    }

    if (!publicKey || !connected) {
      toast.error('Conecte sua carteira adequadamente para retirar');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Digite um valor válido para retirada');
      return;
    }

    // Check if user has sufficient deposited balance
    if (depositedBalance < solToLamports(amount)) {
      toast.error('Saldo insuficiente na plataforma para retirada');
      return;
    }

    setIsWithdrawing(true);

    try {
      toast.info(`Retirando ${amount} SOL da plataforma...`);
      
      // Call the withdraw function
      const signature = await withdrawSol(wallet, amount, setTransactionActive);
      
      toast.info('Confirmando retirada...');
      
      // Update balances after successful withdrawal
      const [newWalletBalance, newDepositedBalance, newTreasuryBalance] = await Promise.all([
        connection.getBalance(publicKey),
        getUserDepositedBalance(publicKey),
        getPlatformTreasuryBalance()
      ]);
      
      setBalance(newWalletBalance);
      setDepositedBalance(newDepositedBalance);
      setTreasuryBalance(newTreasuryBalance);
      
      toast.success(`Retirada de ${amount} SOL confirmada!`, {
        description: `Saldo na carteira: ${formatSolAmount(newWalletBalance)} SOL`,
        duration: 5000,
      });

      setWithdrawAmount('');
      setIsWithdrawModalOpen(false);
      
    } catch (err: any) {
      console.error('Falha na retirada:', err);
      
      let errorMessage = 'Falha ao retirar SOL da plataforma.';
      
      if (err.message?.includes('Saldo insuficiente')) {
        errorMessage = 'Saldo insuficiente na plataforma para retirada.';
      } else if (err.message?.includes('User rejected')) {
        errorMessage = 'Transação cancelada pelo usuário.';
      } else if (err.message?.includes('Wallet not connected')) {
        errorMessage = 'Carteira não conectada. Conecte sua carteira e tente novamente.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsWithdrawing(false);
    }
  }, [publicKey, withdrawAmount, depositedBalance, connected, setTransactionActive, setBalance, setDepositedBalance, setTreasuryBalance, setWithdrawAmount, setIsWithdrawModalOpen, setIsWithdrawing]);

  return (
    <div className="flex flex-col gap-4 w-full lg:w-64">
      {/* Card de Perfil */}
      <Card>
        <CardContent className="p-6 flex flex-col items-center">
          <div className="w-32 h-32 relative mb-4">
            {!isLoading && savedMascot ? (
              <Image
                src={savedMascot.imageUrl}
                alt="Seu Mascote da Sorte"
                fill
                className="object-contain rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎭</div>
                  <p className="text-xs text-gray-600">Sem mascote</p>
                </div>
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold text-center">{userData.teamName}</h3>
          <p className="text-sm text-muted-foreground mb-4">{userData.userName}</p>
          <Button variant="outline" className="w-full" size="sm" asChild>
            <LocalizedLink href="/perfil" prefetch={false}>
              <Edit className="h-4 w-4 mr-2" />
              {t('viewEditProfile')}
            </LocalizedLink>
          </Button>
        </CardContent>
      </Card>

      {/* Card de Saldo e Depósito (Devnet) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t('balanceTitle')}</CardTitle>
          <CardDescription>
            {t('balanceSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <div className="text-sm">
            <p className="text-muted-foreground">{t('walletStatus')}</p>
            <p className="font-medium">
              {connected && publicKey ? `${publicKey.toString().slice(0,4)}...${publicKey.toString().slice(-4)}` : t('notConnected')}
            </p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">{t('balanceOnWallet')}</p>
            <p className="font-semibold">
              {balance !== null ? `${formatSolAmount(balance)} SOL` : '—'}
            </p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">{t('balanceOnPlatform')}</p>
            <p className="font-semibold text-blue-600">
              {publicKey ? `${formatSolAmount(depositedBalance)} SOL` : '—'}
            </p>
          </div>
          <div className="space-y-2">
            {!publicKey ? (
              <Button
                className="w-full"
                disabled={true}
              >
                {t('connectWallet')}
              </Button>
            ) : balance !== null && balance < 500000000 ? (
              <>
                <Button 
                  className="w-full"
                  disabled={!publicKey || isDepositing}
                  onClick={() => handleDepositAirdrop(0.1)}
                >
                  {isDepositing ? 'Depositando...' : 'Depositar 0.1 SOL (Devnet)'}
                </Button>
                <Button 
                  variant="outline"
                  className="w-full text-xs"
                  disabled={!publicKey}
                  onClick={openSolanaFaucet}
                >
                  Faucet Oficial (saldo baixo)
                </Button>
              </>
            ) : balance !== null && balance >= 500000000 ? (
              <>
                <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium">
                    💰 {t('manageSol')}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {t('manageSolSubtitle')}
                  </p>
                </div>
                
                <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full"
                      disabled={!publicKey || isDepositingReal}
                    >
                      {isDepositingReal ? t('depositing') : `💰 ${t('depositSol')}`}
                    </Button>
                  </DialogTrigger>
                  <DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader>
                      <DialogTitle>{t('depositSolTitle')}</DialogTitle>
                      <DialogDescription>
                        {t('depositSolDescription')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="deposit-amount">{t('amountSol')}</Label>
                        <Input
                          id="deposit-amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="Ex: 0.5"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setIsDepositModalOpen(false)}
                        >
                          {t('cancel')}
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={handleModalDeposit}
                          disabled={isDepositingReal || !depositAmount}
                        >
                          {isDepositingReal ? t('depositing') : t('depositSol')}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {depositedBalance >= 10000000 && (
                  <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="w-full"
                        disabled={!publicKey || isWithdrawing}
                      >
                        {isWithdrawing ? t('withdrawing') : `💸 ${t('withdrawSol')}`}
                      </Button>
                    </DialogTrigger>
                    <DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
                      <DialogHeader>
                        <DialogTitle>{t('withdrawSolTitle')}</DialogTitle>
                        <DialogDescription>
                          {t('withdrawSolDescription')}
                          <br />
                          <span className="text-sm text-muted-foreground">
                            Saldo disponível: {formatSolAmount(depositedBalance)} SOL
                          </span>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="withdraw-amount">{t('amountSol')}</Label>
                          <Input
                            id="withdraw-amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={depositedBalance / LAMPORTS_PER_SOL}
                            placeholder="Ex: 0.5"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setIsWithdrawModalOpen(false)}
                          >
                            {t('cancel')}
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={handleWithdraw}
                            disabled={isWithdrawing || !withdrawAmount}
                          >
                            {isWithdrawing ? t('withdrawing') : t('withdrawSol')}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            ) : depositedBalance >= 10000000 ? (
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium">
                  ✅ {t('readyToPlay')}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Você tem SOL depositado na plataforma
                </p>
              </div>
            ) : (
              <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700 font-medium">
                  ⏳ Carregando saldos...
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card de Estatísticas Rápidas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t('statsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {selectedCompetitionId === 'SEASON' ? 'RANK NA TEMPORADA' : t('leagueRank')}
              </p>
              <p className="text-2xl font-bold">
                {selectedTeamData.isMainTeam ? t('teamName') :
                 `${quickStats?.rank || 0} / ${quickStats?.totalParticipants || 0}`}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {selectedCompetitionId === 'SEASON' ? 'PONTOS TOTAIS' : selectedCompetitionId && selectedCompetitionId !== 'all' ? 'PONTOS DA RODADA' : t('partialValue')}
              </p>
              <p className={`text-2xl font-bold ${(quickStats?.partialScore || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {selectedTeamData.isMainTeam ? "N/A" : `${(quickStats?.partialScore || 0) >= 0 ? '+' : ''}${quickStats?.partialScore?.toFixed(2) || 0}${selectedCompetitionId === 'SEASON' ? '' : '%'}`}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {selectedCompetitionId === 'SEASON' ? 'ÚLTIMA RODADA' : selectedCompetitionId && selectedCompetitionId !== 'all' ? 'RODADA ATUAL' : t('lastRound')}
              </p>
              <p className={`text-xl font-bold ${(quickStats?.lastRoundScore || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {selectedTeamData.isMainTeam ? "N/A" : `${(quickStats?.lastRoundScore || 0) >= 0 ? '+' : ''}${quickStats?.lastRoundScore?.toFixed(2) || 0}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Navegação Rápida */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t('quickNav')}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/ligas" prefetch={false}>
                <Trophy className="h-4 w-4 mr-2 text-[#F4A261]" />
                {t('myLeagues')}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/help" prefetch={false}>
                <HelpCircle className="h-4 w-4 mr-2 text-[#F4A261]" />
                {t('understandGame')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Dashboard Content Component
const DashboardContent = ({ userData, selectedTeamData, onLeagueChange, userId, selectedCompetitionId, onCompetitionChange }: {
  userData: UserData,
  selectedTeamData: { league: League | null, team: LeagueTeam | MainTeam | null, isMainTeam: boolean },
  onLeagueChange: (leagueId: string) => void,
  userId?: string,
  selectedCompetitionId?: string | null,
  onCompetitionChange?: (competitionId: string | null) => void
}) => {
  const t = useTranslations('DashboardPage');

  // Estado para rodada selecionada
  const [selectedRoundData, setSelectedRoundData] = useState<any>(null);
  const [loadingRoundData, setLoadingRoundData] = useState(false);

  // Buscar dados da rodada selecionada
  useEffect(() => {
    if (!selectedCompetitionId || !userId || selectedCompetitionId === 'all' || selectedCompetitionId === 'SEASON') {
      setSelectedRoundData(null);
      return;
    }

    const fetchRoundData = async () => {
      try {
        setLoadingRoundData(true);

        // Buscar informações da competição
        const competitionsResponse = await fetch(`/api/league/competitions?leagueId=${selectedTeamData.league?.id}`);
        let competitionInfo: any = null;

        if (competitionsResponse.ok) {
          const competitionsData = await competitionsResponse.json();
          competitionInfo = competitionsData.competitions?.find((c: any) => c.id === selectedCompetitionId);
        }

        const response = await fetch(`/api/teams?competitionId=${selectedCompetitionId}`);
        if (response.ok) {
          const data = await response.json();
          const userTeam = data.teams?.find((t: any) => t.userId === userId);

          if (userTeam) {
            // Buscar snapshots dos tokens da rodada
            const snapshotsResponse = await fetch(`/api/competition/tokens?competitionId=${selectedCompetitionId}`);
            let tokenSnapshots: any[] = [];

            if (snapshotsResponse.ok) {
              const snapshotsData = await snapshotsResponse.json();
              tokenSnapshots = snapshotsData.tokens || [];
            }

            // Buscar dados completos dos tokens a partir dos símbolos
            const tokenSymbols = userTeam.players || userTeam.tokens || [];

            // Buscar no mainTeam os tokens com dados completos
            const mainTeamPlayers = selectedTeamData.team?.players || [];

            // Buscar dados de mercado atuais (com logos!) da mesma API que o Token Market usa
            const marketResponse = await fetch('/api/market');
            let marketTokens: any[] = [];
            if (marketResponse.ok) {
              const marketData = await marketResponse.json();
              marketTokens = marketData.tokens || [];
            }

            const fullTokens = tokenSymbols.map((symbol: string) => {
              const found = mainTeamPlayers.find((p: any) =>
                p.symbol?.toUpperCase() === symbol.toUpperCase()
              );

              // Buscar snapshot deste token
              const snapshot = tokenSnapshots.find((s: any) =>
                s.symbol?.toUpperCase() === symbol.toUpperCase()
              );

              // Buscar dados de mercado para variação 7d
              const marketToken = marketTokens.find((m: any) =>
                m.symbol?.toUpperCase() === symbol.toUpperCase()
              );

              // Calcular variação da rodada baseado nos snapshots
              let roundChange = 0;
              let roundPoints = 0;

              if (snapshot && snapshot.priceStart && snapshot.priceEnd) {
                // Rodada completa - usar priceStart e priceEnd
                const priceStart = parseFloat(snapshot.priceStart.toString());
                const priceEnd = parseFloat(snapshot.priceEnd.toString());
                roundChange = ((priceEnd - priceStart) / priceStart) * 100;
                roundPoints = roundChange;
              } else if (snapshot && snapshot.priceStart && marketToken?.currentPrice) {
                // Rodada ATIVA - calcular pontuação parcial com preço atual do /api/market
                const priceStart = parseFloat(snapshot.priceStart.toString());
                const currentPrice = marketToken.currentPrice;
                if (currentPrice > 0) {
                  roundChange = ((currentPrice - priceStart) / priceStart) * 100;
                  roundPoints = roundChange;
                  console.log(`[DASHBOARD] Pontuação parcial ${symbol}: ${roundPoints.toFixed(2)}% (${priceStart} → ${currentPrice})`);
                }
              } else if (snapshot && snapshot.percentChange) {
                // Fallback: usar percentChange se disponível
                roundChange = parseFloat(snapshot.percentChange.toString());
                roundPoints = roundChange;
              }

              return {
                symbol: symbol, // Garantir que símbolo existe
                name: snapshot?.name || found?.name || marketToken?.name || symbol,
                priceChange7d: marketToken?.priceChange7d || found?.priceChange7d || 0,
                priceChangeRound: roundChange, // Variação da rodada
                roundPoints: roundPoints, // Pontuação na rodada
                imageUrl: snapshot?.imageUrl || marketToken?.image || found?.imageUrl || '', // ✅ Priorizar snapshot (tokens fora do Top 100 como DASH)
                priceStart: snapshot?.priceStart,
                priceEnd: snapshot?.priceEnd
              };
            });

            setSelectedRoundData({
              ...userTeam,
              players: fullTokens,
              totalPoints: userTeam.totalScore || userTeam.liveScore || userTeam.totalPoints || 0,
              competitionName: competitionInfo?.name || 'Rodada',
              competitionStatus: competitionInfo?.status || 'UNKNOWN',
              startDate: competitionInfo?.startDate || null,
              endDate: competitionInfo?.endDate || null,
              totalParticipants: data.teams?.length || 0
            });
          } else {
            setSelectedRoundData(null);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados da rodada:', error);
      } finally {
        setLoadingRoundData(false);
      }
    };

    fetchRoundData();
  }, [selectedCompetitionId, userId, selectedTeamData.team]);

  // Usar dados da rodada selecionada ou dados do time atual
  const teamPlayers = selectedRoundData?.players || selectedTeamData.team?.players || [];

  // Se rodada selecionada, usar variação da rodada. Senão, usar 7d
  const getChange = (player: any) => {
    if (selectedRoundData && player.priceChangeRound !== undefined) {
      return player.priceChangeRound; // Variação da rodada (snapshot)
    }
    return player.priceChange7d || player.priceChange24h || 0; // Variação padrão
  };

  const bestToken = teamPlayers.length > 0 ? teamPlayers.reduce((best, current) =>
    getChange(current) > getChange(best) ? current : best
  ) : null;

  const worstToken = teamPlayers.length > 0 ? teamPlayers.reduce((worst, current) =>
    getChange(current) < getChange(worst) ? current : worst
  ) : null;

  const neutralToken = teamPlayers.length > 0 ? teamPlayers.reduce((neutral, current) =>
    Math.abs(getChange(current)) < Math.abs(getChange(neutral)) ? current : neutral
  ) : null;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Seletor de Liga e Contagem Regressiva */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <div className="w-full md:w-auto">
          <Select
            defaultValue={selectedTeamData.isMainTeam ? "main" : selectedTeamData.league?.id || ""}
            onValueChange={(value: string) => {
              if (value === "main") {
                onLeagueChange("main");
              } else {
                onLeagueChange(value);
              }
            }}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Selecione uma liga" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">{t('teamName')}</SelectItem>
              {userData.leagues.map((league) => (
                <SelectItem key={league.id} value={league.id}>
                  {league.leagueName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <RoundTimerDisplay />

      {/* Meu Desempenho - Breakdown por Rodada */}
      {!selectedTeamData.isMainTeam && selectedTeamData.league && userId && (
        <RoundPerformance
          leagueId={selectedTeamData.league.id}
          userId={userId}
          selectedCompetitionId={selectedCompetitionId}
          onCompetitionChange={onCompetitionChange || (() => {})}
        />
      )}

      {/* Resumo da Rodada Selecionada - Card Unificado */}
      {selectedRoundData && selectedCompetitionId && selectedCompetitionId !== 'all' && selectedCompetitionId !== 'SEASON' && (
        <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-blue-600" />
                {selectedRoundData.competitionName || 'Resumo da Rodada'}
              </CardTitle>
              {/* Badge de Status */}
              {selectedRoundData.competitionStatus === 'COMPLETED' && (
                <Badge variant="secondary" className="bg-gray-100">✅ Finalizada</Badge>
              )}
              {selectedRoundData.competitionStatus === 'ACTIVE' && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">🔴 Ao Vivo</Badge>
              )}
              {selectedRoundData.competitionStatus === 'PENDING' && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">⏳ Aguardando</Badge>
              )}
            </div>
            {/* Datas */}
            {selectedRoundData.startDate && selectedRoundData.endDate && (
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(selectedRoundData.startDate).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })} - {new Date(selectedRoundData.endDate).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Aviso de Rodada Ativa */}
            {selectedRoundData.competitionStatus === 'ACTIVE' && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Rodada em andamento - pontuação parcial atualizada em tempo real
                </p>
              </div>
            )}

            {/* Linha 1: Pontos e Ranking */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  {selectedRoundData.competitionStatus === 'ACTIVE' ? 'Pontos Parciais' : 'Pontos Finais'}
                </p>
                <p className={`text-2xl font-bold ${(selectedRoundData.totalPoints || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(selectedRoundData.totalPoints || 0) >= 0 ? '+' : ''}{selectedRoundData.totalPoints?.toFixed(2) || '0.00'}%
                </p>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Ranking</p>
                <p className="text-2xl font-bold text-purple-600">
                  #{selectedRoundData.rank || 'N/A'}
                </p>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Tokens Escalados</p>
                <p className="text-2xl font-bold text-blue-600">
                  {selectedRoundData.players?.length || 0}/5
                </p>
              </div>
            </div>

            {/* Linha 2: Melhor e Pior Token */}
            {bestToken && worstToken && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                {/* Melhor Token */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Melhor da Rodada
                  </p>
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
                    {bestToken.imageUrl && (
                      <img src={bestToken.imageUrl} alt={bestToken.symbol} className="h-6 w-6 rounded-full" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{bestToken.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate">{bestToken.name}</p>
                    </div>
                    <p className="text-sm font-bold text-green-600">
                      +{getChange(bestToken).toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* Pior Token */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Pior da Rodada
                  </p>
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
                    {worstToken.imageUrl && (
                      <img src={worstToken.imageUrl} alt={worstToken.symbol} className="h-6 w-6 rounded-full" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{worstToken.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate">{worstToken.name}</p>
                    </div>
                    <p className={`text-sm font-bold ${getChange(worstToken) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {getChange(worstToken) >= 0 ? '+' : ''}{getChange(worstToken).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Linha 3: Nome do Time e Participantes */}
            {(selectedRoundData.teamName || selectedRoundData.totalParticipants) && (
              <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                {selectedRoundData.teamName && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Nome do Time</p>
                    <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                      {selectedRoundData.teamName}
                    </p>
                  </div>
                )}
                {selectedRoundData.totalParticipants && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total de Participantes</p>
                    <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                      {selectedRoundData.totalParticipants}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Meus Prêmios */}
      {userId && (
        <PrizeClaims
          userId={userId}
          leagueId={!selectedTeamData.isMainTeam ? selectedTeamData.league?.id : undefined}
          refreshTrigger={selectedCompetitionId} // ✅ Forçar atualização quando muda de rodada
        />
      )}

      {/* Card de Gráfico de Desempenho */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedTeamData.isMainTeam
              ? 'Evolução de Pontos'
              : `Evolução de Pontos - ${selectedTeamData.league?.leagueName || 'N/A'}`}
          </CardTitle>
          <CardDescription>
            {selectedTeamData.isMainTeam
              ? 'Acompanhe sua performance ao longo das rodadas'
              : 'Histórico de pontuação em todas as rodadas desta liga'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!selectedTeamData.isMainTeam && userId && selectedTeamData.league ? (
            <PointsEvolutionChart
              userId={userId}
              leagueId={selectedTeamData.league.id}
            />
          ) : (
            <div className="h-64 w-full flex flex-col items-center justify-center">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-muted-foreground">Selecione uma liga para ver a evolução de pontos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card "Meu Time na Rodada" (Destaques) - Ocultar quando SEASON está selecionado */}
      {selectedCompetitionId !== 'SEASON' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t('highlightsTitle')}
              {selectedCompetitionId && selectedCompetitionId !== 'all' && selectedCompetitionId !== 'SEASON' && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {loadingRoundData ? '(Carregando...)' : '(Rodada Selecionada)'}
                </span>
              )}
            </CardTitle>
          </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bestToken && (
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                  <h3 className="font-bold dark:text-white">{t('bestPerformer')}</h3>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 relative mr-3">
                    {bestToken.imageUrl ? (
                      <Image
                        src={bestToken.imageUrl}
                        alt={bestToken.symbol || ''}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center dark:text-white">
                        {(bestToken.symbol || '?').substring(0, 1)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">{bestToken.name}</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">{bestToken.symbol}</p>
                    <p className="text-green-600 dark:text-green-400 font-bold">
                      {getChange(bestToken) >= 0 ? '+' : ''}{getChange(bestToken).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
            {worstToken && (
              <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <TrendingDown className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
                  <h3 className="font-bold dark:text-white">{t('worstPerformer')}</h3>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 relative mr-3">
                    {worstToken.imageUrl ? (
                      <Image
                        src={worstToken.imageUrl}
                        alt={worstToken.symbol || ''}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center dark:text-white">
                        {(worstToken.symbol || '?').substring(0, 1)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">{worstToken.name}</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">{worstToken.symbol}</p>
                    <p className="text-red-600 dark:text-red-400 font-bold">
                      {getChange(worstToken) >= 0 ? '+' : ''}{getChange(worstToken).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
            {neutralToken && (
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <Target className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold dark:text-white">{t('mostNeutral')}</h3>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 relative mr-3">
                    {neutralToken.imageUrl ? (
                      <Image
                        src={neutralToken.imageUrl}
                        alt={neutralToken.symbol || ''}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center dark:text-white">
                        {(neutralToken.symbol || '?').substring(0, 1)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">{neutralToken.name}</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">{neutralToken.symbol}</p>
                    <p className="text-blue-600 dark:text-blue-400 font-bold">
                      {getChange(neutralToken) >= 0 ? '+' : ''}{getChange(neutralToken).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        </Card>
      )}

      {/* Card "Composição do Time" - Ocultar quando SEASON está selecionado */}
      {selectedCompetitionId !== 'SEASON' && (
        <Card>
        <CardHeader>
          <CardTitle>
            {t('lineupTitle')}
            {selectedCompetitionId && selectedCompetitionId !== 'all' && selectedCompetitionId !== 'SEASON' && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {loadingRoundData ? '(Carregando...)' : '(Rodada Selecionada)'}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {teamPlayers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>{t('lineupSymbol')}</TableHead>
                  <TableHead className="text-right">Variação 7d</TableHead>
                  {selectedRoundData && (
                    <TableHead className="text-right">Pontuação</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamPlayers.map((player) => {
                  const change = getChange(player);
                  return (
                    <TableRow key={player.symbol || ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {player.imageUrl ? (
                            <Image
                              src={player.imageUrl}
                              alt={player.symbol || ''}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs">
                              {(player.symbol || '?').substring(0, 1)}
                            </div>
                          )}
                          <span className="font-medium">{player.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{player.symbol || ''}</TableCell>
                      <TableCell className={`text-right font-medium ${
                        (player.priceChange7d || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(player.priceChange7d || 0) >= 0 ? '+' : ''}{(player.priceChange7d || 0).toFixed(1)}%
                      </TableCell>
                      {selectedRoundData && (
                        <TableCell className={`text-right font-bold ${
                          (player.roundPoints || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(player.roundPoints || 0) >= 0 ? '+' : ''}{(player.roundPoints || 0).toFixed(2)}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('noTokensInLineup')}</p>
            </div>
          )}
        </CardContent>
        </Card>
      )}

      {/* Card Social / Convide Amigos */}
      <Card className="bg-[#2A9D8F]/5">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-4">
          <div className="rounded-full bg-[#2A9D8F]/20 p-4">
            <Gift className="h-8 w-8 text-[#2A9D8F]" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">{t('betterWithFriends')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('inviteFriendsDesc')} <span className="text-orange-600 font-semibold">({t('inviteComingSoon')})</span>
            </p>
            <Button className="bg-[#2A9D8F] hover:bg-[#2A9D8F]/90" disabled>
              {t('inviteLearnMore')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente para exibir o timer da rodada
function RoundTimerDisplay() {
  const t = useTranslations('DashboardPage');
  const tTeams = useTranslations('teams');
  const tCommon = useTranslations('common');
  const { formatTime, loading, isExpired } = useRoundTimer({ leagueId: 'main-league' });

  if (loading) {
    return (
      <div className="bg-[#2A9D8F]/10 p-3 rounded-md flex items-center mb-2">
        <Clock className="h-5 w-5 mr-2 text-[#2A9D8F] animate-pulse" />
        <span className="font-medium">{tCommon('loading')}</span>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="bg-red-500/10 p-3 rounded-md flex items-center mb-2">
        <Clock className="h-5 w-5 mr-2 text-red-600" />
        <span className="font-medium text-red-700">🔴 {tTeams('roundInProgressTime')}</span>
      </div>
    );
  }

  return (
    <div className="bg-green-500/10 p-3 rounded-md flex items-center mb-2">
      <Clock className="h-5 w-5 mr-2 text-green-600" />
      <span className="font-medium text-green-700">
        🟢 {tTeams('nextRoundStartsIn')} <span className="font-bold">{formatTime()}</span>
      </span>
    </div>
  );
}

export default function Dashboard() {
  const t = useTranslations('DashboardPage');
  const { user, isLoading } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("main");
  const [savedMascot, setSavedMascot] = useState<SavedMascot | null>(null);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);
  const [leagueStats, setLeagueStats] = useState<{
    rank: number | null;
    totalParticipants: number;
    partialScore: number;
    lastRoundScore: number;
  } | null>(null);

  // Buscar dados reais da liga principal
  const { teamData: mainTeamData, loading: mainTeamLoading, error: mainTeamError } = useTeamData('main-league');

  // Buscar estatísticas da liga quando uma liga for selecionada
  useEffect(() => {
    const fetchLeagueStats = async () => {
      if (!user || selectedTeamId === 'main') {
        setLeagueStats(null);
        return;
      }

      try {
        const response = await fetch(`/api/user/league-stats?leagueId=${selectedTeamId}`);
        if (response.ok) {
          const data = await response.json();
          setLeagueStats({
            rank: data.rank,
            totalParticipants: data.totalParticipants || 0,
            partialScore: data.totalScore || 0,
            lastRoundScore: data.lastRoundScore || 0
          });
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas da liga:', error);
      }
    };

    fetchLeagueStats();
  }, [user, selectedTeamId]);

  // Criar dados do usuário baseados no contexto de autenticação e dados reais
  const userData: UserData = useMemo(() => {
    if (user) {
      // Converter dados reais para o formato esperado
      const mainTeam: MainTeam | undefined = mainTeamData?.hasTeam ? {
        id: mainTeamData.id,
        userId: user.id,
        formation: "433", // Formação padrão por enquanto
        createdAt: new Date(),
        updatedAt: new Date(),
        players: mainTeamData.players.map((player, index) => ({
          id: (player.symbol || '' || '').toLowerCase(),
          position: index + 1,
          name: player.name,
          symbol: player.symbol || '', // Manter para compatibilidade
          image: player.image || '/icons/coinx.svg',
          currentPrice: player.currentPrice || 0, // Manter para compatibilidade
          
          marketCap: player.marketCap || 0,
          marketCapRank: player.marketCapRank || null,
          points: player.points || 0,
          rarity: (player.rarity || "common") as "common" | "legendary" | "epic" | "rare",
          priceChange24h: player.priceChange24h || 0, // Manter para compatibilidade
          priceChange7d: player.priceChange7d || 0 // Manter para compatibilidade
        }))
      } : undefined;

      // ✅ CORREÇÃO: Se há dados da liga principal, incluir em leagueTeams
      const leagueTeams: LeagueTeam[] = [];
      if (mainTeamData?.hasTeam && mainTeamData.league) {
        leagueTeams.push({
          id: mainTeamData.id,
          userId: user.id, // ✅ Adicionar userId
          leagueId: mainTeamData.league.id,
          isMainTeam: true, // ✅ Adicionar isMainTeam
          formation: "433",
          createdAt: new Date(),
          updatedAt: new Date(),
          players: mainTeamData.players.map((player, index) => ({
            id: (player.symbol || '').toLowerCase(),
            position: index + 1,
            name: player.name,
            symbol: player.symbol || '',
            image: player.image || '/icons/coinx.svg',
            currentPrice: player.currentPrice || 0,
            marketCap: player.marketCap || 0,
            marketCapRank: player.marketCapRank || null,
            points: player.points || 0,
            rarity: (player.rarity || "common") as "common" | "legendary" | "epic" | "rare",
            priceChange24h: player.priceChange24h || 0,
            priceChange7d: player.priceChange7d || 0
          }))
        });
      }

      return {
        id: user.id,
        teamName: mainTeamData?.teamName || user.name || "Nome do Time",
        userName: user.username || "Nome de Usuário",
        mascot: mockUserData.mascot, // Manter mascote mock por enquanto
        mainTeam: mainTeam,
        leagueTeams: leagueTeams,
        leagues: mainTeamData?.league ? [{
          id: mainTeamData.league.id,
          leagueName: mainTeamData.league.name,
          rank: leagueStats?.rank || 0,
          totalParticipants: leagueStats?.totalParticipants || 0,
          partialScore: leagueStats?.partialScore || 0,
          lastRoundScore: leagueStats?.lastRoundScore || 0,
          status: "active"
        }] : []
      };
    }
    return mockUserData; // Fallback para dados mock se não houver usuário
  }, [user, mainTeamData, leagueStats]);

  // Carregar mascote - PRIORIDADE: user.avatar do banco > localStorage
  useEffect(() => {
    // Verificar se estamos no lado do cliente antes de acessar localStorage
    if (typeof window !== 'undefined') {
      // 1️⃣ PRIMEIRO: Verificar se existe avatar no banco de dados
      if (user?.avatar) {
        console.log('✅ [DASHBOARD] Avatar encontrado no banco de dados');

        // Criar objeto de mascote baseado no avatar do banco
        const mascotFromDatabase: SavedMascot = {
          id: `db_${user.id}`,
          imageUrl: user.avatar,
          character: 'Mascote Personalizado',
          uniformStyle: 'Personalizado',
          createdAt: new Date().toISOString()
        };

        setSavedMascot(mascotFromDatabase);
        console.log('✅ [DASHBOARD] Mascote do banco carregado');
      }
      // 2️⃣ FALLBACK: Se não tem no banco, usar localStorage
      else if (user) {
        console.log('⚠️ [DASHBOARD] Avatar não encontrado no banco, tentando localStorage');
        try {
          const key = `savedMascot_${user.id}`;
          const savedMascotData = localStorage.getItem(key);

          if (savedMascotData) {
            const mascot = JSON.parse(savedMascotData);
            setSavedMascot(mascot);
            console.log('✅ [DASHBOARD] Mascote do localStorage carregado');
          } else {
            // Fallback: tentar carregar com chave do mockUserData para compatibilidade
            const fallbackKey = `savedMascot_${mockUserData.id}`;
            const fallbackData = localStorage.getItem(fallbackKey);
            if (fallbackData) {
              const mascot = JSON.parse(fallbackData);
              setSavedMascot(mascot);
              console.log('✅ [DASHBOARD] Mascote do localStorage (fallback) carregado');
            } else {
              console.log('⚠️ [DASHBOARD] Nenhum mascote encontrado');
            }
          }
        } catch (error) {
          console.error('❌ [DASHBOARD] Erro ao carregar mascote salvo:', error);
        }
      } else {
        // Se não há usuário autenticado, tentar carregar com dados mock
        try {
          const key = `savedMascot_${mockUserData.id}`;
          const savedMascotData = localStorage.getItem(key);
          if (savedMascotData) {
            const mascot = JSON.parse(savedMascotData);
            setSavedMascot(mascot);
          } else {
            // Criar um mascote de exemplo para demonstração
            const exampleMascot = {
              id: 'example-mascot',
              imageUrl: '/mascots/Gemini_Generated_Image_veg2o5veg2o5veg2.png',
              character: 'Doge Guerreiro',
              uniformStyle: 'classic-cfl',
              createdAt: new Date().toISOString()
            };
            localStorage.setItem(key, JSON.stringify(exampleMascot));
            setSavedMascot(exampleMascot);
          }
        } catch (error) {
          console.error('❌ [DASHBOARD] Erro ao carregar mascote mock:', error);
        }
      }
    }
  }, [user]);

  const selectedTeamData = useMemo(() => {
    if (selectedTeamId === "main") {
      return {
        league: null,
        team: userData.mainTeam || null,
        isMainTeam: true
      };
    }

    const league = userData.leagues.find(l => l.id === selectedTeamId);
    const team = userData.leagueTeams.find(t => t.leagueId === selectedTeamId);

    return {
      league: league || null,
      team: team || null,
      isMainTeam: false
    };
  }, [selectedTeamId, userData]);

  // Mostrar carregamento se estiver buscando dados da liga principal
  if (mainTeamLoading) {
    return (
      <main className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('loadingDashboard')}</p>
          </div>
        </div>
      </main>
    );
  }

  // Mostrar erro se houver problema ao carregar dados
  if (mainTeamError) {
    return (
      <main className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{t('loadingError')} {mainTeamError}</p>
            <Button onClick={() => window.location.reload()}>
              {t('tryAgain')}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <DashboardSidebar
          userData={userData}
          selectedTeamData={selectedTeamData}
          savedMascot={savedMascot}
          isLoading={isLoading}
          selectedCompetitionId={selectedCompetitionId}
          userId={user?.id}
        />
        <DashboardContent
          userData={userData}
          selectedTeamData={selectedTeamData}
          onLeagueChange={setSelectedTeamId}
          userId={user?.id}
          selectedCompetitionId={selectedCompetitionId}
          onCompetitionChange={setSelectedCompetitionId}
        />
      </div>
    </main>
  );
}
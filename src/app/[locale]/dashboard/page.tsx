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
      { id: "sol", position: 1, name: "Solana", symbol: "SOL", token: "SOL", image: "", currentPrice: 100, price: 100, points: 85, rarity: "legendary", priceChange24h: 12.5, change_24h: 12.5, priceChange7d: 0, change_7d: 0 },
      { id: "btc", position: 2, name: "Bitcoin", symbol: "BTC", token: "BTC", image: "", currentPrice: 45000, price: 45000, points: 92, rarity: "legendary", priceChange24h: 5.2, change_24h: 5.2, priceChange7d: 0, change_7d: 0 },
      { id: "eth", position: 3, name: "Ethereum", symbol: "ETH", token: "ETH", image: "", currentPrice: 2500, price: 2500, points: 88, rarity: "epic", priceChange24h: 3.8, change_24h: 3.8, priceChange7d: 0, change_7d: 0 },
      { id: "ada", position: 4, name: "Cardano", symbol: "ADA", token: "ADA", image: "", currentPrice: 0.5, price: 0.5, points: 75, rarity: "rare", priceChange24h: 1.5, change_24h: 1.5, priceChange7d: 0, change_7d: 0 },
      { id: "dot", position: 5, name: "Polkadot", symbol: "DOT", token: "DOT", image: "", currentPrice: 7, price: 7, points: 78, rarity: "rare", priceChange24h: 2.7, change_24h: 2.7, priceChange7d: 0, change_7d: 0 },
      { id: "link", position: 6, name: "Chainlink", symbol: "LINK", token: "LINK", image: "", currentPrice: 15, price: 15, points: 82, rarity: "epic", priceChange24h: 4.3, change_24h: 4.3, priceChange7d: 0, change_7d: 0 },
      { id: "avax", position: 7, name: "Avalanche", symbol: "AVAX", token: "AVAX", image: "", currentPrice: 35, price: 35, points: 80, rarity: "rare", priceChange24h: 6.1, change_24h: 6.1, priceChange7d: 0, change_7d: 0 },
      { id: "matic", position: 8, name: "Polygon", symbol: "MATIC", token: "MATIC", image: "", currentPrice: 1, price: 1, points: 76, rarity: "common", priceChange24h: 3.2, change_24h: 3.2, priceChange7d: 0, change_7d: 0 },
      { id: "doge", position: 9, name: "Dogecoin", symbol: "DOGE", token: "DOGE", image: "", currentPrice: 0.08, price: 0.08, points: 65, rarity: "common", priceChange24h: -4.2, change_24h: -4.2, priceChange7d: 0, change_7d: 0 },
      { id: "uni", position: 10, name: "Uniswap", symbol: "UNI", token: "UNI", image: "", currentPrice: 6, price: 6, points: 72, rarity: "rare", priceChange24h: 0.8, change_24h: 0.8, priceChange7d: 0, change_7d: 0 }
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
        { id: "sol", position: 1, name: "Solana", symbol: "SOL", token: "SOL", image: "", currentPrice: 100, price: 100, points: 85, rarity: "legendary", priceChange24h: 12.5, change_24h: 12.5, priceChange7d: 0, change_7d: 0 },
        { id: "btc", position: 2, name: "Bitcoin", symbol: "BTC", token: "BTC", image: "", currentPrice: 45000, price: 45000, points: 92, rarity: "legendary", priceChange24h: 5.2, change_24h: 5.2, priceChange7d: 0, change_7d: 0 },
        { id: "eth", position: 3, name: "Ethereum", symbol: "ETH", token: "ETH", image: "", currentPrice: 2500, price: 2500, points: 88, rarity: "epic", priceChange24h: 3.8, change_24h: 3.8, priceChange7d: 0, change_7d: 0 },
        { id: "ada", position: 4, name: "Cardano", symbol: "ADA", token: "ADA", image: "", currentPrice: 0.5, price: 0.5, points: 75, rarity: "rare", priceChange24h: 1.5, change_24h: 1.5, priceChange7d: 0, change_7d: 0 },
        { id: "dot", position: 5, name: "Polkadot", symbol: "DOT", token: "DOT", image: "", currentPrice: 7, price: 7, points: 78, rarity: "rare", priceChange24h: 2.7, change_24h: 2.7, priceChange7d: 0, change_7d: 0 },
        { id: "link", position: 6, name: "Chainlink", symbol: "LINK", token: "LINK", image: "", currentPrice: 15, price: 15, points: 82, rarity: "epic", priceChange24h: 4.3, change_24h: 4.3, priceChange7d: 0, change_7d: 0 },
        { id: "avax", position: 7, name: "Avalanche", symbol: "AVAX", token: "AVAX", image: "", currentPrice: 35, price: 35, points: 80, rarity: "rare", priceChange24h: 6.1, change_24h: 6.1, priceChange7d: 0, change_7d: 0 },
        { id: "matic", position: 8, name: "Polygon", symbol: "MATIC", token: "MATIC", image: "", currentPrice: 1, price: 1, points: 76, rarity: "common", priceChange24h: 3.2, change_24h: 3.2, priceChange7d: 0, change_7d: 0 },
        { id: "doge", position: 9, name: "Dogecoin", symbol: "DOGE", token: "DOGE", image: "", currentPrice: 0.08, price: 0.08, points: 65, rarity: "common", priceChange24h: -4.2, change_24h: -4.2, priceChange7d: 0, change_7d: 0 },
        { id: "uni", position: 10, name: "Uniswap", symbol: "UNI", token: "UNI", image: "", currentPrice: 6, price: 6, points: 72, rarity: "rare", priceChange24h: 0.8, change_24h: 0.8, priceChange7d: 0, change_7d: 0 }
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
        { id: "btc", position: 1, name: "Bitcoin", symbol: "BTC", token: "BTC", image: "", currentPrice: 45000, price: 45000, points: 92, rarity: "legendary", priceChange24h: 5.2, change_24h: 5.2, priceChange7d: 0, change_7d: 0 },
        { id: "eth", position: 2, name: "Ethereum", symbol: "ETH", token: "ETH", image: "", currentPrice: 2500, price: 2500, points: 88, rarity: "epic", priceChange24h: 3.8, change_24h: 3.8, priceChange7d: 0, change_7d: 0 },
        { id: "bnb", position: 3, name: "Binance Coin", symbol: "BNB", token: "BNB", image: "", currentPrice: 300, price: 300, points: 85, rarity: "epic", priceChange24h: 7.1, change_24h: 7.1, priceChange7d: 0, change_7d: 0 },
        { id: "xrp", position: 4, name: "Ripple", symbol: "XRP", token: "XRP", image: "", currentPrice: 0.6, price: 0.6, points: 70, rarity: "common", priceChange24h: 2.3, change_24h: 2.3, priceChange7d: 0, change_7d: 0 },
        { id: "ada", position: 5, name: "Cardano", symbol: "ADA", token: "ADA", image: "", currentPrice: 0.5, price: 0.5, points: 75, rarity: "rare", priceChange24h: 1.5, change_24h: 1.5, priceChange7d: 0, change_7d: 0 },
        { id: "sol", position: 6, name: "Solana", symbol: "SOL", token: "SOL", image: "", currentPrice: 100, price: 100, points: 85, rarity: "legendary", priceChange24h: 12.5, change_24h: 12.5, priceChange7d: 0, change_7d: 0 },
        { id: "dot", position: 7, name: "Polkadot", symbol: "DOT", token: "DOT", image: "", currentPrice: 7, price: 7, points: 78, rarity: "rare", priceChange24h: 2.7, change_24h: 2.7, priceChange7d: 0, change_7d: 0 },
        { id: "doge", position: 8, name: "Dogecoin", symbol: "DOGE", token: "DOGE", image: "", currentPrice: 0.08, price: 0.08, points: 65, rarity: "common", priceChange24h: -4.2, change_24h: -4.2, priceChange7d: 0, change_7d: 0 },
        { id: "avax", position: 9, name: "Avalanche", symbol: "AVAX", token: "AVAX", image: "", currentPrice: 35, price: 35, points: 80, rarity: "rare", priceChange24h: 6.1, change_24h: 6.1, priceChange7d: 0, change_7d: 0 },
        { id: "shib", position: 10, name: "Shiba Inu", symbol: "SHIB", token: "SHIB", image: "", currentPrice: 0.00001, price: 0.00001, points: 60, rarity: "common", priceChange24h: -2.5, change_24h: -2.5, priceChange7d: 0, change_7d: 0 }
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
const DashboardSidebar = ({ userData, selectedTeamData, savedMascot, isLoading }: {
  userData: UserData,
  selectedTeamData: { league: League | null, team: LeagueTeam | MainTeam | null, isMainTeam: boolean },
  savedMascot: SavedMascot | null,
  isLoading: boolean
}) => {
  const t = useTranslations('DashboardPage');
  const wallet = useGuardedActionHook();
  const { publicKey, connected, canExecuteAction } = wallet;
  const { setTransactionActive } = useTransactionState();
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
                  <DialogContent>
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
                    <DialogContent>
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
              <p className="text-sm font-medium text-muted-foreground">{t('leagueRank')}</p>
              <p className="text-2xl font-bold">
                {selectedTeamData.isMainTeam ? t('teamName') :
                 `${selectedTeamData.league?.rank || 0} / ${selectedTeamData.league?.totalParticipants || 0}`}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('partialValue')}</p>
              <p className="text-2xl font-bold text-green-600">
                {selectedTeamData.isMainTeam ? "N/A" : `+${selectedTeamData.league?.partialScore?.toFixed(2) || 0}%`}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('lastRound')}</p>
              <p className="text-xl font-bold">
                {selectedTeamData.isMainTeam ? "N/A" : `+${selectedTeamData.league?.lastRoundScore?.toFixed(2) || 0}`}
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
const DashboardContent = ({ userData, selectedTeamData, onLeagueChange }: {
  userData: UserData,
  selectedTeamData: { league: League | null, team: LeagueTeam | MainTeam | null, isMainTeam: boolean },
  onLeagueChange: (leagueId: string) => void
}) => {
  const t = useTranslations('DashboardPage');

  // Encontrar o melhor, pior e mais neutro token do time (baseado em 7d se disponível, senão 24h)
  const teamPlayers = selectedTeamData.team?.players || [];

  const getChange = (player: any) => player.priceChange7d || player.change_7d || player.priceChange24h || player.change_24h || 0;

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

      {/* Card de Gráfico de Desempenho */}
      <Card>
        <CardHeader>
          <CardTitle>{selectedTeamData.isMainTeam
            ? t('portfolioEvolutionTitle')
            : `${t('portfolioEvolutionTitle')} - ${selectedTeamData.league?.leagueName || 'N/A'}`}</CardTitle>
          <CardDescription>{t('portfolioEvolutionDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 w-full bg-gradient-to-br from-orange-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-orange-200 dark:border-gray-700">
            <div className="text-center space-y-3">
              <div className="text-5xl">📊</div>
              <h3 className="text-xl font-bold text-orange-700 dark:text-orange-400">{t('comingSoonTitle')}</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400 max-w-md px-4">{t('comingSoonText')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card "Meu Time na Rodada" (Destaques) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('highlightsTitle')}</CardTitle>
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
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center dark:text-white">
                      {(bestToken.symbol || bestToken.token || '?').substring(0, 1)}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">{bestToken.name}</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">{bestToken.symbol || bestToken.token}</p>
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
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center dark:text-white">
                      {(worstToken.symbol || worstToken.token || '?').substring(0, 1)}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">{worstToken.name}</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">{worstToken.symbol || worstToken.token}</p>
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
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center dark:text-white">
                      {(neutralToken.symbol || neutralToken.token || '?').substring(0, 1)}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">{neutralToken.name}</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">{neutralToken.symbol || neutralToken.token}</p>
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

      {/* Card "Composição do Time" */}
      <Card>
        <CardHeader>
          <CardTitle>{t('lineupTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {teamPlayers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('lineupName')}</TableHead>
                  <TableHead>{t('lineupSymbol')}</TableHead>
                  <TableHead className="text-right">{t('lineupChange7d')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamPlayers.map((player) => {
                  const change = getChange(player);
                  return (
                    <TableRow key={player.symbol || player.token}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell>{player.symbol || player.token}</TableCell>
                      <TableCell className={`text-right font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                      </TableCell>
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

  // Buscar dados reais da liga principal
  const { teamData: mainTeamData, loading: mainTeamLoading, error: mainTeamError } = useTeamData();

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
          id: (player.symbol || player.token || '').toLowerCase(),
          position: index + 1,
          name: player.name,
          symbol: player.symbol || player.token,
          token: player.symbol || player.token, // Manter para compatibilidade
          image: player.image || '/icons/coinx.svg',
          currentPrice: player.currentPrice || player.price || 0,
          price: player.currentPrice || player.price || 0, // Manter para compatibilidade
          points: player.points || 0,
          rarity: (player.rarity || "common") as "common" | "legendary" | "epic" | "rare",
          priceChange24h: player.priceChange24h || player.change_24h || 0,
          change_24h: player.priceChange24h || player.change_24h || 0, // Manter para compatibilidade
          priceChange7d: player.priceChange7d || player.change_7d || 0,
          change_7d: player.priceChange7d || player.change_7d || 0 // Manter para compatibilidade
        }))
      } : undefined;

      return {
        id: user.id,
        teamName: mainTeamData?.teamName || user.name || "Nome do Time",
        userName: user.username || "Nome de Usuário",
        mascot: mockUserData.mascot, // Manter mascote mock por enquanto
        mainTeam: mainTeam,
        leagueTeams: [], // Por enquanto vazio, pode ser expandido depois
        leagues: mainTeamData?.league ? [{
          id: mainTeamData.league.id,
          leagueName: mainTeamData.league.name,
          rank: 0, // Será implementado depois
          totalParticipants: 0, // Será implementado depois
          partialScore: 0, // Será implementado depois
          lastRoundScore: 0, // Será implementado depois
          status: "active"
        }] : []
      };
    }
    return mockUserData; // Fallback para dados mock se não houver usuário
  }, [user, mainTeamData]);

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
        />
        <DashboardContent 
          userData={userData} 
          selectedTeamData={selectedTeamData} 
          onLeagueChange={setSelectedTeamId}
        />
      </div>
    </main>
  );
}
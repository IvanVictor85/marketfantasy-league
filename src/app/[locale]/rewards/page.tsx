'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Trophy,
  Users,
  Copy,
  Check,
  Crown,
  Coins,
  Share2,
  UserPlus,
  CheckCircle,
  Clock,
  Zap,
  Sparkles,
  Medal,
  Target,
  TrendingUp,
  Gift,
  Star,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

// Tipos
interface ReferralStats {
  referralCode: string | null;
  totalPoints: number;
  tier: string;
  totalReferrals: number;
  activeReferrals: number;
  rank: number;
  totalUsers: number;
  nextTier: { nextTier: string | null; pointsNeeded: number };
  recentActivity: Array<{
    id: string;
    type: string;
    points: number;
    description: string | null;
    createdAt: string;
  }>;
  referrals: Array<{
    id: string;
    name: string;
    wallet: string | null;
    joinedAt: string;
    isActive: boolean;
  }>;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  username: string | null;
  wallet: string | null;
  totalPoints: number;
  tier: string;
  totalReferrals: number;
}

// Configurações de tier com estilo premium
const TIER_CONFIG: Record<string, {
  color: string;
  darkColor: string;
  bgLight: string;
  bgDark: string;
  icon: React.ReactNode;
  minPoints: number;
  glow: string;
}> = {
  BRONZE: {
    color: 'text-orange-600',
    darkColor: 'dark:text-orange-400',
    bgLight: 'bg-gradient-to-br from-orange-100 to-orange-200',
    bgDark: 'dark:from-orange-900/30 dark:to-orange-800/30',
    icon: <Medal className="h-5 w-5" />,
    minPoints: 0,
    glow: 'shadow-orange-500/20'
  },
  SILVER: {
    color: 'text-slate-600',
    darkColor: 'dark:text-slate-300',
    bgLight: 'bg-gradient-to-br from-slate-200 to-slate-300',
    bgDark: 'dark:from-slate-700/30 dark:to-slate-600/30',
    icon: <Medal className="h-5 w-5" />,
    minPoints: 500,
    glow: 'shadow-slate-400/20'
  },
  GOLD: {
    color: 'text-yellow-600',
    darkColor: 'dark:text-yellow-400',
    bgLight: 'bg-gradient-to-br from-yellow-200 to-amber-300',
    bgDark: 'dark:from-yellow-900/30 dark:to-amber-800/30',
    icon: <Crown className="h-5 w-5" />,
    minPoints: 1500,
    glow: 'shadow-yellow-500/30'
  },
  PLATINUM: {
    color: 'text-cyan-600',
    darkColor: 'dark:text-cyan-400',
    bgLight: 'bg-gradient-to-br from-cyan-200 to-teal-300',
    bgDark: 'dark:from-cyan-900/30 dark:to-teal-800/30',
    icon: <Crown className="h-5 w-5" />,
    minPoints: 5000,
    glow: 'shadow-cyan-500/30'
  },
  DIAMOND: {
    color: 'text-purple-600',
    darkColor: 'dark:text-purple-400',
    bgLight: 'bg-gradient-to-br from-purple-200 via-pink-200 to-purple-300',
    bgDark: 'dark:from-purple-900/30 dark:via-pink-900/30 dark:to-purple-800/30',
    icon: <Sparkles className="h-5 w-5" />,
    minPoints: 10000,
    glow: 'shadow-purple-500/40'
  },
};

// Quests/Missões para gamificação
const QUESTS = [
  { id: 1, event: 'Convidar primeiro amigo', points: 50, icon: <UserPlus className="h-5 w-5" />, color: 'from-[#14F195] to-[#00D4AA]' },
  { id: 2, event: 'Participar de rodada', points: 10, icon: <Target className="h-5 w-5" />, color: 'from-[#9945FF] to-[#7B3FE4]' },
  { id: 3, event: 'Amigo participa de rodada', points: 10, icon: <Users className="h-5 w-5" />, color: 'from-[#00D4AA] to-[#14F195]' },
  { id: 4, event: 'Compartilhar no X', points: 5, icon: <Share2 className="h-5 w-5" />, color: 'from-[#1DA1F2] to-[#0D8DDB]' },
  { id: 5, event: 'Amigo vence rodada', points: 25, icon: <Trophy className="h-5 w-5" />, color: 'from-[#FFD700] to-[#FFA500]' },
  { id: 6, event: '5 indicados ativos', points: 20, icon: <Flame className="h-5 w-5" />, color: 'from-[#FF6B6B] to-[#EE5A5A]' },
];

export default function RewardsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, leaderboardRes] = await Promise.all([
        fetch('/api/referral/stats'),
        fetch('/api/referral/leaderboard?limit=10'),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data.leaderboard || []);
        setUserPosition(data.userPosition || null);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados de referral');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      setCopiedCode(true);
      toast.success('Código copiado!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (stats?.referralCode) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const link = `${baseUrl}/ref/${stats.referralCode}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleShareTwitter = async () => {
    setSharing(true);
    try {
      const res = await fetch('/api/referral/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'twitter', type: 'invite' }),
      });

      const data = await res.json();

      if (data.shareUrl) {
        window.open(data.shareUrl, '_blank', 'width=600,height=400');
      }

      if (data.alreadyShared) {
        toast.info(data.message);
      } else if (data.pointsEarned) {
        toast.success(data.message);
        fetchData();
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    } finally {
      setSharing(false);
    }
  };

  const getTierProgress = () => {
    if (!stats) return 0;
    const currentTier = TIER_CONFIG[stats.tier];
    const nextTierName = stats.nextTier.nextTier;
    if (!nextTierName) return 100;

    const nextTier = TIER_CONFIG[nextTierName];
    const range = nextTier.minPoints - currentTier.minPoints;
    const progress = stats.totalPoints - currentTier.minPoints;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  };

  const formatEventType = (type: string) => {
    const types: Record<string, string> = {
      SIGNUP: 'Novo cadastro',
      ROUND_PLAYED: 'Rodada jogada',
      SOCIAL_SHARE: 'Compartilhamento',
      FIRST_WIN: 'Primeira vitória',
      STREAK_BONUS: 'Bônus de sequência',
    };
    return types[type] || type;
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full border-0 shadow-xl dark:shadow-none dark:bg-[#161b22] overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#FFD700]" />
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#9945FF] via-[#14F195] to-[#FFD700] flex items-center justify-center">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Entre para participar</h2>
            <p className="text-muted-foreground mb-6">
              Faça login para acessar o programa de indicações e ganhar pontos para <span className="text-[#14F195] font-semibold">futuras recompensas</span>.
            </p>
            <Button asChild className="bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:opacity-90 text-white font-semibold px-8">
              <a href="/login">Entrar</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tierConfig = stats ? TIER_CONFIG[stats.tier] : TIER_CONFIG.BRONZE;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Hero Section - Card Principal Premium */}
      <Card className="overflow-hidden border-0 shadow-xl dark:shadow-none relative">
        {/* Fundo com gradiente suave */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#9945FF]/5 via-[#14F195]/5 to-[#FFD700]/5 dark:from-[#9945FF]/10 dark:via-[#14F195]/10 dark:to-[#FFD700]/10" />

        {/* Borda gradiente */}
        <div className="absolute inset-0 rounded-xl p-[1px] bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#FFD700] opacity-30 dark:opacity-50" style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />

        <CardContent className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Left: Info e Link */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center gap-3 justify-center lg:justify-start mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#9945FF] to-[#14F195]">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Programa de Indicação</h1>
                  <p className="text-sm text-muted-foreground">Acumule pontos e desbloqueie recompensas</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-6 max-w-lg">
                Convide amigos e acumule pontos. Quanto mais indicações, maiores suas <span className="text-[#14F195] font-semibold">futuras recompensas no MFL</span>!
              </p>

              {/* Referral Link Input */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Input
                      value={stats?.referralCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/ref/${stats.referralCode}` : 'Carregando...'}
                      readOnly
                      className="pr-12 font-mono text-sm bg-white dark:bg-[#0d1117] border-2 border-gray-200 dark:border-gray-700 focus:border-[#14F195] dark:focus:border-[#14F195] h-12"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-[#14F195]/20"
                      onClick={handleCopyLink}
                    >
                      {copiedLink ? <Check className="h-5 w-5 text-[#14F195]" /> : <Copy className="h-5 w-5" />}
                    </Button>
                  </div>

                  {/* Botão Compartilhar - Gradiente Roxo para Teal (igual ao modal) */}
                  <Button
                    onClick={handleShareTwitter}
                    disabled={sharing}
                    className="h-12 px-6 bg-gradient-to-r from-[#9945FF] via-[#7B3FE4] to-[#14F195] hover:opacity-90 text-white font-semibold shadow-lg shadow-[#9945FF]/30 dark:shadow-[#14F195]/20"
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    {sharing ? 'Abrindo...' : 'Compartilhar no X (+5 pts)'}
                  </Button>
                </div>

                {/* Código Badge */}
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <span className="text-sm text-muted-foreground">Seu código:</span>
                  <Badge
                    variant="outline"
                    className="font-mono text-base px-4 py-1 cursor-pointer border-2 border-[#14F195]/50 hover:border-[#14F195] hover:bg-[#14F195]/10 transition-all"
                    onClick={handleCopyCode}
                  >
                    {stats?.referralCode || '...'}
                    {copiedCode ? <Check className="h-4 w-4 ml-2 text-[#14F195]" /> : <Copy className="h-4 w-4 ml-2 opacity-50" />}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right: Display de Pontos e Tier Premium */}
            <div className={`
              relative p-8 rounded-2xl min-w-[220px] text-center
              ${tierConfig.bgLight} ${tierConfig.bgDark}
              shadow-xl ${tierConfig.glow}
              dark:backdrop-blur-sm dark:border dark:border-white/10
            `}>
              {/* Glow effect no dark mode */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent dark:from-white/5 dark:to-transparent" />

              <div className="relative">
                <div className={`${tierConfig.color} ${tierConfig.darkColor} flex items-center justify-center gap-2 mb-3`}>
                  {tierConfig.icon}
                  <span className="font-bold text-lg">{stats?.tier || 'BRONZE'}</span>
                </div>

                <div className="text-5xl font-black text-gray-900 dark:text-[#00FF94] dark:drop-shadow-[0_0_15px_rgba(0,255,148,0.5)] mb-1 tracking-tight">
                  {stats?.totalPoints?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">pontos</div>

                {stats?.nextTier.nextTier && (
                  <div className="mt-4">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#9945FF] to-[#00FF94] transition-all duration-500"
                        style={{ width: `${getTierProgress()}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      <span className="text-[#00FF94] font-semibold dark:drop-shadow-[0_0_5px_rgba(0,255,148,0.5)]">{stats.nextTier.pointsNeeded}</span> pts para {stats.nextTier.nextTier}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards - Estilo Gamificado com Glow Neon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total de Pontos */}
        <Card className="border-0 shadow-lg dark:shadow-none dark:bg-[#161b22] overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="h-1 bg-gradient-to-r from-[#00FF94] to-[#14F195]" />
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Total de Pontos</p>
                <p className="text-4xl font-black text-gray-900 dark:text-[#00FF94] dark:drop-shadow-[0_0_10px_rgba(0,255,148,0.5)]">
                  {stats?.totalPoints?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ranking: <span className="font-semibold text-foreground">#{stats?.rank || '-'}</span> de {stats?.totalUsers || 0}
                </p>
              </div>
              {/* Ícone com Glow Neon */}
              <div className="relative">
                <div className="absolute inset-0 bg-[#00FF94] rounded-xl blur-lg opacity-0 dark:opacity-40 transition-opacity group-hover:opacity-60" />
                <div className="relative p-3 rounded-xl bg-[#14F195]/10 dark:bg-[#00FF94]/20 shadow-sm dark:shadow-[0_0_15px_rgba(0,255,148,0.3)]">
                  <Coins className="h-6 w-6 text-[#14F195] dark:text-[#00FF94]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amigos Convidados */}
        <Card className="border-0 shadow-lg dark:shadow-none dark:bg-[#161b22] overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="h-1 bg-gradient-to-r from-[#9945FF] to-[#7B3FE4]" />
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Amigos Convidados</p>
                <p className="text-4xl font-black text-gray-900 dark:text-[#00FF94] dark:drop-shadow-[0_0_10px_rgba(0,255,148,0.5)]">
                  {stats?.totalReferrals || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-semibold text-[#00FF94]">{stats?.activeReferrals || 0}</span> ativos (jogaram)
                </p>
              </div>
              {/* Ícone com Glow Neon */}
              <div className="relative">
                <div className="absolute inset-0 bg-[#9945FF] rounded-xl blur-lg opacity-0 dark:opacity-40 transition-opacity group-hover:opacity-60" />
                <div className="relative p-3 rounded-xl bg-[#9945FF]/10 dark:bg-[#9945FF]/20 shadow-sm dark:shadow-[0_0_15px_rgba(153,69,255,0.3)]">
                  <Users className="h-6 w-6 text-[#9945FF]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sua Posição */}
        <Card className="border-0 shadow-lg dark:shadow-none dark:bg-[#161b22] overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="h-1 bg-gradient-to-r from-[#FFD700] to-[#FFA500]" />
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Sua Posição</p>
                <p className="text-4xl font-black text-gray-900 dark:text-[#00FF94] dark:drop-shadow-[0_0_10px_rgba(0,255,148,0.5)]">
                  #{stats?.rank || '-'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Top <span className="font-semibold text-[#FFD700]">{stats?.rank && stats.totalUsers ? ((stats.rank / stats.totalUsers) * 100).toFixed(0) : 0}%</span>
                </p>
              </div>
              {/* Ícone com Glow Neon */}
              <div className="relative">
                <div className="absolute inset-0 bg-[#FFD700] rounded-xl blur-lg opacity-0 dark:opacity-40 transition-opacity group-hover:opacity-60" />
                <div className="relative p-3 rounded-xl bg-[#FFD700]/10 dark:bg-[#FFD700]/20 shadow-sm dark:shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                  <Trophy className="h-6 w-6 text-[#FFD700]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-[#161b22] p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#0d1117] data-[state=active]:shadow-sm">
            Quests
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#0d1117] data-[state=active]:shadow-sm">
            Ranking
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#0d1117] data-[state=active]:shadow-sm">
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Quests Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Missões / Como Ganhar Pontos - Glassmorphism no Dark Mode */}
            <Card className="border-0 shadow-lg dark:shadow-none dark:bg-[#161b22]/80 dark:backdrop-blur-xl dark:border dark:border-white/5">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#FFD700] rounded-lg blur-md opacity-0 dark:opacity-50" />
                    <div className="relative p-2 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] shadow-lg dark:shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  Missões
                </CardTitle>
                <CardDescription>Complete para ganhar pontos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {QUESTS.map((quest) => (
                  <div
                    key={quest.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 dark:backdrop-blur-sm border border-gray-100 dark:border-white/10 hover:border-[#00FF94]/50 dark:hover:border-[#00FF94]/30 hover:bg-gray-100 dark:hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`absolute inset-0 rounded-xl blur-md opacity-0 dark:opacity-40 dark:group-hover:opacity-60 transition-opacity bg-gradient-to-br ${quest.color}`} />
                        <div className={`relative p-2.5 rounded-xl bg-gradient-to-br ${quest.color} shadow-lg`}>
                          <div className="text-white">{quest.icon}</div>
                        </div>
                      </div>
                      <span className="font-medium">{quest.event}</span>
                    </div>
                    <Badge className="bg-[#00FF94]/10 text-[#00FF94] dark:bg-[#00FF94]/20 border-0 font-mono text-sm px-3 dark:shadow-[0_0_10px_rgba(0,255,148,0.2)]">
                      +{quest.points}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Seus Indicados - Glassmorphism no Dark Mode */}
            <Card className="border-0 shadow-lg dark:shadow-none dark:bg-[#161b22]/80 dark:backdrop-blur-xl dark:border dark:border-white/5">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#00FF94] rounded-lg blur-md opacity-0 dark:opacity-50" />
                    <div className="relative p-2 rounded-lg bg-gradient-to-br from-[#14F195] to-[#00D4AA] shadow-lg dark:shadow-[0_0_20px_rgba(0,255,148,0.3)]">
                      <UserPlus className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  Seus Indicados
                </CardTitle>
                <CardDescription>Amigos que entraram com seu link</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.referrals && stats.referrals.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {stats.referrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#0d1117] border border-gray-100 dark:border-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-white font-bold">
                            {referral.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{referral.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {referral.wallet || 'Sem carteira'}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={referral.isActive ? 'default' : 'secondary'}
                          className={referral.isActive ? 'bg-[#14F195] hover:bg-[#14F195] text-black' : ''}
                        >
                          {referral.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Pendente
                            </>
                          )}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 px-4">
                    {/* Ícone com Glow Neon */}
                    <div className="relative w-20 h-20 mx-auto mb-5">
                      <div className="absolute inset-0 bg-[#00FF94] rounded-full blur-xl opacity-0 dark:opacity-20" />
                      <div className="relative w-full h-full rounded-full bg-gray-100 dark:bg-[#0d1117] dark:border dark:border-[#00FF94]/20 flex items-center justify-center">
                        <Users className="h-10 w-10 text-gray-400 dark:text-[#00FF94] opacity-50 dark:opacity-20" />
                      </div>
                    </div>

                    {/* Texto de Impacto */}
                    <p className="font-semibold text-foreground mb-2 text-lg">
                      O futuro do <span className="text-[#00FF94]">MFL</span> é construído por você.
                    </p>
                    <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
                      Convide sua rede, ganhe pontos e ajude o maior Fantasy Game da Solana a conquistar o mundo!
                    </p>

                    {/* CTA - Copiar Link */}
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                      className="border-2 border-[#00FF94]/50 hover:border-[#00FF94] hover:bg-[#00FF94]/10 text-[#00FF94] dark:shadow-[0_0_15px_rgba(0,255,148,0.15)]"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Link copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar link de convite
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leaderboard Tab - Premium com Glassmorphism */}
        <TabsContent value="leaderboard" className="mt-6">
          <Card className="border-0 shadow-lg dark:shadow-none dark:bg-[#161b22]/80 dark:backdrop-blur-xl dark:border dark:border-white/5 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#FFD700] rounded-lg blur-md opacity-0 dark:opacity-50" />
                  <div className="relative p-2 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] shadow-lg dark:shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                </div>
                Top 10 - Ranking Global
              </CardTitle>
              <CardDescription>Quem mais acumulou pontos no programa</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {leaderboard.map((entry) => {
                  const entryTier = TIER_CONFIG[entry.tier] || TIER_CONFIG.BRONZE;
                  const isTop3 = entry.rank <= 3;
                  const isCurrentUser = entry.userId === user?.id;

                  // Cores para Top 3
                  const rankColors = {
                    1: 'from-yellow-400 to-amber-500',
                    2: 'from-gray-300 to-gray-400',
                    3: 'from-orange-400 to-orange-500',
                  };

                  return (
                    <div
                      key={entry.userId}
                      className={`
                        flex items-center gap-4 p-4 transition-all
                        ${isCurrentUser ? 'bg-[#14F195]/5 dark:bg-[#14F195]/10 border-l-4 border-[#14F195]' : 'hover:bg-gray-50 dark:hover:bg-[#0d1117]'}
                        ${isTop3 ? 'py-5' : ''}
                      `}
                    >
                      {/* Rank Badge */}
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                        ${isTop3 ? `bg-gradient-to-br ${rankColors[entry.rank as 1 | 2 | 3]} text-white shadow-lg` : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'}
                      `}>
                        {entry.rank}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate ${isTop3 ? 'text-lg' : ''}`}>
                          {entry.name}
                          {isCurrentUser && <span className="text-[#14F195] ml-2">(você)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {entry.wallet || entry.username || '...'}
                        </p>
                      </div>

                      {/* Tier Badge */}
                      <Badge className={`hidden sm:flex ${entryTier.bgLight} ${entryTier.bgDark} ${entryTier.color} ${entryTier.darkColor} border-0`}>
                        {entry.tier}
                      </Badge>

                      {/* Referrals */}
                      <div className="text-right hidden sm:block">
                        <p className="text-sm text-muted-foreground">Indicados</p>
                        <p className="font-semibold">{entry.totalReferrals}</p>
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Pontos</p>
                        <p className={`font-bold ${isTop3 ? 'text-xl text-[#14F195]' : 'text-lg'}`}>
                          {entry.totalPoints.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* User Position (if not in top 10) */}
              {userPosition && userPosition.rank > 10 && (
                <div className="border-t-2 border-dashed border-[#14F195]/30 p-4 bg-[#14F195]/5 dark:bg-[#14F195]/10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#14F195] flex items-center justify-center text-black font-bold shrink-0">
                      {userPosition.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {userPosition.name} <span className="text-[#14F195]">(você)</span>
                      </p>
                      <p className="text-xs text-muted-foreground">Sua posição atual</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#14F195]">{userPosition.totalPoints.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">pontos</p>
                    </div>
                  </div>
                </div>
              )}

              {leaderboard.length === 0 && (
                <div className="text-center py-16 px-4">
                  <div className="relative w-20 h-20 mx-auto mb-5">
                    <div className="absolute inset-0 bg-[#FFD700] rounded-full blur-xl opacity-0 dark:opacity-20" />
                    <div className="relative w-full h-full rounded-full bg-gray-100 dark:bg-[#0d1117] dark:border dark:border-[#FFD700]/20 flex items-center justify-center">
                      <Trophy className="h-10 w-10 text-gray-400 dark:text-[#FFD700] opacity-50 dark:opacity-30" />
                    </div>
                  </div>
                  <p className="font-semibold text-foreground mb-2">O pódio está vazio!</p>
                  <p className="text-sm text-muted-foreground">Seja o primeiro a conquistar o topo do ranking <span className="text-[#00FF94]">MFL</span>.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab - Com Glassmorphism */}
        <TabsContent value="history" className="mt-6">
          <Card className="border-0 shadow-lg dark:shadow-none dark:bg-[#161b22]/80 dark:backdrop-blur-xl dark:border dark:border-white/5">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#9945FF] rounded-lg blur-md opacity-0 dark:opacity-50" />
                  <div className="relative p-2 rounded-lg bg-gradient-to-br from-[#9945FF] to-[#7B3FE4] shadow-lg dark:shadow-[0_0_20px_rgba(153,69,255,0.3)]">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </div>
                Histórico de Pontos
              </CardTitle>
              <CardDescription>Suas últimas atividades que geraram pontos</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.map((activity) => {
                    const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
                      SIGNUP: { icon: <UserPlus className="h-5 w-5" />, color: 'from-[#14F195] to-[#00D4AA]' },
                      ROUND_PLAYED: { icon: <Target className="h-5 w-5" />, color: 'from-[#9945FF] to-[#7B3FE4]' },
                      SOCIAL_SHARE: { icon: <Share2 className="h-5 w-5" />, color: 'from-[#1DA1F2] to-[#0D8DDB]' },
                      FIRST_WIN: { icon: <Trophy className="h-5 w-5" />, color: 'from-[#FFD700] to-[#FFA500]' },
                      STREAK_BONUS: { icon: <Flame className="h-5 w-5" />, color: 'from-[#FF6B6B] to-[#EE5A5A]' },
                    };
                    const config = iconMap[activity.type] || { icon: <Star className="h-5 w-5" />, color: 'from-gray-400 to-gray-500' };

                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#0d1117] border border-gray-100 dark:border-gray-800"
                      >
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${config.color} shadow-lg`}>
                          <div className="text-white">{config.icon}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{formatEventType(activity.type)}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {activity.description || formatEventType(activity.type)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <Badge className="bg-[#14F195]/10 text-[#14F195] dark:bg-[#14F195]/20 border-0 font-mono text-base px-3 py-1">
                          +{activity.points}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 px-4">
                  <div className="relative w-20 h-20 mx-auto mb-5">
                    <div className="absolute inset-0 bg-[#9945FF] rounded-full blur-xl opacity-0 dark:opacity-20" />
                    <div className="relative w-full h-full rounded-full bg-gray-100 dark:bg-[#0d1117] dark:border dark:border-[#9945FF]/20 flex items-center justify-center">
                      <Clock className="h-10 w-10 text-gray-400 dark:text-[#9945FF] opacity-50 dark:opacity-30" />
                    </div>
                  </div>
                  <p className="font-semibold text-foreground mb-2">Seu histórico está vazio</p>
                  <p className="text-sm text-muted-foreground mb-5">
                    Comece indicando amigos para acumular pontos no <span className="text-[#00FF94]">MFL</span>!
                  </p>
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="border-2 border-[#00FF94]/50 hover:border-[#00FF94] hover:bg-[#00FF94]/10 text-[#00FF94]"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar link de convite
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

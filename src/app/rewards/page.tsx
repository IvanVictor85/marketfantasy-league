'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  Gift, 
  Users, 
  Copy, 
  Check, 
  Star, 
  TrendingUp, 
  Calendar,
  ExternalLink,
  Crown,
  Coins,
  Target,
  Share2,
  UserPlus,
  Building2,
  DollarSign,
  Award,
  CheckCircle,
  Clock
} from 'lucide-react';

// Interfaces para tipagem
interface UserLevel {
  currentLevel: number;
  currentXP: number;
  nextLevelXP: number;
  levelName: string;
}

interface RewardLevel {
  level: number;
  reward: number;
  unlocked: boolean;
  claimed: boolean;
}

interface Activity {
  id: string;
  action: string;
  reward: string;
  date: string;
  type: 'xp' | 'fantasy';
}

interface ReferralStats {
  totalReferred: number;
  totalEarned: number;
  activeReferrals: number;
}

interface Referral {
  id: string;
  username: string;
  registrationDate: string;
  status: 'active' | 'inactive';
  totalGenerated: number;
}

interface CommunityStats {
  isRegistered: boolean;
  communityName?: string;
  members?: number;
  totalVolume?: number;
  treasuryRewards?: number;
  referralLink?: string;
}

// Dados mockados
const mockUserLevel: UserLevel = {
  currentLevel: 12,
  currentXP: 1250,
  nextLevelXP: 1500,
  levelName: "Mestre Cripto"
};

const mockRewardLevels: RewardLevel[] = Array.from({ length: 50 }, (_, i) => ({
  level: i + 1,
  reward: (i + 1) * 25,
  unlocked: i + 1 <= 12,
  claimed: i + 1 <= 10
}));

const mockActivities: Activity[] = [
  {
    id: '1',
    action: 'Completou a Liga Principal',
    reward: '+25 XP',
    date: '2024-01-15',
    type: 'xp'
  },
  {
    id: '2',
    action: 'Indicou um amigo',
    reward: '+50 pontos',
    date: '2024-01-14',
    type: 'fantasy'
  },
  {
    id: '3',
    action: 'Subiu para Nível 12',
    reward: '+300 pontos',
    date: '2024-01-13',
    type: 'fantasy'
  },
  {
    id: '4',
    action: 'Participou da Liga Solana Degens',
    reward: '+15 XP',
    date: '2024-01-12',
    type: 'xp'
  },
  {
    id: '5',
    action: 'Primeira vitória da temporada',
    reward: '+100 pontos',
    date: '2024-01-10',
    type: 'fantasy'
  }
];

const mockReferralStats: ReferralStats = {
  totalReferred: 8,
  totalEarned: 1250,
  activeReferrals: 6
};

const mockReferrals: Referral[] = [
  {
    id: '1',
    username: 'crypto_trader.sol',
    registrationDate: '2024-01-10',
    status: 'active',
    totalGenerated: 450
  },
  {
    id: '2',
    username: 'defi_master.sol',
    registrationDate: '2024-01-08',
    status: 'active',
    totalGenerated: 320
  },
  {
    id: '3',
    username: 'nft_collector.sol',
    registrationDate: '2024-01-05',
    status: 'inactive',
    totalGenerated: 180
  },
  {
    id: '4',
    username: 'solana_dev.sol',
    registrationDate: '2024-01-03',
    status: 'active',
    totalGenerated: 300
  }
];

const mockCommunityStats: CommunityStats = {
  isRegistered: true,
  communityName: "Solana Brasil DAO",
  members: 156,
  totalVolume: 45000,
  treasuryRewards: 4500,
  referralLink: "cryptofantasy.gg/community/solana-brasil-dao"
};

export default function RewardsPage() {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('season');

  const handleCopyLink = (link: string, type: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const progressPercentage = (mockUserLevel.currentXP / mockUserLevel.nextLevelXP) * 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Central de Recompensas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Acompanhe suas recompensas, indique amigos e gerencie sua comunidade
        </p>
      </div>

      {/* Tabs Principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="season" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Recompensas da Temporada
          </TabsTrigger>
          <TabsTrigger value="referral" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Indique um Amigo
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Programa de Comunidades
          </TabsTrigger>
        </TabsList>

        {/* Aba: Recompensas da Temporada */}
        <TabsContent value="season" className="space-y-6">
          {/* Componente de Cabeçalho - Nível Atual */}
          <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Crown className="w-6 h-6" />
                    Nível {mockUserLevel.currentLevel} - {mockUserLevel.levelName}
                  </CardTitle>
                  <CardDescription className="text-purple-100">
                    Continue jogando para desbloquear mais recompensas
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{mockUserLevel.currentXP}</div>
                  <div className="text-sm text-purple-200">XP Total</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso para o Nível {mockUserLevel.currentLevel + 1}</span>
                  <span>{mockUserLevel.currentXP} / {mockUserLevel.nextLevelXP} XP</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <div className="text-sm text-purple-200">
                  Faltam {mockUserLevel.nextLevelXP - mockUserLevel.currentXP} XP para o próximo nível
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trilha de Recompensas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Sua Trilha da Temporada 1
              </CardTitle>
              <CardDescription>
                Complete atividades e suba de nível para desbloquear recompensas em $FANTASY
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
                {mockRewardLevels.slice(0, 20).map((level) => (
                  <div
                    key={level.level}
                    className={`
                      relative p-3 rounded-lg border-2 text-center transition-all
                      ${level.claimed 
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                        : level.unlocked 
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                        : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                      }
                      ${level.level === mockUserLevel.currentLevel + 1 ? 'ring-2 ring-purple-500' : ''}
                    `}
                  >
                    {level.claimed && (
                      <CheckCircle className="absolute -top-2 -right-2 w-5 h-5 text-green-500 bg-white rounded-full" />
                    )}
                    <div className="text-lg font-bold">{level.level}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {level.reward} $FANTASY
                    </div>
                    {level.unlocked && !level.claimed && (
                      <Button size="sm" className="mt-2 h-6 text-xs">
                        Resgatar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Ver Todos os Níveis (1-50)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Ganhos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Atividade Recente
              </CardTitle>
              <CardDescription>
                Suas últimas atividades que renderam XP ou pontos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ação</TableHead>
                    <TableHead>Recompensa</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.action}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={activity.type === 'xp' ? 'secondary' : 'default'}
                          className="gap-1"
                        >
                          {activity.type === 'xp' ? (
                            <Star className="w-3 h-3" />
                          ) : (
                            <Coins className="w-3 h-3" />
                          )}
                          {activity.reward}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {new Date(activity.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Indique um Amigo */}
        <TabsContent value="referral" className="space-y-6">
          {/* Componente de Destaque */}
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Gift className="w-6 h-6" />
                Convide Seus Amigos, Ganhe Pontos
              </CardTitle>
              <CardDescription className="text-green-100">
                Você ganha uma comissão de 5% sobre as taxas de todas as ligas que seus amigos participarem. Para sempre.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Seu Link de Indicação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Seu Link de Indicação
              </CardTitle>
              <CardDescription>
                Compartilhe este link para ganhar recompensas quando seus amigos se registrarem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value="cryptofantasy.gg/ref/ivanvictor" 
                  readOnly 
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleCopyLink('cryptofantasy.gg/ref/ivanvictor', 'personal')}
                  className="gap-2"
                >
                  {copiedLink === 'personal' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Link
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  Compartilhar no Twitter
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Compartilhar no Discord
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Suas Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amigos Indicados</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockReferralStats.totalReferred}</div>
                <p className="text-xs text-muted-foreground">
                  {mockReferralStats.activeReferrals} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recompensas Totais</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockReferralStats.totalEarned} $FANTASY</div>
                <p className="text-xs text-muted-foreground">
                  Ganhos acumulados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Comissão</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5%</div>
                <p className="text-xs text-muted-foreground">
                  Para sempre
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Indicados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Suas Indicações
              </CardTitle>
              <CardDescription>
                Acompanhe o desempenho dos usuários que você indicou
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Data de Registro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Volume Gerado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium">{referral.username}</TableCell>
                      <TableCell>
                        {new Date(referral.registrationDate).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={referral.status === 'active' ? 'default' : 'secondary'}
                        >
                          {referral.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{referral.totalGenerated} $FANTASY</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Programa de Comunidades */}
        <TabsContent value="community" className="space-y-6">
          {/* Componente de Destaque */}
          <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                Traga sua Comunidade para a CryptoFantasy League
              </CardTitle>
              <CardDescription className="text-orange-100">
                Engaje seus membros com ligas exclusivas e gere receita para a tesouraria da sua comunidade.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Como Funciona */}
          <Card>
            <CardHeader>
              <CardTitle>Como Funciona</CardTitle>
              <CardDescription>
                Benefícios exclusivos para líderes de comunidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
                    <ExternalLink className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold">Link Personalizado</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receba um link de afiliação exclusivo para sua comunidade
                  </p>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold">Receita para a Tesouraria</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ganhe uma comissão de 10% sobre as taxas geradas por todos os membros
                  </p>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                    <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold">Ferramentas de Engajamento</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Crie ligas privadas e acompanhe o desempenho em um dashboard exclusivo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard da Comunidade ou Inscrição */}
          {mockCommunityStats.isRegistered ? (
            <>
              {/* Dashboard da Comunidade */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Dashboard da Comunidade - {mockCommunityStats.communityName}
                  </CardTitle>
                  <CardDescription>
                    Acompanhe o desempenho da sua comunidade
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      value={mockCommunityStats.referralLink} 
                      readOnly 
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => handleCopyLink(mockCommunityStats.referralLink!, 'community')}
                      className="gap-2"
                    >
                      {copiedLink === 'community' ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar Link
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Membros da Comunidade</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockCommunityStats.members}</div>
                    <p className="text-xs text-muted-foreground">
                      Usuários registrados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Volume Total Gerado</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockCommunityStats.totalVolume?.toLocaleString()} pontos</div>
                    <p className="text-xs text-muted-foreground">
                      Desde o início
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recompensas da Tesouraria</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockCommunityStats.treasuryRewards?.toLocaleString()} pontos</div>
                    <p className="text-xs text-muted-foreground">
                      10% de comissão
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            /* Formulário de Inscrição */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Inscrever Minha Comunidade
                </CardTitle>
                <CardDescription>
                  Preencha as informações para inscrever sua comunidade no programa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Building2 className="h-4 w-4" />
                  <AlertDescription>
                    Após a inscrição, nossa equipe analisará sua aplicação e entrará em contato em até 48 horas.
                  </AlertDescription>
                </Alert>
                
                <Button size="lg" className="w-full gap-2">
                  <UserPlus className="w-5 h-5" />
                  Inscrever Minha Comunidade Agora
                </Button>
                
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Já inscreveu sua comunidade? Entre em contato conosco no Discord.
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
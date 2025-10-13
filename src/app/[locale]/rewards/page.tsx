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
  Clock,
  Zap
} from 'lucide-react';
import { useRewardsTranslations, useCommonTranslations } from '@/hooks/useTranslations';

export default function RewardsPage() {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Traduções
  const tRewards = useRewardsTranslations();
  const tCommon = useCommonTranslations();

  // Mock data
  const userStats = {
    totalEarned: 2450.75,
    currentBalance: 1890.25,
    referrals: 12,
    achievements: 8,
    rank: 'Gold',
    nextRankProgress: 75
  };

  const referralCode = 'CRYPTO2024';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const achievements = [
    {
      id: 1,
      title: tRewards('firstTrade'),
      description: tRewards('firstTradeDesc'),
      reward: 50,
      completed: true,
      icon: <Trophy className="h-6 w-6" />
    },
    {
      id: 2,
      title: tRewards('weeklyTrader'),
      description: tRewards('weeklyTraderDesc'),
      reward: 100,
      completed: true,
      icon: <Calendar className="h-6 w-6" />
    },
    {
      id: 3,
      title: tRewards('socialButterfly'),
      description: tRewards('socialButterflyDesc'),
      reward: 200,
      completed: false,
      icon: <Users className="h-6 w-6" />
    },
    {
      id: 4,
      title: tRewards('portfolioMaster'),
      description: tRewards('portfolioMasterDesc'),
      reward: 500,
      completed: false,
      icon: <Crown className="h-6 w-6" />
    }
  ];

  const recentRewards = [
    {
      id: 1,
      type: 'achievement',
      title: tRewards('weeklyTrader'),
      amount: 100,
      date: '2024-01-15',
      status: 'completed'
    },
    {
      id: 2,
      type: 'referral',
      title: tRewards('referralBonus'),
      amount: 50,
      date: '2024-01-14',
      status: 'completed'
    },
    {
      id: 3,
      type: 'trading',
      title: tRewards('tradingReward'),
      amount: 25,
      date: '2024-01-13',
      status: 'pending'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{tRewards('title')}</h1>
          <p className="text-muted-foreground">
            {tRewards('subtitle')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button>
            <Gift className="h-4 w-4 mr-2" />
            {tRewards('claimRewards')}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tRewards('totalEarned')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${userStats.totalEarned}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% {tCommon('from')} {tCommon('lastMonth')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tRewards('currentBalance')}
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${userStats.currentBalance}</div>
            <p className="text-xs text-muted-foreground">
              {tCommon('available')} {tCommon('for')} {tCommon('withdrawal')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tRewards('referrals')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.referrals}</div>
            <p className="text-xs text-muted-foreground">
              +2 {tCommon('this')} {tCommon('month')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tRewards('rank')}
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.rank}</div>
            <div className="mt-2">
              <Progress value={userStats.nextRankProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {userStats.nextRankProgress}% {tCommon('to')} Platinum
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{tCommon('overview')}</TabsTrigger>
          <TabsTrigger value="achievements">{tRewards('achievements')}</TabsTrigger>
          <TabsTrigger value="referrals">{tRewards('referrals')}</TabsTrigger>
          <TabsTrigger value="history">{tCommon('history')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  {tRewards('recentAchievements')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {achievements.filter(a => a.completed).slice(0, 3).map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="text-green-600">
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                    <Badge variant="secondary">+${achievement.reward}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  {tCommon('quickActions')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  {tRewards('shareReferral')}
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  {tRewards('viewChallenges')}
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Building2 className="h-4 w-4 mr-2" />
                  {tRewards('joinLeague')}
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {tRewards('withdrawFunds')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{tRewards('achievements')}</CardTitle>
              <CardDescription>
                {tRewards('achievementsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <Card key={achievement.id} className={achievement.completed ? 'border-green-200 bg-green-50' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${achievement.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{achievement.title}</h4>
                            {achievement.completed && <CheckCircle className="h-4 w-4 text-green-600" />}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                          <Badge variant={achievement.completed ? 'default' : 'secondary'}>
                            +${achievement.reward}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{tRewards('referralProgram')}</CardTitle>
              <CardDescription>
                {tRewards('referralDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Referral Code */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">{tRewards('yourReferralCode')}</h4>
                <div className="flex items-center gap-2">
                  <Input value={referralCode} readOnly className="font-mono" />
                  <Button onClick={handleCopyCode} variant="outline">
                    {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Referral Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <UserPlus className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold">{userStats.referrals}</div>
                    <p className="text-sm text-muted-foreground">{tRewards('totalReferrals')}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold">$600</div>
                    <p className="text-sm text-muted-foreground">{tRewards('referralEarnings')}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold">15%</div>
                    <p className="text-sm text-muted-foreground">{tRewards('conversionRate')}</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{tRewards('rewardHistory')}</CardTitle>
              <CardDescription>
                {tRewards('historyDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tCommon('type')}</TableHead>
                    <TableHead>{tCommon('description')}</TableHead>
                    <TableHead>{tCommon('amount')}</TableHead>
                    <TableHead>{tCommon('date')}</TableHead>
                    <TableHead>{tCommon('status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRewards.map((reward) => (
                    <TableRow key={reward.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {reward.type === 'achievement' && <Trophy className="h-3 w-3 mr-1" />}
                          {reward.type === 'referral' && <Users className="h-3 w-3 mr-1" />}
                          {reward.type === 'trading' && <TrendingUp className="h-3 w-3 mr-1" />}
                          {reward.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{reward.title}</TableCell>
                      <TableCell className="font-medium">+${reward.amount}</TableCell>
                      <TableCell>{reward.date}</TableCell>
                      <TableCell>
                        <Badge variant={reward.status === 'completed' ? 'default' : 'secondary'}>
                          {reward.status === 'completed' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                          {reward.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
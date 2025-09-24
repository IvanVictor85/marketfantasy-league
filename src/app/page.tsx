'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/navbar';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Trophy, 
  DollarSign, 
  BarChart3,
  Zap,
  Star,
  ArrowRight,
  Coins
} from 'lucide-react';

export default function Home() {
  const marketStats = [
    {
      title: 'Total em Prêmios',
      value: '$125,000',
      change: '+12.5%',
      trend: 'up' as const,
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      title: 'Jogadores Ativos',
      value: '2,847',
      change: '+8.2%',
      trend: 'up' as const,
      icon: <Users className="w-5 h-5" />
    },
    {
      title: 'Ligas Ativas',
      value: '156',
      change: '+15.3%',
      trend: 'up' as const,
      icon: <Trophy className="w-5 h-5" />
    },
    {
      title: 'Volume 24h',
      value: '$45,230',
      change: '-2.1%',
      trend: 'down' as const,
      icon: <BarChart3 className="w-5 h-5" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200">
            <Coins className="w-3 h-3 mr-1" />
            Nova Era do Fantasy Sports
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            CryptoFantasy
            <span className="block text-4xl md:text-6xl">League</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
            Combine a emoção do fantasy sports com o dinamismo do mercado cripto.
            <span className="block mt-2 font-semibold text-blue-600">
              Monte seu time, compete e ganhe prêmios reais!
            </span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/teams">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg">
                <Trophy className="w-5 h-5 mr-2" />
                Começar Agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/leagues">
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-2">
                <Users className="w-5 h-5 mr-2" />
                Ver Ligas
              </Button>
            </Link>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {marketStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-blue-600">{stat.icon}</div>
                  <div className={`flex items-center text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.title}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

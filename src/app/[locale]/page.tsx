'use client';

import React from 'react';
import { LocalizedLink } from '@/components/ui/localized-link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Wallet,
  LineChart,
  Lock,
  Zap,
  Key,
  ArrowRight,
  Shield,
  Bitcoin,
  DollarSign,
  CheckCircle,
  Award,
  TrendingUp,
  Users,
  Coins
} from 'lucide-react';
import { useTranslations } from 'next-intl';

// Seção Herói - Fiel ao Figma
const HeroSection = () => {
  const t = useTranslations('HomePage');

  return (
  <section
    className="relative pt-24 pb-20 md:pt-32 md:pb-32 lg:pt-40 lg:pb-40 overflow-hidden min-h-screen flex items-center"
    style={{
      backgroundImage: 'url(/mascots/bull-bear-arena.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      marginTop: '-64px', // Compensar altura da navbar (h-16 = 64px)
      paddingTop: 'calc(64px + 5rem)', // Adicionar padding = altura navbar + espaço
    }}
  >
    {/* Overlay escuro */}
    <div className="absolute inset-0 bg-black/70 z-10" />

    {/* Conteúdo */}
    <div className="container relative z-20 mx-auto px-4 md:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto text-center">
        
        {/* Badge Powered by Solana */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent/15 border border-accent/30 backdrop-blur-sm mb-8">
          <Zap className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-white">Powered by Solana</span>
        </div>

        {/* Título principal */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
          {t('heroTitle')}
        </h1>

        {/* Subtítulo */}
        <p className="text-white/90 text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed font-normal">
          {t('heroSubtitle')}
        </p>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <LocalizedLink href="/ligas" prefetch={false}>
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-white text-base md:text-lg px-8 py-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl font-semibold">
              {t('startPlaying')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </LocalizedLink>

          <LocalizedLink href="/dashboard" prefetch={false}>
            <Button size="lg" variant="outline" className="bg-transparent border-2 border-white/50 text-white hover:bg-white/10 text-base md:text-lg px-8 py-6 rounded-lg transition-all duration-300 font-semibold">
              {t('viewDashboard')}
            </Button>
          </LocalizedLink>
        </div>

      </div>
    </div>
  </section>
  );
};

// Seção Como Funciona - Fiel ao Figma
const HowItWorksSection = () => {
  const t = useTranslations('HomePage');

  return (
  <section className="py-20 md:py-24 bg-muted dark:bg-black">
    <div className="container mx-auto px-4 md:px-6 lg:px-8">
      
      {/* Título */}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground dark:text-white mb-16 text-left">
        {t('howItWorksTitle')}
      </h2>
      
      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        
        {/* Card 1 - Monte seu Time */}
        <Card className="bg-card dark:bg-[#1a1a1a] border-0 border-t-4 border-t-accent rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-8">
            <div className="mb-6">
              <div className="inline-flex p-3 rounded-xl bg-accent/10">
                <Bitcoin className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-card-foreground dark:text-white mb-4">
              {t('step1Title')}
            </h3>
            <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
              {t('step1Desc')}
            </p>
          </CardContent>
        </Card>

        {/* Card 2 - Entre em uma Liga */}
        <Card className="bg-card dark:bg-[#1a1a1a] border-0 border-t-4 border-t-accent rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-8">
            <div className="mb-6">
              <div className="inline-flex p-3 rounded-xl bg-accent/10">
                <Trophy className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-card-foreground dark:text-white mb-4">
              {t('step2Title')}
            </h3>
            <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
              {t('step2Desc')}
            </p>
          </CardContent>
        </Card>

        {/* Card 3 - Ganhe Prêmios */}
        <Card className="bg-card dark:bg-[#1a1a1a] border-0 border-t-4 border-t-accent rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-8">
            <div className="mb-6">
              <div className="inline-flex p-3 rounded-xl bg-accent/10">
                <Award className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-card-foreground dark:text-white mb-4">
              {t('step3Title')}
            </h3>
            <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
              {t('step3Desc')}
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  </section>
  );
};

// Seção de Features/Vantagens - Fiel ao Figma
const ValuePropositionSection = () => {
  const t = useTranslations('HomePage');

  const features = [
    { icon: Zap, title: t('feature1Title'), desc: t('feature1Desc'), color: 'text-accent', bgColor: 'bg-accent/10' },
    { icon: Shield, title: t('feature2Title'), desc: t('feature2Desc'), color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { icon: Coins, title: t('feature3Title'), desc: t('feature3Desc'), color: 'text-accent', bgColor: 'bg-accent/10' },
    { icon: TrendingUp, title: t('feature4Title'), desc: t('feature4Desc'), color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { icon: Users, title: t('feature5Title'), desc: t('feature5Desc'), color: 'text-accent', bgColor: 'bg-accent/10' },
    { icon: Key, title: t('feature6Title'), desc: t('feature6Desc'), color: 'text-accent', bgColor: 'bg-accent/10' },
  ];

  return (
  <section className="py-20 md:py-24 bg-background dark:bg-[#0d0f14]">
    <div className="container mx-auto px-4 md:px-6 lg:px-8">
      
      {/* Badge e Título */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
          <Trophy className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-accent">Vantagens Exclusivas</span>
        </div>
        
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground dark:text-white mb-4">
          {t('advantageTitle')}
        </h2>
        <p className="text-lg text-muted-foreground dark:text-gray-400 max-w-2xl mx-auto">
          Tecnologia blockchain combinada com a emoção do fantasy
        </p>
      </div>

      {/* Grid de features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index} className="bg-card dark:bg-[#1a1a1a] border-border/30 rounded-xl hover:border-accent/30 transition-all duration-300 overflow-hidden group">
              <CardContent className="p-8">
                <div className="mb-5">
                  <div className={`inline-flex p-3 rounded-xl ${feature.bgColor}`}>
                    <Icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-card-foreground dark:text-white mb-3 group-hover:text-accent transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  </section>
  );
};

// Seção de CTA Final - Fiel ao Figma
const FinalCTASection = () => {
  const t = useTranslations('HomePage');

  return (
  <section className="py-20 md:py-24 bg-muted dark:bg-black">
    <div className="container mx-auto px-4 md:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground dark:text-white mb-6">
          {t('ctaTitle')}
        </h2>
        
        <p className="text-lg md:text-xl text-muted-foreground dark:text-gray-400 mb-10">
          {t('ctaSubtitle')}
        </p>
        
        <LocalizedLink href="/ligas" prefetch={false}>
          <Button size="lg" className="bg-accent hover:bg-accent/90 text-white text-base md:text-lg px-8 py-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl font-semibold">
            {t('startNow')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </LocalizedLink>
        
      </div>
    </div>
  </section>
  );
};

// Componentes da página
export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <HowItWorksSection />
      <ValuePropositionSection />
      <FinalCTASection />
    </main>
  );
}

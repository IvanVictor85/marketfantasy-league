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

// Seção Herói com tema Touro vs. Urso
const HeroSection = () => {
  const t = useTranslations('HomePage');

  return (
  <section
    className="relative py-16 md:py-20 lg:py-28 overflow-hidden h-[500px] md:h-[600px] lg:h-[700px]"
    style={{
      backgroundImage: 'url(/mascots/bull-bear-arena.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
    }}
  >
    {/* CAMADA 2: Overlay preto semi-transparente */}
    <div className="absolute inset-0 bg-black/60 z-10" />

    {/* CAMADA 3: Conteúdo */}
    <div className="container relative z-20 mx-auto px-4 py-12 md:py-20 text-center">

      <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 md:mb-8 drop-shadow-2xl tracking-tight leading-tight">
        {t('heroTitle')}
      </h1>

      <p className="text-white text-xl md:text-2xl lg:text-3xl max-w-4xl mx-auto mb-8 md:mb-10 drop-shadow-2xl font-medium">
        {t('heroSubtitle')}
      </p>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
        <LocalizedLink href="/ligas" prefetch={false}>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg md:text-xl px-8 md:px-10 py-6 md:py-7 rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl font-bold">
            {t('startPlaying')}
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </LocalizedLink>

        <LocalizedLink href="/dashboard" prefetch={false}>
          <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white/20 text-lg md:text-xl px-8 md:px-10 py-6 md:py-7 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 font-medium">
            {t('viewDashboard')}
          </Button>
        </LocalizedLink>
      </div>

    </div>
  </section>
  );
};

// Seção Como Funciona
const HowItWorksSection = () => {
  const t = useTranslations('HomePage');

  return (
  <section className="py-20 bg-muted">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
        {t('howItWorksTitle')}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card 1 */}
        <Card className="bg-card rounded-xl shadow-lg border-t-4 border-t-primary border-x-0 border-b-0 hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Bitcoin className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">{t('step1Title')}</h3>
            <p className="text-muted-foreground text-center">
              {t('step1Desc')}
            </p>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="bg-card rounded-xl shadow-lg border-t-4 border-t-primary border-x-0 border-b-0 hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">{t('step2Title')}</h3>
            <p className="text-muted-foreground text-center">
              {t('step2Desc')}
            </p>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="bg-card rounded-xl shadow-lg border-t-4 border-t-primary border-x-0 border-b-0 hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Award className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">{t('step3Title')}</h3>
            <p className="text-muted-foreground text-center">
              {t('step3Desc')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
  );
};

// Seção A Vantagem MFL
const ValuePropositionSection = () => {
  const t = useTranslations('HomePage');

  return (
  <section className="py-20 bg-primary">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-primary-foreground mb-12">
        {t('advantageTitle')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Card 1 - Construído na Solana */}
        <Card className="bg-card rounded-xl shadow-lg hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Zap className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">{t('feature1Title')}</h3>
            <p className="text-muted-foreground text-center">
              {t('feature1Desc')}
            </p>
          </CardContent>
        </Card>

        {/* Card 2 - Fair Play Transparente */}
        <Card className="bg-card rounded-xl shadow-lg hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">{t('feature2Title')}</h3>
            <p className="text-muted-foreground text-center">
              {t('feature2Desc')}
            </p>
          </CardContent>
        </Card>

        {/* Card 3 - Prêmios em Cripto e NFTs */}
        <Card className="bg-card rounded-xl shadow-lg hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Coins className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">{t('feature3Title')}</h3>
            <p className="text-muted-foreground text-center">
              {t('feature3Desc')}
            </p>
          </CardContent>
        </Card>

        {/* Card 4 - Dados de Mercado em Tempo Real */}
        <Card className="bg-card rounded-xl shadow-lg hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">{t('feature4Title')}</h3>
            <p className="text-muted-foreground text-center">
              {t('feature4Desc')}
            </p>
          </CardContent>
        </Card>

        {/* Card 5 - Ligas de Comunidade */}
        <Card className="bg-card rounded-xl shadow-lg hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">{t('feature5Title')}</h3>
            <p className="text-muted-foreground text-center">
              {t('feature5Desc')}
            </p>
          </CardContent>
        </Card>

        {/* Card 6 - Você no Controle */}
        <Card className="bg-card rounded-xl shadow-lg hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Key className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">{t('feature6Title')}</h3>
            <p className="text-muted-foreground text-center">
              {t('feature6Desc')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
  );
};

// Seção de CTA Final
const FinalCTASection = () => {
  const t = useTranslations('HomePage');

  return (
  <section className="py-20 bg-muted">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
        {t('ctaTitle')}
      </h2>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
        {t('ctaSubtitle')}
      </p>
      <LocalizedLink href="/ligas">
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
          {t('startNow')}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </LocalizedLink>
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

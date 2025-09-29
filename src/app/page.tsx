'use client';

import React from 'react';
import Link from 'next/link';
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

// Seção Herói com tema Touro vs. Urso
const HeroSection = () => (
  <section className="relative py-24 overflow-hidden">
    {/* Background com overlay */}
    <div className="absolute inset-0">
      <div 
        className="absolute inset-0 opacity-100 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/mascots/bull-bear-arena.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
      </div>
    </div>
    
    <div className="absolute inset-0 bg-gradient-to-b from-[#9945FF]/30 to-[#9945FF]/50" />
    
    <div className="container relative mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
        O Fantasy Game do Universo Cripto.
      </h1>
      <p className="text-[#00FFA3] text-xl md:text-2xl max-w-3xl mx-auto mb-8 drop-shadow-md">
        Desafie seus amigos e sua comunidade favorita. Monte seu time de cripto e conquiste prêmios reais em ligas seguras e 100% on-chain.
      </p>
      <Link href="/ligas">
        <Button className="bg-[#F7931A] hover:bg-[#F7931A]/90 text-white text-lg px-8 py-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
          Começar a Jogar
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>
    </div>
  </section>
);

// Seção "Jogue em Apenas 3 Passos"
const HowItWorksSection = () => (
  <section className="py-20 bg-[#F5F5F5]">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-[#141414] mb-12">
        Jogue em Apenas 3 Passos
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Passo 1 */}
        <Card className="bg-white rounded-xl shadow-lg border-t-4 border-t-[#9945FF] border-x-0 border-b-0 hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-[#9945FF]/10">
                <Bitcoin className="h-10 w-10 text-[#9945FF]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-[#141414] mb-2">1. Monte seu Time</h3>
            <p className="text-slate-600 text-center">
              Selecione até 5 criptomoedas para formar seu time dos sonhos baseado nas suas análises e estratégias.
            </p>
          </CardContent>
        </Card>
        
        {/* Passo 2 */}
        <Card className="bg-white rounded-xl shadow-lg border-t-4 border-t-[#9945FF] border-x-0 border-b-0 hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-[#9945FF]/10">
                <Trophy className="h-10 w-10 text-[#9945FF]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-[#141414] mb-2">2. Entre em uma Liga</h3>
            <p className="text-slate-600 text-center">
              Escolha entre ligas gratuitas ou pagas e compita contra outros jogadores por prêmios reais em cripto.
            </p>
          </CardContent>
        </Card>
        
        {/* Passo 3 */}
        <Card className="bg-white rounded-xl shadow-lg border-t-4 border-t-[#9945FF] border-x-0 border-b-0 hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-[#9945FF]/10">
                <Award className="h-10 w-10 text-[#9945FF]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-[#141414] mb-2">3. Ganhe Prêmios</h3>
            <p className="text-slate-600 text-center">
              Acompanhe o desempenho do seu time e ganhe prêmios baseados na performance das criptomoedas escolhidas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);

// Seção de Proposta de Valor
const ValuePropositionSection = () => (
  <section className="py-20 bg-[#9945FF]">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
        Por Que CryptoFantasy League?
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Card 1 */}
        <Card className="bg-white rounded-xl shadow-lg hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-[#9945FF]/10">
                <Shield className="h-8 w-8 text-[#9945FF]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-[#141414] mb-2">100% Seguro</h3>
            <p className="text-[#8A8A8A] text-center">
              Contratos inteligentes auditados e transparentes garantem a segurança dos seus fundos.
            </p>
          </CardContent>
        </Card>
        
        {/* Card 2 */}
        <Card className="bg-white rounded-xl shadow-lg hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-[#9945FF]/10">
                <Users className="h-8 w-8 text-[#9945FF]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-[#141414] mb-2">Comunidade Vibrante</h3>
            <p className="text-[#8A8A8A] text-center">
              Participe de ligas com amigos ou entre em competições globais com milhares de jogadores.
            </p>
          </CardContent>
        </Card>
        
        {/* Card 3 */}
        <Card className="bg-white rounded-xl shadow-lg hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-[#9945FF]/10">
                <Coins className="h-8 w-8 text-[#9945FF]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-[#141414] mb-2">Prêmios Reais</h3>
            <p className="text-[#8A8A8A] text-center">
              Ganhe criptomoedas reais baseadas no desempenho do seu time nas ligas competitivas.
            </p>
          </CardContent>
        </Card>
        
        {/* Card 4 */}
        <Card className="bg-white rounded-xl shadow-lg hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-[#9945FF]/10">
                <TrendingUp className="h-8 w-8 text-[#9945FF]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-[#141414] mb-2">Dados em Tempo Real</h3>
            <p className="text-[#8A8A8A] text-center">
              Acompanhe o desempenho do seu time com dados de mercado atualizados em tempo real.
            </p>
          </CardContent>
        </Card>
        
        {/* Card 5 */}
        <Card className="bg-white rounded-xl shadow-lg hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-[#9945FF]/10">
                <Zap className="h-8 w-8 text-[#9945FF]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-[#141414] mb-2">Experiência Gamificada</h3>
            <p className="text-[#8A8A8A] text-center">
              Aprenda sobre criptomoedas enquanto se diverte com uma experiência totalmente gamificada.
            </p>
          </CardContent>
        </Card>
        
        {/* Card 6 */}
        <Card className="bg-white rounded-xl shadow-lg hover:transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-[#9945FF]/10">
                <Lock className="h-8 w-8 text-[#9945FF]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-[#141414] mb-2">Multi-Chain</h3>
            <p className="text-[#8A8A8A] text-center">
              Plataforma agnóstica de blockchain, suportando múltiplas redes para máxima flexibilidade.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);

// Seção de CTA Final
const FinalCTASection = () => (
  <section className="py-20 bg-[#F5F5F5]">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-[#141414] mb-6">
        Pronto para montar seu time dos sonhos?
      </h2>
      <p className="text-xl text-[#8A8A8A] max-w-2xl mx-auto mb-8">
        Junte-se a milhares de jogadores e comece sua jornada no maior fantasy game de criptomoedas.
      </p>
      <Link href="/ligas">
        <Button className="bg-[#F7931A] hover:bg-[#F7931A]/90 text-white text-lg px-8 py-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
          Começar Agora
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>
    </div>
  </section>
);

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

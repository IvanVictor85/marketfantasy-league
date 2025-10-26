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

// Seção Herói com tema Touro vs. Urso
const HeroSection = () => (
  <section className="relative py-16 md:py-20 lg:py-28 overflow-hidden h-[500px] md:h-[600px] lg:h-[700px]">
    {/* Background com overlay */}
    <div className="absolute inset-0 bg-black/50">
      <div 
        className="absolute inset-0 opacity-90 scale-110 md:scale-105 lg:scale-100"
        style={{
          backgroundImage: 'url(/mascots/bull-bear-arena.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          width: '100%',
          height: '100%',
        }}
      >
      </div>
    </div>
    
    {/* Gradiente para melhor contraste */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
    
    <div className="container relative mx-auto px-4 py-12 md:py-20 text-center">
      
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 md:mb-8 drop-shadow-lg tracking-tight leading-tight">
        O Fantasy Game do <span className="text-accent">Universo Cripto</span>.
      </h1>

      <p className="text-accent-foreground text-xl md:text-2xl lg:text-3xl max-w-4xl mx-auto mb-8 md:mb-10 drop-shadow-md font-medium">
        Monte seu time de criptoativos, teste suas estratégias em ligas 100% on-chain e transforme sua análise de mercado em prêmios reais. Tudo com a velocidade e transparência da Solana.
      </p>
      
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
        <LocalizedLink href="/ligas" prefetch={false}>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg md:text-xl px-8 md:px-10 py-6 md:py-7 rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl z-10 relative font-bold">
            Começar a Jogar
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </LocalizedLink>
        
        <LocalizedLink href="/dashboard" prefetch={false}>
          <Button variant="outline" className="bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 text-lg md:text-xl px-8 md:px-10 py-6 md:py-7 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 z-10 relative font-medium">
            Ver Dashboard
          </Button>
        </LocalizedLink>
      </div>
      
    </div>
  </section>
);

// Seção Como Funciona
const HowItWorksSection = () => (
  <section className="py-20 bg-muted">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
        Jogue em Apenas 3 Passos
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
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">1. Monte seu Time</h3>
            <p className="text-muted-foreground text-center">
              Selecione os 10 criptoativos que você acredita que terão a melhor performance. Monte o seu 'Top 10' baseado nas suas análises e estratégias.
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
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">2. Entre em uma Liga</h3>
            <p className="text-muted-foreground text-center">
              Escolha entre ligas gratuitas ou pagas e participe contra outros jogadores por prêmios reais em cripto.
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
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">3. Ganhe Prêmios</h3>
            <p className="text-muted-foreground text-center">
              Acompanhe o desempenho do seu time e ganhe prêmios baseados na performance dos criptoativos escolhidos.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);

// Seção A Vantagem MFL
const ValuePropositionSection = () => (
  <section className="py-20 bg-primary">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-primary-foreground mb-12">
        A Vantagem MFL
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
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">Construído na Solana</h3>
            <p className="text-muted-foreground text-center">
              Toda a lógica do jogo e gerenciamento de ligas rodam on-chain. Graças à Solana, suas ações são processadas em tempo real e com taxas mínimas.
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
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">Fair Play Transparente</h3>
            <p className="text-muted-foreground text-center">
              Sem caixas-pretas. Nossos contratos inteligentes são abertos e garantem que o cálculo de pontos e a distribuição de prêmios sejam 100% auditáveis.
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
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">Prêmios em Cripto e NFTs</h3>
            <p className="text-muted-foreground text-center">
              Vá além dos pontos. Ganhe prêmios reais em cripto (SOL, USDC) ou NFTs colecionáveis. Imagine participar de uma liga patrocinada valendo um NFT da sua comunidade favorita!
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
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">Dados de Mercado em Tempo Real</h3>
            <p className="text-muted-foreground text-center">
              O desempenho do seu time é baseado em oráculos de preço confiáveis. O mercado muda, seus pontos mudam. Simples assim.
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
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">Ligas de Comunidade</h3>
            <p className="text-muted-foreground text-center">
              Participe de ligas exclusivas criadas em parceria com as maiores comunidades Web3. Jogue por prêmios temáticos (como NFTs da própria coleção) e mostre seu apoio!
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
            <h3 className="text-xl font-bold text-center text-card-foreground mb-2">Você no Controle</h3>
            <p className="text-muted-foreground text-center">
              Seus times, seus prêmios. No MFL, você é realmente dono dos seus ativos e conquistas dentro do jogo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);

// Seção de CTA Final
const FinalCTASection = () => (
  <section className="py-20 bg-muted">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
        Pronto para montar seu time dos sonhos?
      </h2>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
        Junte-se aos pioneiros do fantasy game on-chain e comece sua jornada na Market Fantasy League.
      </p>
      <LocalizedLink href="/ligas">
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
          Começar Agora
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </LocalizedLink>
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

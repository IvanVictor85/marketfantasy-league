'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import {
  Trophy,
  Users,
  Coins,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  LogIn
} from 'lucide-react';

// ============================================
// COMPONENTE DE LOADING - SKELETON SCREEN
// ============================================
function LoadingScreen() {
  const [dots, setDots] = useState('');

  // Animação dos pontinhos
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Fundo com degradê radial */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:from-[#0a0e14] dark:via-[#0d1117] dark:to-[#161b22]" />

      {/* Degradê radial central sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00FF94]/5 via-transparent to-transparent dark:from-[#00FF94]/10" />

      {/* Marca d'água minimalista rotacionada */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] dark:opacity-[0.03]">
        <div className="relative w-[600px] h-[600px] rotate-12">
          <Image
            src="/icons/cfl-minimal-logo.png"
            alt=""
            fill
            sizes="600px"
            style={{ objectFit: 'contain' }}
            className="hidden dark:block"
          />
          <Image
            src="/icons/cfl-minimal-logo-black.png"
            alt=""
            fill
            sizes="600px"
            style={{ objectFit: 'contain' }}
            className="dark:hidden"
          />
        </div>
      </div>

      {/* Conteúdo Central */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo com Pulse e Glow */}
        <div className="relative mb-8">
          {/* Glow Neon no Dark Mode */}
          <div className="absolute inset-0 blur-3xl opacity-0 dark:opacity-60 animate-pulse">
            <div className="w-32 h-32 rounded-full bg-[#00FF94]" />
          </div>

          {/* Container do Logo */}
          <div className="relative w-28 h-28 animate-pulse">
            {/* Dark Mode - Logo Branco */}
            <Image
              src="/icons/cfl-minimal-logo.png"
              alt="MFL"
              fill
              sizes="112px"
              style={{ objectFit: 'contain' }}
              className="hidden dark:block drop-shadow-[0_0_30px_rgba(0,255,148,0.4)]"
              priority
            />
            {/* Light Mode - Logo Preto */}
            <Image
              src="/icons/cfl-minimal-logo-black.png"
              alt="MFL"
              fill
              sizes="112px"
              style={{ objectFit: 'contain' }}
              className="dark:hidden"
              priority
            />
          </div>
        </div>

        {/* Texto de Status */}
        <div className="text-center">
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
            Validando convite para a Arena<span className="inline-block w-8 text-left">{dots}</span>
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Preparando sua entrada no <span className="text-[#00FF94] font-semibold">MFL</span>
          </p>
        </div>

        {/* Indicador de progresso sutil */}
        <div className="mt-8 w-48 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#9945FF] via-[#00FF94] to-[#9945FF] animate-shimmer" />
        </div>
      </div>

      {/* Estilos de animação */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
          width: 200%;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// ============================================
// CARD DE BENEFÍCIO
// ============================================
interface BenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  delay: number;
}

function BenefitCard({ icon, title, description, color, delay }: BenefitCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`
        transform transition-all duration-700 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 dark:bg-white/5 dark:backdrop-blur-sm border border-gray-100 dark:border-white/10 hover:border-[#00FF94]/30 dark:hover:border-[#00FF94]/30 transition-all group">
        {/* Ícone com Glow */}
        <div className="relative shrink-0">
          <div className={`absolute inset-0 ${color} rounded-xl blur-lg opacity-0 dark:opacity-30 group-hover:opacity-50 transition-opacity`} />
          <div className={`relative p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
            <div className="text-white">{icon}</div>
          </div>
        </div>

        {/* Texto */}
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================
export default function ReferralPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (code) {
      // Salvar código de referral no localStorage e cookie
      localStorage.setItem('referral_code', code.toUpperCase());
      document.cookie = `referral_code=${code.toUpperCase()}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 dias

      // Validar código e buscar nome do referenciador
      const validateCode = async () => {
        try {
          const res = await fetch(`/api/referral/validate?code=${code}`);
          const data = await res.json();

          if (data.valid) {
            setIsValid(true);
            setReferrerName(data.referrerName || null);
          }
        } catch (error) {
          console.error('Erro ao validar código:', error);
        } finally {
          // Delay mínimo para mostrar o loading
          setTimeout(() => {
            setIsVerifying(false);
            // Delay para fade-in do conteúdo
            setTimeout(() => setShowContent(true), 100);
          }, 1500);
        }
      };

      validateCode();
    }
  }, [code]);

  // Navegar com prefixo de locale (padrão: pt)
  // Usa window.location para evitar hydration error entre layouts diferentes
  const handleGetStarted = () => {
    window.location.href = '/pt/login';
  };

  const handleGoToDashboard = () => {
    window.location.href = '/pt/dashboard';
  };

  // Mostra loading enquanto verifica
  if (isVerifying) {
    return <LoadingScreen />;
  }

  // Benefícios
  const benefits = [
    {
      icon: <Trophy className="h-6 w-6" />,
      title: 'Compita por prêmios em SOL',
      description: 'Monte seu time de criptos e ganhe de verdade',
      color: 'from-[#FFD700] to-[#FFA500]',
    },
    {
      icon: <Coins className="h-6 w-6" />,
      title: 'Ganhe pontos para o Airdrop',
      description: 'Acumule pontos indicando amigos',
      color: 'from-[#00FF94] to-[#14F195]',
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Entre na maior comunidade Web3',
      description: 'Fantasy Sports com tokens reais na Solana',
      color: 'from-[#9945FF] to-[#7B3FE4]',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fundo com degradê */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:from-[#0a0e14] dark:via-[#0d1117] dark:to-[#161b22]" />

      {/* Marca d'água - Logo Minimalista Grande */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[800px] h-[800px] opacity-[0.03] dark:opacity-[0.04]">
          <Image
            src="/icons/cfl-minimal-logo.png"
            alt=""
            fill
            sizes="800px"
            style={{ objectFit: 'contain' }}
            className="hidden dark:block"
          />
          <Image
            src="/icons/cfl-minimal-logo-black.png"
            alt=""
            fill
            sizes="800px"
            style={{ objectFit: 'contain' }}
            className="dark:hidden"
          />
        </div>
      </div>

      {/* Padrão de pontos sutil */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Conteúdo Principal */}
      <div
        className={`
          relative z-10 w-full max-w-lg
          transform transition-all duration-700 ease-out
          ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
      >
        {/* Card Principal */}
        <Card className="border-0 shadow-2xl dark:shadow-none overflow-hidden bg-white/90 dark:bg-[#161b22]/90 dark:backdrop-blur-xl dark:border dark:border-white/10">

          {/* Header com Logo */}
          <div className="relative pt-8 sm:pt-10 pb-4 sm:pb-6 px-4 sm:px-6 text-center">
            {/* Glow atrás do logo no Dark Mode */}
            <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 w-32 sm:w-40 h-32 sm:h-40 bg-[#00FF94] rounded-full blur-[60px] sm:blur-[80px] opacity-0 dark:opacity-30" />

            {/* Logo Principal */}
            <div
              className={`
                relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6
                transform transition-all duration-700 delay-200
                ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
              `}
            >
              <Image
                src="/icons/LOGO_MFL.png"
                alt="MFL - Crypto Fantasy League"
                fill
                sizes="(max-width: 640px) 96px, 128px"
                style={{ objectFit: 'contain' }}
                className="drop-shadow-2xl dark:drop-shadow-[0_0_30px_rgba(0,255,148,0.3)]"
                priority
              />
            </div>

            {/* Título */}
            <div
              className={`
                transform transition-all duration-700 delay-300
                ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
            >
              <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#00FF94]" />
                <span className="text-xs sm:text-sm font-semibold text-[#00FF94] uppercase tracking-wider">
                  Convite Especial
                </span>
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#00FF94]" />
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 sm:mb-3">
                Você foi convidado!
              </h1>

              {referrerName ? (
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  <span className="text-[#00FF94] font-semibold">{referrerName}</span> te convidou para a Arena
                </p>
              ) : (
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  Entre no Crypto Fantasy League e ganhe SOL de verdade
                </p>
              )}
            </div>
          </div>

          {/* Benefícios */}
          <CardContent className="px-6 pb-6 space-y-3">
            {benefits.map((benefit, index) => (
              <BenefitCard
                key={index}
                {...benefit}
                delay={400 + index * 150}
              />
            ))}
          </CardContent>

          {/* CTAs */}
          <div className="px-6 pb-8 space-y-4">
            {/* Botão Principal - Gradiente Vibrante com Glow Pulsante */}
            <div className="relative group">
              {/* Glow Effect - Pulsa suavemente */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#9945FF] via-[#00FF94] to-[#9945FF] rounded-xl blur-lg opacity-40 group-hover:opacity-70 transition-all duration-500 animate-pulse-slow" />

              {/* Botão */}
              <button
                onClick={handleGetStarted}
                className="relative w-full h-14 px-8 rounded-xl text-lg font-bold text-white
                  bg-gradient-to-r from-[#9945FF] via-[#7B3FE4] to-[#00FF94]
                  bg-[length:200%_100%] bg-left hover:bg-right
                  transition-all duration-500 ease-out
                  shadow-lg shadow-[#9945FF]/30
                  hover:shadow-xl hover:shadow-[#00FF94]/40
                  hover:scale-[1.02] active:scale-[0.98]
                  flex items-center justify-center gap-2"
              >
                <Zap className="h-5 w-5" />
                <span>Começar Agora</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Botão Secundário - Ghost Style Discreto */}
            <button
              onClick={handleGoToDashboard}
              className="w-full h-11 px-6 rounded-xl text-sm font-medium
                bg-transparent
                border border-gray-200/50 dark:border-white/10
                text-gray-500 dark:text-gray-400
                hover:border-[#00FF94]/40 hover:text-[#00FF94]
                hover:bg-[#00FF94]/5
                transition-all duration-300
                flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span>Já tenho conta</span>
            </button>
          </div>

          {/* Footer com código */}
          <div className="px-6 pb-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="text-gray-400">Código de convite:</span>
              <span className="font-mono font-bold text-[#00FF94] bg-[#00FF94]/10 px-3 py-1 rounded-full">
                {code?.toUpperCase()}
              </span>
            </div>
          </div>
        </Card>

        {/* Badge de Segurança */}
        <div
          className={`
            flex items-center justify-center gap-2 mt-6 text-sm text-gray-400
            transform transition-all duration-700 delay-700
            ${showContent ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <Shield className="h-4 w-4" />
          <span>Powered by Solana</span>
          <span className="text-[#00FF94]">•</span>
          <span>100% On-Chain</span>
        </div>
      </div>
    </div>
  );
}

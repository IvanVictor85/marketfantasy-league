'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Sparkles, PartyPopper } from 'lucide-react';

interface Winner {
  position: number;
  teamName: string;
  userWallet: string;
  totalScore: number;
  prize: number; // Prize in SOL
}

interface WinnersProps {
  winners: Winner[];
}

export default function Winners({ winners }: WinnersProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Trigger confetti animation when component mounts
    if (winners.length > 0) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [winners]);

  const getWinnerConfig = (position: number) => {
    switch (position) {
      case 1:
        return {
          icon: Trophy,
          medal: '🥇',
          color: 'from-yellow-500 to-yellow-600',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-500',
          ringColor: 'ring-yellow-500/50',
          glowColor: 'shadow-yellow-500/50',
          title: 'Campeão',
          scale: 'scale-110',
        };
      case 2:
        return {
          icon: Medal,
          medal: '🥈',
          color: 'from-gray-300 to-gray-400',
          bgColor: 'bg-gray-400/20',
          borderColor: 'border-gray-400',
          textColor: 'text-gray-400',
          ringColor: 'ring-gray-400/50',
          glowColor: 'shadow-gray-400/50',
          title: 'Vice-Campeão',
          scale: 'scale-105',
        };
      case 3:
        return {
          icon: Award,
          medal: '🥉',
          color: 'from-orange-500 to-orange-600',
          bgColor: 'bg-orange-500/20',
          borderColor: 'border-orange-500',
          textColor: 'text-orange-500',
          ringColor: 'ring-orange-500/50',
          glowColor: 'shadow-orange-500/50',
          title: 'Terceiro Lugar',
          scale: 'scale-100',
        };
      default:
        return {
          icon: Award,
          medal: '🏆',
          color: 'from-blue-500 to-blue-600',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500',
          textColor: 'text-blue-500',
          ringColor: 'ring-blue-500/50',
          glowColor: 'shadow-blue-500/50',
          title: `${position}º Lugar`,
          scale: 'scale-100',
        };
    }
  };

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              {['🎉', '✨', '🎊', '⭐', '💫'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <Card className="overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-800 border-purple-500/30">
        {/* Header */}
        <div className="p-6 border-b border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <div className="flex items-center justify-center gap-3">
            <PartyPopper className="w-8 h-8 text-purple-500 animate-bounce" />
            <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              🎉 Vencedores da Competição 🎉
            </h3>
            <Sparkles className="w-8 h-8 text-pink-500 animate-pulse" />
          </div>
          <p className="text-center text-gray-400 mt-2">Parabéns aos campeões!</p>
        </div>

        {/* Winners Podium */}
        <div className="p-8">
          {winners.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Aguardando finalização da competição...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top 3 Display - Podium Style */}
              {winners.length >= 3 && (
                <div className="flex items-end justify-center gap-4 mb-8">
                  {/* 2nd Place */}
                  {winners[1] && (
                    <WinnerCard winner={winners[1]} rank={2} isPodium />
                  )}
                  {/* 1st Place */}
                  {winners[0] && (
                    <WinnerCard winner={winners[0]} rank={1} isPodium />
                  )}
                  {/* 3rd Place */}
                  {winners[2] && (
                    <WinnerCard winner={winners[2]} rank={3} isPodium />
                  )}
                </div>
              )}

              {/* List View for all winners */}
              <div className="space-y-4">
                {winners.map((winner) => {
                  const config = getWinnerConfig(winner.position);
                  const WinnerIcon = config.icon;

                  return (
                    <div
                      key={winner.position}
                      className={`relative p-6 rounded-xl ${config.bgColor} border-2 ${config.borderColor} transition-all duration-500 hover:shadow-2xl hover:${config.glowColor} ${
                        winner.position <= 3 ? `ring-4 ${config.ringColor}` : ''
                      }`}
                    >
                      {/* Sparkle effects for top 3 */}
                      {winner.position <= 3 && (
                        <>
                          <Sparkles className={`absolute top-2 right-2 w-5 h-5 ${config.textColor} animate-pulse`} />
                          <Sparkles className={`absolute bottom-2 left-2 w-4 h-4 ${config.textColor} animate-pulse delay-75`} />
                        </>
                      )}

                      <div className="flex items-center justify-between">
                        {/* Left Side - Position & Team */}
                        <div className="flex items-center gap-4">
                          {/* Medal/Position */}
                          <div className={`flex flex-col items-center gap-2 ${winner.position === 1 ? 'animate-bounce' : ''}`}>
                            <div className="text-6xl">{config.medal}</div>
                            <Badge className={`bg-gradient-to-r ${config.color} text-white border-0 px-3 py-1 font-bold`}>
                              {config.title}
                            </Badge>
                          </div>

                          {/* Team Info */}
                          <div>
                            <h4 className="text-2xl font-bold text-white mb-1">{winner.teamName}</h4>
                            <code className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded">
                              {formatWallet(winner.userWallet)}
                            </code>
                          </div>
                        </div>

                        {/* Right Side - Score & Prize */}
                        <div className="text-right space-y-2">
                          {/* Score */}
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Pontuação Final</p>
                            <div className="flex items-center justify-end gap-2">
                              <WinnerIcon className={`w-6 h-6 ${config.textColor}`} />
                              <span className={`text-3xl font-bold ${config.textColor}`}>
                                {winner.totalScore.toFixed(2)}
                              </span>
                              <span className="text-gray-400">pts</span>
                            </div>
                          </div>

                          {/* Prize */}
                          <div className={`p-4 rounded-lg bg-gradient-to-r ${config.color} bg-opacity-20`}>
                            <p className="text-xs text-gray-300 mb-1">Prêmio</p>
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-2xl">◎</span>
                              <span className="text-3xl font-bold text-white">
                                {winner.prize.toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-300">SOL</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Total Prize Pool */}
        {winners.length > 0 && (
          <div className="p-6 border-t border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">Prize Pool Total Distribuído</p>
              <div className="flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <span className="text-3xl">◎</span>
                <span className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {winners.reduce((acc, w) => acc + w.prize, 0).toFixed(2)}
                </span>
                <span className="text-xl text-gray-300">SOL</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Confetti Animation Keyframes (add to global CSS) */}
      <style jsx global>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear infinite;
          font-size: 1.5rem;
        }
      `}</style>
    </div>
  );
}

// Podium Card Component (for top 3)
function WinnerCard({ winner, rank, isPodium = false }: { winner: Winner; rank: number; isPodium?: boolean }) {
  const config = getWinnerConfig(rank);
  const heights = { 1: 'h-64', 2: 'h-52', 3: 'h-48' };
  const WinnerIcon = config.icon;

  return (
    <div
      className={`${isPodium ? heights[rank as keyof typeof heights] : ''} ${config.scale} transition-all duration-500 hover:scale-110`}
    >
      <div className={`p-6 rounded-xl ${config.bgColor} border-2 ${config.borderColor} ring-4 ${config.ringColor} shadow-2xl ${config.glowColor} h-full flex flex-col justify-between`}>
        <div className="text-center">
          <div className={`text-6xl mb-3 ${rank === 1 ? 'animate-bounce' : ''}`}>{config.medal}</div>
          <WinnerIcon className={`w-10 h-10 ${config.textColor} mx-auto mb-2`} />
          <h4 className="font-bold text-white text-lg mb-1 truncate max-w-[150px]">{winner.teamName}</h4>
          <p className={`text-2xl font-bold ${config.textColor}`}>{winner.totalScore.toFixed(2)} pts</p>
        </div>
        <div className={`mt-4 p-3 rounded-lg bg-gradient-to-r ${config.color} bg-opacity-20 text-center`}>
          <p className="text-xs text-gray-300 mb-1">Prêmio</p>
          <p className="text-xl font-bold text-white">◎ {winner.prize.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

function getWinnerConfig(position: number) {
  switch (position) {
    case 1:
      return {
        icon: Trophy,
        medal: '🥇',
        color: 'from-yellow-500 to-yellow-600',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-500',
        ringColor: 'ring-yellow-500/50',
        glowColor: 'shadow-yellow-500/50',
        title: 'Campeão',
        scale: 'scale-110',
      };
    case 2:
      return {
        icon: Medal,
        medal: '🥈',
        color: 'from-gray-300 to-gray-400',
        bgColor: 'bg-gray-400/20',
        borderColor: 'border-gray-400',
        textColor: 'text-gray-400',
        ringColor: 'ring-gray-400/50',
        glowColor: 'shadow-gray-400/50',
        title: 'Vice-Campeão',
        scale: 'scale-105',
      };
    case 3:
      return {
        icon: Award,
        medal: '🥉',
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500',
        textColor: 'text-orange-500',
        ringColor: 'ring-orange-500/50',
        glowColor: 'shadow-orange-500/50',
        title: 'Terceiro Lugar',
        scale: 'scale-100',
      };
    default:
      return {
        icon: Award,
        medal: '🏆',
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-500',
        ringColor: 'ring-blue-500/50',
        glowColor: 'shadow-blue-500/50',
        title: `${position}º Lugar`,
        scale: 'scale-100',
      };
  }
}

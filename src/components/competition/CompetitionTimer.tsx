'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Trophy, Hourglass } from 'lucide-react';

interface CompetitionTimerProps {
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'active' | 'completed';
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CompetitionTimer({ startTime, endTime, status }: CompetitionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      // Determinar qual é o tempo alvo baseado na data atual
      let targetTime;
      if (now < start) {
        // Antes de começar - countdown para startTime
        targetTime = start;
      } else if (now < end) {
        // Em andamento - countdown para endTime
        targetTime = end;
      } else {
        // Finalizada - sem countdown
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const difference = targetTime - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    setTimeRemaining(calculateTimeRemaining());

    return () => clearInterval(timer);
  }, [startTime, endTime, mounted]);

  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          label: 'Aguardando Início',
          icon: Hourglass,
          color: 'bg-yellow-500',
          badgeVariant: 'default' as const,
          gradient: 'from-yellow-500/20 to-orange-500/20',
        };
      case 'active':
        return {
          label: 'Em Andamento',
          icon: Clock,
          color: 'bg-green-500',
          badgeVariant: 'default' as const,
          gradient: 'from-green-500/20 to-emerald-500/20',
        };
      case 'completed':
        return {
          label: 'Finalizada',
          icon: Trophy,
          color: 'bg-purple-500',
          badgeVariant: 'secondary' as const,
          gradient: 'from-purple-500/20 to-pink-500/20',
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-xl blur-xl opacity-50`} />
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-4 min-w-[80px]">
          <div className="text-4xl font-bold bg-gradient-to-br from-white to-gray-300 bg-clip-text text-transparent tabular-nums">
            {String(value).padStart(2, '0')}
          </div>
        </div>
      </div>
      <span className="text-xs text-gray-400 mt-2 uppercase tracking-wider">{label}</span>
    </div>
  );

  if (!mounted) {
    return (
      <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Carregando...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      {/* Header com status */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${config.color} bg-opacity-20 border border-current border-opacity-30`}>
              <StatusIcon className={`w-6 h-6 ${config.color.replace('bg-', 'text-')}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Status da Competição</h3>
              <p className="text-sm text-gray-400">
                {status === 'pending' ? 'Iniciando em' : status === 'active' ? 'Tempo restante' : 'Competição encerrada'}
              </p>
            </div>
          </div>
          <Badge variant={config.badgeVariant} className={`${config.color} text-white border-0 px-4 py-2 text-sm`}>
            {config.label}
          </Badge>
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="p-8">
        {status === 'completed' ? (
          <div className="text-center py-8">
            <Trophy className="w-16 h-16 text-purple-500 mx-auto mb-4 animate-bounce" />
            <p className="text-2xl font-bold text-white mb-2">Competição Finalizada!</p>
            <p className="text-gray-400">Confira os vencedores abaixo</p>
          </div>
        ) : (
          <div className="flex justify-center gap-4 flex-wrap">
            {timeRemaining.days > 0 && <TimeUnit value={timeRemaining.days} label="Dias" />}
            <TimeUnit value={timeRemaining.hours} label="Horas" />
            <TimeUnit value={timeRemaining.minutes} label="Minutos" />
            <TimeUnit value={timeRemaining.seconds} label="Segundos" />
          </div>
        )}
      </div>

      {/* Progress bar animado */}
      {status === 'active' && (
        <div className="px-6 pb-6">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 animate-pulse"
              style={{
                width: `${
                  ((new Date().getTime() - new Date(startTime).getTime()) /
                    (new Date(endTime).getTime() - new Date(startTime).getTime())) *
                  100
                }%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{new Date(startTime).toLocaleDateString('pt-BR')}</span>
            <span>{new Date(endTime).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      )}
    </Card>
  );
}

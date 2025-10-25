'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endTime: Date;
  className?: string;
}

export function CountdownTimer({ endTime, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true
        };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return {
        days,
        hours,
        minutes,
        seconds,
        isExpired: false
      };
    };

    // Calcular imediatamente
    setTimeLeft(calculateTimeLeft());

    // Atualizar a cada segundo
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (timeLeft.isExpired) {
    return (
      <div className={`flex items-center gap-2 text-red-600 font-semibold ${className}`}>
        <Clock className="h-4 w-4" />
        <span>Rodada Encerrada</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-blue-600 font-semibold ${className}`}>
      <Clock className="h-4 w-4" />
      <span>Tempo restante:</span>
      <div className="flex items-center gap-1 font-mono text-sm">
        <span className="bg-blue-100 px-2 py-1 rounded">
          {timeLeft.days.toString().padStart(2, '0')}
        </span>
        <span>:</span>
        <span className="bg-blue-100 px-2 py-1 rounded">
          {timeLeft.hours.toString().padStart(2, '0')}
        </span>
        <span>:</span>
        <span className="bg-blue-100 px-2 py-1 rounded">
          {timeLeft.minutes.toString().padStart(2, '0')}
        </span>
        <span>:</span>
        <span className="bg-blue-100 px-2 py-1 rounded">
          {timeLeft.seconds.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

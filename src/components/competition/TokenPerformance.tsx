'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTokenPrice } from '@/lib/utils';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface TokenData {
  symbol: string;
  name: string;
  logoUrl?: string;
  position: string; // "ATTACK", "DEFENSE", "SUPPORT", "WILDCARD"
  startPrice: number;
  currentPrice: number;
}

interface TokenPerformanceProps {
  tokens: TokenData[];
}

export default function TokenPerformance({ tokens }: TokenPerformanceProps) {
  const calculatePerformance = (startPrice: number, currentPrice: number) => {
    const change = ((currentPrice - startPrice) / startPrice) * 100;
    return {
      percentage: change,
      isPositive: change >= 0,
      color: change >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: change >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      borderColor: change >= 0 ? 'border-green-500/30' : 'border-red-500/30',
    };
  };

  const getPositionConfig = (position: string) => {
    switch (position) {
      case 'ATTACK':
        return { color: 'bg-red-500', label: 'ATQ', icon: '⚔️' };
      case 'DEFENSE':
        return { color: 'bg-blue-500', label: 'DEF', icon: '🛡️' };
      case 'SUPPORT':
        return { color: 'bg-purple-500', label: 'SUP', icon: '✨' };
      case 'WILDCARD':
        return { color: 'bg-yellow-500', label: 'WLD', icon: '🃏' };
      default:
        return { color: 'bg-gray-500', label: 'N/A', icon: '❓' };
    }
  };

  const totalPerformance = tokens.reduce((acc, token) => {
    const perf = calculatePerformance(token.startPrice, token.currentPrice);
    return acc + perf.percentage;
  }, 0) / tokens.length;

  const totalPerfConfig = calculatePerformance(
    tokens.reduce((acc, t) => acc + t.startPrice, 0) / tokens.length,
    tokens.reduce((acc, t) => acc + t.currentPrice, 0) / tokens.length
  );

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500 bg-opacity-20 border border-purple-500 border-opacity-30">
              <Activity className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Performance dos Tokens</h3>
              <p className="text-sm text-gray-400">Variação desde o início</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl ${totalPerfConfig.bgColor} border ${totalPerfConfig.borderColor}`}>
            <div className="flex items-center gap-2">
              {totalPerfConfig.isPositive ? (
                <TrendingUp className={`w-5 h-5 ${totalPerfConfig.color}`} />
              ) : (
                <TrendingDown className={`w-5 h-5 ${totalPerfConfig.color}`} />
              )}
              <span className={`text-lg font-bold ${totalPerfConfig.color}`}>
                {totalPerfConfig.isPositive ? '+' : ''}
                {totalPerformance.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-gray-400 text-center mt-1">Média geral</p>
          </div>
        </div>
      </div>

      {/* Tokens List */}
      <div className="p-6 space-y-4">
        {tokens.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum token selecionado</p>
          </div>
        ) : (
          tokens.map((token, index) => {
            const performance = calculatePerformance(token.startPrice, token.currentPrice);
            const positionConfig = getPositionConfig(token.position);
            const barWidth = Math.min(Math.abs(performance.percentage) * 2, 100);

            return (
              <div
                key={`${token.symbol}-${token.position}-${index}`}
                className="group p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
              >
                {/* Token Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Token Logo */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-700 border-2 border-gray-600">
                      {token.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={token.logoUrl}
                          alt={token.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '';
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.className = 'w-full h-full flex items-center justify-center text-2xl text-white';
                              fallback.textContent = token.symbol[0];
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl text-white">
                          {token.symbol[0]}
                        </div>
                      )}
                    </div>

                    {/* Token Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-white">{token.symbol}</h4>
                        <Badge className={`${positionConfig.color} text-white border-0 text-xs px-2`}>
                          {positionConfig.icon} {positionConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">{token.name}</p>
                    </div>
                  </div>

                  {/* Performance Percentage */}
                  <div className={`px-4 py-2 rounded-lg ${performance.bgColor} border ${performance.borderColor}`}>
                    <div className="flex items-center gap-1">
                      {performance.isPositive ? (
                        <TrendingUp className={`w-4 h-4 ${performance.color}`} />
                      ) : (
                        <TrendingDown className={`w-4 h-4 ${performance.color}`} />
                      )}
                      <span className={`text-xl font-bold ${performance.color}`}>
                        {performance.isPositive ? '+' : ''}
                        {performance.percentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price Info */}
                <div className="flex items-center justify-between mb-3 text-sm">
                  <div>
                    <span className="text-gray-400">Início: </span>
                    <span className="text-white font-semibold">{formatTokenPrice(token.startPrice)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Atual: </span>
                    <span className="text-white font-semibold">{formatTokenPrice(token.currentPrice)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Δ: </span>
                    <span className={`font-semibold ${performance.color}`}>
                      {formatTokenPrice(Math.abs(token.currentPrice - token.startPrice))}
                    </span>
                  </div>
                </div>

                {/* Visual Bar Chart */}
                <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 h-full rounded-full transition-all duration-1000 ${
                      performance.isPositive ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-rose-500'
                    }`}
                    style={{
                      width: `${barWidth}%`,
                      left: performance.isPositive ? '50%' : `${50 - barWidth}%`,
                    }}
                  />
                  <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/30" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Summary */}
      <div className="p-6 border-t border-gray-700 bg-gray-800/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-400 mb-1">Tokens em alta</p>
            <p className="text-2xl font-bold text-green-500">
              {tokens.filter((t) => calculatePerformance(t.startPrice, t.currentPrice).isPositive).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Total de tokens</p>
            <p className="text-2xl font-bold text-white">{tokens.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Tokens em baixa</p>
            <p className="text-2xl font-bold text-red-500">
              {tokens.filter((t) => !calculatePerformance(t.startPrice, t.currentPrice).isPositive).length}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

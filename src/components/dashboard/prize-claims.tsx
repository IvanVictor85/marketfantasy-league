'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Gift, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PrizeClaim {
  id: string;
  userId: string;
  competitionId: string;
  competitionName: string;
  seasonId: string | null;
  amount: number;
  position: number;
  claimed: boolean;
  claimedAt: Date | null;
  createdAt: Date;
}

interface PrizeClaimsProps {
  userId: string;
  leagueId?: string;
  refreshTrigger?: string | null; // Trigger para forçar atualização quando muda de rodada
}

export function PrizeClaims({ userId, leagueId, refreshTrigger }: PrizeClaimsProps) {
  const [prizes, setPrizes] = useState<PrizeClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    fetchPrizes();
  }, [userId, leagueId, refreshTrigger]); // ✅ Adicionar refreshTrigger como dependência

  const fetchPrizes = async () => {
    try {
      setLoading(true);
      const url = leagueId
        ? `/api/user/prizes?userId=${userId}&leagueId=${leagueId}`
        : `/api/user/prizes?userId=${userId}`;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setPrizes(data.prizes || []);
      }
    } catch (error) {
      console.error('Erro ao buscar prêmios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (prizeId: string) => {
    try {
      setClaiming(prizeId);

      const response = await fetch('/api/user/claim-prize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizeId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao resgatar prêmio');
      }

      toast.success(`Prêmio de ${data.amount} SOL resgatado com sucesso!`);
      await fetchPrizes(); // Atualizar lista
    } catch (error: any) {
      console.error('Erro ao resgatar prêmio:', error);
      toast.error(error.message || 'Erro ao resgatar prêmio');
    } finally {
      setClaiming(null);
    }
  };

  const getPositionBadge = (position: number) => {
    switch (position) {
      case 1:
        return { emoji: '🥇', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
      case 2:
        return { emoji: '🥈', color: 'bg-gray-100 text-gray-800 border-gray-300' };
      case 3:
        return { emoji: '🥉', color: 'bg-orange-100 text-orange-800 border-orange-300' };
      default:
        return { emoji: '🏅', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Carregando prêmios...</p>
        </CardContent>
      </Card>
    );
  }

  if (prizes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Meus Prêmios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">
              Você ainda não ganhou nenhum prêmio
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Continue jogando para conquistar o pódio!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unclaimedPrizes = prizes.filter(p => !p.claimed);
  const claimedPrizes = prizes.filter(p => p.claimed);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Meus Prêmios
          </CardTitle>
          {unclaimedPrizes.length > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {unclaimedPrizes.length} pendente{unclaimedPrizes.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Prêmios não resgatados */}
        {unclaimedPrizes.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Aguardando Resgate
            </h4>
            {unclaimedPrizes.map((prize) => {
              const badge = getPositionBadge(prize.position);
              return (
                <div
                  key={prize.id}
                  className="p-4 border-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`${badge.color} border-2`}>
                          {badge.emoji} {prize.position}º Lugar
                        </Badge>
                      </div>
                      <h4 className="font-semibold">{prize.competitionName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(prize.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-600">
                        {prize.amount.toFixed(4)} SOL
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleClaim(prize.id)}
                    disabled={claiming === prize.id}
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                    size="sm"
                  >
                    {claiming === prize.id ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Resgatando...
                      </>
                    ) : (
                      <>
                        <Gift className="h-4 w-4 mr-2" />
                        Resgatar Prêmio
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Prêmios resgatados */}
        {claimedPrizes.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mt-4">
              <CheckCircle2 className="h-4 w-4" />
              Já Resgatados
            </h4>
            {claimedPrizes.map((prize) => {
              const badge = getPositionBadge(prize.position);
              return (
                <div
                  key={prize.id}
                  className="p-4 border bg-gray-50 dark:bg-gray-900/30 rounded-lg opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={badge.color}>
                          {badge.emoji} {prize.position}º Lugar
                        </Badge>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Resgatado
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm">{prize.competitionName}</h4>
                      <p className="text-xs text-muted-foreground">
                        Resgatado em {new Date(prize.claimedAt!).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        +{prize.amount.toFixed(4)} SOL
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resumo total */}
        <div className="pt-4 border-t mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Total Acumulado:</span>
            <span className="text-xl font-bold text-green-600">
              {prizes.reduce((sum, p) => sum + p.amount, 0).toFixed(4)} SOL
            </span>
          </div>
          {unclaimedPrizes.length > 0 && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">Pendente de Resgate:</span>
              <span className="text-lg font-bold text-yellow-600">
                {unclaimedPrizes.reduce((sum, p) => sum + p.amount, 0).toFixed(4)} SOL
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

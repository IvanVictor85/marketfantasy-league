'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trophy, Gift, CheckCircle2, Clock, Crown, ExternalLink, Copy, Share2, ImageIcon, Twitter } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';

interface PrizeClaim {
  id: string;
  userId: string;
  competitionId: string | null;
  competitionName: string;
  seasonId: string | null;
  seasonName?: string;
  prizeType?: 'ROUND_PRIZE' | 'SEASON_PRIZE';
  amount: number;
  position: number;
  claimed: boolean;
  claimedAt: Date | null;
  createdAt: Date;
}

interface PrizeClaimsProps {
  userId: string;
  leagueId?: string;
  refreshTrigger?: string | null;
}

interface ClaimSuccessData {
  amount: number;
  txHash: string;
  prizeName: string;
}

export function PrizeClaims({ userId, leagueId, refreshTrigger }: PrizeClaimsProps) {
  const [prizes, setPrizes] = useState<PrizeClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<ClaimSuccessData | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [showTestButton, setShowTestButton] = useState(false);
  const victoryCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPrizes();
  }, [userId, leagueId, refreshTrigger]);

  // Verificar se deve mostrar botão de teste (dev ou ?testModal=true na URL)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isTestMode = urlParams.get('testModal') === 'true';
      const isDev = process.env.NODE_ENV === 'development';
      setShowTestButton(isDev || isTestMode);
    }
  }, []);

  // Dispara confete quando o modal abre
  useEffect(() => {
    if (successModal) {
      // Confete dourado e verde (cores da marca)
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#FFD700', '#14F195', '#9945FF', '#FFFFFF'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }, [successModal]);

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

      setSuccessModal({
        amount: data.amount,
        txHash: data.prize?.txHash || data.txHash || '',
        prizeName: data.prize?.name || 'Prêmio'
      });

      await fetchPrizes();
    } catch (error: any) {
      console.error('Erro ao resgatar prêmio:', error);
      toast.error(error.message || 'Erro ao resgatar prêmio');
    } finally {
      setClaiming(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Hash copiado!');
  };

  const truncateHash = (hash: string) => {
    if (!hash || hash.length < 16) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const getExplorerUrl = (txHash: string) => {
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    return `https://explorer.solana.com/tx/${txHash}?cluster=${network}`;
  };

  const shareOnTwitter = () => {
    if (!successModal) return;

    const text = `Acabei de ganhar ${successModal.amount.toFixed(4)} SOL no ${successModal.prizeName} do @MFLProtocol! 🏆⚽\n\n#MFL #Solana #Web3Gaming #RWA #CryptoFantasy`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const generateVictoryImage = async () => {
    if (!victoryCardRef.current || !successModal) return;

    setGeneratingImage(true);
    try {
      const canvas = await html2canvas(victoryCardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
      });

      // Converter para blob e copiar para clipboard
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            toast.success('Imagem copiada! Cole no seu post.');
          } catch (err) {
            // Fallback: download da imagem
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `mfl-victory-${successModal.amount.toFixed(4)}SOL.png`;
            link.href = url;
            link.click();
            toast.success('Imagem baixada!');
          }
        }
      }, 'image/png');
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast.error('Erro ao gerar imagem');
    } finally {
      setGeneratingImage(false);
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

  // Função de teste do modal
  const testSuccessModal = () => {
    setSuccessModal({
      amount: 0.0625,
      txHash: '3aodeqqnQQy4xKp7mNz8wVhJ2nY9fBcDrEgHiJkLmNoPqRsTuVwXyZ1234567890abcdef',
      prizeName: 'Rodada 5 - Liga Cripto'
    });
  };

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
              const isSeasonPrize = prize.seasonId && !prize.competitionId;

              return (
                <div
                  key={prize.id}
                  className={`p-4 border-2 rounded-lg ${
                    isSeasonPrize
                      ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-yellow-50 dark:from-purple-950/30 dark:to-yellow-950/20'
                      : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {isSeasonPrize && (
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                            <Crown className="h-3 w-3 mr-1" />
                            Temporada
                          </Badge>
                        )}
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
                      <p className={`text-2xl font-bold ${isSeasonPrize ? 'text-purple-600' : 'text-yellow-600'}`}>
                        {prize.amount.toFixed(4)} SOL
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleClaim(prize.id)}
                    disabled={claiming === prize.id}
                    className={`w-full ${isSeasonPrize ? 'bg-purple-600 hover:bg-purple-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                    size="sm"
                  >
                    {claiming === prize.id ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Resgatando...
                      </>
                    ) : (
                      <>
                        {isSeasonPrize ? <Crown className="h-4 w-4 mr-2" /> : <Gift className="h-4 w-4 mr-2" />}
                        Resgatar Prêmio {isSeasonPrize ? 'da Temporada' : ''}
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
              const isSeasonPrize = prize.seasonId && !prize.competitionId;

              return (
                <div
                  key={prize.id}
                  className="p-4 border bg-gray-50 dark:bg-gray-900/30 rounded-lg opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {isSeasonPrize && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                            <Crown className="h-3 w-3 mr-1" />
                            Temporada
                          </Badge>
                        )}
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

        {/* Botão de Teste - Dev ou ?testModal=true */}
        {showTestButton && (
          <div className="pt-4 border-t mt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs border-dashed border-orange-300 text-orange-600 hover:bg-orange-50"
              onClick={testSuccessModal}
            >
              [TEST] Testar Modal de Sucesso
            </Button>
          </div>
        )}
      </CardContent>

      {/* Modal de Sucesso - Estilo Gaming/Fantasy Sports */}
      <Dialog open={!!successModal} onOpenChange={() => setSuccessModal(null)}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-gradient-to-b from-[#0d1117] to-[#161b22] border-2 border-[#14F195]/30">
          <DialogHeader className="sr-only">
            <DialogTitle>Prêmio Resgatado</DialogTitle>
          </DialogHeader>

          {/* Card de Vitória (para captura de imagem) */}
          <div
            ref={victoryCardRef}
            className="relative p-6 bg-gradient-to-b from-[#0d1117] to-[#161b22]"
          >
            {/* Header com padrão de estádio */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[url('/images/field-pattern.png')] bg-repeat opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-[#0d1117]" />
            </div>

            {/* Conteúdo */}
            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Troféu animado */}
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFD700] via-[#FFA500] to-[#FFD700] flex items-center justify-center shadow-lg shadow-yellow-500/30 animate-pulse">
                  <Trophy className="h-14 w-14 text-[#0d1117]" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#14F195] rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-[#0d1117]" />
                </div>
              </div>

              {/* Texto de parabéns - cor sólida para compatibilidade com html2canvas */}
              <h2 className="text-2xl font-black text-[#FFD700] mb-2 tracking-tight drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                🏆 PARABÉNS! 🏆
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Seu prêmio foi enviado para sua carteira
              </p>

              {/* Valor do prêmio - Destaque principal */}
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-[#14F195]/20 blur-xl rounded-full" />
                <div className="relative px-8 py-4 bg-gradient-to-r from-[#14F195]/10 via-[#14F195]/20 to-[#14F195]/10 border border-[#14F195]/30 rounded-2xl">
                  <span className="text-5xl font-black text-[#14F195] tracking-tighter" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    +{successModal?.amount.toFixed(4)}
                  </span>
                  <span className="text-2xl font-bold text-[#14F195]/80 ml-2">SOL</span>
                </div>
              </div>

              {/* Nome do prêmio */}
              <div className="flex items-center gap-2 px-4 py-2 bg-[#9945FF]/20 border border-[#9945FF]/30 rounded-full mb-4">
                <Crown className="h-4 w-4 text-[#9945FF]" />
                <span className="text-sm font-semibold text-[#9945FF]">
                  {successModal?.prizeName}
                </span>
              </div>

              {/* Logo MFL */}
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <span className="font-bold text-gray-400">MFL</span>
                <span>Protocol</span>
                <span className="text-[#14F195]">•</span>
                <span>Powered by Solana</span>
              </div>
            </div>
          </div>

          {/* Seção de Hash e Ações */}
          <div className="px-6 pb-6 space-y-4">
            {/* Hash da Transação */}
            {successModal?.txHash && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">Hash da Transação</p>
                <div className="flex items-center gap-2 p-3 bg-[#1c2128] border border-[#30363d] rounded-lg">
                  <code className="flex-1 text-xs font-mono text-gray-400 text-center">
                    {truncateHash(successModal.txHash)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#30363d]"
                    onClick={() => copyToClipboard(successModal.txHash)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#30363d]"
                    onClick={() => window.open(getExplorerUrl(successModal.txHash), '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Botões de Compartilhamento */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-[#1DA1F2]/10 border-[#1DA1F2]/30 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2]"
                onClick={shareOnTwitter}
              >
                <Twitter className="h-4 w-4 mr-2" />
                Compartilhar no X
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-[#9945FF]/10 border-[#9945FF]/30 text-[#9945FF] hover:bg-[#9945FF]/20 hover:text-[#9945FF]"
                onClick={generateVictoryImage}
                disabled={generatingImage}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {generatingImage ? 'Gerando...' : 'Copiar Imagem'}
              </Button>
            </div>

            {/* Botão Fechar */}
            <Button
              className="w-full bg-gradient-to-r from-[#14F195] to-[#9945FF] hover:from-[#14F195]/90 hover:to-[#9945FF]/90 text-[#0d1117] font-bold"
              onClick={() => setSuccessModal(null)}
            >
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';

// Cache de imagens dos tokens (URLs diretas do CoinGecko)
const TOKEN_IMAGES: Record<string, string> = {
  'BTC': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  'ETH': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  'BNB': 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  'SOL': 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  'ADA': 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
  'DOT': 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
  'MATIC': 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
  'POL': 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
  'LINK': 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
  'UNI': 'https://assets.coingecko.com/coins/images/12504/large/uni.jpg',
  'ATOM': 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png',
  'XRP': 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  'LTC': 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
  'AVAX': 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
  'SHIB': 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
  'TRX': 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
  'DAI': 'https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png',
  'WBTC': 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png',
  'AAVE': 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png',
  'HYPE': 'https://coin-images.coingecko.com/coins/images/50882/large/hyperliquid.jpg',
  'SNX': 'https://assets.coingecko.com/coins/images/3406/large/SNX.png',
  'ICP': 'https://assets.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png',
  'ZEC': 'https://assets.coingecko.com/coins/images/486/large/circle-zcash-color.png',
  'ARB': 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg',
  'DASH': 'https://assets.coingecko.com/coins/images/19/large/dash-logo.png',
  'RUNE': 'https://assets.coingecko.com/coins/images/6595/large/Rune200x200.png',
  'VET': 'https://assets.coingecko.com/coins/images/1167/large/VeChain-Logo-768x725.png',
  'DOGE': 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
  'OP': 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
  'LDO': 'https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png',
  'MKR': 'https://assets.coingecko.com/coins/images/1364/large/Mark_Maker.png',
  'FTM': 'https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png',
  'APT': 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png',
  'NEAR': 'https://assets.coingecko.com/coins/images/10365/large/near_icon.png',
  'BCH': 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png',
  'ETC': 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png',
  'XMR': 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png',
  'FIL': 'https://assets.coingecko.com/coins/images/12812/large/filecoin.png',
  'XLM': 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png',
  // Tokens adicionados
  'GRT': 'https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png',
  'INJ': 'https://assets.coingecko.com/coins/images/12882/large/Secondary_Symbol.png',
  'ALGO': 'https://assets.coingecko.com/coins/images/4380/large/download.png',
  'SUI': 'https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg',
  'RENDER': 'https://assets.coingecko.com/coins/images/11636/large/rndr.png',
  'FET': 'https://assets.coingecko.com/coins/images/5681/large/Fetch.jpg',
  'TAO': 'https://assets.coingecko.com/coins/images/28452/large/ARUsPeNQ_400x400.jpeg',
  'AR': 'https://assets.coingecko.com/coins/images/4343/large/oRt6SiEN_400x400.jpg',
  'THETA': 'https://assets.coingecko.com/coins/images/2538/large/theta-token-logo.png',
  'SAND': 'https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg',
  'MANA': 'https://assets.coingecko.com/coins/images/878/large/decentraland-mana.png',
  'AXS': 'https://assets.coingecko.com/coins/images/13029/large/axie_infinity_logo.png',
  'GALA': 'https://assets.coingecko.com/coins/images/12493/large/GALA-COINGECKO.png',
  'ENJ': 'https://assets.coingecko.com/coins/images/1102/large/enjin-coin-logo.png',
  'CHZ': 'https://assets.coingecko.com/coins/images/8834/large/CHZ_Token_updated.png',
  'FLOW': 'https://assets.coingecko.com/coins/images/13446/large/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.png',
  'KAVA': 'https://assets.coingecko.com/coins/images/9761/large/kava.png',
  'XTZ': 'https://assets.coingecko.com/coins/images/976/large/Tezos-logo.png',
  'EOS': 'https://assets.coingecko.com/coins/images/738/large/eos-eos-logo.png',
  'EGLD': 'https://assets.coingecko.com/coins/images/12335/large/egld-token-logo.png',
  'CAKE': 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo_%281%29.png',
  'CRV': 'https://assets.coingecko.com/coins/images/12124/large/Curve.png',
  'COMP': 'https://assets.coingecko.com/coins/images/10775/large/COMP.png',
  'SUSHI': 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png',
  '1INCH': 'https://assets.coingecko.com/coins/images/13469/large/1inch-token.png',
  'BAT': 'https://assets.coingecko.com/coins/images/677/large/basic-attention-token.png',
  'ZRX': 'https://assets.coingecko.com/coins/images/863/large/0x.png',
  'YFI': 'https://assets.coingecko.com/coins/images/11849/large/yearn.jpg',
  'STETH': 'https://assets.coingecko.com/coins/images/13442/large/steth_logo.png',
  'USDT': 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  'USDC': 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
  'PEPE': 'https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg',
  'WIF': 'https://assets.coingecko.com/coins/images/33566/large/dogwifhat.jpg',
  'BONK': 'https://assets.coingecko.com/coins/images/28600/large/bonk.jpg',
  'FLOKI': 'https://assets.coingecko.com/coins/images/16746/large/FLOKI.png',
  'TON': 'https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png',
  'KAS': 'https://assets.coingecko.com/coins/images/25751/large/kaspa-icon-exchanges.png',
  'HBAR': 'https://assets.coingecko.com/coins/images/3688/large/hbar.png',
  'STX': 'https://assets.coingecko.com/coins/images/2069/large/Stacks_logo_full.png',
  'IMX': 'https://assets.coingecko.com/coins/images/17233/large/immutableX-symbol-BLK-RGB.png',
  'WLD': 'https://assets.coingecko.com/coins/images/31069/large/worldcoin.jpeg',
  'QNT': 'https://assets.coingecko.com/coins/images/3370/large/5ZOu7brX_400x400.jpg',
  'ONDO': 'https://assets.coingecko.com/coins/images/26580/large/ONDO.png',
  'ENA': 'https://assets.coingecko.com/coins/images/36530/large/ethena.png',
  'TRUMP': 'https://assets.coingecko.com/coins/images/53746/large/trump.jpg',
  'PI': 'https://assets.coingecko.com/coins/images/39136/large/pi.png',
};

interface TeamData {
  userId: string;
  username: string;
  totalPoints: number;
  rank: number;
  tokens: string[];
  formation?: '433' | '442' | '352';
  user?: {
    avatar?: string;
  };
}

interface TeamDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamData: TeamData | null;
  competitionId?: string | null;
  competitionStatus?: string | null;
  currentUserId?: string;
}

interface TokenDetail {
  symbol: string;
  percentChange: number;
  image?: string;
}

interface DetailData {
  tokens: TokenDetail[];
  totalPoints: number;
}

interface ComparisonData {
  commonTokens: string[];
  uniqueToUser: string[];
  uniqueToTarget: string[];
  pointsDifference: number;
}

export function TeamDetailModal({
  open,
  onOpenChange,
  teamData,
  competitionId,
  competitionStatus,
  currentUserId,
}: TeamDetailModalProps) {
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cachedUserTeamRef = useRef<any>(null);

  useEffect(() => {
    if (!open || !teamData || !competitionId) {
      setDetailData(null);
      setComparisonData(null);
      setError(null);
      return;
    }

    const fetchTeamDetails = async () => {
      try {
        setIsLoading(true);
        setDetailData(null);
        setComparisonData(null);
        setError(null);

        const url = `/api/teams?competitionId=${competitionId}&userId=${teamData.userId}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Falha ao buscar detalhes do time');
        }

        const data = await response.json();

        if (!data.success || !data.teams || data.teams.length === 0) {
          throw new Error('Time não encontrado');
        }

        const team = data.teams[0];

        const snapshotsResponse = await fetch(
          `/api/competition/tokens?competitionId=${competitionId}`
        );
        const snapshotsData = await snapshotsResponse.json();

        let tokenDetails: TokenDetail[] = [];
        if (competitionStatus === 'ACTIVE' && team.liveScore !== undefined) {
          if (team.tokenPerformances && Array.isArray(team.tokenPerformances)) {
            // Adicionar imagens do cache aos tokenPerformances
            tokenDetails = team.tokenPerformances.map(tp => {
              const symbolUpper = tp.symbol.toUpperCase();
              const finalImage = tp.image || TOKEN_IMAGES[symbolUpper] || '';
              console.log(`🖼️ Token ${symbolUpper}: tp.image=${tp.image}, cache=${TOKEN_IMAGES[symbolUpper]}, final=${finalImage}`);
              return {
                ...tp,
                symbol: symbolUpper,
                image: finalImage
              };
            });
          } else {
            const pointsPerToken = team.liveScore / team.players.length;
            tokenDetails = team.players.map((symbol: string) => {
              const symbolUpper = symbol.toUpperCase();
              const cacheImage = TOKEN_IMAGES[symbolUpper] || '';
              console.log(`🖼️ Token ${symbolUpper}: cache=${cacheImage}`);
              return {
                symbol: symbolUpper,
                percentChange: pointsPerToken,
                image: cacheImage
              };
            });
          }
        } else {
          tokenDetails = team.players.map((symbol: string) => {
            const symbolUpper = symbol.toUpperCase();
            const snapshot = snapshotsData.tokens?.find(
              (t: any) => t.symbol.toUpperCase() === symbolUpper
            );
            const finalImage = TOKEN_IMAGES[symbolUpper] || snapshot?.imageUrl || '';
            console.log(`🖼️ Token ${symbolUpper}: cache=${TOKEN_IMAGES[symbolUpper]}, snapshot=${snapshot?.imageUrl}, final=${finalImage}`);
            return {
              symbol: symbolUpper,
              percentChange: snapshot?.percentChange || 0,
              image: finalImage
            };
          });
        }

        tokenDetails.sort((a, b) => b.percentChange - a.percentChange);

        const finalScore = team.liveScore !== undefined ? team.liveScore : (teamData.totalPoints || 0);

        setDetailData({
          tokens: tokenDetails,
          totalPoints: finalScore
        });

        if (currentUserId && currentUserId !== teamData.userId) {
          let myTeamData;
          if (cachedUserTeamRef.current) {
            myTeamData = cachedUserTeamRef.current;
          } else {
            const myTeamResponse = await fetch(`/api/teams?competitionId=${competitionId}&userId=${currentUserId}`);
            const myTeamJson = await myTeamResponse.json();

            if (myTeamJson.success && myTeamJson.teams && myTeamJson.teams.length > 0) {
              myTeamData = myTeamJson.teams[0];
              cachedUserTeamRef.current = myTeamData;
            }
          }

          if (myTeamData) {
            const myTokens: string[] = myTeamData.players || [];
            const targetTokens: string[] = team.players || [];

            const common = myTokens.filter(t => targetTokens.includes(t));
            const uniqueToMe = myTokens.filter(t => !targetTokens.includes(t));
            const uniqueToTarget = targetTokens.filter(t => !myTokens.includes(t));

            const myScore = myTeamData.liveScore !== undefined ? myTeamData.liveScore : myTeamData.totalScore || 0;
            const targetScore = finalScore;
            const diff = myScore - targetScore;

            setComparisonData({
              commonTokens: common,
              uniqueToUser: uniqueToMe,
              uniqueToTarget: uniqueToTarget,
              pointsDifference: diff
            });
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('❌ [TEAM-MODAL] Erro ao buscar detalhes:', err);
        setError('Erro ao buscar detalhes do time');
        setIsLoading(false);
      }
    };

    fetchTeamDetails();
  }, [open, teamData, competitionId, competitionStatus, currentUserId]);

  if (!teamData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" aria-describedby="team-detail-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>{teamData.username}</span>
              <Badge variant="secondary">#{teamData.rank}</Badge>
            </div>
            <div className="text-2xl font-bold text-primary">
              {teamData.totalPoints.toFixed(2)} pts
            </div>
          </DialogTitle>
          <DialogDescription id="team-detail-description">
            Detalhes do time e composição de tokens
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Carregando detalhes do time...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              <p>{error}</p>
            </div>
          ) : detailData ? (
            <div className="space-y-6">
              {/* Layout: Mascote (30%) à esquerda + Campo (70%) à direita */}
              <div className="flex gap-4">
                {/* Mascote do Time (30%) */}
                <div className="w-[30%] flex flex-col bg-gray-50 dark:bg-gray-900 rounded-lg min-h-[320px] overflow-hidden">
                  {teamData?.user?.avatar ? (
                    <div className="flex-1 relative">
                      <img
                        src={teamData.user.avatar}
                        alt="Mascote do Time"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <h3 className="font-semibold text-lg text-white">{teamData.username}</h3>
                        <p className="text-sm text-gray-300">Mascote da Sorte</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-700 text-center p-4">
                      <span className="text-6xl mb-2">🎭</span>
                      <span className="text-sm font-bold">Sem Mascote</span>
                      <span className="text-xs text-muted-foreground">Configure no seu perfil</span>
                      <h3 className="font-semibold text-lg mt-4">{teamData.username}</h3>
                    </div>
                  )}
                </div>

                {/* Mini Campo Visual (70%) */}
                <div className="w-[70%] bg-gradient-to-b from-green-400 to-green-600 rounded-lg p-4 min-h-[320px]">
                  <div className="relative w-full h-[288px] bg-green-500 rounded-lg border-2 border-white overflow-hidden">
                  <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white rounded-full opacity-30"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white opacity-30 transform -translate-y-1/2"></div>
                  </div>

                  <div className="absolute inset-0 flex flex-col justify-around p-3">
                    {(!teamData?.formation || teamData.formation === '433') && (
                      <>
                        <div className="flex justify-around">
                          {detailData.tokens.slice(0, 3).map((token, i) => (
                            <div key={i} className="relative group">
                              <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-2 border-blue-500">
                                {token.image ? (
                                  <img
                                    src={token.image}
                                    alt={token.symbol}
                                    className="w-10 h-10 object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-bold text-gray-700">{token.symbol}</span>
                                )}
                              </div>
                              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-[9px] px-1 rounded whitespace-nowrap">
                                {token.symbol}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-around px-8">
                          {detailData.tokens.slice(3, 6).map((token, i) => (
                            <div key={i} className="relative group">
                              <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-2 border-green-500">
                                {token.image ? (
                                  <img
                                    src={token.image}
                                    alt={token.symbol}
                                    className="w-10 h-10 object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-bold text-gray-700">{token.symbol}</span>
                                )}
                              </div>
                              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-[9px] px-1 rounded whitespace-nowrap">
                                {token.symbol}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-around">
                          {detailData.tokens.slice(6, 10).map((token, i) => (
                            <div key={i} className="relative group">
                              <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-2 border-yellow-500">
                                {token.image ? (
                                  <img
                                    src={token.image}
                                    alt={token.symbol}
                                    className="w-10 h-10 object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-bold text-gray-700">{token.symbol}</span>
                                )}
                              </div>
                              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-[9px] px-1 rounded whitespace-nowrap">
                                {token.symbol}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detailData.tokens.length > 0 && detailData.tokens[0].percentChange > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-green-600 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">Melhor Token</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-300">{detailData.tokens[0].symbol}</p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">+{detailData.tokens[0].percentChange.toFixed(2)} pts</p>
                      </div>
                    </div>
                  </div>
                )}

                {detailData.tokens.length > 0 && detailData.tokens[detailData.tokens.length - 1].percentChange < 0 && (
                  <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <TrendingDown className="h-5 w-5 text-red-600 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-700 dark:text-red-400">Pior Token</p>
                        <p className="text-2xl font-bold text-red-900 dark:text-red-300">{detailData.tokens[detailData.tokens.length - 1].symbol}</p>
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">{detailData.tokens[detailData.tokens.length - 1].percentChange.toFixed(2)} pts</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {competitionStatus === 'ACTIVE' && (
                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <div>
                      <p className="font-semibold text-yellow-900 dark:text-yellow-300">Rodada em andamento</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">Scores calculados em tempo real com base no mercado atual.</p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  Breakdown dos Tokens
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {detailData.tokens.map((token, index) => (
                    <div
                      key={token.symbol}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-6">{index + 1}.</span>
                        {token.image ? (
                          <img
                            src={token.image}
                            alt={token.symbol}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-bold">{token.symbol.slice(0, 2)}</span>
                          </div>
                        )}
                        <span className="font-medium">{token.symbol}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`flex items-center gap-1 ${
                            token.percentChange >= 0
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          {token.percentChange >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {token.percentChange >= 0 ? '+' : ''}{token.percentChange.toFixed(2)} pts
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {comparisonData && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-blue-600" />
                      Comparação com Seu Time
                    </h3>

                    {/* Cards modernos e compactos */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Tokens em Comum */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center transition-transform hover:scale-105">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {comparisonData.commonTokens.length}
                        </div>
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                          Tokens em Comum
                        </p>
                      </div>

                      {/* Só no Seu */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-center transition-transform hover:scale-105">
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                          {comparisonData.uniqueToUser.length}
                        </div>
                        <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                          Só no Seu
                        </p>
                      </div>

                      {/* Diferença de Pontos */}
                      <div className={`border rounded-lg p-3 text-center transition-transform hover:scale-105 ${
                        comparisonData.pointsDifference >= 0
                          ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800'
                      }`}>
                        <div className={`text-3xl font-bold mb-1 ${
                          comparisonData.pointsDifference >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {comparisonData.pointsDifference >= 0 ? '+' : ''}
                          {comparisonData.pointsDifference.toFixed(2)}
                        </div>
                        <p className={`text-xs font-medium ${
                          comparisonData.pointsDifference >= 0
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-red-700 dark:text-red-300'
                        }`}>
                          pts Diferença
                        </p>
                      </div>
                    </div>

                    {/* Lista de tokens em comum */}
                    {comparisonData.commonTokens.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mt-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-semibold">Tokens em comum:</span> {comparisonData.commonTokens.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


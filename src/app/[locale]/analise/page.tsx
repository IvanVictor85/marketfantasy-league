'use client'

import { useState, useEffect } from 'react'
import { LocalizedLink } from '@/components/ui/localized-link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Signal,
  Sparkles,
  Loader2,
  HelpCircle,
  Brain
} from 'lucide-react'
import { getMarketAnalysisData, formatPercentageChange, type MarketToken } from '@/lib/market-analysis'
import { formatTokenPrice } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { DefiLlamaService, type DeFiProtocol, type Chain } from '@/lib/defillama-service'
import { GeminiAIService } from '@/lib/gemini-ai-service'
import { Layers, Flame, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { type Player } from '@/types/teams'

// Dados mock para social e trend
const socialBuzz = [
  {
    name: 'Dogecoin',
    ticker: 'DOGE',
    logoUrl: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
    sentiment: '🔥 Muito Positivo',
    mentions: '12.5k'
  },
  {
    name: 'Shiba Inu',
    ticker: 'SHIB',
    logoUrl: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
    sentiment: '📈 Positivo',
    mentions: '8.2k'
  },
  {
    name: 'Pepe',
    ticker: 'PEPE',
    logoUrl: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
    sentiment: '⚡ Neutro',
    mentions: '5.7k'
  }
]

const trendAnalysis = [
  {
    name: 'Render',
    ticker: 'RNDR',
    logoUrl: 'https://assets.coingecko.com/coins/images/11636/small/rndr.png',
    trend: '🚀 Tendência de Alta',
    confidence: '85%'
  },
  {
    name: 'Arbitrum',
    ticker: 'ARB',
    logoUrl: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
    trend: '📊 Consolidação',
    confidence: '72%'
  },
  {
    name: 'Optimism',
    ticker: 'OP',
    logoUrl: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
    trend: '🎯 Acumulação',
    confidence: '68%'
  }
]

interface InsightCardProps {
  title: string
  icon: React.ReactNode
  items: any[]
  type: 'gainers' | 'losers' | 'social' | 'trend'
  t: any
}

function InsightCard({ title, icon, items, type, t }: InsightCardProps) {
  const renderItem = (item: any, index: number) => {
    switch (type) {
      case 'gainers':
      case 'losers':
        return (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 flex items-center justify-center">
                <img 
                  src={item.logoUrl} 
                  alt={`${item.name} logo`}
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    // Fallback para o gradiente se a imagem não carregar
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.className = "w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold";
                      parent.textContent = item.symbol?.slice(0, 2) || item.ticker?.slice(0, 2) || 'N/A';
                    }
                  }}
                />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                <p className="text-sm text-slate-500 dark:text-gray-400">{item.symbol || item.ticker}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold ${type === 'gainers' ? 'text-[#2A9D8F] dark:text-green-400' : 'text-[#E76F51] dark:text-red-400'}`}>
                {item.value || formatPercentageChange(item.priceChange24h || item.priceChange24h || 0)}
              </p>
              <p className="text-sm text-slate-500 dark:text-gray-400">{item.currentPrice || formatTokenPrice(item.currentPrice || item.currentPrice || 0)}</p>
            </div>
          </div>
        )
      
      case 'social':
        // Mapear sentimentos para chaves de tradução
        const sentimentMap: { [key: string]: string } = {
          '🔥 Muito Positivo': `🔥 ${t('veryPositive')}`,
          '📈 Positivo': `📈 ${t('positive')}`,
          '⚡ Neutro': `⚡ ${t('neutral')}`
        };
        const translatedSentiment = sentimentMap[item.sentiment] || item.sentiment;

        return (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 flex items-center justify-center">
                <img
                  src={item.logoUrl}
                  alt={`${item.name} logo`}
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    // Fallback para o gradiente se a imagem não carregar
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.className = "w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold";
                      parent.textContent = item.ticker.slice(0, 2);
                    }
                  }}
                />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                <p className="text-sm text-slate-500 dark:text-gray-400">{item.ticker}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{translatedSentiment}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">{item.mentions} {t('mentions')}</p>
            </div>
          </div>
        )
      
      case 'trend':
        // Mapear tendências para chaves de tradução
        const trendMap: { [key: string]: string } = {
          '🚀 Tendência de Alta': `🚀 ${t('uptrend')}`,
          '📊 Consolidação': `📊 ${t('consolidation')}`,
          '🎯 Acumulação': `🎯 ${t('accumulation')}`
        };
        const translatedTrend = trendMap[item.trend] || item.trend;

        return (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 flex items-center justify-center">
                <img
                  src={item.logoUrl}
                  alt={`${item.name} logo`}
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    // Fallback para o gradiente se a imagem não carregar
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.className = "w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold";
                      parent.textContent = item.ticker.slice(0, 2);
                    }
                  }}
                />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                <p className="text-sm text-slate-500 dark:text-gray-400">{item.ticker}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{translatedTrend}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">{t('confidence')}: {item.confidence}</p>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md border-slate-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
          {icon}
          <span className="text-lg font-bold">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => renderItem(item, index))}
      </CardContent>
    </Card>
  )
}

export default function AnalisePage() {
  console.log('🎯 Componente AnalisePage renderizado');
  const t = useTranslations('AiAnalysisPage');
  const { user, isAuthenticated } = useAuth();

  const [topGainers, setTopGainers] = useState<MarketToken[]>([])
  const [topLosers, setTopLosers] = useState<MarketToken[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para dados DeFi
  const [trendingProtocols, setTrendingProtocols] = useState<DeFiProtocol[]>([])
  const [decliningProtocols, setDecliningProtocols] = useState<DeFiProtocol[]>([])
  const [topChains, setTopChains] = useState<Chain[]>([])
  const [isLoadingDefi, setIsLoadingDefi] = useState(true)

  // Estados para time principal
  const [mainTeam, setMainTeam] = useState<Player[]>([])
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)

  // Estados para modal de análise AI (protocolos)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useState<DeFiProtocol | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<string>('')
  const [aiLoading, setAiLoading] = useState(false)

  // Estados para modal de análise do time
  const [teamAnalysisModalOpen, setTeamAnalysisModalOpen] = useState(false)
  const [teamAnalysis, setTeamAnalysis] = useState<string>('')
  const [teamAnalysisLoading, setTeamAnalysisLoading] = useState(false)

  // Carregar dados reais da API
  useEffect(() => {
    const loadMarketData = async () => {
      try {
        console.log('🎯 Componente: Iniciando carregamento dos dados...')
        setIsLoading(true)
        setError(null)
        const data = await getMarketAnalysisData()
        console.log('🎯 Componente: Dados recebidos:', {
          gainers: data.topGainers.length,
          losers: data.topLosers.length,
          firstGainer: data.topGainers[0]?.name,
          firstLoser: data.topLosers[0]?.name
        })
        setTopGainers(data.topGainers)
        setTopLosers(data.topLosers)
      } catch (err) {
        console.error('❌ Componente: Erro ao carregar dados do mercado:', err)
        setError(t('errorLoading'))
        // Fallback para dados de exemplo em caso de erro
        setTopGainers([])
        setTopLosers([])
      } finally {
        setIsLoading(false)
        console.log('🎯 Componente: Carregamento finalizado')
      }
    }

    loadMarketData()
  }, [])

  // Carregar dados DeFi
  useEffect(() => {
    const loadDefiData = async () => {
      try {
        setIsLoadingDefi(true)
        const [trending, declining, chains] = await Promise.all([
          DefiLlamaService.getTrendingProtocols(5),
          DefiLlamaService.getDecliningProtocols(5),
          DefiLlamaService.getTopChains(5)
        ])
        setTrendingProtocols(trending)
        setDecliningProtocols(declining)
        setTopChains(chains)
      } catch (err) {
        console.error('Erro ao carregar dados DeFi:', err)
      } finally {
        setIsLoadingDefi(false)
      }
    }

    loadDefiData()
  }, [])

  // Carregar time principal do usuário
  useEffect(() => {
    const loadMainTeam = async () => {
      if (!isAuthenticated || !user) {
        console.log('🚫 [ANALISE] Usuário não autenticado');
        return;
      }

      try {
        setIsLoadingTeam(true);
        console.log('🔍 [ANALISE] Buscando time principal do usuário...');

        const response = await fetch(`/api/team`);
        const data = await response.json();

        console.log('📥 [ANALISE] Resposta da API:', data);

        if (response.ok && data.hasTeam !== false && data.team && data.team.tokens) {
          console.log('✅ [ANALISE] Time encontrado:', data.team.tokens);
          console.log('✅ [ANALISE] Token details:', data.tokenDetails);

          // Usar tokenDetails ao invés de team.tokens (que vem só com símbolos)
          const tokenDetails = data.tokenDetails || [];

          // Converter os tokens para o formato Player com dados reais
          const players: Player[] = tokenDetails.map((tokenData: any, index: number) => {
            console.log(`🔍 [ANALISE] Token ${index}:`, {
              name: tokenData.name,
              symbol: tokenData.symbol,
              image: tokenData.image,
              hasImage: !!tokenData.image
            });

            return {
              id: `player-${index}`,
              position: index + 1,
              name: tokenData.name || tokenData.symbol || data.team.tokens[index],
              symbol: tokenData.symbol || data.team.tokens[index],
                            image: tokenData.image,
              currentPrice: tokenData.currentPrice || tokenData.current_price || 0,
              price: tokenData.currentPrice || tokenData.current_price || 0,
              points: 0,
              rarity: 'common' as const,
              priceChange24h: tokenData.priceChange24h || tokenData.price_change_percentage_24h || 0,
                            priceChange7d: tokenData.priceChange7d || tokenData.price_change_percentage_7d_in_currency || 0,
              change_7d: tokenData.priceChange7d || tokenData.price_change_percentage_7d_in_currency || 0
            };
          });

          console.log('👥 [ANALISE] Players processados:', players.length);
          console.log('🖼️ [ANALISE] Players com imagens:', players.filter(p => p.image).length);
          setMainTeam(players);
        } else {
          console.log('⚠️ [ANALISE] Usuário não tem time criado');
          setMainTeam([]);
        }
      } catch (err) {
        console.error('❌ [ANALISE] Erro ao carregar time principal:', err);
        setMainTeam([]);
      } finally {
        setIsLoadingTeam(false);
      }
    };

    loadMainTeam();
  }, [isAuthenticated, user]);

  // Handler para analisar time com IA
  const handleAnalyzeTeam = async () => {
    if (mainTeam.length !== 10) {
      alert(t('needTenTokens'));
      return;
    }

    setTeamAnalysisModalOpen(true);
    setTeamAnalysisLoading(false);

    // 🚧 Funcionalidade temporariamente desabilitada
    setTeamAnalysis(`🚧 **Análise com IA Temporariamente em Manutenção**

Estamos atualizando nossa integração com o Gemini AI para trazer análises ainda melhores para você!

**Seu Time:**
${mainTeam.map((p, i) => `${i + 1}. ${p.symbol || p.symbol || '?'} - ${(p.priceChange24h || p.priceChange24h) !== undefined ? ((p.priceChange24h || p.priceChange24h || 0) >= 0 ? '+' : '') + (p.priceChange24h || p.priceChange24h || 0).toFixed(2) + '% (24h)' : 'N/A'}`).join('\n')}

**Em breve você poderá:**
✅ Receber análise detalhada do seu portfólio
✅ Identificar tokens com baixa performance
✅ Obter sugestões de tokens alternativos
✅ Entender tendências do mercado

Agradecemos sua compreensão! 🙏`);
  };

  // Handler para analisar protocolo com IA
  const handleAnalyzeProtocol = async (protocol: DeFiProtocol) => {
    setSelectedProtocol(protocol)
    setAiModalOpen(true)
    setAiLoading(false)

    // 🚧 Funcionalidade temporariamente desabilitada
    setAiAnalysis(`🚧 **Análise com IA Temporariamente em Manutenção**

Estamos atualizando nossa integração com o Gemini AI para trazer análises ainda melhores!

**${protocol.name}**
TVL: ${DefiLlamaService.formatUSD(protocol.tvl)}
Mudança 24h: ${DefiLlamaService.formatPercentage(protocol.change_1d)}
Categoria: ${protocol.category}

**Em breve você poderá:**
✅ Entender por que protocolos estão crescendo ou caindo
✅ Análise de movimentos de capital entre protocolos
✅ Identificar tendências de yield farming
✅ Insights sobre sentimento do mercado

Agradecemos sua compreensão! 🙏`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Sparkles className="w-10 h-10 text-[#F4A261] dark:text-orange-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              {t('title')}
            </h1>
            <Sparkles className="w-10 h-10 text-[#E9C46A] dark:text-yellow-400" />
          </div>
          <p className="text-xl text-slate-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Seção 1: Dashboard "Pulso do Mercado" */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            📊 {t('marketPulse')}
          </h2>
          
          {error && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-800">{error}</p>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#2A9D8F]" />
              <span className="ml-2 text-slate-600">{t('loadingMarket')}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <InsightCard
                title={t('rocketsTitle')}
                icon={<TrendingUp className="w-6 h-6 text-[#2A9D8F]" />}
                items={topGainers}
                type="gainers"
                t={t}
              />

              <InsightCard
                title={t('alertTitle')}
                icon={<TrendingDown className="w-6 h-6 text-[#E76F51]" />}
                items={topLosers}
                type="losers"
                t={t}
              />

              <InsightCard
                title={t('socialRadarTitle')}
                icon={<Users className="w-6 h-6 text-[#F4A261]" />}
                items={socialBuzz}
                type="social"
                t={t}
              />

              <InsightCard
                title={t('trendRadarTitle')}
                icon={<Signal className="w-6 h-6 text-[#E9C46A]" />}
                items={trendAnalysis}
                type="trend"
                t={t}
              />
            </div>
          )}
        </div>

        {/* Seção 2: Análise do Seu Time */}
        {isAuthenticated && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
              🎯 {t('teamAnalysisTitle')}
            </h2>

            <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md border-slate-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between dark:text-white">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <span>{t('yourMainTeam')}</span>
                  </div>
                  {mainTeam.length === 10 && (
                    <Button
                      onClick={handleAnalyzeTeam}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      {t('analyzeWithAI')}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingTeam ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
                    <span className="ml-2 text-slate-600 dark:text-gray-300">{t('loadingYourTeam')}</span>
                  </div>
                ) : mainTeam.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 dark:text-gray-300 mb-4">{t('noTeamCreated')}</p>
                    <Button asChild>
                      <LocalizedLink href="/teams">{t('createMyTeam')}</LocalizedLink>
                    </Button>
                  </div>
                ) : mainTeam.length !== 10 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 dark:text-gray-300 mb-4">
                      {t('incompleteTeam', { count: mainTeam.length })}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">
                      {t('completeTeamForAI')}
                    </p>
                    <Button asChild>
                      <LocalizedLink href="/teams">{t('completeTeam')}</LocalizedLink>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {mainTeam.map((player, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center space-y-2 bg-slate-50 dark:bg-gray-800 rounded-lg p-3 border border-slate-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white dark:bg-gray-700 border-2 border-slate-200 dark:border-gray-600 flex items-center justify-center">
                          {player.image ? (
                            <img
                              src={player.image}
                              alt={`${player.name} logo`}
                              className="w-10 h-10 object-contain"
                              onError={(e) => {
                                // Fallback para gradiente se imagem falhar
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.className = "w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm";
                                  parent.textContent = (player.symbol || player.symbol || '?').slice(0, 2);
                                }
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                              {(player.symbol || player.symbol || '?').slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white text-center truncate w-full">
                          {player.symbol || player.symbol || '?'}
                        </p>
                        {((player.priceChange24h || player.priceChange24h) !== undefined && (player.priceChange24h || player.priceChange24h || 0) !== 0) && (
                          <p className={`text-xs font-semibold ${(player.priceChange24h || player.priceChange24h || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {(player.priceChange24h || player.priceChange24h || 0) > 0 ? '+' : ''}{(player.priceChange24h || player.priceChange24h || 0).toFixed(1)}%
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Nova Seção: DeFi Insights */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            🏦 {t('defiInsights')}
          </h2>

          {isLoadingDefi ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#2A9D8F]" />
              <span className="ml-2 text-slate-600">{t('loadingDefiData')}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Protocolos em Alta */}
              <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md border-slate-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                    <Flame className="w-6 h-6 text-orange-500" />
                    <span className="text-lg font-bold">🚀 {t('trendingProtocols')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trendingProtocols.map((protocol, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 flex items-center justify-center">
                          <img
                            src={protocol.logo}
                            alt={`${protocol.name} logo`}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.className = "w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold";
                                parent.textContent = protocol.name.slice(0, 2).toUpperCase();
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">{protocol.name}</p>
                          <p className="text-xs text-slate-500 dark:text-gray-400">{protocol.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {DefiLlamaService.formatPercentage(protocol.change_1d)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-gray-400">
                            {DefiLlamaService.formatUSD(protocol.tvl)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleAnalyzeProtocol(protocol)}
                        >
                          <HelpCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Ecossistemas Aquecidos */}
              <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md border-slate-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                    <Layers className="w-6 h-6 text-blue-500" />
                    <span className="text-lg font-bold">🔥 {t('topEcosystems')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topChains.map((chain, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                          {chain.tokenSymbol?.slice(0, 2) || chain.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{chain.name}</p>
                          <p className="text-xs text-slate-500 dark:text-gray-400">{chain.tokenSymbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">
                          #{index + 1}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400">
                          {DefiLlamaService.formatUSD(chain.tvl)}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Protocolos em Queda */}
              <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md border-slate-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <span className="text-lg font-bold">⚠️ {t('tvlAlerts')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {decliningProtocols.map((protocol, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 flex items-center justify-center">
                          <img
                            src={protocol.logo}
                            alt={`${protocol.name} logo`}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.className = "w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold";
                                parent.textContent = protocol.name.slice(0, 2).toUpperCase();
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">{protocol.name}</p>
                          <p className="text-xs text-slate-500 dark:text-gray-400">{protocol.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="font-bold text-red-600">
                            {DefiLlamaService.formatPercentage(protocol.change_1d)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-gray-400">
                            {DefiLlamaService.formatUSD(protocol.tvl)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleAnalyzeProtocol(protocol)}
                        >
                          <HelpCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Modal de Análise do Time */}
        <Dialog open={teamAnalysisModalOpen} onOpenChange={setTeamAnalysisModalOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" onCloseAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-purple-600" />
                <span>{t('teamAnalysisModalTitle')}</span>
              </DialogTitle>
              <DialogDescription>
                {t('aiGeneratedAnalysis')}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {teamAnalysisLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
                  <span className="text-slate-600">{t('analyzingTeam')}</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Resumo dos Tokens */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-900 mb-3">{t('yourCurrentTeam')}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {mainTeam.map((player, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-white rounded p-2 border border-slate-200">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                            {(player.symbol || player.symbol || '?').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-900 truncate">{player.symbol || player.symbol || '?'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Análise da IA */}
                  <div className="prose prose-slate max-w-none">
                    <div className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {teamAnalysis}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setTeamAnalysisModalOpen(false)} variant="outline">
                {t('close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Análise de Protocolo DeFi */}
        <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
          <DialogContent className="max-w-2xl" onCloseAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-purple-600" />
                <span>{t('whyProtocol', {
                  name: selectedProtocol?.name,
                  direction: selectedProtocol && selectedProtocol.change_1d > 0 ? t('growing') : t('declining')
                })}</span>
              </DialogTitle>
              <DialogDescription>
                {t('aiProtocolAnalysis')}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {aiLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
                  <span className="text-slate-600">{t('generatingAnalysis')}</span>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none">
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                          {selectedProtocol?.logo ? (
                            <img
                              src={selectedProtocol.logo}
                              alt={`${selectedProtocol.name} logo`}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <span className="text-sm font-bold">{selectedProtocol?.name.slice(0, 2)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{selectedProtocol?.name}</p>
                          <p className="text-xs text-slate-500">{selectedProtocol?.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${selectedProtocol && selectedProtocol.change_1d > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedProtocol && DefiLlamaService.formatPercentage(selectedProtocol.change_1d)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedProtocol && DefiLlamaService.formatUSD(selectedProtocol.tvl)} TVL
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-700 leading-relaxed whitespace-pre-line">
                    {aiAnalysis}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setAiModalOpen(false)} variant="outline">
                {t('close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}
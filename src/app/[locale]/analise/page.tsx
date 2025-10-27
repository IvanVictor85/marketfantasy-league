'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Signal,
  Sparkles,
  Loader2
} from 'lucide-react'
import { getMarketAnalysisData, formatPercentageChange, type MarketToken } from '@/lib/market-analysis'
import { formatTokenPrice } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { DefiLlamaService, type DeFiProtocol, type Chain } from '@/lib/defillama-service'
import { Layers, Flame, AlertTriangle } from 'lucide-react'

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
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
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
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500">{item.symbol || item.ticker}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold ${type === 'gainers' ? 'text-[#2A9D8F]' : 'text-[#E76F51]'}`}>
                {item.value || formatPercentageChange(item.priceChange24h)}
              </p>
              <p className="text-sm text-slate-500">{item.price || formatTokenPrice(item.currentPrice)}</p>
            </div>
          </div>
        )
      
      case 'social':
        return (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
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
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500">{item.ticker}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{item.sentiment}</p>
              <p className="text-xs text-slate-500">{item.mentions} {t('mentions')}</p>
            </div>
          </div>
        )
      
      case 'trend':
        return (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
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
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500">{item.ticker}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{item.trend}</p>
              <p className="text-xs text-slate-500">{t('confidence')}: {item.confidence}</p>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <Card className="bg-white rounded-xl shadow-md border-slate-200 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-slate-900">
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

  const [topGainers, setTopGainers] = useState<MarketToken[]>([])
  const [topLosers, setTopLosers] = useState<MarketToken[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para dados DeFi
  const [trendingProtocols, setTrendingProtocols] = useState<DeFiProtocol[]>([])
  const [decliningProtocols, setDecliningProtocols] = useState<DeFiProtocol[]>([])
  const [topChains, setTopChains] = useState<Chain[]>([])
  const [isLoadingDefi, setIsLoadingDefi] = useState(true)

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


  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Sparkles className="w-10 h-10 text-[#F4A261]" />
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
              {t('title')}
            </h1>
            <Sparkles className="w-10 h-10 text-[#E9C46A]" />
          </div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Seção 1: Dashboard "Pulso do Mercado" */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
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

        {/* Nova Seção: DeFi Insights */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            🏦 Insights DeFi
          </h2>

          {isLoadingDefi ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#2A9D8F]" />
              <span className="ml-2 text-slate-600">Carregando dados DeFi...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Protocolos em Alta */}
              <Card className="bg-white rounded-xl shadow-md border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-slate-900">
                    <Flame className="w-6 h-6 text-orange-500" />
                    <span className="text-lg font-bold">🚀 Protocolos Bombando</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trendingProtocols.map((protocol, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
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
                        <div>
                          <p className="font-medium text-slate-900">{protocol.name}</p>
                          <p className="text-xs text-slate-500">{protocol.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {DefiLlamaService.formatPercentage(protocol.change_1d)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {DefiLlamaService.formatUSD(protocol.tvl)}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Ecossistemas Aquecidos */}
              <Card className="bg-white rounded-xl shadow-md border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-slate-900">
                    <Layers className="w-6 h-6 text-blue-500" />
                    <span className="text-lg font-bold">🔥 Ecossistemas Top</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topChains.map((chain, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                          {chain.tokenSymbol?.slice(0, 2) || chain.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{chain.name}</p>
                          <p className="text-xs text-slate-500">{chain.tokenSymbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">
                          #{index + 1}
                        </p>
                        <p className="text-xs text-slate-500">
                          {DefiLlamaService.formatUSD(chain.tvl)}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Protocolos em Queda */}
              <Card className="bg-white rounded-xl shadow-md border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-slate-900">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <span className="text-lg font-bold">⚠️ Alertas TVL</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {decliningProtocols.map((protocol, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
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
                        <div>
                          <p className="font-medium text-slate-900">{protocol.name}</p>
                          <p className="text-xs text-slate-500">{protocol.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">
                          {DefiLlamaService.formatPercentage(protocol.change_1d)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {DefiLlamaService.formatUSD(protocol.tvl)}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
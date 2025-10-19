'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Signal, 
  Send,
  Bot,
  Sparkles,
  Loader2
} from 'lucide-react'
import { getMarketAnalysisData, formatPercentageChange, type MarketToken } from '@/lib/market-analysis'
import { formatTokenPrice } from '@/lib/utils'

// Dados mock para social e trend (mantidos por enquanto)
// Os dados de gainers e losers agora vêm da API real

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

const chatMessages = [
  {
    type: 'ai',
    content: '👋 Olá! Sou o Oráculo, sua IA especialista em análise de mercado cripto. Posso ajudar você a entender tendências, analisar tokens específicos e dar insights para montar o time perfeito. Como posso ajudar hoje?'
  }
]

const suggestedPrompts = [
  'Qual o melhor momento para investir em SOL?',
  'Analise o sentimento do mercado para BTC',
  'Quais tokens têm maior potencial esta semana?'
]

interface InsightCardProps {
  title: string
  icon: React.ReactNode
  items: any[]
  type: 'gainers' | 'losers' | 'social' | 'trend'
}

function InsightCard({ title, icon, items, type }: InsightCardProps) {
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
              <p className="text-xs text-slate-500">{item.mentions} menções</p>
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
              <p className="text-xs text-slate-500">Confiança: {item.confidence}</p>
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
  
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState(chatMessages)
  const [topGainers, setTopGainers] = useState<MarketToken[]>([])
  const [topLosers, setTopLosers] = useState<MarketToken[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        setError('Erro ao carregar dados do mercado. Usando dados de exemplo.')
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

  const handleSendMessage = () => {
    if (!chatInput.trim()) return

    // Adiciona mensagem do usuário
    const userMessage = { type: 'user', content: chatInput }
    setMessages(prev => [...prev, userMessage])

    // Simula resposta da IA (em uma implementação real, seria uma chamada para API)
    setTimeout(() => {
      const aiResponse = {
        type: 'ai',
        content: `Analisando "${chatInput}"... Com base nos dados atuais do mercado, posso fornecer insights detalhados sobre essa questão. Esta é uma resposta simulada da IA.`
      }
      setMessages(prev => [...prev, aiResponse])
    }, 1000)

    setChatInput('')
  }

  const handleSuggestedPrompt = (prompt: string) => {
    setChatInput(prompt)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Sparkles className="w-10 h-10 text-[#F4A261]" />
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
              Central de Análise IA
            </h1>
            <Sparkles className="w-10 h-10 text-[#E9C46A]" />
          </div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Use os dados e a inteligência artificial a seu favor para montar o time perfeito.
          </p>
        </div>

        {/* Seção 1: Dashboard "Pulso do Mercado" */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            📊 Pulso do Mercado
          </h2>
          
          {error && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-800">{error}</p>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#2A9D8F]" />
              <span className="ml-2 text-slate-600">Carregando dados do mercado...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <InsightCard
                title="Foguetes da Semana"
                icon={<TrendingUp className="w-6 h-6 text-[#2A9D8F]" />}
                items={topGainers}
                type="gainers"
              />
              
              <InsightCard
                title="Alerta de Queda"
                icon={<TrendingDown className="w-6 h-6 text-[#E76F51]" />}
                items={topLosers}
                type="losers"
              />
              
              <InsightCard
                title="Radar Social"
                icon={<Users className="w-6 h-6 text-[#F4A261]" />}
                items={socialBuzz}
                type="social"
              />
              
              <InsightCard
                title="Radar de Tendência"
                icon={<Signal className="w-6 h-6 text-[#E9C46A]" />}
                items={trendAnalysis}
                type="trend"
              />
            </div>
          )}
        </div>

        {/* Seção 2: "Fale com o Analista IA" */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Bot className="w-8 h-8 text-[#2A9D8F]" />
              <h2 className="text-3xl font-bold text-slate-900">
                Pergunte ao Oráculo
              </h2>
            </div>
            <p className="text-lg text-slate-600">
              Converse com nossa IA especialista em análise de mercado
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Interface de Chat */}
            <div className="bg-white rounded-xl shadow-md border-slate-200 p-6 mb-6">
              <div className="bg-slate-100 rounded-lg p-4 h-96 overflow-y-auto mb-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-[#2A9D8F] text-white'
                          : 'bg-white border border-slate-200 text-slate-900'
                      }`}
                    >
                      {message.type === 'ai' && (
                        <div className="flex items-center space-x-2 mb-2">
                          <Bot className="w-4 h-4 text-[#2A9D8F]" />
                          <span className="text-sm font-medium text-[#2A9D8F]">Oráculo IA</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input de Chat */}
              <div className="flex space-x-3">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Digite sua pergunta sobre um token ou ecossistema..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-[#2A9D8F] hover:bg-[#238A7A] text-white px-6"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Analisar
                </Button>
              </div>
            </div>

            {/* Sugestões de Prompt */}
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-4">💡 Sugestões de perguntas:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {suggestedPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="text-sm border-slate-300 hover:border-[#2A9D8F] hover:text-[#2A9D8F] transition-colors"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
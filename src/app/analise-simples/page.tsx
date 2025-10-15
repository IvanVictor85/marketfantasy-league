'use client'

import { useState, useEffect } from 'react'
import { getMarketAnalysisData } from '@/lib/market-analysis'
import type { Token } from '@/types/market'

export default function AnaliseSimples() {
  const [topGainers, setTopGainers] = useState<Token[]>([])
  const [topLosers, setTopLosers] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🚀 Iniciando busca de dados...')
        setIsLoading(true)
        setError(null)
        
        const data = await getMarketAnalysisData()
        console.log('📊 Dados recebidos:', { 
          gainers: data.topGainers.length, 
          losers: data.topLosers.length 
        })
        
        setTopGainers(data.topGainers)
        setTopLosers(data.topLosers)
        setDataLoaded(true)
        
      } catch (err) {
        console.error('❌ Erro ao carregar dados:', err)
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
        setError(`Falha ao carregar dados: ${errorMessage}`)
      } finally {
        setIsLoading(false)
        console.log('✅ Busca finalizada')
      }
    }

    fetchData()
  }, [])

  console.log('🎯 Render - Loading:', isLoading, 'Error:', error, 'Gainers:', topGainers.length, 'Losers:', topLosers.length)

  if (isLoading) {
    return <div style={{ padding: '20px' }}>Carregando dados do mercado...</div>
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Erro: {error}</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Análise Simples de Mercado</h1>
      
      <div className="mb-6">
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-bold mb-2">Status:</h3>
          <p><strong>Carregando:</strong> {isLoading ? '⏳ SIM' : '✅ NÃO'}</p>
          <p><strong>Dados Carregados:</strong> {dataLoaded ? '✅ SIM' : '❌ NÃO'}</p>
          <p><strong>Erro:</strong> {error ? `❌ ${error}` : '✅ Nenhum'}</p>
          <p><strong>Ganhadores:</strong> {topGainers.length}</p>
          <p><strong>Perdedores:</strong> {topLosers.length}</p>
        </div>
      </div>
      
      {isLoading && (
        <div className="text-center py-8">
          <p className="text-lg">⏳ Carregando dados do mercado...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Erro:</strong> {error}
        </div>
      )}
      
      {dataLoaded && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 p-4 rounded">
            <h2 className="text-xl font-semibold mb-3 text-green-800">🚀 Maiores Ganhadores (24h)</h2>
            {topGainers.length > 0 ? (
              topGainers.map((token) => (
                <div key={token.id} className="p-3 bg-white border rounded mb-2 shadow-sm">
                  <div className="font-medium">{token.name} ({token.symbol.toUpperCase()})</div>
                  <div className="text-green-600 font-bold">+{token.priceChange24h.toFixed(2)}%</div>
                  <div className="text-sm text-gray-600">${token.currentPrice.toLocaleString()}</div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Nenhum ganhador encontrado</p>
            )}
          </div>
          
          <div className="bg-red-50 p-4 rounded">
            <h2 className="text-xl font-semibold mb-3 text-red-800">📉 Maiores Perdedores (24h)</h2>
            {topLosers.length > 0 ? (
              topLosers.map((token) => (
                <div key={token.id} className="p-3 bg-white border rounded mb-2 shadow-sm">
                  <div className="font-medium">{token.name} ({token.symbol.toUpperCase()})</div>
                  <div className="text-red-600 font-bold">{token.priceChange24h.toFixed(2)}%</div>
                  <div className="text-sm text-gray-600">${token.currentPrice.toLocaleString()}</div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Nenhum perdedor encontrado</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
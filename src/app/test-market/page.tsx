'use client'

import { useState, useEffect } from 'react'
import { getMarketAnalysisData, type MarketToken } from '@/lib/market-analysis'

export default function TestMarketPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🧪 Teste: Iniciando...')
    
    const fetchData = async () => {
      try {
        console.log('🧪 Teste: Chamando getMarketAnalysisData...')
        const result = await getMarketAnalysisData()
        console.log('🧪 Teste: Resultado:', result)
        setData(result)
      } catch (err) {
        console.error('🧪 Teste: Erro:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>

  return (
    <div style={{ padding: '20px' }}>
      <h1>Teste da API de Mercado</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
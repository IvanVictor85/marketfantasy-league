import { NextResponse } from 'next/server';
import type { MarketToken } from '@/lib/market-analysis';

export async function GET() {
  try {
    console.log('🔍 API Route: Buscando dados dos TOP 100 tokens da CoinGecko...');
    
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h,7d',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Market-Fantasy-League/1.0',
        },
        // Cache por 5 minutos
        next: { revalidate: 300 }
      }
    );

    console.log('📡 API Route: Resposta da API CoinGecko:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`Erro na API CoinGecko: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📊 API Route: Dados recebidos:', data.length, 'tokens');

    // Mapear os dados para o formato esperado com tipos explícitos
    const tokens: MarketToken[] = data.map((token: any): MarketToken => ({
      id: token.id,
      symbol: token.symbol.toUpperCase(),
      name: token.name,
      logoUrl: token.image,
      currentPrice: token.current_price,
      priceChange24h: token.price_change_percentage_24h || 0,
      priceChange7d: token.price_change_percentage_7d_in_currency || 0,
      marketCap: token.market_cap,
      volume24h: token.total_volume,
      rank: token.market_cap_rank ?? 0,
    }));

    console.log('🔍 API Route: Primeiro token mapeado:', tokens[0]);
    console.log('🔍 API Route: Tokens com ganho:', tokens.filter((t: MarketToken) => t.priceChange24h > 0).length);
    console.log('🔍 API Route: Tokens com queda:', tokens.filter((t: MarketToken) => t.priceChange24h < 0).length);

    return NextResponse.json({
      tokens,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ API Route: Erro ao obter dados de análise de mercado:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do mercado' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { mockTokens } from '@/lib/mock-data/tokens';



// Esta função irá lidar com requisições GET para /api/tokens
export async function GET() {
  try {
    // URL da API da CoinGecko para buscar os top 100 tokens por capitalização de mercado em USD
    // Incluindo price_change_percentage para obter dados de 1h, 24h, 7d e 30d
    const COINGECKO_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=1h,24h,7d,30d';

    try {
      // Faz a chamada para a API.
      // A opção 'next: { revalidate: 60 }' cria um cache que dura 60 segundos.
      // Isso evita que façamos chamadas excessivas para a API da CoinGecko a cada visita na página.
      const response = await fetch(COINGECKO_URL, {
        next: { revalidate: 60 },
      });

      // Se a resposta da CoinGecko não for bem-sucedida, usa dados mock
      if (!response.ok) {
        console.warn(`CoinGecko API não disponível. Status: ${response.status}. Usando dados mock.`);
        return NextResponse.json(await formatMockTokens());
      }

      // Converte a resposta para JSON
      const data = await response.json();

      // Mapeia os dados para o formato que nossa aplicação espera
      const formattedTokens = data.map((token: any) => {
        return {
          id: token.id,
          symbol: token.symbol.toUpperCase(),
          name: token.name,
          image: token.image,
          price: token.current_price || 0,
          change_1h: token.price_change_percentage_1h_in_currency || 0,
          change_24h: token.price_change_percentage_24h || 0,
          change_7d: token.price_change_percentage_7d_in_currency || 0,
          change_30d: token.price_change_percentage_30d_in_currency || 0,
          market_cap: token.market_cap || 0,
          volume_24h: token.total_volume || 0,
          rank: token.market_cap_rank || 999,
          circulating_supply: token.circulating_supply || 0,
          rarity: getRarityByMarketCap(token.market_cap_rank)
        };
      });

      // Retorna apenas os tokens da CoinGecko (sem xStocks)
      return NextResponse.json(formattedTokens);
    } catch (apiError) {
      console.warn('[API_FETCH_ERROR]', apiError);
      console.log('Usando dados mock devido a erro na API');
      return NextResponse.json(await formatMockTokens());
    }
  } catch (error) {
    // Em caso de erro, loga no console do servidor e retorna dados mock
    console.error('[API_TOKENS_ERROR]', error);
    return NextResponse.json(await formatMockTokens());
  }
}

// Função para formatar os dados mock no formato esperado pela aplicação
async function formatMockTokens() {
  // Formatar tokens mock
  const formattedMockTokens = mockTokens.map(token => {
    const change24h = token.price_change_percentage_24h || (Math.random() * 10 - 5);
    const change7d = token.price_change_percentage_7d || (Math.random() * 20 - 10);
    
    return {
      id: token.id,
      symbol: token.symbol,
      name: token.name,
      image: token.image,
      price: token.price,
      change_1h: 0,
      change_24h: change24h,
      change_7d: change7d,
      change_30d: 0,
      market_cap: token.market_cap,
      volume_24h: token.total_volume,
      rank: token.market_cap_rank,
      circulating_supply: 0,
      rarity: token.rarity
    };
  });

  // Retornar apenas tokens mock (sem xStocks)
  return formattedMockTokens;
}

// Função para determinar a raridade baseada no ranking de market cap
function getRarityByMarketCap(rank: number): 'legendary' | 'epic' | 'rare' | 'common' {
  if (rank <= 5) return 'legendary';
  if (rank <= 20) return 'epic';
  if (rank <= 50) return 'rare';
  return 'common';
}
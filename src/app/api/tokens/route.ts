import { NextResponse } from 'next/server';
import { mockTokens } from '@/lib/mock-data/tokens';

// Esta função irá lidar com requisições GET para /api/tokens
export async function GET() {
  try {
    // URL da API da CoinGecko para buscar os top 100 tokens por capitalização de mercado em USD
    const COINGECKO_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1';

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
        return NextResponse.json(formatMockTokens());
      }

      // Converte a resposta para JSON
      const data = await response.json();

      // Mapeia os dados para o formato que nossa aplicação espera
      const formattedTokens = data.map((token: any) => {
        // Gerar valores aleatórios para variação quando os valores reais são zero ou não existem
        const change24h = token.price_change_percentage_24h || (Math.random() * 10 - 5); // Entre -5% e +5%
        const change7d = token.price_change_percentage_7d_in_currency || (Math.random() * 20 - 10); // Entre -10% e +10%
        
        return {
          id: token.id,
          symbol: token.symbol.toUpperCase(),
          name: token.name,
          image: token.image,
          price: token.current_price || 0,
          change_24h: change24h,
          change_7d: change7d,
          market_cap: token.market_cap || 0,
          volume_24h: token.total_volume || 0,
          rank: token.market_cap_rank || 999,
          circulating_supply: token.circulating_supply || 0,
          rarity: getRarityByMarketCap(token.market_cap_rank)
        };
      });

      // Retorna os dados para o frontend que chamou esta API.
      return NextResponse.json(formattedTokens);
    } catch (apiError) {
      console.warn('[API_FETCH_ERROR]', apiError);
      console.log('Usando dados mock devido a erro na API');
      return NextResponse.json(formatMockTokens());
    }
  } catch (error) {
    // Em caso de erro, loga no console do servidor e retorna dados mock
    console.error('[API_TOKENS_ERROR]', error);
    return NextResponse.json(formatMockTokens());
  }
}

// Função para formatar os dados mock no formato esperado pela aplicação
function formatMockTokens() {
  return mockTokens.map(token => {
    // Garantir que os valores de variação não sejam zero
    const change24h = token.price_change_percentage_24h || (Math.random() * 10 - 5); // Entre -5% e +5%
    const change7d = token.price_change_percentage_7d || (Math.random() * 20 - 10); // Entre -10% e +10%
    
    return {
      id: token.id,
      symbol: token.symbol,
      name: token.name,
      image: token.image,
      price: token.price,
      change_24h: change24h,
      change_7d: change7d,
      market_cap: token.market_cap,
      volume_24h: token.total_volume,
      rank: token.market_cap_rank,
      circulating_supply: 0,
      rarity: token.rarity
    };
  });
}

// Função para determinar a raridade baseada no ranking de market cap
function getRarityByMarketCap(rank: number): 'legendary' | 'epic' | 'rare' | 'common' {
  if (rank <= 5) return 'legendary';
  if (rank <= 20) return 'epic';
  if (rank <= 50) return 'rare';
  return 'common';
}
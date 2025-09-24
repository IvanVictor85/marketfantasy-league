import { NextResponse } from 'next/server';

// Esta função irá lidar com requisições GET para /api/tokens
export async function GET() {
  try {
    // URL da API da CoinGecko para buscar os top 100 tokens por capitalização de mercado em USD
    const COINGECKO_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1';

    // Faz a chamada para a API.
    // A opção 'next: { revalidate: 60 }' cria um cache que dura 60 segundos.
    // Isso evita que façamos chamadas excessivas para a API da CoinGecko a cada visita na página.
    const response = await fetch(COINGECKO_URL, {
      next: { revalidate: 60 },
    });

    // Se a resposta da CoinGecko não for bem-sucedida, lança um erro.
    if (!response.ok) {
      throw new Error(`Failed to fetch token data. Status: ${response.status}`);
    }

    // Converte a resposta para JSON
    const data = await response.json();

    // Mapeia os dados para o formato que nossa aplicação espera
    const formattedTokens = data.map((token: any) => ({
      id: token.id,
      symbol: token.symbol.toUpperCase(),
      name: token.name,
      image: token.image,
      price: token.current_price,
      change_24h: token.price_change_percentage_24h,
      market_cap: token.market_cap,
      volume_24h: token.total_volume,
      rarity: getRarityByMarketCap(token.market_cap_rank)
    }));

    // Retorna os dados para o frontend que chamou esta API.
    return NextResponse.json(formattedTokens);

  } catch (error) {
    // Em caso de erro, loga no console do servidor e retorna uma resposta de erro.
    console.error('[API_TOKENS_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Função para determinar a raridade baseada no ranking de market cap
function getRarityByMarketCap(rank: number): 'legendary' | 'epic' | 'rare' | 'common' {
  if (rank <= 5) return 'legendary';
  if (rank <= 20) return 'epic';
  if (rank <= 50) return 'rare';
  return 'common';
}
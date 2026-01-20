import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Mapeamento de símbolos para IDs do CoinGecko
 */
const TOKEN_MAPPING: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'XRP': 'ripple',
  'DOGE': 'dogecoin',
  'ADA': 'cardano',
  'AVAX': 'avalanche-2',
  'SHIB': 'shiba-inu',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'AAVE': 'aave',
  'MATIC': 'matic-network',
  'POL': 'matic-network',
  'ATOM': 'cosmos',
  'FTM': 'fantom',
  'NEAR': 'near',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'ICP': 'internet-computer',
  'APT': 'aptos',
  'OP': 'optimism',
  'ARB': 'arbitrum',
  'LDO': 'lido-dao',
  'GRT': 'the-graph',
  'MKR': 'maker',
  'SNX': 'havven',
  'RUNE': 'thorchain',
  'INJ': 'injective-protocol',
  'ZEC': 'zcash',
  'HYPE': 'hyperliquid',
  'DASH': 'dash',
  'CRO': 'crypto-com-chain',
  'GT': 'gatetoken',
  'ASTER': 'aster-2',
  'CANTON': 'canton-network-token',
  'USDG': 'usdg',
  'KHYPE': 'khype'
};

/**
 * GET /api/markets
 *
 * Retorna dados de mercado atuais com variação 7d
 * Usado no dashboard para mostrar performance dos tokens
 */
export async function GET(request: Request) {
  try {
    console.log('📊 [MARKETS] Buscando dados de mercado...');

    // Buscar todos os token IDs do CoinGecko
    const tokenIds = Object.values(TOKEN_MAPPING).filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

    // ✅ Usar /coins/markets que inclui price_change_percentage_7d_in_currency
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${tokenIds.join(',')}&price_change_percentage=24h,7d`,
      {
        cache: 'no-store',
        next: { revalidate: 60 }, // Cache por 60 segundos para evitar rate limit
        headers: {
          'Accept': 'application/json'
        }
      }
    ).catch(err => {
      console.error('❌ [MARKETS] Erro de rede:', err);
      throw err;
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [MARKETS] Erro ao buscar do CoinGecko:', response.status, errorText);

      // Retornar dados vazios em vez de erro 500
      return NextResponse.json({
        success: true,
        tokens: [],
        total: 0,
        timestamp: new Date().toISOString(),
        error: `CoinGecko API error: ${response.status}`
      });
    }

    const marketsData = await response.json();
    console.log(`✅ [MARKETS] Dados obtidos de ${marketsData.length} tokens`);

    // Criar mapa de dados por coingeckoId
    const dataMap = new Map();
    marketsData.forEach((coin: any) => {
      dataMap.set(coin.id, coin);
    });

    // Formatar dados para retorno
    const tokens = Object.entries(TOKEN_MAPPING).map(([symbol, coingeckoId]) => {
      const data = dataMap.get(coingeckoId);

      if (!data) {
        console.warn(`⚠️ [MARKETS] Token ${symbol} (${coingeckoId}) não encontrado`);
        return {
          symbol,
          name: symbol,
          price: 0,
          priceChange24h: 0,
          priceChange7d: 0,
          imageUrl: ''
        };
      }

      return {
        symbol,
        name: data.name || symbol,
        price: data.current_price || 0,
        priceChange24h: data.price_change_percentage_24h || 0,
        priceChange7d: data.price_change_percentage_7d_in_currency || 0,
        imageUrl: data.image || `https://assets.coingecko.com/coins/images/${getImageId(coingeckoId)}/small/${coingeckoId}.png`
      };
    });

    return NextResponse.json({
      success: true,
      tokens,
      total: tokens.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [MARKETS] Erro:', error);

    // Retornar dados vazios em vez de erro 500 para não quebrar o frontend
    return NextResponse.json({
      success: true,
      tokens: [],
      total: 0,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Mapeia IDs do CoinGecko para IDs de imagem
 * Alguns tokens têm IDs diferentes para a API e para imagens
 */
function getImageId(coingeckoId: string): string {
  const imageMapping: Record<string, string> = {
    'bitcoin': '1',
    'ethereum': '279',
    'binancecoin': '825',
    'solana': '4128',
    'ripple': '44',
    'dogecoin': '5',
    'cardano': '975',
    'avalanche-2': '12559',
    'shiba-inu': '11939',
    'polkadot': '12171',
    'chainlink': '7598',
    'uniswap': '12504',
    'aave': '12645',
    'matic-network': '4713',
    'cosmos': '6783',
    'fantom': '4001',
    'near': '17980',
    'algorand': '4380',
    'vechain': '1167',
    'internet-computer': '14495',
    'aptos': '26455',
    'optimism': '25244',
    'arbitrum': '16547',
    'lido-dao': '13573',
    'the-graph': '13397',
    'maker': '1364',
    'havven': '3406',
    'thorchain': '6595',
    'injective-protocol': '12882',
    'zcash': '486',
    'hyperliquid': '38913',
    'dash': '63',
    'crypto-com-chain': '3635',
    'gatetoken': '8924'
  };

  return imageMapping[coingeckoId] || '1'; // Default to Bitcoin ID
}

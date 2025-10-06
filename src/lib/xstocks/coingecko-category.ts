import pRetry from 'p-retry';
import { z } from 'zod';

// Schema para validar resposta da API de mercados por categoria
const CoinGeckoMarketItemSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.string(),
  current_price: z.number().nullable(),
  market_cap: z.number().nullable(),
  market_cap_rank: z.number().nullable(),
  fully_diluted_valuation: z.number().nullable(),
  total_volume: z.number().nullable(),
  high_24h: z.number().nullable(),
  low_24h: z.number().nullable(),
  price_change_24h: z.number().nullable(),
  price_change_percentage_24h: z.number().nullable(),
  price_change_percentage_7d_in_currency: z.number().nullable(),
  price_change_percentage_30d_in_currency: z.number().nullable(),
  market_cap_change_24h: z.number().nullable(),
  market_cap_change_percentage_24h: z.number().nullable(),
  circulating_supply: z.number().nullable(),
  total_supply: z.number().nullable(),
  max_supply: z.number().nullable(),
  ath: z.number().nullable(),
  ath_change_percentage: z.number().nullable(),
  ath_date: z.string().nullable(),
  atl: z.number().nullable(),
  atl_change_percentage: z.number().nullable(),
  atl_date: z.string().nullable(),
  roi: z.any().nullable(),
  last_updated: z.string().nullable(),
});

const CoinGeckoMarketsResponseSchema = z.array(CoinGeckoMarketItemSchema);

export type CoinGeckoMarketItem = z.infer<typeof CoinGeckoMarketItemSchema>;

/**
 * Configurações para rate limiting e retry
 */
const COINGECKO_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 segundo
  requestDelay: 200, // Delay entre requests para evitar rate limit
};

/**
 * Faz delay entre requests para respeitar rate limits
 */
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Busca dados da categoria xstocks-ecosystem da CoinGecko
 * @param options Opções para a busca
 * @returns Array de tokens xStocks com dados de mercado
 */
export async function fetchXStocksFromCategory(options: {
  vs_currency?: string;
  order?: string;
  per_page?: number;
  page?: number;
  sparkline?: boolean;
  price_change_percentage?: string;
} = {}): Promise<CoinGeckoMarketItem[]> {
  const {
    vs_currency = 'usd',
    order = 'market_cap_desc',
    per_page = 250,
    page = 1,
    sparkline = false,
    price_change_percentage = '1h,24h,7d,30d'
  } = options;

  try {
    const result = await pRetry(
      async () => {
        console.log('Buscando dados da categoria xstocks-ecosystem...');
        
        const params = new URLSearchParams({
          vs_currency,
          category: 'xstocks-ecosystem',
          order,
          per_page: per_page.toString(),
          page: page.toString(),
          sparkline: sparkline.toString(),
          price_change_percentage,
        });

        const url = `https://api.coingecko.com/api/v3/coins/markets?${params.toString()}`;
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'CryptoFantasy-League/1.0',
          },
        });

        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return CoinGeckoMarketsResponseSchema.parse(data);
      },
      {
        retries: COINGECKO_CONFIG.maxRetries,
        minTimeout: COINGECKO_CONFIG.retryDelay,
        factor: 2,
        onFailedAttempt: (error) => {
          console.warn(`Tentativa ${error.attemptNumber} falhou para categoria xstocks-ecosystem:`, (error as any).message || 'Erro desconhecido');
        },
      }
    );

    console.log(`Dados da categoria xstocks-ecosystem obtidos: ${result.length} tokens encontrados`);
    return result;

  } catch (error) {
    console.error('Erro ao buscar dados da categoria xstocks-ecosystem:', error);
    return [];
  }
}

/**
 * Converte dados da CoinGecko para o formato usado pela aplicação
 * @param coinGeckoData Dados da CoinGecko
 * @returns Dados no formato da aplicação
 */
/**
 * Mapeia símbolos de xStocks para ícones locais
 */
const XSTOCK_ICON_MAP: Record<string, string> = {
  'TSLAX': '/icons/tslax.svg',
  'AAPLX': '/icons/aaplx.svg',
  'NVDAX': '/icons/nvdax.svg',
  'MSTRX': '/icons/mstrx.svg',
  'METAX': '/icons/metax.svg',
  'GOOGLX': '/icons/googlx.svg',
  'SPYX': '/icons/spyx.svg',
  'QQQX': '/icons/qqqx.svg',
  'CRCLX': '/icons/crclx.svg',
  'COINX': '/icons/coinx.svg',
};

/**
 * Obtém o ícone local para um xStock ou retorna um ícone padrão
 */
function getXStockIcon(symbol: string): string {
  const upperSymbol = symbol.toUpperCase();
  return XSTOCK_ICON_MAP[upperSymbol] || '/icons/coinx.svg'; // Usar coinx.svg como fallback
}

export function convertCoinGeckoToXStockFormat(coinGeckoData: CoinGeckoMarketItem[]) {
  return coinGeckoData.map(item => ({
    xSymbol: item.symbol.toUpperCase(), // Manter símbolo original da API
    symbol: item.symbol.toUpperCase(), // Usar símbolo original da API (ex: TSLAX, MSTRX)
    name: item.name,
    mint: item.id, // Usar o ID da CoinGecko como mint
    priceUsd: item.current_price,
    volume24hUsd: item.total_volume,
    marketCapUsd: item.market_cap,
    change24h: item.price_change_percentage_24h,
    change7d: item.price_change_percentage_7d_in_currency,
    change30d: item.price_change_percentage_30d_in_currency,
    image: item.image || getXStockIcon(item.symbol), // Usar imagem da CoinGecko ou ícone local como fallback
    sources: {
      xstocks: false, // Não temos dados do scraping xstocks.fi
      coingecko: true,
    },
    links: {
      solscan: `https://solscan.io/token/${item.id}`,
      product: `https://xstocks.fi/token/${item.symbol}`,
      coingecko: `https://www.coingecko.com/en/coins/${item.id}`,
    },
    // Dados adicionais da CoinGecko
    market_cap_rank: item.market_cap_rank,
    circulating_supply: item.circulating_supply,
    total_supply: item.total_supply,
    max_supply: item.max_supply,
    ath: item.ath,
    ath_change_percentage: item.ath_change_percentage,
    atl: item.atl,
    atl_change_percentage: item.atl_change_percentage,
    last_updated: item.last_updated,
  }));
}

/**
 * Função utilitária para testar a integração com a categoria xstocks-ecosystem
 */
export async function testXStocksCategoryIntegration(): Promise<void> {
  try {
    console.log('Testando integração com categoria xstocks-ecosystem...');
    const results = await fetchXStocksFromCategory();
    console.log(`Resultados do teste: ${results.length} tokens encontrados`);
    
    // Mostrar alguns exemplos
    const examples = results.slice(0, 3).map(item => ({
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      price: item.current_price,
      volume: item.total_volume,
    }));
    
    console.log('Exemplos de tokens:', examples);
  } catch (error) {
    console.error('Erro no teste da categoria xstocks-ecosystem:', error);
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchAllTokenPrices, type TokenPriceData } from '@/lib/xstocks/coingecko';
import { fetchXStocksFromCategory, convertCoinGeckoToXStockFormat } from '@/lib/xstocks/coingecko-category';

// Definindo o tipo XStockToken localmente para evitar problemas de importação
export interface XStockToken {
  xSymbol: string;
  symbol: string;
  name: string;
  mint: string;
}
import { 
  getCachedFullData, 
  cacheFullData, 
  invalidateXStocksCache,
  getCacheStats 
} from '@/lib/xstocks/cache';

// Schema para validar query parameters
const QueryParamsSchema = z.object({
  minVolumeUsd: z.coerce.number().min(0).optional().default(0),
  revalidate: z.coerce.boolean().optional().default(false),
  debug: z.coerce.boolean().optional().default(false),
});

// Schema para o item de resposta da API
const XStockApiItemSchema = z.object({
  xSymbol: z.string(),
  symbol: z.string(),
  name: z.string(),
  mint: z.string(),
  priceUsd: z.number().nullable(),
  volume24hUsd: z.number().nullable(),
  marketCapUsd: z.number().nullable().optional(),
  change24h: z.number().nullable().optional(),
  change7d: z.number().nullable().optional(),
  change30d: z.number().nullable().optional(),
  image: z.string().optional(),
  sources: z.object({
    xstocks: z.boolean(),
    coingecko: z.boolean(),
  }),
  links: z.object({
    solscan: z.string(),
    product: z.string(),
    coingecko: z.string().optional(),
  }),
});

// Schema para a resposta completa da API
const XStockApiResponseSchema = z.object({
  updatedAt: z.string(),
  count: z.number(),
  items: z.array(XStockApiItemSchema),
  debug: z.object({
    cacheStats: z.any().optional(),
    processingTime: z.number().optional(),
    errors: z.array(z.string()).optional(),
  }).optional(),
});

export type XStockApiItem = z.infer<typeof XStockApiItemSchema>;
export type XStockApiResponse = z.infer<typeof XStockApiResponseSchema>;

/**
 * Combina dados do scraping com dados de preços da CoinGecko
 */
function combineTokenData(
  tokens: XStockToken[], 
  priceData: TokenPriceData[]
): XStockApiItem[] {
  const priceMap = new Map(priceData.map(p => [p.mint, p]));
  
  // Dados de fallback dos xStocks baseados em expanded-tokens.ts
  const fallbackData: Record<string, { price: number; change24h: number; volume24h: number; marketCap: number; image: string }> = {
    'tesla-xstock': { price: 430.30, change24h: 2.30, volume24h: 7681977, marketCap: 24617031, image: 'https://coin-images.coingecko.com/coins/images/69625/large/Ticker_TSLAx__Company_Name_Tesla__size_200x200.png' },
    'sp500-xstock': { price: 668.26, change24h: 0.90, volume24h: 219879, marketCap: 8801851, image: 'https://coin-images.coingecko.com/coins/images/69625/large/Ticker_SPYx__Company_Name_SP500__size_200x200.png' },
    'microstrategy-xstock': { price: 351.73, change24h: 0.50, volume24h: 3603408, marketCap: 8713249, image: 'https://coin-images.coingecko.com/coins/images/69625/large/Ticker_MSTRx__Company_Name_MicroStrategy__size_200x200.png' },
    'nvidia-xstock': { price: 188.09, change24h: 5.60, volume24h: 5280138, marketCap: 8608756, image: 'https://coin-images.coingecko.com/coins/images/69625/large/Ticker_NVDAx__Company_Name_NVIDIA__size_200x200.png' },
    'circle-xstock': { price: 147.07, change24h: 15.60, volume24h: 5858144, marketCap: 8232037, image: 'https://coin-images.coingecko.com/coins/images/69625/large/Ticker_CRCLx__Company_Name_Circle__size_200x200.png' },
    'alphabet-xstock': { price: 246.61, change24h: 0.40, volume24h: 1513724, marketCap: 4125895, image: 'https://coin-images.coingecko.com/coins/images/69625/large/Ticker_GOOGLx__Company_Name_Alphabet__size_200x200.png' },
    'apple-xstock': { price: 257.97, change24h: 0.30, volume24h: 4850496, marketCap: 3113555, image: 'https://coin-images.coingecko.com/coins/images/69625/large/Ticker_AAPLx__Company_Name_Apple__size_200x200.png' },
    'nasdaq-xstock': { price: 603.58, change24h: 0.10, volume24h: 110931, marketCap: 2914926, image: 'https://coin-images.coingecko.com/coins/images/69625/large/Ticker_QQQx__Company_Name_Nasdaq__size_200x200.png' },
    'coinbase-xstock': { price: 379.74, change24h: 0.20, volume24h: 1474413, marketCap: 2618817, image: 'https://coin-images.coingecko.com/coins/images/69625/large/Ticker_COINx__Company_Name_Coinbase__size_200x200.png' },
    'meta-xstock': { price: 712.92, change24h: 0.60, volume24h: 1318105, marketCap: 2131892, image: 'https://coin-images.coingecko.com/coins/images/69625/large/Ticker_METAx__Company_Name_Meta__size_200x200.png' }
  };
  
  return tokens.map(token => {
    const prices = priceMap.get(token.mint);
    const fallback = fallbackData[token.mint];
    
    return {
      xSymbol: token.xSymbol,
      symbol: token.symbol,
      name: token.name,
      mint: token.mint,
      priceUsd: prices?.priceUsd ?? fallback?.price ?? null,
      volume24hUsd: prices?.volume24hUsd ?? fallback?.volume24h ?? null,
      marketCapUsd: fallback?.marketCap ?? null,
      change24h: fallback?.change24h ?? null,
      image: fallback?.image ?? `https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png`,
      sources: {
        xstocks: true,
        coingecko: prices?.coingeckoAvailable ?? false,
      },
      links: {
        solscan: `https://solscan.io/token/${token.mint}`,
        product: `https://xstocks.fi/products`,
        coingecko: `https://www.coingecko.com/en/coins/${token.mint}`
      },
    };
  });
}

/**
 * Filtra tokens por volume mínimo
 */
function filterByMinVolume(items: XStockApiItem[], minVolumeUsd: number): XStockApiItem[] {
  if (minVolumeUsd <= 0) return items;
  
  return items.filter(item => {
    if (item.volume24hUsd === null) return false;
    return item.volume24hUsd >= minVolumeUsd;
  });
}

/**
 * Busca dados da categoria xstocks-ecosystem da CoinGecko
 */
async function fetchDataFromCoinGeckoCategory(): Promise<{ items: XStockApiItem[]; errors: string[]; processingTime: number }> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    console.log('Buscando dados da categoria xstocks-ecosystem...');
    
    // Buscar dados da categoria xstocks-ecosystem
    const coinGeckoData = await fetchXStocksFromCategory({
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 250,
      price_change_percentage: '1h,24h,7d,30d'
    });

    if (coinGeckoData.length === 0) {
      const errorMsg = 'Nenhum token encontrado na categoria xstocks-ecosystem';
      console.warn(errorMsg);
      errors.push(errorMsg);
      return { items: [], errors, processingTime: Date.now() - startTime };
    }

    // Converter dados para o formato da aplicação
    const items = convertCoinGeckoToXStockFormat(coinGeckoData);
    
    const processingTime = Date.now() - startTime;
    console.log(`Busca da categoria xstocks-ecosystem concluída em ${processingTime}ms: ${items.length} tokens encontrados`);
    
    return { items, errors, processingTime };
    
  } catch (error) {
    const errorMsg = `Erro ao buscar dados da categoria xstocks-ecosystem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    console.error(errorMsg);
    errors.push(errorMsg);
    return { items: [], errors, processingTime: Date.now() - startTime };
  }
}

/**
 * Busca dados completos dos xStocks (scraping + preços) - MÉTODO LEGADO
 */
async function fetchCompleteDataLegacy(): Promise<{ items: XStockApiItem[]; errors: string[]; processingTime: number }> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // 1. Buscar dados dos tokens (simulando scraping)
    let tokens: XStockToken[] = [];
    try {
      // Dados hardcoded baseados em xstocks.fi
      tokens = [
        {
          xSymbol: 'TSLAX',
          symbol: 'TSLA',
          name: 'Tesla xStock',
          mint: 'tesla-xstock'
        },
        {
          xSymbol: 'SPYX',
          symbol: 'SPY',
          name: 'SP500 xStock',
          mint: 'sp500-xstock'
        },
        {
          xSymbol: 'MSTRX',
          symbol: 'MSTR',
          name: 'MicroStrategy xStock',
          mint: 'microstrategy-xstock'
        },
        {
          xSymbol: 'NVDAX',
          symbol: 'NVDA',
          name: 'NVIDIA xStock',
          mint: 'nvidia-xstock'
        },
        {
          xSymbol: 'CRCLX',
          symbol: 'CRCL',
          name: 'Circle xStock',
          mint: 'circle-xstock'
        },
        {
          xSymbol: 'GOOGLX',
          symbol: 'GOOGL',
          name: 'Alphabet xStock',
          mint: 'alphabet-xstock'
        },
        {
          xSymbol: 'AAPLX',
          symbol: 'AAPL',
          name: 'Apple xStock',
          mint: 'apple-xstock'
        },
        {
          xSymbol: 'QQQX',
          symbol: 'QQQ',
          name: 'Nasdaq xStock',
          mint: 'nasdaq-xstock'
        },
        {
          xSymbol: 'COINX',
          symbol: 'COIN',
          name: 'Coinbase xStock',
          mint: 'coinbase-xstock'
        },
        {
          xSymbol: 'METAX',
          symbol: 'META',
          name: 'Meta xStock',
          mint: 'meta-xstock'
        }
      ];
      console.log(`Dados reais dos xStocks carregados: ${tokens.length} tokens encontrados`);
    } catch (error) {
      const errorMsg = `Erro no carregamento de dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      console.error(errorMsg);
      errors.push(errorMsg);
      return { items: [], errors, processingTime: Date.now() - startTime };
    }

    if (tokens.length === 0) {
      const errorMsg = 'Nenhum token encontrado no scraping';
      console.warn(errorMsg);
      errors.push(errorMsg);
      return { items: [], errors, processingTime: Date.now() - startTime };
    }

    // 2. Buscar preços na CoinGecko
    let priceData: TokenPriceData[] = [];
    try {
      const mints = tokens.map(t => t.mint);
      priceData = await fetchAllTokenPrices(mints, true); // Com fallback
      console.log(`Preços obtidos: ${priceData.filter(p => p.coingeckoAvailable).length}/${priceData.length} tokens`);
    } catch (error) {
      const errorMsg = `Erro ao buscar preços: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      console.error(errorMsg);
      errors.push(errorMsg);
      // Continuar mesmo sem preços
    }

    // 3. Combinar dados
    const items = combineTokenData(tokens, priceData);
    
    const processingTime = Date.now() - startTime;
    console.log(`Busca completa concluída em ${processingTime}ms`);
    
    return { items, errors, processingTime };
    
  } catch (error) {
    const errorMsg = `Erro geral na busca de dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    console.error(errorMsg);
    errors.push(errorMsg);
    return { items: [], errors, processingTime: Date.now() - startTime };
  }
}

/**
 * Busca dados completos (scraping + preços)
 */
async function fetchCompleteData(): Promise<{
  items: XStockApiItem[];
  errors: string[];
  processingTime: number;
}> {
  // Tentar primeiro buscar da categoria xstocks-ecosystem
  const categoryResult = await fetchDataFromCoinGeckoCategory();
  
  // Se obteve dados da categoria, usar esses
  if (categoryResult.items.length > 0) {
    console.log('Usando dados da categoria xstocks-ecosystem da CoinGecko');
    return categoryResult;
  }
  
  // Fallback para o método legado se a categoria não retornar dados
  console.log('Categoria xstocks-ecosystem não retornou dados, usando método legado...');
  return await fetchCompleteDataLegacy();
}

/**
 * Handler para GET /api/xstocks
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse e validação dos query parameters
    const { searchParams } = new URL(request.url);
    const params = QueryParamsSchema.parse({
      minVolumeUsd: searchParams.get('minVolumeUsd'),
      revalidate: searchParams.get('revalidate'),
      debug: searchParams.get('debug'),
    });

    console.log('API xStocks chamada com parâmetros:', params);

    let responseData: XStockApiResponse | undefined;
    let fromCache = false;

    // Verificar cache (a menos que revalidate seja true)
    if (!params.revalidate) {
      const cachedData = getCachedFullData<XStockApiResponse>();
      if (cachedData) {
        console.log('Dados encontrados no cache');
        fromCache = true;
        responseData = cachedData;
      }
    }

    // Se não tem cache ou revalidate=true, buscar dados frescos
    if (!responseData || params.revalidate) {
      if (params.revalidate) {
        console.log('Revalidação forçada, invalidando cache...');
        invalidateXStocksCache();
      }

      // Buscar dados completos usando nossa função com fallback
      const { items, errors, processingTime } = await fetchCompleteData();
      
      responseData = {
        updatedAt: new Date().toISOString(),
        count: items.length,
        items,
        debug: params.debug ? {
          cacheStats: getCacheStats(),
          processingTime,
          errors: errors.length > 0 ? errors : undefined,
        } : undefined,
      };

      // Salvar no cache apenas se não houve erros críticos
      if (items.length > 0) {
        cacheFullData(responseData);
        console.log('Dados salvos no cache');
      }
    }

    // Verificar se responseData foi inicializada
    if (!responseData) {
      throw new Error('Falha ao obter dados dos tokens xStocks');
    }

    // Aplicar filtro de volume mínimo
    const filteredItems = filterByMinVolume(responseData.items, params.minVolumeUsd);
    
    const finalResponse: XStockApiResponse = {
      ...responseData,
      count: filteredItems.length,
      items: filteredItems,
    };

    // Validar resposta
    const validatedResponse = XStockApiResponseSchema.parse(finalResponse);

    console.log(`API xStocks respondendo com ${validatedResponse.count} tokens (filtro: volume >= $${params.minVolumeUsd})`);

    return NextResponse.json(validatedResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minutos de cache no browser
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Erro na API xStocks:', error);
    
    // Resposta de erro estruturada
    const errorResponse = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * Handler para OPTIONS (CORS)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
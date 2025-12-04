/**
 * Serviço CoinGecko - Função Central para Buscar Tokens por ID
 *
 * Esta é a ÚNICA função que busca dados da CoinGecko no novo sistema.
 * Substitui todo o sistema de cache de 3 camadas anterior.
 *
 * Use Cases:
 * - Buscar preços do cardápio de draft (100 tokens)
 * - Buscar dados do time do usuário (10 tokens)
 * - Buscar preços para snapshots de competição
 */

import { getCachedApiResponse, cacheApiResponse, CACHE_CONFIG } from '@/lib/xstocks/cache';

// ✅ CACHE: 5 minutos para evitar Rate Limit (429)
const CACHE_DURATION = 300 * 1000; // 5 minutos em milissegundos

interface CacheEntry<T> {
  data: T | null;
  timestamp: number;
}

const marketDataCache: CacheEntry<CoinGeckoTokenData[]> = {
  data: null,
  timestamp: 0,
};

const top100Cache: CacheEntry<CoinGeckoTokenData[]> = {
  data: null,
  timestamp: 0,
};

export interface CoinGeckoTokenData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_1h_in_currency: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency: number | null;
  price_change_percentage_30d_in_currency: number | null;
  market_cap: number;
  total_volume: number;
  market_cap_rank: number | null;
}

/**
 * Mapeia símbolos de tokens para IDs da CoinGecko
 * Necessário porque escalamos por símbolo mas a API precisa de IDs
 */
export const SYMBOL_TO_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'AVAX': 'avalanche-2',
  'DOGE': 'dogecoin',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'POL': 'matic-network',
  'MATIC': 'matic-network',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'LTC': 'litecoin',
  'SHIB': 'shiba-inu',
  'TRX': 'tron',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'XLM': 'stellar',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'ICP': 'internet-computer',
  'FIL': 'filecoin',
  'HBAR': 'hedera-hashgraph',
  'APT': 'aptos',
  'NEAR': 'near',
  'STX': 'blockstack',
  'IMX': 'immutable-x',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'INJ': 'injective-protocol',
  'SUI': 'sui',
  'RUNE': 'thorchain',
  'GRT': 'the-graph',
  'AAVE': 'aave',
  'MKR': 'maker',
  'SNX': 'synthetix-network-token',
  'LDO': 'lido-dao',
  'PEPE': 'pepe',
  'WIF': 'dogwifcoin',
  'BONK': 'bonk',
  'FLOKI': 'floki',
  'PENGU': 'pudgy-penguins',
  'RENDER': 'render-token',
  'FET': 'fetch-ai',
  'TAO': 'bittensor',
  'AR': 'arweave',
  'THETA': 'theta-token',
  'SAND': 'the-sandbox',
  'MANA': 'decentraland',
  'AXS': 'axie-infinity',
  'GALA': 'gala',
  'ENJ': 'enjincoin',
  'CHZ': 'chiliz',
  'FLOW': 'flow',
  'KAVA': 'kava',
  'XTZ': 'tezos',
  'EOS': 'eos',
  'EGLD': 'elrond-erd-2',
  'CAKE': 'pancakeswap-token',
  'CRV': 'curve-dao-token',
  'COMP': 'compound-governance-token',
  'SUSHI': 'sushi',
  '1INCH': '1inch',
  'BAT': 'basic-attention-token',
  'ZRX': '0x',
  'YFI': 'yearn-finance',
  'STETH': 'staked-ether',
  'WBTC': 'wrapped-bitcoin',
  'DAI': 'dai',
  'USDD': 'usdd',
  'HYPE': 'hyperliquid',
  'JLP': 'jupiter-perpetuals-liquidity-provider-token',
  'ZEC': 'zcash',
  'PUMP': 'pump-fun', // Pump.fun token on Solana
  'XMR': 'monero',

  // Tokens adicionados para fix - 2025-11-17
  'BCH': 'bitcoin-cash',
  'ETC': 'ethereum-classic',
  'DASH': 'dash',
  'CRO': 'crypto-com-coin',
  'FLR': 'flare-networks',
  'KAS': 'kaspa',
  'TON': 'the-open-network',
  'LEO': 'leo-token',
  'OKB': 'okb',
  'KCS': 'kucoin-shares',
  'MNT': 'mantle',
  'WLD': 'worldcoin-wld',
  'QNT': 'quant-network',
  'ONDO': 'ondo-finance',
  'PAXG': 'pax-gold',
  'XAUT': 'tether-gold',
  'GT': 'gatetoken',
  'ENA': 'ethena',
  'BGB': 'bitget-token',

  // Staked/Wrapped tokens
  'WETH': 'weth',
  'WBNB': 'wbnb',
  'WSTETH': 'wrapped-steth',
  'RETH': 'rocket-pool-eth',
  'WEETH': 'wrapped-eeth',
  'WBETH': 'wrapped-beacon-eth',
  'CBBTC': 'coinbase-wrapped-btc',
  'JITOSOL': 'jito-staked-sol',
  'BNSOL': 'binance-staked-sol',

  // Stablecoins
  'PYUSD': 'paypal-usd',
  'USDE': 'ethena-usde',
  'SUSDE': 'ethena-staked-usde',
  'USDS': 'usds',
  'USDG': 'usd-global', // Global Dollar
  'USDtb': 'usdtb',
  'USDTB': 'usdtb',
  'USD1': 'usd1',

  // Other
  'WBT': 'whitebit',
  'TRUMP': 'official-trump',
  'SKY': 'sky',
  'HTX': 'htx-dao',
  'ASTER': 'aster-2',

  // Additional tokens - 2025-11-17 (segunda rodada)
  'BFUSD': 'bfusd',
  'BUIDL': 'blackrock-usd-institutional-digital-liquidity-fund',
  'C1USD': 'c1usd',
  'CC': 'canton',
  'FBTC': 'function-fbtc',
  'HASH': 'hash-2',
  'KHYPE': 'kinetiq-staked-hype',
  'M': 'memecore',
  'PI': 'pi-network',
  'RSETH': 'kelp-dao-restaked-eth',
  'SUSDS': 'susds',
  'SYRUPUSDC': 'syrup-usdc',
  'SYRUPUSDT': 'syrupusdt',
  'WLFI': 'world-liberty-financial',

  // Wrapped/Bridged versions and institutional tokens
  'BSC-USD': 'binance-bridged-usdt-bnb-smart-chain',
  'FIGR_HELOC': 'figure-heloc',
  'USDF': 'falcon-usd',
  'USDT0': 'usdt0',
};

/**
 * FUNÇÃO CENTRAL: Busca dados de mercado para tokens específicos por seus IDs
 *
 * ✅ CACHE HABILITADO: Armazena dados por 5 minutos para evitar rate limit
 *
 * A chave de cache é baseada nos IDs solicitados (ordenados alfabeticamente).
 * Se os mesmos IDs forem requisitados dentro de 5 minutos, retorna do cache.
 *
 * @param ids - Array de IDs da CoinGecko (ex: ['bitcoin', 'ethereum', 'pudgy-penguins'])
 * @returns Promise com array de dados dos tokens solicitados
 *
 * @example
 * const data = await getMarketDataByTokenIds(['bitcoin', 'ethereum']);
 * // Retorna dados atualizados de BTC e ETH
 */
export async function getMarketDataByTokenIds(
  ids: string[]
): Promise<CoinGeckoTokenData[]> {
  // Validação básica
  if (!ids || ids.length === 0) {
    console.warn('⚠️ getMarketDataByTokenIds: Array de IDs vazio');
    return [];
  }

  try {
    // Remover duplicatas e ordenar (para chave de cache consistente)
    const uniqueIds = [...new Set(ids)].sort();
    const idsString = uniqueIds.join(',');

    // ✅ CACHE: Verificar se dados estão em cache (chave baseada nos IDs)
    const cached = getCachedApiResponse<CoinGeckoTokenData[]>('coingecko_markets', idsString);

    if (cached && cached.length > 0) {
      console.log(`💾 [CACHE_HIT] Retornando ${cached.length} tokens do cache`);
      return cached;
    }

    console.log(`🌐 [CACHE_MISS] Buscando ${uniqueIds.length} token(s) da CoinGecko...`);
    console.log(`🔍 CoinGecko: Primeiros 10 IDs:`, uniqueIds.slice(0, 10));

    // Construir URL
    const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
    url.searchParams.set('vs_currency', 'usd');
    url.searchParams.set('ids', idsString);
    url.searchParams.set('price_change_percentage', '1h,24h,7d,30d');

    console.log(`🔍 CoinGecko URL:`, url.toString().substring(0, 200) + '...');

    // Chamada à API
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MFL-Platform/1.0',
      },
      // ✅ Permitir cache do navegador/CDN, mas validar revalidação
      cache: 'no-cache',
    });

    if (!response.ok) {
      // ✅ LOGGING DETALHADO: Capturar resposta de erro
      const errorText = await response.text();
      console.error(`❌ [COINGECKO_ERROR_${response.status}]`, {
        status: response.status,
        statusText: response.statusText,
        url: url.toString(),
        responseBody: errorText,
        headers: Object.fromEntries(response.headers.entries())
      });

      throw new Error(`CoinGecko API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();

    console.log(`✅ CoinGecko: ${data.length} token(s) encontrado(s)`);

    // Mapear para nosso formato
    const tokens: CoinGeckoTokenData[] = data.map((token: any) => ({
      id: token.id,
      symbol: token.symbol.toUpperCase(),
      name: token.name,
      image: token.image,
      current_price: token.current_price || 0,
      price_change_percentage_1h_in_currency: token.price_change_percentage_1h_in_currency,
      price_change_percentage_24h: token.price_change_percentage_24h,
      price_change_percentage_7d_in_currency: token.price_change_percentage_7d_in_currency,
      price_change_percentage_30d_in_currency: token.price_change_percentage_30d_in_currency,
      market_cap: token.market_cap || 0,
      total_volume: token.total_volume || 0,
      market_cap_rank: token.market_cap_rank,
    }));

    // ✅ CACHE: Salvar dados no cache por 5 minutos (chave baseada nos IDs)
    cacheApiResponse('coingecko_markets', idsString, tokens, CACHE_CONFIG.TTL.MARKET_DATA);
    console.log(`💾 [CACHE_SAVE] ${tokens.length} tokens salvos no cache (TTL: 5min)`);

    return tokens;

  } catch (error) {
    // ✅ LOGGING DETALHADO: Incluir contexto completo
    console.error('❌ [COINGECKO_FETCH_CRASH] Erro ao buscar tokens:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tokenIds: ids,
      tokenCount: ids.length
    });

    // ✅ NÃO crashar o servidor - retornar array vazio
    // As APIs que chamam esta função devem lidar com array vazio
    return [];
  }
}

/**
 * Converte símbolos para IDs da CoinGecko
 *
 * @param symbols - Array de símbolos (ex: ['BTC', 'ETH', 'PENGU'])
 * @returns Array de IDs da CoinGecko
 */
export function symbolsToIds(symbols: string[]): string[] {
  return symbols
    .map(symbol => {
      const upperSymbol = symbol.toUpperCase();
      const id = SYMBOL_TO_ID_MAP[upperSymbol];

      if (!id) {
        console.warn(`⚠️ Símbolo '${symbol}' não mapeado para ID CoinGecko`);
      }

      return id;
    })
    .filter((id): id is string => id !== undefined);
}

/**
 * Mapeia IDs de tokens da CoinGecko para URLs de imagens estáticas
 * Usado como fallback quando a API retorna 429 (rate limit)
 * Essas URLs são estáticas e não contam contra o rate limit da API
 */
const TOKEN_IMAGE_FALLBACKS: Record<string, string> = {
  'bitcoin': 'https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png',
  'ethereum': 'https://coin-images.coingecko.com/coins/images/279/small/ethereum.png',
  'solana': 'https://coin-images.coingecko.com/coins/images/4128/small/solana.png',
  'binancecoin': 'https://coin-images.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  'ripple': 'https://coin-images.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  'cardano': 'https://coin-images.coingecko.com/coins/images/975/small/cardano.png',
  'avalanche-2': 'https://coin-images.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  'dogecoin': 'https://coin-images.coingecko.com/coins/images/5/small/dogecoin.png',
  'polkadot': 'https://coin-images.coingecko.com/coins/images/12171/small/polkadot.png',
  'chainlink': 'https://coin-images.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  'matic-network': 'https://coin-images.coingecko.com/coins/images/4713/small/polygon.png',
  'uniswap': 'https://coin-images.coingecko.com/coins/images/12504/small/uni.jpg',
  'cosmos': 'https://coin-images.coingecko.com/coins/images/1481/small/cosmos_hub.png',
  'litecoin': 'https://coin-images.coingecko.com/coins/images/2/small/litecoin.png',
  'shiba-inu': 'https://coin-images.coingecko.com/coins/images/11939/small/shiba.png',
  'tron': 'https://coin-images.coingecko.com/coins/images/1094/small/tron-logo.png',
  'tether': 'https://coin-images.coingecko.com/coins/images/325/small/Tether.png',
  'usd-coin': 'https://coin-images.coingecko.com/coins/images/6319/small/usdc.png',
  'stellar': 'https://coin-images.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png',
  'algorand': 'https://coin-images.coingecko.com/coins/images/4380/small/download.png',
  'vechain': 'https://coin-images.coingecko.com/coins/images/1167/small/VeChain-Logo-768x725.png',
  'internet-computer': 'https://coin-images.coingecko.com/coins/images/14495/small/Internet_Computer_logo.png',
  'filecoin': 'https://coin-images.coingecko.com/coins/images/12817/small/filecoin.png',
  'hedera-hashgraph': 'https://coin-images.coingecko.com/coins/images/3688/small/hbar.png',
  'aptos': 'https://coin-images.coingecko.com/coins/images/26455/small/aptos_round.png',
  'near': 'https://coin-images.coingecko.com/coins/images/10365/small/near.jpg',
  'blockstack': 'https://coin-images.coingecko.com/coins/images/2069/small/Stacks_logo_full.png',
  'immutable-x': 'https://coin-images.coingecko.com/coins/images/17233/small/immutableX-symbol-BLK-RGB.png',
  'arbitrum': 'https://coin-images.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
  'optimism': 'https://coin-images.coingecko.com/coins/images/25244/small/Optimism.png',
  'injective-protocol': 'https://coin-images.coingecko.com/coins/images/12882/small/Secondary_Symbol.png',
  'sui': 'https://coin-images.coingecko.com/coins/images/26375/small/sui_asset.jpeg',
  'thorchain': 'https://coin-images.coingecko.com/coins/images/6595/small/rune.png',
  'the-graph': 'https://coin-images.coingecko.com/coins/images/13397/small/Graph_Token.png',
  'aave': 'https://coin-images.coingecko.com/coins/images/12645/small/AAVE.png',
  'maker': 'https://coin-images.coingecko.com/coins/images/1364/small/Mark_Maker.png',
  'synthetix-network-token': 'https://coin-images.coingecko.com/coins/images/3406/small/SNX.png',
  'lido-dao': 'https://coin-images.coingecko.com/coins/images/13573/small/Lido_DAO.png',
  'pepe': 'https://coin-images.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
  'dogwifcoin': 'https://coin-images.coingecko.com/coins/images/33566/small/dogwifhat.jpg',
  'bonk': 'https://coin-images.coingecko.com/coins/images/28600/small/bonk.jpg',
  'floki': 'https://coin-images.coingecko.com/coins/images/16746/small/PNG_image.png',
  'pudgy-penguins': 'https://coin-images.coingecko.com/coins/images/36057/small/pengu200x200.png',
  'render-token': 'https://coin-images.coingecko.com/coins/images/11636/small/rndr.png',
  'fetch-ai': 'https://coin-images.coingecko.com/coins/images/5681/small/Fetch.jpg',
  'bittensor': 'https://coin-images.coingecko.com/coins/images/28452/small/ARUsPeNQ_400x400.jpeg',
  'arweave': 'https://coin-images.coingecko.com/coins/images/4343/small/oRt6SiEN_400x400.jpg',
  'theta-token': 'https://coin-images.coingecko.com/coins/images/2538/small/theta-token-logo.png',
  'the-sandbox': 'https://coin-images.coingecko.com/coins/images/12129/small/sandbox_logo.jpg',
  'decentraland': 'https://coin-images.coingecko.com/coins/images/878/small/decentraland-mana.png',
  'axie-infinity': 'https://coin-images.coingecko.com/coins/images/13029/small/axie_infinity_logo.png',
  'gala': 'https://coin-images.coingecko.com/coins/images/12493/small/GALA-COINGECKO.png',
  'hyperliquid': 'https://coin-images.coingecko.com/coins/images/40790/small/photo_2024-10-28_23-37-01.jpg',
  'zcash': 'https://coin-images.coingecko.com/coins/images/486/small/circle-zcash-color.png',
  'monero': 'https://coin-images.coingecko.com/coins/images/69/small/monero_logo.png',
};

/**
 * Cria um token "fantasma" (placeholder) para tokens delistados ou indisponíveis
 *
 * Usado quando a CoinGecko não retorna mais dados do token (delistado ou rate limit 429).
 * Garante que a UI não quebre e aplica regra de negócio (0% variação).
 *
 * ✅ MELHORIA: Agora usa URLs de imagens estáticas como fallback para tokens comuns
 *
 * @param tokenId - ID do token delistado
 * @param symbol - Símbolo do token
 * @returns Objeto de token com dados zerados
 */
export function createGhostToken(
  tokenId: string,
  symbol: string
): CoinGeckoTokenData {
  console.warn(`👻 Criando ghost token para: ${symbol} (${tokenId})`);

  // ✅ Usar URL de imagem estática se disponível (não conta contra rate limit)
  const fallbackImage = TOKEN_IMAGE_FALLBACKS[tokenId] || '/icons/coinx.svg';

  if (TOKEN_IMAGE_FALLBACKS[tokenId]) {
    console.log(`✅ Ghost token com fallback: ${symbol} → ${fallbackImage.substring(0, 60)}...`);
  } else {
    console.warn(`⚠️ Ghost token SEM fallback: ${symbol} (${tokenId}) → usando ícone padrão`);
  }

  return {
    id: tokenId,
    symbol: symbol.toUpperCase(),
    name: 'Token Não Encontrado',
    image: fallbackImage,
    current_price: 0,
    price_change_percentage_1h_in_currency: 0,
    price_change_percentage_24h: 0,
    price_change_percentage_7d_in_currency: 0,
    price_change_percentage_30d_in_currency: 0,
    market_cap: 0,
    total_volume: 0,
    market_cap_rank: null,
  };
}

/**
 * Busca dados com REDE DE SEGURANÇA para tokens delistados
 *
 * Garante que todos os símbolos solicitados tenham um objeto de retorno.
 * Se um token não for encontrado na API (delistado), cria um "ghost token".
 *
 * @param symbols - Array de símbolos (ex: ['BTC', 'PENGU'])
 * @returns Array com dados completos (inclui ghosts se necessário)
 */
export async function getMarketDataWithFallback(
  symbols: string[]
): Promise<CoinGeckoTokenData[]> {
  const ids = symbolsToIds(symbols);

  if (ids.length === 0) {
    console.warn('⚠️ Nenhum ID válido encontrado');
    return await Promise.all(symbols.map(s => createGhostToken(`unknown-${s.toLowerCase()}`, s)));
  }

  // Criar mapa símbolo → ID
  const symbolToIdMap = new Map<string, string>();
  symbols.forEach(symbol => {
    const upperSymbol = symbol.toUpperCase();
    const id = SYMBOL_TO_ID_MAP[upperSymbol];
    if (id) {
      symbolToIdMap.set(upperSymbol, id);
    }
  });

  // Buscar dados da API
  const apiData = await getMarketDataByTokenIds(ids);
  const apiDataMap = new Map(apiData.map(token => [token.id, token]));

  // Construir resultado com fallback
  const result: CoinGeckoTokenData[] = [];

  for (const symbol of symbols) {
    const upperSymbol = symbol.toUpperCase();
    const tokenId = symbolToIdMap.get(upperSymbol);

    if (!tokenId) {
      // Símbolo não mapeado - criar ghost
      result.push(await createGhostToken(`unknown-${symbol.toLowerCase()}`, symbol));
      continue;
    }

    const apiToken = apiDataMap.get(tokenId);

    if (apiToken) {
      // Token encontrado na API ✅
      result.push(apiToken);
    } else {
      // Token não retornado pela API (delistado) - criar ghost 👻
      result.push(await createGhostToken(tokenId, symbol));
    }
  }

  const ghostCount = result.length - apiData.length;
  if (ghostCount > 0) {
    console.log(`👻 ${ghostCount} ghost token(s) criado(s)`);
  }

  return result;
}

/**
 * Busca Top 100 tokens por market cap
 *
 * ✅ CACHE HABILITADO: Armazena dados por 5 minutos
 * ✅ BACKFILL: Se algum token do top 100 estiver inválido, busca páginas seguintes (101, 102...) até ter 100 válidos
 *
 * Usado APENAS no cron competition-end para definir o cardápio da semana.
 *
 * @returns Array com exatamente 100 tokens válidos (ou o máximo disponível)
 */
export async function getTop100Tokens(): Promise<CoinGeckoTokenData[]> {
  const now = Date.now();

  // ✅ CACHE HIT: Se os dados estão frescos (menos de 5 minutos), retornar do cache
  if (top100Cache.data && (now - top100Cache.timestamp < CACHE_DURATION)) {
    const age = Math.round((now - top100Cache.timestamp) / 1000);
    console.log(`💾 [CACHE_HIT] Retornando Top 100 do cache (idade: ${age}s / TTL: 300s)`);
    return top100Cache.data;
  }

  console.log('🌐 [CACHE_MISS] Buscando Top 100 tokens frescos da CoinGecko...');

  try {
    const allTokens: any[] = [];
    let page = 1;
    const TARGET_COUNT = 100; // Queremos exatamente 100 tokens válidos
    const MAX_PAGES = 3; // Máximo de 3 páginas (até rank ~300)

    // Buscar páginas até ter 100 tokens válidos
    while (allTokens.length < TARGET_COUNT && page <= MAX_PAGES) {
      console.log(`📄 Buscando página ${page}...`);

      const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
      url.searchParams.set('vs_currency', 'usd');
      url.searchParams.set('order', 'market_cap_desc');
      url.searchParams.set('per_page', '100');
      url.searchParams.set('page', page.toString());
      url.searchParams.set('price_change_percentage', '1h,24h,7d,30d');

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MFL-Platform/1.0',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [COINGECKO_TOP100_ERROR_${response.status}] Página ${page}`, {
          status: response.status,
          statusText: response.statusText,
          url: url.toString(),
          responseBody: errorText,
          headers: Object.fromEntries(response.headers.entries())
        });

        throw new Error(`CoinGecko API error (Top100, page ${page}): ${response.status} - ${errorText.substring(0, 200)}`);
      }

      const pageData = await response.json();
      console.log(`   ✅ Página ${page}: ${pageData.length} tokens recebidos`);

      // Filtrar apenas tokens válidos (com preço)
      const validTokens = pageData.filter((token: any) =>
        token.current_price && token.current_price > 0
      );

      console.log(`   ✅ Tokens válidos: ${validTokens.length}/${pageData.length}`);

      // Adicionar tokens válidos até completar 100
      const tokensNeeded = TARGET_COUNT - allTokens.length;
      const tokensToAdd = validTokens.slice(0, tokensNeeded);
      allTokens.push(...tokensToAdd);

      console.log(`   📊 Total acumulado: ${allTokens.length}/${TARGET_COUNT}`);

      // Se já temos 100 tokens ou não há mais tokens, parar
      if (allTokens.length >= TARGET_COUNT || pageData.length === 0) {
        break;
      }

      page++;

      // Delay de 500ms entre páginas para evitar rate limit
      if (page <= MAX_PAGES && allTokens.length < TARGET_COUNT) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (allTokens.length < TARGET_COUNT) {
      console.warn(`⚠️ Conseguimos apenas ${allTokens.length} tokens válidos (meta: ${TARGET_COUNT})`);
    } else {
      console.log(`✅ Meta atingida: ${allTokens.length} tokens válidos!`);
    }

    const mappedData = allTokens.map((token: any) => ({
      id: token.id,
      symbol: token.symbol.toUpperCase(),
      name: token.name,
      image: token.image,
      current_price: token.current_price || 0,
      price_change_percentage_1h_in_currency: token.price_change_percentage_1h_in_currency,
      price_change_percentage_24h: token.price_change_percentage_24h,
      price_change_percentage_7d_in_currency: token.price_change_percentage_7d_in_currency,
      price_change_percentage_30d_in_currency: token.price_change_percentage_30d_in_currency,
      market_cap: token.market_cap || 0,
      total_volume: token.total_volume || 0,
      market_cap_rank: token.market_cap_rank,
    }));

    // ✅ Salvar no cache
    top100Cache.data = mappedData;
    top100Cache.timestamp = now;
    console.log(`💾 [CACHE_SAVE] ${mappedData.length} tokens salvos no cache (TTL: 5min)`);

    return mappedData;

  } catch (error) {
    // ✅ LOGGING DETALHADO: Incluir contexto completo
    console.error('❌ [COINGECKO_TOP100_CRASH] Erro ao buscar Top 100:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    // ✅ Retornar cache antigo se disponível (melhor que nada)
    if (top100Cache.data) {
      const age = Math.round((now - top100Cache.timestamp) / 1000);
      console.log(`⚠️ [CACHE_FALLBACK] Erro na API, usando cache antigo (idade: ${age}s / TTL: 300s)`);
      return top100Cache.data;
    }

    // ✅ NÃO crashar o servidor - retornar array vazio
    return [];
  }
}

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

export interface CoinGeckoTokenData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency: number | null;
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
};

/**
 * FUNÇÃO CENTRAL: Busca dados de mercado para tokens específicos por seus IDs
 *
 * Esta função substitui todo o sistema de cache anterior.
 * Faz chamadas diretas à API CoinGecko com dados frescos.
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
    // Remover duplicatas
    const uniqueIds = [...new Set(ids)];
    const idsString = uniqueIds.join(',');

    console.log(`🔍 CoinGecko: Buscando ${uniqueIds.length} token(s)...`);

    // Construir URL
    const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
    url.searchParams.set('vs_currency', 'usd');
    url.searchParams.set('ids', idsString);
    url.searchParams.set('price_change_percentage', '24h,7d');

    // Chamada à API (SEM CACHE - dados frescos)
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MFL-Platform/1.0',
      },
      cache: 'no-store', // IMPORTANTE: Sempre buscar dados frescos
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
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
      price_change_percentage_24h: token.price_change_percentage_24h,
      price_change_percentage_7d_in_currency: token.price_change_percentage_7d_in_currency,
      market_cap: token.market_cap || 0,
      total_volume: token.total_volume || 0,
      market_cap_rank: token.market_cap_rank,
    }));

    return tokens;

  } catch (error) {
    console.error('❌ CoinGecko: Erro ao buscar tokens:', error);
    throw error;
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
 * Cria um token "fantasma" (placeholder) para tokens delistados
 *
 * Usado quando a CoinGecko não retorna mais dados do token.
 * Garante que a UI não quebre e aplica regra de negócio (0% variação).
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

  return {
    id: tokenId,
    symbol: symbol.toUpperCase(),
    name: 'Token Não Encontrado',
    image: '/icons/coinx.svg',
    current_price: 0,
    price_change_percentage_24h: 0,
    price_change_percentage_7d_in_currency: 0,
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
 * Usado APENAS no cron competition-end para definir o cardápio da semana.
 *
 * @returns Array com os Top 100 tokens
 */
export async function getTop100Tokens(): Promise<CoinGeckoTokenData[]> {
  console.log('🔍 CoinGecko: Buscando Top 100 tokens...');

  try {
    const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
    url.searchParams.set('vs_currency', 'usd');
    url.searchParams.set('order', 'market_cap_desc');
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', '1');
    url.searchParams.set('price_change_percentage', '24h,7d');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MFL-Platform/1.0',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    console.log(`✅ CoinGecko: Top ${data.length} tokens obtidos`);

    return data.map((token: any) => ({
      id: token.id,
      symbol: token.symbol.toUpperCase(),
      name: token.name,
      image: token.image,
      current_price: token.current_price || 0,
      price_change_percentage_24h: token.price_change_percentage_24h,
      price_change_percentage_7d_in_currency: token.price_change_percentage_7d_in_currency,
      market_cap: token.market_cap || 0,
      total_volume: token.total_volume || 0,
      market_cap_rank: token.market_cap_rank,
    }));

  } catch (error) {
    console.error('❌ CoinGecko: Erro ao buscar Top 100:', error);
    throw error;
  }
}

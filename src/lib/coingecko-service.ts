interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  price_change_percentage_30d: number;
}

interface CoinGeckoResponse {
  data: CoinGeckoCoin[];
}

export interface TokenPriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  change30d: number;
  marketCap: number;
  rank: number;
  logoUrl: string;
}

export class CoinGeckoService {
  private static readonly BASE_URL = 'https://api.coingecko.com/api/v3';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static priceCache = new Map<string, { data: TokenPriceData[], timestamp: number }>();

  /**
   * Busca dados de preços para múltiplos tokens
   */
  static async getTokenPrices(symbols: string[]): Promise<TokenPriceData[]> {
    try {
      // Verificar cache primeiro
      const cacheKey = symbols.sort().join(',');
      const cached = this.priceCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('📊 [CoinGecko] Using cached data for symbols:', symbols);
        return cached.data;
      }

      console.log('📊 [CoinGecko] Fetching fresh data for symbols:', symbols);

      // Mapear símbolos para IDs do CoinGecko
      const coinIds = this.mapSymbolsToCoinIds(symbols);
      
      if (coinIds.length === 0) {
        console.warn('⚠️ [CoinGecko] No valid coin IDs found for symbols:', symbols);
        return [];
      }

      const url = `${this.BASE_URL}/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d,30d`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoFantasyLeague/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data: CoinGeckoCoin[] = await response.json();
      
      const tokenData: TokenPriceData[] = data.map(coin => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h || 0,
        change7d: coin.price_change_percentage_7d || 0,
        change30d: coin.price_change_percentage_30d || 0,
        marketCap: coin.market_cap || 0,
        rank: coin.market_cap_rank || 999999,
        logoUrl: coin.image
      }));

      // Salvar no cache
      this.priceCache.set(cacheKey, {
        data: tokenData,
        timestamp: Date.now()
      });

      console.log('✅ [CoinGecko] Successfully fetched data for', tokenData.length, 'tokens');
      return tokenData;

    } catch (error) {
      console.error('❌ [CoinGecko] Error fetching token prices:', error);
      
      // Retornar dados simulados em caso de erro
      return this.getSimulatedData(symbols);
    }
  }

  /**
   * Calcula pontuação de performance para um token
   */
  static calculateTokenScore(priceData: TokenPriceData, weight24h = 0.5, weight7d = 0.3, weight30d = 0.2): number {
    const score24h = Math.max(0, priceData.change24h);
    const score7d = Math.max(0, priceData.change7d);
    const score30d = Math.max(0, priceData.change30d);
    
    return (score24h * weight24h) + (score7d * weight7d) + (score30d * weight30d);
  }

  /**
   * Calcula pontuação total de um time
   */
  static calculateTeamScore(tokenPrices: TokenPriceData[]): number {
    if (tokenPrices.length === 0) return 0;
    
    const totalScore = tokenPrices.reduce((sum, token) => {
      return sum + this.calculateTokenScore(token);
    }, 0);
    
    return Math.round(totalScore * 100) / 100; // Arredondar para 2 casas decimais
  }

  /**
   * Mapeia símbolos de tokens para IDs do CoinGecko
   */
  private static mapSymbolsToCoinIds(symbols: string[]): string[] {
    const symbolToIdMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'MATIC': 'matic-network',
      'AVAX': 'avalanche-2',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'AAVE': 'aave',
      'CRV': 'curve-dao-token',
      'COMP': 'compound-governance-token',
      'MKR': 'maker',
      'SNX': 'havven',
      'YFI': 'yearn-finance',
      'SUSHI': 'sushi',
      '1INCH': '1inch',
      'BAL': 'balancer',
      'LRC': 'loopring',
      'ZRX': '0x',
      'BAT': 'basic-attention-token',
      'ENJ': 'enjincoin',
      'MANA': 'decentraland',
      'SAND': 'the-sandbox',
      'AXS': 'axie-infinity',
      'CHZ': 'chiliz',
      'FLOW': 'flow',
      'THETA': 'theta-token',
      'FIL': 'filecoin',
      'ICP': 'internet-computer',
      'VET': 'vechain',
      'TRX': 'tron',
      'XRP': 'ripple',
      'LTC': 'litecoin',
      'BCH': 'bitcoin-cash',
      'DOGE': 'dogecoin',
      'SHIB': 'shiba-inu',
      'PEPE': 'pepe',
      'FLOKI': 'floki',
      'BONK': 'bonk',
      'WIF': 'dogwifcoin',
      'BOME': 'book-of-meme',
      'POPCAT': 'popcat',
      'MEW': 'cat-in-a-dogs-world',
      'MYRO': 'myro',
      'RAY': 'raydium',
      'JUP': 'jupiter-exchange-solana',
      'ORCA': 'orca',
      'SRM': 'serum',
      'MNGO': 'mango-markets',
      'STEP': 'step-finance',
      'COPE': 'cope',
      'ROPE': 'rope-token',
      'FIDA': 'bonfida',
      'KIN': 'kin',
      'MAPS': 'maps',
      'OXY': 'oxygen',
      'PORT': 'port-finance',
      'TULIP': 'tulip-protocol',
      'SLIM': 'solanium',
      'ATLAS': 'star-atlas',
      'POLIS': 'star-atlas-dao',
      'GST': 'green-satoshi-token',
      'GMT': 'stepn',
      'SAMO': 'samoyedcoin',
      'SLND': 'solend',
      'MNDE': 'marinade',
      'LARIX': 'larix',
      'PRISM': 'prism',
      'LIQ': 'liq-protocol',
      'STEPN': 'stepn',
      'GARI': 'gari-network',
      'C98': 'coin98',
      'HXRO': 'hxro',
      'MEDIA': 'media-network'
    };

    return symbols
      .map(symbol => symbolToIdMap[symbol.toUpperCase()])
      .filter(Boolean);
  }

  /**
   * Retorna dados simulados em caso de erro na API
   */
  private static getSimulatedData(symbols: string[]): TokenPriceData[] {
    console.log('🎭 [CoinGecko] Using simulated data for symbols:', symbols);
    
    return symbols.map(symbol => ({
      symbol: symbol.toUpperCase(),
      name: `${symbol} Token`,
      price: Math.random() * 1000 + 1,
      change24h: (Math.random() - 0.5) * 20, // -10% a +10%
      change7d: (Math.random() - 0.5) * 40,  // -20% a +20%
      change30d: (Math.random() - 0.5) * 60, // -30% a +30%
      marketCap: Math.random() * 1000000000,
      rank: Math.floor(Math.random() * 1000) + 1,
      logoUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${symbol}`
    }));
  }

  /**
   * Limpa o cache de preços
   */
  static clearCache(): void {
    this.priceCache.clear();
    console.log('🧹 [CoinGecko] Cache cleared');
  }

  /**
   * Obtém estatísticas do cache
   */
  static getCacheStats(): { size: number, keys: string[] } {
    return {
      size: this.priceCache.size,
      keys: Array.from(this.priceCache.keys())
    };
  }
}

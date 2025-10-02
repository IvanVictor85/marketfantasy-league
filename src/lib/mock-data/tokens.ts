export interface Token {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  total_volume: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  performance_score: number;
  price: number;
}

export const mockTokens: Token[] = [
  // Top cryptocurrencies from CoinMarketCap
  {
    id: 'tether',
    symbol: 'USDT',
    name: 'Tether',
    image: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    current_price: 1.00,
    market_cap: 95000000000,
    market_cap_rank: 3,
    price_change_percentage_24h: 0.01,
    price_change_percentage_7d: 0.02,
    total_volume: 45000000000,
    rarity: 'common',
    performance_score: 85,
    price: 1.00
  },
  {
    id: 'usd-coin',
    symbol: 'USDC',
    name: 'USD Coin',
    image: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    current_price: 1.00,
    market_cap: 32000000000,
    market_cap_rank: 6,
    price_change_percentage_24h: -0.02,
    price_change_percentage_7d: 0.01,
    total_volume: 8500000000,
    rarity: 'common',
    performance_score: 88,
    price: 1.00
  },
  {
    id: 'binance-usd',
    symbol: 'BUSD',
    name: 'Binance USD',
    image: 'https://assets.coingecko.com/coins/images/9576/small/BUSD.png',
    current_price: 1.00,
    market_cap: 5200000000,
    market_cap_rank: 15,
    price_change_percentage_24h: -0.01,
    price_change_percentage_7d: 0.03,
    total_volume: 2100000000,
    rarity: 'rare',
    performance_score: 82,
    price: 1.00
  },

  // Large Cap Cryptocurrencies
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    current_price: 43250.00,
    market_cap: 850000000000,
    market_cap_rank: 1,
    price_change_percentage_24h: 2.5,
    price_change_percentage_7d: 8.2,
    total_volume: 25000000000,
    rarity: 'legendary',
    performance_score: 95,
    price: 43250.00
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    current_price: 2650.00,
    market_cap: 320000000000,
    market_cap_rank: 2,
    price_change_percentage_24h: 3.2,
    price_change_percentage_7d: 12.5,
    total_volume: 18000000000,
    rarity: 'legendary',
    performance_score: 92,
    price: 2650.00
  },
  {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB',
    image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    current_price: 315.50,
    market_cap: 47000000000,
    market_cap_rank: 4,
    price_change_percentage_24h: 1.8,
    price_change_percentage_7d: 6.3,
    total_volume: 1200000000,
    rarity: 'epic',
    performance_score: 87,
    price: 315.50
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    current_price: 98.75,
    market_cap: 42000000000,
    market_cap_rank: 5,
    price_change_percentage_24h: 4.1,
    price_change_percentage_7d: 15.8,
    total_volume: 3500000000,
    rarity: 'epic',
    performance_score: 89,
    price: 98.75
  },

  // Mid Cap Growth Tokens
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    image: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
    current_price: 0.52,
    market_cap: 18000000000,
    market_cap_rank: 8,
    price_change_percentage_24h: 2.8,
    price_change_percentage_7d: 9.4,
    total_volume: 850000000,
    rarity: 'rare',
    performance_score: 78,
    price: 0.52
  },
  {
    id: 'avalanche-2',
    symbol: 'AVAX',
    name: 'Avalanche',
    image: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
    current_price: 38.25,
    market_cap: 14000000000,
    market_cap_rank: 10,
    price_change_percentage_24h: 5.2,
    price_change_percentage_7d: 18.7,
    total_volume: 650000000,
    rarity: 'rare',
    performance_score: 81,
    price: 38.25
  },
  {
    id: 'polygon',
    symbol: 'MATIC',
    name: 'Polygon',
    image: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
    current_price: 0.89,
    market_cap: 8500000000,
    market_cap_rank: 12,
    price_change_percentage_24h: 3.6,
    price_change_percentage_7d: 11.2,
    total_volume: 420000000,
    rarity: 'rare',
    performance_score: 76,
    price: 0.89
  },
  {
    id: 'chainlink',
    symbol: 'LINK',
    name: 'Chainlink',
    image: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
    current_price: 14.85,
    market_cap: 8200000000,
    market_cap_rank: 13,
    price_change_percentage_24h: 2.1,
    price_change_percentage_7d: 7.8,
    total_volume: 380000000,
    rarity: 'rare',
    performance_score: 79,
    price: 14.85
  },

  // High Risk, High Reward Tokens
  {
    id: 'shiba-inu',
    symbol: 'SHIB',
    name: 'Shiba Inu',
    image: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
    current_price: 0.000024,
    market_cap: 14200000000,
    market_cap_rank: 11,
    price_change_percentage_24h: 8.5,
    price_change_percentage_7d: 25.3,
    total_volume: 1200000000,
    rarity: 'epic',
    performance_score: 72,
    price: 0.000024
  },
  {
    id: 'dogecoin',
    symbol: 'DOGE',
    name: 'Dogecoin',
    image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
    current_price: 0.085,
    market_cap: 12000000000,
    market_cap_rank: 9,
    price_change_percentage_24h: 6.2,
    price_change_percentage_7d: 22.1,
    total_volume: 950000000,
    rarity: 'rare',
    performance_score: 74,
    price: 0.085
  },
  {
    id: 'apecoin',
    symbol: 'APE',
    name: 'ApeCoin',
    image: 'https://assets.coingecko.com/coins/images/24383/small/apecoin.jpg',
    current_price: 1.45,
    market_cap: 650000000,
    market_cap_rank: 45,
    price_change_percentage_24h: 12.8,
    price_change_percentage_7d: 35.6,
    total_volume: 180000000,
    rarity: 'epic',
    performance_score: 68,
    price: 1.45
  },
  {
    id: 'pepe',
    symbol: 'PEPE',
    name: 'Pepe',
    image: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
    current_price: 0.00000185,
    market_cap: 780000000,
    market_cap_rank: 38,
    price_change_percentage_24h: 15.2,
    price_change_percentage_7d: 42.8,
    total_volume: 320000000,
    rarity: 'legendary',
    performance_score: 65,
    price: 0.00000185
  },
  {
    id: 'floki',
    symbol: 'FLOKI',
    name: 'FLOKI',
    image: 'https://assets.coingecko.com/coins/images/16746/small/PNG_image.png',
    current_price: 0.000045,
    market_cap: 430000000,
    market_cap_rank: 62,
    price_change_percentage_24h: 18.7,
    price_change_percentage_7d: 48.3,
    total_volume: 85000000,
    rarity: 'legendary',
    performance_score: 62,
    price: 0.000045
  },
  {
    id: 'bonk',
    symbol: 'BONK',
    name: 'Bonk',
    image: 'https://assets.coingecko.com/coins/images/28600/small/bonk.jpg',
    current_price: 0.0000125,
    market_cap: 820000000,
    market_cap_rank: 35,
    price_change_percentage_24h: 22.4,
    price_change_percentage_7d: 55.7,
    total_volume: 240000000,
    rarity: 'legendary',
    performance_score: 58,
    price: 0.0000125
  }
];

// Helper functions
export const getTokensByRarity = (rarity: Token['rarity']): Token[] => {
  return mockTokens.filter(token => token.rarity === rarity);
};

export const getTokenById = (id: string): Token | undefined => {
  return mockTokens.find(token => token.id === id);
};

export const getTopPerformers = (limit: number = 5): Token[] => {
  return [...mockTokens]
    .sort((a, b) => b.price_change_percentage_7d - a.price_change_percentage_7d)
    .slice(0, limit);
};

export const getWorstPerformers = (limit: number = 5): Token[] => {
  return [...mockTokens]
    .sort((a, b) => a.price_change_percentage_7d - b.price_change_percentage_7d)
    .slice(0, limit);
};
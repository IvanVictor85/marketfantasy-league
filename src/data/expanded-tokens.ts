export interface TokenMarketData {
  id: string;
  rank: number;
  name: string;
  symbol: string;
  image: string;
  price: number;
  change_5m: number;
  change_15m: number;
  change_30m: number;
  change_1h: number;
  change_4h: number;
  change_12h: number;
  change_24h: number;
  change_1d: number;
  change_1w: number;
  change_7d: number;
  market_cap: number;
  volume_24h: number;
  circulating_supply: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

// Helper function to generate deterministic price changes
const generateRandomChange = (base: number, variance: number, seed: number = 0) => {
  // Use a simple deterministic function based on seed
  const pseudoRandom = (Math.sin(seed * 12.9898) * 43758.5453) % 1;
  return base + (pseudoRandom - 0.5) * variance;
};

// Expanded mock data with 100 tokens
const baseTokens: TokenMarketData[] = [
  // Top 20 tokens with complete data
  {
    id: '1',
    rank: 1,
    name: 'Bitcoin',
    symbol: 'BTC',
    image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    price: 112717.22,
    change_5m: 0.12,
    change_15m: -0.25,
    change_30m: 0.08,
    change_1h: -0.04,
    change_4h: -1.15,
    change_12h: -1.89,
    change_24h: -2.27,
    change_1d: -2.27,
    change_1w: -2.30,
    change_7d: -2.30,
    market_cap: 2234567890000,
    volume_24h: 45678901234,
    circulating_supply: 19800000,
    rarity: 'legendary'
  },
  {
    id: '2',
    rank: 2,
    name: 'Ethereum',
    symbol: 'ETH',
    image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    price: 4208.85,
    change_5m: 0.08,
    change_15m: 0.22,
    change_30m: 0.15,
    change_1h: 0.35,
    change_4h: -2.12,
    change_12h: -3.45,
    change_24h: -5.41,
    change_1d: -5.41,
    change_1w: -6.94,
    change_7d: -6.94,
    market_cap: 506789012345,
    volume_24h: 23456789012,
    circulating_supply: 120400000,
    rarity: 'legendary'
  },
  {
    id: '3',
    rank: 3,
    name: 'Tether',
    symbol: 'USDT',
    image: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    price: 1.00,
    change_5m: 0.00,
    change_15m: 0.00,
    change_30m: 0.00,
    change_1h: 0.00,
    change_4h: 0.01,
    change_12h: 0.00,
    change_24h: 0.01,
    change_1d: 0.01,
    change_1w: 0.04,
    change_7d: 0.04,
    market_cap: 140000000000,
    volume_24h: 89012345678,
    circulating_supply: 140000000000,
    rarity: 'common'
  },
  {
    id: '4',
    rank: 4,
    name: 'XRP',
    symbol: 'XRP',
    image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
    price: 2.85,
    change_5m: 0.05,
    change_15m: 0.12,
    change_30m: 0.18,
    change_1h: 0.25,
    change_4h: -1.45,
    change_12h: -2.78,
    change_24h: -3.91,
    change_1d: -3.91,
    change_1w: -4.70,
    change_7d: -4.70,
    market_cap: 162000000000,
    volume_24h: 12345678901,
    circulating_supply: 56800000000,
    rarity: 'epic'
  },
  {
    id: '5',
    rank: 5,
    name: 'BNB',
    symbol: 'BNB',
    image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    price: 993.49,
    change_5m: 0.03,
    change_15m: 0.06,
    change_30m: 0.04,
    change_1h: 0.08,
    change_4h: -2.34,
    change_12h: -3.67,
    change_24h: -5.22,
    change_1d: -5.22,
    change_1w: -8.01,
    change_7d: -8.01,
    market_cap: 147000000000,
    volume_24h: 3456789012,
    circulating_supply: 148000000,
    rarity: 'epic'
  },
  {
    id: '6',
    rank: 6,
    name: 'Solana',
    symbol: 'SOL',
    image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    price: 220.83,
    change_5m: 0.15,
    change_15m: 0.28,
    change_30m: 0.22,
    change_1h: 0.33,
    change_4h: -3.12,
    change_12h: -4.89,
    change_24h: -6.57,
    change_1d: -6.57,
    change_1w: -5.76,
    change_7d: -5.76,
    market_cap: 105000000000,
    volume_24h: 5678901234,
    circulating_supply: 475000000,
    rarity: 'epic'
  },
  {
    id: '7',
    rank: 7,
    name: 'USDC',
    symbol: 'USDC',
    image: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    price: 0.9997,
    change_5m: 0.00,
    change_15m: -0.01,
    change_30m: 0.00,
    change_1h: -0.01,
    change_4h: -0.02,
    change_12h: -0.01,
    change_24h: -0.03,
    change_1d: -0.03,
    change_1w: -0.01,
    change_7d: -0.01,
    market_cap: 42000000000,
    volume_24h: 7890123456,
    circulating_supply: 42000000000,
    rarity: 'common'
  },
  {
    id: '8',
    rank: 8,
    name: 'Dogecoin',
    symbol: 'DOGE',
    image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
    price: 0.2418,
    change_5m: 0.25,
    change_15m: 0.45,
    change_30m: 0.52,
    change_1h: 0.68,
    change_4h: -3.45,
    change_12h: -5.67,
    change_24h: -7.33,
    change_1d: -7.33,
    change_1w: -9.85,
    change_7d: -9.85,
    market_cap: 35000000000,
    volume_24h: 2345678901,
    circulating_supply: 147000000000,
    rarity: 'rare'
  },
  {
    id: '9',
    rank: 9,
    name: 'TRON',
    symbol: 'TRX',
    image: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
    price: 0.3404,
    change_5m: 0.08,
    change_15m: 0.15,
    change_30m: 0.18,
    change_1h: 0.23,
    change_4h: -0.34,
    change_12h: -0.45,
    change_24h: -0.67,
    change_1d: -0.67,
    change_1w: -1.29,
    change_7d: -1.29,
    market_cap: 29000000000,
    volume_24h: 1234567890,
    circulating_supply: 86000000000,
    rarity: 'common'
  },
  {
    id: '10',
    rank: 10,
    name: 'Cardano',
    symbol: 'ADA',
    image: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
    price: 0.8263,
    change_5m: 0.05,
    change_15m: 0.08,
    change_30m: 0.10,
    change_1h: 0.12,
    change_4h: -2.45,
    change_12h: -4.12,
    change_24h: -6.60,
    change_1d: -6.60,
    change_1w: -4.27,
    change_7d: -4.27,
    market_cap: 29000000000,
    volume_24h: 987654321,
    circulating_supply: 35000000000,
    rarity: 'rare'
  }
];

// Real token images for better UX
const realTokenImages: Record<number, string> = {
  11: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  12: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  13: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  14: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
  15: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  16: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
  17: 'https://assets.coingecko.com/coins/images/14495/small/Internet_Computer_logo.png',
  18: 'https://assets.coingecko.com/coins/images/453/small/ethereum-classic-logo.png',
  19: 'https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png',
  20: 'https://assets.coingecko.com/coins/images/12817/small/filecoin.png',
  21: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png',
  22: 'https://assets.coingecko.com/coins/images/69/small/monero_logo.png',
  23: 'https://assets.coingecko.com/coins/images/3688/small/hbar.png',
  24: 'https://assets.coingecko.com/coins/images/7310/small/cypto.png',
  25: 'https://assets.coingecko.com/coins/images/10365/small/near_icon.png',
  26: 'https://assets.coingecko.com/coins/images/1167/small/VeChain-Logo-768x725.png',
  27: 'https://assets.coingecko.com/coins/images/4380/small/download.png',
  28: 'https://assets.coingecko.com/coins/images/13446/small/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.png',
  29: 'https://assets.coingecko.com/coins/images/24383/small/apecoin.jpg',
  30: 'https://assets.coingecko.com/coins/images/12129/small/sandbox_logo.jpg',
  31: 'https://assets.coingecko.com/coins/images/878/small/decentraland-mana.png',
  32: 'https://assets.coingecko.com/coins/images/13029/small/axie_infinity_logo.png',
  33: 'https://assets.coingecko.com/coins/images/8029/small/1_0YusgngOrriVg4lowBlw1A.png',
  34: 'https://assets.coingecko.com/coins/images/976/small/Tezos-logo.png',
  35: 'https://assets.coingecko.com/coins/images/12335/small/egld-token-logo.png',
  36: 'https://assets.coingecko.com/coins/images/4001/small/Fantom.png',
  37: 'https://assets.coingecko.com/coins/images/9672/small/klaytn.png',
  38: 'https://assets.coingecko.com/coins/images/4284/small/Helium_HNT.png',
  39: 'https://assets.coingecko.com/coins/images/486/small/circle-zcash-color.png',
  40: 'https://assets.coingecko.com/coins/images/19/small/dash-logo.png',
  41: 'https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png',
  42: 'https://assets.coingecko.com/coins/images/10775/small/COMP.png',
  43: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png',
  44: 'https://assets.coingecko.com/coins/images/12124/small/Curve.png',
  45: 'https://assets.coingecko.com/coins/images/12271/small/512x512_Logo_no_chop.png',
  46: 'https://assets.coingecko.com/coins/images/11849/small/yfi-192x192.png',
  47: 'https://assets.coingecko.com/coins/images/13469/small/1inch-token.png',
  48: 'https://assets.coingecko.com/coins/images/3406/small/SNX.png',
  49: 'https://assets.coingecko.com/coins/images/1102/small/enjin-coin-logo.png',
  50: 'https://assets.coingecko.com/coins/images/677/small/basic-attention-token.png'
};

// Continue with tokens 11-100
const generatedTokens = Array.from({ length: 90 }, (_, i) => {
    const rank = i + 11;
    const basePrice = Math.max(0.001, 1000 / Math.pow(rank, 1.5));
    // Use deterministic value based on rank instead of Math.random()
    const pseudoRandom = (Math.sin(rank * 12.9898) * 43758.5453) % 1;
    const baseChange = (pseudoRandom - 0.5) * 20;
    
    return {
      id: `${rank}`,
      rank,
      name: `Token ${rank}`,
      symbol: `TK${rank}`,
      image: realTokenImages[rank] || 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
      price: basePrice,
      change_5m: generateRandomChange(baseChange * 0.1, 2, rank * 1),
      change_15m: generateRandomChange(baseChange * 0.2, 3, rank * 2),
      change_30m: generateRandomChange(baseChange * 0.3, 4, rank * 3),
      change_1h: generateRandomChange(baseChange * 0.5, 5, rank * 4),
      change_4h: generateRandomChange(baseChange * 0.7, 6, rank * 5),
      change_12h: generateRandomChange(baseChange * 0.8, 7, rank * 6),
      change_24h: baseChange,
      change_1d: baseChange,
      change_1w: generateRandomChange(baseChange * 1.5, 10, rank * 7),
      change_7d: generateRandomChange(baseChange * 1.5, 10, rank * 8),
      market_cap: Math.max(1000000, 100000000000 / Math.pow(rank, 2)),
      volume_24h: Math.max(100000, 10000000000 / Math.pow(rank, 1.8)),
      circulating_supply: Math.max(1000000, 1000000000 * Math.abs(pseudoRandom)),
      rarity: rank <= 20 ? 'epic' : rank <= 50 ? 'rare' : 'common'
    } as TokenMarketData;
  });

// Combine base tokens with generated tokens
export const expandedTokenData: TokenMarketData[] = [
  ...baseTokens,
  ...generatedTokens
];

// Real token names for better UX (replacing generated names)
const realTokenNames = [
  { rank: 11, name: 'Avalanche', symbol: 'AVAX' },
  { rank: 12, name: 'Chainlink', symbol: 'LINK' },
  { rank: 13, name: 'Polygon', symbol: 'MATIC' },
  { rank: 14, name: 'Litecoin', symbol: 'LTC' },
  { rank: 15, name: 'Polkadot', symbol: 'DOT' },
  { rank: 16, name: 'Uniswap', symbol: 'UNI' },
  { rank: 17, name: 'Internet Computer', symbol: 'ICP' },
  { rank: 18, name: 'Ethereum Classic', symbol: 'ETC' },
  { rank: 19, name: 'Stellar', symbol: 'XLM' },
  { rank: 20, name: 'Filecoin', symbol: 'FIL' },
  { rank: 21, name: 'Cosmos', symbol: 'ATOM' },
  { rank: 22, name: 'Monero', symbol: 'XMR' },
  { rank: 23, name: 'Hedera', symbol: 'HBAR' },
  { rank: 24, name: 'Cronos', symbol: 'CRO' },
  { rank: 25, name: 'Near Protocol', symbol: 'NEAR' },
  { rank: 26, name: 'VeChain', symbol: 'VET' },
  { rank: 27, name: 'Algorand', symbol: 'ALGO' },
  { rank: 28, name: 'Flow', symbol: 'FLOW' },
  { rank: 29, name: 'ApeCoin', symbol: 'APE' },
  { rank: 30, name: 'Sandbox', symbol: 'SAND' },
  { rank: 31, name: 'Decentraland', symbol: 'MANA' },
  { rank: 32, name: 'Axie Infinity', symbol: 'AXS' },
  { rank: 33, name: 'Theta Network', symbol: 'THETA' },
  { rank: 34, name: 'Tezos', symbol: 'XTZ' },
  { rank: 35, name: 'Elrond', symbol: 'EGLD' },
  { rank: 36, name: 'Fantom', symbol: 'FTM' },
  { rank: 37, name: 'Klaytn', symbol: 'KLAY' },
  { rank: 38, name: 'Helium', symbol: 'HNT' },
  { rank: 39, name: 'Zcash', symbol: 'ZEC' },
  { rank: 40, name: 'Dash', symbol: 'DASH' },
  { rank: 41, name: 'Maker', symbol: 'MKR' },
  { rank: 42, name: 'Compound', symbol: 'COMP' },
  { rank: 43, name: 'Aave', symbol: 'AAVE' },
  { rank: 44, name: 'Curve DAO', symbol: 'CRV' },
  { rank: 45, name: 'SushiSwap', symbol: 'SUSHI' },
  { rank: 46, name: 'Yearn Finance', symbol: 'YFI' },
  { rank: 47, name: '1inch', symbol: '1INCH' },
  { rank: 48, name: 'Synthetix', symbol: 'SNX' },
  { rank: 49, name: 'Enjin Coin', symbol: 'ENJ' },
  { rank: 50, name: 'Basic Attention Token', symbol: 'BAT' },
  // Tokens 51-100 with real names
  { rank: 51, name: 'Render Token', symbol: 'RNDR' },
  { rank: 52, name: 'Immutable X', symbol: 'IMX' },
  { rank: 53, name: 'Gala', symbol: 'GALA' },
  { rank: 54, name: 'Chiliz', symbol: 'CHZ' },
  { rank: 55, name: 'Quant', symbol: 'QNT' },
  { rank: 56, name: 'The Graph', symbol: 'GRT' },
  { rank: 57, name: 'Mina', symbol: 'MINA' },
  { rank: 58, name: 'Lido DAO', symbol: 'LDO' },
  { rank: 59, name: 'Rocket Pool', symbol: 'RPL' },
  { rank: 60, name: 'Arbitrum', symbol: 'ARB' },
  { rank: 61, name: 'Optimism', symbol: 'OP' },
  { rank: 62, name: 'Injective', symbol: 'INJ' },
  { rank: 63, name: 'Sei', symbol: 'SEI' },
  { rank: 64, name: 'Celestia', symbol: 'TIA' },
  { rank: 65, name: 'Starknet', symbol: 'STRK' },
  { rank: 66, name: 'Pendle', symbol: 'PENDLE' },
  { rank: 67, name: 'Mantle', symbol: 'MNT' },
  { rank: 68, name: 'Blur', symbol: 'BLUR' },
  { rank: 69, name: 'Pepe', symbol: 'PEPE' },
  { rank: 70, name: 'Bonk', symbol: 'BONK' },
  { rank: 71, name: 'Floki', symbol: 'FLOKI' },
  { rank: 72, name: 'Shiba Inu', symbol: 'SHIB' },
  { rank: 73, name: 'Dogwifhat', symbol: 'WIF' },
  { rank: 74, name: 'Brett', symbol: 'BRETT' },
  { rank: 75, name: 'Popcat', symbol: 'POPCAT' },
  { rank: 76, name: 'Jupiter', symbol: 'JUP' },
  { rank: 77, name: 'Pyth Network', symbol: 'PYTH' },
  { rank: 78, name: 'Jito', symbol: 'JTO' },
  { rank: 79, name: 'Raydium', symbol: 'RAY' },
  { rank: 80, name: 'Orca', symbol: 'ORCA' },
  { rank: 81, name: 'Marinade', symbol: 'MNDE' },
  { rank: 82, name: 'Drift Protocol', symbol: 'DRIFT' },
  { rank: 83, name: 'Kamino', symbol: 'KMNO' },
  { rank: 84, name: 'Tensor', symbol: 'TNSR' },
  { rank: 85, name: 'Parcl', symbol: 'PRCL' },
  { rank: 86, name: 'Hivemapper', symbol: 'HONEY' },
  { rank: 87, name: 'Helium Mobile', symbol: 'MOBILE' },
  { rank: 88, name: 'Helium IOT', symbol: 'IOT' },
  { rank: 89, name: 'Grass', symbol: 'GRASS' },
  { rank: 90, name: 'Nosana', symbol: 'NOS' },
  { rank: 91, name: 'Solend', symbol: 'SLND' },
  { rank: 92, name: 'Mango Markets', symbol: 'MNGO' },
  { rank: 93, name: 'Step Finance', symbol: 'STEP' },
  { rank: 94, name: 'Star Atlas', symbol: 'ATLAS' },
  { rank: 95, name: 'Serum', symbol: 'SRM' },
  { rank: 96, name: 'Bonfida', symbol: 'FIDA' },
  { rank: 97, name: 'Audius', symbol: 'AUDIO' },
  { rank: 98, name: 'Maps.me', symbol: 'MAPS' },
  { rank: 99, name: 'Oxygen', symbol: 'OXY' },
  { rank: 100, name: 'Port Finance', symbol: 'PORT' }
];

// Update token names with real names
realTokenNames.forEach(({ rank, name, symbol }) => {
  const token = expandedTokenData.find(t => t.rank === rank);
  if (token) {
    token.name = name;
    token.symbol = symbol;
  }
});
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mapeamento de símbolos para IDs da CoinGecko
const SYMBOL_TO_ID_MAP = {
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
  'PUMP': 'pump-fun',
};

async function fixCompetitionTokenIds() {
  console.log('🔧 Corrigindo IDs dos tokens da competição ativa...\n');

  // Buscar competição ativa
  const competition = await prisma.competition.findFirst({
    where: { status: 'ACTIVE' },
    include: {
      competitionTokens: true
    },
    orderBy: { startDate: 'desc' }
  });

  if (!competition) {
    console.log('❌ Nenhuma competição ativa encontrada');
    await prisma.$disconnect();
    return;
  }

  console.log(`📊 Competição: ${competition.name}`);
  console.log(`📊 Total de tokens: ${competition.competitionTokens.length}\n`);

  let updatedCount = 0;
  let notFoundCount = 0;

  for (const token of competition.competitionTokens) {
    const symbol = token.symbol.toUpperCase();
    const coingeckoId = SYMBOL_TO_ID_MAP[symbol];

    if (!coingeckoId) {
      console.log(`⚠️  ${symbol}: Não encontrado no mapeamento`);
      notFoundCount++;
      continue;
    }

    // Atualizar tokenId para o ID correto da CoinGecko
    await prisma.competitionToken.update({
      where: { id: token.id },
      data: { tokenId: coingeckoId }
    });

    console.log(`✅ ${symbol}: ${token.tokenId} → ${coingeckoId}`);
    updatedCount++;
  }

  console.log(`\n📊 Resumo:`);
  console.log(`   ✅ Atualizados: ${updatedCount}`);
  console.log(`   ⚠️  Não encontrados: ${notFoundCount}`);

  await prisma.$disconnect();
}

fixCompetitionTokenIds();

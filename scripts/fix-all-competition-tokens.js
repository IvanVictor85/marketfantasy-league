const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mapa completo de símbolos para IDs do CoinGecko
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
  'USDG': 'usd-global',
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

async function fixAllCompetitionTokens() {
  console.log('🔧 Iniciando correção de TODOS os tokens da competição...\n');

  const competitionId = 'cmi1pvmrn0001q9qvbjejtuly';

  // Buscar todos os tokens da competição
  const tokens = await prisma.competitionToken.findMany({
    where: { competitionId },
    orderBy: { symbol: 'asc' }
  });

  console.log(`📊 Total de tokens encontrados: ${tokens.length}\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const token of tokens) {
    const correctId = SYMBOL_TO_ID_MAP[token.symbol];

    if (!correctId) {
      console.log(`⚠️  ${token.symbol} - Não encontrado no mapa de símbolos`);
      errorCount++;
      continue;
    }

    // Verificar se já está correto
    if (token.tokenId === correctId) {
      console.log(`✅ ${token.symbol} - Já está correto (${correctId})`);
      skippedCount++;
      continue;
    }

    // Atualizar o tokenId
    try {
      await prisma.competitionToken.update({
        where: { id: token.id },
        data: { tokenId: correctId }
      });

      console.log(`🔄 ${token.symbol} - Atualizado: ${token.tokenId} → ${correctId}`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ ${token.symbol} - Erro ao atualizar:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📋 Resumo da correção:');
  console.log(`✅ Tokens atualizados: ${updatedCount}`);
  console.log(`⏭️  Tokens já corretos: ${skippedCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`📊 Total processado: ${updatedCount + skippedCount + errorCount}`);

  await prisma.$disconnect();
}

fixAllCompetitionTokens();

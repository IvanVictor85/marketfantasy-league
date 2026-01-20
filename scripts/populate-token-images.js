const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mapeamento de símbolos para IDs do CoinGecko (mesmo do markets API)
const TOKEN_MAPPING = {
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

async function populateImages() {
  try {
    console.log('🔍 Buscando tokens sem imageUrl...');

    // Buscar todos os tokens sem imageUrl
    const tokensWithoutImage = await prisma.competitionToken.findMany({
      where: {
        OR: [
          { imageUrl: null },
          { imageUrl: '' }
        ]
      },
      select: {
        id: true,
        symbol: true,
        competitionId: true
      }
    });

    console.log(`📊 Encontrados ${tokensWithoutImage.length} tokens sem imageUrl`);

    if (tokensWithoutImage.length === 0) {
      console.log('✅ Todos os tokens já têm imageUrl!');
      return;
    }

    // Agrupar símbolos únicos
    const uniqueSymbols = [...new Set(tokensWithoutImage.map(t => t.symbol))];
    console.log(`🎯 Símbolos únicos: ${uniqueSymbols.join(', ')}`);

    // Buscar IDs do CoinGecko
    const coingeckoIds = uniqueSymbols
      .map(symbol => TOKEN_MAPPING[symbol])
      .filter(id => id);

    if (coingeckoIds.length === 0) {
      console.log('❌ Nenhum símbolo encontrado no mapeamento');
      return;
    }

    console.log(`🌐 Buscando dados de ${coingeckoIds.length} tokens do CoinGecko...`);

    // Buscar dados do CoinGecko
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coingeckoIds.join(',')}&per_page=250`,
      {
        headers: { 'Accept': 'application/json' }
      }
    );

    if (!response.ok) {
      console.error(`❌ Erro do CoinGecko: ${response.status}`);
      return;
    }

    const marketsData = await response.json();
    console.log(`✅ Recebidos dados de ${marketsData.length} tokens`);

    // Criar mapa de imageUrls por símbolo
    const imageMap = {};
    marketsData.forEach(coin => {
      // Encontrar o símbolo correspondente
      const symbol = Object.entries(TOKEN_MAPPING).find(([_, id]) => id === coin.id)?.[0];
      if (symbol && coin.image) {
        imageMap[symbol] = coin.image;
      }
    });

    console.log(`\n📸 ImageUrls encontradas:`);
    Object.entries(imageMap).forEach(([symbol, url]) => {
      console.log(`  ${symbol}: ${url}`);
    });

    // Atualizar tokens no banco de dados
    let updated = 0;
    for (const token of tokensWithoutImage) {
      const imageUrl = imageMap[token.symbol];
      if (imageUrl) {
        await prisma.competitionToken.update({
          where: { id: token.id },
          data: { imageUrl }
        });
        updated++;
      } else {
        console.log(`⚠️ ImageUrl não encontrada para ${token.symbol}`);
      }
    }

    console.log(`\n✅ ${updated} tokens atualizados com sucesso!`);

    // Verificar resultado
    const remainingWithoutImage = await prisma.competitionToken.count({
      where: {
        OR: [
          { imageUrl: null },
          { imageUrl: '' }
        ]
      }
    });

    console.log(`📊 Tokens ainda sem imageUrl: ${remainingWithoutImage}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateImages();

/**
 * 🔧 CORRIGE PREÇOS DO SNAPSHOT
 *
 * Busca preços atuais da CoinGecko e atualiza CompetitionTokens
 * com os preços iniciais (priceStart)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const competitionId = 'cmicalugq000210ou5ri809wa'; // Rodada 2

async function main() {
  console.log('\n🔧 CORRIGINDO PREÇOS DO SNAPSHOT\n');

  // Buscar todos os tokens da competição
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      competitionTokens: true,
      userTeams: true
    }
  });

  if (!competition) {
    console.log('❌ Competição não encontrada');
    return;
  }

  console.log(`📊 Competição: ${competition.status}`);
  console.log(`📊 Tokens: ${competition.competitionTokens.length}`);
  console.log(`📊 Times: ${competition.userTeams.length}\n`);

  // Coletar símbolos únicos dos times
  const allTokens = new Set();
  competition.userTeams.forEach(team => {
    if (Array.isArray(team.players)) {
      team.players.forEach(token => allTokens.add(token));
    }
  });

  console.log(`🔍 Tokens únicos nos times: ${allTokens.size}\n`);

  // Mapa de símbolos para IDs da CoinGecko
  const symbolToId = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'BNB': 'binancecoin',
    'MATIC': 'matic-network',
    'POL': 'polygon-ecosystem-token',
    'ATOM': 'cosmos',
    'ICP': 'internet-computer',
    'ADA': 'cardano',
    'UNI': 'uniswap',
    'SHIB': 'shiba-inu',
    'NEAR': 'near',
    'AAVE': 'aave',
    'DOT': 'polkadot',
    'LDO': 'lido-dao',
    'ALGO': 'algorand',
    'GRT': 'the-graph',
    'APT': 'aptos',
    'SNX': 'synthetix-network-token',
    'DOGE': 'dogecoin',
    'XRP': 'ripple',
    'AVAX': 'avalanche-2',
    'LINK': 'chainlink',
    'VET': 'vechain',
    'INJ': 'injective-protocol',
    'RUNE': 'thorchain',
    'OP': 'optimism',
    'ZEC': 'zcash',
    'ARB': 'arbitrum',
    'FTM': 'fantom',
    'MKR': 'maker'
  };

  // Converter símbolos para IDs
  const tokenIds = Array.from(allTokens).map(symbol =>
    symbolToId[symbol.toUpperCase()] || symbol.toLowerCase()
  );

  console.log('📡 Buscando preços da CoinGecko...\n');

  // Buscar preços via API CoinGecko
  const idsParam = tokenIds.join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`;

  const response = await fetch(url);
  const data = await response.json();

  // Criar mapa símbolo -> preço
  const priceMap = new Map();

  Object.entries(data).forEach(([id, prices]) => {
    const symbol = Object.keys(symbolToId).find(
      key => symbolToId[key] === id
    );
    if (symbol && prices.usd) {
      priceMap.set(symbol.toUpperCase(), prices.usd);
    }
  });

  console.log(`✅ Preços obtidos: ${priceMap.size}\n`);
  console.log('💰 ATUALIZANDO PREÇOS NO BANCO:\n');

  const now = new Date();
  let updated = 0;
  let failed = 0;

  // Atualizar cada CompetitionToken
  for (const symbol of allTokens) {
    const price = priceMap.get(symbol.toUpperCase());

    if (price !== undefined && price > 0) {
      // Atualizar CompetitionToken
      const result = await prisma.competitionToken.updateMany({
        where: {
          competitionId: competitionId,
          symbol: symbol
        },
        data: {
          priceStart: price,
          priceStartDate: now
        }
      });

      if (result.count > 0) {
        console.log(`   ✅ ${symbol.padEnd(6)} $${price.toFixed(2)}`);
        updated++;
      } else {
        console.log(`   ⚠️  ${symbol.padEnd(6)} não encontrado no CompetitionToken`);
        failed++;
      }
    } else {
      console.log(`   ❌ ${symbol.padEnd(6)} sem preço na CoinGecko`);
      failed++;
    }
  }

  console.log(`\n📊 RESULTADO:`);
  console.log(`   Atualizados: ${updated}`);
  console.log(`   Falhas: ${failed}\n`);

  console.log('✅ Correção concluída! Atualize a página do ranking.\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

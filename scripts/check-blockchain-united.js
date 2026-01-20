const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 VERIFICANDO TIME "Blockchain United"\n');

  // Buscar time por nome
  const team = await prisma.userTeam.findFirst({
    where: {
      teamName: { contains: 'Blockchain United' }
    },
    include: {
      user: { select: { username: true, email: true } },
      competition: {
        select: {
          id: true,
          name: true,
          status: true,
          competitionTokens: true
        }
      }
    }
  });

  if (!team) {
    console.log('❌ Time não encontrado');
    return;
  }

  console.log(`📊 Time: ${team.teamName}`);
  console.log(`📊 User: ${team.user.username || team.user.email}`);
  console.log(`📊 Competição: ${team.competition.name} (${team.competition.status})`);
  console.log(`📊 Total Points (banco): ${Number(team.totalPoints).toFixed(2)}%\n`);

  const tokens = Array.isArray(team.players) ? team.players : [];
  console.log(`📋 TOKENS DO TIME (${tokens.length}):\n`);

  // Mapear símbolos para IDs
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
    'DOGE': 'dogecoin',
    'XRP': 'ripple',
    'AVAX': 'avalanche-2',
    'LINK': 'chainlink',
    'VET': 'vechain',
    'INJ': 'injective-protocol',
    'RUNE': 'thorchain',
    'OP': 'optimism',
    'ARB': 'arbitrum',
    'FTM': 'fantom',
    'MKR': 'maker',
    'ZEC': 'zcash'
  };

  // Buscar preços atuais
  const tokenIds = tokens.map(symbol =>
    symbolToId[symbol.toUpperCase()] || symbol.toLowerCase()
  );

  const idsParam = tokenIds.join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`;

  console.log('📡 Buscando preços atuais...\n');

  const response = await fetch(url);
  const data = await response.json();

  const currentPrices = new Map();
  Object.entries(data).forEach(([id, prices]) => {
    const symbol = Object.keys(symbolToId).find(
      key => symbolToId[key] === id
    );
    if (symbol && prices.usd) {
      currentPrices.set(symbol.toUpperCase(), prices.usd);
    }
  });

  // Criar mapa de preços iniciais
  const startPrices = new Map();
  team.competition.competitionTokens.forEach(ct => {
    if (ct.priceStart) {
      startPrices.set(ct.symbol.toUpperCase(), Number(ct.priceStart));
    }
  });

  // Calcular pontuação
  let totalScore = 0;
  const details = [];

  for (const tokenSymbol of tokens) {
    const symbol = tokenSymbol.toUpperCase();
    const priceStart = startPrices.get(symbol) || 0;
    const priceCurrent = currentPrices.get(symbol) || 0;

    let percentChange = 0;
    if (priceStart > 0 && priceCurrent > 0) {
      percentChange = ((priceCurrent - priceStart) / priceStart) * 100;
    }

    totalScore += percentChange;

    details.push({
      symbol,
      priceStart,
      priceCurrent,
      percentChange
    });
  }

  // Ordenar por variação
  details.sort((a, b) => b.percentChange - a.percentChange);

  console.log('💰 DETALHAMENTO:\n');

  details.forEach(d => {
    const arrow = d.percentChange > 0 ? '↗️' : d.percentChange < 0 ? '↘️' : '→';
    const sign = d.percentChange > 0 ? '+' : '';
    const startPrice = d.priceStart > 0 ? `$${d.priceStart.toFixed(2)}` : 'SEM PREÇO';
    const currentPrice = d.priceCurrent > 0 ? `$${d.priceCurrent.toFixed(2)}` : 'N/A';

    console.log(`${arrow} ${d.symbol.padEnd(8)} ${startPrice.padEnd(12)} → ${currentPrice.padEnd(12)} (${sign}${d.percentChange.toFixed(2)}%)`);
  });

  console.log(`\n📊 PONTUAÇÃO TOTAL CALCULADA: ${totalScore.toFixed(2)}%`);
  console.log(`📊 PONTUAÇÃO TOTAL NO BANCO: ${Number(team.totalPoints).toFixed(2)}%\n`);

  console.log('✅ Verificação concluída!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

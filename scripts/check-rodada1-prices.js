/**
 * 🔍 VERIFICA PREÇOS DA RODADA 1
 *
 * Checa se CompetitionToken tem priceStart salvo para Rodada 1
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rodada1Id = 'cmicalugq000210ou5ri809wa';

async function main() {
  console.log('\n🔍 VERIFICANDO PREÇOS DA RODADA 1\n');

  // Buscar competição
  const competition = await prisma.competition.findUnique({
    where: { id: rodada1Id },
    include: {
      competitionTokens: {
        orderBy: { symbol: 'asc' }
      },
      userTeams: {
        take: 3,
        orderBy: { totalPoints: 'desc' },
        include: {
          user: { select: { username: true, email: true } }
        }
      }
    }
  });

  if (!competition) {
    console.log('❌ Rodada 1 não encontrada');
    return;
  }

  console.log(`📊 Competição: ${competition.name}`);
  console.log(`📊 Status: ${competition.status}`);
  console.log(`📊 Tokens: ${competition.competitionTokens.length}`);
  console.log(`📊 Times: ${competition.userTeams.length}\n`);

  // Verificar preços
  console.log('💰 PREÇOS INICIAIS (CompetitionToken):\n');

  let withPrice = 0;
  let withoutPrice = 0;

  competition.competitionTokens.forEach(ct => {
    const hasPrice = ct.priceStart && Number(ct.priceStart) > 0;
    const icon = hasPrice ? '✅' : '❌';
    const price = hasPrice ? `$${Number(ct.priceStart).toFixed(2)}` : 'SEM PREÇO';

    console.log(`   ${icon} ${ct.symbol.padEnd(8)} ${price}`);

    if (hasPrice) withPrice++;
    else withoutPrice++;
  });

  console.log(`\n📊 RESUMO:`);
  console.log(`   Com preço: ${withPrice}`);
  console.log(`   Sem preço: ${withoutPrice}\n`);

  // Verificar pontuações dos times
  console.log('🏆 TOP 3 TIMES (totalPoints no banco):\n');

  competition.userTeams.forEach((team, i) => {
    const points = Number(team.totalPoints) || 0;
    console.log(`   ${i + 1}. ${team.teamName || 'Time sem nome'}`);
    console.log(`      Pontos: ${points.toFixed(2)}%`);
    console.log(`      Jogador: ${team.user.username || team.user.email}`);
    console.log('');
  });

  // Calcular pontuação em tempo real (simulando frontend)
  console.log('📊 CALCULANDO PONTUAÇÃO EM TEMPO REAL:\n');

  // Buscar preços atuais da CoinGecko
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

  // Coletar símbolos únicos
  const allSymbols = new Set();
  competition.userTeams.forEach(team => {
    if (Array.isArray(team.players)) {
      team.players.forEach(symbol => allSymbols.add(symbol));
    }
  });

  const tokenIds = Array.from(allSymbols).map(symbol =>
    symbolToId[symbol.toUpperCase()] || symbol.toLowerCase()
  );

  const idsParam = tokenIds.join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`;

  console.log('📡 Buscando preços atuais da CoinGecko...\n');

  const response = await fetch(url);
  const data = await response.json();

  // Criar mapa de preços atuais
  const currentPrices = new Map();
  Object.entries(data).forEach(([id, prices]) => {
    const symbol = Object.keys(symbolToId).find(
      key => symbolToId[key] === id
    );
    if (symbol && prices.usd) {
      currentPrices.set(symbol.toUpperCase(), prices.usd);
    }
  });

  console.log(`✅ Preços atuais obtidos: ${currentPrices.size}\n`);

  // Criar mapa de preços iniciais
  const startPrices = new Map();
  competition.competitionTokens.forEach(ct => {
    if (ct.priceStart) {
      startPrices.set(ct.symbol.toUpperCase(), Number(ct.priceStart));
    }
  });

  // Calcular pontuação de cada time
  console.log('═'.repeat(80) + '\n');

  for (const team of competition.userTeams.slice(0, 3)) {
    const tokens = Array.isArray(team.players) ? team.players : [];

    console.log(`👤 ${team.teamName || 'Time sem nome'}`);
    console.log(`   Jogador: ${team.user.username || team.user.email}`);
    console.log(`   Tokens: ${tokens.length}\n`);

    let totalScore = 0;
    const tokenDetails = [];

    for (const tokenSymbol of tokens) {
      const symbol = tokenSymbol.toUpperCase();
      const priceStart = startPrices.get(symbol) || 0;
      const priceCurrent = currentPrices.get(symbol) || 0;

      let percentChange = 0;
      if (priceStart > 0 && priceCurrent > 0) {
        percentChange = ((priceCurrent - priceStart) / priceStart) * 100;
      }

      totalScore += percentChange;

      tokenDetails.push({
        symbol,
        priceStart,
        priceCurrent,
        percentChange
      });
    }

    // Ordenar por maior variação
    tokenDetails.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));

    // Mostrar top 5 tokens
    console.log('   📈 Top 5 variações:');
    tokenDetails.slice(0, 5).forEach(t => {
      const arrow = t.percentChange > 0 ? '↗️' : t.percentChange < 0 ? '↘️' : '→';
      const sign = t.percentChange > 0 ? '+' : '';
      console.log(`      ${arrow} ${t.symbol.padEnd(6)} $${t.priceStart.toFixed(2)} → $${t.priceCurrent.toFixed(2)} (${sign}${t.percentChange.toFixed(2)}%)`);
    });

    console.log(`\n   📊 PONTUAÇÃO CALCULADA: ${totalScore.toFixed(2)}%`);
    console.log(`   📊 PONTUAÇÃO NO BANCO: ${Number(team.totalPoints).toFixed(2)}%\n`);
    console.log('─'.repeat(80) + '\n');
  }

  console.log('✅ Verificação concluída!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

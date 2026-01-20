/**
 * 🏆 RANKING ATUAL DA RODADA 1
 *
 * Mostra ranking completo antes do snapshot final
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rodada1Id = 'cmicalugq000210ou5ri809wa';

// Mapa de símbolos para IDs CoinGecko
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
  'ZEC': 'zcash',
  'DASH': 'dash',
  'HYPE': 'hyperliquid',
  'SNX': 'synthetix-network-token'
};

async function main() {
  console.log('\n🏆 RANKING ATUAL DA RODADA 1\n');

  // Buscar competição com times e tokens
  const competition = await prisma.competition.findUnique({
    where: { id: rodada1Id },
    include: {
      userTeams: {
        include: {
          user: { select: { username: true, email: true } }
        }
      },
      competitionTokens: true
    }
  });

  if (!competition) {
    console.log('❌ Rodada 1 não encontrada');
    return;
  }

  console.log(`📊 Competição: ${competition.name}`);
  console.log(`📊 Status: ${competition.status}`);
  console.log(`📊 Início: ${competition.startDate}`);
  console.log(`📊 Fim: ${competition.endDate}`);
  console.log(`📊 Times: ${competition.userTeams.length}\n`);

  // Coletar símbolos únicos
  const allSymbols = new Set();
  competition.userTeams.forEach(team => {
    if (Array.isArray(team.players)) {
      team.players.forEach(symbol => allSymbols.add(symbol.toUpperCase()));
    }
  });

  // Buscar preços atuais da CoinGecko
  const tokenIds = Array.from(allSymbols).map(symbol =>
    symbolToId[symbol] || symbol.toLowerCase()
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

  // Criar mapa de preços iniciais
  const startPrices = new Map();
  competition.competitionTokens.forEach(ct => {
    if (ct.priceStart) {
      startPrices.set(ct.symbol.toUpperCase(), Number(ct.priceStart));
    }
  });

  // Calcular pontuação de cada time
  const rankings = [];

  for (const team of competition.userTeams) {
    const tokens = Array.isArray(team.players) ? team.players : [];
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

    rankings.push({
      teamName: team.teamName || 'Time sem nome',
      username: team.user.username || team.user.email,
      userId: team.userId,
      totalScore,
      tokens: tokenDetails
    });
  }

  // Ordenar por pontuação
  rankings.sort((a, b) => b.totalScore - a.totalScore);

  // Mostrar ranking
  console.log('═'.repeat(100));
  console.log('🏆 RANKING COMPLETO (ORDEM DE PONTUAÇÃO)\n');

  rankings.forEach((team, index) => {
    const position = index + 1;
    const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '  ';

    console.log(`${medal} ${position}º LUGAR - ${team.totalScore.toFixed(2)} pts`);
    console.log(`   📛 Time: ${team.teamName}`);
    console.log(`   👤 Jogador: ${team.username}`);
    console.log(`   🎯 Pontuação: ${team.totalScore.toFixed(4)} pts\n`);
  });

  console.log('═'.repeat(100));

  // Mostrar top 3 com detalhes
  console.log('\n🔍 DETALHAMENTO DO TOP 3:\n');

  for (let i = 0; i < Math.min(3, rankings.length); i++) {
    const team = rankings[i];
    const position = i + 1;
    const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉';

    console.log(`${medal} ${position}º LUGAR: ${team.teamName} (${team.username})`);
    console.log(`   Pontuação Total: ${team.totalScore.toFixed(4)} pts\n`);

    // Ordenar tokens por variação
    const sortedTokens = [...team.tokens].sort((a, b) => b.percentChange - a.percentChange);

    console.log('   📊 Tokens (ordenados por performance):');
    sortedTokens.forEach(t => {
      const arrow = t.percentChange > 0 ? '↗️' : t.percentChange < 0 ? '↘️' : '→';
      const sign = t.percentChange > 0 ? '+' : '';
      const startPrice = t.priceStart > 0 ? `$${t.priceStart.toFixed(2)}` : 'N/A';
      const currentPrice = t.priceCurrent > 0 ? `$${t.priceCurrent.toFixed(2)}` : 'N/A';

      console.log(`      ${arrow} ${t.symbol.padEnd(6)} ${startPrice.padEnd(12)} → ${currentPrice.padEnd(12)} (${sign}${t.percentChange.toFixed(2)}%)`);
    });

    console.log('\n' + '─'.repeat(100) + '\n');
  }

  // Resumo estatístico
  const scores = rankings.map(r => r.totalScore);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);

  console.log('📊 ESTATÍSTICAS GERAIS:\n');
  console.log(`   🏆 Maior pontuação: ${maxScore.toFixed(2)} pts (${rankings[0].teamName})`);
  console.log(`   📉 Menor pontuação: ${minScore.toFixed(2)} pts (${rankings[rankings.length - 1].teamName})`);
  console.log(`   📊 Pontuação média: ${avgScore.toFixed(2)} pts`);
  console.log(`   📈 Amplitude: ${(maxScore - minScore).toFixed(2)} pts\n`);

  // Informações do snapshot
  const sampleToken = competition.competitionTokens.find(ct => ct.priceStartDate);
  if (sampleToken) {
    const snapshotDate = new Date(sampleToken.priceStartDate);
    const now = new Date();
    const elapsed = now - snapshotDate;
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));

    console.log('⏱️  TEMPO DE COMPETIÇÃO:\n');
    console.log(`   Snapshot inicial: ${sampleToken.priceStartDate}`);
    console.log(`   Tempo decorrido: ${hours}h ${minutes}min\n`);
  }

  console.log('✅ Ranking calculado!\n');
  console.log('💡 PRÓXIMO PASSO: Execute o snapshot final para salvar estas pontuações\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

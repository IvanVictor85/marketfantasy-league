/**
 * 🐛 DEBUG: Verifica cálculo de pontuação
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const competitionId = 'cmicalugq000210ou5ri809wa'; // Rodada 2

async function main() {
  console.log('\n🐛 DEBUG: VERIFICANDO CÁLCULO DE PONTUAÇÃO\n');

  // Buscar competição com tokens e times
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      competitionTokens: true,
      userTeams: {
        take: 3, // Pegar apenas 3 times para exemplo
        include: {
          user: {
            select: { username: true, email: true }
          }
        }
      }
    }
  });

  if (!competition) {
    console.log('❌ Competição não encontrada');
    return;
  }

  console.log(`📊 Competição: ${competition.id}`);
  console.log(`📊 Status: ${competition.status}\n`);

  // Mapear preços iniciais
  const priceStartMap = new Map();
  competition.competitionTokens.forEach(ct => {
    if (ct.priceStart) {
      priceStartMap.set(ct.symbol.toUpperCase(), Number(ct.priceStart));
    }
  });

  console.log(`💰 PREÇOS INICIAIS (${priceStartMap.size} tokens):\n`);

  // Mostrar alguns exemplos
  let count = 0;
  for (const [symbol, price] of priceStartMap) {
    if (count < 5) {
      console.log(`   ${symbol.padEnd(6)} $${price.toFixed(2)}`);
      count++;
    }
  }
  console.log(`   ... (e mais ${priceStartMap.size - 5} tokens)\n`);

  // Buscar preços ATUAIS da CoinGecko
  console.log('📡 Buscando preços atuais da CoinGecko...\n');

  // Símbolos dos tokens
  const allTokens = new Set();
  competition.userTeams.forEach(team => {
    if (Array.isArray(team.players)) {
      team.players.forEach(t => allTokens.add(t));
    }
  });

  // Mapa de símbolos para IDs
  const symbolToId = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'BNB': 'binancecoin',
    'DOGE': 'dogecoin',
    'XRP': 'ripple',
    'AVAX': 'avalanche-2',
    'LINK': 'chainlink',
    'ALGO': 'algorand',
    'ZEC': 'zcash',
    'FTM': 'fantom',
    'NEAR': 'near',
    'GRT': 'the-graph',
    'SHIB': 'shiba-inu',
    'ADA': 'cardano',
    'VET': 'vechain',
    'LDO': 'lido-dao',
    'DOT': 'polkadot',
    'APT': 'aptos',
    'INJ': 'injective-protocol',
    'RUNE': 'thorchain',
    'UNI': 'uniswap',
    'ATOM': 'cosmos',
    'AAVE': 'aave',
    'OP': 'optimism',
    'ARB': 'arbitrum',
    'ICP': 'internet-computer',
    'MKR': 'maker'
  };

  const tokenIds = Array.from(allTokens).map(symbol =>
    symbolToId[symbol.toUpperCase()] || symbol.toLowerCase()
  );

  const idsParam = tokenIds.join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`;

  const response = await fetch(url);
  const data = await response.json();

  const priceCurrentMap = new Map();
  Object.entries(data).forEach(([id, prices]) => {
    const symbol = Object.keys(symbolToId).find(
      key => symbolToId[key] === id
    );
    if (symbol && prices.usd) {
      priceCurrentMap.set(symbol.toUpperCase(), prices.usd);
    }
  });

  console.log(`💰 PREÇOS ATUAIS (${priceCurrentMap.size} tokens):\n`);

  // Analisar cada time
  console.log('🎯 ANÁLISE DE TIMES:\n');
  console.log('═'.repeat(80) + '\n');

  for (const team of competition.userTeams) {
    const tokens = Array.isArray(team.players) ? team.players : [];

    console.log(`👤 ${team.teamName || 'Time sem nome'}`);
    console.log(`   Jogador: ${team.user.username || team.user.email}`);
    console.log(`   Tokens: ${tokens.length}\n`);

    let totalScore = 0;
    const tokenDetails = [];

    for (const tokenSymbol of tokens) {
      const symbol = tokenSymbol.toUpperCase();
      const priceStart = priceStartMap.get(symbol) || 0;
      const priceCurrent = priceCurrentMap.get(symbol) || 0;

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
      console.log(`      ${arrow} ${t.symbol.padEnd(6)} $${t.priceStart.toFixed(2)} → $${t.priceCurrent.toFixed(2)} (${t.percentChange > 0 ? '+' : ''}${t.percentChange.toFixed(2)}%)`);
    });

    console.log(`\n   📊 PONTUAÇÃO TOTAL: ${totalScore.toFixed(2)}%`);
    console.log(`   📊 PONTUAÇÃO MÉDIA POR TOKEN: ${(totalScore / tokens.length).toFixed(2)}%\n`);
    console.log('─'.repeat(80) + '\n');
  }

  console.log('✅ Debug concluído!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

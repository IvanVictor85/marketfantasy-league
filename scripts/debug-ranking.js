const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugRanking() {
  console.log('🔍 DEBUGANDO RANKING\n');
  console.log('='.repeat(80));

  try {
    // 1️⃣ Verificar competição ACTIVE
    console.log('\n1️⃣ Verificando competição ACTIVE...');
    const activeCompetition = await prisma.competition.findFirst({
      where: { status: 'ACTIVE' }
    });

    if (!activeCompetition) {
      console.log('❌ Nenhuma competição ACTIVE encontrada!');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Competição ACTIVE: ${activeCompetition.name || activeCompetition.id}`);
    console.log(`   ID: ${activeCompetition.id}`);
    console.log(`   Status: ${activeCompetition.status}`);
    console.log(`   Início: ${activeCompetition.startDate}`);
    console.log(`   Fim: ${activeCompetition.endDate}`);

    // 2️⃣ Verificar CompetitionTokens com priceStart
    console.log('\n2️⃣ Verificando CompetitionTokens...');
    const competitionTokens = await prisma.competitionToken.findMany({
      where: { competitionId: activeCompetition.id },
      select: {
        symbol: true,
        tokenId: true,
        priceStart: true,
        priceStartDate: true
      }
    });

    console.log(`   Total de tokens: ${competitionTokens.length}`);

    const tokensWithPriceStart = competitionTokens.filter(t => t.priceStart);
    console.log(`   Tokens com priceStart: ${tokensWithPriceStart.length}`);

    if (tokensWithPriceStart.length > 0) {
      console.log('\n   📊 Primeiros 5 tokens:');
      tokensWithPriceStart.slice(0, 5).forEach(t => {
        console.log(`      ${t.symbol}: $${parseFloat(t.priceStart.toString()).toFixed(2)} (${t.priceStartDate})`);
      });
    }

    // 3️⃣ Verificar UserTeams
    console.log('\n3️⃣ Verificando UserTeams...');
    const userTeams = await prisma.userTeam.findMany({
      where: { competitionId: activeCompetition.id },
      select: {
        id: true,
        teamName: true,
        players: true,
        totalPoints: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`   Total de times: ${userTeams.length}`);

    if (userTeams.length > 0) {
      console.log('\n   🏆 Times registrados:');
      userTeams.forEach((team, index) => {
        const tokens = Array.isArray(team.players) ? team.players : [];
        console.log(`      ${index + 1}. ${team.teamName} (${team.user.name || team.user.email})`);
        console.log(`         Tokens: ${tokens.join(', ')}`);
        console.log(`         Total Points (DB): ${team.totalPoints}`);
      });
    }

    // 4️⃣ Testar fetch do CoinGecko
    console.log('\n4️⃣ Testando busca de preços no CoinGecko...');

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
      'ASTER': 'aster-2'
    };

    // Coletar todos os símbolos dos times
    const allTokenSymbols = new Set();
    userTeams.forEach(team => {
      const tokens = Array.isArray(team.players) ? team.players : [];
      tokens.forEach(symbol => allTokenSymbols.add(symbol.toUpperCase()));
    });

    const tokenIds = Array.from(allTokenSymbols)
      .map(symbol => TOKEN_MAPPING[symbol])
      .filter(Boolean);

    console.log(`   Símbolos únicos: ${Array.from(allTokenSymbols).join(', ')}`);
    console.log(`   IDs CoinGecko: ${tokenIds.join(', ')}`);

    if (tokenIds.length > 0) {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd`
      );

      if (response.ok) {
        const currentPrices = await response.json();
        console.log(`   ✅ Preços atuais obtidos com sucesso`);
        console.log(`   📊 Primeiros 5 preços:`, JSON.stringify(Object.entries(currentPrices).slice(0, 5), null, 2));
      } else {
        console.error(`   ❌ Erro ao buscar preços: ${response.statusText}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ DEBUG CONCLUÍDO');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ ERRO:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRanking();
